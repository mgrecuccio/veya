# Product Steering

## Product Intent

Veya is a private, invite-only social matching app for trusted contacts. It helps users reconnect when availability naturally lines up.

The app is not:
- a public availability broadcast
- a dating app
- a friend discovery network
- a place to expose raw contact details outside intended account/profile flows

## UX Principles

- Keep the product loop lightweight: contacts, availability, suggestions, proposals, accepted match handoff.
- Treat backend state as the source of truth for suggestions, proposals, accepted matches, and contact links.
- Prefer calm, clear flows over dense configuration.
- Preserve user input when saves fail.
- Route users to missing setup steps, especially phone number setup, without losing the interrupted action.

## Settings Requirements

Settings is the account and preference management surface. It must let users:
- log out
- edit display name
- edit timezone
- edit phone number
- edit matching and notification preferences

Settings must be reachable from the repeated settings icon in main tab pages.

## Notification And Contact Rules

- Push notifications are navigation hints only.
- Notification taps must refresh backend state before rendering final content.
- WhatsApp/contact handoff links must come from the backend.
- The frontend must not construct WhatsApp URLs.

