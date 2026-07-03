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

// ── Unicode → LaTeX conversion ──────────────────────────────────────────────

const superMap: Record<string, string> = {
  '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3',
  '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7',
  '\u2078': '8', '\u2079': '9',
  '\u207a': '+', '\u207b': '-',
  '\u207f': 'n', '\u2071': 'i',
  '\u1d43': 'a', '\u1d47': 'b', '\u1d9c': 'c', '\u1d48': 'd',
  '\u1d49': 'e', '\u1da0': 'f', '\u1d4d': 'g', '\u02b0': 'h',
  '\u1d62': 'i', '\u02b2': 'j', '\u1d4f': 'k', '\u02e1': 'l',
  '\u1d50': 'm', '\u1d52': 'o', '\u1d56': 'p', '\u02b3': 'r',
  '\u02e2': 's', '\u1d57': 't', '\u1d58': 'u', '\u1d5b': 'v',
  '\u02b7': 'w', '\u02e3': 'x', '\u02b8': 'y', '\u1d6b': 'z',
  '\u1d40': '\\mathrm{T}',
};

const subMap: Record<string, string> = {
  '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3',
  '\u2084': '4', '\u2085': '5', '\u2086': '6', '\u2087': '7',
  '\u2088': '8', '\u2089': '9',
  '\u208a': '+', '\u208b': '-',
  '\u1d62': 'i', '\u2099': 'n', '\u2096': 'k', '\u2c7c': 'j',
  '\u2090': 'a', '\u2091': 'e', '\u2092': 'o', '\u2093': 'x',
  '\u2095': 'h', '\u2097': 'k', '\u2098': 'm', '\u209a': 'p',
  '\u209b': 's', '\u209c': 't', '\u2096\u2096': 'kk',
};

const greekMap: Record<string, string> = {
  '\u03b1': '\\alpha', '\u03b2': '\\beta', '\u03b3': '\\gamma', '\u03b4': '\\delta',
  '\u03b5': '\\varepsilon', '\u03b6': '\\zeta', '\u03b7': '\\eta', '\u03b8': '\\theta',
  '\u03b9': '\\iota', '\u03ba': '\\kappa', '\u03bb': '\\lambda', '\u03bc': '\\mu',
  '\u03bd': '\\nu', '\u03be': '\\xi', '\u03c0': '\\pi', '\u03c1': '\\rho',
  '\u03c3': '\\sigma', '\u03c4': '\\tau', '\u03c5': '\\upsilon', '\u03c6': '\\phi',
  '\u03c7': '\\chi', '\u03c8': '\\psi', '\u03c9': '\\omega',
  '\u0393': '\\Gamma', '\u0394': '\\Delta', '\u0398': '\\Theta', '\u039b': '\\Lambda',
  '\u039e': '\\Xi', '\u03a0': '\\Pi', '\u03a3': '\\Sigma', '\u03a6': '\\Phi',
  '\u03a8': '\\Psi', '\u03a9': '\\Omega',
};

const operatorMap: Record<string, string> = {
  '\u220f': '\\prod', '\u222b': '\\int', '\u2202': '\\partial',
  '\u2207': '\\nabla', '\u221e': '\\infty',
  '\u2265': '\\geq', '\u2264': '\\leq', '\u2260': '\\neq', '\u2248': '\\approx',
  '\u00b1': '\\pm', '\u00d7': '\\times', '\u00f7': '\\div', '\u00b7': '\\cdot',
  '\u2192': '\\to', '\u2208': '\\in', '\u2209': '\\notin', '\u221d': '\\propto',
  '\u222a': '\\cup', '\u2229': '\\cap', '\u2211': '\\sum',
};

const specialMap: Array<[RegExp, string]> = [
  [/\u221a\(([^)]+)\)/g, '\\sqrt{$1}'],
  [/\u221a([a-zA-Z])/g, '\\sqrt{$1}'],
  [/\u0177/g, '\\hat{y}'],
  [/x\u0304/g, '\\bar{x}'],
  [/y\u0304/g, '\\bar{y}'],
];

const superCharClass = Object.keys(superMap).join('');
const subCharClass = Object.keys(subMap)
  .filter(k => k.length === 1)
  .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('');

const superRegex = new RegExp(`[${superCharClass}]+`, 'g');
const subRegex = new RegExp(`[${subCharClass}]+`, 'g');

const allMathChars = [
  ...Object.keys(superMap),
  ...Object.keys(subMap).filter(k => k.length === 1),
  ...Object.keys(greekMap),
  ...Object.keys(operatorMap),
  '\u0177', '\u0304', '\u221a',
].join('').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mathSymbolTest = new RegExp(`[${allMathChars}]`);

function toLatex(text: string): string {
  let result = text;

  for (const [pattern, replacement] of specialMap) {
    result = result.replace(pattern, replacement);
  }

  result = result.replace(superRegex, (match) =>
    `^{${[...match].map(c => superMap[c] || c).join('')}}`);

  result = result.replace(subRegex, (match) =>
    `_{${[...match].map(c => subMap[c] || c).join('')}}`);

  for (const [char, latex] of Object.entries(greekMap)) {
    result = result.replaceAll(char, latex);
  }
  for (const [char, latex] of Object.entries(operatorMap)) {
    result = result.replaceAll(char, latex);
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

// ── Component ────────────────────────────────────────────────────────────────

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