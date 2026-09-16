# External SMS Contact Invitations Design

## Delivery Decision

Use the device's native SMS composer, not a server-side SMS provider.

- iOS: present `MFMessageComposeViewController` with the recipient and body prefilled.
- Android: launch an `ACTION_SENDTO` intent with the `smsto:` scheme and `sms_body`.
- Web/no SMS capability: use Web Share or copy the invitation link.

This has no Veya SMS API cost and keeps the user in control. The user's mobile plan may charge for the message. It also avoids sender-number provisioning, country-specific A2P registration, deliverability infrastructure, and direct-SMS permissions.

There is no dependable permanently free production SMS API. Provider trials are suitable only for development and do not change the delivery design.

## End-To-End Flow

### Existing Veya Recipient

1. The sender chooses or enters a phone number and submits it.
2. The backend finds a verified Veya account.
3. The backend creates the normal `PENDING_ACCEPTANCE` invitation.
4. The frontend shows the ordinary in-app success state and does not open SMS.

### External Recipient

1. The sender chooses or enters a phone number and submits it.
2. The backend finds no verified Veya account.
3. The backend creates an `AWAITING_SIGNUP` invitation with a 30-day expiry.
4. The response includes an opaque HTTPS invitation URL valid no later than that invitation's expiry.
5. The frontend adds/refreshes the outgoing pending row, then opens the native SMS composer.
6. The user reviews, edits, sends, or cancels in the system UI.
7. Veya keeps the backend invitation in `AWAITING_SIGNUP` regardless of the composer result.

Create the backend invitation before presenting the composer because the link needs a server record and the native handoff may terminate or background the app.

## SMS Composer Boundary

Add a `NativeSmsComposerService` under `core/platform`. Components must not call native APIs directly.

Suggested app-facing contract:

```ts
export interface SmsDraft {
  recipient: string;
  body: string;
}

export type SmsComposeResult =
  | { kind: 'sent' }
  | { kind: 'cancelled' }
  | { kind: 'presented' }
  | { kind: 'failed' }
  | { kind: 'unavailable' };
```

- `sent` and `cancelled` can be reported where the native platform provides them.
- Android should normally return `presented` after a successful intent handoff because it has no dependable send/delivery result.
- No result changes backend invitation status.
- `isAvailable()` controls whether the UI prefers SMS or a share/copy fallback.

Implement a narrow local Capacitor plugin for iOS MessageUI and use an Android intent adapter for `ACTION_SENDTO`. Do not request `SEND_SMS`; Veya must never bypass the system composer.

## Message Content

Keep the first message short and editable. Example:

```text
Hi! I'd like to connect with you on Veya. Join me here: {inviteUrl}
```

- Localize the surrounding copy in the client.
- Use only the backend-provided `inviteUrl`; the client must not construct or sign invitation URLs.
- Do not include the recipient phone number, private nickname, or other contact data in the body or URL.
- Do not claim the message was delivered.

## Invitation Link And Token

Use an HTTPS universal/app link such as:

```text
https://<veya-link-domain>/invite/<opaque-token>
```

Token requirements:

- at least 128 bits of cryptographically secure entropy;
- single-purpose and bound server-side to one invitation;
- stored as a hash, never plaintext;
- unusable after cancellation, expiry, acceptance, or rejection;
- excluded from query parameters where analytics tooling might capture it;
- not returned by outgoing-list endpoints.

The initial create and `share-link` calls may issue fresh tokens tied to the same invitation. Previously shared links remain valid until the invitation changes lifecycle or expires, so sharing again does not break an SMS the recipient already received. A successful claim is atomic and makes every token for that invitation unusable for another claim.

## Link Routing And Claiming

The existing app-link/deep-link entry point should recognize `/invite/:token` and store a pending invite intent in memory plus session-safe storage until authentication and phone verification finish.

Resolution flow:

1. Send the token to an authenticated backend claim/resolve operation; do not decode identity data client-side.
2. If logged out, route through registration/login while retaining the pending intent.
3. Require the account to have a verified phone number equal to the invitation's normalized recipient number.
4. On a match, atomically attach the recipient account and transition to `PENDING_ACCEPTANCE`.
5. Route the recipient to the existing incoming invitation UI.
6. Require explicit accept or reject.

Suggested operation:

```http
POST /api/v1/contacts/invitations/claim
Content-Type: application/json

{
  "token": "<opaque-token>"
}
```

Return the ordinary incoming invitation identifier after a successful claim. All invalid, expired, cancelled, already-used, or phone-mismatch failures use safe error codes and UI copy that does not reveal the expected phone number.

Claiming and state transition must be transactional so concurrent attempts cannot attach multiple accounts.

## Sender Pending UI

Load outgoing invitations separately from incoming invitations and accepted contacts via `GET /api/v1/contacts/invitations/outgoing`.

Display external rows using:

- `nickName`, falling back to `Someone you invited`;
- `Awaiting signup` status;
- relative creation or expiry information;
- `Share again` and `Cancel` actions.

Do not display the raw phone number. `Share again` requests a fresh share link, builds the message draft, and opens SMS/share. Cancellation uses the existing invitation deletion endpoint and refreshes state.

An app resume, pull-to-refresh, or normal Contacts-page reload fetches current server state. Push notifications may prompt a refresh but remain navigation hints only.

## Create Response Handling

Change the frontend invitation submission branch from a single response path to `deliveryMethod`:

- `IN_APP`: reset the form, refresh, and show `Invitation sent.`
- `EXTERNAL_SMS`: reset the form after the invitation is safely recorded, refresh outgoing state, and open the composer.

If opening the composer fails, show `Your invitation was created, but Messages could not be opened.` with `Share invite` and copy-link recovery actions. Never retry message presentation automatically.

## Duplicate And Retry Behavior

- Enforce one active invitation per sender and normalized recipient number.
- A duplicate create returns a stable `CONTACT_INVITATION_ALREADY_PENDING` error and the active invitation identifier when safe.
- The frontend refreshes outgoing invitations and directs the sender to `Share again` rather than creating another record.
- Share-link issuance is independently rate-limited and issues a new token for the same invitation.
- Expired or cancelled invitations require a new create action.

## Data Retention

- Keep the normalized recipient number encrypted at rest, with a keyed lookup value if indexed matching is required.
- Do not rely on an unsalted phone-number hash; phone numbers have a small enumerable search space.
- Delete or irreversibly anonymize the recipient number after expiry/rejection/cancellation once operational abuse-retention requirements permit.
- Keep aggregate, non-identifying delivery metrics separately.
- Do not send the phone number or invite token to analytics.

## Error Handling

- SMS unavailable: offer share/copy without treating invitation creation as failed.
- Composer cancelled: no error; keep `AWAITING_SIGNUP` and make `Share again` available.
- Composer failed: show recovery actions; keep the invitation.
- Share-link issuance failed: keep the row and allow retry.
- Claim phone mismatch: show safe guidance to verify the invited number without displaying it.
- Expired/cancelled/used token: show a generic unavailable-invitation state.
- Rate limit: show a retry-later message and do not open a composer without a valid link.

Branch on backend error codes rather than localized message text.

## Testing Strategy

API/service tests:

- create response mapping for `IN_APP` and `EXTERNAL_SMS`;
- outgoing invitation loading;
- fresh share-link issuance;
- cancellation;
- claim success and safe failures.

Frontend tests with injected native fakes:

- external create opens a correctly addressed editable draft;
- in-app create never opens SMS;
- sent, cancelled, presented, failed, and unavailable compose outcomes;
- cancellation/failure leaves the outgoing pending row;
- share-again and copy-link recovery;
- raw phone numbers and tokens are absent from pending-list UI and logs;
- deep-link intent survives auth/phone setup and routes to incoming acceptance.

Backend tests:

- atomic existing-user versus external creation;
- duplicate/rate-limit rules;
- 30-day expiry;
- token hashing, repeated issuance, and lifecycle invalidation;
- exact verified-phone claim requirement;
- concurrent and replayed claims;
- lifecycle transitions and cleanup.

Physical-device smoke checks:

- iOS composer send/cancel/failure behavior;
- Android SMS intent handoff and back navigation;
- no-SIM/no-SMS fallback;
- install/open link routing;
- new registration, existing login, wrong-number, expired-link, and cancelled-link paths.

## Tradeoffs

- Native composition avoids Veya messaging costs and silent-send permissions, but Veya cannot guarantee or measure delivery.
- Creating the pending record before the composer means cancelled drafts remain pending; explicit `Share again` and `Cancel` actions make that state recoverable and honest.
- Requiring verified-phone matching adds friction but prevents a forwarded or stolen link from creating the wrong relationship.
