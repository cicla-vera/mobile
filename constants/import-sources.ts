import type { Feather } from '@expo/vector-icons';

export type ImportSource = {
  id: string;
  label: string;
  shortLabel: string;
  icon: keyof typeof Feather.glyphMap;
  source: 'flo' | 'apple-health' | 'health-connect';
};

export const IMPORT_SOURCES: ImportSource[] = [
  {
    id: 'flo',
    label: 'Importar Flo',
    shortLabel: 'Flo',
    icon: 'upload-cloud',
    source: 'flo',
  },
  {
    id: 'apple-health',
    label: 'Apple Health',
    shortLabel: 'Apple',
    icon: 'heart',
    source: 'apple-health',
  },
  {
    id: 'health-connect',
    label: 'Health Connect',
    shortLabel: 'Connect',
    icon: 'activity',
    source: 'health-connect',
  },
];
