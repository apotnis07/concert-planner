import spotipy
from spotipy.oauth2 import SpotifyOAuth
from app.config import settings
from app.graph.state import State

SCOPES = "user-follow-read"

def get_spotify_client(access_token: str) -> spotipy.Spotify:
    return spotipy.Spotify(auth=access_token)

def get_followed_artists(access_token: str, limit: int = 10) -> list[dict]:
    sp = get_spotify_client(access_token)
    results = sp.current_user_followed_artists(limit=limit)
    artists = results["artists"]["items"]

    return [
        {
            "name" : artist["name"],
            "spotify_id" : artist["id"],
            "images": artist["images"]
        }
        for artist in artists
    ]

def get_auth_manager() -> SpotifyOAuth:
    return SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri,
        scope=SCOPES,
    )    
    
def spotify_node(state: State) -> State:
    """LangGraph node — reads access_token from state, writes followed_artists."""
    try:
        artists = get_followed_artists(state["access_token"])
        return {**state, "followed_artists": artists}
    
    except Exception as e:
        return {
            **state,
            "followed_artists": [],
            "errors": state.get("errors", []) + [f"Spotify error: {str(e)}"]
        }
