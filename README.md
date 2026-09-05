# Veya

Frontend application for **Veya**, the mobile client for Sponti: a private, invite-only social matching product that helps people reconnect with trusted contacts when availability naturally lines up.

> "A serendipity engine for existing relationships: I already know people I like, but modern life prevents spontaneous contact."

## Concept

Veya answers a simple question:

> "Who among my trusted contacts is free right now?"

The product is intentionally private and lightweight. It is not a public availability broadcast, a dating app, or a friend-discovery network. Users manage a trusted circle, define moments when they are open to reconnecting, and can use **Free now** for spontaneous availability.

## Current Product Scope

- Authentication: onboarding, registration, login, token storage, refresh handling, and guarded app routes.
- Home dashboard: readiness state, next best action, contact snapshot, upcoming availability, and Free now entry point.
- Contacts: accepted contacts, invitations, accept/remove/block/edit flows.
- Availability: recurring rules, temporary overrides, effective weekly preview, and active/future override display.
- Mobile shell: Ionic tab navigation with Capacitor-ready output.

## Tech Stack

- Angular 20 with standalone components
- Ionic 8
- Capacitor 8
- RxJS
- SCSS
- Jasmine / Karma
- Angular ESLint

## Runtime Versions

The project currently targets:

- Node.js: `v20.19.6`
- npm: `11.4.2`
- TypeScript: `~5.9.0`
- Angular CLI: `^20.0.0`

## Project Structure

```text
src/app
├── core
│   ├── api             # API models, requests, and HTTP services
│   ├── auth            # Auth state, token storage, and route guard
│   ├── interceptors    # HTTP interceptors such as Bearer auth
│   └── models
├── features
│   ├── auth            # Onboarding, login, registration
│   ├── availability    # Rules, overrides, weekly preview
│   ├── contacts        # Contacts and invitations
│   ├── home            # Dashboard and readiness view
│   └── tabs            # App shell navigation
└── shared
    ├── ui              # Reusable visual components
    └── utils
```

## API Configuration

The app talks to the Sponti API through `environment.apiBaseUrl`.

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
};
```

Production builds replace `environment.ts` with `environment.prod.ts` through Angular file replacements. The production environment points at:

```text
https://api.sponti.uk
```

Use a production build before syncing/installing the Android app on a physical device when you want it to communicate with the Azure-hosted API.

## Push Notification Setup

Native push registration is disabled by default until the mobile build is configured for Firebase Cloud Messaging.

For Android:

1. Create/register the Android app in Firebase using application id `com.mgrtech.veya`.
2. Add Firebase's `google-services.json` to:

```text
android/app/google-services.json
```

3. Enable native push registration in the Angular environment used for the device build:

```ts
nativePushNotificationsConfigured: true
```

4. Rebuild and sync the native project:

```bash
npm run build:prod
npx cap sync android
```

Without `google-services.json`, Android push token registration cannot work. The app will keep the in-app notification preference, but it will skip native token registration for that build.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the backend

Run the Sponti API locally on:

```text
http://localhost:8080
```

The frontend expects the backend auth, contacts, users, and availability endpoints to be available under `/api/v1`.

### 3. Start the frontend

```bash
npm start
```

This runs:

```bash
ng serve
```

Open the local URL printed by Angular, usually:

```text
http://localhost:4200
```

## Available Scripts

```bash
npm start
```

Runs the development server.

```bash
npm run build
```

Builds the app into `www/`, which is also the Capacitor web directory.

```bash
npm run build:prod
```

Builds with the production Angular configuration.

```bash
npm run watch
```

Builds continuously in development mode.

```bash
npm run typecheck
```

Runs TypeScript validation without emitting files.

```bash
npm run lint
```

Runs Angular ESLint.

```bash
npm test
```

Runs Jasmine/Karma tests.

```bash
npm run test:ci
```

Runs tests once in Chrome Headless with coverage enabled.

## Mobile Builds

Capacitor is configured with:

```text
appId: com.mgrtech.veya
appName: veya
webDir: www
```

Build the web assets first:

```bash
npm run build
```

Use the production API for device builds:

```bash
npm run build:prod
npx cap sync android
```

Then sync Capacitor platforms when native projects are added:

```bash
npx cap sync
```

## Domain Notes

### Contacts

Contacts are private and invitation-based. The UI separates accepted contacts from pending invitations and supports relationship actions such as accepting, removing, blocking, and editing contact metadata.

### Availability

Availability is represented through:

- recurring rules, such as a weekly time window
- temporary overrides, such as one-off availability or unavailability
- effective availability, returned by the backend after rules and overrides are combined

The availability page requests only ongoing or future overrides using the `endsAfter` query parameter and still applies a defensive client-side filter.

### Home Readiness

Readiness is intentionally not based on recurring availability rules. A user can use Veya with contacts, Free now, and temporary availability without defining a weekly routine.

## Development Guidelines

- Keep API calls in services or feature data services, not directly in components.
- Keep feature components focused on view state and user actions.
- Prefer existing shared UI components and page patterns.
- Keep auth, API, and interceptor concerns under `core`.
- Keep feature-specific mapping and formatting in feature-local `data` utilities when it is not shared.
- Write focused tests for API services, auth behavior, and feature data mapping.

## Spec-Driven Development

Veya uses lightweight spec-driven development for feature work that changes user flows, backend contracts, navigation, or shared UI patterns.

Project steering:

- [Product steering](docs/steering/product.md)
- [Technical steering](docs/steering/technical.md)

Feature specs live under [docs/specs](docs/specs/README.md). Each feature/workstream spec should contain:

- `requirements.md`: user outcomes, scope, endpoints, non-goals, and acceptance criteria
- `design.md`: routing, components, services, state, validation, error handling, and tradeoffs
- `tasks.md`: ordered implementation checklist with testing work

When adding a new feature, create or update the relevant spec before implementation. Keep the spec and completed task checklist committed with the code changes.

## Testing Notes

The test suite uses Angular's TestBed, Jasmine, Karma, and `HttpTestingController` for API services.

Useful focused test examples:

```bash
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api/services/availability.service.spec.ts'
```

```bash
npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/features/home/data/*.spec.ts'
```

## Related Backend

Veya is designed to work with the Sponti API backend. The backend owns:

- authentication and refresh tokens
- users and profiles
- contacts and invitations
- availability rules and overrides
- effective availability calculation
- future matching and notification logic

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for project conventions.

Recommended workflow:

1. Create a feature or bugfix branch.
2. Create or update the relevant spec under `docs/specs`.
3. Keep changes scoped and small.
4. Update the spec task checklist as work is completed.
5. Run typecheck, lint, and relevant tests.
6. Open a pull request with a clear summary and verification notes.

## License

No license file is currently included in this repository.
