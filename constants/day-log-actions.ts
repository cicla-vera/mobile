import type { Feather } from '@expo/vector-icons';

export type DayLogRoute =
  | '/(exterior)/log'
  | '/(exterior)/weight'
  | '/(exterior)/temperature'
  | '/(exterior)/water'
  | '/(exterior)/activity'
  | '/(exterior)/sleep'
  | '/(exterior)/intercourse'
  | '/(exterior)/medications';

export type DayLogAction = {
  id: string;
  label: string;
  shortLabel: string;
  icon: keyof typeof Feather.glyphMap;
  href: DayLogRoute;
};

export const DAY_LOG_ACTIONS: DayLogAction[] = [
  {
    id: 'log',
    label: 'Registro geral',
    shortLabel: 'Diário',
    icon: 'edit-3',
    href: '/(exterior)/log',
  },
  {
    id: 'weight',
    label: 'Registrar peso',
    shortLabel: 'Peso',
    icon: 'bar-chart',
    href: '/(exterior)/weight',
  },
  {
    id: 'temperature',
    label: 'Registrar temperatura',
    shortLabel: 'Temp.',
    icon: 'thermometer',
    href: '/(exterior)/temperature',
  },
  {
    id: 'water',
    label: 'Registrar água',
    shortLabel: 'Água',
    icon: 'droplet',
    href: '/(exterior)/water',
  },
  {
    id: 'activity',
    label: 'Registrar atividade',
    shortLabel: 'Atividade',
    icon: 'activity',
    href: '/(exterior)/activity',
  },
  {
    id: 'sleep',
    label: 'Registrar sono',
    shortLabel: 'Sono',
    icon: 'moon',
    href: '/(exterior)/sleep',
  },
  {
    id: 'intercourse',
    label: 'Registrar relação',
    shortLabel: 'Relação',
    icon: 'heart',
    href: '/(exterior)/intercourse',
  },
  {
    id: 'medications',
    label: 'Registrar medicamento',
    shortLabel: 'Remedio',
    icon: 'plus-circle',
    href: '/(exterior)/medications',
  },
];

export const HOME_DAY_LOG_ACTIONS = DAY_LOG_ACTIONS.filter((action) =>
  ['log', 'weight', 'water', 'temperature', 'activity', 'sleep'].includes(
    action.id,
  ),
);
