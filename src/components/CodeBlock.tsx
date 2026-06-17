import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MarkdownView from './MarkdownView';

const languageMap: Record<string, string> = {
  cpp: 'cpp',
  cplusplus: 'cpp',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  ipynb: 'json',
};

function sourceToText(source: unknown) {
  return Array.isArray(source) ? source.join('') : String(source || '');
}

function outputToText(output: any) {
  if (!output) return '';
  if (output.text) return sourceToText(output.text);
  if (output.data?.['text/plain']) return sourceToText(output.data['text/plain']);
  if (output.traceback) return sourceToText(output.traceback);
  return '';
}

export default function CodeBlock({
  code,
  language = 'plaintext',
  maxHeight = '22rem',
  wrap = false,
}: {
  code: string;
  language?: string;
  maxHeight?: string;
  wrap?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const normalizedLanguage = languageMap[language.toLowerCase()] ?? language.toLowerCase();

  const highlighted = useMemo(() => {
    try {
      if (hljs.getLanguage(normalizedLanguage)) {
        return hljs.highlight(code, { language: normalizedLanguage }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
    }
  }, [code, normalizedLanguage]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (language.toLowerCase() === 'ipynb') {
    let notebook: any = null;
    try {
      notebook = JSON.parse(code);
    } catch {
      notebook = null;
    }
    const cells = Array.isArray(notebook?.cells) ? notebook.cells : [];
    if (cells.length > 0) {
      return (
        <div className="space-y-3 rounded-2xl border border-border bg-card/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">IPYNB</Badge>
            <span className="text-xs text-muted-foreground">{cells.length} cells</span>
            {notebook?.metadata?.kernelspec?.display_name && (
              <span className="text-xs text-muted-foreground">{notebook.metadata.kernelspec.display_name}</span>
            )}
            <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
            {cells.map((cell: any, index: number) => {
              const source = sourceToText(cell.source);
              const cellType = String(cell.cell_type || 'code');
              if (cellType === 'markdown') {
                return (
                  <div key={index} className="rounded-2xl border border-border bg-background/55 p-4">
                    <div className="prose-dark max-w-none">
                      <MarkdownView allowHtml>{source || 'Empty markdown cell'}</MarkdownView>
                    </div>
                  </div>
                );
              }
              const cellLanguage = notebook?.metadata?.language_info?.name || 'python';
              const cellHighlighted = (() => {
                try {
                  return hljs.getLanguage(cellLanguage) ? hljs.highlight(source, { language: cellLanguage }).value : hljs.highlightAuto(source).value;
                } catch {
                  return source.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
                }
              })();
              const outputs = Array.isArray(cell.outputs) ? cell.outputs : [];
              return (
                <div key={index} className="overflow-hidden rounded-2xl border border-border bg-[#0d1117]">
                  <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
                    <Badge variant="outline" className="rounded-full border-white/15 text-[10px] text-slate-300">In [{cell.execution_count ?? ''}]</Badge>
                    <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{cellLanguage}</span>
                  </div>
                  <pre className={`code-window-pre ${wrap ? 'whitespace-pre-wrap break-words' : ''}`} style={{ maxHeight: '22rem' }}>
                    <code className={wrap ? 'whitespace-pre-wrap break-words' : ''} dangerouslySetInnerHTML={{ __html: cellHighlighted }} />
                  </pre>
                  {outputs.length > 0 && (
                    <div className="space-y-2 border-t border-white/10 bg-black/20 p-3">
                      {outputs.slice(0, 4).map((output: any, outputIndex: number) => {
                        const text = outputToText(output);
                        const image = output.data?.['image/png'];
                        return (
                          <div key={outputIndex} className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-300">
                            {image ? (
                              <img src={`data:image/png;base64,${Array.isArray(image) ? image.join('') : image}`} alt="Notebook output" className="max-h-72 rounded-lg object-contain" />
                            ) : (
                              <pre className="max-h-44 overflow-auto whitespace-pre-wrap">{text || output.output_type || 'Output'}</pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="code-window">
      <div className="code-window-header">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{normalizedLanguage}</span>
        <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-white" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className={`code-window-pre ${wrap ? 'whitespace-pre-wrap break-words' : ''}`} style={{ maxHeight }}>
        <code className={wrap ? 'whitespace-pre-wrap break-words' : ''} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
