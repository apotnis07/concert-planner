# Sonic Curator


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
