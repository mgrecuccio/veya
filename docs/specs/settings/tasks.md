# Settings Tasks

Status: Implemented

## 1. API Surface

- [x] Add `UserService.updateMe(payload: UpdateProfileRequest)`.
- [x] Add preferences load/update service methods.
- [x] Add service tests for profile update URL, method, and payload.
- [x] Add service tests for preferences load/update URL, method, and payload.

## 2. Routing And Entry Points

- [x] Add guarded settings route.
- [x] Create settings page files.
- [x] Wire the home settings icon to the settings route or launcher.
- [x] Wire the availability settings icon to the settings route or launcher.
- [x] Wire the contacts settings icon to the settings route or launcher.
- [x] Wire the matches settings icon to the settings route or launcher.
- [x] Remove `Settings preview` title text once the action is real.

## 3. Settings Form

- [x] Add reactive form controls for profile fields.
- [x] Add reactive form controls for preference fields.
- [X] Load profile and preferences on page enter.
- [X] Populate loading, loaded, and error states.
- [x] Add display name input.
- [x] Add timezone selector/input.
- [x] Add phone number input.
- [x] Add chat and call toggles.
- [x] Add quiet hours inputs.
- [x] Add push and suggestion notification toggles.

## 4. Save Behavior

- [x] Split form values into profile and preferences payloads.
- [x] Normalize blank optional values to `null`.
- [x] Normalize quiet hours to backend-compatible time strings.
- [x] Save profile changes through `PUT /api/v1/users/me`.
- [x] Save preference changes through `PUT /api/v1/users/preferences`.
- [x] Show saving state while requests are pending.
- [x] Keep unsaved form values after failed saves.
- [x] Show success state after successful saves.

## 5. Logout

- [x] Add logout button.
- [x] Call existing auth logout behavior.
- [x] Route away from protected tabs after logout.
- [x] Integrate backend logout when Ticket 4 is implemented.
- [x] Preserve local logout fallback if backend logout fails.

## 6. Tests

- [x] Test initial load patches profile and preference values.
- [x] Test save sends normalized profile and preference payloads.
- [x] Test save failure keeps edited form values.
- [x] Test logout calls auth service and navigates away.
- [x] Run the relevant focused tests.
