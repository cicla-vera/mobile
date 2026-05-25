# Cicla Vera - Mobile

React Native app built with Expo Router and TypeScript.

## Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- NativeWind
- Zustand
- TanStack Query
- Axios
- Expo SecureStore

## Requirements

- Node.js 22+
- npm
- Expo Go for physical-device testing

## Install

```bash
npm install
cp .env.example .env
```

## Environment

The app reads the backend URL from `EXPO_PUBLIC_API_URL`.

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

Useful local values:

- iOS simulator or web: `http://localhost:3001/api`
- Android emulator: `http://10.0.2.2:3001/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:3001/api`

When testing through Expo tunnel, use a backend URL reachable by the phone.

## Run

```bash
npm run start
npm run web
```

## Checks

```bash
npm run typecheck
```

This command regenerates Expo Router typed routes before running TypeScript, so
new files under `app/` are included in validation.

## Backend Contract Smoke Checks

Run the backend locally first, then validate the mobile authentication contract:

```bash
npm run smoke:auth
npm run smoke:cycles
npm run smoke:cycle-history
npm run smoke:cycle-prediction
npm run smoke:history-charts
npm run smoke:monthly-summary
npm run smoke:daily-log
```

By default this creates a temporary development user, logs in, and validates
`/users/me` with the returned JWT. The cycles smoke test uses the same flow and
then validates creating, ending, and listing a cycle through `/cycles`.
`smoke:cycle-history` validates `/cycles/history` stats and timeline.
`smoke:cycle-prediction` validates `/cycles/predict` from multiple completed
cycles. `smoke:history-charts` validates the temperature, weight, and mood
history used by the charts screen. `smoke:monthly-summary` validates
`/cycles/summary/:month` across cycle, mood, flow, symptom, note, and wellness
entries. `smoke:daily-log` validates mood, flow, symptoms, notes, and available
symptoms through the exterior calendar endpoints.

To reuse an existing account instead:

```bash
SMOKE_AUTH_EMAIL=user@example.com SMOKE_AUTH_PASSWORD=password npm run smoke:auth
```

## Project Structure

```text
app/
  (auth)/       authentication screens
  (exterior)/   disguised menstrual-calendar layer
  (interior)/   Vera safety layer
components/
  auth/         auth-specific components
  ui/           shared design-system primitives
constants/      theme and environment constants
hooks/          reusable hooks
providers/      app-level providers
services/       API clients and storage helpers
  vera/         Vera safety-layer API clients
stores/         Zustand stores
types/          shared TypeScript API contracts
  vera.types.ts Vera safety-layer contracts
```

## Conventions

- Use Expo Router route groups to keep auth, exterior, and interior flows separate.
- Keep backend calls inside `services/` and shared API contracts inside `types/`.
- Store authentication tokens only through `services/token-storage.ts`.
- Prefer shared UI primitives from `components/ui` before creating screen-local components.
- Keep the exterior layer visually consistent with the Cicla calendar identity.
- Keep Vera safety flows discreet, consent-aware, and explicit about permissions.

## Vera Mobile Architecture

The Vera interior layer is kept separate from the menstrual-calendar exterior:

- API contracts for safety profile, PIN, emergency contacts, safety locations,
  alert sessions, alert events, evidence, and AI analysis live in
  `types/vera.types.ts`.
- Backend calls live under `services/vera/`, matching the NestJS `/vera/*`
  endpoints without exposing these calls from exterior screens.
- TanStack Query hooks live under `hooks/vera/` and share `veraQueryKeys` so
  future screens can invalidate profile, contact, location, alert, and evidence
  data consistently.
- `stores/vera.store.ts` keeps only in-memory Vera UI/session state such as the
  active alert session id and short-lived Vera unlock token. It does not persist
  PINs or evidence data.
- Native capabilities such as biometrics, location, camera, audio, task manager,
  and notifications are installed through Expo modules and configured in
  `app.json`. Runtime availability checks live in
  `services/vera/native-capabilities.service.ts` so web, Expo Go, and
  development builds can fall back safely before a Vera screen requests a
  permission or starts a sensitive workflow.
