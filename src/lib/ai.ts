import { GoogleGenAI } from '@google/genai';

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

export async function fileToAiFile(file: File): Promise<AiFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildSystemPrompt(context: string) {
  return `You are BookmarkVault AI. Help the user find, summarize, and organize their personal bookmarks, notes, code snippets, questions, routines, and events.

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
  {"operation":"create","resource":"questions","data":{"title":"...","problem":"...","solution":"...","code":"...","language":"cpp","difficulty":"medium","platform":"other","category":"general","tags":[]}},
  {"operation":"create","resource":"routines","data":{"title":"...","type":"class","dayOfWeek":1,"startTime":"09:00","endTime":"10:00","repeatWeekly":true}}
]}
\`\`\`
Allowed resources: bookmarks, notebooks, codes, questions, routines, categories.
Allowed operations: create, update, delete. For update/delete include "id".
Routine type must be only "class" or "event". Map meeting, personal, gym, reading, reminder, or task-like schedule items to "event" unless it is clearly a weekly class.
Question difficulty must be only "easy", "medium", or "hard".
Do not combine unrelated sample items into one notebook when the user asks for diverse app data. Create the correct resource type for each item.
Never claim the action is done. The app will ask the user for permission first.

App data context:
${context}`;
}

export async function runAiChat(settings: AiSettings, messages: ChatMessage[], context: string, files: AiFile[]) {
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
    const history = messages.slice(-10);
    const contents: any[] = [];
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (i === history.length - 1 && msg.role === 'user') {
        const parts: any[] = [{ text: msg.content }];
        for (const file of activeFiles) {
          if (file.mimeType.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: file.mimeType, data: dataUrlToBase64(file.dataUrl) } });
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
        if (file.mimeType.startsWith('image/')) {
          parts.push({ inlineData: { mimeType: file.mimeType, data: dataUrlToBase64(file.dataUrl) } });
        } else {
          parts.push({ text: `\nAttached file (${file.name}):\n${dataUrlToText(file.dataUrl).slice(0, 12000)}` });
        }
      }
      contents.push({ role: 'user', parts });
    }
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(context),
      },
    });
    return response.text || '';
  }

  const isOpenRouter = provider === 'openrouter';
  if (!apiKey) throw new Error(`${isOpenRouter ? 'OpenRouter' : 'OpenAI'} API key is missing`);

  const content: any[] = [{ type: 'text', text: lastUser }];
  for (const file of activeFiles) {
    if (file.mimeType.startsWith('image/')) content.push({ type: 'image_url', image_url: { url: file.dataUrl } });
    else content.push({ type: 'text', text: `Attached file (${file.name}):\n${dataUrlToText(file.dataUrl).slice(0, 12000)}` });
  }

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
        ...messages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
        { role: 'user', content },
      ],
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || 'AI request failed');
  return json.choices?.[0]?.message?.content || '';
}
