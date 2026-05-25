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
npm run smoke:daily-log
```

By default this creates a temporary development user, logs in, and validates
`/users/me` with the returned JWT. The cycles smoke test uses the same flow and
then validates creating, ending, and listing a cycle through `/cycles`.
`smoke:cycle-history` validates `/cycles/history` stats and timeline.
`smoke:cycle-prediction` validates `/cycles/predict` from multiple completed
cycles. `smoke:daily-log` validates mood, flow, symptoms, notes, and available
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
stores/         Zustand stores
types/          shared TypeScript API contracts
```

## Conventions

- Use Expo Router route groups to keep auth, exterior, and interior flows separate.
- Keep backend calls inside `services/` and shared API contracts inside `types/`.
- Store authentication tokens only through `services/token-storage.ts`.
- Prefer shared UI primitives from `components/ui` before creating screen-local components.
- Keep the exterior layer visually consistent with the Cicla calendar identity.
- Keep Vera safety flows discreet, consent-aware, and explicit about permissions.
