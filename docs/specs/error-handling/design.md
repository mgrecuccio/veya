# Error Handling Design

## Approach

Add a shared parser/helper for backend API errors. Use it in feature data services and action handlers.

## Known Codes

- `MATCH_ALREADY_EXISTS`
- `MATCH_PROPOSAL_EXPIRED`
- `PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE`
- `PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION`
- `CHANNEL_NOT_ALLOWED`
- `AVAILABILITY_OVERLAP_NOT_FOUND`
- `MATCH_SCORE_BELOW_THRESHOLD`
- `CONTACT_BLOCKED`

## Rule

Do not branch on localized `detail` text.

