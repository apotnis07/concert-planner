import json
import anthropic
from app.config import settings
from app.graph.state import State

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


# Chicago averages used as fallbacks when real data is unavailable
FALLBACK_TICKET_MIN = 45
FALLBACK_TICKET_MAX = 120
FALLBACK_TRANSPORT_DRIVING = 15    # parking estimate
FALLBACK_TRANSPORT_TRANSIT = 5     # CTA fare
FALLBACK_DINNER_PER_PERSON = {
    "$": (15, 25),
    "$$": (30, 50),
    "$$$": (60, 90),
    "$$$$": (100, 150),
    "Unknown": (30, 50),           # default to moderate
}

def _build_prompt(state: State, top_concert: dict, directions: list, restaurants: list) -> str:
    """
    Build a structured prompt for Claude with all the data it needs
    to reason about costs.
    """
    top_restaurant = restaurants[0] if restaurants else {}

    # Summarize directions
    transit = next((d for d in directions if d["mode"] == "transit" and d.get("available")), None)
    driving = next((d for d in directions if d["mode"] == "driving" and d.get("available")), None)

    directions_summary = ""

    if transit:
        directions_summary += f"- Transit: {transit['duration']} ({transit['distance']})\n"
    if driving:
        directions_summary += f"- Driving: {driving['duration']} ({driving['distance']})\n"

    tm_min = top_concert.get("min_price")
    tm_max = top_concert.get("max_price")

    price_context = f"Min: ${tm_min}, Max: ${tm_max}" if tm_min else "NOT PROVIDED BY TICKETMASTER."
    
    current_city = state.get("city", "Chicago")

    prompt = f"""
    You are a {current_city} nightlife cost expert. Estimate the total cost for a night out.

    ## Concert
    - Event: {top_concert.get("event_name", "Unknown")}
    - Artist: {top_concert.get("artist", "Unknown")}
    - Venue: {top_concert.get("venue_name", "Unknown")}
    - Date: {top_concert.get("date", "Unknown")}
    - Ticketmaster Price Data: {price_context}


    ## Logistics
    {directions_summary if directions_summary else "No directions data provided."}
    - Top Restaurant Selection: {top_restaurant.get("name", "Unknown")} ({top_restaurant.get("price", "Unknown")} tier)

    ## Instructions
    1. If Ticketmaster price is "NOT PROVIDED", use your knowledge of the Artist's popularity and the Venue type to estimate a realistic ticket price range.
    2. Account for city-specific transit: for example: CTA in Chicago is $5 roundtrip, Parking near venues ranges from $15-$40.
    3. Return ONLY a valid JSON object with NO additional text, markdown, or explanation outside the JSON.
    Use this exact structure:
    {{
    "breakdown": {{
        "ticket": {{
        "min": <number>,
        "max": <number>,
        "note": "<one sentence — source of estimate>"
        }},
        "transport": {{
        "transit": {{
            "min": <number>,
            "max": <number>,
            "note": "<e.g. CTA round trip>"
        }},
        "driving": {{
            "min": <number>,
            "max": <number>,
            "note": "<e.g. estimated parking>"
        }}
        }},
        "dinner": {{
        "min": <number>,
        "max": <number>,
        "note": "<one sentence about the restaurant>"
        }},
        "total": {{
        "min": <transit_min + ticket_min + dinner_min>,
        "max": <driving_max + ticket_max + dinner_max>,
        "note": "<one sentence — e.g. low end assumes Transit, high end assumes driving and parking>"
        }}
    }},
    "explanation": "<2-3 sentences summarizing the night's estimated cost in plain English, mentioning both transport options>"
    }}
    """
    return prompt.strip()


def _get_selected_concert(state: State) -> State:
    """
    Helper to extract the selected concert.
    """
    concerts = state.get("concerts", [])
    selected_lat = state.get("selected_venue_lat")
    selected_lng = state.get("selected_venue_lng")
    selected_name = state.get("selected_venue_name")
    selected_address = state.get("selected_venue_address")
    selected_artist = state.get("selected_artist")
    
    if selected_lat and selected_lng:
        return {
            "venue_name": selected_name,
            "venue_address": selected_address,
            "venue_lat": selected_lat,
            "venue_lng": selected_lng,
            "artist": selected_artist,
            "min_price": None,
            "max_price": None
        }

    # Priority 2: Fallback to the first discovered concert
    if concerts:
        return concerts[0]

    # Priority 3: Nothing found
    return None




# def get_cost_estimate(top_concert: dict, directions: list, restaurants: list) -> dict:
#     # Bypassing Claude for now — using rule-based fallback
#     return _fallback_estimate(top_concert, directions, restaurants)


def get_cost_estimate(state: State, top_concert: dict, directions: list, restaurants: list) -> dict:
    """
    Call Claude to reason about the cost of the night out.
    Falls back to rule-based estimates if Claude call fails.
    """

    prompt = _build_prompt(state, top_concert, directions, restaurants)

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        raw = message.content[0].text.strip()

        # Strip markdown code fences if Claude wraps the JSON
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    except json.JSONDecodeError as e:
        print(f"Claude returned invalid JSON: {e}")
        return _fallback_estimate(top_concert, directions, restaurants)
    except Exception as e:
        print(f"Claude API error: {e}")
        return _fallback_estimate(top_concert, directions, restaurants)



def _fallback_estimate(top_concert: dict, directions: list, restaurants: list) -> dict:
    """
    Rule-based cost estimate used when Claude is unavailable.
    Keeps the app functional even if the AI call fails.
    """
    top_restaurant = restaurants[0] if restaurants else {}

    # Tickets
    ticket_min = top_concert.get("min_price") or FALLBACK_TICKET_MIN
    ticket_max = top_concert.get("max_price") or FALLBACK_TICKET_MAX

    # Dinner
    price_level = top_restaurant.get("price", "Unknown")
    dinner_min, dinner_max = FALLBACK_DINNER_PER_PERSON.get(
        price_level, FALLBACK_DINNER_PER_PERSON["Unknown"]
    )

    return {
        "breakdown": {
            "ticket": {
                "min": ticket_min,
                "max": ticket_max,
                "note": "Based on Ticketmaster data or city average"
            },
            "transport": {
                "transit": {
                    "min": FALLBACK_TRANSPORT_TRANSIT,
                    "max": FALLBACK_TRANSPORT_TRANSIT,
                    "note": "Average Transit round trip ($2.50 x 2)"
                },
                "driving": {
                    "min": FALLBACK_TRANSPORT_DRIVING,
                    "max": 30,
                    "note": "Estimated parking near venue"
                }
            },
            "dinner": {
                "min": dinner_min,
                "max": dinner_max,
                "note": f"Based on {price_level} price level"
            },
            "total": {
            "min": ticket_min + FALLBACK_TRANSPORT_TRANSIT + dinner_min,
            "max": ticket_max + 30 + dinner_max,
            "note": "Low end assumes Transit, high end assumes driving and parking"
        }
        },
        "explanation": "Cost estimated using city averages. Actual costs may vary."
    }


def cost_node(state: State) -> State:
    """
    LangGraph node — uses Claude to estimate the cost of the night out.
    """
    top_concert = _get_selected_concert(state)
    directions = state.get("directions", [])
    restaurants = state.get("restaurants", [])

    if not top_concert:
        return {
            **state,
            "cost_estimate": {},
            "errors": state.get("errors", []) + ["No concerts found, skipping cost estimate."]
        }
    
    cost_estimate = get_cost_estimate(state, top_concert, directions, restaurants)

    return {**state, "cost_estimate": cost_estimate}

