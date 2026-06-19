import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import CodeBlock from '../components/CodeBlock';
import MarkdownView from '../components/MarkdownView';
import { Spinner } from '../components/UI';
import { normalizeUrl } from '../lib/utils';
import type { Bookmark, CodeSnippet, Notebook, Question } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SharedItem = Bookmark | Notebook | CodeSnippet | Question;

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

  const title = 'title' in item ? item.title : 'Shared item';

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
                {item.description && <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
