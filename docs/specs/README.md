# Feature Specs

Each feature/workstream spec uses:
- `requirements.md` for user outcomes, scope, endpoints, and acceptance criteria.
- `design.md` for implementation shape, routing, services, state, validation, and tradeoffs.
- `tasks.md` for ordered, verifiable work items.

## Spec Map

| Spec | Backlog tickets | Purpose |
| --- | --- | --- |
| `settings/` | 2, 3, 4, 20 | Settings, profile, preferences, logout entry point |
| `matches-api/` | 6 | Typed matching API service |
| `match-suggestions/` | 8 | Suggestions UI and proposal creation |
| `incoming-match-invitations/` | 9, 16 | Incoming proposals, accept/decline, expiration UX |
| `match-detail-whatsapp-handoff/` | 7, 10 | Accepted matches, detail, backend contact link |
| `phone-number-setup/` | 11, 12 | Phone setup redirects and retry behavior |
| `push-notifications/` | 13, 14, 15 | Device registration, Firebase receipt, routing |
| `contact-invitations/` | 5 | Reject/cancel contact invitation actions |
| `error-handling/` | 17 | Backend error code handling |
| `mvp-smoke/` | 18, 19 | Test coverage and release smoke checklist |

Do not split every backlog ticket into its own spec by default. Prefer a spec per coherent product or technical workstream.

