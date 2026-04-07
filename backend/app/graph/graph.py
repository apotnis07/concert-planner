from app.graph.state import State
from app.agents.spotify_agent import spotify_node
from app.agents.concerts_agent import concerts_node
from langgraph.graph import StateGraph, END

def build_graph():
    workflow = StateGraph(State)

    workflow.add_node("Spotify Agent", spotify_node)
    workflow.add_node("Concerts Agent", concerts_node)

    workflow.set_entry_point("Spotify Agent")

    workflow.add_edge("Spotify Agent", "Concerts Agent")
    workflow.add_edge("Concerts Agent", END)

    return workflow.compile()
    
graph = build_graph()