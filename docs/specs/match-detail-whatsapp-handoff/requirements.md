# Match Detail And WhatsApp Handoff Requirements

Backlog ticket: 10

## Goal

Let users open backend-generated WhatsApp contact links for accepted matches.

## Acceptance Criteria

- Match detail shows accepted match state.
- "Open WhatsApp" calls `POST /api/v1/matches/{matchId}/contact-link`.
- The app opens `ContactLinkView.url`.
- The app never constructs `wa.me` URLs.
- URL open failures or missing WhatsApp are handled.
