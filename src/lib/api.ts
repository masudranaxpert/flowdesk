import type { AiSetting, AuthenticatorItem, Bookmark, Budget, Category, CodeSnippet, Expense, Notebook, PasswordItem, Question, RoutineItem, Stats, UploadedFile } from '../types';

import { Capacitor } from '@capacitor/core';

// For local development on Android, you might need your PC's IP address (e.g. http://192.168.x.x:5173/api)
// For production, use your live domain (e.g. https://masud-rana.me/api)
const BASE = Capacitor.isNativePlatform() ? 'https://masud-rana.me/api' : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth-token');
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/signup') && !location.pathname.startsWith('/forgot-password')) location.href = '/login';
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
    forgotPassword: (data: { email: string }) => request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data: { email: string; code: string; newPassword: string }) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    updateProfile: (data: { name: string }) => request<{ message: string; user: { id: string; name: string; email: string } }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword?: string; newPassword: string }) => request<{ message: string }>('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: () => request<{ message: string }>('/auth/profile', { method: 'DELETE' }),
  },
  stats: {
    get: () => request<Stats>('/stats'),
  },
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  passwords: {
    list: (params?: Record<string, string>) => request<any>(`/passwords${qs(params)}`),
    get: (id: string) => request<PasswordItem>(`/passwords/${id}`),
    create: (data: Partial<PasswordItem>) => request<PasswordItem>('/passwords', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PasswordItem>) => request<PasswordItem>(`/passwords/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/passwords/${id}`, { method: 'DELETE' }),
  },
  authenticators: {
    list: (params?: Record<string, string>) => request<any>(`/authenticators${qs(params)}`),
    create: (data: Partial<AuthenticatorItem>) => request<AuthenticatorItem>('/authenticators', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<AuthenticatorItem>) => request<AuthenticatorItem>(`/authenticators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/authenticators/${id}`, { method: 'DELETE' }),
  },
  bookmarks: {
    list: (params?: Record<string, string>) => request<any>(`/bookmarks${qs(params)}`),
    get: (id: string) => request<Bookmark>(`/bookmarks/${id}`),
    create: (data: Partial<Bookmark>) => request<Bookmark>('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Bookmark>) => request<Bookmark>(`/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
    getMeta: (url: string) => request<{ title: string; description: string; error?: string }>(`/bookmarks/meta?url=${encodeURIComponent(url)}`),
  },
  notebooks: {
    list: (params?: Record<string, string>) => request<any>(`/notebooks${qs(params)}`),
    get: (id: string) => request<Notebook>(`/notebooks/${id}`),
    create: (data: Partial<Notebook>) => request<Notebook>('/notebooks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Notebook>) => request<Notebook>(`/notebooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/notebooks/${id}`, { method: 'DELETE' }),
  },
  codes: {
    list: (params?: Record<string, string>) => request<any>(`/codes${qs(params)}`),
    get: (id: string) => request<CodeSnippet>(`/codes/${id}`),
    create: (data: Partial<CodeSnippet>) => request<CodeSnippet>('/codes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CodeSnippet>) => request<CodeSnippet>(`/codes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/codes/${id}`, { method: 'DELETE' }),
  },
  questions: {
    list: (params?: Record<string, string>) => request<any>(`/questions${qs(params)}`),
    get: (id: string) => request<Question>(`/questions/${id}`),
    create: (data: Partial<Question>) => request<Question>('/questions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Question>) => request<Question>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/questions/${id}`, { method: 'DELETE' }),
    getMeta: (url: string) => request<{ title: string; difficulty: 'easy' | 'medium' | 'hard'; platform: string; tags: string[]; error?: string }>(`/questions/meta?url=${encodeURIComponent(url)}`),
  },
  categories: {
    list: (params?: Record<string, string>) => request<any>(`/categories${qs(params)}`),
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
  budgets: {
    list: (params?: Record<string, string>) => request<any>(`/budgets${qs(params)}`),
    create: (data: Partial<Budget>) => request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Budget>) => request<Budget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    list: (params?: Record<string, string>) => request<any>(`/expenses${qs(params)}`),
    summary: (params?: Record<string, string>) => request<any>(`/expenses/summary${qs(params)}`),
    create: (data: Partial<Expense>) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Expense>) => request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
  },
  aiSettings: {
    get: () => request<AiSetting>('/ai-settings'),
    update: (data: Partial<AiSetting>) => request<AiSetting>('/ai-settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  chatHistory: {
    get: () => request<{ messages: any[] }>('/chat-history'),
    update: (messages: any[]) => request<{ messages: any[] }>('/chat-history', { method: 'PUT', body: JSON.stringify({ messages }) }),
    clear: () => request<{ message: string }>('/chat-history', { method: 'DELETE' }),
  },
  files: {
    list: (params?: Record<string, string>) => request<any>(`/files${qs(params)}`),
    upload: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<UploadedFile>('/files', { method: 'POST', body: form });
    },
    delete: (id: string) => request<{ message: string }>(`/files/${id}`, { method: 'DELETE' }),
  },
};
