import type { CycleLog } from '@/types/api.types';
import { parseDateKey, toDateKey } from '@/utils/date';

export function getApiDateKey(value: string) {
  return value.slice(0, 10);
}

export function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function getCycleStartKey(cycle: CycleLog) {
  return getApiDateKey(cycle.startDate);
}

export function getCycleEndKey(cycle: CycleLog) {
  return cycle.endDate ? getApiDateKey(cycle.endDate) : null;
}

export function isDateKeyWithinCycle(dateKey: string, cycle: CycleLog) {
  const startKey = getCycleStartKey(cycle);
  const endKey = getCycleEndKey(cycle) ?? startKey;

  return (
    compareDateKeys(dateKey, startKey) >= 0 &&
    compareDateKeys(dateKey, endKey) <= 0
  );
}

export function findCycleForDate(cycles: CycleLog[], dateKey: string) {
  return cycles.find((cycle) => isDateKeyWithinCycle(dateKey, cycle)) ?? null;
}

export function findLatestOpenCycle(cycles: CycleLog[]) {
  return (
    [...cycles]
      .filter((cycle) => cycle.endDate === null)
      .sort((left, right) =>
        compareDateKeys(getCycleStartKey(right), getCycleStartKey(left)),
      )[0] ?? null
  );
}

export function buildPeriodDaySet(
  cycles: CycleLog[],
  fallbackEndDate = new Date(),
) {
  const periodDays = new Set<string>();
  const fallbackEndKey = toDateKey(fallbackEndDate);

  for (const cycle of cycles) {
    const startKey = getCycleStartKey(cycle);
    const endKey = getCycleEndKey(cycle) ?? fallbackEndKey;

    if (compareDateKeys(endKey, startKey) < 0) {
      continue;
    }

    const cursor = parseDateKey(startKey);
    const endDate = parseDateKey(endKey);

    while (cursor.getTime() <= endDate.getTime()) {
      periodDays.add(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return periodDays;
}
