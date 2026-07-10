# Matches API Requirements

Backlog ticket: 6

## Goal

Create a typed Angular API service for the backend matching endpoints so feature pages do not build HTTP calls directly.

## Endpoints

- `GET /api/v1/matches/suggestions`
- `POST /api/v1/matches`
- `GET /api/v1/matches/incoming`
- `PATCH /api/v1/matches/{id}/accept`
- `PATCH /api/v1/matches/{id}/decline`
- `GET /api/v1/matches/accepted`
- `POST /api/v1/matches/{matchId}/contact-link`

## Acceptance Criteria

- Every matching endpoint has a typed service method.
- Match creation sends only `candidateUserId` and `channelType`.
- Contact links are requested from the backend and never constructed locally.
- Service tests assert URL, method, params, and payload.

