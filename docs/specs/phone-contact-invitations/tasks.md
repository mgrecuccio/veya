# Phone Contact Invitations Tasks

Status: In progress

## Backend Contract

- [ ] Change `POST /api/v1/contacts/invitations` to accept `phoneNumber` in E.164 format instead of `email`.
- [ ] Normalize and validate the submitted number server-side before matching.
- [ ] Match only an existing account's unique normalized phone number.
- [ ] Define and test stable errors for unknown number, self-invite, existing contact, duplicate active invitation, and blocked relationships.
- [ ] Ensure incoming pending invitations expose a safe display name and do not require sender email or raw phone number for presentation.
- [ ] Publish/update the backend API contract before releasing the client.

## Native Selection Boundary

- [x] Add a `NativeContactPickerService` (or equivalent adapter) under `core/platform` with selected, cancelled, and unavailable outcomes.
- [x] Add a local `SingleContactPicker` Capacitor plugin backed by `CNContactPickerViewController` on iOS.
- [x] Add the local Android implementation using `ACTION_PICK` scoped to phone data and the selected result URI only.
- [x] Add only the native privacy configuration actually required by the selection-only implementation.
- [x] Confirm the adapter has no full-address-book read API and does not log selected contact data.
- [x] Add adapter tests for availability, selection mapping, cancellation, and operational failure.

## Phone Form And Selection UX

- [x] Replace the Contacts page email control with country, national-number, and optional nickname controls.
- [x] Reuse the shared phone country and normalization utilities.
- [x] Replace email-specific invitation copy, attributes, validation, and placeholders.
- [x] Add `Choose from contacts` only when native selection is available; keep manual entry available on every platform.
- [x] Populate the form from a selected contact with one usable phone number.
- [x] Add an accessible number-choice sheet for a selected contact with multiple usable numbers.
- [x] Handle contacts with no usable phone number without clearing the form.
- [x] Prefill, expose, and allow editing of the selected display name as the optional nickname without overwriting existing input.
- [x] Preserve all form values on picker cancellation and API errors.
- [x] Prevent duplicate picker and submit actions while operations are in progress.

## API Client And State

- [x] Change `SendInvitationRequest.email` to `phoneNumber`.
- [x] Update `ContactsService` and its HTTP tests for the exact phone request payload.
- [x] Update `ContactsPageDataService` tests and invitation fixtures.
- [x] Remove `senderEmail` from the pending invitation model and display fallback once the backend response no longer provides it.
- [x] Handle `CONTACT_INVITEE_NOT_FOUND` as a `not on Veya` product outcome while keeping the form populated.
- [x] Refresh contacts state and reset the form after a successful invitation.

## Verification

- [x] Add Contacts page tests for manual normalization and invalid-number validation.
- [x] Add Contacts page tests for zero, one, and multiple picked phone numbers.
- [x] Add tests for picker cancellation, unavailability, and operational failure.
- [x] Add tests proving picker selection alone does not call the invitation endpoint.
- [x] Add tests for success reset/refresh and error value preservation.
- [x] Confirm no invitation request, UI copy, or test fixture still uses email as the invitee identifier.
- [x] Run focused contacts/phone tests, typecheck, lint, and the broader frontend test suite.
- [ ] Smoke-test picker privacy, cancellation, number choice, normalization, and submission on a physical iOS device.
- [ ] Smoke-test picker privacy, cancellation, selection, normalization, and submission on a physical Android device.
- [ ] Smoke-test the manual fallback in the browser.

## Follow-Up (Separate Spec)

- [x] Specify external invitations for phone numbers without a Veya account in `external-sms-contact-invitations`, including SMS/share handoff, opaque invite links, sender-visible pending state, expiry/cancellation, and conversion after verified signup.
