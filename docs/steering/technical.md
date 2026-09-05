# Technical Steering

## Architecture Rules

- Keep API calls in `core/api` services or feature data services.
- Keep components focused on view state and user actions.
- Keep auth, token storage, API models, requests, and interceptors under `core`.
- Keep screen implementations under `features`.
- Keep reusable UI under `shared/ui`.
- Prefer standalone Angular components and existing Ionic patterns.

## API Rules

- Model backend DTO fields exactly in TypeScript.
- Use typed request and response interfaces for every endpoint.
- Branch business behavior on backend `ApiError.code`, not localized text.
- Do not compute backend-owned matching decisions in the client.
- Do not build WhatsApp URLs or expose raw phone numbers outside intended profile/setup UI.

## UI Rules

- Follow the design system: warm, soft, rounded, mobile-first.
- Reuse existing shared buttons and section components where practical.
- Repeated page header controls should be shared or wired consistently.
- Every interactive button must have a real action, disabled state, or explicit pending-task reason.

## State And Validation Rules

- Represent loading, saving, success, and error states explicitly for networked forms.
- Keep unsaved form values after failed saves.
- Normalize empty optional fields to `null` when backend contracts use nullable values.
- Validate lightly on the client, then rely on backend validation for canonical rules.

## Testing Rules

- Add `HttpTestingController` tests for new API service methods.
- Add focused component or data-service tests for load/save/error behavior.
- Keep tests scoped to the changed behavior.
- Run the narrowest useful test first, then broader checks before release.

