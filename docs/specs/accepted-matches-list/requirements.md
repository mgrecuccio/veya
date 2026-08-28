# Accepted Matches List Requirements

Backlog ticket: 7

## Goal

Replace the static matches page preview data with backend-loaded accepted matches.

## User Stories

- As an authenticated user, I want to see accepted matches from the backend so that the matches tab reflects real match state.
- As an authenticated user, I want clear loading, empty, and error states so that I understand why no accepted matches are shown.

## Scope

- Load accepted matches from `GET /api/v1/matches/accepted` through `MatchesService`.
- Remove hardcoded match preview data from the matches page.
- Render backend-provided accepted match information available in the current API model.
- Show loading, empty, loaded, and error states.
- Preserve navigation to settings from the matches page.

## Out Of Scope

- Match suggestions.
- Incoming match invitations.
- Accepting or declining proposals.
- Match detail route or modal.
- WhatsApp/contact-link handoff.
- Push notification routing.

## Acceptance Criteria

- No hardcoded accepted matches remain on the matches page.
- The matches page calls `MatchesService.getAccepted()` instead of constructing HTTP calls directly.
- Empty state explains that accepted matches appear after both required consents exist.
- Backend errors are shown without breaking tab navigation.
- The accepted match count reflects the loaded backend list.
- Focused tests cover load success, empty state, error state, and retry or refresh behavior if implemented.
