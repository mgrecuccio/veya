# Settings Tasks

## 1. API Surface

- [ ] Add `UserService.updateMe(payload: UpdateProfileRequest)`.
- [ ] Add preferences load/update service methods.
- [ ] Add service tests for profile update URL, method, and payload.
- [ ] Add service tests for preferences load/update URL, method, and payload.

## 2. Routing And Entry Points

- [ ] Add guarded settings route.
- [ ] Create settings page files.
- [ ] Wire the home settings icon to the settings route or launcher.
- [ ] Wire the availability settings icon to the settings route or launcher.
- [ ] Wire the contacts settings icon to the settings route or launcher.
- [ ] Wire the matches settings icon to the settings route or launcher.
- [ ] Remove `Settings preview` title text once the action is real.

## 3. Settings Form

- [ ] Add reactive form controls for profile fields.
- [ ] Add reactive form controls for preference fields.
- [ ] Load profile and preferences on page enter.
- [ ] Populate loading, loaded, and error states.
- [ ] Add display name input.
- [ ] Add timezone selector/input.
- [ ] Add phone number input.
- [ ] Add chat and call toggles.
- [ ] Add quiet hours inputs.
- [ ] Add push and suggestion notification toggles.

## 4. Save Behavior

- [ ] Split form values into profile and preferences payloads.
- [ ] Normalize blank optional values to `null`.
- [ ] Normalize quiet hours to backend-compatible time strings.
- [ ] Save profile changes through `PUT /api/v1/users/me`.
- [ ] Save preference changes through `PUT /api/v1/users/preferences`.
- [ ] Show saving state while requests are pending.
- [ ] Keep unsaved form values after failed saves.
- [ ] Show success state after successful saves.

## 5. Logout

- [ ] Add logout button.
- [ ] Call existing auth logout behavior.
- [ ] Route away from protected tabs after logout.
- [ ] Integrate backend logout when Ticket 4 is implemented.
- [ ] Preserve local logout fallback if backend logout fails.

## 6. Tests

- [ ] Test initial load patches profile and preference values.
- [ ] Test save sends normalized profile and preference payloads.
- [ ] Test save failure keeps edited form values.
- [ ] Test logout calls auth service and navigates away.
- [ ] Run the relevant focused tests.

