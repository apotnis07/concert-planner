import httpx, json

from app.config import settings
from app.graph.state import State

TICKETICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"
TICKETMASTER_EVENT_URL = "https://app.ticketmaster.com/discovery/v2/events/{event_id}.json"


def fetch_event_price(client: httpx.Client, event_id: str) -> tuple[float | None, float | None]:
    """
    Attempt to get price data from the single-event endpoint.
    Returns (min_price, max_price) or (None, None) if unavailable.
    """
    try:
        url = TICKETMASTER_EVENT_URL.format(event_id=event_id)
        response = client.get(url, params={"apikey": settings.ticketmaster_api_key})
        response.raise_for_status()
        data = response.json()
        price_ranges = data.get("priceRanges", [])
        if price_ranges:
            return price_ranges[0].get("min"), price_ranges[0].get("max")
    except Exception:
        pass
    return None, None


def get_concerts_for_artists(artist_names: list[str], city: str) -> list[dict]:
    """
    Query Ticketmaster for upcoming concerts in the given city
    for any of the provided artists.
    """
    concerts = []

    with httpx.Client() as client:
        for artist in artist_names:
            params = {
                "apikey": settings.ticketmaster_api_key,
                "keyword": artist,
                "city": city,
                "classificationName": "music",
                "size": 3,
                "sort": "date,asc" 
            }

            try:
                response = client.get(TICKETICKETMASTER_BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                
                # with open(f"debug_{artist}.json", "w") as f:
                #     json.dump(data, f, indent=2)

                events = data.get("_embedded", {}).get("events", [])
                for event in events:
                    venue = event.get("_embedded", {}).get("venues", [{}])[0]
                    price_ranges = event.get("priceRanges", [{}])[0]

                    venue_lat = venue.get("location", {}).get("latitude")
                    venue_lng = venue.get("location", {}).get("longitude")

                     # Try search result prices first
                    if price_ranges:
                        min_price = price_ranges[0].get("min")
                        max_price = price_ranges[0].get("max")
                    else:
                        # Fall back to fetching the individual event
                        min_price, max_price = fetch_event_price(client, event["id"])


                    concerts.append({
                        "artist": artist,
                        "event_name": event.get("name"),
                        "date": event.get("dates", {}).get("start", {}).get("localDate"),
                        "time": event.get("dates", {}).get("start", {}).get("localTime"),
                        "venue_name": venue.get("name"),
                        "venue_address": venue.get("address", {}).get("line1"),
                        "venue_lat": float(venue_lat) if venue_lat else None,
                        "venue_lng": float(venue_lng) if venue_lng else None,
                        "min_price": min_price,
                        "max_price": max_price,
                        "price_available": min_price is not None,  
                        "url": event.get("url"),
                    })

            except httpx.HTTPError as e:
                error_detail = e.response.json() if e.response else "No response body"
                print(f"Ticketmaster error for {artist}: {error_detail}")
                continue
            
    return concerts
        

def concerts_node(state: State) -> State:
    """LangGraph node — reads artists from state, writes concerts to state."""
    artist_names = [a["name"] for a in state.get("followed_artists", [])]

    if not artist_names:
        return {**state, "concerts": [], "errors": state.get("errors", []) + ["No artists found, skipping concerts lookup."]}
    
    concerts = get_concerts_for_artists(artist_names, state["city"])
    
    return {**state, "concerts": concerts}

    

