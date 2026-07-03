import { useMemo } from 'react';
import type { Components } from 'react-markdown';
import MarkdownView from '../MarkdownView';
import CodeBlock from '../CodeBlock';
import MermaidDiagram from './MermaidDiagram';

const calloutMap: Record<string, { cls: string; label: string }> = {
  note: { cls: 'border-sky-400/40 bg-sky-500/10 text-sky-200', label: 'Note' },
  tip: { cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200', label: 'Tip' },
  warn: { cls: 'border-amber-400/40 bg-amber-500/10 text-amber-200', label: 'Warning' },
  danger: { cls: 'border-rose-400/40 bg-rose-500/10 text-rose-200', label: 'Danger' },
  example: { cls: 'border-violet-400/40 bg-violet-500/10 text-violet-200', label: 'Example' },
};

function transformCallouts(markdown: string) {
  const blockRegex = /^> *\[\!(note|tip|warn|warning|danger|example)\]([^\n]*)\n((?:^#[^\n]*(?:\n|$)|^>.*(?:\n|$))+)/gim;

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

const mathReplacements: Array<[RegExp, string]> = [
  [/\u221a\(([^)]+)\)/g, '\\sqrt{$1}'],
  [/\u221a([a-zA-Z])/g, '\\sqrt{$1}'],
  [/\u0177/g, '\\hat{y}'],
  [/x\u0304/g, '\\bar{x}'],
  [/y\u0304/g, '\\bar{y}'],
  [/\u03b1/g, '\\alpha'], [/\u03b2/g, '\\beta'], [/\u03b3/g, '\\gamma'], [/\u03b4/g, '\\delta'],
  [/\u03b5/g, '\\varepsilon'], [/\u03b6/g, '\\zeta'], [/\u03b7/g, '\\eta'], [/\u03b8/g, '\\theta'],
  [/\u03b9/g, '\\iota'], [/\u03ba/g, '\\kappa'], [/\u03bb/g, '\\lambda'], [/\u03bc/g, '\\mu'],
  [/\u03bd/g, '\\nu'], [/\u03be/g, '\\xi'], [/\u03c0/g, '\\pi'],
  [/\u03c1/g, '\\rho'], [/\u03c3/g, '\\sigma'], [/\u03c4/g, '\\tau'], [/\u03c5/g, '\\upsilon'],
  [/\u03c6/g, '\\phi'], [/\u03c7/g, '\\chi'], [/\u03c8/g, '\\psi'], [/\u03c9/g, '\\omega'],
  [/\u0394/g, '\\Delta'], [/\u03a3/g, '\\Sigma'], [/\u03a0/g, '\\Pi'], [/\u03a9/g, '\\Omega'],
  [/\u220f/g, '\\prod'], [/\u222b/g, '\\int'], [/\u2202/g, '\\partial'],
  [/\u2207/g, '\\nabla'], [/\u221e/g, '\\infty'],
  [/\u2265/g, '\\geq'], [/\u2264/g, '\\leq'], [/\u2260/g, '\\neq'], [/\u2248/g, '\\approx'],
  [/\u00b1/g, '\\pm'], [/\u00d7/g, '\\times'], [/\u00f7/g, '\\div'], [/\u00b7/g, '\\cdot'],
  [/\u2192/g, '\\to'], [/\u2208/g, '\\in'], [/\u2209/g, '\\notin'], [/\u221d/g, '\\propto'],
  [/\u00b2/g, '^2'], [/\u00b3/g, '^3'], [/\u2074/g, '^4'], [/\u2075/g, '^5'], [/\u207f/g, '^n'],
  [/\u1d62/g, '_i'], [/\u2080/g, '_0'], [/\u2081/g, '_1'], [/\u2082/g, '_2'],
  [/\u2083/g, '_3'], [/\u2099/g, '_n'], [/\u2096/g, '_k'], [/\u2c7c/g, '_j'],
];

const mathSymbolTest = /[\u0177\u0304\u03b1-\u03c9\u0391-\u03a9\u220f\u222b\u2202\u2207\u221e\u2265\u2264\u2260\u2248\u00b1\u00d7\u00f7\u00b7\u2192\u2208\u2209\u221d\u221a\u00b2\u00b3\u2074\u2075\u207f\u1d62\u2080-\u2083\u2099\u2096\u2c7c]/;

function toLatex(text: string): string {
  let result = text;
  for (const [pattern, replacement] of mathReplacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function transformUnicodeMath(markdown: string): string {
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part;
    return part.replace(/`([^`\n]+)`/g, (match, content: string) => {
      if (!mathSymbolTest.test(content)) return match;
      return `$${toLatex(content)}$`;
    });
  }).join('');
}

const docComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');
    if (match) {
      if (match[1] === 'mermaid') {
        return <MermaidDiagram chart={text} />;
      }
      return <CodeBlock code={text} language={match[1]} />;
    }
    if (text.includes('\n')) {
      return <CodeBlock code={text} language="plaintext" />;
    }
    return <code>{children}</code>;
  },
  table: ({ children }) => (
    <div className="doc-table-wrapper">
      <table>{children}</table>
    </div>
  ),
};

export default function DocContent({ body }: { body: string }) {
  const transformed = useMemo(
    () => transformUnicodeMath(transformCallouts(stripLeadingH1(body))),
    [body],
  );
  return (
    <div className="doc-content">
      <MarkdownView allowHtml components={docComponents}>{transformed}</MarkdownView>
    </div>
  );
}