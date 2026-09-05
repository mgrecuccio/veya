# Match Suggestions Design

## Placement

Add a suggestions section or page inside the authenticated app shell. Prefer a dedicated route if notification routing needs to open it directly.

## Data Flow

Load suggestions on page enter. After proposal creation, refresh suggestions from the backend.

## States

Support loading, empty, loaded, creating, and error states.

## Dependencies

- `matches-api/`
- `error-handling/` for refined business error handling
- `phone-number-setup/` for phone-required redirects

