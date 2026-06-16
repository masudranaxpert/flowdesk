import mongoose from 'mongoose';

const userRef = { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true };

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationCodeHash: { type: String, default: '' },
  verificationExpires: { type: Date, default: null },
  resetCodeHash: { type: String, default: '' },
  resetExpires: { type: Date, default: null },
}, { timestamps: true });

const bookmarkSchema = new mongoose.Schema({
  userId: userRef,
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  favicon: { type: String, default: '' },
  tags: [{ type: String }],
  category: { type: String, default: 'general' },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

const notebookSchema = new mongoose.Schema({
  userId: userRef,
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: [{ type: String }],
  category: { type: String, default: 'general' },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

const codeSnippetSchema = new mongoose.Schema({
  userId: userRef,
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: 'cpp' },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  userId: userRef,
  title: { type: String, required: true },
  problem: { type: String, default: '' },
  solution: { type: String, default: '' },
  code: { type: String, default: '' },
  language: { type: String, default: 'cpp' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  platform: { type: String, default: 'codeforces' },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  isSolved: { type: Boolean, default: false },
  link: { type: String, default: '' },
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  userId: userRef,
  name: { type: String, required: true },
  slug: { type: String, required: true },
  scope: { type: String, enum: ['all', 'bookmark', 'notebook', 'code', 'question'], default: 'all' },
  color: { type: String, default: 'primary' },
}, { timestamps: true });

const routineSchema = new mongoose.Schema({
  userId: userRef,
  type: { type: String, enum: ['class', 'event'], default: 'class' },
  title: { type: String, required: true },
  subject: { type: String, default: '' },
  teacher: { type: String, default: '' },
  room: { type: String, default: '' },
  dayOfWeek: { type: Number, min: 0, max: 6, default: 0 },
  date: { type: String, default: '' },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakTime: { type: String, default: '' },
  repeatWeekly: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

const aiSettingSchema = new mongoose.Schema({
  userId: userRef,
  singleton: { type: String, default: 'default' },
  provider: { type: String, enum: ['gemini', 'openrouter', 'openai'], default: 'gemini' },
  geminiKey: { type: String, default: '' },
  geminiModel: { type: String, default: 'gemma-3-27b-it' },
  openRouterKey: { type: String, default: '' },
  openRouterModel: { type: String, default: 'google/gemma-3-27b-it' },
  openAiKey: { type: String, default: '' },
  openAiModel: { type: String, default: 'gpt-4o-mini' },
  multimodalEnabled: { type: Boolean, default: true },
  models: [{
    id: { type: String, required: true },
    label: { type: String, default: '' },
    provider: { type: String, enum: ['gemini', 'openrouter', 'openai'], default: 'gemini' },
    apiKey: { type: String, default: '' },
    model: { type: String, default: '' },
    multimodal: { type: Boolean, default: true },
    active: { type: Boolean, default: false },
  }],
}, { timestamps: true });

const chatHistorySchema = new mongoose.Schema({
  userId: userRef,
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
  }],
}, { timestamps: true });

categorySchema.index({ userId: 1, slug: 1 }, { unique: true });
aiSettingSchema.index({ userId: 1, singleton: 1 }, { unique: true });
chatHistorySchema.index({ userId: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);
const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', notebookSchema);
const CodeSnippet = mongoose.models.CodeSnippet || mongoose.model('CodeSnippet', codeSnippetSchema);
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const Routine = mongoose.models.Routine || mongoose.model('Routine', routineSchema);
const AiSetting = mongoose.models.AiSetting || mongoose.model('AiSetting', aiSettingSchema);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);

export { User, Bookmark, Notebook, CodeSnippet, Question, Category, Routine, AiSetting, ChatHistory };
