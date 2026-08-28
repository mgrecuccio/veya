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
| `accepted-matches-list/` | 7 | Planned | Backend-loaded accepted matches list |
| `match-suggestions/` | 8 | Planned | Suggestions UI and proposal creation |
| `incoming-match-invitations/` | 9, 16 | Planned | Incoming proposals, accept/decline, expiration UX |
| `match-detail-whatsapp-handoff/` | 10 | Planned | Accepted match detail and backend contact link |
| `phone-number-setup/` | 11, 12 | Planned | Phone setup redirects and retry behavior |
| `push-notifications/` | 13, 14, 15 | Planned | Device registration, Firebase receipt, routing |
| `contact-invitations/` | 5 | Planned | Reject/cancel contact invitation actions |
| `error-handling/` | 17 | Done | Backend error code handling |
| `mvp-smoke/` | 18, 19 | Planned | Test coverage and release smoke checklist |

Do not split every backlog ticket into its own spec by default. Prefer a spec per coherent product or technical workstream.

## Status Values

- `Planned`: spec exists, implementation has not started.
- `In progress`: implementation has started.
- `Blocked`: work cannot continue without backend, product, or technical input.
- `Done`: implemented, tested, and task checklist completed.
- `Deferred`: intentionally postponed.
