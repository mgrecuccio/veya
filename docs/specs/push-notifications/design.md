# Push Notifications Design

## Services

Add a notification API service for backend device registration. Add a platform integration layer for Capacitor/Ionic push APIs.

## Routing Intents

Normalize Firebase payloads into internal intents:
- `MATCH_PROPOSAL_CREATED`
- `MATCH_PROPOSAL_ACCEPTED`
- `MATCH_SUGGESTIONS_AVAILABLE`

## Backend Refresh Rule

Notification data is a navigation hint only. The destination page must load current backend state.

