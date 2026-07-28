import { useEffect, useState } from 'react';

const TOKEN_KEY = 'auth-token';
const AUTH_EVENT = 'auth-change';

function readAuthed() {
  try {
    return !!localStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

/**
 * Reactive hook that reports whether the user is currently authenticated.
 *
 * Components that branch their UI on auth state (e.g. docs shown publicly but
 * with extra facilities for logged-in users) should use this instead of a
 * one-shot `localStorage` read, so login/logout is reflected immediately
 * without a reload.
 */
export function useAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(readAuthed);

  useEffect(() => {
    const sync = () => setIsAuthed(readAuthed());

    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return isAuthed;
}

/** Notify listeners (and other tabs) that auth state changed. */
export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}
