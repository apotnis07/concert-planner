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

def _build_prompt(concerts: list, directions: list, restaurants: list) -> str:
    """
    Build a structured prompt for Claude with all the data it needs
    to reason about costs.
    """
    top_concert = concerts[0] if concerts else {}
    top_restaurant = restaurants[0] if restaurants else {}

    # Summarize directions
    transit = next((d for d in directions if d["mode"] == "transit" and d.get("available")), None)
    driving = next((d for d in directions if d["mode"] == "driving" and d.get("available")), None)

    directions_summary = ""

    if transit:
        directions_summary += f"- CTA transit: {transit['duration']} ({transit['distance']})\n"
    if driving:
        directions_summary += f"- Driving: {driving['duration']} ({driving['distance']})\n"

    
    prompt = f"""
    You are a helpful assistant estimating the cost of a night out in Chicago.
    Based on the data below, provide a realistic cost breakdown and a brief explanation.

    ## Concert
    - Event: {top_concert.get("event_name", "Unknown")}
    - Artist: {top_concert.get("artist", "Unknown")}
    - Venue: {top_concert.get("venue_name", "Unknown")}
    - Date: {top_concert.get("date", "Unknown")}
    - Ticket price range from Ticketmaster: min=${top_concert.get("min_price", "unavailable")}, max=${top_concert.get("max_price", "unavailable")}
    - Price available: {top_concert.get("price_available", False)}

    ## Transportation options
    {directions_summary if directions_summary else "No directions data available."}
    - Note: CTA fare in Chicago is $2.50 per ride but a max of $5.00 for the whole night with a day pass. Parking near venues typically costs $15-$30.

    ## Top restaurant nearby
    - Name: {top_restaurant.get("name", "Unknown")}
    - Type: {top_restaurant.get("type", "Unknown")}
    - Price level: {top_restaurant.get("price", "Unknown")} 
    - Rating: {top_restaurant.get("rating", "Unknown")}

    ## Chicago cost context
    - Average concert ticket (if price unavailable): $45-$120
    - Late night dinner per person: $15-$150 depending on price level
    - CTA single ride: $2.50, round trip: $5.00
    - Parking near venue: $15-$30

    ## Instructions
    Return ONLY a valid JSON object with NO additional text, markdown, or explanation outside the JSON.
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
        "note": "<one sentence — e.g. low end assumes CTA, high end assumes driving and parking>"
        }}
    }},
    "explanation": "<2-3 sentences summarizing the night's estimated cost in plain English, mentioning both transport options>"
    }}
    """
    return prompt.strip()

def get_cost_estimate(concerts: list, directions: list, restaurants: list) -> dict:
    # Bypassing Claude for now — using rule-based fallback
    return _fallback_estimate(concerts, directions, restaurants)


# def get_cost_estimate(concerts: list, directions: list, restaurants: list) -> dict:
#     """
#     Call Claude to reason about the cost of the night out.
#     Falls back to rule-based estimates if Claude call fails.
#     """
#     prompt = _build_prompt(concerts, directions, restaurants)

#     try:
#         message = client.messages.create(
#             model="claude-haiku-4-5-20251001",
#             max_tokens=800,
#             temperature=0.7,
#             messages=[
#                 {"role": "user", "content": prompt}
#             ]
#         )

#         raw = message.content[0].text.strip()

#         # Strip markdown code fences if Claude wraps the JSON
#         if raw.startswith("```"):
#             raw = raw.split("```")[1]
#             if raw.startswith("json"):
#                 raw = raw[4:]
#             raw = raw.strip()

#         return json.loads(raw)

#     except json.JSONDecodeError as e:
#         print(f"Claude returned invalid JSON: {e}")
#         return _fallback_estimate(concerts, directions, restaurants)
#     except Exception as e:
#         print(f"Claude API error: {e}")
#         return _fallback_estimate(concerts, directions, restaurants)



def _fallback_estimate(concerts: list, directions: list, restaurants: list) -> dict:
    """
    Rule-based cost estimate used when Claude is unavailable.
    Keeps the app functional even if the AI call fails.
    """
    top_concert = concerts[0] if concerts else {}
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
                "note": "Based on Ticketmaster data or Chicago average"
            },
            "transport": {
                "transit": {
                    "min": FALLBACK_TRANSPORT_TRANSIT,
                    "max": FALLBACK_TRANSPORT_TRANSIT,
                    "note": "CTA round trip ($2.50 x 2)"
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
            "note": "Low end assumes CTA transit, high end assumes driving and parking"
        }
        },
        "explanation": "Cost estimated using Chicago averages. Actual costs may vary."
    }


def cost_node(state: State) -> State:
    """
    LangGraph node — uses Claude to estimate the cost of the night out.
    """
    concerts = state.get("concerts", [])
    directions = state.get("directions", [])
    restaurants = state.get("restaurants", [])

    if not concerts:
        return {
            **state,
            "cost_estimate": {},
            "errors": state.get("errors", []) + ["No concerts found, skipping cost estimate."]
        }
    
    cost_estimate = get_cost_estimate(concerts, directions, restaurants)

    return {**state, "cost_estimate": cost_estimate}

