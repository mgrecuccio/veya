# External SMS Contact Invitations Tasks

Status: Planned

## Backend Lifecycle

- [ ] Extend phone invitation creation to return `IN_APP` or create an `EXTERNAL_SMS` invitation with `AWAITING_SIGNUP` status.
- [ ] Add the external invitation recipient-number storage, 30-day expiry, and lifecycle transitions.
- [ ] Prevent duplicate active invitations per sender and normalized recipient number.
- [ ] Add authenticated rate limits and abuse controls for creation and share-link issuance.
- [ ] Generate opaque high-entropy invite tokens, store only token hashes, and exclude secrets from logs.
- [ ] Add token issuance/invalidation for sharing again, cancellation, expiry, claim, rejection, and acceptance without breaking previously shared active links.
- [ ] Add `GET /api/v1/contacts/invitations/outgoing` without raw phone numbers or tokens.
- [ ] Add `POST /api/v1/contacts/invitations/{id}/share-link` with sender/status authorization.
- [ ] Add transactional `POST /api/v1/contacts/invitations/claim` with exact verified-phone matching.
- [ ] Connect a successful claim to the existing incoming accept/reject lifecycle without auto-acceptance.
- [ ] Add expiry/retention cleanup and tests for concurrent/replayed claims.

## App And Link Routing

- [ ] Configure the invitation HTTPS domain for iOS Universal Links and Android App Links.
- [ ] Add `/invite/:token` intent parsing without logging or analytically tracking the token.
- [ ] Preserve a pending invite intent through install/open, login, registration, and phone verification.
- [ ] Resolve/claim the token only through the backend and route a successful claim to incoming invitations.
- [ ] Add safe invalid, expired, cancelled, used, and phone-mismatch outcomes.

## Native SMS And Sharing

- [ ] Add `NativeSmsComposerService` under `core/platform`.
- [ ] Add a narrow local iOS bridge for `MFMessageComposeViewController` with availability and result mapping.
- [ ] Add Android `ACTION_SENDTO`/`smsto:` handoff with the recipient and `sms_body`.
- [ ] Confirm neither platform requests direct-SMS permission or has an unattended send path.
- [ ] Add Web Share/platform share fallback and copy-link fallback.
- [ ] Localize concise editable invitation copy around the backend-issued URL.
- [ ] Add adapter tests for sent, cancelled, presented, failed, and unavailable outcomes.

## Sender Experience

- [ ] Update invitation response models with `deliveryMethod`, nullable recipient, link, and expiry fields.
- [ ] Branch submission behavior between in-app and external invitations.
- [ ] Refresh outgoing state before or alongside opening the composer.
- [ ] Add sender-facing outgoing pending rows without displaying raw phone numbers.
- [ ] Add `Share again` using a fresh link and `Cancel` using the existing delete endpoint.
- [ ] Keep external invitations `Awaiting signup` regardless of composer result.
- [ ] Provide recovery actions when SMS composition is unavailable, cancelled, or fails.
- [ ] Replace the first-phase `CONTACT_INVITEE_NOT_FOUND` UI with the external invitation path.

## Recipient Experience

- [ ] Add install/landing behavior for invitation links when Veya is absent.
- [ ] Preserve attribution from landing/install into app startup where platform support allows it.
- [ ] Require registration/login and verified invited-number matching before claim.
- [ ] Present the claimed invitation through the existing explicit accept/reject UI.
- [ ] Refresh sender and recipient state after every lifecycle transition.

## Privacy, Abuse, And Verification

- [ ] Complete privacy/legal review for storing non-user phone numbers and document retention.
- [ ] Add encrypted recipient storage and a keyed lookup strategy; do not use plain phone hashes.
- [ ] Add monitoring for invitation creation abuse without logging phone numbers or tokens.
- [ ] Add report/block handling required before broad rollout.
- [ ] Test create/list/share/cancel/claim APIs and every lifecycle transition.
- [ ] Test composer outcomes and share/copy fallbacks with injected platform fakes.
- [ ] Test deep-link preservation through logged-out registration and phone verification.
- [ ] Test token replay, repeated issuance, expiry, cancellation, phone mismatch, and concurrent claims.
- [ ] Run frontend typecheck, lint, focused tests, and the broader test suite.
- [ ] Smoke-test the full sender and recipient journey on physical iOS and Android devices.
