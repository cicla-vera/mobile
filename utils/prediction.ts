import type { CyclePrediction } from '@/types/api.types';
import { parseDateKey, toDateKey } from '@/utils/date';

const shortMonthNames = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

export function formatPredictionDate(dateKey?: string | null) {
  if (!dateKey) {
    return '--';
  }

  const [, month, day] = dateKey.split('-').map(Number);

  return `${day} ${shortMonthNames[month - 1]}`;
}

export function buildPredictionDaySets(prediction?: CyclePrediction) {
  const fertileDays = new Set<string>();
  const predictedDays = new Set<string>();

  if (prediction?.nextPeriod?.date) {
    predictedDays.add(prediction.nextPeriod.date);
  }

  if (prediction?.fertileWindow) {
    const cursor = parseDateKey(prediction.fertileWindow.start);
    const endDate = parseDateKey(prediction.fertileWindow.end);

    while (cursor.getTime() <= endDate.getTime()) {
      fertileDays.add(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { fertileDays, predictedDays };
}

export function getNextPeriodMessage(prediction?: CyclePrediction) {
  if (!prediction?.nextPeriod) {
    return 'Registre um ciclo completo para liberar uma previsão mais fiel.';
  }

  const daysUntil = prediction.nextPeriod.daysUntil;

  if (daysUntil === 0) {
    return 'Sua próxima menstruação pode começar hoje.';
  }

  if (daysUntil < 0) {
    return `Sua previsão passou há ${Math.abs(daysUntil)} dias.`;
  }

  if (daysUntil === 1) {
    return 'Sua próxima menstruação pode começar amanhã.';
  }

  return `Sua próxima menstruação será em ${daysUntil} dias.`;
}

export function getFertileWindowMessage(prediction?: CyclePrediction) {
  if (!prediction?.fertileWindow) {
    return 'A janela fértil aparece quando houver histórico suficiente.';
  }

  return `${formatPredictionDate(prediction.fertileWindow.start)} a ${formatPredictionDate(
    prediction.fertileWindow.end,
  )}`;
}
