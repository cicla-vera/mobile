export type ApiErrorResponse = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type UserProfile = AuthUser & {
  phone?: string | null;
  birthDate?: string | null;
  createdAt?: string;
};

export type UpdateUserProfileRequest = {
  name?: string;
  phone?: string;
  birthDate?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  name: string;
};

export type CycleLog = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCycleRequest = {
  startDate: string;
  endDate?: string;
};

export type UpdateCycleRequest = Partial<CreateCycleRequest>;

export type CyclePrediction = {
  averageCycleLength?: number;
  currentCycleDay?: number;
  daysUntilNextPeriod?: number;
  nextPeriod: {
    date: string;
    daysUntil: number;
  } | null;
  ovulationDate: {
    date: string;
  } | null;
  fertileWindow: {
    start: string;
    end: string;
  } | null;
  basedOnCycles?: number;
  message?: string;
};

export type CycleHistoryItem = CycleLog & {
  periodDuration: number | null;
  cycleLength: number | null;
};

export type CycleHistoryRegularity = {
  status: 'INSUFFICIENT_DATA' | 'REGULAR' | 'IRREGULAR';
  variationDays: number | null;
  message: string;
};

export type CycleHistoryStats = {
  totalCycles: number;
  completeCycles: number;
  averageDuration: number | null;
  shortest: number | null;
  longest: number | null;
  averageCycleLength: number | null;
  shortestCycleLength: number | null;
  longestCycleLength: number | null;
  regularity: CycleHistoryRegularity;
};

export type CycleHistory = {
  cycles: CycleHistoryItem[];
  stats: CycleHistoryStats;
};

export type SummaryCount = {
  value: string;
  count: number;
};

export type SymptomSummaryCount = {
  symptomId: string;
  name: string;
  count: number;
};

export type NumericSummary = {
  totalEntries: number;
  average: number | null;
  min: number | null;
  max: number | null;
};

export type MonthlySummaryCycle = {
  id: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
};

export type MonthlySummary = {
  month: string;
  range: {
    start: string;
    end: string;
  };
  cycles: {
    total: number;
    periodDays: number;
    entries: MonthlySummaryCycle[];
  };
  symptoms: {
    totalEntries: number;
    topSymptoms: SymptomSummaryCount[];
  };
  moods: {
    totalEntries: number;
    distribution: SummaryCount[];
  };
  flow: {
    totalEntries: number;
    daysWithFlow: number;
    distribution: SummaryCount[];
  };
  notes: {
    totalEntries: number;
  };
  health: {
    temperature: NumericSummary;
    weight: NumericSummary;
    water: {
      totalEntries: number;
      totalAmount: number;
      daysTracked: number;
      averageAmountPerEntry: number | null;
    };
    activity: {
      totalEntries: number;
      totalDuration: number;
      averageDuration: number | null;
      byType: SummaryCount[];
      byIntensity: SummaryCount[];
    };
    sleep: NumericSummary & {
      qualityDistribution: SummaryCount[];
    };
    intercourse: {
      totalEntries: number;
      protected: number;
      unprotected: number;
    };
    medications: {
      totalEntries: number;
      uniqueMedications: SummaryCount[];
    };
  };
  generatedAt: string;
};

export type MoodType =
  | 'HAPPY'
  | 'SAD'
  | 'ANXIOUS'
  | 'IRRITABLE'
  | 'CALM'
  | 'ENERGETIC'
  | 'TIRED'
  | 'SENSITIVE';

export type FlowIntensity =
  | 'SPOTTING'
  | 'LIGHT'
  | 'MEDIUM'
  | 'HEAVY'
  | 'VERY_HEAVY';

export type Symptom = {
  id: string;
  name: string;
};

export type SymptomEntry = {
  id: string;
  userId: string;
  symptomId: string;
  symptom: Symptom;
  date: string;
  intensity: number | null;
  createdAt: string;
};

export type MoodEntry = {
  id: string;
  userId: string;
  mood: MoodType;
  date: string;
  note: string | null;
  createdAt: string;
};

export type TemperatureEntry = {
  id: string;
  userId: string;
  temperature: number;
  date: string;
  createdAt: string;
};

export type WeightEntry = {
  id: string;
  userId: string;
  weight: number;
  date: string;
  createdAt: string;
};

export type HistoryCharts = {
  temperature: TemperatureEntry[];
  weight: WeightEntry[];
  moods: MoodEntry[];
};

export type FlowEntry = {
  id: string;
  userId: string;
  intensity: FlowIntensity;
  date: string;
  createdAt: string;
};

export type NoteEntry = {
  id: string;
  userId: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyLog = {
  moods: MoodEntry[];
  flow: FlowEntry[];
  symptoms: SymptomEntry[];
  notes: NoteEntry[];
};

export type SaveDailyLogRequest = {
  date: string;
  mood?: MoodType | null;
  flowIntensity?: FlowIntensity | null;
  symptoms?: Array<{
    symptomName: string;
    intensity?: number;
  }>;
  note?: string;
};
