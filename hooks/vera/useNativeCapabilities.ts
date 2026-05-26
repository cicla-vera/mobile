import { useQuery } from '@tanstack/react-query';

import { getVeraNativeCapabilityStatus } from '@/services/vera';
import { veraQueryKeys } from './query-keys';

export function useVeraNativeCapabilitiesQuery() {
  return useQuery({
    queryKey: [...veraQueryKeys.all, 'native-capabilities'] as const,
    queryFn: getVeraNativeCapabilityStatus,
  });
}
