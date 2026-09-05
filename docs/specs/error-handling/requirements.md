# Error Handling Requirements

Backlog ticket: 17

## Goal

Use backend error codes for business behavior instead of localized detail text.

## Acceptance Criteria

- Feature code can switch on backend `ApiError.code`.
- Unknown errors still show generic retry messaging.
- Tests cover at least phone-number-required and duplicate proposal mapping.

