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

The app resolves the backend URL by platform. Platform-specific variables are
checked first, then `EXPO_PUBLIC_API_URL`, then built-in local defaults.

```env
EXPO_PUBLIC_API_URL_WEB=http://localhost:3001/api
EXPO_PUBLIC_API_URL_ANDROID=http://10.0.2.2:3001/api
EXPO_PUBLIC_API_URL_IOS=http://YOUR_COMPUTER_LAN_IP:3001/api
EXPO_PUBLIC_API_URL=
```

Useful local values:

- Web or iOS simulator: `http://localhost:3001/api`
- Android emulator/BlueStacks: `http://10.0.2.2:3001/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:3001/api`

When testing through Expo tunnel or a physical phone, use a backend URL
reachable by that device. On BlueStacks, `10.0.2.2` points to the Windows host,
so the backend must be exposed on the Windows host port as well.

## Run

```bash
npm run start
npm run web
```

For device-specific Expo hostnames, configure these local-only values in
`.env`:

```env
EXPO_PACKAGER_HOST_IOS_LAN=YOUR_COMPUTER_LAN_IP
EXPO_PACKAGER_HOST_BLUESTACKS=10.0.2.2
```

Then run:

```bash
npm run start:ios-lan
npm run start:bluestacks
```

When running Expo from WSL into BlueStacks, Windows must expose both the
backend port and the Metro port. If `exp://10.0.2.2:8081` does not open in Expo
Go, run PowerShell as administrator and forward the current WSL IP:

```powershell
$wslIp = (wsl hostname -I).Trim().Split()[0]

foreach ($port in @(3001, 8081)) {
  netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$port
  netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$port connectaddress=$wslIp connectport=$port

  if (-not (Get-NetFirewallRule -DisplayName "Cicla Vera WSL $port" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "Cicla Vera WSL $port" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port
  }
}
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

Detailed folder and workflow conventions live in
[`docs/MOBILE_STRUCTURE.md`](docs/MOBILE_STRUCTURE.md).

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
- Vera status notifications use the `private-status` Android channel with
  minimal importance, no sound, no vibration, and lock-screen content hidden.
  OS-level microphone/location indicators are not hidden and are disclosed in
  the consent flow.

## Vera Location Monitoring

Location monitoring is consent-aware and depends on the Vera safety profile:

- `monitoringEnabled`, `veraEnabled`, and `consentAccepted` must be true.
- Only enabled `RISK` safety locations are used for automatic detection.
- Foreground monitoring uses `expo-location` while the app is open.
- Background updates are registered through `expo-task-manager` when the
  platform supports it and foreground/background location permissions are
  already granted.
- Expo Go and web can be limited for background tasks; use a development build
  to validate persistent background location behavior.
- If a monitored location is matched and no alert session is active, the app
  starts a normal location-triggered Vera alert session through the backend.

## Vera Audio Sentinel

The foreground audio sentinel is the first MVP layer for near-real-time audio
evidence capture:

- It only runs when the user is authenticated, Vera consent is accepted,
  `veraEnabled` and `monitoringEnabled` are true, an alert session is active,
  and the app is in the foreground.
- It records short local audio windows with metering enabled, keeps one quiet
  pre-roll window, and uploads the relevant window plus one post-roll window.
- Relevant windows are flushed to the backend immediately; uploaded audio
  evidence automatically requests AI analysis.
- Metadata includes capture timestamps, pre-roll context, platform, foreground
  state, local confidence, metering stats, and trigger reasons.
- Persistent background audio capture still needs a native foreground service
  or development-build specific implementation; Expo Go can be limited here.
