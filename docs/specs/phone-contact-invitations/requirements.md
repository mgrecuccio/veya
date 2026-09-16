# Phone Contact Invitations Requirements

## Goal

Replace contact invitations by email with invitations by phone number. A user can choose one person through the device's native contact picker or enter a phone number manually, without Veya importing or scanning the full address book.

## User Stories

- As a user, I can choose a person from my phone contacts so I do not need to remember or copy their number.
- As a user, I can enter a phone number manually when contact picking is unavailable or I prefer not to use it.
- As a privacy-conscious user, I can use contact picking without granting Veya ongoing access to my complete address book.
- As a web user, I can still invite a contact by entering their phone number manually.

## User-Visible Behavior

- The Contacts page no longer asks for an email address when creating an invitation.
- Opening the invitation form presents two paths:
  - `Choose from contacts` on a supported native platform.
  - Manual phone-number entry, which is always available.
- `Choose from contacts` opens the operating system's single-contact picker. Veya does not load the full contact list into its own UI.
- If the selected contact has more than one phone number, the user chooses one before continuing.
- A selected contact populates the phone-number form. Its display name may prefill the existing optional nickname field and remains editable before submission.
- Cancelling the native picker leaves the form open and does not show an error.
- A valid phone number is submitted in E.164 format.
- A successful request closes the form, refreshes contact state, and shows the existing invitation success feedback.
- A failed request keeps the entered or selected number and nickname so the user can correct or retry them.
- If the phone number does not belong to a Veya account, this first step shows a clear `not on Veya` outcome and does not create an invitation.

## API Contract

Change the existing endpoint rather than adding a user-search endpoint:

```http
POST /api/v1/contacts/invitations
Content-Type: application/json

{
  "phoneNumber": "+32470123456",
  "nickName": "Alex"
}
```

Request DTO:

```ts
export interface SendInvitationRequest {
  phoneNumber: string;
  nickName?: string;
}
```

- `phoneNumber` is required and must be a valid E.164 number.
- `nickName` remains optional and keeps its current maximum length of 100 characters.
- The success response remains `ContactInvitationView` unless the backend contract changes separately.
- The backend must normalize and validate the number independently; client normalization is not authoritative.
- The backend matches against the unique normalized phone number of an existing Veya user.
- The backend must reject inviting the current user's own number, an existing contact, a duplicate active invitation, or an unknown number using stable API error codes.
- `CONTACT_INVITEE_NOT_FOUND` represents a number with no matching Veya account in this phase. The frontend must branch on the code, not the backend's localized message.
- The endpoint performs an invitation command only. This work does not introduce a general phone-number lookup or contact-discovery endpoint.

## Acceptance Criteria

- No invitation UI, request DTO, copy, or test fixture uses email as the invitation identifier.
- A supported native build can open a system-owned picker for one contact without first loading the full address book.
- Veya processes only the contact returned by the picker.
- A contact with one usable number fills the invitation form directly.
- A contact with multiple usable numbers requires an explicit number choice.
- A contact with no usable number produces clear feedback and leaves manual entry available.
- Manual entry uses a country selector and national-number field and converts valid input to E.164 before submission.
- Numbers returned by the native picker are normalized to E.164. When a local-format number has no country information, the user must confirm or select the country before submission.
- Invalid phone numbers cannot be submitted and have an inline validation message.
- Native picker cancellation does not clear existing form input or show an error.
- Picker unavailability or failure does not block manual entry.
- During submission, duplicate submission is prevented.
- On API failure, the form values are preserved.
- `CONTACT_INVITEE_NOT_FOUND` produces a user-facing `not on Veya` message; it is not presented as a technical failure.
- Contacts service, page/data service, and Contacts page tests cover the new request shape and the picker/manual-entry branches.
- Native behavior is verified on physical iOS and Android devices before release.

## Privacy And Security Requirements

- Do not request, retrieve, upload, cache, or persist the user's full address book.
- Do not add a full-contact-list permission solely for this feature when the platform's selection-only picker does not require it.
- Do not submit contact data until the user explicitly sends the invitation.
- Send only the selected normalized phone number and the visible optional nickname.
- Do not log contact names or phone numbers.
- Explain any platform privacy prompt with concise, purpose-specific copy.

## Non-Goals

- Importing, syncing, searching, or matching the entire device address book.
- Showing only contacts who already use Veya.
- Determining whether Veya is currently installed on another person's device.
- Creating an external pending invitation for a number that has no Veya account.
- Opening an SMS/share composer or generating an install/referral link.
- Automatically connecting users when an invited person later registers.
- Changing incoming invitation accept/reject, contact blocking, favorites, or nickname management.

## Dependencies And Blockers

- The backend must deploy the phone-based `POST /api/v1/contacts/invitations` contract before the updated client is released.
- Every account eligible to receive an invitation must have a unique normalized phone number.
- A selection-only local Capacitor bridge is required for both iOS and Android.
- The follow-up SMS/share invitation flow needs a separate spec and backend lifecycle for invitations awaiting signup.
