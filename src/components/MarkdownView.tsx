import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

type MarkdownViewProps = {
  children: string;
  allowHtml?: boolean;
  components?: Components;
};

const katexOptions = {
  throwOnError: false,
  strict: false,
  trust: false,
  macros: {
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
    '\\QQ': '\\mathbb{Q}',
    '\\CC': '\\mathbb{C}',
    '\\eps': '\\varepsilon',
    '\\vec': '\\mathbf{#1}',
  },
};

function normalizeMathDelimiters(markdown: string) {
  const fencedParts = markdown.split(/(```[\s\S]*?```)/g);
  return fencedParts.map((part, index) => {
    if (index % 2 === 1) return part;
    return part
      .split(/(`[^`\n]*`)/g)
      .map((inlinePart, inlineIndex) => {
        if (inlineIndex % 2 === 1) return inlinePart;
        return inlinePart
          .replace(/\\\[([\s\S]*?)\\\]/g, (_match, expression) => `$$\n${expression.trim()}\n$$`)
          .replace(/\\\(([\s\S]*?)\\\)/g, (_match, expression) => `$${expression.trim()}$`);
      })
      .join('');
  }).join('');
}

export default function MarkdownView({ children, allowHtml = false, components }: MarkdownViewProps) {
  const normalized = normalizeMathDelimiters(children);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={allowHtml ? [rehypeRaw, [rehypeKatex, katexOptions]] : [[rehypeKatex, katexOptions]]}
      components={components}
    >
      {normalized}
    </ReactMarkdown>
  );
}
