import type { CalendarDay, CalendarDayVariant } from '@/types/calendar.types';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isSameDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
}

function resolveDayVariant(
  date: Date,
  isCurrentMonth: boolean,
  month: number,
  year: number,
  today: Date,
  fertileDays: Set<string>,
  predictedDays: Set<string>,
): CalendarDayVariant {
  const dateKey = toDateKey(date);

  if (isSameDay(date, today)) {
    return 'today';
  }

  if (fertileDays.has(dateKey)) {
    return 'fertile';
  }

  if (predictedDays.has(dateKey)) {
    return 'predicted';
  }

  if (!isCurrentMonth) {
    return date < new Date(year, month, 1) ? 'mutedPrev' : 'mutedNext';
  }

  return 'default';
}

export function getWeekDayLabels() {
  return [...WEEK_DAYS];
}

export function formatCalendarHeading(date: Date) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  return `${day} de ${month}`;
}

export function buildCalendarMonth(
  year: number,
  month: number,
  options: {
    today?: Date;
    fertileDays?: Set<string>;
    predictedDays?: Set<string>;
  } = {},
): CalendarDay[][] {
  const today = options.today ?? new Date();
  const fertileDays = options.fertileDays ?? new Set<string>();
  const predictedDays = options.predictedDays ?? new Set<string>();

  const firstDayOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstDayOfMonth);
  gridStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  const weeks: CalendarDay[][] = [];

  for (let weekIndex = 0; weekIndex < 5; weekIndex += 1) {
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

export function getCalendarInsights(referenceDate: Date): {
  fertileMessage: string;
  fertileDetail: string;
  nextPeriodMessage: string;
} {
  const day = referenceDate.getDate();

  if (day >= 14 && day <= 18) {
    return {
      fertileMessage: 'Seus dias férteis podem estar começando hoje.',
      fertileDetail: 'Talvez você se sinta mais disposta e animada.',
      nextPeriodMessage: 'Sua próxima menstruação será em 20 dias.',
    };
  }

  return {
    fertileMessage: 'Seus dias férteis podem estar começando hoje.',
    fertileDetail: 'Talvez você se sinta mais disposta e animada.',
    nextPeriodMessage: 'Sua próxima menstruação será em 20 dias.',
  };
}
