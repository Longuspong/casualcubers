import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const CONTENT_DIR = fileURLToPath(new URL('./content', import.meta.url));

// Die Lektionstexte liegen als Markdown in content/ und werden zur Runtime
// gefetcht, nicht gebundelt. Der Dev-Server liefert sie direkt aus dem
// Projekt-Root aus; für den Build kopiert dieses Plugin sie nach
// dist/content/. Damit gibt es genau eine Stelle, an der ein Text gepflegt
// wird – eine zweite Kopie unter public/ hat sich schon einmal still
// abgehängt und der Production-Build zeigte alte Lektionen.
function copyContent() {
  return {
    name: 'cube-chill-content',
    apply: 'build',
    generateBundle() {
      const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
      if (files.length === 0) {
        this.error('content/ enthält keine .md-Dateien – der Build hätte keine Lektionen.');
      }
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          fileName: `content/${file}`,
          source: readFileSync(join(CONTENT_DIR, file)),
        });
      }
    },
  };
}

// Relative base ('./') hält alle Asset-Pfade portabel – das Bundle läuft
// dadurch sowohl auf Vercel im Root als auch unter einem Unterpfad, und es
// passt zum Hash-Routing, das den Dokument-Pfad nie verändert. Der Content
// wird zur Runtime über import.meta.env.BASE_URL relativ zur index.html
// geladen.
export default defineConfig({
  base: './',
  plugins: [copyContent()],
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
