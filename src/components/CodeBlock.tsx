import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import { Button } from '@/components/ui/button';

const languageMap: Record<string, string> = {
  cpp: 'cpp',
  cplusplus: 'cpp',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
};

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
