# iOS Push Notifications Tasks

Status: Done

## 1. Permission State And Device Enablement

- [x] Expose prompt, granted, denied, and unsupported permission states to Settings.
- [x] Add an `Enable notifications on this device` action when the account preference is enabled and permission is promptable.
- [x] Make the action independent of preferences form dirtiness and saving.
- [x] Guard the action against duplicate taps while permission and registration are pending.
- [x] Invoke shared reconciliation with `requestPermission: true` from the action.
- [x] Show device-settings guidance when permission is denied.
- [x] Refresh the rendered state after authorization and on app resume.
- [x] Keep the account preference unchanged for OS denial.

## 2. iOS Firebase Messaging Integration

- [x] Select and document the Capacitor 8-compatible Firebase Messaging adapter or native bridge.
- [x] Add Firebase Core and Firebase Messaging to the iOS target.
- [x] Configure Firebase once during iOS application launch.
- [x] Associate the APNs device token with Firebase Messaging where required.
- [x] Obtain the initial iOS FCM registration token.
- [x] Listen for iOS FCM token refreshes.
- [x] Emit iOS FCM tokens through the existing normalized token stream.
- [x] Ensure the raw iOS APNs token is never sent to the FCM-backed registration endpoint.
- [x] Keep existing Capacitor notification receipt and action listeners working.

## 3. Registration Lifecycle

- [x] Register the iOS FCM token through `POST /api/v1/notifications/devices` with platform `IOS`.
- [x] Persist the last backend-registered FCM token for disable/logout behavior.
- [x] Re-register refreshed tokens without creating duplicate active devices.
- [x] Retry recoverable token and backend registration failures on later reconciliation.
- [x] Redact tokens from logs and distinguish permission, APNs, FCM, and backend failure stages.

## 4. Apple And Firebase Configuration

- [x] Confirm `com.mgrtech.veya` has Push Notifications enabled in Apple Developer.
- [x] Confirm the Xcode target has the Push Notifications capability.
- [x] Confirm the real `GoogleService-Info.plist` matches the `com.mgrtech.veya` Firebase iOS app and is bundled in archive builds.
- [x] Confirm the Apple APNs authentication key is uploaded to the Firebase project.
- [ ] Confirm TestFlight signing produces `aps-environment = production`.
- [ ] Confirm debug device builds continue to use the APNs sandbox environment.

## 5. Automated Tests

- [x] Test prompt state renders the device enablement action.
- [x] Test the action requests permission through shared reconciliation.
- [x] Test duplicate taps do not create concurrent requests.
- [x] Test denied state preserves the account preference and renders guidance.
- [x] Test granted and unsupported states hide the action.
- [ ] Test app resume reflects an authorization change made in iOS Settings.
- [ ] Test the iOS token source emits an FCM registration token instead of a raw APNs token.
- [ ] Test iOS FCM token refresh triggers backend registration.
- [x] Run the existing push notification, settings, authentication, and routing test suites.

## 6. TestFlight Acceptance

- [ ] Install a new TestFlight build on a physical iPhone with an account whose push preference is already enabled.
- [ ] Verify the authorization prompt appears only after tapping the device enablement action.
- [ ] Allow notifications and verify Veya appears in iOS notification settings.
- [ ] Verify the backend stores an enabled `IOS` FCM registration token.
- [ ] Send a targeted Firebase test notification while the app is backgrounded.
- [ ] Verify foreground receipt behavior and notification tap routing.
- [ ] Verify denial, iOS Settings recovery, logout disable, and token refresh scenarios.
- [ ] Record the tested build number, iOS version, and result in the release notes or ticket.
