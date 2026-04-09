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
        

def get_nearby_restaurants(lat: float, lng: float, radius_meters: int = 800) -> list[dict]:
    """
    Search for highly rated restaurants near a lat/lng using Places API (New).
    radius_meters=800 is roughly a 10 minute walk from the venue.
    """
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
        "includedTypes": ["restaurant", "bar"],
        "excludedTypes": ["event_venue", "stadium", "night_club", "casino"],
        "maxResultCount": 10,
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
            return [_parse_place(p) for p in places]
        
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
    
    top_concert = concerts[0]

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
    
    restaurants = get_nearby_restaurants(location["lat"], location["lng"])

    return {
        **state,
        "venue_location": location,
        "restaurants": restaurants,
    }