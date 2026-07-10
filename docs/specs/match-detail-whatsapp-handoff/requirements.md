# Match Detail And WhatsApp Handoff Requirements

Backlog tickets: 7, 10

## Goal

Replace hardcoded accepted matches with backend data and let users open backend-generated WhatsApp contact links for accepted matches.

## Acceptance Criteria

- Accepted matches load from `GET /api/v1/matches/accepted`.
- No hardcoded accepted matches remain.
- Match detail shows accepted match state.
- "Open WhatsApp" calls `POST /api/v1/matches/{matchId}/contact-link`.
- The app opens `ContactLinkView.url`.
- The app never constructs `wa.me` URLs.
- URL open failures or missing WhatsApp are handled.

