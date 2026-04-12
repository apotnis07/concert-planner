import anthropic
from app.config import settings
from app.graph.state import State
import sys

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def _build_summary_prompt(state: State) -> str:
    """
    Build a comprehensive prompt from the full state for Claude to summarize.
    """
    print("\n--- STATE DATA COUNTS ---")
    for key in ['concerts', 'restaurants', 'directions', 'followed_artists']:
        data = state.get(key, [])
        print(f"{key}: {len(data)} items")
        if data:
            # Check the size of the first item to see if it's a giant dict
            print(f"  First {key} item size: {sys.getsizeof(str(data[0])) / 1024:.2f} KB")
            
    artists = state.get("followed_artists", [])
    concerts = state.get("concerts", [])
    directions = state.get("directions", [])
    restaurants = state.get("restaurants", [])
    cost = state.get("cost_estimate", {})
    errors = state.get("errors", [])

    # Artists
    artist_names = [a["name"] for a in artists[:5]]
    artists_str = ", ".join(artist_names) if artist_names else "Unknown"

    # Concert
    concerts = state.get("concerts", [])
    selected_venue = state.get("selected_venue_name", "")

    top_concert = None
    if selected_venue:
        top_concert = next(
            (c for c in concerts if selected_venue.lower() in c.get("venue_name", "").lower()), 
            None
        )
    if not top_concert and concerts:
        top_concert = concerts[0]
    concert_str = "No upcoming concerts found in Chicago." if not top_concert else f"""
    - Event: {top_concert.get("event_name")}
    - Artist: {top_concert.get("artist")}
    - Venue: {top_concert.get("venue_name")}
    - Address: {top_concert.get("venue_address")}, Chicago, IL
    - Date: {top_concert.get("date")}
    - Time: {top_concert.get("time", "TBD")}
    - Tickets: {f'${top_concert.get("min_price")} - ${top_concert.get("max_price")}' if top_concert.get("price_available") else "Price unavailable — check Ticketmaster"}
    - Ticketmaster URL: {top_concert.get("url", "N/A")}
    """.strip()

    # Directions
    transit = next((d for d in directions if d["mode"] == "transit" and d.get("available")), None)
    driving = next((d for d in directions if d["mode"] == "driving" and d.get("available")), None)

    directions_str = ""
    if transit:
        directions_str += f"- CTA: {transit['duration']}, {transit['distance']}\n"
    if driving:
        directions_str += f"- Driving: {driving['duration']}, {driving['distance']} via {driving.get('summary', 'local roads')}\n"
    if not directions_str:
        directions_str = "Directions unavailable."

    # Restaurants — top 3
    top_restaurants = restaurants[:3]
    if top_restaurants:
        restaurants_str = "\n".join([
            f"- {r['name']} ({r['type']}, {r['price']}, ⭐ {r['rating']}) — {'Open now' if r.get('open_now') else 'Check hours'}"
            for r in top_restaurants
        ])
    else:
        restaurants_str = "No restaurant recommendations available."

    # Cost
    breakdown = cost.get("breakdown", {})
    total = breakdown.get("total", {})
    cost_str = (
        f"Estimated total: ${total.get('min', '?')} — ${total.get('max', '?')}\n"
        f"{cost.get('explanation', '')}"
        if total else "Cost estimate unavailable."
    )

    # Errors — let Claude know what data was missing
    errors_str = (
        "\n".join(f"- {e}" for e in errors)
        if errors else "None"
    )

    prompt = f"""
    You are a friendly Chicago night-out planner. 
    Write a concise, exciting night out plan using the data below.

    ## IMPORTANT
    Focus EXCLUSIVELY on the concert at {top_concert.get('venue_name') if top_concert else 'the venue'}. 
    Ignore any other festival dates or locations.

    ## Context
    Artists: {artists_str}
    Concert: {concert_str}
    Directions: {directions_str}
    Food: {restaurants_str}
    Costs: {cost_str}
    Warnings: {errors_str}

    ## Hard Constraints for Cost Efficiency
    - **Maximum Length:** Do not exceed 200 words total.
    - **Structure:** Use exactly one short paragraph per section.
    - **No Fluff:** Skip introductory "I'd be happy to help" or concluding "Have a great night" pleasantries.
    - **Formatting:** Use plain paragraphs with markdown headers.

    ## Sections
    1. **The Show** — Briefly highlight the artist, venue, and time.
    2. **Getting There** — Give one clear transit recommendation.
    3. **Dinner** — Recommend the top restaurant pick and why it fits.
    4. **Budget** — State the total range and the primary cost driver.
    5. **Quick Tips** — Provide two brief, practical Chicago tips.

    Tone: Conversational but highly efficient. If data is missing, mention it briefly and move on.
    """.strip()

    return prompt


def get_summary(state: State) -> str:
    # Bypassing Claude for now — using plain text fallback
    return _fallback_summary(state)

# def get_summary(state: State) -> str:
#     """
#     Call Claude to write the full night out summary.
#     Falls back to a plain text summary if Claude is unavailable.
#     """
#     prompt = _build_summary_prompt(state)
#     # --- DEBUG START ---
#     import sys
#     char_count = len(prompt)
#     estimated_tokens = char_count / 4  # Rough LLM estimate
#     print("\n--- SUMMARY PROMPT DEBUG ---")
#     print(f"Total Characters: {char_count}")
#     print(f"Estimated Tokens: {estimated_tokens}")
#     print(f"Memory Size: {sys.getsizeof(prompt) / 1024:.2f} KB")
#     # --- DEBUG END ---
#     try:
#         message = client.messages.create(
#             model="claude-haiku-4-5-20251001",
#             max_tokens=800,
#             temperature=0.7,
#             messages=[
#                 {"role": "user", "content": prompt}
#             ]
#         )
#         print("\n--- ANTHROPIC BILLING ---")
#         print(f"Input Tokens: {message.usage.input_tokens}")
#         print(f"Output Tokens: {message.usage.output_tokens}")
#         return message.content[0].text.strip()

#     except Exception as e:
#         print(f"Summary agent Claude error: {e}")
#         return _fallback_summary(state)


def _fallback_summary(state: State) -> str:
    """Plain text fallback if Claude is unavailable."""
    concerts = state.get("concerts", [])
    restaurants = state.get("restaurants", [])
    cost = state.get("cost_estimate", {})


    # Concert
    concerts = state.get("concerts", [])
    selected_venue = state.get("selected_venue_name", "")

    top_concert = None
    if selected_venue:
        top_concert = next(
            (c for c in concerts if selected_venue.lower() in c.get("venue_name", "").lower()), 
            None
        )
    if not top_concert:
        top_concert = concerts[0] if concerts else None
    
    top_restaurant = restaurants[0] if restaurants else None
    total = cost.get("breakdown", {}).get("total", {})

    lines = ["## Your Night Out Plan\n"]

    if top_concert:
        lines.append(f"**The Show:** {top_concert.get('event_name')} at {top_concert.get('venue_name')} on {top_concert.get('date')}.")
    else:
        lines.append("**The Show:** No upcoming concerts found.")

    if top_restaurant:
        lines.append(f"**Dinner:** {top_restaurant.get('name')} ({top_restaurant.get('type')}, {top_restaurant.get('price')}) is nearby.")

    if total:
        lines.append(f"**Cost:** Estimated ${total.get('min')} — ${total.get('max')} for the night.")

    return "\n\n".join(lines)


def summary_node(state: State) -> State:
    """LangGraph node — generates the final night out summary."""
    summary = get_summary(state)
    return {**state, "summary": summary}