import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, FileText, FileArchive, Image as ImageIcon, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import CodeBlock from '../components/CodeBlock';
import MarkdownView from '../components/MarkdownView';
import { Spinner } from '../components/UI';
import { normalizeUrl } from '../lib/utils';
import type { Bookmark, CodeSnippet, Notebook, Question, UploadedFile } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SharedItem = Bookmark | Notebook | CodeSnippet | Question | UploadedFile;

function bytes(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(mimeType = '', filename = '') {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('zip') || filename.match(/\.(zip|rar|7z)$/i)) return FileArchive;
  return FileText;
}

export default function SharePage() {
  const { type, id, shareCode } = useParams();
  const [item, setItem] = useState<SharedItem | null>(null);
  const [resolvedType, setResolvedType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const endpoint = shareCode
        ? `/api/share/${encodeURIComponent(shareCode)}`
        : type && id
          ? `/api/share/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
          : '';
      if (!endpoint) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(endpoint);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Shared item not found');
        setItem(data.item);
        setResolvedType(data.type || type || '');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Shared item not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, id, shareCode]);

  if (loading) return <Spinner />;

  const displayType = resolvedType || type || '';

  if (!item || !displayType) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Shared item not found</p>
            <Button asChild className="mt-4">
              <Link to="/">Back home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = 'title' in item ? item.title : 'name' in item ? item.name : 'Shared item';

  return (
    <div className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card className="rounded-3xl">
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div>
              <Badge variant="secondary" className="rounded-full">{displayType}</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            </div>

            {displayType === 'bookmarks' && 'url' in item && (
              <div className="space-y-3">
                {'description' in item && item.description && <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>}
                <Button asChild>
                  <a href={normalizeUrl(item.url)} target="_blank" rel="noopener">
                    <ExternalLink className="h-4 w-4" />
                    Open bookmark
                  </a>
                </Button>
              </div>
            )}

            {(displayType === 'notes' || displayType === 'notebooks') && 'content' in item && (
              <div className="prose-dark note-reading max-w-none">
                <MarkdownView allowHtml>{item.content}</MarkdownView>
              </div>
            )}

            {displayType === 'codes' && 'code' in item && 'language' in item && (
              <>
                {'description' in item && item.description && <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>}
                <CodeBlock code={item.code} language={item.language} />
              </>
            )}

            {displayType === 'questions' && 'solution' in item && (
              <div className="space-y-5">
                {'problem' in item && item.problem && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold">Question</h2>
                    <div className="prose-dark max-w-none">
                      <MarkdownView>{item.problem}</MarkdownView>
                    </div>
                  </section>
                )}
                {item.solution && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold">Answer</h2>
                    <div className="prose-dark max-w-none">
                      <MarkdownView>{item.solution}</MarkdownView>
                    </div>
                  </section>
                )}
                {item.code && <CodeBlock code={item.code} language={item.language} />}
              </div>
            )}

            {displayType === 'files' && 'mimeType' in item && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-border bg-muted/40 shadow-sm">
                  {item.mimeType?.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    (() => {
                      const Icon = fileIcon(item.mimeType, item.name);
                      return <Icon className="h-10 w-10 text-primary animate-pulse" />;
                    })()
                  )}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{item.name}</h2>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="rounded-full">{bytes(item.size)}</Badge>
                    <Badge variant="outline" className="rounded-full">{item.mimeType || 'Unknown file type'}</Badge>
                  </div>
                  {item.createdAt && (
                    <p className="text-xs text-muted-foreground">Uploaded on {new Date(item.createdAt).toLocaleDateString()}</p>
                  )}
                </div>

                {item.mimeType?.startsWith('image/') && (
                  <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-muted/20 p-2 shadow-inner">
                    <img src={item.url} alt={item.name} className="max-h-96 w-full rounded-xl object-contain" />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {item.mimeType?.startsWith('video/') && (
                    <Button asChild size="lg" className="px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform rounded-2xl bg-primary text-primary-foreground">
                      <Link to={shareCode ? `/share/player/${shareCode}` : `/share/player/${type}/${id}`}>
                        <Play className="mr-2 h-5 w-5 fill-current" /> Play Video
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="lg" variant={item.mimeType?.startsWith('video/') ? "outline" : "default"} className="px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform rounded-2xl">
                    <a href={item.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-5 w-5" /> Download File
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
