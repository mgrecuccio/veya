# Accepted Matches List Design

## Placement

Use the existing authenticated matches tab at `/app/matches`.

This spec only replaces the current static accepted-match preview list. Keep proposal creation, invitation actions, and contact handoff in their dedicated specs.

## Data Flow

Load accepted matches through `MatchesService.getAccepted()` when the page is entered or initialized.

Use backend data as the source of truth. Do not keep local sample matches as fallback content.

## Page State

Represent the matches page with explicit states:

- `loading`: accepted matches are being fetched.
- `loaded`: one or more accepted matches are available.
- `empty`: the backend returned an empty list.
- `error`: the backend request failed.

The page should keep the settings button and surrounding tab shell usable in every state.

## Display Fields

Render the most useful fields currently available from the accepted match API model:

- display name when available
- channel type
- status
- overlap start and end
- created time
- responded time when present

If the current accepted-match DTO does not include all desired display context, prefer a small view-model mapping layer over changing UI templates to depend on incomplete raw fields.

## Refresh Behavior

Initial implementation can load on page entry. If a manual retry action is added for errors, it should call the same load path.

Later notification routing can refresh this same page state after `MATCH_PROPOSAL_ACCEPTED`, but notification work is outside this spec.

## Dependencies

- `matches-api/`
- `error-handling/` for user-facing backend error messages

## Testing

Add focused page tests that mock `MatchesService`:

- successful accepted-match load
- empty backend response
- backend error response
- retry/refresh action, if present
