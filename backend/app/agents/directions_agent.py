import httpx
import re
from app.config import settings
from app.graph.state import State

ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

TRAVEL_MODES = [
    ("DRIVE", "driving"),
    ("TRANSIT", "transit"),
]

def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def get_directions(origin: str, destination: str) -> list[dict]:
    """
    Fetch driving and CTA transit directions using the Google Routes API.
    """
    results = []
    
    with httpx.Client() as client:
        for mode_enum, mode_label in TRAVEL_MODES:
            body = {
                "origin": {
                    "address": origin
                },
                "destination": {
                    "address": destination
                },
                "travelMode": mode_enum,
                "computeAlternativeRoutes": False,
                "routeModifiers": {
                    "avoidTolls": False,
                    "avoidHighways": False,
                },
                "languageCode": "en-US",
                "units": "IMPERIAL",
            }
            
            if mode_enum == "TRANSIT":
                body["transitPreferences"] = {
                    "routingPreference": "LESS_WALKING",
                    "allowedTravelModes": ["BUS", "SUBWAY", "RAIL"]
                }
                
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.google_maps_api_key,
                # Field mask — only request what we need, reduces response size
                # and is required by the Routes API
                "X-Goog-FieldMask": (
                    "routes.duration,"
                    "routes.distanceMeters,"
                    "routes.legs,"
                    "routes.description"
                ),
            }
            
            try:
                response = client.post(ROUTES_URL, json=body, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                routes = data.get("routes", [])
                if not routes:
                    results.append({
                        "mode": mode_label,
                        "available": False,
                        "error": "No routes returned"
                    })
                    continue
                
                route = routes[0]
                leg = route["legs"][0]
                steps = _parse_steps(leg.get("steps", []), mode_label)
                
                duration_seconds = int(
                    route.get("duration", "0s").replace("s", "")
                )
                distance_meters = route.get("distanceMeters", 0)
                distance_miles = round(distance_meters / 1609.34, 1)
                
                results.append({
                    "mode": mode_label,
                    "available": True,
                    "duration": _seconds_to_text(duration_seconds),
                    "duration_seconds": duration_seconds,
                    "distance": f"{distance_miles} mi",
                    "summary": route.get("description", ""),
                    "steps": steps,
                })
                
            except httpx.HTTPError as e:
                results.append({
                    "mode": mode_label,
                    "available": False,
                    "error": str(e)
                })
                
    return results


def _parse_steps(steps: list, mode: str) -> list[dict]:
    parsed = []
    for step in steps:
        if mode == 'transit':
            transit = step.get('transitDetails', {})
            if transit:
                stop_details = transit.get('stopDetails', {})
                line = transit.get('transitLine', {})
                vehicle = line.get('vehicle', {}).get('type', '')  # SUBWAY, BUS, RAIL
                line_name = line.get('nameShort') or line.get('name', '')
                departure = stop_details.get('departureStop', {}).get('name', '')
                arrival = stop_details.get('arrivalStop', {}).get('name', '')
                num_stops = transit.get('stopCount')

                # Build a human readable instruction
                vehicle_label = {
                    'SUBWAY': 'Take the',
                    'BUS': 'Take the',
                    'RAIL': 'Take the',
                    'TRAM': 'Take the',
                }.get(vehicle, 'Take the')

                instruction = f"{vehicle_label} {line_name} from {departure} → {arrival}"
                if num_stops:
                    instruction += f" ({num_stops} stop{'s' if num_stops > 1 else ''})"

                parsed.append({
                    'instruction': instruction,
                    'line': line_name,
                    'vehicle': vehicle,
                    'departure_stop': departure,
                    'arrival_stop': arrival,
                    'num_stops': num_stops,
                    'duration': _seconds_to_text(
                        int(step.get('staticDuration', '0s').replace('s', ''))
                    ),
                    'distance': None,  # not meaningful for transit
                })
            else:
                # Walking segment between transit legs
                nav = step.get('navigationInstruction', {})
                import re
                instruction = re.sub(r'<[^>]+>', '', nav.get('instructions', ''))
                parsed.append({
                    'instruction': f"{instruction}",
                    'line': None,
                    'vehicle': 'WALK',
                    'departure_stop': None,
                    'arrival_stop': None,
                    'num_stops': None,
                    'duration': _seconds_to_text(
                        int(step.get('staticDuration', '0s').replace('s', ''))
                    ),
                    'distance': f"{round(step.get('distanceMeters', 0) / 1609.34, 2)} mi",
                })
        else:
            # Driving — keep turn-by-turn as before
            nav = step.get('navigationInstruction', {})
            import re
            instruction = re.sub(r'<[^>]+>', '', nav.get('instructions', ''))
            parsed.append({
                'instruction': instruction,
                'line': None,
                'vehicle': None,
                'departure_stop': None,
                'arrival_stop': None,
                'num_stops': None,
                'duration': _seconds_to_text(
                    int(step.get('staticDuration', '0s').replace('s', ''))
                ),
                'distance': f"{round(step.get('distanceMeters', 0) / 1609.34, 2)} mi",
            })

    return parsed

def _seconds_to_text(seconds: int) -> str:
    """Convert seconds to a human readable string e.g. '1 hr 23 mins'."""
    if seconds < 60:
        return f"{seconds} seconds"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} mins"
    hours = minutes // 60
    remaining_minutes = minutes % 60
    return f"{hours} hr {remaining_minutes} mins" if remaining_minutes else f"{hours} hr"

def directions_node(state: State) -> State:
    concerts = state.get("concerts", [])
    
    if not concerts:
        return {
            **state,
            "directions": [],
            "errors": state.get("errors", []) + ["No concerts found, skipping directions."]
        }
    
    # Use selected venue from picker if available, else fall back to first concert
    selected_lat = state.get("selected_venue_lat")
    selected_lng = state.get("selected_venue_lng")
    selected_name = state.get("selected_venue_name")
    selected_address = state.get("selected_venue_address")

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

    venue_name = top_concert.get("venue_name", "")
    venue_address = top_concert.get("venue_address", "")
    current_city = state.get("city", "Chicago")
    destination = f"{venue_name}, {venue_address}, {current_city}" 
      
    directions = get_directions(state["origin"], destination)
    
    return {
        **state,
        "directions": directions,
        "directions_for": {
            "concert": top_concert.get("event_name"),
            "venue": venue_name,
            "destination_query": destination,
        }
    }
