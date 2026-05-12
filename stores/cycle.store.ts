import { create } from 'zustand';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

type CycleState = {
  selectedDate: string;
  visibleMonth: string;
  setSelectedDate: (date: string) => void;
  setVisibleMonth: (month: string) => void;
  resetCalendar: () => void;
};

export const useCycleStore = create<CycleState>((set) => ({
  selectedDate: toDateKey(new Date()),
  visibleMonth: toMonthKey(new Date()),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setVisibleMonth: (month) => set({ visibleMonth: month }),
  resetCalendar: () => {
    const today = new Date();

    set({
      selectedDate: toDateKey(today),
      visibleMonth: toMonthKey(today),
    });
  },
}));
