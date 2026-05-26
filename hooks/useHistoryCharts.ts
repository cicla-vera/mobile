import { useQuery } from '@tanstack/react-query';

import { historyChartsService } from '@/services/history-charts.service';

export const historyChartsQueryKey = ['history-charts'] as const;

export function useHistoryChartsQuery() {
  return useQuery({
    queryKey: historyChartsQueryKey,
    queryFn: historyChartsService.fetchHistoryCharts,
  });
}
