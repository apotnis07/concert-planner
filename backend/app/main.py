from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.agents.spotify_agent import get_followed_artists, get_auth_manager

app = FastAPI(title="Night Out Planner API")

# Needed later when React frontend talks to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_manager = get_auth_manager()

@app.get("/health")
def health():
    return {"status":"ok"}

@app.get("/login")
def login():
    """Returns the Spotify OAuth URL for the frontend to redirect to."""
    auth_url = auth_manager.get_authorize_url()
    return {"auth_url": auth_url}

@app.get("/callback")
def callback(code: str = Query(...)):
    """Spotify redirects here after user approves. Exchange code for token."""
    token_info = auth_manager.get_access_token(code)
    if not token_info:
        raise HTTPException(status_code=400, detail="Failed to get token from Spotify")
    return {"access_token": token_info["access_token"]}

@app.get("/api/top-artists")
def top_artists(access_token: str = Query(...)):
    """Return the user's followed artists."""
    try:
        artists = get_followed_artists(access_token)
        return {"artists": artists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))