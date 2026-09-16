# External SMS Contact Invitations Requirements

## Goal

Extend phone-based contact invitations so that selecting or entering a phone number with no Veya account creates an external pending invitation and lets the sender share it through the device's native SMS composer.

The invitation appears on the sender's Contacts screen while Veya waits for the recipient to register, verify the invited phone number, and accept the resulting contact request.

## User Stories

- As a user, I can invite a phone contact who does not yet use Veya instead of reaching a dead end.
- As a sender, I can review and edit the SMS before choosing to send it.
- As a sender, I can see, share again, or cancel an external invitation while it is awaiting signup.
- As an invited person, I can follow a secure link, install or open Veya, register with the invited number, and decide whether to accept the contact request.
- As a privacy-conscious user, I know Veya does not send messages silently or import my address book.

## User-Visible Behavior

- The phone invitation flow first attempts the existing `POST /api/v1/contacts/invitations` command.
- When the submitted number belongs to a Veya user, the existing in-app invitation flow is unchanged.
- When it does not belong to a Veya user, the backend creates an external invitation with status `AWAITING_SIGNUP` instead of returning `CONTACT_INVITEE_NOT_FOUND`.
- Veya then opens a system-owned SMS composer with:
  - the selected phone number as recipient;
  - short, editable invitation copy;
  - a backend-issued HTTPS invitation link.
- The sender must explicitly press Send in the system composer. Veya never sends SMS silently.
- Cancelling or failing to open the composer does not delete the external invitation. It remains visible so the sender can share it again or cancel it.
- Because Android and other handoff mechanisms cannot reliably confirm delivery, Veya never labels an external invitation `SMS sent`. The UI says `Awaiting signup` or `Invite created`.
- External invitations appear in a sender-facing pending section with the private nickname/contact name, creation date, expiration state, `Share again`, and `Cancel` actions.
- The raw recipient phone number is not displayed in pending-list UI.
- On devices without SMS capability, Veya offers the platform share sheet and copy-link fallback.
- On the web, Veya offers Web Share when supported and copy-link otherwise.

## Invitation Lifecycle

```text
AWAITING_SIGNUP -> PENDING_ACCEPTANCE -> ACCEPTED
       |                  |
       +-> CANCELLED      +-> REJECTED
       +-> EXPIRED
```

- `AWAITING_SIGNUP`: no matching Veya account existed when the invitation was created.
- `PENDING_ACCEPTANCE`: an account verified the invited phone number; the invitation now waits for the recipient's explicit acceptance.
- `ACCEPTED`: the recipient accepted and the normal contact relationship exists.
- `REJECTED`: the recipient rejected the in-app request.
- `CANCELLED`: the sender cancelled before acceptance.
- `EXPIRED`: the external invitation was not claimed within 30 days.
- Registration or link opening must never accept the contact relationship automatically.

## API Contract

### Create Invitation

Keep the phone-invitation endpoint introduced by `phone-contact-invitations`:

```http
POST /api/v1/contacts/invitations
Content-Type: application/json

{
  "phoneNumber": "+32470123456",
  "nickName": "Alex"
}
```

Return a discriminated result:

```ts
export type InvitationDeliveryMethod = 'IN_APP' | 'EXTERNAL_SMS';

export interface ContactInvitationView {
  id: number;
  senderUserId: number;
  recipientUserId?: number | null;
  nickName?: string | null;
  status: string;
  deliveryMethod: InvitationDeliveryMethod;
  inviteUrl?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}
```

- Existing recipient: return `deliveryMethod: 'IN_APP'`, `status: 'PENDING_ACCEPTANCE'`, and no `inviteUrl`.
- Unknown recipient: create the record and return `deliveryMethod: 'EXTERNAL_SMS'`, `status: 'AWAITING_SIGNUP'`, a backend-issued opaque `inviteUrl`, and `expiresAt`.
- The backend remains authoritative for matching the normalized phone number.
- `CONTACT_INVITEE_NOT_FOUND` is retired from this command once external invitations are enabled.

### List Sender Invitations

```http
GET /api/v1/contacts/invitations/outgoing
```

```ts
export interface OutgoingContactInvitationView {
  invitationId: number;
  nickName?: string | null;
  recipientDisplayName?: string | null;
  deliveryMethod: InvitationDeliveryMethod;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
}
```

The list response must not contain a raw recipient phone number or reusable invitation token.

### Create A Fresh Share Link

```http
POST /api/v1/contacts/invitations/{invitationId}/share-link
```

```ts
export interface InvitationShareLinkView {
  inviteUrl: string;
  expiresAt: string;
}
```

- Only the invitation sender can request a share link.
- The invitation must still be `AWAITING_SIGNUP`.
- `Share again` calls this endpoint immediately before opening the SMS/share UI.

### Cancel Invitation

Reuse:

```http
DELETE /api/v1/contacts/invitations/{invitationId}
```

Cancellation invalidates all outstanding links for that invitation.

## Acceptance Criteria

- A valid phone number with no Veya account creates an `AWAITING_SIGNUP` external invitation instead of producing a not-found error.
- The initial create response provides a backend-issued invitation link and opens a pre-addressed native SMS composer when SMS is available.
- The user can edit the recipient and message and must explicitly send from the system composer.
- Veya requests no direct-SMS permission and contains no unattended SMS-sending path.
- Composer cancellation, presentation failure, or unknown Android delivery outcome never marks the invitation as sent or accepted.
- An external invitation remains visible to the sender after composer cancellation.
- The sender can share again using a freshly authorized link and can cancel the invitation.
- Cancelling or expiring an invitation invalidates its links.
- Opening a valid link routes into Veya through an HTTPS universal/app link, or to an install/landing page when Veya is absent.
- The link intent survives installation/login/registration until it can be resolved safely.
- Only an account that verifies the exact invited phone number can claim the external invitation.
- Claiming transitions the invitation to `PENDING_ACCEPTANCE`; it does not create a contact automatically.
- The recipient can accept or reject through the existing incoming invitation flow.
- The sender's pending state refreshes after claim, acceptance, rejection, cancellation, and expiry; a claimed invitation is shown as `Awaiting acceptance`.
- Expired, cancelled, malformed, or already-used links show a safe outcome without revealing the invited phone number or account state.
- Duplicate active external invitations from the same sender to the same normalized number are prevented.
- Native composer, fallback sharing, lifecycle, and API behavior have focused tests.

## Privacy, Security, And Abuse Requirements

- Invitation links contain an opaque, cryptographically random token and no phone number or user identifier.
- Store only a non-reversible hash of each link token server-side.
- Treat the token as a secret and exclude it from logs, analytics, crash reports, and outgoing-list responses.
- A token alone is insufficient to claim an invitation; the authenticated account must verify the invited phone number.
- Retain the normalized invited number only as long as needed for claim/cancellation/abuse controls, then delete or irreversibly anonymize it after expiry according to the privacy policy.
- Rate-limit creation and share-link issuance per account, destination, device, and network risk signal.
- Reject premium-rate or invalid destinations when they can be identified safely.
- Do not disclose whether a number belongs to a Veya account through a general lookup endpoint.
- Provide report/block handling for abusive invitations before scaling the feature.
- SMS copy identifies the sender or Veya clearly and must not use deceptive urgency.

## Non-Goals

- Server-sent or automatic SMS through Twilio, AWS, or another messaging provider.
- Confirming carrier delivery, message reading, installation, or current app presence.
- Importing or matching the sender's complete address book.
- Automatically accepting a relationship after signup.
- Marketing campaigns, bulk invitations, or repeated automatic reminders.
- Supporting arbitrary custom invite-message templates in the first release.

## Dependencies And Blockers

- `phone-contact-invitations` must be implemented first.
- The backend needs an external invitation record, lifecycle transitions, expiry processing, and outgoing-list support.
- Veya needs a stable HTTPS domain configured for iOS Universal Links and Android App Links.
- Signup/login must preserve and resolve a pending invitation intent after phone verification.
- Legal/privacy review is required for storing phone numbers belonging to people who do not yet have Veya accounts.
