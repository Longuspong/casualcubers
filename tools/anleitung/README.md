# Bilder-Anleitung (schriftloses Anfänger-PDF)

Erzeugt `public/anfaenger-bildanleitung.pdf` – die komplette Anfänger-Methode
rein als Bilder: pro Lektion ein Ziel-Bild und die Zugfolgen als einzelne
Würfelbilder mit Dreh-Pfeil. Ganz ohne Text, damit auch ein Kind, das noch
nicht liest, den Würfel Schritt für Schritt lösen kann.

## Bausteine

- `render.js` – zeichnet einen einzelnen Zug (`R`, `U'`, `F2` …) als gelösten
  Würfel mit Dreh-Pfeil. Nutzt dieselbe Kamera/Geometrie wie die App
  (`src/cube-3d.js`); die Pfeilrichtung ist an `turnCW` aus `src/cube-state.js`
  geeicht, also identisch zur Zug-Animation im Abspieler.
- `lessons.js` – die neun Lektionen (Ziel-Diagramme + Zugfolgen), Reihenfolge
  und Inhalte wie in `content/beginner.md`.
- `generate.js` – setzt Deckblatt, Legende und die Lektionen zusammen.
- `page.html` – Druck-Layout (A4) und die Würfelfarben.
- `build-pdf.mjs` – rendert `page.html` im vorinstallierten Chromium und
  druckt das PDF.

## Neu erzeugen

Einmalig `playwright-core` bereitstellen (treibt nur das vorhandene Chromium):

```
npm install --no-save playwright-core
node tools/anleitung/build-pdf.mjs
```

Findet der Rechner Chromium nicht automatisch, den Pfad per Umgebungsvariable
setzen: `CHROMIUM_PATH=/pfad/zu/chrome node tools/anleitung/build-pdf.mjs`.

Das PDF liegt danach unter `public/anfaenger-bildanleitung.pdf` und wird von
Vite unter `/anfaenger-bildanleitung.pdf` mit ausgeliefert.
