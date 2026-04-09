from app.graph.state import State
from app.agents.spotify_agent import spotify_node
from app.agents.concerts_agent import concerts_node
from app.agents.directions_agent import directions_node
from app.agents.restaurants_agent import restaurants_node
from app.agents.cost_agent import cost_node
from app.agents.summary_agent import summary_node



from langgraph.graph import StateGraph, END

def build_graph():
    workflow = StateGraph(State)

    workflow.add_node("Spotify Agent", spotify_node)
    workflow.add_node("Concerts Agent", concerts_node)
    workflow.add_node("Directions Agent", directions_node)
    workflow.add_node("Restaurants Agent", restaurants_node)
    workflow.add_node("Cost Agent", cost_node)
    workflow.add_node("Summary Agent", summary_node)


    workflow.set_entry_point("Spotify Agent")

    workflow.add_edge("Spotify Agent", "Concerts Agent")
    workflow.add_edge("Concerts Agent", "Directions Agent")
    workflow.add_edge("Directions Agent", "Restaurants Agent")
    workflow.add_edge("Restaurants Agent", "Cost Agent")
    workflow.add_edge("Cost Agent", "Summary Agent")
    workflow.add_edge("Summary Agent", END)

    return workflow.compile()
    
graph = build_graph()