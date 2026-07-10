# Settings Requirements

## Goal

Create a real settings experience for the existing settings icon shown on main app pages. The settings experience must support logout, profile editing, and user preference editing.

## Users

Authenticated Veya users managing their account details, matching channels, quiet hours, and notification preferences.

## Functional Requirements

### Open Settings

Acceptance criteria:
- Tapping the settings icon from home opens the settings experience.
- Tapping the settings icon from availability opens the settings experience.
- Tapping the settings icon from contacts opens the settings experience.
- Tapping the settings icon from matches opens the settings experience.
- The same settings implementation is used from every entry point.

### Edit Profile

Fields:
- `displayName`
- `timezone`
- `phoneNumber`

Backend endpoints:
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`

Acceptance criteria:
- Settings loads the current private profile.
- The user can edit display name, timezone, and phone number.
- Saving profile fields sends `UpdateProfileRequest`.
- Failed saves keep the user's edited values visible.

### Edit Preferences

Fields:
- `allowChat`
- `allowCall`
- `quietHoursStart`
- `quietHoursEnd`
- `pushNotificationsEnabled`
- `suggestionNotificationsEnabled`

Backend endpoints:
- `GET /api/v1/users/preferences`
- `PUT /api/v1/users/preferences`

Acceptance criteria:
- Settings loads the current matching preferences.
- The user can enable or disable chat matching.
- The user can enable or disable call matching.
- The user can configure quiet hours start and end.
- The user can enable or disable push notifications.
- The user can enable or disable suggestion notifications.
- Quiet hours are sent as backend-compatible `LocalTime` strings or `null`.

### Logout

Acceptance criteria:
- Settings exposes a logout button.
- Logout clears local auth state.
- Logout routes the user away from protected app tabs.
- Backend logout is called when Ticket 4 is implemented.
- Local logout still completes if backend logout fails.

## Non-Goals

- Do not implement matching suggestions in settings.
- Do not show accepted match contact details in settings.
- Do not construct WhatsApp links.
- Do not expose phone numbers outside the profile editing field.

## Dependencies

- Ticket 2: profile update API.
- Ticket 3: preferences API.
- Ticket 4: backend logout, if included in the first release.

