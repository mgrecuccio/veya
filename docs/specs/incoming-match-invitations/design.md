# Incoming Match Invitations Design

## Placement

Use a dedicated route or a prominent matches subview so push notification routing can open it.

## Data Flow

Load incoming proposals on page enter and after accept/decline. If an action fails because the proposal is stale, refresh from backend.

## States

Support loading, empty, loaded, acting, stale/error, and refreshed states.

## Dependencies

- `matches-api/`
- `error-handling/`
- `phone-number-setup/`

