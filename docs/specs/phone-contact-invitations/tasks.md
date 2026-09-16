# Phone Contact Invitations Tasks

Status: Planned

## Backend Contract

- [ ] Change `POST /api/v1/contacts/invitations` to accept `phoneNumber` in E.164 format instead of `email`.
- [ ] Normalize and validate the submitted number server-side before matching.
- [ ] Match only an existing account's unique normalized phone number.
- [ ] Define and test stable errors for unknown number, self-invite, existing contact, duplicate active invitation, and blocked relationships.
- [ ] Ensure incoming pending invitations expose a safe display name and do not require sender email or raw phone number for presentation.
- [ ] Publish/update the backend API contract before releasing the client.

## Native Selection Boundary

- [ ] Add a `NativeContactPickerService` (or equivalent adapter) under `core/platform` with selected, cancelled, and unavailable outcomes.
- [ ] Add a local `SingleContactPicker` Capacitor plugin backed by `CNContactPickerViewController` on iOS.
- [ ] Add the local Android implementation using `ACTION_PICK` scoped to phone data and the selected result URI only.
- [ ] Add only the native privacy configuration actually required by the selection-only implementation.
- [ ] Confirm the adapter has no full-address-book read API and does not log selected contact data.
- [ ] Add adapter tests for availability, selection mapping, cancellation, and operational failure.

## Phone Form And Selection UX

- [ ] Replace the Contacts page email control with country, national-number, and optional nickname controls.
- [ ] Reuse the shared phone country and normalization utilities.
- [ ] Replace email-specific invitation copy, attributes, validation, and placeholders.
- [ ] Add `Choose from contacts` only when native selection is available; keep manual entry available on every platform.
- [ ] Populate the form from a selected contact with one usable phone number.
- [ ] Add an accessible number-choice sheet for a selected contact with multiple usable numbers.
- [ ] Handle contacts with no usable phone number without clearing the form.
- [ ] Prefill, expose, and allow editing of the selected display name as the optional nickname without overwriting existing input.
- [ ] Preserve all form values on picker cancellation and API errors.
- [ ] Prevent duplicate picker and submit actions while operations are in progress.

## API Client And State

- [ ] Change `SendInvitationRequest.email` to `phoneNumber`.
- [ ] Update `ContactsService` and its HTTP tests for the exact phone request payload.
- [ ] Update `ContactsPageDataService` tests and invitation fixtures.
- [ ] Remove `senderEmail` from the pending invitation model and display fallback once the backend response no longer provides it.
- [ ] Handle `CONTACT_INVITEE_NOT_FOUND` as a `not on Veya` product outcome while keeping the form populated.
- [ ] Refresh contacts state and reset the form after a successful invitation.

## Verification

- [ ] Add Contacts page tests for manual normalization and invalid-number validation.
- [ ] Add Contacts page tests for zero, one, and multiple picked phone numbers.
- [ ] Add tests for picker cancellation, unavailability, and operational failure.
- [ ] Add tests proving picker selection alone does not call the invitation endpoint.
- [ ] Add tests for success reset/refresh and error value preservation.
- [ ] Confirm no invitation request, UI copy, or test fixture still uses email as the invitee identifier.
- [ ] Run focused contacts/phone tests, typecheck, lint, and the broader frontend test suite.
- [ ] Smoke-test picker privacy, cancellation, number choice, normalization, and submission on a physical iOS device.
- [ ] Smoke-test picker privacy, cancellation, selection, normalization, and submission on a physical Android device.
- [ ] Smoke-test the manual fallback in the browser.

## Follow-Up (Separate Spec)

- [x] Specify external invitations for phone numbers without a Veya account in `external-sms-contact-invitations`, including SMS/share handoff, opaque invite links, sender-visible pending state, expiry/cancellation, and conversion after verified signup.
