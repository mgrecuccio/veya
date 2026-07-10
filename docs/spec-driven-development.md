# Spec-Driven Development

This project uses lightweight spec-driven development for feature work that changes user flows, backend contracts, navigation, or shared UI patterns.

## Structure

Project steering lives in:
- `docs/steering/product.md`
- `docs/steering/technical.md`

Feature specs live in:
- `docs/specs/<feature-name>/requirements.md`
- `docs/specs/<feature-name>/design.md`
- `docs/specs/<feature-name>/tasks.md`

The active spec catalog lives in `docs/specs/README.md`.

## Workflow

1. Requirements
   - Define the user outcome and acceptance criteria.
   - Use backend endpoint names and DTO fields exactly.
   - Call out non-goals and dependencies.

2. Design
   - Describe routing, components, services, state, validation, and error handling.
   - Identify shared UI or API patterns to reuse.
   - Note tradeoffs that affect implementation.

3. Tasks
   - Break implementation into small, verifiable steps.
   - Keep tasks ordered by dependency.
   - Include tests next to the behavior they protect.

4. Implementation
   - Implement from the tasks file.
   - Update tasks as work is completed.
   - Do not change feature scope silently; update requirements/design first.

## Definition Of Ready

A feature is ready to implement when:
- Requirements list the user-visible behavior and acceptance criteria.
- Design identifies the route/dialog choice, API services, data flow, and validation rules.
- Tasks can be completed independently without re-deciding the feature shape.
- Dependencies and blockers are explicit.

## Definition Of Done

A feature is done when:
- Acceptance criteria are met.
- Required API methods are typed and tested.
- Main page or data-service states cover loading, empty, success, and error where applicable.
- Existing tests pass, and new risky behavior has focused tests.
- Docs are updated if behavior, API assumptions, or project rules changed.
