# Match Suggestions Requirements

Backlog ticket: 8

## Goal

Show backend-computed match suggestions and let users create proposals.

## Acceptance Criteria

- Suggestions are loaded from `GET /api/v1/matches/suggestions`.
- The UI shows at most the backend-returned suggestions.
- The UI shows candidate nickname, favorite flag, channel, strength/score, and overlap time where available.
- Proposal creation calls `POST /api/v1/matches`.
- Proposal payload includes only `candidateUserId` and `channelType`.
- Duplicate proposal and validation failures use backend error codes when available.

