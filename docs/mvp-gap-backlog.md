# Sponti Angular MVP Gap Backlog

This backlog captures the Angular work needed to cover the current backend OpenAPI contract and complete the MVP flow described by the matching, notification, and WhatsApp contact-flow documentation.

Spec-driven development files live under `docs/specs/`. The catalog in `docs/specs/README.md` maps backlog tickets to feature/workstream specs.

## MVP Goal

Complete the mobile product loop:

1. A user configures profile, phone number, preferences, contacts, and availability.
2. The app shows backend-computed match suggestions.
3. The user creates a match proposal.
4. The candidate receives and responds to the incoming proposal.
5. Accepted matches can open a backend-generated WhatsApp link.
6. Push notifications act as navigation hints and always trigger backend refresh.

## Ticket 1: Align Shared API Models With Backend Contract - Done ✅

Priority: Critical

Implement or correct frontend DTOs so Angular matches the OpenAPI contract.

Scope:
- Fix `UserProfileView` / add `UserPrivateProfileView`.
- Fix numeric ids currently typed as strings.
- Add missing `channelType` to `EffectiveAvailabilityView`.
- Fix `EditContactRequest` to match `UpdateContactRequest`.
- Add shared `ApiError` model with stable backend `code`.
- Add missing models:
  - `UserMatchingPreferencesView`
  - `UpdatePreferencesRequest`
  - `UpdateProfileRequest`
  - `SuggestedMatchView`
  - `MatchInvitationView`
  - `MatchView`
  - `CreateMatchRequest`
  - `ContactLinkView`
  - `RegisterDeviceTokenRequest`
  - `DeleteDeviceTokenRequest`

Acceptance criteria:
- TypeScript DTOs reflect backend field names and primitive types.
- `id`, `userId`, `contactUserId`, `matchId`, and invitation ids use `number`.
- API error handling can branch on backend `error.code`.

## Ticket 2: Complete User Profile API

Priority: Critical

Add missing user profile operations.

Backend endpoints:
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`

Scope:
- Update `UserService.getMe()` to return the private profile shape.
- Add `UserService.updateMe(payload)`.
- Support updating:
  - `displayName`
  - `timezone`
  - `phoneNumber`

Acceptance criteria:
- The app can save a phone number after registration.
- The app can refresh profile state after update.
- Existing home/dashboard profile usage still works.

## Ticket 3: Add Matching Preferences API

Priority: Critical

The matching engine depends on user preferences for channel eligibility and notifications.

Backend endpoints:
- `GET /api/v1/users/preferences`
- `PUT /api/v1/users/preferences`

Scope:
- Add methods to `UserService` or a dedicated `PreferencesService`.
- Add model/request types for:
  - `allowChat`
  - `allowCall`
  - `quietHoursStart`
  - `quietHoursEnd`
  - `pushNotificationsEnabled`
  - `suggestionNotificationsEnabled`
- Add or prepare settings UI for editing preferences.

Acceptance criteria:
- App can load and update matching preferences.
- User can enable/disable chat and call matching.
- User can configure push/suggestion notification preferences when UI is present.

## Ticket 4: Complete Auth Logout Contract

Priority: Medium

Current logout only clears local storage. The backend also exposes logout.

Backend endpoint:
- `POST /api/v1/auth/logout`

Scope:
- Add backend logout call.
- Preserve local logout fallback if backend call fails.
- Ensure auth state is cleared after logout.

Acceptance criteria:
- Calling logout attempts backend logout.
- Tokens are cleared locally even if the backend request fails.
- Interceptor does not refresh during logout.

## Ticket 5: Complete Contact Invitation Actions

Priority: Medium

Angular supports accept but not reject or cancel.

Backend endpoints:
- `POST /api/v1/contacts/invitations/{invitationId}/reject`
- `DELETE /api/v1/contacts/invitations/{invitationId}`

Scope:
- Add `rejectInvitation(invitationId)` to `ContactsService`.
- Add `cancelInvitation(invitationId)` to `ContactsService`.
- Expose actions from contacts page/data service where applicable.

Acceptance criteria:
- Incoming invitations can be rejected.
- Outgoing pending invitations can be cancelled if the UI supports outgoing invites.
- Contacts state refreshes after action.

## Ticket 6: Implement Matches API Service

Priority: Critical

Create the Angular API layer for all matching endpoints.

Backend endpoints:
- `GET /api/v1/matches/suggestions`
- `POST /api/v1/matches`
- `GET /api/v1/matches/incoming`
- `PATCH /api/v1/matches/{id}/accept`
- `PATCH /api/v1/matches/{id}/decline`
- `GET /api/v1/matches/accepted`
- `POST /api/v1/matches/{matchId}/contact-link`

Scope:
- Add `MatchesService`.
- Add typed methods for suggestions, proposal creation, incoming invitations, accepted matches, accept/decline, and contact link.
- Add focused unit tests for request URL, method, params, and payload.

Acceptance criteria:
- Every matching endpoint has a typed Angular service method.
- Match creation sends only `candidateUserId` and `channelType`.
- Contact link is requested from backend and never built locally.

## Ticket 7: Replace Hardcoded Matches Page With Backend Data

Priority: Critical

The current matches page uses static preview data. Replace it with real accepted match data and state handling.

Scope:
- Load `GET /api/v1/matches/accepted`.
- Show loading, empty, error, and loaded states.
- Display useful accepted-match fields:
  - initiator/candidate display context where available
  - channel type
  - status
  - overlap time
  - created/responded time
- Refresh after relevant notification routing.

Acceptance criteria:
- No hardcoded matches remain.
- Empty state explains that accepted matches appear after both required consents exist.
- Backend errors are shown without breaking navigation.

## Ticket 8: Build Match Suggestions Flow

Priority: Critical

Users need a way to see backend-computed suggestions and create proposals.

Scope:
- Add suggestions section or page.
- Load `GET /api/v1/matches/suggestions`.
- Show max three suggestions returned by backend.
- Show candidate nickname, favorite flag, channel, score or user-friendly strength, and overlap time.
- Add action to create proposal through `POST /api/v1/matches`.
- Refresh suggestions after proposal creation.

Acceptance criteria:
- Suggestions are rendered from backend only.
- Creating a proposal does not send score or overlap fields.
- Duplicate proposal and validation errors are handled using backend error codes.

## Ticket 9: Build Incoming Match Invitations Flow

Priority: Critical

Candidates need to accept or decline proposals.

Scope:
- Add incoming invitations section or page.
- Load `GET /api/v1/matches/incoming`.
- Add accept action through `PATCH /api/v1/matches/{id}/accept`.
- Add decline action through `PATCH /api/v1/matches/{id}/decline`.
- Route accepted result to accepted match/detail flow.

Acceptance criteria:
- Incoming proposals can be accepted.
- Incoming proposals can be declined.
- Expired/stale proposal errors are handled gracefully.
- Candidate-only backend authorization errors are surfaced cleanly.

## Ticket 10: Add Match Detail And WhatsApp Handoff

Priority: Critical

The MVP ends with an accepted match opening WhatsApp via backend-generated link.

Backend endpoint:
- `POST /api/v1/matches/{matchId}/contact-link`

Scope:
- Add accepted match detail screen or equivalent modal.
- Show accepted match state.
- Add "Open WhatsApp" action.
- Call contact-link endpoint when user taps the action.
- Open returned `ContactLinkView.url` with platform link handling.
- Handle URL-open failure or WhatsApp-not-installed case.

Acceptance criteria:
- The app never constructs `wa.me` URLs.
- Push payloads are not used as source of truth for contact links.
- Contact link is only requested for accepted matches.
- Missing phone number and access errors route/show the right next step.

## Ticket 11: Add Phone Number Setup Flow

Priority: Critical

Phone number is optional during registration but required before the core WhatsApp outcome.

Scope:
- Keep registration phone number optional.
- Add profile/settings phone number edit UI.
- Save via `PUT /api/v1/users/me`.
- Pre-check phone number before:
  - creating a match proposal
  - accepting an incoming proposal
- Let users return to the interrupted match action after saving.

Acceptance criteria:
- User can add/update phone number after account creation.
- Missing phone number before proposal creation routes to setup.
- Missing phone number before acceptance routes to setup.
- After saving phone number, user can retry the original action.

## Ticket 12: Handle Phone-Number-Required Backend Errors

Priority: Critical

The backend remains the source of truth even if the app pre-checks profile state.

Backend error codes:
- `PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION`
- `PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE`

Scope:
- Extend API error mapping to preserve backend `code`.
- On proposal creation error, route initiator to phone setup.
- On accept error, route candidate to phone setup.
- Preserve enough UI state to retry after successful profile update.

Acceptance criteria:
- Backend phone-number-required errors do not appear as generic failures.
- User sees a clear path to add phone number.
- Retry path works after phone number save.

## Ticket 13: Implement Notification Device Registration

Priority: Critical for device MVP

Push delivery requires device token registration.

Backend endpoints:
- `POST /api/v1/notifications/devices`
- `DELETE /api/v1/notifications/devices`

Scope:
- Add `NotificationsService`.
- Register token with:
  - `platform`
  - `token`
  - `deviceId`
  - `appVersion`
- Disable token on logout or notification opt-out when appropriate.
- Integrate with Capacitor/Ionic push notification APIs if the app targets real devices.

Acceptance criteria:
- Device token is sent to backend after successful permission/token acquisition.
- Token is disabled through backend when needed.
- Failures do not block normal app usage.

## Ticket 14: Implement Push Notification Routing

Priority: Critical for device MVP

Push payloads are navigation hints only. The app must refresh backend state.

Notification types:
- `MATCH_PROPOSAL_CREATED`
- `MATCH_PROPOSAL_ACCEPTED`
- `MATCH_SUGGESTIONS_AVAILABLE`

Scope:
- On `MATCH_PROPOSAL_CREATED`, route to incoming matches and call `GET /matches/incoming`.
- On `MATCH_PROPOSAL_ACCEPTED`, route to match detail or accepted matches and refresh from backend.
- On `MATCH_SUGGESTIONS_AVAILABLE`, route to suggestions and call `GET /matches/suggestions`.
- Ignore stale payload state and tolerate missing/expired matches.

Acceptance criteria:
- Notification taps navigate to the right area.
- Each route performs a backend refresh.
- WhatsApp URL and raw phone numbers are never expected in push payloads.

## Ticket 15: Integrate Firebase Push Notification Receipt

Priority: Critical for device MVP

The backend sends push notifications through Firebase Cloud Messaging when Firebase is configured. The Angular/Ionic app must be able to receive those FCM notifications on device and connect them to the notification routing behavior.

Scope:
- Add Capacitor/Ionic push notification setup for real devices.
- Request notification permission at the appropriate point in the app lifecycle.
- Retrieve the device FCM/APNs token from the platform push API.
- Register that token through `POST /api/v1/notifications/devices`.
- Listen for foreground push notifications.
- Listen for notification tap/open events when the app is backgrounded or killed.
- Normalize Firebase payload data into internal app navigation intents.
- Route based on backend notification metadata:
  - `MATCH_PROPOSAL_CREATED`
  - `MATCH_PROPOSAL_ACCEPTED`
  - `MATCH_SUGGESTIONS_AVAILABLE`
- On logout, notification opt-out, or token invalidation, disable the token through `DELETE /api/v1/notifications/devices` where possible.

Acceptance criteria:
- On a physical or representative device, the app obtains a push token.
- The push token is registered with the backend using platform, token, device id, and app version.
- A Firebase-delivered `MATCH_PROPOSAL_CREATED` notification opens or refreshes incoming matches.
- A Firebase-delivered `MATCH_PROPOSAL_ACCEPTED` notification opens or refreshes accepted match/detail state.
- A Firebase-delivered `MATCH_SUGGESTIONS_AVAILABLE` notification opens or refreshes suggestions.
- Foreground notifications do not render stale push payload data as final state.
- Notification payloads never include or expect WhatsApp URLs or raw phone numbers.

## Ticket 16: Add Proposal Expiration UX

Priority: Medium

The backend excludes expired incoming proposals and rejects stale actions, but the app should still behave cleanly.

Scope:
- Display expiration information if backend exposes `expiresAt`.
- Handle expired proposal errors on accept/decline/contact-link.
- Refresh incoming/accepted lists after stale action failures.

Acceptance criteria:
- Users are not left on stale pending states after expiration errors.
- Copy avoids pressuring the other user.
- Accepted matches remain contactable if backend allows that product decision.

## Ticket 17: Add Backend Error Code Handling Across API Layer

Priority: Critical

The OpenAPI contract says mobile clients should branch on stable `code`, not localized `detail`.

Scope:
- Add shared error parsing helper or interceptor pattern.
- Preserve `ApiError.code`.
- Update auth error mapping from frontend-only codes where possible.
- Add match/contact/profile error handling for known business cases:
  - `MATCH_ALREADY_EXISTS`
  - `MATCH_PROPOSAL_EXPIRED`
  - `PHONE_NUMBER_REQUIRED_FOR_MATCH_ACCEPTANCE`
  - `PHONE_NUMBER_REQUIRED_FOR_MATCH_PROPOSAL_CREATION`
  - `CHANNEL_NOT_ALLOWED`
  - `AVAILABILITY_OVERLAP_NOT_FOUND`
  - `MATCH_SCORE_BELOW_THRESHOLD`
  - `CONTACT_BLOCKED`

Acceptance criteria:
- Feature code can switch on backend error `code`.
- Unknown errors still show a generic retry message.
- Tests cover at least phone-number-required and duplicate proposal mapping.

## Ticket 18: Add Tests For New API Surface

Priority: Medium

The existing code has service specs. Keep that pattern for the new API layer.

Scope:
- Add unit tests for:
  - `UserService.updateMe`
  - preferences API
  - match API
  - notification devices API
  - contact reject/cancel
- Add focused page/data-service tests for suggestions and incoming flows.

Acceptance criteria:
- Each new service method has URL/method/payload assertions.
- Main match flows have success and error-path tests.
- Existing tests continue to pass.

## Ticket 19: MVP End-To-End Smoke Checklist

Priority: Critical before release

Use this as the final manual verification checklist.

Checklist:
- Register without phone number.
- Add contacts and availability.
- Configure matching preferences with at least one channel enabled.
- View match suggestions.
- Try creating proposal without phone number and confirm setup route.
- Add phone number.
- Create proposal.
- Candidate receives/loads incoming proposal.
- Candidate tries accepting without phone number and confirms setup route.
- Candidate adds phone number.
- Candidate accepts proposal.
- Initiator sees accepted match or receives accepted notification.
- Firebase push notification opens the correct app screen.
- Accepted match opens backend-generated WhatsApp link.
- Notification tap refreshes backend state rather than rendering stale payload data.

Acceptance criteria:
- The full loop can be completed on a real or representative device.
- No client-side WhatsApp URL generation exists.
- No raw phone number is displayed outside intended profile/setup UI.

## Ticket 20: Build Settings Page Or Dialog

Priority: Critical

Each main page currently renders a settings icon button with `page-settings-button`, but the button is only a preview affordance. Add a real settings destination and connect the repeated settings buttons to it.

Spec files:
- `docs/specs/settings/requirements.md`
- `docs/specs/settings/design.md`
- `docs/specs/settings/tasks.md`

Scope:
- Decide whether settings should be a routed page or Ionic modal dialog. Prefer a routed page if settings should support deep links, browser back, or phone-number-required redirects; prefer a modal if it remains lightweight account/preferences editing from tab pages.
- Replace the repeated inert settings buttons in page templates with a shared settings action pattern.
- Add a settings view with:
  - logout button
  - display name edit
  - timezone edit
  - phone number edit
  - `allowChat`
  - `allowCall`
  - `quietHoursStart`
  - `quietHoursEnd`
  - `pushNotificationsEnabled`
  - `suggestionNotificationsEnabled`
- Load profile data from `GET /api/v1/users/me`.
- Save profile fields through `PUT /api/v1/users/me`.
- Load preferences from `GET /api/v1/users/preferences`.
- Save preferences through `PUT /api/v1/users/preferences`.
- Wire logout to the app auth service and backend logout ticket when available.
- Show loading, saving, success, validation, and API error states.

Acceptance criteria:
- Tapping the settings icon from home, availability, contacts, and matches opens the same settings experience.
- User can edit and save display name, timezone, and phone number.
- User can edit and save all listed preference fields.
- Quiet hours accept nullable `LocalTime` values and send backend-compatible time strings.
- Logout clears local auth state and routes the user out of protected tabs.
- Failed profile/preference saves do not discard the user's unsaved form values.
- Settings UI is covered by focused unit tests for load, save, error, and logout behavior.

## Suggested Implementation Order

1. Ticket 1: Align API models.
2. Ticket 2: Complete profile API.
3. Ticket 3: Add preferences API.
4. Ticket 20: Build settings page or dialog.
5. Ticket 6: Implement matches API service.
6. Ticket 7: Replace hardcoded accepted matches.
7. Ticket 8: Build suggestions flow.
8. Ticket 9: Build incoming invitations flow.
9. Ticket 11 and 12: Add phone setup and phone-number error handling.
10. Ticket 10: Add match detail and WhatsApp handoff.
11. Ticket 13, 14, and 15: Add notification device registration, Firebase push receipt, and routing.
12. Ticket 4 and 5: Fill remaining auth/contact contract gaps.
13. Ticket 16, 17, 18, and 19: Polish, harden, test, and release-check.

## Out Of Scope For Angular MVP

These are backend-owned or future concerns and should not be implemented as client decisions:

- Computing match score.
- Deciding whether a proposal can be accepted.
- Constructing WhatsApp URLs.
- Storing raw phone numbers in match/contact UI.
- Treating push payload data as source of truth.
- Implementing symmetric two-party response state unless backend changes the contract.
