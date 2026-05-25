import { useMutation } from '@tanstack/react-query';

import { cyclesQueryKey } from '@/hooks/useCycles';
import { historyChartsQueryKey } from '@/hooks/useHistoryCharts';
import {
  dataImportService,
  type AppleHealthImportPayload,
} from '@/services/data-import.service';
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

async function invalidateImportedData() {
  await Promise.all(
    importedDataQueryRoots.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

export function useImportFloMutation() {
  return useMutation({
    mutationKey: ['data-import', 'flo'],
    mutationFn: (payload: unknown) => dataImportService.importFloData(payload),
    onSuccess: invalidateImportedData,
  });
}

export function useImportAppleHealthMutation() {
  return useMutation({
    mutationKey: ['data-import', 'apple-health'],
    mutationFn: (payload: AppleHealthImportPayload) =>
      dataImportService.importAppleHealthData(payload),
    onSuccess: invalidateImportedData,
  });
}
