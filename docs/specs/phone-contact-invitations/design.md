# Phone Contact Invitations Design

## Scope Boundary

An invitation to an existing Veya user is addressed by normalized phone number, with a native convenience for selecting exactly one contact.

The selected number still has to belong to an existing Veya account. Handling a non-member through SMS/share is intentionally deferred so this change does not require a new external-invitation lifecycle.

## Contacts Page Flow

Keep the invitation flow on the existing Contacts page.

1. The user opens `Invite a contact`.
2. On a supported native platform, the form shows `Choose from contacts` above the manual fields.
3. Manual input shows the existing phone country-selector pattern and a national-number input.
4. The user may optionally enter a nickname.
5. Selecting `Choose from contacts` opens a system-owned, single-contact picker.
6. On selection:
   - discard empty/non-phone properties;
   - if there are no usable numbers, show feedback and retain the form;
   - if there is one usable number, populate the form;
   - if there are multiple usable numbers, show a small Veya-owned choice sheet containing only that selected contact's numbers.
7. The user reviews the populated fields and explicitly taps `Send invitation`.
8. The page submits the E.164 number, retains input on error, and refreshes state on success.

The system picker is a selection surface, not the submit action. No backend call occurs merely because a contact was selected.

## Native Contact Picker Boundary

Add a platform adapter under `core/platform`, for example `NativeContactPickerService`. Components must not call a Capacitor plugin directly.

Suggested app-facing types:

```ts
export interface PickedPhoneNumber {
  label?: string | null;
  value: string;
}

export interface PickedContact {
  displayName?: string | null;
  phoneNumbers: PickedPhoneNumber[];
}

export type ContactPickResult =
  | { kind: 'selected'; contact: PickedContact }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' };
```

The adapter must:

- expose whether selection is supported;
- request one contact through a system-owned picker;
- distinguish user cancellation from an operational error;
- map native results into the minimal app-facing shape above;
- never expose a `getContacts` or full-address-book method;
- return `unavailable` on the browser so manual entry remains functional.

Implement a narrow local Capacitor plugin named `SingleContactPicker`; do not install a plugin that also exposes bulk address-book access.

- On iOS, present `CNContactPickerViewController` and return only the user's final selection.
- On Android, launch the system picker with `ACTION_PICK` scoped to phone data and read only the URI temporarily granted for the selected result.
- Register only a `pickContact` operation. The native bridge must not request or expose list, search, create, update, or delete operations.

Android may return the exact phone row selected by the user while iOS may return a contact with several phone numbers. The app-facing result supports both cases, and the number-choice sheet is shown only when more than one usable number is returned.

Do not add `NSContactsUsageDescription` or Android broad contacts permissions unless the chosen native implementation demonstrably requires them. Any required native privacy configuration must be documented next to the adapter.

## Phone Normalization

Reuse and, where necessary, extend `shared/phone/phone-number.util.ts` and the country selector already used for profile phone setup.

Manual entry:

- initialize the country from `getDefaultPhoneCountry()`;
- validate the national number with `libphonenumber-js`;
- submit only the result of `getNormalizedPhoneNumber()`.

Picked number:

- accept an already valid international number when it parses successfully;
- otherwise parse it using country metadata from the native result if available;
- otherwise populate the raw national value using the current form country and require successful validation before submission;
- display the normalized number for review without silently guessing a different country.

Deduplicate multiple picked phone entries after normalization. Preserve labels such as mobile/home only in the transient number-choice UI; labels are not sent to the backend.

The backend repeats parsing, validation, and canonicalization before matching.

## Form And State

The invitation form contains:

- `phoneCountry`
- `phoneNational`
- `nickName`

Add explicit local state for:

- native picker availability;
- picker in progress;
- selected-contact number choices;
- invitation submission in progress.

Picker and submit controls are disabled while their corresponding operation is in progress. Closing the invitation form resets its values and any transient selected-contact state. Cancelling only the native picker does not reset anything.

The nickname may be prefilled from the selected contact's display name, trimmed to 100 characters, only when the nickname field is currently empty. Because it is visible and editable before submission, the user controls whether it is sent.

## API And Models

`SendInvitationRequest` uses the following shape:

```ts
{ phoneNumber: string; nickName?: string }
```

Keep `ContactsService.sendInvitation()` and the endpoint path unchanged. Update its tests to assert the exact phone-based payload.

The pending invitation response contains `senderPhoneNumber` and may contain `senderDisplayName`. The Contacts page uses the display name first and falls back to the phone number when it needs an identifier.

## Error Handling

Use `getApiErrorMessage` for general backend errors, with focused behavior for stable invitation codes.

- `CONTACT_INVITEE_NOT_FOUND`: show that the person is not on Veya yet and keep the form populated. Do not open SMS/share in this phase.
- Invalid phone: show inline validation for client-detectable errors; preserve backend validation detail for rejected canonical values.
- Self-invite, duplicate invitation, existing contact, or blocked relationship: show the backend's code-mapped product message and retain form values.
- Picker cancelled: no toast or error.
- Picker unavailable: hide or disable the picker action and leave manual entry available.
- Picker operational failure: show concise feedback and leave manual entry available.

Do not branch on localized error-message text.

## Accessibility And Copy

- Use phone-specific labels, placeholders, input modes, autocomplete attributes, and validation text.
- Use `type="tel"`, `inputmode="tel"`, and `autocomplete="tel-national"` for the manual number field.
- Give the contact-picker control an accessible name that describes opening the device contact picker.
- The multiple-number sheet must be keyboard/focus accessible and identify each number by label plus a readable formatted number.
- Announce validation and picker errors through the page's established accessible feedback pattern.

## Testing Strategy

Unit-test the native boundary through an injected fake; browser tests must not invoke a real native picker.

Focused coverage:

- `ContactsService` posts `phoneNumber`.
- manual valid/invalid number normalization;
- selected contact with zero, one, and multiple phone numbers;
- duplicate selected numbers after normalization;
- nickname prefill does not overwrite user input;
- picker cancellation preserves the form and produces no error;
- unavailable/failed picker leaves manual entry usable;
- submit success resets and refreshes;
- submit failure, including `CONTACT_INVITEE_NOT_FOUND`, preserves form values;
- all invitation copy and controls describe phone-number entry.

Native smoke checks on a physical device:

- open, cancel, and complete the picker;
- choose a contact with zero, one, and multiple phone numbers;
- confirm Veya receives no unrelated contacts;
- verify permission/privacy behavior on supported OS versions;
- submit local-format and international-format selected numbers.

Run these checks on both iOS and Android, accounting for the platform-specific picker presentation.

## Tradeoffs

- The user must choose a contact before Veya can determine membership, but Veya avoids collecting the complete address book.
- A Veya-owned number chooser adds one step for contacts with several numbers, but makes the exact identifier sent to the backend explicit.
- Keeping manual input visible provides a reliable web fallback and recovery path when native selection is unavailable.
