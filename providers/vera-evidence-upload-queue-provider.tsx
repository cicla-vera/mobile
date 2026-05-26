import { useEffect, type ReactNode } from 'react';

import { veraQueryKeys } from '@/hooks/vera';
import { flushEvidenceUploadQueue } from '@/services/vera';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth.store';

type VeraEvidenceUploadQueueProviderProps = {
  children: ReactNode;
};

const UPLOAD_QUEUE_FLUSH_INTERVAL_MS = 30 * 1000;

export function VeraEvidenceUploadQueueProvider({
  children,
}: VeraEvidenceUploadQueueProviderProps) {
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthHydrated || !isAuthenticated) {
      return;
    }

    function flushQueue() {
      void flushEvidenceUploadQueue().then((result) => {
        if (result.uploaded.length > 0 || result.failed.length > 0) {
          void queryClient.invalidateQueries({
            queryKey: veraQueryKeys.alertSessions(),
          });
        }
      });
    }

    flushQueue();
    const intervalId = setInterval(
      flushQueue,
      UPLOAD_QUEUE_FLUSH_INTERVAL_MS,
    );

    return () => clearInterval(intervalId);
  }, [isAuthHydrated, isAuthenticated]);

  return <>{children}</>;
}
