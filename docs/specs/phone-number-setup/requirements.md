# Phone Number Setup Requirements

Backlog tickets: 11, 12

## Goal

Route users to phone number setup when a match action requires a phone number, then let them return to the interrupted action.

## Acceptance Criteria

- Users can add or update phone number after registration.
- Missing phone number before proposal creation routes to setup.
- Missing phone number before proposal acceptance routes to setup.
- Backend phone-required errors are not shown as generic failures.
- Retry path works after successful profile update.

