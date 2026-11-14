export type IdeaCategory =
  | 'foco'
  | 'estudos'
  | 'organizacao'
  | 'criatividade'
  | 'bem-estar'
  | 'saude-culinaria'
  | 'social-amor'
  | 'lazer-cultura'
  | 'espiritualidade'
  | 'vieses-gatilhos';

export type EnergyLevel = 'baixa' | 'media' | 'alta';

export type MaslowTierId =
  | 'fisiologico'
  | 'seguranca'
  | 'pertencimento'
  | 'estima'
  | 'autorrealizacao';

export type MainTab = 'tarefas' | 'memorias' | 'swipe' | 'momento' | 'avancos';
export type TasksSubTab = 'todas' | 'fila';
export type EvoSubTab = 'metricas' | 'evoluir' | 'objetivos' | 'deixar';
export type TimerMode = 'sprint' | 'pomodoro' | 'shortbreak' | 'longbreak' | 'custom';
export type ClockDisplayMode = 'countdown' | 'stopwatch' | 'journey';
export type QueueFilter = 'pendentes' | 'concluidas' | 'todas';
export type AccentTheme = 'terracota' | 'rose' | 'sage' | 'indigo' | 'amber' | 'plum';

export interface UserProfile {
  completedOnboarding: boolean;
  name: string;
  avatar: string;
  birthDate: string;
  country: string;
  profession: string;
  education: string;
  socialStatus: string;
  religion: string;
  hobbies: string[];
}

export interface ThoughtReframeEntry {
  id: string;
  biasKey: string;
  automaticThought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  dateLabel: string;
}

export interface MasteryPleasureLog {
  id: string;
  title: string;
  mastery: number;
  pleasure: number;
  dateLabel: string;
}

export interface Idea {
  id: string;
  title: string;
  category: IdeaCategory;
  biasKey?: string;
  pyramid?: string;
  time: number;
  energy: EnergyLevel;
  xp: number;
  favorite: boolean;
  description: string;
  steps: string[];
}

export interface QueueItem {
  id: string;
  title: string;
  category: IdeaCategory;
  time: number;
  xp: number;
  completed: boolean;
  steps: string[];
  description?: string;
}

export interface FocusTarget {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  energy: EnergyLevel;
  time: number;
  xp: number;
  biasKey?: string;
  steps: string[];
  source: 'idea' | 'queue' | 'plan' | 'antidote';
}

export interface HistoryEntry {
  title: string;
  xp: number;
  date: string;
}

export interface EvoStep {
  text: string;
  done: boolean;
}

export interface EvoGoal {
  id: string;
  title: string;
  tier: MaslowTierId;
  obstacleId: string;
  steps: EvoStep[];
}

export interface LeaveHabit {
  id: string;
  title: string;
  why: string;
  steps: EvoStep[];
}

export interface UserReminder {
  id: string;
  title: string;
  tier: MaslowTierId;
  datetime: string;
  fav: boolean;
  done: boolean;
}

export interface IndependentReminderCard {
  id: string;
  title: string;
  tier: MaslowTierId;
  desc: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  taskTitle: string;
  mood: string;
  notes: string;
  dateIso: string;
  dateLabel: string;
  fav: boolean;
  photo: string;
}

export interface SoundTrack {
  id: string;
  title: string;
  icon: string;
  grad: string;
  origin: string;
  externalFile: string | null;
  fav: boolean;
}

export interface BiasAntidote {
  name: string;
  hurts: string;
  solve: string;
  antidoteStep: string;
  recommendedMinutes: number;
}

export interface EvoState {
  activeSubTab: EvoSubTab;
  selectedTiers: MaslowTierId[];
  consentGiven: boolean;
  currentQuestionIdx: number;
  answers: Record<string, string>;
  goals: EvoGoal[];
  leaveHabits: LeaveHabit[];
  reminders: UserReminder[];
  consentProfileSuggestions: boolean;
  dismissedUntil: Record<string, number>;
  ignoredSuggestionIds: string[];
  favReminderFilter: boolean;
  remRoundNumber: number;
  remIndexInRound: number;
  favIndependentRemIds: string[];
}

export interface MusicState {
  currentTrackId: string;
  playing: boolean;
  muted: boolean;
  volume: number;
  onlyFavs: boolean;
  favTrackIds: string[];
  sleepSecondsLeft: number;
}

export interface TimerState {
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
  mode: TimerMode;
  clockType: ClockDisplayMode;
  stopwatchSeconds: number;
  journeySecondsLeft: number;
  activeIdeaId: string;
  customFocusTarget: FocusTarget | null;
}

export interface FilterState {
  energy: 'all' | EnergyLevel;
  time: 'all' | '10' | '25' | '60';
  category: 'all' | IdeaCategory;
  search: string;
  onlyFavorites: boolean;
  onlyProfileMatch?: boolean;
  deckType?: 'all' | 'ideas' | 'reminders' | 'biases';
}

export interface AppState {
  profile: UserProfile;
  accentTheme: AccentTheme;
  ideas: Idea[];
  spotlightId: string;
  rejectedIdeaIds: string[];
  checkedStepsByIdea: Record<string, Record<number, boolean>>;
  scratchpadByIdea: Record<string, string>;
  filters: FilterState;
  queue: QueueItem[];
  queueFilter: QueueFilter;
  xp: number;
  completedCount: number;
  focusMinutes: number;
  streak: number;
  soundEnabled: boolean;
  history: HistoryEntry[];
  thoughtLogs: ThoughtReframeEntry[];
  masteryPleasureLogs: MasteryPleasureLog[];
  timer: TimerState;
  evo: EvoState;
  memories: MemoryItem[];
  onlyFavMemories: boolean;
  music: MusicState;
}
