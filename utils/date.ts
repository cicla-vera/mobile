export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);

  return { year, month: month - 1 };
}

export function shiftMonthKey(monthKey: string, delta: number) {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month + delta, 1);

  return toMonthKey(date);
}

export function isSameDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
}
