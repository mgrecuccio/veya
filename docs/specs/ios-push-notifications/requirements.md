# iOS Push Notifications Requirements

Related backlog tickets: 13, 14, 15

## Goal

Allow a signed-in user to enable notifications on an iOS device even when the account-level push preference was already enabled on another device, and register an iOS Firebase Cloud Messaging token that the existing backend can deliver to through Firebase Admin.

## Problem

The account-level `pushNotificationsEnabled` preference and the iOS notification authorization are separate states.

On a fresh iOS installation, the app currently checks authorization without requesting it. The request is only made after a successful preference save. If the shared backend preference is already enabled, the settings form is initially pristine and there is no clear action that requests iOS authorization. The app therefore remains in the `prompt` state, does not register a token, and may not appear in the iOS Notifications settings list.

The current Capacitor push registration event also yields an APNs device token on iOS. The backend sends registered tokens through Firebase Admin, which requires a Firebase registration token rather than a raw APNs device token.

## Functional Requirements

### Separate Account And Device State

- `pushNotificationsEnabled` remains the account-level intent to receive push notifications.
- iOS notification authorization remains device-specific and is never inferred from the backend preference.
- Enabling or denying notifications on one device does not silently change the account-level preference for other devices.
- Android notification behavior remains unchanged.

### Enable Notifications On This Device

- When the account preference is enabled and iOS authorization is `prompt` or `prompt-with-rationale`, Settings displays an explicit `Enable notifications on this device` action.
- The action is available without requiring an unrelated preference change or save.
- Tapping the action requests iOS notification authorization in direct response to the user gesture.
- The app does not automatically show the iOS authorization dialog merely because the app launched or the Settings page opened.
- While the request and registration are running, the action prevents duplicate submissions and communicates progress.

### Permission Outcomes

- If authorization is granted, the app registers for remote notifications and registers the resulting FCM token with the backend.
- If authorization is denied, the account preference remains enabled and Settings explains that notifications must be enabled in iOS Settings.
- If authorization was previously denied, the app does not attempt to show the system prompt again.
- When the app resumes, Settings refreshes authorization so a change made in iOS Settings is reflected without reinstalling the app.
- Unsupported environments, including the web build, do not show the device enablement action.

### iOS FCM Registration

- The iOS app initializes Firebase Core and Firebase Messaging using the configured `GoogleService-Info.plist`.
- The APNs token is associated with the Firebase Messaging installation.
- The token submitted to `POST /api/v1/notifications/devices` for platform `IOS` is an FCM registration token.
- A refreshed or rotated FCM token is re-registered with the backend.
- The app never submits a raw APNs device token to the FCM-backed delivery endpoint.
- Firebase initialization or token failures produce diagnosable logs and a recoverable registration state without crashing the app.

### Signing And Configuration

- The application identifier is `com.mgrtech.veya` in Apple Developer, Firebase, Xcode, and the signed app.
- Push Notifications capability is enabled for the iOS target and App ID.
- The Firebase iOS application configuration contains the APNs authentication key used by the Apple Developer team.
- Debug builds use the APNs sandbox environment.
- TestFlight and App Store builds are signed with the production `aps-environment` entitlement.
- Secrets and the real `GoogleService-Info.plist` remain outside source control; the example file remains safe to commit.

## Acceptance Criteria

- Given a fresh TestFlight installation with `pushNotificationsEnabled = true` on the account and undetermined iOS authorization, opening Settings displays `Enable notifications on this device`.
- Tapping that action displays the native iOS notification authorization prompt without changing another preference.
- Allowing the prompt results in one enabled `IOS` device registration containing an FCM token.
- The app then appears under the device's notification settings and can receive a Firebase test notification while backgrounded.
- Denying the prompt preserves `pushNotificationsEnabled = true` and displays device-settings guidance.
- Returning from iOS Settings after granting authorization causes registration to be retried.
- Reopening Settings or resuming the app does not display a duplicate system prompt.
- Existing Android permission, token registration, receipt, and routing tests continue to pass.

## Non-Goals

- Do not change notification payload intent routing.
- Do not add provisional, critical, or time-sensitive notification authorization.
- Do not automatically enable the account-level push preference.
- Do not add direct APNs delivery to the backend as part of this ticket.
- Do not request notification permission on unauthenticated launch.

## Dependencies

- Existing push registration reconciliation service.
- Existing notification device registration endpoints.
- Firebase iOS app for bundle identifier `com.mgrtech.veya`.
- Apple Push Notification authentication key configured in Firebase.
- A TestFlight-capable distribution profile for the app identifier.
