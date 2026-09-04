export interface Bookmark {
  _id: string;
  url: string;
  title: string;
  description: string;
  favicon: string;
  tags: string[];
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordItem {
  _id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatorItem {
  _id: string;
  name: string;
  secret: string;
  issuer: string;
  account: string;
  digits: number;
  period: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSnippet {
  _id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  category: string;
  tags: string[];
  attachments?: UploadedFile[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  title: string;
  problem: string;
  solution: string;
  code: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platform: string;
  category: string;
  tags: string[];
  isSolved: boolean;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  bookmarks: number;
  notebooks: number;
  codes: number;
  questions: number;
  solved: number;
  heatmap?: { date: string; count: number }[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  scope: 'all' | 'bookmark' | 'bookmarks' | 'notebook' | 'notebooks' | 'code' | 'codes' | 'question' | 'questions' | 'password' | 'passwords';
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineItem {
  _id: string;
  type: 'class' | 'event';
  title: string;
  subject: string;
  teacher: string;
  room: string;
  dayOfWeek: number;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  repeatWeekly: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  month: string;
  amount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  method: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  _id: string;
  person: string;
  amount: number;
  reason: string;
  date: string;
  method: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSetting {
  _id: string;
  singleton: string;
  provider: 'gemini' | 'openrouter' | 'openai';
  geminiKey: string;
  geminiModel: string;
  openRouterKey: string;
  openRouterModel: string;
  openAiKey: string;
  openAiModel: string;
  multimodalEnabled: boolean;
  models: AiModelConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface AiModelConfig {
  id: string;
  label: string;
  provider: 'gemini' | 'openrouter' | 'openai';
  apiKey: string;
  model: string;
  multimodal: boolean;
  active: boolean;
}

export interface UploadedFile {
  id: string;
  _id?: string;
  name: string;
  url: string;
  markdown: string;
  mimeType: string;
  size: number;
  createdAt?: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description?: string;
  targetMonth?: number;
  tasks: RoadmapTask[];
}

export interface DailyHabit {
  id: string;
  title: string;
  targetMinutes?: number;
}

export interface DailyProgressLog {
  date: string;
  minutesSpent: number;
  habitsDone: string[];
  tasksDone?: string[];
  notes?: string;
}

export interface RoadmapNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Roadmap {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  dailyHabits: DailyHabit[];
  phases: RoadmapPhase[];
  dailyLogs: DailyProgressLog[];
  status: 'active' | 'completed' | 'paused';
  notes?: RoadmapNote[];
  createdAt: string;
  updatedAt: string;
}


