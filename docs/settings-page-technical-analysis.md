# Settings Page Technical Analysis

Implementation spec:
- `docs/specs/settings/requirements.md`
- `docs/specs/settings/design.md`
- `docs/specs/settings/tasks.md`

## Current State

The main tab pages render a repeated settings icon:

```html
<ion-button class="page-settings-button" aria-label="Open settings" title="Settings preview">
  <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
</ion-button>
```

Known occurrences:
- `src/app/features/home/home.page.html`
- `src/app/features/availability/availability.page.html`
- `src/app/features/contacts/contacts.page.html`
- `src/app/features/matches/matches.page.html`

The button currently has no navigation or click handler. `settings-outline` is already registered in `src/app/app.component.ts`.

## Relevant Existing API Surface

Profile:
- Existing model: `src/app/core/api/model/user-private-profile-view.model.ts`
- Existing request: `src/app/core/api/request/update-profile.request.ts`
- Existing service method: `UserService.getMe()`
- Missing service method: `UserService.updateMe(payload: UpdateProfileRequest)`

Preferences:
- Existing model: `src/app/core/api/model/user-matching-preferences-view.model.ts`
- Existing request: `src/app/core/api/request/update-preferences.request.ts`
- Missing service methods:
  - `getPreferences()`
  - `updatePreferences(payload: UpdatePreferencesRequest)`

Auth:
- `AuthService.logout()` currently exists, but the backlog tracks backend logout separately in Ticket 4.

## Recommended Product Shape

Use a routed settings page at `/tabs/settings` or `/settings` if settings will also serve phone-number-required redirects from match flows. A routed page gives cleaner browser/device back behavior and can be reused by validation flows that need to send the user to phone setup.

Use an Ionic modal only if settings is meant to remain a lightweight account/preferences panel opened exclusively from tab headers.

Given the MVP backlog already needs phone-number setup and retry flows, a routed page is the safer default.

## UI Requirements

The settings view should contain two editable groups plus logout:

Profile:
- `displayName`
- `timezone`
- `phoneNumber`

Preferences:
- `timezone`
- `allowChat`
- `allowCall`
- `quietHoursStart`
- `quietHoursEnd`
- `pushNotificationsEnabled`
- `suggestionNotificationsEnabled`

`timezone` appears in the requested settings list and on the user profile contract. Unless the backend exposes a separate preference timezone later, the UI should bind timezone to the profile update payload and show it once in the profile/account section.

## Data Flow

On page enter:
1. Load `GET /api/v1/users/me`.
2. Load `GET /api/v1/users/preferences`.
3. Populate one reactive form from both responses.

On save:
1. Split form values into `UpdateProfileRequest` and `UpdatePreferencesRequest`.
2. Send profile and preferences updates.
3. Keep unsaved values in the form if either request fails.
4. Refresh from backend after successful saves if the API returns no updated body.

The save action can be one combined button. If partial saves are allowed, the UI must clearly report which section failed; otherwise, treat any failed request as a failed save and leave the form editable.

## Time And Validation Notes

Backend `LocalTime` fields should be sent as strings such as `HH:mm` or `HH:mm:ss`, depending on the OpenAPI contract. The existing TypeScript request allows `string | null`, so the Angular form can use Ionic time inputs and normalize empty values to `null`.

Validation recommendations:
- Require a non-empty display name only if the backend requires it.
- Validate phone number lightly on the client, then rely on backend validation for canonical acceptance.
- Use an IANA timezone value, defaulting to the current browser timezone when profile timezone is missing.
- Allow quiet hours to be fully unset by sending both fields as `null`.
- If only one quiet-hours field is set, either block save with client validation or let backend validation return the final rule.

## Routing And Template Changes

Create a single settings destination and replace repeated inert buttons with a consistent action:
- Routed page option: add `routerLink="/tabs/settings"` or route through a shared header component.
- Modal option: add a shared settings launcher method/service and use the same handler everywhere.

Avoid duplicating settings form logic in every page. If the repeated page header markup keeps growing, extract a shared page header component that accepts a title and settings action.

## Implementation Dependencies

This ticket depends on:
- Ticket 2 for `PUT /api/v1/users/me`
- Ticket 3 for preferences API methods
- Ticket 4 for backend logout completion, if backend logout must be part of first settings release

It unblocks:
- Ticket 11 phone number setup flow
- Notification preference editing for Ticket 13 and Ticket 15

## Suggested Test Coverage

Service tests:
- `UserService.updateMe()` sends `PUT /api/v1/users/me` with `UpdateProfileRequest`.
- Preferences API loads and saves the expected URLs and payloads.

Settings page tests:
- Initial load patches profile and preference values into the form.
- Save sends profile and preference payloads with normalized time values.
- Save failure leaves form values intact and shows an error state.
- Logout calls auth logout and routes away from protected tabs.
