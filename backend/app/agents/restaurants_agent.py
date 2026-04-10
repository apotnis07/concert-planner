import httpx
from app.config import settings
from app.graph.state import State

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"


def geocode_address(address: str) -> dict | None:
    """
    Convert a venue address string to lat/lng coordinates.
    Returns {"lat": float, "lng": float} or None if geocoding fails.
    """
    with httpx.Client() as client:
        try:
            response = client.get(
                GEOCODING_URL,
                params={
                    "address": address,
                    "key": settings.google_maps_api_key,
                }
            )
            response.raise_for_status()
            data = response.json()

            if data["status"] != "OK" or not data["results"]:
                return None

            location = data["results"][0]["geometry"]["location"]
            return {"lat": location["lat"], "lng": location["lng"]}
        
        except httpx.HTTPError:
            return None
        

def get_nearby_restaurants(lat: float, lng: float, radius_meters: int = 800, cuisine_preference: str = "Any") -> list[dict]:
    """
    Search for highly rated restaurants near a lat/lng using Places API (New).
    radius_meters=800 is roughly a 10 minute walk from the venue.
    """

    cuisine_type_map = {
        "Italian": ["italian_restaurant"],
        "Mexican": ["mexican_restaurant"],
        "Japanese": ["japanese_restaurant"],
        "Korean": ["korean_restaurant"],
        "Mediterranean": ["mediterranean_restaurant"],
        "American": ["american_restaurant"],
        "Seafood": ["seafood_restaurant"],
        "Vegetarian": ["vegetarian_restaurant"],
    }

    if cuisine_preference and cuisine_preference != "Any":
        cuisine = [c.strip() for c in cuisine_preference.split(',')]
        included_types = []
        for c in cuisine:
            included_types.extend(cuisine_type_map.get(c, ["restaurant"]))
        if not included_types:
            included_types = ["restaurant"]
    else:
        included_types = [
            "restaurant", "meal_delivery", "meal_takeaway",
            "barbecue_restaurant", "american_restaurant",
            "chinese_restaurant", "italian_restaurant",
            "japanese_restaurant", "korean_restaurant",
            "mexican_restaurant", "seafood_restaurant",
            "steak_house",
        ]


    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_maps_api_key,
        # Only request the fields we need — required by Places API (New)
        "X-Goog-FieldMask": (
            "places.displayName,"
            "places.formattedAddress,"
            "places.rating,"
            "places.userRatingCount,"
            "places.priceLevel,"
            "places.currentOpeningHours,"
            "places.websiteUri,"
            "places.googleMapsUri,"
            "places.primaryTypeDisplayName"
        ),
    }

    body = {
        "includedTypes": included_types,
        "excludedTypes": ["event_venue", "stadium", "night_club", "casino", "liquor_store"],
        "maxResultCount": 5,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lng,
                },
                "radius": radius_meters,
            }
        },
        "rankPreference": "POPULARITY",
    }

    with httpx.Client() as client:
        try: 
            response = client.post(PLACES_NEARBY_URL, json=body, headers=headers)
            response.raise_for_status()
            data = response.json()

            places = data.get("places", [])
            parsed_places = [_parse_place(p) for p in places]
            return sorted(
            parsed_places, 
            key=lambda x: (x.get("open_now") or False, x.get("rating") or 0), 
            reverse=True)
        
        except httpx.HTTPError as e:
            print(f"Places API error: {e}")
            print(f"Response body: {response.text}")  
            return []
        

def _parse_place(place: dict) -> dict:
    """Extract clean fields from a Places API (New) response object."""
    price_map = {
        "PRICE_LEVEL_FREE": "Free",
        "PRICE_LEVEL_INEXPENSIVE": "$",
        "PRICE_LEVEL_MODERATE": "$$",
        "PRICE_LEVEL_EXPENSIVE": "$$$",
        "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
    }

    price_level = place.get("priceLevel", "")
    opening_hours = place.get("currentOpeningHours", {})

    return {
        "name": place.get("displayName", {}).get("text", ""),
        "address": place.get("formattedAddress", ""),
        "rating": place.get("rating"),
        "review_count": place.get("userRatingCount"),
        "price": price_map.get(price_level, "Unknown"),
        "type": place.get("primaryTypeDisplayName", {}).get("text", ""),
        "open_now": opening_hours.get("openNow"),
        "website": place.get("websiteUri"),
        "google_maps_url": place.get("googleMapsUri"),
    }


def _matches_budget(price: str, budget: str) -> bool:
    """Return True if restaurant price level is within user's budget."""
    budget_map = {
        "$":    ["$", "Unknown"],
        "$$":   ["$", "$$", "Unknown"],
        "$$$":  ["$", "$$", "$$$", "Unknown"],
        "$$$$": ["$", "$$", "$$$", "$$$$", "Unknown"],
    }
    allowed = budget_map.get(budget, ["$", "$$", "$$$", "$$$$", "Unknown"])
    return price in allowed

def restaurants_node(state: State) -> State:
    """
    LangGraph node — geocodes the concert venue and finds nearby restaurants.
    """
    concerts = state.get("concerts", [])

    if not concerts:
        return {
            **state,
            "venue_location": {},
            "restaurants": [],
            "errors": state.get("errors", []) + ["No concerts found, skipping restaurants."]
        }
    
    # Use selected venue from picker if available, else fall back to first concert
    selected_lat = state.get("selected_venue_lat")
    selected_lng = state.get("selected_venue_lng")
    selected_name = state.get("selected_venue_name")
    selected_address = state.get("selected_venue_address")

    cuisine_preference = state.get("cuisine_preference", "Any")
    budget = state.get("budget", "$$$$")

    if selected_lat and selected_lng:
        top_concert = {
            "venue_name": selected_name,
            "venue_address": selected_address,
            "venue_lat": selected_lat,
            "venue_lng": selected_lng,
            "event_name": selected_name,
        }
    else:
        top_concert = concerts[0] if concerts else None


    venue_lat = top_concert.get("venue_lat")
    venue_lng = top_concert.get("venue_lng")

    if venue_lat and venue_lng:
        location = {"lat":  venue_lat, "lng": venue_lng}
    else:
        # Fallback — geocode from address
        venue_name = top_concert.get("venue_name", "")
        venue_address = top_concert.get("venue_address", "")
        full_address = f"{venue_name}, {venue_address}, Chicago, IL"
        location = geocode_address(full_address)

    if not location:
        return {
            **state,
            "venue_location": {},
            "restaurants": [],
            "errors": state.get("errors", []) + ["Could not resolve venue coordinates."]
        }        
    
    restaurants = get_nearby_restaurants(location["lat"], location["lng"], cuisine_preference=cuisine_preference)


    filtered = [
        r for r in restaurants
        if r["rating"] is not None
        and r["rating"] >= 4.0
        and _matches_budget(r["price"], budget)
    ]

    filtered = sorted(filtered, key=lambda x: x["rating"], reverse=True)

    return {
        **state,
        "venue_location": location,
        "restaurants": restaurants,
    }