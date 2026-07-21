import { useEffect, useRef, useState } from 'react';

let mermaidInitialized = false;

async function getMermaid() {
  const mermaid = (await import('mermaid')).default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#facc15',
        primaryTextColor: '#e8e8e8',
        primaryBorderColor: '#facc15',
        lineColor: '#888',
        secondaryColor: '#222',
        tertiaryColor: '#1a1a2e',
        fontSize: '14px',
        fontFamily: "'Hind Siliguri', sans-serif",
      },
      flowchart: { curve: 'basis', padding: 16 },
      sequence: { actorMargin: 60, boxMargin: 10, mirrorActors: false },
    });
    mermaidInitialized = true;
  }
  return mermaid;
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    getMermaid()
      .then(async (mermaid) => {
        try {
          const { svg: rendered } = await mermaid.render(id, chart.trim());
          if (!cancelled) {
            setSvg(rendered);
            setError('');
          }
        } catch (err) {
          if (!cancelled) {
            setError(String(err));
            setSvg('');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Diagram render failed</p>
        <pre className="overflow-x-auto text-xs">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container flex justify-center overflow-x-auto py-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}