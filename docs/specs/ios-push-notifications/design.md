# iOS Push Notifications Design

## State Model

Notification delivery is the intersection of independent account, device, and provider states:

| State | Source | Scope |
| --- | --- | --- |
| Push preference | `pushNotificationsEnabled` from the API | User account |
| Authorization | Capacitor/iOS notification permission | Installed iOS app |
| Registration | Current FCM registration token stored by the API | App installation |

The account preference controls whether Veya should send push notifications. It must not be used as proof that the current iOS installation has authorization or a deliverable token.

## User Experience

Settings remains the contextual place to request authorization.

When the preference is enabled:

- `prompt` or `prompt-with-rationale`: show `Enable notifications on this device`.
- `granted`: do not show an enablement action; reconcile token registration normally.
- `denied`: show instructions to enable notifications in iOS Settings.
- `unsupported`: hide native notification controls or present them as unavailable.

The enablement action is separate from the preferences save button. It invokes the shared reconciliation flow with `requestPermission: true`, so a user whose preference was enabled on Android can authorize iOS without manufacturing a dirty form state.

Do not request permission automatically during app initialization or page load. Apple authorization should follow an explicit action that provides context.

## Settings Integration

Extend `SettingsPage` with:

- a readable signal derived from `PushRegistrationReconciliationService.permissionState`
- an in-progress signal for the device enablement action
- an `enablePushOnThisDevice()` handler
- distinct UI for prompt, denied, and granted states

On settings data load:

1. Load the backend preference.
2. Refresh the current OS authorization.
3. Render the device action independently of form dirtiness.

On enablement action:

1. Disable the action against duplicate taps.
2. Call `reconcile({ requestPermission: true })`.
3. Let the reconciliation service request authorization only when the state is promptable.
4. If granted, register for remote notifications and wait for the provider token.
5. Reflect the final permission/registration state and show a concise success or failure message.

On app resume, the existing reconciliation trigger re-checks permission. If the preference is enabled and permission changed to granted in iOS Settings, registration proceeds without another prompt.

## FCM Token Strategy

The backend uses Firebase Admin `FirebaseMessaging.send(...)` for all registered device tokens. Therefore the iOS client must submit an FCM registration token.

The official Capacitor Push Notifications plugin remains responsible for:

- requesting notification authorization
- registering the application with APNs
- notification receipt callbacks
- notification action callbacks

Add Firebase Core and Firebase Messaging to the native iOS target, either through a maintained Capacitor Firebase Messaging integration compatible with Capacitor 8 or through a small native bridge owned by this project. Keep the Angular-facing boundary narrow so the implementation can be replaced without changing reconciliation logic.

The iOS provider integration must:

1. Configure Firebase once during application launch.
2. Receive the APNs token from `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`.
3. Associate the APNs token with Firebase Messaging when automatic delegate proxying does not do so.
4. Obtain the FCM registration token.
5. Emit initial and refreshed FCM tokens to `CapacitorPushPlatformService`.

`CapacitorPushPlatformService.tokens$` remains the normalized application boundary. Android continues emitting its existing FCM token. iOS emits the Firebase Messaging token instead of forwarding the raw Capacitor/APNs token.

## Token Lifecycle

- Register the latest FCM token after authorization is granted and an authenticated session exists.
- Re-register whenever Firebase reports a token refresh.
- Preserve idempotency: receiving the same token repeatedly may call the backend, but must not create duplicate active records.
- Store the last backend-registered FCM token locally for logout and device disable behavior.
- If the provider rotates from an old token to a new token, register the new token before removing local knowledge of the old token.
- Continue treating backend device deletion as best-effort during logout.

## Native Configuration

The Xcode target must contain:

- Push Notifications capability
- `GoogleService-Info.plist` in the application bundle
- Firebase Core and Firebase Messaging products
- Firebase configuration during `didFinishLaunchingWithOptions`
- Capacitor registration success and failure forwarding

Do not force `aps-environment` to `production` for every build. Let Xcode and the selected provisioning profile produce `development` for debug and `production` for TestFlight/App Store. Validate the entitlement in the signed archive rather than relying only on the source entitlement file.

Foreground presentation options are independent of registration. Configure `banner`, `list`, `sound`, and `badge` only according to the desired foreground product behavior.

## Error Handling And Observability

Use separate diagnostic stages so TestFlight failures can be located:

- `permission-check`
- `permission-request`
- `apns-registration`
- `firebase-configuration`
- `fcm-token`
- `backend-registration`

Logs must not contain full device tokens. Log only the stage, platform, status, and a redacted token suffix when necessary for correlation.

Registration failure must remain retryable on app resume and later reconciliation. A provider failure must not clear the user's account preference.

## Testing Strategy

### Unit Tests

- Settings renders the enablement action for enabled preference plus prompt permission.
- The action invokes reconciliation with `requestPermission: true` exactly once while pending.
- Denied state renders device-settings guidance and does not change the form preference.
- Granted and unsupported states hide the action.
- iOS provider adapter emits an FCM token, not the APNs token.
- Token refresh registers the new FCM token.
- Android behavior remains unchanged.

### Native/TestFlight Verification

Use a physical device and a new TestFlight build:

1. Confirm the signed application has `aps-environment = production`.
2. Start with an account whose backend preference is already enabled.
3. Confirm no permission dialog appears automatically.
4. Open Settings and use the device enablement action.
5. Allow authorization and verify the app appears in iOS notification settings.
6. Verify the backend stores an `IOS` FCM registration token.
7. Send a Firebase test notification to that FCM token while the app is backgrounded.
8. Verify notification receipt and tap routing.
9. Disable authorization in iOS Settings, resume Veya, and verify the blocked state.
10. Re-enable authorization, resume Veya, and verify registration recovers.

## Security And Privacy

- Do not commit production Firebase configuration secrets or APNs private keys.
- Treat FCM registration tokens as secrets in logs and support tooling.
- Do not place phone numbers, WhatsApp URLs, or other sensitive contact data in notification payloads.
