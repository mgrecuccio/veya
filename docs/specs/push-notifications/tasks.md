# Push Notifications Tasks

Status: Planned

- [ ] Add notification devices API service.
- [ ] Add device registration request tests.
- [ ] Integrate Capacitor/Ionic push permission flow.
- [ ] Add a shared push registration reconciliation flow.
- [ ] Run reconciliation on authenticated startup, after login, app resume, settings entry, push preference changes, and push token refresh.
- [ ] Check push permission before token registration.
- [ ] Reconcile backend push preference, OS permission, and device token registration in the shared flow.
- [ ] Register FCM/APNs token with backend.
- [ ] Listen for foreground notifications.
- [ ] Listen for notification tap/open events.
- [ ] Normalize payloads into navigation intents.
- [ ] Route proposal-created notifications to incoming matches.
- [ ] Route proposal-accepted notifications to accepted matches/detail.
- [ ] Route suggestions notifications to suggestions.
- [ ] Disable token on logout or notification opt-out where possible.
- [ ] Surface OS-denied notification state in settings when the app preference is enabled.
- [ ] Add focused tests for intent routing.
