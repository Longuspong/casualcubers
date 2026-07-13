# Cube Chill

Eine ruhige Speedcubing-Tutorial-Seite für Gelegenheits-Cuber – für alle, die
den Würfel als Puzzle und Fidget-Toy lieben und ihn mit möglichst wenigen
Algorithmen flüssig lösen wollen. Kein eSport, kein Sub-X-Elitismus. Ein
Puzzle-Abend im Wohnzimmer.

Diese Repo ist **Phase 1**: das komplette Grundgerüst und der fertige
Beginner-Pfad. CFOP light und Roux sind sichtbar, aber noch Platzhalter.

## Start

```bash
npm install
npm run dev      # Dev-Server (Vite), Standard: http://localhost:5173
```

## Build

```bash
npm run build    # produziert ein statisches Bundle in dist/
npm run preview  # baut nichts neu, serviert dist/ lokal zum Prüfen
```

Das `dist/`-Verzeichnis ist ein rein statisches Bundle und lässt sich direkt
auf GitHub Pages deployen. `vite.config.js` nutzt `base: './'`, damit alle
Asset-Pfade relativ und portabel bleiben (Projekt-Unterpfad-freundlich).

## Architektur-Grundidee

Vanilla JS (ES-Module), kein Framework. Reine DOM-Manipulation und
Template-Strings. `marked` parst den Content, CSS-Variablen tragen das Theming.

```
index.html                 App-Shell mit #app-Container
content/beginner.md        Quelltext der 8 Lektionen (Arbeitskopie)
public/content/beginner.md ausgeliefert & zur Runtime gefetcht
public/favicon.svg
src/
  main.js                  Einstieg: Router-Dispatch auf die Views
  router.js                Hash-Router (#/, #/beginner, #/beginner/1 …)
  content-loader.js        lädt & parst beginner.md, Notations-Post-Processing
  storage.js               localStorage-Wrapper für den Fortschritt
  paths.js                 Metadaten der drei Lernpfade (eine Quelle der Wahrheit)
  styles.css               Design-Tokens + globale Styles
  views/
    layout.js              gemeinsame Bausteine (App-Bar, mount, escape)
    home.js                Startseite mit drei Pfad-Karten
    path-overview.js       Lektionsliste + Fortschritt eines Pfades
    lesson.js              einzelne Lektion + Fixed-Nav
    coming-soon.js         Platzhalter für CFOP light & Roux
```

### Routing

Hash-basiert (kein History-API), damit GitHub-Pages-Hosting ohne
Server-Rewrites funktioniert:

- `#/` – Startseite
- `#/beginner` – Übersicht Beginner-Pfad
- `#/beginner/1` … `#/beginner/8` – einzelne Lektionen
- `#/cfop-light`, `#/roux` – „Bald verfügbar"
- unbekannte Routen → sanft zurück zu `#/`

### Content-Pipeline

`content-loader.js` lädt `beginner.md` per `fetch` (portabel über
`import.meta.env.BASE_URL`), splittet an den `## Lektion N:`-Überschriften und
extrahiert je Lektion `number`, `title`, `goalImageCaption`, `content` (als HTML
via `marked`) und `abhakenWenn`.

Nach dem Markdown-Parsing läuft ein **Post-Processing** über das erzeugte DOM:

1. **Algorithmus-Kasten** – jede Zeile/jeder Absatz, der *nur* aus Notation
   besteht (`R L U D F B` mit optional `'`/`2`), wird zum großen
   Algorithmus-Kasten mit farbigem Leitfarben-Balken und Deko-Play-Icon
   (in Phase 3 aktiv).
2. **Inline-Notation** – Notationssequenzen mitten im Fließtext werden in
   `<code class="alg">` gewickelt.
3. **ROAR-Badge** – jedes Vorkommen von `ROAR` wird zum
   `<span class="roar-badge">`, damit ROAR als wiederkehrender Charakter
   erlebbar wird.

### Fortschritt

`storage.js` legt den Zustand unter `cubechill:progress` in `localStorage` ab
(`{ beginner: { 1: true, … } }`). Pro Lektion ein Abhaken-Button; die Übersicht
zeigt „X / 8 Lektionen"; im Footer der Übersicht setzt ein Link den Fortschritt
nach Bestätigung zurück.

### Design

Alle Farben, Fonts und Formwerte liegen als CSS-Variablen in `styles.css`
(Light/Dark via `prefers-color-scheme`). Jeder Pfad hat eine Leitfarbe, die
über `body[data-accent]` gesetzt wird und Akzente (Balken, Badges, Buttons)
einfärbt. Mobile-First, Fließtext im Serifen-Font, Notation im Monospace-Font,
daumenerreichbare Fixed-Navigation in den Lektionen.

## Bewusst noch nicht dabei (spätere Phasen)

- Service Worker / Offline-Caching (Phase 5)
- 3D-Würfel-Player – Algorithmen sind aktuell Text-Notation (Phase 3)
- Scramble-Generator (Phase 4)
- Web App Manifest (Phase 5)
- echte SVG-Illustrationen – aktuell Ziel-Bild-Platzhalter
