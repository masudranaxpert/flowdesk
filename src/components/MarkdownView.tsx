import { useState } from 'react';
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

const MarkdownCheckbox = ({ checked: initialChecked, disabled, ...props }: any) => {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <input 
      type="checkbox" 
      {...props}
      checked={checked} 
      onChange={(e) => setChecked(e.target.checked)} 
      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
    />
  );
};

const defaultComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="w-full overflow-x-auto my-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  input: ({ type, checked, disabled, ...props }: any) => {
    if (type === 'checkbox') {
      return <MarkdownCheckbox checked={checked} disabled={disabled} {...props} />;
    }
    return <input type={type} checked={checked} disabled={disabled} {...props} />;
  },
};

export default function MarkdownView({ children, allowHtml = false, components }: MarkdownViewProps) {
  const normalized = normalizeMathDelimiters(children);
  const mergedComponents = { ...defaultComponents, ...components };
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={allowHtml ? [rehypeRaw, [rehypeKatex, katexOptions]] : [[rehypeKatex, katexOptions]]}
      components={mergedComponents}
    >
      {normalized}
    </ReactMarkdown>
  );
}
