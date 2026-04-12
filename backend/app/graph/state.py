from typing import TypedDict

from pydantic import Field


class State(TypedDict):

    access_token: str
    city: str
    origin: str
    cuisine_preference: str
    budget: str
    followed_artists: list[dict]
    concerts: list[dict]
    directions: list[dict]
    directions_for: dict 
    venue_location: dict
    restaurants: list[dict]
    cost_estimate: dict
    summary: str
    selected_artist: str
    selected_date: str
    selected_venue_name: str
    selected_venue_address: str
    selected_venue_lat: float | None
    selected_venue_lng: float | None

    errors: list[str]
