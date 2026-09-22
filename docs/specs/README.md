# Feature Specs

Each feature/workstream spec uses:
- `requirements.md` for user outcomes, scope, endpoints, and acceptance criteria.
- `design.md` for implementation shape, routing, services, state, validation, and tradeoffs.
- `tasks.md` for ordered, verifiable work items.

## Spec Map

| Spec | Backlog tickets | Status | Purpose |
| --- | --- | --- | --- |
| `settings/` | 2, 3, 4, 20 | Planned | Settings, profile, preferences, logout entry point |
| `matches-api/` | 6 | Planned | Typed matching API service |
| `accepted-matches-list/` | 7 | Done | Backend-loaded accepted matches list |
| `match-suggestions/` | 8 | Done | Suggestions UI and proposal creation |
| `incoming-match-invitations/` | 9, 16 | Planned | Incoming proposals, accept/decline, expiration UX |
| `match-detail-whatsapp-handoff/` | 10 | Done | Accepted match detail and backend contact link |
| `phone-number-setup/` | 11, 12 | Planned | Phone setup redirects and retry behavior |
| `push-notifications/` | 13, 14, 15 | Planned | Device registration, Firebase receipt, routing |
| `ios-push-notifications/` | Follow-up to 13, 14, 15 | Planned | Per-device iOS permission enablement, FCM token registration, and TestFlight validation |
| `contact-invitations/` | 5 | Planned | Reject/cancel contact invitation actions |
| `phone-contact-invitations/` | Follow-up to 5 | In progress | Phone-addressed invitations with a privacy-preserving native single-contact picker |
| `external-sms-contact-invitations/` | Follow-up to `phone-contact-invitations` | Planned | Invite non-members through a user-confirmed native SMS/share flow and track signup-pending invitations |
| `error-handling/` | 17 | Done | Backend error code handling |
| `mvp-smoke/` | 18, 19 | Planned | Test coverage and release smoke checklist |

Do not split every backlog ticket into its own spec by default. Prefer a spec per coherent product or technical workstream.

## Status Values

- `Planned`: spec exists, implementation has not started.
- `In progress`: implementation has started.
- `Blocked`: work cannot continue without backend, product, or technical input.
- `Done`: implemented, tested, and task checklist completed.
- `Deferred`: intentionally postponed.
