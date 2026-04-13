# Sonic Curator

The Sonic Curator is a multi-agent AI system that plans a personalized night out based on your Spotify music taste. Connect your Spotify account, pick an upcoming concert from your followed artists, and the app handles the rest — directions, restaurant recommendations, and a cost estimate for the night.

Built with LangGraph, the system orchestrates a pipeline of 6 specialized agents. Each agent is responsible for one domain of the plan and writes its findings into a shared typed state that propagates through the graph.

### How it works
1. Spotify Agent — reads your followed artists via the Spotify API
2. Concerts Agent — searches Ticketmaster for upcoming shows from those artists in the city of your preference
3. Directions Agent — fetches transit and driving directions to the selected venue via Google Routes API
4. Restaurants Agent — finds nearby highly-rated restaurants filtered by your cuisine preference and budget via Google Places API
5. Cost Agent — estimates the total cost of the night using ticket data, transport, and dinner price level
6. Summary Agent — synthesizes all agent outputs into a personalized night out plan via Claude

## Wesbite
Live Demo: https://concert-planner.vercel.app

## Video Demo

## Architecture

```mermaid
flowchart TD
    U([User]) --> LP[Landing Page]
    LP -->|Spotify OAuth| PP[Preferences Page]
    PP -->|city · cuisine · budget| CP[Concert Picker]

    subgraph pipeline["LangGraph Pipeline"]
        direction TB
        A1[Spotify Agent]
        A2[Concerts Agent - Ticketmaster]

        subgraph results["Results Pipeline"]
            direction TB
            A3[Directions Agent - Google Routes]
            A4[Restaurants Agent - Google Places]
            A5[Cost Agent - Claude]
            A6[Summary Agent - Claude]
            A3 --> A4
            A4 --> A5
            A5 --> A6
        end

        A1 -->|followed artists| A2
        A2 -->|concerts| A3
    end

    LP --> A1
    PP -->|city| A2
    A2 -->|artists' concerts| CP
    CP -->|selected concert| results
    results --> RP[Results Page]

    RP --> CC[Concert Card]
    RP --> DC[Directions Modal]
    RP --> RC[Restaurant Carousel]
    RP --> CE[Cost Estimate Card]
    RP --> SM[AI Summary]
```
