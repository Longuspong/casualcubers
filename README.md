# Cube Chill

Eine ruhige Speedcubing-Tutorial-Seite für Gelegenheits-Cuber – für alle, die
den Würfel als Puzzle und Fidget-Toy lieben und ihn mit möglichst wenigen
Algorithmen flüssig lösen wollen. Kein eSport, kein Sub-X-Elitismus. Ein
Puzzle-Abend im Wohnzimmer.

Stand: **Phase 2**. Vier fertige Lernpfade – **Beginner** (3x3) und **2x2** als
Einstieg, **CFOP light** und **Roux** als weiterführende Pfade (setzen den
Beginner voraus). Alle vier werden aus dem gleichen Content-Format gerendert.

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

Das `dist/`-Verzeichnis ist ein rein statisches Bundle.
`vite.config.js` nutzt `base: './'`, damit alle Asset-Pfade relativ und
portabel bleiben (Projekt-Unterpfad-freundlich).

## Deploy

Vercel deployt automatisch aus dem Repository – ein CI-Workflow liegt hier
nicht mehr, das übernimmt die Git-Integration von Vercel. Vite wird erkannt,
Build-Kommando `npm run build`, Output-Verzeichnis `dist/`. Production-Branch
ist `main`; jeder andere Branch bekommt ein Preview-Deployment. Der Branch
lässt sich nur im Vercel-Dashboard umstellen (Project → Settings →
Environments → Production → Branch Tracking), nicht über eine Datei im Repo.

## Architektur-Grundidee

Vanilla JS (ES-Module), kein Framework. Reine DOM-Manipulation und
Template-Strings. `marked` parst den Content, CSS-Variablen tragen das Theming.

```
index.html                 App-Shell mit #app-Container
content/<pfad>.md          Lektionstexte, zur Runtime gefetcht – einzige Quelle
                           (beginner.md, 2x2.md, cfop-light.md, roux.md)
                           Dev-Server liefert sie direkt aus, der Build kopiert
                           sie über ein Plugin in vite.config.js nach dist/content/
public/favicon.svg
public/wuerfel-bilderanleitung.pdf
                           Bilderanleitung zum Ausdrucken (generiert, siehe unten)
tools/kids-pdf/            erzeugt genau dieses PDF (`npm run pdf`)
src/
  main.js                  Einstieg: Router-Dispatch auf die Views
  router.js                Hash-Router (#/, #/<pfad>, #/<pfad>/1 …)
  content-loader.js        lädt & parst <pfad>.md, Notations-Post-Processing
  storage.js               localStorage-Wrapper für den Fortschritt (pro Pfad)
  paths.js                 Metadaten der Lernpfade (eine Quelle der Wahrheit)
  styles.css               Design-Tokens + globale Styles
  views/
    layout.js              gemeinsame Bausteine (App-Bar, mount, escape)
    home.js                Startseite mit den Pfad-Karten
    path-overview.js       Lektionsliste + Fortschritt eines Pfades
    lesson.js              einzelne Lektion + Fixed-Nav
    coming-soon.js         Platzhalter für Pfade mit ready:false
```

### Einen Pfad hinzufügen

1. `content/<id>.md` anlegen (gleiches Format wie
   `beginner.md`: `## Lektion N: Titel`, `**Ziel-Bild:** … Bildunterschrift: „…"`,
   `### Übung`, `**Abhaken, wenn:** …`).
2. In `src/paths.js` einen Eintrag mit `id`/`route`/`accent`/Texten/`lessonCount`
   und `ready: true` ergänzen.
3. Für eine neue Leitfarbe die vier `--accent-<key>`-Stellen in `styles.css`
   spiegeln (Light/Dark + `body[data-accent]` + `.path-card[data-accent]`).

Router, Loader und Views sind pfad-agnostisch – mehr braucht es nicht.

### Routing

Hash-basiert (kein History-API), damit statisches Hosting ohne
Server-Rewrites funktioniert:

- `#/` – Startseite
- `#/<pfad>` – Übersicht eines Pfades (`beginner`, `2x2`, `cfop-light`, `roux`)
- `#/<pfad>/1` … `#/<pfad>/N` – einzelne Lektionen
- Pfade mit `ready:false` → „Bald verfügbar"
- unbekannte Routen → sanft zurück zu `#/`

### Content-Pipeline

`content-loader.js` lädt `<pfad>.md` per `fetch` (portabel über
`import.meta.env.BASE_URL`, Ergebnis pro Pfad gecacht), splittet an den
`## Lektion N:`-Überschriften und extrahiert je Lektion `number`, `title`,
`goalImageDesc`, `goalImageCaption`, `goalImageHtml`, `content` (als HTML via
`marked`) und `abhakenWenn`.

Steht direkt unter der `**Ziel-Bild:**`-Zeile ein `cube`- oder
`cube-net`-Block (nur Leerzeilen dazwischen), wird daraus das Ziel-Bild der
Lektion gerendert – die Prosa der Zeile dient dann als `aria-label`. Ohne
Block bleibt der gestrichelte Platzhalter stehen.

Nach dem Markdown-Parsing läuft ein **Post-Processing** über das erzeugte DOM:

0. **Würfeldiagramme** – Codeblöcke mit der Sprache `cube` oder `cube-net`
   werden zu Inline-SVGs. Zeichen in beiden Formaten: `y r g b o w .`
   (`.` = beliebige Farbe, wird grau gerendert). Pro Diagramm optional eine
   `:Beschriftung`-Zeile; mehrere Diagramme in einem Block werden durch
   Leerzeilen getrennt und nebeneinander gerendert (ab drei Stück kleiner).
   Die Quellformate sind flach und zeilenbasiert, gerendert wird daraus ein
   räumlicher Würfel.
   - `cube` = **Blick von schräg oben** auf die Oberseite. 5 Zeilen pro
     Diagramm (3 hintere Seitensticker / 3× „links + 3 Felder + rechts" /
     3 vordere Seitensticker) bzw. 4 Zeilen für den 2x2. Gerendert als
     Zentralprojektion von oben: die Oberseite bleibt ein Quadrat, die vier
     Seitenbänder kippen als Trapeze nach außen. Anders als eine Eckansicht
     zeigt das alle vier Seitenreihen gleichzeitig.
   - `cube-net` = **ganzer Würfel**, im Quelltext als Kreuz-Layout notiert.
     9 Zeilen pro Diagramm (3× U / 3× „L F R B" / 3× D) bzw. 6 Zeilen für den
     2x2; die Blöcke einer Zeile werden durch Leerzeichen getrennt. Eine Zeile
     `!letters` blendet zusätzlich die Seitenbuchstaben U/L/F/R/B/D ein.
     Gerendert als isometrischer Würfel (U F R). Steht auf D, B oder L etwas
     anderes als `.`, kommt eine zweite Ansicht von der Gegenecke dazu – ein
     Würfel zeigt nun mal nur drei Seiten.
1. **Algorithmus-Kasten** – jede Zeile/jeder Absatz, der *nur* aus Notation
   besteht (`R L U D F B M` mit optional `'`/`2`; `M` für Roux), wird zum großen
   Algorithmus-Kasten mit farbigem Leitfarben-Balken und Deko-Play-Icon
   (in Phase 3 aktiv).
2. **Inline-Notation** – Notationssequenzen mitten im Fließtext werden in
   `<code class="alg">` gewickelt.
3. **ROAR-Badge** – jedes Vorkommen von `ROAR` wird zum
   `<span class="roar-badge">`, damit ROAR als wiederkehrender Charakter
   erlebbar wird.

### Bilderanleitung zum Ausdrucken

`public/wuerfel-bilderanleitung.pdf` ist der Beginner-Pfad auf neun Seiten A4
quer – **ohne ein einziges Wort**. Sie ist für Kinder gedacht, die den Würfel
schon gezeigt bekommen haben, aber noch nicht lesen können: Seite 1 ist die
Landkarte mit allen acht Schritten, danach kommt pro Schritt eine Seite nach
immer demselben Bauplan.

```
Punktleiste oben          der wievielte Schritt ist das? (statt einer Ziffer)
Bild -> Pfeil -> Bild     so sieht es aus, so soll es aussehen
Zugfolge unten            Merkfigur + ein Symbol pro Zug
```

Ein Zug ist ein Blick von vorn auf den Würfel: die Scheibe, die sich dreht, ist
eingefärbt, ein einfacher Pfeil zeigt die Richtung (`R` = rechte Spalte hoch,
`U` = obere Reihe nach links, `F` = Kreispfeil auf der ganzen Fläche). Ein Zug,
der zweimal gedreht wird (`F2`), bekommt keine Sonderzeichnung – er steht
schlicht **zweimal nebeneinander**. Ein Kreispfeil heißt „nochmal", ein Auge
„jetzt gucken", ein durchgestrichener U-Zug „nicht die Oberseite drehen,
sondern den ganzen Würfel".

Vor den Zugfolgen steht keine Notation, sondern die Merkfigur, unter der das
Kind den Algorithmus gelernt hat:

| Figur                    | Zugfolge              | auf der Website  |
| ------------------------ | --------------------- | ---------------- |
| Fahrstuhl                | `R U R' U'`           | ROAR / Aufzug    |
| Spaziergänger            | `R U R' U R U2 R' U`  | Kantentausch (Sune + U) |
| zwei Mädchen im Garten   | `U R U' L' U R' U' L` | Karussell (Niklas) |
| Fahrstuhl in den Keller  | `R' D' R D`           | Aufzug in den Keller |

Neu bauen:

```bash
npm run pdf      # schreibt public/wuerfel-bilderanleitung.pdf
```

Der Generator liegt in `tools/kids-pdf/` und braucht weder Browser noch
Abhängigkeit:

- `pdf.mjs` – ein kleiner PDF-Schreiber (Vektorformen, keine Fonts – das Blatt
  hat ja keinen Text). Ursprung oben links, y nach unten, wie im SVG.
- `art.mjs` – die Bildsprache: Sticker, Draufsicht, räumlicher Würfel,
  Zug-Symbole, Pfeile, Merkfiguren. Die Würfelbilder lesen dieselben
  Quellformate wie der Content (`cube` und `cube-net`).
- `state.mjs` – Würfelstellungen aus echten Zügen: `src/cube-state.js` dreht
  einen gelösten Würfel, danach werden die 54 Felder abgelesen. Eine Maske
  gräut aus, was für den Schritt egal ist. Damit kann kein Bild eine Stellung
  zeigen, die es nicht gibt.
- `build.mjs` – die neun Seiten.

Das PDF liegt fertig im Repo (es ist ein Ausdruck, kein Build-Artefakt) und wird
vom Vite-Build wie jede andere Datei aus `public/` nach `dist/` kopiert. Wer die
Schritte im Content ändert, baut es neu.

### Fortschritt

`storage.js` legt den Zustand unter `cubechill:progress` in `localStorage` ab
(`{ beginner: { 1: true, … } }`). Pro Lektion ein Abhaken-Button; die Übersicht
zeigt „X / 9 Lektionen"; im Footer der Übersicht setzt ein Link den Fortschritt
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
- gezeichnete Ziel-Bild-Illustrationen – aktuell trägt jede Lektion ein
  generiertes Würfeldiagramm als Ziel-Bild; der gestrichelte Platzhalter
  greift nur noch, wenn eine Lektion keins mitbringt
