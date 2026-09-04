import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Plus,
  StickyNote,
  Trash2,
  Video,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Roadmap, RoadmapNote } from '../../types';

interface RoadmapNotesProps {
  roadmap: Roadmap;
  onAddNote: (text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

// Extract any URLs present in note text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

// Determine if a URL is a YouTube video or playlist
function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

// Friendly date formatting
function formatNoteDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function RoadmapNotes({ roadmap, onAddNote, onDeleteNote }: RoadmapNotesProps) {
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const notes = roadmap.notes || [];

  const handleCreate = async () => {
    const text = noteInput.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddNote(text);
      setNoteInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Note copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card with note creator */}
      <Card className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Roadmap Notes & Resources</h3>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
              {notes.length} {notes.length === 1 ? 'saved note' : 'saved notes'}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Saved directly in database — accessible from any device
          </span>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <textarea
            rows={3}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Write a note, YouTube playlist URL, doc link, or important reference..."
            className="w-full resize-none rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-xs sm:text-sm text-foreground/90 placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 transition-colors"
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-muted-foreground/70">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Enter</kbd> to quickly add
            </p>

            <Button
              size="sm"
              disabled={!noteInput.trim() || isSubmitting}
              onClick={handleCreate}
              className="h-9 px-4 rounded-xl gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No notes recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Keep your YouTube playlist links, important course materials, article bookmarks, or personal reminders for{' '}
              <span className="font-semibold text-foreground/80">{roadmap.title}</span> here.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2.5 py-1">
              <Video className="h-3.5 w-3.5 text-red-400" /> YouTube Playlists
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2.5 py-1">
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" /> Documentation Links
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Key Insights
            </span>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const detectedUrls = extractUrls(note.text);

            return (
              <div
                key={note.id}
                className="group relative flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                {/* Note content and action buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <StickyNote className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap break-words flex-1">
                      {note.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(note.id, note.text)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Copy note"
                    >
                      {copiedId === note.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Detected URL badges / quick launch buttons */}
                {detectedUrls.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1 pl-6">
                    {detectedUrls.map((url, uIdx) => {
                      const isYT = isYouTubeUrl(url);
                      return (
                        <a
                          key={uIdx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
                        >
                          {isYT ? (
                            <Video className="h-3.5 w-3.5 text-red-500" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="max-w-[200px] truncate">{url}</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Note metadata timestamp */}
                {note.createdAt && (
                  <div className="pl-6 text-[10px] text-muted-foreground/60">
                    {formatNoteDate(note.createdAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
