# Incoming Match Invitations Requirements

Backlog tickets: 9, 16

## Goal

Let candidates view incoming match proposals and accept or decline them.

## Acceptance Criteria

- Incoming proposals load from `GET /api/v1/matches/incoming`.
- Users can accept through `PATCH /api/v1/matches/{id}/accept`.
- Users can decline through `PATCH /api/v1/matches/{id}/decline`.
- Expired or stale proposal errors refresh the incoming list.
- Candidate-only authorization errors are surfaced cleanly.

