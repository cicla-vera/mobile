import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { triggerSimulatedViolenceDetection } from '@/services/vera/security-audio-simulation.service';

export default function SecurityModeTriggerRoute() {
  useEffect(() => {
    void triggerSimulatedViolenceDetection().catch(() => undefined);
  }, []);

  return <Redirect href="/(exterior)" />;
}
