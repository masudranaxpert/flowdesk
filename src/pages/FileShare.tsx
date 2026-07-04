import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Check, Download, FileArchive, FileText, Image as ImageIcon, Link2, Pencil, Search, Trash2, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { EmptyState, PaginationControls, SearchInput, Spinner } from '../components/UI';
import type { UploadedFile } from '../types';
import { copyShareUrl } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 12;

function bytes(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileUrl(file: UploadedFile) {
  return file.url || `/api/files/${file.id}`;
}

function absoluteFileUrl(file: UploadedFile) {
  return `${window.location.origin}${fileUrl(file)}`;
}

function fileIcon(file: UploadedFile) {
  if (file.mimeType?.startsWith('image/')) return ImageIcon;
  if (file.mimeType?.includes('zip') || file.name.match(/\.(zip|rar|7z)$/i)) return FileArchive;
  return FileText;
}

export default function FileSharePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<Array<{ name: string; status: string }>>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const load = useCallback(() => {
    setLoading(true);
    api.files.list({ page: String(page), limit: String(PAGE_SIZE), search: debouncedSearch })
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load files'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (fileList: FileList | File[] | null) => {
    const files = fileList ? Array.from(fileList).filter((file) => file.size > 0) : [];
    if (files.length === 0) return;
    setUploading(files.map((file) => ({ name: file.name, status: 'Uploading' })));
    try {
      for (const file of files) {
        await api.files.upload(file);
        setUploading((current) => current.map((item) => item.name === file.name ? { ...item, status: 'Uploaded' } : item));
      }
      toast.success(`${files.length} file${files.length === 1 ? '' : 's'} uploaded`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      window.setTimeout(() => setUploading([]), 1800);
      setDragging(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    uploadFiles(event.dataTransfer.files);
  };

  const copyLink = async (file: UploadedFile) => {
    try {
      await copyShareUrl('files', file.id);
      toast.success('Share link copied');
    } catch {
      await navigator.clipboard.writeText(absoluteFileUrl(file));
      toast.success('Share link copied');
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    if (!confirm(`Delete ${file.name}? This will remove it from R2 too.`)) return;
    await api.files.delete(file.id);
    toast.success('File deleted');
    load();
  };

  const startRename = (file: UploadedFile) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const commitRename = async (file: UploadedFile) => {
    const name = renameValue.trim();
    if (!name || name === file.name) {
      cancelRename();
      return;
    }
    try {
      const updated = await api.files.rename(file.id, name);
      setItems((prev) => prev.map((f) => (f.id === file.id ? updated : f)));
      toast.success('Renamed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rename failed');
    } finally {
      cancelRename();
    }
  };

  const onRenameKeyDown = (file: UploadedFile, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename(file);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="surface rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Share vault</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Files</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Upload files, copy public share links, and manage R2 storage from one clean place.</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" /> Upload
          </Button>
        </div>
      </section>

      <Card
        className={`rounded-3xl ${dragging ? 'ring-2 ring-primary/60' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <CardContent className="p-4 sm:p-5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              uploadFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />
          <div className="grid min-h-36 place-items-center rounded-3xl border border-dashed border-border bg-muted/25 p-5 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 font-semibold">Drop files here or choose upload</p>
              <p className="mt-1 text-sm text-muted-foreground">Images, PDFs, archives, documents, code files and datasets are supported.</p>
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>Choose files</Button>
            </div>
          </div>
          {uploading.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {uploading.map((file) => (
                <div key={file.name} className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-xs text-primary">{file.status}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-primary ${file.status === 'Uploaded' ? 'w-full' : 'w-2/3'} transition-all`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="surface flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search files..." />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6 text-muted-foreground" />} title="No files yet" description="Upload a file and share it with a link." />
      ) : (
        <div className="space-y-2">
          {items.map((file) => {
            const Icon = fileIcon(file);
            const isImage = file.mimeType?.startsWith('image/');
            const isRenaming = renamingId === file.id;
            return (
              <Card key={file.id} className="interactive-card overflow-hidden rounded-2xl">
                <CardContent className="p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <a href={fileUrl(file)} target="_blank" rel="noreferrer" className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-muted/35">
                      {isImage ? (
                        <img src={fileUrl(file)} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6 text-primary" />
                      )}
                      </a>
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => onRenameKeyDown(file, e)}
                              onBlur={() => commitRename(file)}
                              className="w-full rounded-lg border border-primary/40 bg-card px-2 py-1 text-sm font-semibold outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); commitRename(file); }}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
                              aria-label="Confirm rename"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground"
                              aria-label="Cancel rename"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <a href={fileUrl(file)} target="_blank" rel="noreferrer" className="block">
                            <p className="truncate font-semibold hover:text-primary transition">{file.name}</p>
                          </a>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="rounded-full">{bytes(file.size)}</Badge>
                          <Badge variant="outline" className="max-w-full rounded-full">
                            <span className="truncate">{file.mimeType || 'file'}</span>
                          </Badge>
                          {file.createdAt && <span className="text-xs text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      {!isRenaming && (
                        <Button variant="outline" size="sm" onClick={() => startRename(file)}>
                          <Pencil className="h-4 w-4" /> Rename
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => copyLink(file)}>
                        <Link2 className="h-4 w-4" /> Copy link
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={fileUrl(file)} download target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" /> Open
                        </a>
                      </Button>
                      {!isRenaming && (
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteFile(file)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}