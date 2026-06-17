import { type ClipboardEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, FileImage, ImageOff, MessageSquare, Paperclip, Save, Send, Settings, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fileToAiFile, runAiChat, type AiFile, type AiModelConfig, type AiSettings, type ChatMessage, defaultAiSettings } from '../lib/ai';
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

type AiAction = {
  operation: 'create' | 'update' | 'delete';
  resource: 'bookmarks' | 'notebooks' | 'codes' | 'questions' | 'routines' | 'categories';
  id?: string;
  data?: Record<string, any>;
};

function normalizeActions(value: unknown): AiAction[] {
  if (Array.isArray(value)) return value as AiAction[];
  if (value && typeof value === 'object' && Array.isArray((value as { actions?: unknown }).actions)) {
    return (value as { actions: AiAction[] }).actions;
  }
  if (value && typeof value === 'object' && 'operation' in value && 'resource' in value) return [value as AiAction];
  return [];
}

function extractActions(text: string): AiAction[] {
  const match = text.match(/```ACTION_JSON\s*([\s\S]*?)```/i);
  if (!match) return [];
  try {
    return normalizeActions(JSON.parse(match[1]));
  } catch {
    return [];
  }
}

function hideActionBlock(text: string) {
  return text
    .replace(/```ACTION_JSON\s*[\s\S]*?```/gi, '')
    .replace(/```ACTION_JSON\s*[\s\S]*$/i, '')
    .trim();
}

function sanitizeActionData(resource: AiAction['resource'], data: Record<string, any>) {
  const next = { ...data };
  if (resource === 'routines') {
    const type = String(next.type || '').toLowerCase();
    next.type = type === 'class' ? 'class' : 'event';
    if (typeof next.repeatWeekly !== 'boolean') next.repeatWeekly = next.type === 'class';
    if (next.type === 'event' && !next.date && next.repeatWeekly) next.type = 'class';
    if (!next.startTime) next.startTime = '09:00';
    if (!next.endTime) next.endTime = '10:00';
  }
  if (resource === 'questions') {
    if (!['easy', 'medium', 'hard'].includes(next.difficulty)) next.difficulty = 'medium';
  }
  return next;
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
  const [selectedModelId, setSelectedModelId] = useState('');
  const [dragging, setDragging] = useState(false);
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

  useEffect(() => loadSettings(), [loadSettings]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]') as ChatMessage[];
      setMessages(saved.length ? saved.slice(-30) : defaultMessages);
    } catch {
      setMessages(defaultMessages);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    const t = setTimeout(() => {
      const saved = messages
        .filter((message) => message.content.trim())
        .slice(-30)
        .map((message) => ({ role: message.role, content: message.content, files: message.files }));
      localStorage.setItem(chatHistoryKey, JSON.stringify(saved));
    }, 350);
    return () => clearTimeout(t);
  }, [messages, historyReady]);

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

  useEffect(() => {
    Promise.all([
      api.bookmarks.list(),
      api.notebooks.list(),
      api.codes.list(),
      api.questions.list(),
      api.routines.list(),
      api.categories.list(),
    ]).then(([bookmarks, notes, codes, questions, routines, categories]) => {
      setContext(JSON.stringify({
        bookmarks: bookmarks.slice(0, 50).map((item: any) => ({ id: item._id, title: item.title, url: item.url, category: item.category, tags: item.tags })),
        notes: notes.slice(0, 50).map((item: any) => ({ id: item._id, title: item.title, category: item.category, preview: item.content.slice(0, 500) })),
        codes: codes.slice(0, 30).map((item: any) => ({ id: item._id, title: item.title, language: item.language, category: item.category, description: item.description })),
        questions: questions.slice(0, 50).map((item: any) => ({ id: item._id, title: item.title, platform: item.platform, category: item.category, solved: item.isSolved })),
        routines: routines.slice(0, 50).map((item: any) => ({ id: item._id, title: item.title, type: item.type, dayOfWeek: item.dayOfWeek, date: item.date, startTime: item.startTime, endTime: item.endTime, room: item.room, teacher: item.teacher })),
        categories: categories.slice(0, 50).map((item: any) => ({ id: item._id, name: item.name, slug: item.slug, scope: item.scope })),
      }, null, 2));
    }).catch(() => {});
  }, []);

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

  const saveSettings = async () => {
    await api.aiSettings.update(settings as any);
    toast.success('AI settings saved to D1');
  };

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
    const converted = await Promise.all(incoming.slice(0, 4).map(fileToAiFile));
    setFiles((current) => {
      const next = [...current, ...converted].slice(0, 4);
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
    setPendingActions([]);
    setSending(true);
    try {
      const answer = await runAiChat(selectedRunSettings, [...messages, user], context, sentFiles, {
        onDelta: (delta) => {
          streamedAnswer += delta;
          setMessages((current) => {
            const copy = [...current];
            const lastIndex = copy.length - 1;
            if (copy[lastIndex]?.role === 'assistant') copy[lastIndex] = { role: 'assistant', content: hideActionBlock(streamedAnswer) };
            return copy;
          });
        },
      });
      const actions = extractActions(answer);
      if (actions.length > 0) setPendingActions(actions);
      const finalContent = hideActionBlock(answer) || `${actions.length} action${actions.length === 1 ? '' : 's'} ready. Please approve below.`;
      setMessages((current) => {
        const copy = [...current];
        const lastIndex = copy.length - 1;
        if (copy[lastIndex]?.role === 'assistant') copy[lastIndex] = { role: 'assistant', content: finalContent };
        else copy.push({ role: 'assistant', content: finalContent });
        return copy;
      });
    } catch (error) {
      setMessages((current) => current.filter((message, index) => index !== current.length - 1 || message.role !== 'assistant' || message.content.trim()));
      toast.error(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setSending(false);
    }
  };

  const executeAction = async () => {
    if (pendingActions.length === 0) return;
    const map: Record<string, any> = {
      bookmarks: api.bookmarks,
      notebooks: api.notebooks,
      codes: api.codes,
      questions: api.questions,
      routines: api.routines,
      categories: api.categories,
    };
    try {
      for (const action of pendingActions) {
        const { operation, resource, id, data = {} } = action;
        const cleanData = sanitizeActionData(resource, data);
        const actionId = id || String(cleanData.id || cleanData._id || '');
        const { id: _ignoredId, _id: _ignoredLegacyId, ...payload } = cleanData;
        const target = map[resource];
        if (!target) throw new Error(`Unsupported action: ${resource}`);
        if (operation === 'create') await target.create(payload);
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
      toast.success(`${pendingActions.length} action${pendingActions.length === 1 ? '' : 's'} completed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const saveLastAsNote = async () => {
    const last = messages[messages.length - 1];
    if (!last) return;
    await api.notebooks.create({ title: 'AI note', content: last.content, category: 'general', tags: ['ai'] });
    toast.success('Saved as note');
  };

  const clearHistory = async () => {
    localStorage.removeItem(chatHistoryKey);
    setMessages([{ role: 'assistant', content: 'History cleared. Ask me anything.' }]);
    setPendingActions([]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="rounded-3xl border-primary/15">
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
        <Card className="rounded-3xl">
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
                      <Button variant="destructive" onClick={() => removeModel(model.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card
            className={`overflow-hidden rounded-3xl border-border/70 bg-background/65 ${dragging ? 'ring-2 ring-primary/60' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={dropFiles}
          >
            <CardContent className="flex h-[calc(100vh-13rem)] lg:h-[74vh] min-h-[26rem] lg:min-h-[34rem] flex-col p-0">
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
                    options={enabledModels.map((model) => ({ value: model.id, label: model.label || model.model }))}
                    placeholder="Select active model"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-3 py-5 sm:px-5">
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
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-2xl bg-muted/35 px-3 py-2 text-muted-foreground">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                <span className="text-xs font-medium">Starting response</span>
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
                    <div ref={bottomRef} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70 bg-background/95 p-3">
                <div className="mx-auto w-full max-w-3xl">
                  {dragging && (
                    <div className="mb-3 rounded-2xl border border-dashed border-primary/50 bg-primary/10 p-4 text-center text-sm font-medium text-primary">
                      Drop image or file here
                    </div>
                  )}
                  {pendingActions.length > 0 && (
                    <div className="mb-3 rounded-2xl border border-primary/25 bg-primary/10 p-3">
                      <p className="text-sm font-semibold">Tool call requested</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pendingActions.length} action{pendingActions.length === 1 ? '' : 's'} waiting for approval
                      </p>
                      <pre className="mt-2 max-h-36 overflow-auto rounded-xl bg-background/70 p-2 text-xs">{JSON.stringify(pendingActions, null, 2)}</pre>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={executeAction}>Approve</Button>
                        <Button variant="outline" onClick={() => setPendingActions([])}>Cancel</Button>
                      </div>
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
                    <Textarea ref={textareaRef} value={input} onPaste={pasteFiles} onChange={(event) => setInput(event.target.value)} className="min-h-11 resize-none rounded-2xl border-0 bg-transparent px-3 shadow-none focus-visible:ring-0" placeholder="Send a message, drop files, or paste an image..." onKeyDown={(event) => {
                      if (event.key === 'Enter' && event.ctrlKey && event.shiftKey) {
                        event.preventDefault();
                        insertNewLine(event.currentTarget);
                        return;
                      }
                      if (event.key === 'Enter' && !event.shiftKey) {
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

          <Card className="rounded-3xl">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Quick actions</p>
              </div>
              <Button variant="outline" className="w-full justify-start" onClick={saveLastAsNote}>Save last answer as note</Button>
              <Button variant="outline" className="w-full justify-start" onClick={clearHistory}>Clear chat history</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setInput('Find my related bookmarks, notes, code and questions about: ')}>Find in my data</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setInput('Create a routine/event plan from this text: ')}>Draft routine/event</Button>
              <p className="text-xs leading-5 text-muted-foreground">Model profiles are saved in D1. Recent chat stays on this browser.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
