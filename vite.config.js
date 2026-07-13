import { defineConfig } from 'vite';

// Relative base ('./') hält alle Asset-Pfade portabel – wichtig fürs spätere
// Deploy auf GitHub Pages (Projekt-Unterpfad) und für das Hash-Routing, das
// den Dokument-Pfad nie verändert. Der Content wird zur Runtime über
// import.meta.env.BASE_URL relativ zur index.html geladen.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
