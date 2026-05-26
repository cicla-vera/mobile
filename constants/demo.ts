export const VERA_DEMO_MODE_ENV_VALUE = 'safe-local-demo';

export const isVeraDemoModeEnabled =
  process.env.EXPO_PUBLIC_VERA_DEMO_MODE === VERA_DEMO_MODE_ENV_VALUE;
