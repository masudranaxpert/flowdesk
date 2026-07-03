import { useMemo } from 'react';
import MarkdownView from '../MarkdownView';

const calloutMap: Record<string, { cls: string; label: string }> = {
  note: { cls: 'border-sky-400/40 bg-sky-500/10 text-sky-200', label: 'Note' },
  tip: { cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200', label: 'Tip' },
  warn: { cls: 'border-amber-400/40 bg-amber-500/10 text-amber-200', label: 'Warning' },
  danger: { cls: 'border-rose-400/40 bg-rose-500/10 text-rose-200', label: 'Danger' },
  example: { cls: 'border-violet-400/40 bg-violet-500/10 text-violet-200', label: 'Example' },
};

function transformCallouts(markdown: string) {
  const blockRegex = /^> *\[!(note|tip|warn|warning|danger|example)\]\s*\n((?:^>.*(?:\n|$))+)/gim;
  return markdown.replace(blockRegex, (_match, kind: string, body: string) => {
    const key = String(kind).toLowerCase() === 'warning' ? 'warn' : String(kind).toLowerCase();
    const config = calloutMap[key] ?? calloutMap.note;
    const inner = body.replace(/^>\s?/gim, '').trim();
    return `\n<div class="doc-callout ${config.cls}">\n<p class="doc-callout-label">${config.label}</p>\n\n${inner}\n</div>\n`;
  });
}

function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\s*#[^#\n].*(?:\n|$)/, '').trimStart();
}

export default function DocContent({ body }: { body: string }) {
  const transformed = useMemo(() => transformCallouts(stripLeadingH1(body)), [body]);
  return (
    <div className="doc-content prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h1:text-3xl prose-h2:mt-10 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2 prose-pre:bg-transparent prose-pre:p-0 prose-code:text-primary prose-code:before:hidden prose-code:after:hidden">
      <MarkdownView allowHtml>{transformed}</MarkdownView>
    </div>
  );
}