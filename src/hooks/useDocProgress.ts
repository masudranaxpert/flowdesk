import { useCallback, useEffect, useRef, useState } from 'react';
import { readProgress, writeProgress } from '@/data/docs';
import { api } from '@/lib/api';

function hasToken() {
  try {
    return !!localStorage.getItem('auth-token');
  } catch {
    return false;
  }
}

/**
 * Read-progress for a docs category.
 *
 * Hybrid storage:
 *  - Always mirrors to localStorage (instant, works offline / logged-out).
 *  - When authenticated, merges from the server on mount and pushes updates
 *    (debounced) so progress survives across devices.
 *
 * The server merge unions local + remote readIds so nothing is lost; the
 * remote set wins on conflict (latest persisted state).
 */
export function useDocProgress(categoryId: string | undefined) {
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    categoryId ? readProgress(categoryId) : new Set(),
  );

  // Per-category debounce timer for server writes.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReadIds(categoryId ? readProgress(categoryId) : new Set());
  }, [categoryId]);

  // Sync local progress to the server (debounced) when authenticated.
  const pushToServer = useCallback(
    (id: string) => {
      if (!hasToken()) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        const ids = readProgress(id);
        api.docProgress.save({ categoryId: id, readIds: [...ids] }).catch(() => {});
      }, 600);
    },
    [],
  );

  // On mount / category change: pull server state and merge into local.
  useEffect(() => {
    if (!categoryId || !hasToken()) return;
    let cancelled = false;
    api.docProgress
      .list()
      .then(({ progress }) => {
        if (cancelled) return;
        const remote = new Set(progress[categoryId] || []);
        if (remote.size === 0) return;
        const local = readProgress(categoryId);
        const merged = new Set<string>([...local, ...remote]);
        if (merged.size === local.size) return; // remote had nothing new
        writeProgress(categoryId, merged); // persist + dispatch change event
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [categoryId]);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!categoryId || !detail || detail.categoryId === categoryId) {
        setReadIds(categoryId ? readProgress(categoryId) : new Set());
      }
    }
    window.addEventListener('docs-progress-change', handler);
    return () => window.removeEventListener('docs-progress-change', handler);
  }, [categoryId]);

  const toggle = useCallback(
    (chapterId: string) => {
      if (!categoryId) return;
      const updated = new Set(readProgress(categoryId));
      if (updated.has(chapterId)) updated.delete(chapterId);
      else updated.add(chapterId);
      setReadIds(updated);
      writeProgress(categoryId, updated);
      pushToServer(categoryId);
    },
    [categoryId, pushToServer],
  );

  return { readIds, toggle };
}
