# Push Notifications Design

## Services

Add a notification API service for backend device registration. Add a platform integration layer for Capacitor/Ionic push APIs.

## State Model

Treat push notification delivery as the combination of three states:
- Backend user preference: `pushNotificationsEnabled` records the user's in-app intent.
- OS permission: the platform notification permission determines whether this device can receive notifications.
- Device token registration: the backend registration determines whether this specific device should be targeted.

The settings toggle changes the backend user preference. It must not contain the whole device registration flow and must not be treated as proof that the current device can receive push notifications.

## Permission Reconciliation

Check OS notification permission:
- before requesting or registering a push token
- on authenticated app startup
- after login, once the user session is available
- when the app resumes from the background
- when the user changes the push notification preference
- when the platform emits a new push token
- when the settings page opens

Use one shared reconciliation flow for all of those triggers:
- Preference off: disable the current device token through `DELETE /api/v1/notifications/devices` where possible.
- Preference on and OS permission granted: obtain the current FCM/APNs token and register it through `POST /api/v1/notifications/devices`.
- Preference on and OS permission denied: do not register a new token; treat the current device as not deliverable until the user restores permission in device settings.

Do not automatically clear `pushNotificationsEnabled` only because OS permission is denied. Keeping the preference preserves the user's app-level intent across devices and across later permission restoration.

## Routing Intents

Normalize Firebase payloads into internal intents:
- `MATCH_PROPOSAL_CREATED`
- `MATCH_PROPOSAL_ACCEPTED`
- `MATCH_SUGGESTIONS_AVAILABLE`

## Backend Refresh Rule

Notification data is a navigation hint only. The destination page must load current backend state.
