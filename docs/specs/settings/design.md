# Settings Design

## Recommended Shape

Use a routed settings page by default.

Recommended route:
- `/tabs/settings` if settings belongs inside the authenticated tab shell.
- `/settings` if settings should sit outside tabs but remain guarded.

A routed page is preferred because phone-number-required flows can redirect users to settings and return them to interrupted match actions later.

Use a modal only if settings remains a lightweight panel launched exclusively from tab pages.

## Components

Suggested files:
- `src/app/features/settings/settings.page.ts`
- `src/app/features/settings/settings.page.html`
- `src/app/features/settings/settings.page.scss`
- `src/app/features/settings/settings.page.spec.ts`
- optional `src/app/features/settings/data/settings-page-data.service.ts`

If repeated page headers keep growing, add a shared header component:
- `src/app/shared/ui/app-page-header/*`

## API Services

Extend `UserService`:
- `getMe(): Observable<UserPrivateProfileView>`
- `updateMe(payload: UpdateProfileRequest): Observable<UserPrivateProfileView>`
- `getPreferences(): Observable<UserMatchingPreferencesView>`
- `updatePreferences(payload: UpdatePreferencesRequest): Observable<UserMatchingPreferencesView>`

If `UserService` becomes too broad, create a dedicated `PreferencesService`, but keep all endpoint calls under `core/api/services`.

## Form Model

Use a reactive form with these controls:
- `displayName`
- `timezone`
- `phoneNumber`
- `allowChat`
- `allowCall`
- `quietHoursStart`
- `quietHoursEnd`
- `pushNotificationsEnabled`
- `suggestionNotificationsEnabled`

Bind `timezone` to profile data unless the backend later exposes a separate preference timezone.

## Data Flow

On page enter:
1. Load profile.
2. Load preferences.
3. Patch the form once both responses are available.
4. Show a recoverable error if either request fails.

On save:
1. Build `UpdateProfileRequest`.
2. Build `UpdatePreferencesRequest`.
3. Send both updates.
4. Show saving state while requests are in flight.
5. Keep edited values if either request fails.
6. Show success after both saves complete.

## Validation

- Use the browser timezone as a default if profile timezone is missing.
- Normalize blank optional strings to `null`.
- Normalize quiet-hour values to `HH:mm` or `HH:mm:ss`, matching backend expectations.
- Allow both quiet-hour fields to be `null`.
- If only one quiet-hour field is present, block save with a clear validation message unless backend contract explicitly allows partial quiet hours.

## Error Handling

- Show field-level validation errors when the client can determine them.
- Show a general API error for unknown backend failures.
- Preserve backend `ApiError.code` for future branching.
- Do not reset the form after a failed save.

## Navigation

For routed page:
- Wire settings icon buttons with a shared router link or header action.
- Keep route protected by existing auth guard.
- Back should return to the launching tab when possible.

For modal:
- Create one launcher method or service.
- Use the same launcher from every page.
- Dismiss only after explicit close, successful logout, or navigation.

