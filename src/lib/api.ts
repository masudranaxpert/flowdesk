import type { AiSetting, Bookmark, Category, CodeSnippet, Notebook, Question, RoutineItem, Stats } from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth-token');
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/signup')) location.href = '/login';
    }
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

function qs(params?: Record<string, string>) {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([, value]) => value);
  return filtered.length ? `?${new URLSearchParams(filtered).toString()}` : '';
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => request<{ token: string; user: { id: string; name: string; email: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { name: string; email: string; password: string }) => request<{ requiresVerification: boolean; email: string; message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    verify: (data: { email: string; code: string }) => request<{ token: string; user: { id: string; name: string; email: string } }>('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
    resend: (data: { email: string }) => request<{ message: string }>('/auth/resend', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ user: { id: string; name: string; email: string } }>('/auth/me'),
  },
  chatHistory: {
    get: () => request<{ messages: { role: 'user' | 'assistant'; content: string }[] }>('/chat-history'),
    update: (messages: { role: 'user' | 'assistant'; content: string }[]) => request<{ messages: { role: 'user' | 'assistant'; content: string }[] }>('/chat-history', { method: 'PUT', body: JSON.stringify({ messages }) }),
    clear: () => request<{ message: string }>('/chat-history', { method: 'DELETE' }),
  },
  stats: {
    get: () => request<Stats>('/stats'),
  },
  bookmarks: {
    list: (params?: Record<string, string>) => request<Bookmark[]>(`/bookmarks${qs(params)}`),
    get: (id: string) => request<Bookmark>(`/bookmarks/${id}`),
    create: (data: Partial<Bookmark>) => request<Bookmark>('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Bookmark>) => request<Bookmark>(`/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
  },
  notebooks: {
    list: (params?: Record<string, string>) => request<Notebook[]>(`/notebooks${qs(params)}`),
    get: (id: string) => request<Notebook>(`/notebooks/${id}`),
    create: (data: Partial<Notebook>) => request<Notebook>('/notebooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Notebook>) => request<Notebook>(`/notebooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/notebooks/${id}`, { method: 'DELETE' }),
  },
  codes: {
    list: (params?: Record<string, string>) => request<CodeSnippet[]>(`/codes${qs(params)}`),
    get: (id: string) => request<CodeSnippet>(`/codes/${id}`),
    create: (data: Partial<CodeSnippet>) => request<CodeSnippet>('/codes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CodeSnippet>) => request<CodeSnippet>(`/codes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/codes/${id}`, { method: 'DELETE' }),
  },
  questions: {
    list: (params?: Record<string, string>) => request<Question[]>(`/questions${qs(params)}`),
    get: (id: string) => request<Question>(`/questions/${id}`),
    create: (data: Partial<Question>) => request<Question>('/questions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Question>) => request<Question>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/questions/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: (params?: Record<string, string>) => request<Category[]>(`/categories${qs(params)}`),
    create: (data: Partial<Category>) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  routines: {
    list: (params?: Record<string, string>) => request<RoutineItem[]>(`/routines${qs(params)}`),
    create: (data: Partial<RoutineItem>) => request<RoutineItem>('/routines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<RoutineItem>) => request<RoutineItem>(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/routines/${id}`, { method: 'DELETE' }),
    reset: (type = 'all') => request<void>(`/routines?type=${type}`, { method: 'DELETE' }),
  },
  aiSettings: {
    get: () => request<AiSetting>('/ai-settings'),
    update: (data: Partial<AiSetting>) => request<AiSetting>('/ai-settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
