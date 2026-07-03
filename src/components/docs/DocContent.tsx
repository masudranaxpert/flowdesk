import { useMemo } from 'react';
import type { Components } from 'react-markdown';
import MarkdownView from '../MarkdownView';
import CodeBlock from '../CodeBlock';

const calloutMap: Record<string, { cls: string; label: string }> = {
  note: { cls: 'border-sky-400/40 bg-sky-500/10 text-sky-200', label: 'Note' },
  tip: { cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200', label: 'Tip' },
  warn: { cls: 'border-amber-400/40 bg-amber-500/10 text-amber-200', label: 'Warning' },
  danger: { cls: 'border-rose-400/40 bg-rose-500/10 text-rose-200', label: 'Danger' },
  example: { cls: 'border-violet-400/40 bg-violet-500/10 text-violet-200', label: 'Example' },
};

function transformCallouts(markdown: string) {
  // Handles two callout body styles found in chapter files:
  //   > [!type] Title          →  title on same line after ]
  //   # body text               →  body as heading (no > prefix)
  // OR traditional:
  //   > [!type]
  //   > body text               →  body lines prefixed with >
  const blockRegex = /^> *\[!(note|tip|warn|warning|danger|example)\]([^\n]*)\n((?:^#[^\n]*(?:\n|$)|^>.*(?:\n|$))+)/gim;

  return markdown.replace(blockRegex, (_match, kind: string, titleText: string, body: string) => {
    const key = String(kind).toLowerCase() === 'warning' ? 'warn' : String(kind).toLowerCase();
    const config = calloutMap[key] ?? calloutMap.note;
    const title = titleText.trim();
    const label = title || config.label;

    const inner = body
      .replace(/^> ?/gim, '')
      .replace(/^#+\s*/gim, '')
      .trim();

    return `\n<div class="doc-callout ${config.cls}">\n<p class="doc-callout-label">${label}</p>\n\n${inner}\n</div>\n`;
  });
}

function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\s*#[^#\n].*(?:\n|$)/, '').trimStart();
}

const docComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');
    if (match) {
      return <CodeBlock code={text} language={match[1]} />;
    }
    if (text.includes('\n')) {
      return <CodeBlock code={text} language="plaintext" />;
    }
    return <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-primary">{children}</code>;
  },
};

export default function DocContent({ body }: { body: string }) {
  const transformed = useMemo(() => transformCallouts(stripLeadingH1(body)), [body]);
  return (
    <div className="doc-content">
      <MarkdownView allowHtml components={docComponents}>{transformed}</MarkdownView>
    </div>
  );
}