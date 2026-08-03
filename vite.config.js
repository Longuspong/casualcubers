import { defineConfig } from 'vite';

// Relative base ('./') hält alle Asset-Pfade portabel – das Bundle läuft
// dadurch sowohl auf Vercel im Root als auch unter einem Unterpfad, und es
// passt zum Hash-Routing, das den Dokument-Pfad nie verändert. Der Content
// wird zur Runtime über import.meta.env.BASE_URL relativ zur index.html
// geladen.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
