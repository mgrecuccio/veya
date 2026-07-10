# Push Notifications Requirements

Backlog tickets: 13, 14, 15

## Goal

Register device tokens, receive Firebase push notifications, and route notification taps as backend refresh hints.

## Acceptance Criteria

- Device token registers through `POST /api/v1/notifications/devices`.
- Device token disables through `DELETE /api/v1/notifications/devices` where appropriate.
- Notification taps route to the right app area.
- Each routed area refreshes backend state.
- Foreground notifications do not render stale payload data as final state.
- Push payloads never include or expect WhatsApp URLs or raw phone numbers.

