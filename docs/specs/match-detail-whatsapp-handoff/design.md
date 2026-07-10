# Match Detail And WhatsApp Handoff Design

## Placement

Use the existing matches area for accepted matches. Add a detail route or modal for contact handoff.

## Data Flow

Accepted matches are loaded from backend. Contact links are requested only after the user taps the handoff action.

## Security Rules

Do not display raw phone numbers. Do not derive or construct contact links from local state or push payloads.

## Dependencies

- `matches-api/`
- `phone-number-setup/`
- `error-handling/`

