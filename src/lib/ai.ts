import { GoogleGenAI, createPartFromUri } from '@google/genai';

export type AiProvider = 'gemini' | 'openrouter' | 'openai';

export type AiSettings = {
  provider: AiProvider;
  geminiKey: string;
  geminiModel: string;
  openRouterKey: string;
  openRouterModel: string;
  openAiKey: string;
  openAiModel: string;
  multimodalEnabled: boolean;
  models?: AiModelConfig[];
};

export type AiModelConfig = {
  id: string;
  label: string;
  provider: AiProvider;
  apiKey: string;
  model: string;
  multimodal: boolean;
  active: boolean;
};

export type AiFile = {
  name: string;
  mimeType: string;
  dataUrl: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  files?: AiFile[];
  actionBatches?: any[];
};

export type AiChatOptions = {
  onDelta?: (delta: string) => void;
};

export const defaultAiSettings: AiSettings = {
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemma-3-27b-it',
  openRouterKey: '',
  openRouterModel: 'google/gemma-3-27b-it',
  openAiKey: '',
  openAiModel: 'gpt-4o-mini',
  multimodalEnabled: true,
  models: [],
};

export function dataUrlToBase64(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',');
  return base64;
}

export function dataUrlToText(dataUrl: string) {
  try {
    return atob(dataUrlToBase64(dataUrl));
  } catch {
    return '';
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const base64 = dataUrlToBase64(dataUrl);
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export async function fileToAiFile(file: File): Promise<AiFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildSystemPrompt(context: string) {
  const today = new Date().toISOString().split('T')[0];
  return `You are BookmarkVault AI. Help the user find, summarize, and organize their personal bookmarks, notes, code snippets, questions, routines, events, and passwords.
Today's date is: ${today}.
  
Language behavior:
- Reply in the same language/style the user uses.
- If the user writes Bangla, reply in Bangla.
- If the user writes Banglish/romanized Bengali, reply in natural Banglish/romanized Bengali.
- If the user writes English, reply in English.
- Do not answer in two languages or add translations unless the user asks.
- Keep casual greetings short and natural. Do not over-explain basic greetings.

Context behavior:
- Use the app data context when it is relevant.
- If the context does not contain enough information, say that clearly and ask for what is needed.
- Do not invent saved notes, bookmarks, code, questions, routines, categories, or passwords that are not present in the context.
- For update and delete operations, you MUST look up the correct "id" of the target item from the App data context.
- NEVER invent, generate, or hallucinate fake/random IDs (such as random UUIDs) for update or delete operations. If the item's ID is not present in the context, ask the user or inform them that the item was not found.
- If multiple existing items could match an update/delete request, ask the user which item they mean. Do not include an update/delete ACTION_JSON block.
- For create operations, do not include "id" or "_id". The app creates IDs.
- When assigning a category to any item, you MUST use the exact case-sensitive \`slug\` of the category from the context (e.g., use "gcloud" instead of "Gcloud"). DO NOT use the display name.

When useful, suggest exact actions the user can take in the app. Keep answers concise and practical.
If the user asks you to create, update, or delete app data, include a short explanation plus one action block at the end.
For one item, action block format:
\`\`\`ACTION_JSON
{"operation":"create","resource":"notebooks","data":{"title":"...","content":"...","category":"general","tags":[]}}
\`\`\`
For multiple items, use an actions array. Use this whenever the user asks for many sample items, bulk import, or several mixed resources:
\`\`\`ACTION_JSON
{"actions":[
  {"operation":"create","resource":"notebooks","data":{"title":"...","content":"...","category":"general","tags":[]}},
  {"operation":"create","resource":"bookmarks","data":{"title":"...","url":"https://example.com","category":"general","tags":[]}},
  {"operation":"create","resource":"codes","data":{"title":"...","code":"...","language":"cpp","category":"general","tags":[]}},
  {"operation":"create","resource":"passwords","data":{"title":"...","url":"...","username":"...","password":"...","description":"...","category":"general","tags":[]}},
  {"operation":"create","resource":"questions","data":{"title":"...","problem":"...","solution":"...","code":"...","language":"cpp","difficulty":"medium","platform":"other","category":"general","tags":[]}},
  {"operation":"create","resource":"routines","data":{"title":"...","type":"class","dayOfWeek":1,"startTime":"09:00","endTime":"10:00","repeatWeekly":true,"notes":"..."}},
  {"operation":"create","resource":"routines","data":{"title":"...","type":"event","date":"2024-05-20","startTime":"15:00","endTime":"16:00","repeatWeekly":false,"notes":"..."}}
]}
\`\`\`
For categories, always include the exact scope where it should appear:
\`\`\`ACTION_JSON
{"operation":"create","resource":"categories","data":{"name":"Research","scope":"bookmark"}}
\`\`\`
Category scopes are: "bookmark", "notebook", "code", "question", or "all".
If the user says bookmark-only, links-only, or just bookmark categories, use scope "bookmark".
If the user says notebook-only or note categories, use scope "notebook".
If a category with the same name already exists in App data context but has the wrong scope, use an update action with that existing category id instead of creating a duplicate.
For deleting many existing items, prefer one compact delete_many action instead of many separate delete actions:
\`\`\`ACTION_JSON
{"operation":"delete_many","resource":"routines","ids":["existing-id-1","existing-id-2"]}
\`\`\`
For deleting every item in a resource, use delete_all only when the user explicitly says all/clear/reset that resource:
\`\`\`ACTION_JSON
{"operation":"delete_all","resource":"routines","data":{"scope":"all"}}
\`\`\`
Allowed resources: bookmarks, notebooks, codes, questions, routines, categories, passwords, roadmaps.

For learning roadmaps & progress tracking (e.g. 12-month Rust & systems curriculum, 30-day Pandas/NumPy sprint):
\`\`\`ACTION_JSON
{"operation":"create","resource":"roadmaps","data":{
  "title":"12-Month Rust & Backend Mastery",
  "description":"Comprehensive 12-month learning track",
  "category":"rust",
  "duration":"12 Months",
  "dailyHabits":[{"id":"h1","title":"English speaking happens every day"},{"id":"h2","title":"Daily coding & study (1-2 hours)"}],
  "phases":[
    {"id":"m1","title":"Month 1: Rust from absolute zero","description":"Setup, Cargo, variables, control flow","tasks":[{"id":"t1-1","title":"Rustup, Cargo & toolchain setup","completed":false},{"id":"t1-2","title":"Variables, mutability & types","completed":false}]},
    {"id":"m2","title":"Month 2: Rust fundamentals + tooling","tasks":[{"id":"t2-1","title":"Structs, enums & pattern matching","completed":false}]}
  ]
}}
\`\`\`
When updating a roadmap (e.g. when user says they completed a topic/task or want to log time), look up the roadmap id from context and provide an update action with the updated phases array (marking the task completed: true with completedAt) or updated dailyLogs array.
Allowed operations: create, update, update_many, delete, delete_many, delete_all. For update/update_many/delete/delete_many include exact existing ids from the App data context/actionIndex. For create, omit id.
For bulk updates with the same payload, prefer one update_many action with exact ids and shared data:
\`\`\`ACTION_JSON
{"operation":"update_many","resource":"routines","ids":["existing-id-1","existing-id-2"],"data":{"room":"G1-00"}}
\`\`\`
For mixed bulk updates where each item needs different data, output 50+ update actions in the actions array when the user asked for many changes. Do not collapse mixed updates into one update action without ids.
For routine updates, actionIndex.routines contains every available routine with id, title, subject, type, dayOfWeek, date, startTime, endTime, room, teacher, notes, and repeatWeekly. Match routines using the PDF/user data plus title/subject and time/day/date, then include the exact id for each updated routine.
If the user says to update all routines with the same title, include one update action for every matching existing routine id. If only some routines match the PDF rows, update only those exact matching ids.
If a routine title appears many times and you cannot identify the exact existing ids from actionIndex, ask a clarifying question instead of producing ACTION_JSON.
When an attached PDF or image contains routine data, use only rows you can read clearly. If room/day/time/title is uncertain, say which row is unclear and skip that action.
Use delete_all only for explicit delete-all requests. Never use delete_all for vague cleanup requests.
For category create/update, data.scope must be one of "bookmark", "notebook", "code", "question", or "all"; never omit category scope.
Routine type must be only "class" or "event". Map meeting, personal, gym, reading, reminder, or task-like schedule items to "event" unless it is clearly a weekly class. For events, you MUST include a "date" field (e.g. "YYYY-MM-DD") and omit "dayOfWeek".
Question difficulty must be only "easy", "medium", or "hard".
Do not combine unrelated sample items into one notebook when the user asks for diverse app data. Create the correct resource type for each item.
Never claim the action is done. The app will ask the user for permission first.
If you cannot safely produce an action block, answer normally and explain what information is missing.

App data context:
${context}`;
}

function emitDelta(options: AiChatOptions | undefined, value: string) {
  if (value) options?.onDelta?.(value);
}

export async function runAiChat(settings: AiSettings, messages: ChatMessage[], context: string, files: AiFile[], options?: AiChatOptions) {
  const userMessages = messages.filter((message) => message.role === 'user');
  const lastUser = userMessages[userMessages.length - 1]?.content ?? '';
  if (!lastUser.trim() && files.length === 0) throw new Error('Message is required');

  const activeProfile = settings.models?.find((model) => model.active) ?? null;
  const provider = activeProfile?.provider ?? settings.provider;
  const modelName = activeProfile?.model ?? (provider === 'gemini' ? settings.geminiModel : provider === 'openrouter' ? settings.openRouterModel : settings.openAiModel);
  const apiKey = activeProfile?.apiKey ?? (provider === 'gemini' ? settings.geminiKey : provider === 'openrouter' ? settings.openRouterKey : settings.openAiKey);
  const activeFiles = (activeProfile ? activeProfile.multimodal : settings.multimodalEnabled) ? files : [];

  if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini API key is missing');
    const ai = new GoogleGenAI({ apiKey });
    const isGemma = modelName.toLowerCase().includes('gemma');
    const gemmaUploadedParts: Record<string, any> = {};
    if (isGemma) {
      for (const file of activeFiles) {
        if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
          const blob = dataUrlToBlob(file.dataUrl);
          const uploadedFile = await ai.files.upload({
            file: blob,
            config: { mimeType: file.mimeType },
          });
          gemmaUploadedParts[file.dataUrl] = createPartFromUri(uploadedFile.uri || '', uploadedFile.mimeType || '');
        }
      }
    }
    const history = messages.slice(-10);
    const contents: any[] = [];
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (i === history.length - 1 && msg.role === 'user') {
        const parts: any[] = [{ text: msg.content }];
        for (const file of activeFiles) {
          if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
            if (isGemma && gemmaUploadedParts[file.dataUrl]) {
              parts.push(gemmaUploadedParts[file.dataUrl]);
            } else {
              parts.push({ inlineData: { mimeType: file.mimeType, data: dataUrlToBase64(file.dataUrl) } });
            }
          } else {
            parts.push({ text: `\nAttached file (${file.name}):\n${dataUrlToText(file.dataUrl).slice(0, 12000)}` });
          }
        }
        contents.push({ role, parts });
      } else {
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }
    if (contents.length === 0) {
      const parts: any[] = [{ text: lastUser }];
      for (const file of activeFiles) {
        if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
          if (isGemma && gemmaUploadedParts[file.dataUrl]) {
            parts.push(gemmaUploadedParts[file.dataUrl]);
          } else {
            parts.push({ inlineData: { mimeType: file.mimeType, data: dataUrlToBase64(file.dataUrl) } });
          }
        } else {
          parts.push({ text: `\nAttached file (${file.name}):\n${dataUrlToText(file.dataUrl).slice(0, 12000)}` });
        }
      }
      contents.push({ role: 'user', parts });
    }
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(context),
      },
    });
    let full = '';
    for await (const chunk of response) {
      const delta = chunk.text || '';
      full += delta;
      emitDelta(options, delta);
    }
    return full;
  }

  const isOpenRouter = provider === 'openrouter';
  if (!apiKey) throw new Error(`${isOpenRouter ? 'OpenRouter' : 'OpenAI'} API key is missing`);

  const content: any[] = [{ type: 'text', text: lastUser }];
  for (const file of activeFiles) {
    if (file.mimeType.startsWith('image/')) content.push({ type: 'image_url', image_url: { url: file.dataUrl } });
    else if (file.mimeType === 'application/pdf') content.push({ type: 'text', text: `Attached file (${file.name}): [PDF files are only supported with Gemini provider. Please switch to Gemini.]` });
    else content.push({ type: 'text', text: `Attached file (${file.name}):\n${dataUrlToText(file.dataUrl).slice(0, 12000)}` });
  }

  const history = messages.slice(-10, -1);
  const formattedHistory = history.map((message) => ({ role: message.role, content: message.content }));

  const endpoint = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'BookmarkVault' } : {}),
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        ...formattedHistory,
        { role: 'user', content },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'AI request failed');
  }

  if (!response.body) {
    const json = await response.json().catch(() => ({}));
    return json.choices?.[0]?.message?.content || '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || '';
        full += delta;
        emitDelta(options, delta);
      } catch {
        // Ignore partial vendor-specific stream events.
      }
    }
  }

  return full;
}
