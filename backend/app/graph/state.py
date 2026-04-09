from typing import TypedDict

from pydantic import Field


class State(TypedDict):

    access_token: str
    city: str
    origin: str

    followed_artists: list[dict]
    concerts: list[dict]
    directions: list[dict]
    directions_for: dict 
    venue_location: dict
    restaurants: list[dict]
    cost_estimate: dict
    summary: str

    errors: list[str]
