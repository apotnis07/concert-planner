import anthropic
from app.config import settings
from app.graph.state import State

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def _build_summary_prompt(state: State) -> str:
    """
    Build a comprehensive prompt from the full state for Claude to summarize.
    """
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
    top_concert = concerts[0] if concerts else None
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
    You are a friendly and knowledgeable Chicago night-out planner. 
    Based on the data below, write an exciting and practical night out plan for the user.

    ## User's Followed Artists (from Spotify)
    {artists_str}

    ## Concert
    {concert_str}

    ## Getting There (from Chicago Union Station)
    {directions_str}

    ## Top Restaurant Recommendations Near the Venue
    {restaurants_str}

    ## Cost Estimate
    {cost_str}

    ## Data Warnings (some data may have been unavailable)
    {errors_str}

    ## Instructions
    Write a warm, engaging night out plan in plain English. Structure it with these sections:
    1. **The Show** — highlight the concert, artist, venue, date/time, and where to get tickets
    2. **Getting There** — summarize both transport options, give a recommendation
    3. **Dinner After** — recommend the top restaurant pick with a sentence about why
    4. **What It'll Cost** — give the total range and what drives the cost
    5. **Quick Tips** — 2-3 practical Chicago-specific tips for the night (parking, arriving early, etc.)

    Keep the tone conversational and helpful, like a knowledgeable friend planning the night with them.
    If any data was missing or unavailable, acknowledge it naturally without being robotic about it.
    Do not use JSON. Write in plain paragraphs with markdown headers.
    """.strip()

    return prompt


def get_summary(state: State) -> str:
    """
    Call Claude to write the full night out summary.
    Falls back to a plain text summary if Claude is unavailable.
    """
    prompt = _build_summary_prompt(state)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return message.content[0].text.strip()

    except Exception as e:
        print(f"Summary agent Claude error: {e}")
        return _fallback_summary(state)


def _fallback_summary(state: State) -> str:
    """Plain text fallback if Claude is unavailable."""
    concerts = state.get("concerts", [])
    restaurants = state.get("restaurants", [])
    cost = state.get("cost_estimate", {})

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