from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.agents.spotify_agent import get_followed_artists, get_auth_manager
from app.graph.graph import graph
from fastapi.responses import RedirectResponse
import os


app = FastAPI(title="Night Out Planner API")

# Needed later when React frontend talks to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://concert-planner.vercel.app",
    ],  
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
    # Redirect to frontend preferences page with token in URL
    access_token = token_info["access_token"]
    return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/preferences?access_token={access_token}")

@app.get("/api/top-artists")
def top_artists(access_token: str = Query(...)):
    """Return the user's followed artists."""
    try:
        artists = get_followed_artists(access_token)
        return {"artists": artists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
@app.post("/api/plan")
def plan(
    access_token: str = Query(...),
    city: str = Query(default="Chicago"),
    origin: str = Query(default="Chicago Union Station, 225 S Canal St, Chicago, IL 60606"),
    cuisine_preference: str = Query(default="Any"),
    budget: str = Query(default="$$"),
    selected_artist: str = "",
    selected_date: str = "",
    selected_time: str = "",
    selected_venue_name: str = Query(default=""),
    selected_venue_address: str = Query(default=""),
    selected_venue_lat: str = Query(default=""),
    selected_venue_lng: str = Query(default=""),
):
    
    lat = float(selected_venue_lat) if selected_venue_lat else None
    lng = float(selected_venue_lng) if selected_venue_lng else None

    initial_state: dict = {
        "access_token": access_token,
        "city": city,
        "origin": origin,
        "cuisine_preference": cuisine_preference,
        "budget": budget,
        "selected_artist": selected_artist,
        "selected_date": selected_date,
        "selected_time": selected_time,
        "selected_venue_name": selected_venue_name,
        "selected_venue_address": selected_venue_address,
        "selected_venue_lat": lat,
        "selected_venue_lng": lng,
        "followed_artists": [],
        "concerts": [],
        "directions": [],
        "directions_for": {},
        "venue_location": {},
        "restaurants": [],
        "cost_estimate": {},
        "summary": "",
        "errors": [],
    }
    try:
        result = graph.invoke(initial_state)
        return result
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}") # This will show in your terminal
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/api/concerts")
def plan(access_token: str = Query(...), city: str = Query(default="Chicago")):
    """Run only Spotify + Concerts agents and return available shows."""
    from app.agents.spotify_agent import get_followed_artists
    from app.agents.concerts_agent import get_concerts_for_artists

    try: 
        artists = get_followed_artists(access_token)
        artist_names = [a["name"] for a in artists]

        if not artist_names:
            return {"concerts": [], "artists": []}
    
        concerts = get_concerts_for_artists(artist_names, city)
        return {"concerts": concerts, "artists": artists}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
