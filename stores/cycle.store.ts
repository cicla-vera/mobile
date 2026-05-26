import { create } from "zustand";

import {
  parseDateKey,
  toDateKey,
  toMonthKey,
  shiftMonthKey,
} from "@/utils/date";

type CycleState = {
  selectedDate: string;
  visibleMonth: string;
  moodsByDate: Record<string, string>;
  selectDate: (dateKey: string) => void;
  goToToday: () => void;
  shiftVisibleMonth: (delta: number) => void;
  setMoodForDate: (dateKey: string, moodId: string) => void;
  clearMoodForDate: (dateKey: string) => void;
  resetCalendar: () => void;
};

const today = new Date();

export const useCycleStore = create<CycleState>((set, get) => ({
  selectedDate: toDateKey(today),
  visibleMonth: toMonthKey(today),
  moodsByDate: {},

  selectDate: (dateKey) => {
    const date = parseDateKey(dateKey);

    set({
      selectedDate: dateKey,
      visibleMonth: toMonthKey(date),
    });
  },

  goToToday: () => {
    const now = new Date();

    set({
      selectedDate: toDateKey(now),
      visibleMonth: toMonthKey(now),
    });
  },

  shiftVisibleMonth: (delta) => {
    const nextMonth = shiftMonthKey(get().visibleMonth, delta);

    set({ visibleMonth: nextMonth });
  },

  setMoodForDate: (dateKey, moodId) =>
    set((state) => ({
      moodsByDate: {
        ...state.moodsByDate,
        [dateKey]: moodId,
      },
    })),

  clearMoodForDate: (dateKey) =>
    set((state) => {
      const moodsByDate = { ...state.moodsByDate };
      delete moodsByDate[dateKey];

      return { moodsByDate };
    }),

  resetCalendar: () => {
    const now = new Date();

    set({
      selectedDate: toDateKey(now),
      visibleMonth: toMonthKey(now),
    });
  },
}));
