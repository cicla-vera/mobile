import { useMutation } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { historyChartsQueryKey } from '@/hooks/useHistoryCharts';
import { dataImportService } from '@/services/data-import.service';
import { queryClient } from '@/services/query-client';

const importedDataQueryRoots = [
  cyclesQueryKey,
  historyChartsQueryKey,
  ['activity'],
  ['daily-log'],
  ['flow'],
  ['intercourse'],
  ['medications'],
  ['moods'],
  ['notes'],
  ['sleep'],
  ['symptoms'],
  ['temperature'],
  ['water'],
  ['weight'],
] as const;

export function useImportFloMutation() {
  return useMutation({
    mutationKey: ['data-import', 'flo'],
    mutationFn: (payload: unknown) => dataImportService.importFloData(payload),
    onSuccess: async () => {
      await Promise.all(
        importedDataQueryRoots.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
