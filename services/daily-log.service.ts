import { api } from '@/services/api';
import type {
  DailyLog,
  FlowEntry,
  MoodEntry,
  NoteEntry,
  SaveDailyLogRequest,
  Symptom,
  SymptomEntry,
} from '@/types/api.types';

export async function fetchDailyLog(date: string): Promise<DailyLog> {
  const [moods, flow, symptoms, notes] = await Promise.all([
    api.get<MoodEntry[]>('/moods', { params: { date } }),
    api.get<FlowEntry[]>('/flow', { params: { date } }),
    api.get<SymptomEntry[]>('/symptoms', { params: { date } }),
    api.get<NoteEntry[]>('/notes', { params: { date } }),
  ]);

  return {
    moods: moods.data,
    flow: flow.data,
    symptoms: symptoms.data,
    notes: notes.data,
  };
}

export async function fetchAvailableSymptoms() {
  const response = await api.get<Symptom[]>('/symptoms/available');

  return response.data;
}

export async function saveDailyLog(payload: SaveDailyLogRequest) {
  const requests: Promise<unknown>[] = [];
  const note = payload.note?.trim();

  if (payload.mood) {
    requests.push(
      api.post<MoodEntry>('/moods', {
        mood: payload.mood,
        date: payload.date,
      }),
    );
  }

  if (payload.flowIntensity) {
    requests.push(
      api.post<FlowEntry>('/flow', {
        intensity: payload.flowIntensity,
        date: payload.date,
      }),
    );
  }

  for (const symptom of payload.symptoms ?? []) {
    requests.push(
      api.post<SymptomEntry>('/symptoms', {
        symptomName: symptom.symptomName,
        intensity: symptom.intensity,
        date: payload.date,
      }),
    );
  }

  if (note) {
    requests.push(
      api.post<NoteEntry>('/notes', {
        content: note,
        date: payload.date,
      }),
    );
  }

  return Promise.all(requests);
}

export const dailyLogService = {
  fetchDailyLog,
  fetchAvailableSymptoms,
  saveDailyLog,
};
