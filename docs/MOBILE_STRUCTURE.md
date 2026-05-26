# Mobile Structure and Conventions

This app uses Expo Router, TypeScript, TanStack Query, Zustand, and small
service modules. Keep changes close to the existing boundaries below.

## Top-Level Folders

```text
app/          Expo Router screens and route groups
components/   reusable UI and domain components
constants/    static app constants, theme values, route metadata
hooks/        React Query hooks and screen-facing data hooks
providers/    app-level runtime providers mounted from app/_layout.tsx
services/     API clients, device APIs, local storage helpers
stores/       lightweight Zustand UI/session state
types/        shared API contracts and screen domain types
scripts/      local smoke checks and development utilities
```

## Route Groups

`app/(auth)` contains login and registration. It should only know about auth
forms, auth hooks, and navigation after a successful session.

`app/(exterior)` is the menstrual-calendar layer. It must remain useful on its
own: calendar, daily logs, cycle history, insights, health records, imports,
profile, and settings belong here.

`app/(interior)` is the Vera safety layer. It is protected by Vera unlock state
and consent checks in `app/(interior)/_layout.tsx`. Screens here can access
emergency contacts, monitored locations, active alerts, evidence, and Vera
settings.

Use route groups to express product boundaries. Do not import an interior screen
from an exterior screen; navigate between routes instead.

## Data Flow

Screen components should not call Axios directly.

```text
screen -> hook -> service -> backend
```

Use `services/api.ts` for HTTP configuration and auth interception. Add endpoint
wrappers under `services/` for exterior calendar features and under
`services/vera/` for Vera safety features.

Use hooks for loading, mutation, cache invalidation, and screen state derived
from server data. Query keys for Vera live in `hooks/vera/query-keys.ts`.

Shared request and response shapes belong in `types/`. Keep mobile types aligned
with backend DTOs and Prisma-backed responses.

## State Boundaries

Use Zustand only for local UI/session state that is not server data:

- `stores/auth.store.ts`: token/session hydration and the current auth snapshot.
- `stores/cycle.store.ts`: calendar selection and cycle UI helpers.
- `stores/vera.store.ts`: active alert id and short-lived Vera unlock state.

Server-owned data belongs in TanStack Query, not Zustand.

Sensitive local values must go through existing storage helpers:

- Auth token: `services/token-storage.ts`.
- Onboarding flag: `services/onboarding-storage.ts`.
- Vera active alert id: `services/vera/active-alert-storage.service.ts`.
- Vera biometric session: `services/vera/vera-session-storage.service.ts`.

## Components

Use `components/ui` before creating one-off primitives. Route-specific repeated
pieces should live under a domain folder such as `components/calendar`,
`components/day`, `components/profile`, `components/settings`, or
`components/vera`.

Keep screen files readable. If a screen needs repeated cards, panels, formatters,
or action rows, move them into `components/` once they become hard to scan.

## Vera Conventions

Vera code must stay consent-aware and discreet:

- Check the safety profile before starting monitoring or sensitive workflows.
- Request native permissions only from explicit user actions or consent screens.
- Do not record evidence from a UI action unless the user has consented and the
  device permission has been granted.
- Keep automatic location monitoring in providers/services, not in screen UI.
- Keep Vera API contracts under `types/vera.types.ts`.
- Keep Vera backend calls under `services/vera/`.
- Keep Vera hooks under `hooks/vera/`.

Native availability checks belong in
`services/vera/native-capabilities.service.ts`. Screens should render graceful
fallbacks for web, Expo Go, missing permissions, and unsupported devices.

## Styling

Use theme tokens from `constants/theme.ts` and Vera-specific values from
`constants/vera-theme.ts`. Prefer shared primitives from `components/ui`.

Exterior screens should preserve the Cicla menstrual-calendar identity. Interior
Vera screens can be more restrained and private, but should still feel like the
same product.

Avoid creating new one-off palettes or layout systems. If a pattern repeats,
turn it into a component.

## Environment

The backend URL is read from `EXPO_PUBLIC_API_URL`.

Common local values:

- Web/iOS simulator: `http://localhost:3001/api`
- Android emulator: `http://10.0.2.2:3001/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:3001/api`

When using Expo tunnel, the phone still needs a backend URL it can reach.

## Validation

Run these before opening a PR:

```bash
npm run typecheck
npx expo export --platform web --output-dir /tmp/cicla-vera-mobile-export
```

When a change touches backend integration, start the backend locally and run the
closest smoke script from `package.json`, for example:

```bash
npm run smoke:auth
npm run smoke:daily-log
npm run smoke:vera-location-monitor
```

If a smoke script depends on optional local infrastructure, document whether it
passed fully or skipped an expected local-only dependency.

## Branch and PR Workflow

Create feature branches from `develop` using the Linear/GitHub issue context in
the branch name, for example:

```bash
git checkout develop
git pull --ff-only origin develop
git checkout -b kaeffea/MOB-XX-short-feature-name
```

Use concise English commit messages. PR bodies should include summary, tests,
and tracking references. Use `Related:` for issue references unless the team
explicitly wants the PR to close the issue automatically.
