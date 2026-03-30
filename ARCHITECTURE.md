# Architecture Overview

## Principles
- Separation of concerns
- Feature-based structure
- Reusable UI
- Standalone Angular components

## Structure
src/app/
- core/
- features/
- shared/

## Layers

### core/
Global logic:
- API services
- Auth
- Interceptors
- Models

### features/
Screens:
- onboarding
- auth
- contacts
- availability
- matches

### shared/
Reusable UI and utilities

## Rule
Pages orchestrate, services handle logic, UI renders.
