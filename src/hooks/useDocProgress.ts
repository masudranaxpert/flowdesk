import { useCallback, useEffect, useState } from 'react';
import { readProgress, writeProgress } from '@/data/docs';

export function useDocProgress(categoryId: string | undefined) {
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    categoryId ? readProgress(categoryId) : new Set(),
  );

  useEffect(() => {
    setReadIds(categoryId ? readProgress(categoryId) : new Set());
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
    },
    [categoryId],
  );

  return { readIds, toggle };
}