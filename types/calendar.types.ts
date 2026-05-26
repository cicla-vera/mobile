export type CalendarDayVariant =
  | "default"
  | "mutedPrev"
  | "mutedNext"
  | "period"
  | "fertile"
  | "today"
  | "predicted";

export type CalendarDay = {
  key: string;
  date: Date;
  label: string;
  isCurrentMonth: boolean;
  variant: CalendarDayVariant;
};

export type CalendarInsights = {
  fertileMessage: string;
  fertileDetail: string;
  nextPeriodMessage: string;
};

export type MoodOption = {
  id: string;
  label: string;
  image?: number;
  icon?: string;
  iconColor?: string;
};
