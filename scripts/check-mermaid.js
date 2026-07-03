const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'docs', 'chapters', 'dsa');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let idx = 0;
  while ((match = regex.exec(content)) !== null) {
    idx++;
    const code = match[1].trim();
    const lines = code.split('\n');
    const firstLine = lines[0].trim();

    if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey)\b/.test(firstLine)) {
      console.log(`ERROR [${file} #${idx}] Invalid graph type: "${firstLine}"`);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('%%') || line.startsWith('graph') || line.startsWith('flowchart')) continue;

      if (/-->/.test(line) || /---/.test(line) || /-\.->/.test(line) || /==>/.test(line)) {
        const parts = line.split(/--?>|---|-\.\.->|==>/);
        for (const part of parts) {
          const cleaned = part.trim().replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\{.*?\}/g, '').replace(/["']/g, '').trim();
          if (cleaned === 'end' || cleaned === 'subgraph' || cleaned === 'click') {
            console.log(`WARN [${file} #${idx} L${i+1}] reserved word as node: "${line}"`);
          }
        }
      }

      if (/\bend\b/.test(line) && !line.includes('subgraph') && !line.startsWith('end') && !line.startsWith('style') && !line.startsWith('classDef') && !line.startsWith('class ') && !line.startsWith('linkStyle')) {
        // potential issue
      }
    }

    const labelMatches = code.matchAll(/\[([^\]]*)\]/g);
    for (const lm of labelMatches) {
      const label = lm[1];
      if (/^[<(]/.test(label) || label.includes('|') && !label.startsWith('|')) {
        // ok
      }
    }

    console.log(`OK [${file} #${idx}] ${firstLine} (${lines.length} lines)`);
  }
}