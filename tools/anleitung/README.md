# Bilder-Anleitung (schriftloses Anfänger-PDF)

Erzeugt `public/anfaenger-bildanleitung.pdf` – die komplette Anfänger-Methode
rein als Bilder, damit auch ein Kind, das noch nicht liest, den Würfel Schritt
für Schritt lösen kann.

## Bildsprache (flach, Frontansicht)

Der Würfel wird flach als Quadrat gezeichnet – Blick von vorn, so wie man ihn
real in der Hand hält. Gelb oben und die Rückseite sieht man dabei nicht; die
einzige verdeckte Seite ist **B**, und die kommt in keinem Anfänger-Algorithmus
vor.

- **F** = runder Pfeil (Vorderseite drehen), **F'** gegenläufig.
- **R/L/U/D** = gerader Pfeil an der passenden Kante. Richtungen (gegen
  `applyMove` aus `src/cube-state.js` geprüft):
  R rechts hoch · L links runter · U oben links · D unten rechts, jeweils mit
  `'` andersherum. Eine `2` ist ein Doppelpfeil.
- **`[ N× … ]`** klammert eine Zugfolge, `N×` sagt, wie oft. `🔁` = so oft
  wiederholen, bis das Ziel dasteht.
- **`⇒`** zeigt das Ergebnis (Ziel-Symbol).

## Bausteine

- `render2d.js` – zeichnet ein flaches Würfel-Quadrat (`flatFace`) und einen
  einzelnen Zug als Quadrat mit Pfeil (`moveGlyph`).
- `lessons.js` – die neun Lektionen (Ziel-Symbole + Zugfolgen), Reihenfolge und
  Inhalte wie in `content/beginner.md`.
- `generate.js` – setzt Deckblatt, Legende und die Lektionen zusammen.
- `page.html` – Druck-Layout (A4).
- `build-pdf.mjs` – rendert `page.html` im vorinstallierten Chromium und druckt
  das PDF.

## Neu erzeugen

```
npm install --no-save playwright-core
npm run pdf
```

Findet der Rechner Chromium nicht automatisch, den Pfad setzen:
`CHROMIUM_PATH=/pfad/zu/chrome node tools/anleitung/build-pdf.mjs`.

Das PDF liegt danach unter `public/anfaenger-bildanleitung.pdf` und wird von
Vite unter `/anfaenger-bildanleitung.pdf` mit ausgeliefert.
