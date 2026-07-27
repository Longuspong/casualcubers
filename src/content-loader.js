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
// Würfeldiagramme: ```cube- und ```cube-net-Blöcke -> Inline-SVG
// ---------------------------------------------------------------------------
//
// ```cube ist die Draufsicht auf die Oberseite – der Blick, den man bei den
// Last-Layer-Schritten wirklich hat:
//
//   . . .        hintere Seitensticker der oberen Ebene (3 Zellen)
//   y . y . y    linker Seitensticker, 3 Felder Oberseite, rechter Seitensticker
//   . y y y .      "        (3 solcher Zeilen, oben = hinten)
//   y . y . y
//   . . .        vordere Seitensticker (3 Zellen)
//   :Beschriftung unter dem Diagramm (optional)
//
// ```cube-net ist der aufgeklappte Würfel – der Blick für „so sieht der ganze
// Würfel gerade aus". Oben die U-Seite, in der Mitte L F R B nebeneinander,
// unten D:
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
// Beide Formate gibt es auch für den 2x2 (eine Reihe weniger). Mehrere
// Diagramme in einem Block werden durch Leerzeilen getrennt und stehen dann
// nebeneinander. Zeichen: y gelb, r rot, g grün, b blau, o orange, w weiß,
// . beliebige Farbe (grau – „egal, was hier steht").

const CUBE_STICKER_CLASS = {
  y: 'cd-y', r: 'cd-r', g: 'cd-g', b: 'cd-b', o: 'cd-o', w: 'cd-w', '.': 'cd-n',
};

const NET_FACES = ['U', 'L', 'F', 'R', 'B', 'D'];

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

    const svg = kind === 'cube-net' ? buildNetSvg(body, label, options) : buildTopSvg(body, label);
    if (!svg) continue; // kaputtes Diagramm still überspringen

    const item = document.createElement('div');
    item.className = kind === 'cube-net' ? 'cube-item cube-item--net' : 'cube-item';
    item.appendChild(svg);
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

// Sticker-Rechteck. Wird von beiden Diagrammarten benutzt.
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

// --- Draufsicht ------------------------------------------------------------

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

function buildCubeSvg(grid, label) {
  const n = grid.length - 2; // 3 (3x3) oder 2 (2x2)
  const CELL = 26; // Sticker der Oberseite
  const GAP = 3;
  const BAR = 9; // Dicke der Seitensticker-Balken
  const PAD = 4; // Abstand Balken <-> Oberseite
  const face = n * CELL + (n - 1) * GAP;
  const size = face + 2 * (BAR + PAD);
  const off = BAR + PAD;
  const pos = (i) => off + i * (CELL + GAP);

  const svg = createSvg(size, size, label ? `Würfel von oben: ${label}` : 'Würfel von oben');
  const sticker = (x, y, w, h, ch) => appendSticker(svg, x, y, w, h, ch);

  for (let i = 0; i < n; i++) {
    sticker(pos(i), 0, CELL, BAR, grid[0][i]); // hinten
    sticker(pos(i), off + face + PAD, CELL, BAR, grid[n + 1][i]); // vorn
    const line = grid[i + 1];
    sticker(0, pos(i), BAR, CELL, line[0]); // links
    for (let c = 0; c < n; c++) sticker(pos(c), pos(i), CELL, CELL, line[c + 1]);
    sticker(off + face + PAD, pos(i), BAR, CELL, line[n + 1]); // rechts
  }
  return svg;
}

// --- Aufgeklappter Würfel (Netz) -------------------------------------------

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

function buildNetSvg(lines, label, options) {
  const net = parseNet(lines);
  if (!net) return null;
  const { n, faces } = net;

  const CELL = 20;
  const GAP = 2;
  const FACE_GAP = 7;
  const face = n * CELL + (n - 1) * GAP;
  const step = face + FACE_GAP;
  const width = 4 * face + 3 * FACE_GAP;
  const height = 3 * face + 2 * FACE_GAP;

  // Kreuz-Layout: U oben über F, darunter D; L F R B als Gürtel.
  const origin = {
    U: [step, 0], L: [0, step], F: [step, step], R: [2 * step, step],
    B: [3 * step, step], D: [step, 2 * step],
  };

  const svg = createSvg(
    width, height,
    label ? `Aufgeklappter Würfel: ${label}` : 'Aufgeklappter Würfel'
  );

  for (const name of NET_FACES) {
    const [ox, oy] = origin[name];
    const rows = faces[name];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        appendSticker(
          svg,
          ox + c * (CELL + GAP), oy + r * (CELL + GAP),
          CELL, CELL, rows[r][c]
        );
      }
    }
    if (options.has('letters')) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', ox + face / 2);
      text.setAttribute('y', oy + face / 2);
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
