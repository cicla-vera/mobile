import { api } from '@/services/api';
import type {
  HistoryCharts,
  MoodEntry,
  TemperatureEntry,
  WeightEntry,
} from '@/types/api.types';

export async function fetchHistoryCharts(): Promise<HistoryCharts> {
  const [temperature, weight, moods] = await Promise.all([
    api.get<TemperatureEntry[]>('/temperature'),
    api.get<WeightEntry[]>('/weight'),
    api.get<MoodEntry[]>('/moods'),
  ]);

  return {
    temperature: temperature.data,
    weight: weight.data,
    moods: moods.data,
  };
}

export const historyChartsService = {
  fetchHistoryCharts,
};
