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
