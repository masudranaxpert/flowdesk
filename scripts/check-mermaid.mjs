import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import mermaid from 'mermaid';

const chaptersDir = join(process.cwd(), 'src/data/docs/chapters/dsa');
const files = readdirSync(chaptersDir).filter(f => f.endsWith('.md'));

let totalDiagrams = 0;
let failedDiagrams = 0;

for (const file of files) {
  const content = readFileSync(join(chaptersDir, file), 'utf-8');
  const mermaidBlocks = content.matchAll(/```mermaid\n([\s\S]*?)```/g);

  let diagramIndex = 0;
  for (const block of mermaidBlocks) {
    diagramIndex++;
    totalDiagrams++;
    const diagram = block[1].trim();

    try {
      await mermaid.parse(diagram);
    } catch (err) {
      failedDiagrams++;
      console.log(`FAIL: ${file} diagram #${diagramIndex}`);
      console.log(`  Error: ${err.message.split('\n')[0]}`);
      console.log(`  First line: ${diagram.split('\n')[0]}`);
      console.log('');
    }
  }
}

console.log(`\nResults: ${totalDiagrams - failedDiagrams}/${totalDiagrams} passed, ${failedDiagrams} failed`);
process.exit(failedDiagrams > 0 ? 1 : 0);