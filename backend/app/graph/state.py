from typing import TypedDict

from pydantic import Field


class State(TypedDict):

    access_token: str

    followed_artists: list[dict]
    concerts: list[dict]
    directions: list[dict]
    restaurants: list[dict]
    cost_estimate: dict
    summary: str


    city: str
    errors: list[str]
