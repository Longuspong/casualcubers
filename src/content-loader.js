import { marked } from 'marked';

// Lädt eine Content-Datei zur Runtime, splittet sie an den H2-Überschriften
// in Lektions-Objekte und bereitet den Inhalt als HTML auf. Die Notation
// (R U R' U' …) und der wiederkehrende Name ROAR werden dabei ausgezeichnet.
// Ein pathId entspricht 1:1 einer Datei content/<pathId>.md.

const cache = new Map();

export async function loadLessons(pathId) {
  if (cache.has(pathId)) return cache.get(pathId);
  // BASE_URL macht den Pfad portabel (Dev-Server wie GitHub-Pages-Unterpfad).
  const url = `${import.meta.env.BASE_URL}content/${pathId}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${pathId}.md konnte nicht geladen werden (HTTP ${res.status})`);
  const raw = await res.text();
  const lessons = parseLessons(raw);
  cache.set(pathId, lessons);
  return lessons;
}

// ---------------------------------------------------------------------------
// Splitten & Feld-Extraktion
// ---------------------------------------------------------------------------

function parseLessons(raw) {
  // An jeder H2 auftrennen; das erste Stück ist die Doku-Einleitung vor
  // "## Lektion 1". Sektionen ohne "Lektion N:" (z.B. "Was jetzt?") fallen
  // durch die Regex-Prüfung unten heraus.
  const sections = raw.split(/^## /m).slice(1);
  const lessons = [];

  for (const section of sections) {
    const nl = section.indexOf('\n');
    const heading = (nl === -1 ? section : section.slice(0, nl)).trim();
    const headMatch = heading.match(/^Lektion\s+(\d+):\s*(.+)$/);
    if (!headMatch) continue;

    const number = parseInt(headMatch[1], 10);
    const title = headMatch[2].trim();
    let body = nl === -1 ? '' : section.slice(nl + 1);

    // Ziel-Bild-Zeile herausziehen (wird separat über dem Text gerendert).
    // Folgt direkt darunter ein ```cube- oder ```cube-net-Block, wird daraus
    // das echte Bild; ohne Block bleibt der gestrichelte Platzhalter.
    let goalImageDesc = '';
    let goalImageCaption = '';
    let goalImageHtml = '';
    body = body.replace(GOAL_IMAGE_RE, (_full, rest, kind, block) => {
      const parsed = parseGoalImage(rest.trim());
      goalImageDesc = parsed.desc;
      goalImageCaption = parsed.caption;
      if (kind) goalImageHtml = buildCubeFigureHtml(kind, block, goalImageDesc);
      return '';
    });

    // "Abhaken, wenn:"-Zeile herausziehen (eigener Callout am Lektionsende).
    let abhakenWenn = '';
    body = body.replace(/^\*\*Abhaken, wenn:\*\*\s*(.+)$/m, (_full, rest) => {
      abhakenWenn = rest.trim();
      return '';
    });

    // Reine Trennlinien (---) zwischen den Lektionen entfernen.
    body = body.replace(/^---\s*$/gm, '').trim();

    lessons.push({
      number,
      title,
      goalImageDesc,
      goalImageCaption,
      goalImageHtml,
      content: renderLessonHtml(body),
      abhakenWenn,
    });
  }

  lessons.sort((a, b) => a.number - b.number);
  return lessons;
}

// Die Ziel-Bild-Zeile plus optional direkt darunter (nur Leerzeilen dazwischen)
// ein Diagramm-Block. `\n+` statt `\s*` sorgt dafür, dass ein Block hinter
// einem normalen Absatz nicht mehr eingesammelt wird.
const GOAL_IMAGE_RE =
  /^\*\*Ziel-Bild:\*\*[ \t]*(.+)(?:\n+```(cube-net|cube)[ \t]*\n([\s\S]*?)\n```)?/m;

// "Beschreibung. Bildunterschrift: „Text"" -> { desc, caption }
function parseGoalImage(text) {
  const marker = 'Bildunterschrift:';
  const idx = text.indexOf(marker);
  if (idx === -1) return { desc: text, caption: '' };
  const desc = text.slice(0, idx).trim().replace(/\.\s*$/, '');
  const caption = text
    .slice(idx + marker.length)
    .trim()
    .replace(/^[„"'«»]+/, '')
    .replace(/["'«».]+$/, '')
    .trim();
  return { desc, caption };
}

// ---------------------------------------------------------------------------
// Markdown -> HTML + Notations-Auszeichnung (Post-Processing)
// ---------------------------------------------------------------------------

function renderLessonHtml(md) {
  const html = marked.parse(md);
  return annotateNotation(html);
}

// Ein Zug ist ein Face-Buchstabe (R L U D F B) oder die mittlere Scheibe M
// (Roux), mit optionalem ' oder 2. Kleingeschriebene Wide-Moves wie r bleiben
// bewusst draußen: Sie tauchen nie in Mehr-Zug-Sequenzen auf, würden aber im
// deutschen Fließtext Fehltreffer erzeugen.
// Lookbehind/Lookahead verhindern, dass Buchstaben mitten im Wort als Zug
// zählen (sonst würde z.B. "ROAR" in "F ROAR F'" als R-…-R-Sequenz anreißen).
const MOVE = /(?<![A-Za-zÄÖÜäöü])[RLUDFBM](?:['’2])?(?![A-Za-zÄÖÜäöü])/;
const MOVE_G = /(?<![A-Za-zÄÖÜäöü])[RLUDFBM](?:['’2])?(?![A-Za-zÄÖÜäöü])/g;
// Eine Notations-Sequenz: mindestens zwei durch Leerraum getrennte Züge.
const SEQUENCE_G = new RegExp(`${MOVE.source}(?:\\s+${MOVE.source})+`, 'g');
// Eine "reine" Notations-Zeile besteht ausschließlich aus Zügen/Trennern.
const PURE_LINE = /^[RLUDFBM2'’\s–—-]+$/;

// Läuft nach dem Markdown-Parsing über das erzeugte DOM:
//  0. ```cube-Codeblöcke werden zu Inline-SVG-Würfeldiagrammen (Draufsicht).
//  1. Absätze, die NUR aus Notation bestehen, werden zum großen Algorithmus-Kasten.
//  2. Inline-Notationssequenzen in normalem Text werden in <code class="alg"> gewickelt.
//  3. Jedes Vorkommen von ROAR wird zum <span class="roar-badge">.
function annotateNotation(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;

  // 0) Würfeldiagramme
  root.querySelectorAll('pre > code.language-cube, pre > code.language-cube-net').forEach((code) => {
    const kind = code.classList.contains('language-cube-net') ? 'cube-net' : 'cube';
    const figure = buildCubeFigure(kind, code.textContent);
    if (figure) code.parentElement.replaceWith(figure);
  });

  // 1) Reine-Notation-Absätze -> Algorithmus-Kasten
  root.querySelectorAll('p').forEach((p) => {
    if (isPureNotation(p.textContent.trim())) {
      p.replaceWith(buildAlgBox(p.textContent.trim()));
    }
  });

  // 2) + 3) Textknoten inline auszeichnen (nicht innerhalb von code/pre/alg-box).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement && node.parentElement.closest('code, pre, .alg-box')) continue;
    textNodes.push(node);
  }
  for (const node of textNodes) {
    const original = node.nodeValue;
    const replaced = annotateText(original);
    if (replaced !== escapeHtml(original)) {
      const holder = document.createElement('span');
      holder.innerHTML = replaced;
      node.replaceWith(...holder.childNodes);
    }
  }

  const out = document.createElement('div');
  out.appendChild(root);
  return out.innerHTML;
}

// ---------------------------------------------------------------------------
// Würfeldiagramme: ```cube- und ```cube-net-Blöcke -> Inline-SVG (3D)
// ---------------------------------------------------------------------------
//
// Die Quellformate bleiben flach und zeilenbasiert – gerendert wird daraus
// aber ein räumlicher Würfel, weil die Vorlage ja ein echter Würfel ist.
//
// ```cube ist der Blick von schräg oben auf die Oberseite – der Blick, den man
// bei den Last-Layer-Schritten wirklich hat:
//
//   . . .        hintere Seitensticker der oberen Ebene (3 Zellen)
//   y . y . y    linker Seitensticker, 3 Felder Oberseite, rechter Seitensticker
//   . y y y .      "        (3 solcher Zeilen, oben = hinten)
//   y . y . y
//   . . .        vordere Seitensticker (3 Zellen)
//   :Beschriftung unter dem Diagramm (optional)
//
// Gerendert als Zentralprojektion von oben: die Oberseite liegt als Quadrat in
// der Mitte, die vier Seitenbänder kippen als Trapeze nach außen weg. Dadurch
// bleiben – anders als bei einer Eckansicht – alle vier Seitenreihen sichtbar.
//
// ```cube-net beschreibt den ganzen Würfel – der Blick für „so sieht der Würfel
// gerade aus". Oben die U-Seite, in der Mitte L F R B nebeneinander, unten D:
//
//       yyy
//       yyy
//       yyy
//   ooo ggg rrr bbb
//   ooo ggg rrr bbb
//   ooo ggg rrr bbb
//       www
//       www
//       www
//   !letters     blendet die Seitenbuchstaben U/L/F/R/B/D ein (optional)
//   :Beschriftung unter dem Diagramm (optional)
//
// Gerendert als isometrischer Würfel. Ein Körper zeigt nur drei Seiten, deshalb
// kommt bei Bedarf eine zweite Ansicht von der Gegenecke dazu (D B L). Sind die
// drei Rückseiten ohnehin komplett grau, bleibt es bei einer Ansicht.
//
// Beide Formate gibt es auch für den 2x2 (eine Reihe weniger). Mehrere
// Diagramme in einem Block werden durch Leerzeilen getrennt und stehen dann
// nebeneinander. Zeichen: y gelb, r rot, g grün, b blau, o orange, w weiß,
// . beliebige Farbe (grau – „egal, was hier steht").

const CUBE_STICKER_CLASS = {
  y: 'cd-y', r: 'cd-r', g: 'cd-g', b: 'cd-b', o: 'cd-o', w: 'cd-w', '.': 'cd-n',
};

function buildCubeFigure(kind, text, ariaLabel = '') {
  const row = document.createElement('div');
  row.className = 'cube-row';

  for (const chunk of text.trim().split(/\n\s*\n/)) {
    const lines = chunk.trim().split('\n').map((l) => l.trim()).filter(Boolean);

    // Optionen (!…) und Beschriftung (:…) von den Farbzeilen trennen.
    let label = '';
    const options = new Set();
    const body = [];
    for (const line of lines) {
      if (line.startsWith(':')) label = line.slice(1).trim();
      else if (line.startsWith('!')) options.add(line.slice(1).trim());
      else body.push(line);
    }

    const visual = kind === 'cube-net' ? buildNetView(body, label, options) : buildTopSvg(body, label);
    if (!visual) continue; // kaputtes Diagramm still überspringen

    const item = document.createElement('div');
    item.className = kind === 'cube-net' ? 'cube-item cube-item--net' : 'cube-item';
    item.appendChild(visual);
    if (label) {
      const span = document.createElement('span');
      span.className = 'cube-label';
      span.textContent = label;
      item.appendChild(span);
    }
    row.appendChild(item);
  }

  if (!row.children.length) return null;
  // Ab drei Diagrammen nebeneinander wird es sonst eine sehr lange Kolonne –
  // dann kleiner rendern, damit auf dem Handy zwei pro Zeile passen.
  if (row.children.length >= 3) row.classList.add('cube-row--many');

  const figure = document.createElement('figure');
  figure.className = 'cube-figure';
  figure.appendChild(row);
  if (ariaLabel) {
    // Beim Ziel-Bild beschreibt die Prosa aus dem Content das Bild besser als
    // jede generierte Zusammenfassung – die einzelnen SVGs sind dann stumm.
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', ariaLabel);
    figure.querySelectorAll('svg').forEach((s) => {
      s.removeAttribute('role');
      s.removeAttribute('aria-label');
      s.setAttribute('aria-hidden', 'true');
    });
  }
  return figure;
}

function buildCubeFigureHtml(kind, text, ariaLabel) {
  const figure = buildCubeFigure(kind, text, ariaLabel);
  return figure ? figure.outerHTML : '';
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Sticker-Rechteck (Oberseite der Draufsicht – die schaut man frontal an).
function appendSticker(svg, x, y, w, h, ch) {
  const r = document.createElementNS(SVG_NS, 'rect');
  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', w);
  r.setAttribute('height', h);
  r.setAttribute('rx', 2.5);
  r.setAttribute('class', `cd ${CUBE_STICKER_CLASS[ch] || 'cd-n'}`);
  svg.appendChild(r);
}

// Alle schräg stehenden Sticker sind Vierecke – Rechtecke gibt es dort nicht
// mehr, sobald projiziert wird.
function appendPoly(svg, points, className) {
  const p = document.createElementNS(SVG_NS, 'polygon');
  p.setAttribute('points', points.map(([x, y]) => `${round(x)},${round(y)}`).join(' '));
  p.setAttribute('class', className);
  svg.appendChild(p);
}

function appendPolySticker(svg, points, ch) {
  appendPoly(svg, points, `cd ${CUBE_STICKER_CLASS[ch] || 'cd-n'}`);
}

// Punkte auf den eigenen Schwerpunkt zusammenziehen: erzeugt die Fuge zwischen
// den Stickern, ohne dass man in der Projektion mit Randbreiten rechnen muss.
function shrink(points, k) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

function round(v) {
  return Math.round(v * 100) / 100;
}

// SVG mit fester Größe: width/height als Attribut, damit auch Browser ohne
// „intrinsisches Seitenverhältnis aus der viewBox" (ältere iOS-Safaris) die
// Grafik nicht auf Höhe 0 zusammenfallen lassen. Die CSS-Breite skaliert sie.
function createSvg(w, h, label) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  return svg;
}

// --- Blick von schräg oben --------------------------------------------------

function buildTopSvg(lines, label) {
  const grid = lines.map((l) => l.replace(/\s+/g, ''));
  const n = grid.length - 2; // Kantenlänge der Oberseite (3x3 oder 2x2)
  const valid =
    (n === 2 || n === 3) &&
    grid[0].length === n && grid[n + 1].length === n &&
    grid.slice(1, n + 1).every((l) => l.length === n + 2);
  if (!valid) return null;
  return buildCubeSvg(grid, label);
}

// Zentralprojektion mit der Kamera senkrecht über der Würfelmitte: die
// Oberseite bleibt ein unverzerrtes Quadrat, die vier Seitenflächen der oberen
// Ebene klappen als Trapeze nach außen. Alle Kanten liegen dadurch auf Strahlen
// durch die Bildmitte – genau das macht den räumlichen Eindruck.
function buildCubeSvg(grid, label) {
  const n = grid.length - 2; // 3 (3x3) oder 2 (2x2)
  const CELL = 26; // Sticker der Oberseite
  const GAP = 3;
  const PAD = 3.5; // Fuge zwischen Oberseite und Seitenband
  const SPREAD = 1.5; // wie weit die Seiten nach außen kippen (1 = flach)
  const face = n * CELL + (n - 1) * GAP;
  const a = face / 2; // halbe Oberseite
  const inner = a + PAD; // obere Kante der Seitenbänder
  const outer = a * SPREAD; // untere Kante der Seitenbänder
  const size = round(2 * outer);
  const mid = size / 2;
  const pos = (i) => mid - a + i * (CELL + GAP);

  const svg = createSvg(
    size, size,
    label ? `Würfel von schräg oben: ${label}` : 'Würfel von schräg oben'
  );

  // Würfelkörper: dunkles Quadrat unter allem, aus dem die Fugen zwischen den
  // Stickern entstehen. Die Seitenbänder decken es bis zum Rand ab.
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', 0);
  body.setAttribute('y', 0);
  body.setAttribute('width', size);
  body.setAttribute('height', size);
  body.setAttribute('rx', 4);
  body.setAttribute('class', 'cd-body');
  svg.appendChild(body);

  // Ein Seitensticker: u1/u2 sind die Kanten entlang der Bandrichtung, gemessen
  // in der Ebene der Oberseite. Nach außen werden sie mit dem Strahlensatz
  // aufgeweitet, side dreht das Band auf die jeweilige Würfelseite.
  const bandPoly = (side, i) => {
    const u1 = -a + i * (CELL + GAP);
    const u2 = u1 + CELL;
    const si = inner / a;
    const so = outer / a;
    return [
      [u1 * si, inner], [u2 * si, inner], [u2 * so, outer], [u1 * so, outer],
    ].map(([u, v]) => {
      if (side === 'front') return [mid + u, mid + v];
      if (side === 'back') return [mid + u, mid - v];
      if (side === 'right') return [mid + v, mid + u];
      return [mid - v, mid + u]; // left
    });
  };

  // Reihenfolge: erst alle Seitenbänder, dann die Oberseite obendrauf.
  const bands = [
    ['back', 'cd-shade-deep', (i) => grid[0][i]],
    ['front', 'cd-shade-soft', (i) => grid[n + 1][i]],
    ['left', 'cd-shade-mid', (i) => grid[i + 1][0]],
    ['right', 'cd-shade-mid', (i) => grid[i + 1][n + 1]],
  ];
  for (const [side, shade, charAt] of bands) {
    for (let i = 0; i < n; i++) {
      const poly = bandPoly(side, i);
      appendPolySticker(svg, poly, charAt(i));
      appendPoly(svg, poly, `cd-shade ${shade}`); // Tiefe: Seiten liegen im Schatten
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      appendSticker(svg, pos(c), pos(r), CELL, CELL, grid[r + 1][c + 1]);
    }
  }
  return svg;
}

// --- Ganzer Würfel, isometrisch (Quelltext: Netz) ---------------------------

// Zeilen -> { n, faces } oder null. Erwartet 3n Zeilen: n Zeilen mit einem
// Block (U), n Zeilen mit vier Blöcken (L F R B), n Zeilen mit einem (D).
function parseNet(lines) {
  const rows = lines.map((l) => l.trim().split(/\s+/).filter(Boolean));
  const n = rows.length / 3;
  if (n !== 2 && n !== 3) return null;

  for (let i = 0; i < rows.length; i++) {
    const expected = i >= n && i < 2 * n ? 4 : 1;
    if (rows[i].length !== expected) return null;
    if (rows[i].some((token) => token.length !== n)) return null;
  }

  const faces = { U: [], L: [], F: [], R: [], B: [], D: [] };
  for (let i = 0; i < n; i++) {
    faces.U.push(rows[i][0]);
    const [l, f, r, b] = rows[n + i];
    faces.L.push(l);
    faces.F.push(f);
    faces.R.push(r);
    faces.B.push(b);
    faces.D.push(rows[2 * n + i][0]);
  }
  return { n, faces };
}

// Räumliche Lage eines Stickers als Viereck. Der Würfel füllt [0,S]³ mit
//   x: links -> rechts (x=0 ist L, x=S ist R)
//   y: unten -> oben   (y=0 ist D, y=S ist U)
//   z: hinten -> vorn  (z=0 ist B, z=S ist F)
// r/c sind Zeile/Spalte so, wie sie im Netz-Quelltext stehen. Die Umrechnung
// folgt aus dem Kreuz-Layout: U liegt über F, also ist U-Zeile 0 hinten und
// D-Zeile 0 vorn; der Gürtel läuft von links nach rechts durch L F R B, also
// zeigt Spalte 0 bei L nach hinten, bei R nach vorn und bei B nach rechts.
// Nachgerechnet wird das nicht hier, sondern an den geteilten Kanten: zwei im
// Netz benachbarte Sticker müssen genau zwei Eckpunkte gemeinsam haben.
function faceQuad(name, r, c, S) {
  const top = S - r; // obere Kante der Zeile (nur Seitenflächen)
  const bot = S - r - 1;
  switch (name) {
    case 'U': return [[c, S, r], [c + 1, S, r], [c + 1, S, r + 1], [c, S, r + 1]];
    case 'D': return [[c, 0, S - r], [c + 1, 0, S - r], [c + 1, 0, S - r - 1], [c, 0, S - r - 1]];
    case 'F': return [[c, top, S], [c + 1, top, S], [c + 1, bot, S], [c, bot, S]];
    case 'B': return [[S - c, top, 0], [S - c - 1, top, 0], [S - c - 1, bot, 0], [S - c, bot, 0]];
    case 'R': return [[S, top, S - c], [S, top, S - c - 1], [S, bot, S - c - 1], [S, bot, S - c]];
    default: return [[0, top, c], [0, top, c + 1], [0, bot, c + 1], [0, bot, c]]; // L
  }
}

// Umriss der ganzen Seite – für Würfelkörper, Schattierung und Buchstaben.
function faceOutline(name, S) {
  switch (name) {
    case 'U': return [[0, S, 0], [S, S, 0], [S, S, S], [0, S, S]];
    case 'D': return [[0, 0, 0], [S, 0, 0], [S, 0, S], [0, 0, S]];
    case 'F': return [[0, S, S], [S, S, S], [S, 0, S], [0, 0, S]];
    case 'B': return [[0, S, 0], [S, S, 0], [S, 0, 0], [0, 0, 0]];
    case 'R': return [[S, S, 0], [S, S, S], [S, 0, S], [S, 0, 0]];
    default: return [[0, S, 0], [0, S, S], [0, 0, S], [0, 0, 0]]; // L
  }
}

const ISO_COS = Math.cos(Math.PI / 6); // waagerechte Komponente der Achsen

// Isometrie: die drei Würfelachsen zeigen auf dem Bildschirm in Richtungen, die
// je 120° auseinanderliegen. `back` schaut von der Gegenecke – das ist exakt
// dieselbe Projektion auf den gespiegelten Koordinaten (x,y,z -> S-x,S-y,S-z).
function isoProjector(S, cell, back) {
  const width = 2 * S * cell * ISO_COS;
  const height = 2 * S * cell;
  const cx = width / 2;
  const cy = height / 2;
  const project = back
    ? (x, y, z) => [cx + (z - x) * cell * ISO_COS, cy + (y - (x + z) / 2) * cell]
    : (x, y, z) => [cx + (x - z) * cell * ISO_COS, cy + ((x + z) / 2 - y) * cell];
  return { width, height, project };
}

// Sichtbar sind immer genau drei Seiten. Vorderansicht: oben U, vorn F,
// rechts R. Gegenansicht: oben D, vorn B, rechts L – das ist dieselbe
// Konstellation, nur am Würfelmittelpunkt gespiegelt.
//
// text ist die Leserichtung auf der Fläche: [rechts, unten] als Raumvektoren.
// Damit legt sich ein Seitenbuchstabe in die Fläche, statt davorzuschweben.
// Die Deckfläche bekommt bewusst keine – dort steht der Buchstabe in beiden
// möglichen Kantenrichtungen so schräg, dass er kaum noch zu lesen ist; er
// bleibt deshalb aufrecht.
const ISO_VIEWS = {
  front: {
    faces: ['U', 'F', 'R'],
    shades: ['', 'cd-shade-soft', 'cd-shade-mid'],
    text: {
      F: [[1, 0, 0], [0, -1, 0]],
      R: [[0, 0, -1], [0, -1, 0]],
    },
  },
  back: {
    faces: ['D', 'B', 'L'],
    shades: ['', 'cd-shade-soft', 'cd-shade-mid'],
    text: {
      B: [[-1, 0, 0], [0, 1, 0]],
      L: [[0, 0, 1], [0, 1, 0]],
    },
  },
};

function buildIsoSvg(faces, n, view, label, showLetters) {
  const CELL = 21;
  const { width, height, project } = isoProjector(n, CELL, view === 'back');
  const { faces: visible, shades, text: textAxes } = ISO_VIEWS[view];
  const seen = visible.join(' ');
  const suffix = label ? `: ${label}` : '';
  const svg = createSvg(
    round(width), round(height),
    view === 'back'
      ? `Würfel von hinten unten, Seiten ${seen}${suffix}`
      : `Würfel von vorn oben, Seiten ${seen}${suffix}`
  );
  const to2d = (pts) => pts.map(([x, y, z]) => project(x, y, z));

  // 1) Körper: die vollen Seitenflächen dunkel – daraus werden die Fugen.
  for (const name of visible) {
    appendPoly(svg, to2d(faceOutline(name, n)), 'cd-body');
  }
  // 2) Sticker, leicht eingezogen.
  for (const name of visible) {
    const rows = faces[name];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        appendPolySticker(svg, shrink(to2d(faceQuad(name, r, c, n)), 0.88), rows[r][c]);
      }
    }
  }
  // 3) Schattierung pro Seite: erst dadurch liest man die drei Flächen als
  //    Raumrichtungen und nicht als flaches Muster.
  visible.forEach((name, i) => {
    if (!shades[i]) return;
    appendPoly(svg, to2d(faceOutline(name, n)), `cd-shade ${shades[i]}`);
  });
  // 4) Seitenbuchstaben, in die jeweilige Fläche gelegt.
  if (showLetters) {
    // Linearteil der Projektion: wohin zeigt ein Einheitsvektor auf dem Schirm?
    const o = project(0, 0, 0);
    const screenDir = ([dx, dy, dz]) => {
      const p = project(dx, dy, dz);
      return [(p[0] - o[0]) / CELL, (p[1] - o[1]) / CELL];
    };
    for (const name of visible) {
      const pts = to2d(faceOutline(name, n));
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const axes = textAxes[name];
      const text = document.createElementNS(SVG_NS, 'text');
      if (axes) {
        const [right, down] = axes.map(screenDir);
        text.setAttribute(
          'transform',
          `matrix(${round(right[0])} ${round(right[1])} ${round(down[0])} ${round(down[1])} ` +
            `${round(cx)} ${round(cy)})`
        );
      } else {
        text.setAttribute('x', round(cx));
        text.setAttribute('y', round(cy));
      }
      text.setAttribute('class', 'cd-letter');
      text.setAttribute('text-anchor', 'middle');
      // Vertikal per dy statt dominant-baseline zentriert: dominant-baseline
      // wird auf <text> nicht überall gleich umgesetzt, dy überall.
      text.setAttribute('dy', '0.35em');
      text.textContent = name;
      svg.appendChild(text);
    }
  }
  return svg;
}

function buildNetView(lines, label, options) {
  const net = parseNet(lines);
  if (!net) return null;
  const { n, faces } = net;

  // Ein Würfel zeigt nur drei Seiten. Die Gegenansicht kommt dazu, sobald auf
  // D, B oder L etwas Konkretes steht – bei rein grauen Rückseiten wäre sie
  // nur ein zweiter grauer Klotz. Bei !letters gehören ohnehin alle sechs dazu.
  const backMatters =
    options.has('letters') ||
    ISO_VIEWS.back.faces.some((name) => faces[name].some((row) => /[^.]/.test(row)));

  const wrap = document.createElement('div');
  wrap.className = 'cube-views';

  const views = backMatters ? ['front', 'back'] : ['front'];
  for (const view of views) {
    const cell = document.createElement('div');
    cell.className = 'cube-view';
    cell.appendChild(buildIsoSvg(faces, n, view, label, options.has('letters')));
    if (views.length > 1) {
      const caption = document.createElement('span');
      caption.className = 'cube-view-label';
      caption.textContent = view === 'back' ? 'von hinten' : 'von vorn';
      cell.appendChild(caption);
    }
    wrap.appendChild(cell);
  }
  return wrap;
}

function isPureNotation(text) {
  if (!text || !PURE_LINE.test(text)) return false;
  const moves = text.match(MOVE_G) || [];
  return moves.length >= 2;
}

function buildAlgBox(text) {
  const box = document.createElement('div');
  box.className = 'alg-box';

  const play = document.createElement('span');
  play.className = 'alg-play';
  play.setAttribute('aria-hidden', 'true');
  play.textContent = '▶';

  const code = document.createElement('code');
  code.className = 'alg';
  code.textContent = normalizeMoves(text);

  box.append(play, code);
  return box;
}

// Text mit Inline-Notation und ROAR anreichern. Gibt HTML zurück.
function annotateText(text) {
  let s = escapeHtml(text);
  s = s.replace(SEQUENCE_G, (seq) => `<code class="alg">${normalizeMoves(seq)}</code>`);
  s = s.replace(/\bROAR\b/g, '<span class="roar-badge">ROAR</span>');
  return s;
}

// Züge normalisieren: krumme Apostrophe angleichen, sauber mit Leerzeichen setzen.
function normalizeMoves(text) {
  const moves = text.match(MOVE_G) || [];
  return moves.map((m) => m.replace('’', "'")).join(' ');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
