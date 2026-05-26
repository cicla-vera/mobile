import type { FlowIntensity, MoodType } from '@/types/api.types';

export type MoodChoice = {
  value: MoodType;
  label: string;
  accent: string;
};

export type FlowChoice = {
  value: FlowIntensity;
  label: string;
  description: string;
};

export const MOOD_CHOICES: MoodChoice[] = [
  { value: 'CALM', label: 'Calma', accent: '#8ECFB8' },
  { value: 'HAPPY', label: 'Bem', accent: '#F2C94C' },
  { value: 'ENERGETIC', label: 'Disposta', accent: '#209ED0' },
  { value: 'SENSITIVE', label: 'Sensivel', accent: '#C949A8' },
  { value: 'TIRED', label: 'Cansada', accent: '#A69A96' },
  { value: 'IRRITABLE', label: 'Irritada', accent: '#F2617E' },
  { value: 'ANXIOUS', label: 'Ansiosa', accent: '#4A225E' },
  { value: 'SAD', label: 'Triste', accent: '#20257B' },
];

export const FLOW_CHOICES: FlowChoice[] = [
  { value: 'SPOTTING', label: 'Escape', description: 'manchinhas' },
  { value: 'LIGHT', label: 'Leve', description: 'pouco fluxo' },
  { value: 'MEDIUM', label: 'Medio', description: 'ritmo comum' },
  { value: 'HEAVY', label: 'Intenso', description: 'fluxo forte' },
  { value: 'VERY_HEAVY', label: 'Muito intenso', description: 'trocas frequentes' },
];

export const DEFAULT_SYMPTOMS = [
  'Colica',
  'Dor de cabeca',
  'Inchaco',
  'Sensibilidade',
  'Acne',
  'Nausea',
  'Fadiga',
  'Insonia',
] as const;
