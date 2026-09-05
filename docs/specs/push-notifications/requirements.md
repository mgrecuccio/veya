# Push Notifications Requirements

Backlog tickets: 13, 14, 15

## Goal

Register device tokens, receive Firebase push notifications, and route notification taps as backend refresh hints.

## Acceptance Criteria

- Device token registers through `POST /api/v1/notifications/devices`.
- Device token disables through `DELETE /api/v1/notifications/devices` where appropriate.
- Device token registration is handled by a shared reconciliation flow, not only by the settings toggle.
- The app checks OS notification permission before registering a device token.
- The app re-checks OS notification permission on authenticated startup, after login, app resume, push preference changes, push token refresh, and when opening settings.
- If the in-app push preference is enabled but OS notification permission is denied, the device is treated as not deliverable until permission is restored.
- OS-level denial does not by itself clear the user's backend `pushNotificationsEnabled` preference.
- Notification taps route to the right app area.
- Each routed area refreshes backend state.
- Foreground notifications do not render stale payload data as final state.
- Push payloads never include or expect WhatsApp URLs or raw phone numbers.
