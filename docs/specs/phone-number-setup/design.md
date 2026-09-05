# Phone Number Setup Design

## Placement

Prefer reusing the settings profile section for phone number editing.

## Error Codes

- `PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION`
- `PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE`

## Retry State

Preserve enough route/action context to retry proposal creation or acceptance after profile update.

## Dependencies

- `settings/`
- `error-handling/`
- relevant match flow spec

