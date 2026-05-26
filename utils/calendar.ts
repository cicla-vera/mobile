import type { CalendarDay, CalendarDayVariant } from "@/types/calendar.types";
import { isSameDay, toDateKey } from "@/utils/date";

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function resolveDayVariant(
  date: Date,
  isCurrentMonth: boolean,
  month: number,
  year: number,
  today: Date,
  periodDays: Set<string>,
  fertileDays: Set<string>,
  predictedDays: Set<string>,
): CalendarDayVariant {
  const dateKey = toDateKey(date);

  if (periodDays.has(dateKey)) {
    return "period";
  }

  if (isSameDay(date, today)) {
    return "today";
  }

  if (fertileDays.has(dateKey)) {
    return "fertile";
  }

  if (predictedDays.has(dateKey)) {
    return "predicted";
  }

  if (!isCurrentMonth) {
    return date < new Date(year, month, 1) ? "mutedPrev" : "mutedNext";
  }

  return "default";
}

export function getWeekDayLabels() {
  return [...WEEK_DAYS];
}

export function formatCalendarHeading(date: Date) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  return `${day} de ${month}`;
}

export function formatMonthHeading(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function buildCalendarMonth(
  year: number,
  month: number,
  options: {
    today?: Date;
    selectedDateKey?: string;
    periodDays?: Set<string>;
    fertileDays?: Set<string>;
    predictedDays?: Set<string>;
  } = {},
): CalendarDay[][] {
  const today = options.today ?? new Date();
  const periodDays = options.periodDays ?? new Set<string>();
  const fertileDays = options.fertileDays ?? new Set<string>();
  const predictedDays = options.predictedDays ?? new Set<string>();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const gridStart = new Date(firstDayOfMonth);
  gridStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  const gridEnd = new Date(lastDayOfMonth);
  gridEnd.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

  const weeks: CalendarDay[][] = [];
  const totalDays =
    Math.round(
      (gridEnd.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const days: CalendarDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);

      const isCurrentMonth = date.getMonth() === month;

      days.push({
        key: toDateKey(date),
        date,
        label: String(date.getDate()),
        isCurrentMonth,
        variant: resolveDayVariant(
          date,
          isCurrentMonth,
          month,
          year,
          today,
          periodDays,
          fertileDays,
          predictedDays,
        ),
      });
    }

    weeks.push(days);
  }

  return weeks;
}

export function buildMockCycleSets(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const fertileDays = new Set<string>();
  const predictedDays = new Set<string>();

  for (let day = 14; day <= 18; day += 1) {
    fertileDays.add(toDateKey(new Date(year, month, day)));
  }

  predictedDays.add(toDateKey(new Date(year, month, 1)));

  return { fertileDays, predictedDays };
}

function daysUntilNextPeriod(referenceDate: Date) {
  const day = referenceDate.getDate();

  if (day <= 5) {
    return Math.max(1, 28 - day);
  }

  return Math.max(1, 33 - day);
}

export function getCalendarInsights(referenceDate: Date): {
  fertileMessage: string;
  fertileDetail: string;
  nextPeriodMessage: string;
} {
  const day = referenceDate.getDate();
  const daysToPeriod = daysUntilNextPeriod(referenceDate);

  if (day >= 14 && day <= 18) {
    return {
      fertileMessage: "Seus dias férteis podem estar começando hoje.",
      fertileDetail: "Talvez você se sinta mais disposta e animada.",
      nextPeriodMessage: `Sua próxima menstruação será em ${daysToPeriod} dias.`,
    };
  }

  if (day >= 1 && day <= 5) {
    return {
      fertileMessage: "Você está no período menstrual.",
      fertileDetail: "Descanse e cuide do seu corpo nestes dias.",
      nextPeriodMessage: `Sua próxima menstruação será em ${daysToPeriod} dias.`,
    };
  }

  if (day > 18) {
    return {
      fertileMessage: "Seu ciclo está em fase lútea.",
      fertileDetail: "Observe mudanças de humor e energia ao longo da semana.",
      nextPeriodMessage: `Sua próxima menstruação será em ${daysToPeriod} dias.`,
    };
  }

  return {
    fertileMessage: "Seu ciclo está em fase folicular.",
    fertileDetail: "A energia tende a aumentar nesta fase do ciclo.",
    nextPeriodMessage: `Sua próxima menstruação será em ${daysToPeriod} dias.`,
  };
}
