import { type ClipboardEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CheckCircle2, ChevronDown, FileImage, ImageOff, MessageSquare, Paperclip, Save, Send, Settings, ShieldAlert, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fileToAiFile, runAiChat, type AiFile, type AiModelConfig, type AiSettings, type ChatMessage, defaultAiSettings } from '../lib/ai';
import MarkdownView from '../components/MarkdownView';
import { FormField, Spinner } from '../components/UI';
import { Select } from '../components/Select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const providerOptions = [
  { value: 'gemini', label: 'Google Gemini / Gemma' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI compatible' },
];
const defaultMessages: ChatMessage[] = [{ role: 'assistant', content: 'Ask me to find notes, summarize code, plan routines, or turn an idea into a bookmark/note/question.' }];
const chatHistoryKey = 'bookmark-vault-chat-history-v1';
const chatHistoryLimit = 50;

function cleanHistoryMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim())
    .slice(-chatHistoryLimit)
    .map((message) => {
      const next: ChatMessage = {
        role: message.role === 'user' ? 'user' as const : 'assistant' as const,
        content: message.content.slice(0, 20000),
      };
      if (Array.isArray(message.actionBatches) && message.actionBatches.length > 0) {
        next.actionBatches = message.actionBatches.slice(-4);
      }
      return next;
    });
}

type AiAction = {
  operation: 'create' | 'update' | 'update_many' | 'delete' | 'delete_many' | 'delete_all';
  resource: 'bookmarks' | 'notebooks' | 'codes' | 'questions' | 'routines' | 'categories' | 'passwords';
  id?: string;
  ids?: string[];
  data?: Record<string, any>;
};

type ActionBatchStatus = 'pending' | 'completed' | 'cancelled' | 'blocked';

type ActionRejection = {
  action: AiAction;
  reason: string;
};

type ActionBatch = {
  id: string;
  status: ActionBatchStatus;
  actions: AiAction[];
  rejected: ActionRejection[];
  createdAt: string;
};

type VaultContext = {
  bookmarks: any[];
  notes: any[];
  codes: any[];
  questions: any[];
  routines: any[];
  categories: any[];
  passwords: any[];
};

const categoryScopes = ['all', 'bookmark', 'notebook', 'code', 'question', 'password'] as const;

function slugifyCategory(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'category';
}

function normalizeCategoryScope(value: unknown) {
  const raw = String(value || '').trim().toLowerCase();
  if (categoryScopes.includes(raw as any)) return raw;
  if (['bookmarks', 'link', 'links', 'bookmark-only'].includes(raw)) return 'bookmark';
  if (['notebooks', 'notes', 'note', 'notebook-only'].includes(raw)) return 'notebook';
  if (['codes', 'codebook', 'snippet', 'snippets', 'code-only'].includes(raw)) return 'code';
  if (['questions', 'question', 'qa', 'q&a', 'cp', 'problem', 'problems'].includes(raw)) return 'question';
  if (['passwords', 'password', 'secret', 'secrets', 'credential', 'credentials', 'password-only'].includes(raw)) return 'password';
  return '';
}

const emptyVaultContext: VaultContext = {
  bookmarks: [],
  notes: [],
  codes: [],
  questions: [],
  routines: [],
  categories: [],
  passwords: [],
};

const resourceContextKey: Record<AiAction['resource'], keyof VaultContext> = {
  bookmarks: 'bookmarks',
  notebooks: 'notes',
  codes: 'codes',
  questions: 'questions',
  routines: 'routines',
  categories: 'categories',
  passwords: 'passwords',
};

function normalizeActions(value: unknown): AiAction[] {
  if (Array.isArray(value)) return value as AiAction[];
  if (value && typeof value === 'object' && Array.isArray((value as { actions?: unknown }).actions)) {
    return (value as { actions: AiAction[] }).actions;
  }
  if (value && typeof value === 'object' && 'operation' in value && 'resource' in value) return [value as AiAction];
  return [];
}

function extractActions(text: string) {
  const matches = Array.from(text.matchAll(/```ACTION_JSON\s*([\s\S]*?)```/gi));
  const actions: AiAction[] = [];
  let malformed = 0;
  for (const match of matches) {
    try {
      actions.push(...normalizeActions(JSON.parse(match[1])));
    } catch {
      malformed += 1;
    }
  }
  return { actions, malformed };
}

function hideActionBlock(text: string) {
  return text
    .replace(/```ACTION_JSON\s*[\s\S]*?```/gi, '')
    .replace(/```ACTION_JSON\s*[\s\S]*$/i, '')
    .trim();
}

function isWritingAction(text: string) {
  return /```ACTION_JSON/i.test(text) && !/```ACTION_JSON\s*[\s\S]*?```/i.test(text);
}

function sanitizeActionData(resource: AiAction['resource'], data: Record<string, any>, operation?: AiAction['operation']) {
  const next = { ...data };
  if (resource === 'categories') {
    if (operation === 'create') {
      const inferredScope =
        normalizeCategoryScope(next.scope) ||
        normalizeCategoryScope(next.section) ||
        normalizeCategoryScope(next.target) ||
        normalizeCategoryScope(next.resource) ||
        normalizeCategoryScope(next.type);
      next.scope = inferredScope || 'bookmark';
      next.name = String(next.name || next.title || '').trim();
    } else {
      if (next.scope !== undefined) {
        const inferredScope = normalizeCategoryScope(next.scope);
        if (inferredScope) next.scope = inferredScope;
      }
      if (next.name !== undefined) {
        next.name = String(next.name || next.title || '').trim();
      }
    }
    delete next.section;
    delete next.target;
    delete next.resource;
    delete next.type;
  }
  if (resource === 'routines') {
    if (operation === 'create') {
      const type = String(next.type || '').toLowerCase();
      next.type = type === 'class' ? 'class' : 'event';
      if (typeof next.repeatWeekly !== 'boolean') next.repeatWeekly = next.type === 'class';
      if (next.type === 'event' && !next.date && next.repeatWeekly) next.type = 'class';
      if (!next.startTime) next.startTime = '09:00';
      if (!next.endTime) next.endTime = '10:00';
    } else {
      if (next.type !== undefined) {
        const type = String(next.type || '').toLowerCase();
        next.type = type === 'class' ? 'class' : 'event';
      }
      if (next.repeatWeekly !== undefined && typeof next.repeatWeekly !== 'boolean') {
        next.repeatWeekly = next.type === 'class';
      }
      if (next.startTime !== undefined && !next.startTime) {
        next.startTime = '09:00';
      }
      if (next.endTime !== undefined && !next.endTime) {
        next.endTime = '10:00';
      }
    }
  }
  if (resource === 'questions') {
    if (next.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(next.difficulty)) {
      if (operation === 'create') {
        next.difficulty = 'medium';
      } else {
        delete next.difficulty;
      }
    }
  }
  return next;
}

function normalizeComparable(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeTime(value: unknown) {
  const raw = String(value ?? '').trim();
  if (/^\d:\d\d$/.test(raw)) return `0${raw}`;
  return raw;
}

function compactRoutine(item: any) {
  return {
    id: item._id,
    title: item.title,
    subject: item.subject,
    type: item.type,
    dayOfWeek: item.dayOfWeek,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    room: item.room,
    teacher: item.teacher,
    repeatWeekly: item.repeatWeekly,
  };
}

function actionLabel(action: AiAction) {
  const data = action.data || {};
  const target =
    data.title ||
    data.subject ||
    data.name ||
    data.url ||
    action.id ||
    action.ids?.join(', ') ||
    action.resource;
  return `${action.operation} ${action.resource}${target ? ` - ${String(target).slice(0, 90)}` : ''}`;
}

function actionLabelWithContext(action: AiAction, vault: VaultContext) {
  const current = findVaultItem(action, vault);
  const title = current?.title || current?.subject || current?.name;
  if (!title) return actionLabel(action);
  return `${action.operation} ${action.resource} - ${String(title).slice(0, 90)}`;
}

function actionStatusMeta(status: ActionBatchStatus) {
  if (status === 'completed') return { label: 'Completed', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300', icon: CheckCircle2 };
  if (status === 'cancelled') return { label: 'Cancelled', className: 'border-muted-foreground/20 bg-muted/50 text-muted-foreground', icon: X };
  if (status === 'blocked') return { label: 'Blocked', className: 'border-destructive/25 bg-destructive/10 text-destructive', icon: ShieldAlert };
  return { label: 'Pending approval', className: 'border-primary/25 bg-primary/10 text-primary', icon: ShieldAlert };
}

function normalizeActionBatch(value: any): ActionBatch | null {
  if (!value || typeof value !== 'object') return null;
  const status = ['pending', 'completed', 'cancelled', 'blocked'].includes(value.status) ? value.status as ActionBatchStatus : 'blocked';
  return {
    id: String(value.id || crypto.randomUUID()),
    status,
    actions: Array.isArray(value.actions) ? value.actions : [],
    rejected: Array.isArray(value.rejected) ? value.rejected : [],
    createdAt: String(value.createdAt || new Date().toISOString()),
  };
}

function actionBatchesFromMessages(messages: ChatMessage[]) {
  return messages
    .flatMap((message) => Array.isArray(message.actionBatches) ? message.actionBatches : [])
    .map(normalizeActionBatch)
    .filter((batch): batch is ActionBatch => Boolean(batch))
    .slice(-8)
    .reverse();
}

function actionRisk(action: AiAction) {
  if (action.operation === 'delete_all') return 'High risk';
  if (action.operation === 'delete_many') return `${action.ids?.length || 0} deletes`;
  if (action.operation === 'delete') return 'Delete';
  if (action.operation === 'update_many') return `${action.ids?.length || 0} updates`;
  return action.operation === 'update' ? 'Update' : 'Create';
}

function hasDestructiveAction(actions: AiAction[]) {
  return actions.some((action) => action.operation === 'delete' || action.operation === 'delete_many' || action.operation === 'delete_all');
}

function actionSummaries(actions: AiAction[]) {
  const counts = new Map<string, number>();
  for (const action of actions) {
    const key = `${action.operation} ${action.resource}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function findVaultItem(action: AiAction, vault: VaultContext) {
  const list = vault[resourceContextKey[action.resource]] || [];
  const id = String(action.id || action.data?.id || action.data?._id || '').trim();
  if (!id) return null;
  return list.find((item) => String(item.id || item._id) === id) || null;
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === undefined || value === null || value === '') return 'empty';
  return String(value);
}

function actionDetails(action: AiAction, vault: VaultContext) {
  if (action.operation === 'delete_all') return [`Will delete all ${action.resource}.`];
  if (action.operation === 'delete_many') return [`Will delete ${action.ids?.length || 0} ${action.resource}.`];
  if (action.operation === 'delete') return [`Will delete ID ${action.id}.`];
  if (action.operation === 'update_many') {
    const data = sanitizeActionData(action.resource, action.data || {}, action.operation);
    const { id: _id, _id: _legacyId, ids: _ids, ...payload } = data;
    const fields = Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .slice(0, 8)
      .map(([key, value]) => `${key}: ${displayValue(value)}`);
    return [`Will update ${action.ids?.length || 0} ${action.resource}.`, ...fields];
  }

  const data = sanitizeActionData(action.resource, action.data || {}, action.operation);
  const { id: _id, _id: _legacyId, ...payload } = data;
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (action.operation === 'create') {
    return entries.slice(0, 8).map(([key, value]) => `${key}: ${displayValue(value)}`);
  }

  const current = findVaultItem(action, vault);
  if (!current) return entries.slice(0, 8).map(([key, value]) => `${key}: ${displayValue(value)}`);
  const changes = entries
    .filter(([key, value]) => displayValue(current[key]) !== displayValue(value))
    .map(([key, value]) => `${key}: ${displayValue(current[key])} -> ${displayValue(value)}`);
  return changes.length > 0 ? changes.slice(0, 10) : ['No visible field changes.'];
}

function resolveActionId(action: AiAction, list: any[]) {
  const explicitId = String(action.id || action.data?.id || action.data?._id || '').trim();
  if (explicitId) return explicitId;

  const data = action.data || {};
  let candidates = list;
  const title = normalizeComparable(data.title || data.subject || data.name);
  if (title) {
    candidates = candidates.filter((item) => {
      const itemTitle = normalizeComparable(item.title || item.subject || item.name);
      const itemSubject = normalizeComparable(item.subject);
      return itemTitle === title || itemSubject === title;
    });
  }

  if (action.resource === 'routines') {
    if (data.type !== undefined) candidates = candidates.filter((item) => normalizeComparable(item.type) === normalizeComparable(data.type));
    if (data.dayOfWeek !== undefined) candidates = candidates.filter((item) => Number(item.dayOfWeek) === Number(data.dayOfWeek));
    if (data.date !== undefined) candidates = candidates.filter((item) => normalizeComparable(item.date) === normalizeComparable(data.date));
    if (data.startTime !== undefined) candidates = candidates.filter((item) => normalizeTime(item.startTime) === normalizeTime(data.startTime));
    if (data.endTime !== undefined) candidates = candidates.filter((item) => normalizeTime(item.endTime) === normalizeTime(data.endTime));
  }

  if (candidates.length !== 1) return '';
  return String(candidates[0].id || candidates[0]._id || '').trim();
}

function validateActions(actions: AiAction[], vault: VaultContext) {
  const valid: AiAction[] = [];
  const rejected: ActionRejection[] = [];

  const reject = (action: AiAction, reason: string) => {
    rejected.push({ action, reason });
  };

  for (const action of actions) {
    if (!['create', 'update', 'update_many', 'delete', 'delete_many', 'delete_all'].includes(action.operation) || !(action.resource in resourceContextKey)) {
      reject(action, 'Unsupported operation or resource.');
      continue;
    }

    if (action.operation === 'create') {
      valid.push(action);
      continue;
    }

    if (action.operation === 'delete_all') {
      if (action.data?.scope === 'all' || action.data?.confirm === 'all') valid.push(action);
      else reject(action, 'delete_all requires explicit scope/confirm "all".');
      continue;
    }

    if (action.operation === 'update_many' || action.operation === 'delete_many' || ((action.operation === 'update' || action.operation === 'delete') && Array.isArray(action.ids))) {
      const rawIds = action.ids || (Array.isArray(action.data?.ids) ? action.data.ids : []);
      const ids = Array.from(new Set(rawIds.map((id) => String(id).trim()).filter(Boolean)));
      const list = vault[resourceContextKey[action.resource]] || [];
      const existing = new Set(list.map((item) => String(item.id || item._id)));
      const validIds = ids.filter((id) => existing.has(id));
      if (validIds.length !== ids.length || validIds.length === 0) {
        reject(action, `Only ${validIds.length} of ${ids.length} target IDs exist in current data.`);
        continue;
      }
      valid.push({ ...action, operation: action.operation === 'delete' || action.operation === 'delete_many' ? 'delete_many' : 'update_many', ids: validIds });
      continue;
    }

    const list = vault[resourceContextKey[action.resource]] || [];
    const actionId = resolveActionId(action, list);
    if (!actionId) {
      reject(action, 'Target ID was missing or ambiguous in current data.');
      continue;
    }

    const exists = list.some((item) => String(item.id || item._id) === actionId);
    if (!exists) {
      reject(action, `Target ID "${actionId}" was not found in current data.`);
      continue;
    }

    valid.push({ ...action, id: actionId });
  }

  return { valid, rejected };
}

export default function ChatbotPage() {
  const [tab, setTab] = useState<'chat' | 'settings'>('chat');
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [historyReady, setHistoryReady] = useState(false);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AiFile[]>([]);
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState('');
  const [pendingActions, setPendingActions] = useState<AiAction[]>([]);
  const [pendingActionBatchId, setPendingActionBatchId] = useState('');
  const [actionBatches, setActionBatches] = useState<ActionBatch[]>([]);
  const [expandedActionBatchId, setExpandedActionBatchId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [writingAction, setWritingAction] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [vaultContext, setVaultContext] = useState<VaultContext>(emptyVaultContext);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [draftModel, setDraftModel] = useState<AiModelConfig>({
    id: '',
    label: '',
    provider: 'gemini',
    apiKey: '',
    model: 'gemma-3-27b-it',
    multimodal: true,
    active: false,
  });

  const loadSettings = useCallback(() => {
    setLoadingSettings(true);
    api.aiSettings.get()
      .then((data) => setSettings({ ...defaultAiSettings, ...data, models: data.models || [] }))
      .catch(() => toast.error('Failed to load AI settings'))
      .finally(() => setLoadingSettings(false));
  }, []);

  const restoreActionBatches = useCallback((historyMessages: ChatMessage[]) => {
    const batches = actionBatchesFromMessages(historyMessages);
    setActionBatches(batches);
    const pending = batches.find((batch) => batch.status === 'pending' && batch.actions.length > 0);
    setPendingActions(pending?.actions || []);
    setPendingActionBatchId(pending?.id || '');
    setExpandedActionBatchId(pending?.id || '');
  }, []);

  useEffect(() => loadSettings(), [loadSettings]);

  useEffect(() => {
    let cancelled = false;
    api.chatHistory.get()
      .then(async (data) => {
        if (cancelled) return;
        const dbMessages = Array.isArray(data.messages) ? cleanHistoryMessages(data.messages as ChatMessage[]) : [];
        if (dbMessages.length > 0) {
          setMessages(dbMessages);
          restoreActionBatches(dbMessages);
          return;
        }

        const localMessages = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]') as ChatMessage[];
        const migrated = Array.isArray(localMessages) ? cleanHistoryMessages(localMessages) : [];
        if (migrated.length > 0) {
          setMessages(migrated);
          restoreActionBatches(migrated);
          await api.chatHistory.update(migrated).catch(() => {});
          localStorage.removeItem(chatHistoryKey);
          return;
        }

        setMessages(defaultMessages);
        restoreActionBatches([]);
      })
      .catch(() => {
        try {
          const saved = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]') as ChatMessage[];
          const cleaned = saved.length ? cleanHistoryMessages(saved) : defaultMessages;
          setMessages(cleaned);
          restoreActionBatches(cleaned);
        } catch {
          setMessages(defaultMessages);
          restoreActionBatches([]);
        }
        toast.error('Failed to load chat history');
      })
      .finally(() => {
        if (!cancelled) setHistoryReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [restoreActionBatches]);

  useEffect(() => {
    if (!historyReady) return;
    const t = setTimeout(() => {
      const saved = cleanHistoryMessages(messages);
      api.chatHistory.update(saved).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [messages, historyReady]);

  useEffect(() => {
    if (!historyReady || actionBatches.length === 0) return;
    setMessages((current) => {
      const savedIds = new Set(
        current.flatMap((message) => Array.isArray(message.actionBatches) ? message.actionBatches.map((batch: any) => String(batch?.id || '')) : [])
      );
      const missing = actionBatches.filter((batch) => !savedIds.has(batch.id));
      if (missing.length === 0) return current;
      const copy = [...current];
      for (let index = copy.length - 1; index >= 0; index -= 1) {
        if (copy[index]?.role === 'assistant') {
          const existing = Array.isArray(copy[index].actionBatches) ? copy[index].actionBatches || [] : [];
          copy[index] = { ...copy[index], actionBatches: [...existing, ...missing].slice(-4) };
          return copy;
        }
      }
      return current;
    });
  }, [actionBatches, historyReady]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, pendingActions]);

  useEffect(() => {
    const pending = localStorage.getItem('chatbot-pending-prompt');
    if (pending) {
      setInput(pending);
      setTab('chat');
      localStorage.removeItem('chatbot-pending-prompt');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, []);

  const updateActionBatch = useCallback((id: string, patch: Partial<ActionBatch>) => {
    if (!id) return;
    setActionBatches((current) => current.map((batch) => batch.id === id ? { ...batch, ...patch } : batch));
    setMessages((current) => current.map((message) => {
      if (!Array.isArray(message.actionBatches) || message.actionBatches.length === 0) return message;
      const nextBatches = message.actionBatches.map((batch: any) => batch?.id === id ? { ...batch, ...patch } : batch);
      return { ...message, actionBatches: nextBatches };
    }));
  }, []);

  const addActionBatch = useCallback((batch: Omit<ActionBatch, 'id' | 'createdAt'>) => {
    const fullBatch: ActionBatch = { ...batch, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setActionBatches((current) => [
      fullBatch,
      ...current,
    ].slice(0, 8));
    setMessages((current) => {
      const copy = [...current];
      for (let index = copy.length - 1; index >= 0; index -= 1) {
        if (copy[index]?.role === 'assistant') {
          const existing = Array.isArray(copy[index].actionBatches) ? copy[index].actionBatches || [] : [];
          copy[index] = { ...copy[index], actionBatches: [...existing, fullBatch].slice(-4) };
          break;
        }
      }
      return copy;
    });
    setExpandedActionBatchId(fullBatch.id);
    return fullBatch.id;
  }, []);

  const cancelPendingActions = useCallback(() => {
    if (pendingActionBatchId) updateActionBatch(pendingActionBatchId, { status: 'cancelled' });
    setPendingActions([]);
    setPendingActionBatchId('');
  }, [pendingActionBatchId, updateActionBatch]);

  const refreshContext = useCallback(async () => {
    const [bookmarks, notes, codes, questions, routines, categories, passwords] = await Promise.all([
      api.bookmarks.list(),
      api.notebooks.list(),
      api.codes.list(),
      api.questions.list(),
      api.routines.list(),
      api.categories.list(),
      api.passwords.list(),
    ]);
    const passwordItems = Array.isArray((passwords as any).items) ? (passwords as any).items : passwords;
    const fullContext = {
      bookmarks: bookmarks.map((item: any) => ({ id: item._id, title: item.title, url: item.url, category: item.category, tags: item.tags })),
      notes: notes.map((item: any) => ({ id: item._id, title: item.title, category: item.category, preview: item.content?.slice?.(0, 500) || '' })),
      codes: codes.map((item: any) => ({ id: item._id, title: item.title, language: item.language, category: item.category, description: item.description })),
      questions: questions.map((item: any) => ({ id: item._id, title: item.title, platform: item.platform, category: item.category, solved: item.isSolved })),
      routines: routines.map(compactRoutine),
      categories: categories.map((item: any) => ({ id: item._id, name: item.name, slug: item.slug, scope: item.scope })),
      passwords: passwordItems.map((item: any) => ({ id: item._id, title: item.title, url: item.url, username: item.username, password: item.password, category: item.category })),
    };
    const promptContext = {
      bookmarks: fullContext.bookmarks.slice(0, 80),
      notes: fullContext.notes.slice(0, 60),
      codes: fullContext.codes.slice(0, 60),
      questions: fullContext.questions.slice(0, 80),
      routines: fullContext.routines.slice(0, 200),
      categories: fullContext.categories.slice(0, 120),
      passwords: fullContext.passwords.slice(0, 50),
      actionIndex: {
        bookmarks: fullContext.bookmarks.slice(0, 200).map(({ id, title }: any) => ({ id, title })),
        notebooks: fullContext.notes.slice(0, 200).map(({ id, title }: any) => ({ id, title })),
        codes: fullContext.codes.slice(0, 200).map(({ id, title }: any) => ({ id, title })),
        questions: fullContext.questions.slice(0, 200).map(({ id, title }: any) => ({ id, title })),
        routines: fullContext.routines.map(({ id, title, subject, type, dayOfWeek, date, startTime, endTime, room, teacher, repeatWeekly }: any) => ({ id, title, subject, type, dayOfWeek, date, startTime, endTime, room, teacher, repeatWeekly })),
        categories: fullContext.categories.slice(0, 200).map(({ id, name, slug, scope }: any) => ({ id, title: name, slug, scope })),
        passwords: fullContext.passwords.slice(0, 100).map(({ id, title }: any) => ({ id, title })),
      },
    };
    const prompt = JSON.stringify(promptContext, null, 2);
    setVaultContext(fullContext);
    setContext(prompt);
    return { vault: fullContext, context: prompt };
  }, []);

  useEffect(() => {
    refreshContext().catch(() => {});
  }, [refreshContext]);

  const enabledModels = useMemo(() => (settings.models || []).filter((model) => model.active), [settings.models]);
  const selectedModel = useMemo(
    () => enabledModels.find((model) => model.id === selectedModelId) ?? enabledModels[0] ?? null,
    [enabledModels, selectedModelId]
  );
  const selectedRunSettings = useMemo(
    () => ({ ...settings, models: (settings.models || []).map((model) => ({ ...model, active: model.id === selectedModel?.id })) }),
    [settings, selectedModel]
  );

  useEffect(() => {
    if (!selectedModelId && enabledModels[0]) setSelectedModelId(enabledModels[0].id);
    if (selectedModelId && enabledModels.length > 0 && !enabledModels.some((model) => model.id === selectedModelId)) setSelectedModelId(enabledModels[0].id);
  }, [enabledModels, selectedModelId]);

  const addModel = async () => {
    if (!draftModel.label.trim() || !draftModel.apiKey.trim() || !draftModel.model.trim()) return toast.error('Label, API key and model are required');
    const nextModel = { ...draftModel, id: crypto.randomUUID(), active: (settings.models || []).length === 0 };
    const next = { ...settings, models: [...(settings.models || []), nextModel] };
    setSettings(next);
    await api.aiSettings.update(next as any);
    setDraftModel({ id: '', label: '', provider: 'gemini', apiKey: '', model: 'gemma-3-27b-it', multimodal: true, active: false });
    toast.success('Model added');
  };

  const toggleModel = async (id: string) => {
    const next = { ...settings, models: (settings.models || []).map((model) => model.id === id ? { ...model, active: !model.active } : model) };
    setSettings(next);
    await api.aiSettings.update(next as any);
  };

  const setPrimaryModel = async (id: string) => {
    const models = [...(settings.models || [])];
    const index = models.findIndex(m => m.id === id);
    if (index > -1) {
      const [model] = models.splice(index, 1);
      model.active = true;
      models.unshift(model);
      const next = { ...settings, models };
      setSettings(next);
      await api.aiSettings.update(next as any);
      toast.success('Set as primary model');
    }
  };

  const removeModel = async (id: string) => {
    const nextModels = (settings.models || []).filter((model) => model.id !== id);
    if (!nextModels.some((model) => model.active) && nextModels[0]) nextModels[0].active = true;
    const next = { ...settings, models: nextModels };
    setSettings(next);
    await api.aiSettings.update(next as any);
    toast.success('Model removed');
  };

  const attach = async (selected: FileList | File[] | null, source = 'file') => {
    const seen = new Set<string>();
    const incoming = (selected ? Array.from(selected) : []).filter((file) => {
      const key = `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
      if (file.size <= 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (incoming.length === 0) return;
    if (!selectedModel?.multimodal) return toast.error('Selected model file/image support inactive');
    if (incoming.length > 5) toast.error('Maximum 5 files can be attached at once');
    const converted = await Promise.all(incoming.slice(0, 5).map(fileToAiFile));
    setFiles((current) => {
      const next = [...current, ...converted].slice(0, 5);
      return next;
    });
    toast.success(`${converted.length} ${source}${converted.length === 1 ? '' : 's'} attached`);
  };

  const dropFiles = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    await attach(event.dataTransfer.files, 'file');
  };

  const pasteFiles = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files || []);
    const itemFiles = Array.from(event.clipboardData.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    const pasted = files.length > 0 ? files : itemFiles;
    if (pasted.length === 0) return;
    event.preventDefault();
    await attach(pasted, 'paste item');
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const insertNewLine = (target: HTMLTextAreaElement) => {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${input.slice(0, start)}\n${input.slice(end)}`;
    setInput(next);
    requestAnimationFrame(() => {
      target.selectionStart = start + 1;
      target.selectionEnd = start + 1;
    });
  };

  const send = async () => {
    if ((!input.trim() && files.length === 0) || sending) return;
    if (!selectedModel) {
      toast.error('Activate one AI model first');
      setTab('settings');
      return;
    }
    const sentFiles = files;
    const attachmentLabel = sentFiles.length > 0 ? `\n\nAttached: ${sentFiles.map((file) => file.name).join(', ')}` : '';
    const user: ChatMessage = { role: 'user', content: `${input.trim() || '[attached file]'}${attachmentLabel}`, files: sentFiles };
    const next = [...messages, user, { role: 'assistant' as const, content: '' }];
    let streamedAnswer = '';
    setMessages(next);
    setInput('');
    setFiles([]);
    cancelPendingActions();
    setWritingAction(false);
    setSending(true);
    try {
      const freshContext = await refreshContext();
      const answer = await runAiChat(selectedRunSettings, [...messages, user], freshContext.context, sentFiles, {
        onDelta: (delta) => {
          streamedAnswer += delta;
          const visible = hideActionBlock(streamedAnswer);
          const writing = isWritingAction(streamedAnswer);
          setWritingAction(writing);
          setMessages((current) => {
            const copy = [...current];
            const lastIndex = copy.length - 1;
            if (copy[lastIndex]?.role === 'assistant') copy[lastIndex] = { ...copy[lastIndex], role: 'assistant', content: visible };
            return copy;
          });
        },
      });
      setWritingAction(false);
      const extracted = extractActions(answer);
      const actions = extracted.actions;
      const validation = validateActions(actions, freshContext.vault);
      let batchId = '';
      const malformedRejections: ActionRejection[] = Array.from({ length: extracted.malformed }, () => ({
        action: { operation: 'create', resource: 'notebooks', data: { title: 'Malformed ACTION_JSON block' } },
        reason: 'The model returned an action block that was not valid JSON, so it was not executed.',
      }));
      if (actions.length > 0 || malformedRejections.length > 0) {
        batchId = addActionBatch({
          status: validation.valid.length > 0 ? 'pending' : 'blocked',
          actions: validation.valid,
          rejected: [...validation.rejected, ...malformedRejections],
        });
      }
      if (validation.valid.length > 0) {
        setPendingActions(validation.valid);
        setPendingActionBatchId(batchId);
      }
      const finalContent = hideActionBlock(answer) || (
        validation.valid.length > 0
          ? `${validation.valid.length} action${validation.valid.length === 1 ? '' : 's'} ready. Please approve below.`
          : 'I could not prepare a safe action because the target item was not found in your current data.'
      );
      setMessages((current) => {
        const copy = [...current];
        const lastIndex = copy.length - 1;
        if (copy[lastIndex]?.role === 'assistant') copy[lastIndex] = { ...copy[lastIndex], role: 'assistant', content: finalContent };
        else copy.push({ role: 'assistant', content: finalContent });
        return copy;
      });
      if (validation.rejected.length > 0) {
        toast.error(`${validation.rejected.length} unsafe action${validation.rejected.length === 1 ? '' : 's'} blocked`);
      }
      if (extracted.malformed > 0) {
        toast.error(`${extracted.malformed} malformed action block${extracted.malformed === 1 ? '' : 's'} blocked`);
      }
    } catch (error) {
      setWritingAction(false);
      setMessages((current) => current.filter((message, index) => index !== current.length - 1 || message.role !== 'assistant' || message.content.trim()));
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setSending(false);
    }
  };

  const executeAction = async () => {
    if (pendingActions.length === 0) return;
    setExecuting(true);
    const map: Record<string, any> = {
      bookmarks: api.bookmarks,
      notebooks: api.notebooks,
      codes: api.codes,
      questions: api.questions,
      routines: api.routines,
      categories: api.categories,
      passwords: api.passwords,
    };
    try {
      const validation = validateActions(pendingActions, vaultContext);
      if (validation.rejected.length > 0) {
        setPendingActions(validation.valid);
        if (pendingActionBatchId) updateActionBatch(pendingActionBatchId, { status: validation.valid.length > 0 ? 'pending' : 'blocked', actions: validation.valid, rejected: validation.rejected });
        if (validation.valid.length === 0) setPendingActionBatchId('');
        throw new Error(`${validation.rejected.length} unsafe action blocked because the target id was not found in your data`);
      }
      for (const action of validation.valid) {
        const { operation, resource, id, data = {} } = action;
        const cleanData = sanitizeActionData(resource, data, operation);
        const actionId = id || String(cleanData.id || cleanData._id || '');
        const { id: _ignoredId, _id: _ignoredLegacyId, ids: _ignoredIds, ...payload } = cleanData;
        const target = map[resource];
        if (!target) throw new Error(`Unsupported action: ${resource}`);
        if (operation === 'create') {
          if (resource === 'categories') {
            const requestedName = String(payload.name || '').trim();
            const requestedSlug = slugifyCategory(String(payload.slug || requestedName));
            const existing = vaultContext.categories.find((item) => item.slug === requestedSlug || item.name?.toLowerCase?.() === requestedName.toLowerCase());
            if (existing) {
              await target.update(existing.id || existing._id, { scope: payload.scope || 'bookmark' });
            } else {
              await target.create(payload);
            }
          } else {
            await target.create(payload);
          }
        }
        if (operation === 'delete_all') {
          if (resource === 'routines') await api.routines.reset('all');
          else {
            const currentItems = await target.list();
            for (const item of currentItems) await target.delete(item._id || item.id);
          }
        }
        if (operation === 'delete_many') {
          for (const itemId of action.ids || []) await target.delete(itemId);
        }
        if (operation === 'update_many') {
          for (const itemId of action.ids || []) await target.update(itemId, payload);
        }
        if (operation === 'update') {
          if (!actionId) throw new Error(`Update ${resource} needs id`);
          await target.update(actionId, payload);
        }
        if (operation === 'delete') {
          if (!actionId) throw new Error(`Delete ${resource} needs id`);
          await target.delete(actionId);
        }
      }
      setPendingActions([]);
      if (pendingActionBatchId) updateActionBatch(pendingActionBatchId, { status: 'completed' });
      setPendingActionBatchId('');
      toast.success(`${pendingActions.length} action${pendingActions.length === 1 ? '' : 's'} completed`);
      refreshContext().catch(() => {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setExecuting(false);
    }
  };

  const saveLastAsNote = async () => {
    const last = messages[messages.length - 1];
    if (!last) return;
    await api.notebooks.create({ title: 'AI note', content: last.content, category: 'general', tags: ['ai'] });
    toast.success('Saved as note');
    refreshContext();
  };

  const clearHistory = async () => {
    try {
      await api.chatHistory.clear();
      localStorage.removeItem(chatHistoryKey);
      setMessages([{ role: 'assistant', content: 'History cleared. Ask me anything.' }]);
      setPendingActions([]);
      setPendingActionBatchId('');
      setActionBatches([]);
      setExpandedActionBatchId('');
      setWritingAction(false);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear chat history');
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden space-y-5 animate-fade-in">
      <Card className="min-w-0 rounded-3xl border-primary/15">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">AI Assistant</p>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Assistant</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ask, search, attach files, and approve tool actions.</p>
          </div>
          <div className="flex w-full rounded-2xl border border-border bg-muted/35 p-1 sm:w-auto">
            <Button variant={tab === 'chat' ? 'secondary' : 'ghost'} onClick={() => setTab('chat')}>
              <MessageSquare className="h-4 w-4" /> Chat
            </Button>
            <Button variant={tab === 'settings' ? 'secondary' : 'ghost'} onClick={() => setTab('settings')}>
              <Settings className="h-4 w-4" /> API
            </Button>
          </div>
        </CardContent>
      </Card>

      {tab === 'settings' ? (
        <Card className="min-w-0 rounded-3xl">
          <CardContent className="space-y-4 p-5">
            {loadingSettings ? <Spinner /> : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField label="Model label">
                    <Input value={draftModel.label} onChange={(event) => setDraftModel({ ...draftModel, label: event.target.value })} placeholder="Gemma main, OpenRouter backup..." />
                  </FormField>
                  <FormField label="Provider">
                    <Select value={draftModel.provider} onChange={(provider) => setDraftModel({ ...draftModel, provider: provider as AiSettings['provider'], model: provider === 'openrouter' ? 'google/gemma-3-27b-it' : provider === 'openai' ? 'gpt-4o-mini' : 'gemma-3-27b-it' })} options={providerOptions} />
                  </FormField>
                  <FormField label="API key">
                    <Input value={draftModel.apiKey} onChange={(event) => setDraftModel({ ...draftModel, apiKey: event.target.value })} type="password" placeholder="Provider API key" />
                  </FormField>
                  <FormField label="Model name">
                    <Input value={draftModel.model} onChange={(event) => setDraftModel({ ...draftModel, model: event.target.value })} placeholder="gemma-3-27b-it" />
                  </FormField>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={draftModel.multimodal ? 'default' : 'outline'} onClick={() => setDraftModel({ ...draftModel, multimodal: !draftModel.multimodal })}>
                    {draftModel.multimodal ? <FileImage className="h-4 w-4" /> : <ImageOff className="h-4 w-4" />}
                    {draftModel.multimodal ? 'File/Image active' : 'File/Image inactive'}
                  </Button>
                  <Button onClick={addModel}>
                    <Save className="h-4 w-4" /> Add Model
                  </Button>
                </div>

                <div className="grid gap-3">
                  {(settings.models || []).map((model) => (
                    <div key={model.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/35 p-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{model.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{model.provider} - {model.model}</p>
                      </div>
                      <Badge variant={model.multimodal ? 'secondary' : 'outline'} className="rounded-full">{model.multimodal ? 'files on' : 'files off'}</Badge>
                      <Badge variant={model.active ? 'default' : 'outline'} className="rounded-full">{model.active ? 'Enabled' : 'Disabled'}</Badge>
                      <Button variant="outline" onClick={() => toggleModel(model.id)}>{model.active ? 'Deactivate' : 'Activate'}</Button>
                      <Button variant="secondary" onClick={() => setPrimaryModel(model.id)}>Set Primary</Button>
                      <Button variant="destructive" onClick={() => removeModel(model.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card
            className={`min-w-0 overflow-hidden rounded-3xl border-border/70 bg-background/65 ${dragging ? 'ring-2 ring-primary/60' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={dropFiles}
          >
            <CardContent className="chat-shell flex min-h-[26rem] flex-col p-0">
              <div className="flex flex-col gap-2 border-b border-border/70 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Assistant thread</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedModel ? `${selectedModel.provider} - ${selectedModel.model}` : 'No active model'}
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={selectedModel?.id || ''}
                    onChange={setSelectedModelId}
                    options={enabledModels.length > 0 ? enabledModels.map((model) => ({ value: model.id, label: model.label || model.model })) : []}
                    placeholder={enabledModels.length > 0 ? "Select active model" : "No models configured"}
                  />
                </div>
              </div>

              <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
                <div className="chat-scroll-content mx-auto flex min-h-full w-full max-w-3xl flex-col px-3 py-5 sm:px-5">
                  {messages.length <= 1 && (
                    <div className="mb-6 mt-auto text-center">
                      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight">How can I help you today?</h3>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {['Find in my data', 'Create sample test data', 'Plan today routine'].map((suggestion) => (
                          <Button key={suggestion} variant="outline" size="sm" className="rounded-full" onClick={() => setInput(suggestion + ': ')}>
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' ? (
                          <div className="max-w-[92%] px-1 text-sm leading-7 text-foreground sm:max-w-[82%]">
                            {message.content ? (
                              <div className="assistant-message">
                                <MarkdownView>{message.content}</MarkdownView>
                                {writingAction && sending && index === messages.length - 1 && (
                                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                                    Preparing action preview...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-2xl bg-muted/35 px-3 py-2 text-muted-foreground">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                <span className="text-xs font-medium">{writingAction ? 'Preparing action preview...' : 'Writing response...'}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-[88%] sm:max-w-[75%]">
                            {message.files && message.files.length > 0 && (
                              <div className="mb-2 flex flex-wrap justify-end gap-2">
                                {message.files.map((file, fileIndex) => (
                                  <div key={`${file.name}-${fileIndex}`} className="overflow-hidden rounded-2xl border border-border bg-muted/35 p-1">
                                    {file.mimeType.startsWith('image/') ? (
                                      <img src={file.dataUrl} alt={file.name} className="h-20 w-20 rounded-xl object-cover" />
                                    ) : (
                                      <div className="grid h-20 w-20 place-items-center rounded-xl bg-primary/12 text-primary">
                                        <FileImage className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="chat-user-message rounded-2xl bg-muted px-4 py-2.5 text-sm leading-6 text-foreground shadow-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {actionBatches.length > 0 && (
                      <div className="flex justify-center">
                        <div className="w-full max-w-[92%] space-y-2 sm:max-w-[82%]">
                          {actionBatches.map((batch) => {
                            const meta = actionStatusMeta(batch.status);
                            const StatusIcon = meta.icon;
                            const totalActions = batch.actions.length + batch.rejected.length;
                            const expanded = expandedActionBatchId === batch.id;
                            const pending = batch.status === 'pending' && pendingActionBatchId === batch.id;
                            return (
                              <div key={batch.id} className={`chat-action-panel overflow-hidden rounded-2xl border p-3 shadow-sm ${meta.className}`}>
                                <button
                                  type="button"
                                  className="flex w-full min-w-0 items-center gap-2 text-left"
                                  onClick={() => setExpandedActionBatchId(expanded ? '' : batch.id)}
                                >
                                  <StatusIcon className="h-4 w-4 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">Tool actions - {meta.label}</p>
                                    <p className="truncate text-xs opacity-80">
                                      {totalActions} action{totalActions === 1 ? '' : 's'}
                                      {batch.rejected.length > 0 ? `, ${batch.rejected.length} unsafe blocked` : ''}
                                    </p>
                                  </div>
                                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                                {pending && (
                                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                    <Button className="h-auto min-h-9 min-w-0 whitespace-normal py-2 text-xs sm:text-sm" aria-label="Approve actions" onClick={executeAction} disabled={executing}>
                                      {hasDestructiveAction(batch.actions) ? 'Approve destructive action' : `Approve ${batch.actions.length}`}
                                    </Button>
                                    <Button variant="outline" className="h-auto min-h-9 min-w-0 whitespace-normal py-2 text-xs sm:text-sm" aria-label="Cancel actions" onClick={cancelPendingActions} disabled={executing}>Cancel</Button>
                                  </div>
                                )}
                                {expanded && (
                                  <div className="chat-action-panel-body chat-scroll mt-3 space-y-3 overflow-y-auto pr-1">
                                    {batch.actions.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {actionSummaries(batch.actions).map((summary) => (
                                          <Badge key={summary.label} variant="secondary" className="rounded-full bg-background/70 text-foreground">
                                            {summary.count} {summary.label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    {batch.actions.length > 0 && (
                                      <div className="space-y-1.5">
                                        {batch.actions.map((action, actionIndex) => (
                                          <div key={`${batch.id}-valid-${actionIndex}`} className="rounded-xl bg-background/70 px-2 py-2 text-xs text-foreground">
                                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                              <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">{actionRisk(action)}</Badge>
                                              <span className="min-w-0 flex-1 break-words font-semibold">{actionLabelWithContext(action, vaultContext)}</span>
                                            </div>
                                            <div className="mt-1.5 space-y-0.5 text-[11px] leading-4 text-muted-foreground">
                                              {actionDetails(action, vaultContext).map((detail, detailIndex) => (
                                                <p key={`${batch.id}-valid-${actionIndex}-detail-${detailIndex}`} className="break-words">{detail}</p>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {batch.rejected.length > 0 && (
                                      <div>
                                        <p className="mb-1 text-xs font-semibold">Unsafe actions blocked</p>
                                        <div className="space-y-1.5">
                                          {batch.rejected.map((issue, issueIndex) => (
                                            <div key={`${batch.id}-rejected-${issueIndex}`} className="rounded-xl bg-background/70 px-2 py-2 text-xs text-foreground">
                                              <p className="break-words font-semibold">{actionLabelWithContext(issue.action, vaultContext)}</p>
                                              <p className="mt-1 text-[11px] text-muted-foreground">{issue.reason}</p>
                                            </div>
                                          ))}
                                        </div>
                                        <details className="mt-2 rounded-xl bg-background/70 p-2 text-xs text-foreground">
                                          <summary className="cursor-pointer font-semibold">Raw blocked JSON</summary>
                                          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(batch.rejected, null, 2)}</pre>
                                        </details>
                                      </div>
                                    )}
                                    {batch.actions.length > 0 && (
                                      <details className="rounded-xl bg-background/70 p-2 text-xs text-foreground">
                                        <summary className="cursor-pointer font-semibold">Raw action JSON</summary>
                                        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(batch.actions, null, 2)}</pre>
                                      </details>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
              </div>

              <div className="chat-composer border-t border-border/70 bg-background/95 px-3 pt-3">
                <div className="mx-auto w-full max-w-3xl">
                  {dragging && (
                    <div className="mb-3 rounded-2xl border border-dashed border-primary/50 bg-primary/10 p-4 text-center text-sm font-medium text-primary">
                      Drop image or file here
                    </div>
                  )}
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-2 shadow-sm">
                    {files.length > 0 && (
                      <div className="mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
                        {files.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex min-w-56 items-center gap-2 rounded-2xl border border-border bg-muted/35 p-2">
                            {file.mimeType.startsWith('image/') ? (
                              <img src={file.dataUrl} alt={file.name} className="h-10 w-10 rounded-xl object-cover" />
                            ) : (
                              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                                <FileImage className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground">{file.mimeType || 'file attached'}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea ref={textareaRef} value={input} onPaste={pasteFiles} onChange={(event) => setInput(event.target.value)} className="chat-scroll min-h-11 max-h-36 overflow-y-auto resize-none rounded-2xl border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 sm:max-h-56" placeholder="Send a message, drop files, or paste an image..." onKeyDown={(event) => {
                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      if (event.key === 'Enter' && event.ctrlKey && event.shiftKey) {
                        event.preventDefault();
                        insertNewLine(event.currentTarget);
                        return;
                      }
                      if (event.key === 'Enter' && !event.shiftKey && !isMobile) {
                        event.preventDefault();
                        send();
                      }
                    }} />
                    <div className="flex items-center justify-between px-1">
                      <label className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground ${selectedModel?.multimodal ? 'cursor-pointer' : 'cursor-not-allowed opacity-45'}`}>
                        <Paperclip className="h-4 w-4" />
                        <input
                          disabled={!selectedModel?.multimodal}
                          type="file"
                          multiple
                          accept="image/*,.txt,.md,.cpp,.py,.js,.ts,.json,.pdf"
                          className="hidden"
                          onChange={(event) => {
                            attach(event.target.files);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <Button className="h-8 w-8 rounded-full p-0" onClick={send} disabled={sending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-3xl">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Quick actions</p>
              </div>
              <Button variant="outline" className="w-full justify-start" onClick={saveLastAsNote}>Save last answer as note</Button>
              <Button variant="outline" className="w-full justify-start" onClick={clearHistory}>Clear chat history</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setInput('Find my related bookmarks, notes, code and questions about: ')}>Find in my data</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setInput('Create a routine/event plan from this text: ')}>Draft routine/event</Button>
              <p className="text-xs leading-5 text-muted-foreground">Chat history synced to cloud. Model keys are saved in D1.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
