# Matches API Design

## Service

Create `src/app/core/api/services/matches.service.ts`.

Suggested methods:
- `getSuggestions()`
- `createMatch(payload: CreateMatchRequest)`
- `getIncoming()`
- `acceptMatch(id: number)`
- `declineMatch(id: number)`
- `getAccepted()`
- `createContactLink(matchId: number)`

Use existing request and model files under `src/app/core/api`.

## Error Handling

Return raw `HttpErrorResponse` to feature data services for now. Feature work should branch on parsed backend `ApiError.code` once the error-handling spec is implemented.

## Tests

Use `HttpTestingController`, matching the existing API service specs.

