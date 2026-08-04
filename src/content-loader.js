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
// Gerendert wird das als ganzer Würfel, schräg von oben auf eine Ecke gesehen –
// so, wie er in der Hand liegt. Die unteren Ebenen bleiben neutral grau: sie
// sind für den Schritt egal, geben der Ebene aber einen Körper zum Draufstehen.
// Aus dieser Ecke sind zwei der vier Seitenbänder abgewandt; stehen dort
// Farben, kommt der Blick von der Gegenecke daneben.
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
// Dieselbe Eckansicht, nur etwas flacher – der Winkel, in dem man den Würfel
// vor sich hält. Auch hier zeigt ein Körper nur drei Seiten, deshalb kommt bei
// Bedarf der Blick von unten hinten (D B L) dazu. Sind die abgewandten Seiten
// ohnehin komplett grau, bleibt es bei einer Ansicht.
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

    const visual = kind === 'cube-net' ? buildNetView(body, label, options) : buildTopView(body, label, options);
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

// Projiziert ist kein Sticker mehr ein Rechteck – gezeichnet wird durchweg das
// Viereck, das die Kamera liefert.
function appendShape(target, points, className, radius = 0) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', shapePath(points, radius));
  p.setAttribute('class', className);
  target.appendChild(p);
  return p;
}

function appendSticker(target, points, ch, radius) {
  appendShape(target, points, `cd ${CUBE_STICKER_CLASS[ch] || 'cd-n'}`, radius);
}

// Ecken überschleifen: echte Würfel sind gespritztes Plastik, keine
// ausgeschnittenen Papierquadrate. Jede Ecke wird ein Stück vor dem Eckpunkt
// verlassen und ein Stück dahinter wieder aufgenommen, dazwischen zieht eine
// quadratische Kurve durch. radius = 0 liefert wieder das reine Polygon.
function shapePath(points, radius) {
  const fmt = ([x, y]) => `${round(x)} ${round(y)}`;
  if (!radius) return `M${points.map(fmt).join('L')}Z`;

  const towards = (from, to) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(radius, len / 2) / len;
    return [from[0] + dx * t, from[1] + dy * t];
  };

  let d = '';
  points.forEach((corner, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    d += `${i === 0 ? 'M' : 'L'}${fmt(towards(corner, prev))}`;
    d += `Q${fmt(corner)} ${fmt(towards(corner, next))}`;
  });
  return `${d}Z`;
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

// --- Blick von schräg oben (```cube```) -------------------------------------

// Die Draufsicht beschreibt nur die oberste Ebene. Für die Kamera ist das
// trotzdem ein ganzer Würfel – die Ebene bekommt so einen Körper, auf dem sie
// sitzt, statt frei im Raum zu schweben. Alles Unbeschriebene ist neutral.
//
// Die Bänder liegen im Quelltext so, wie man von oben draufschaut. Auf den
// Seitenflächen zählt dagegen die Leserichtung der jeweiligen Fläche (siehe
// faceQuad): bei B und R läuft sie andersherum, deshalb werden die beiden
// Bänder umgedreht.
function topFaces(grid, n) {
  const dots = '.'.repeat(n);
  const reverse = (s) => s.split('').reverse().join('');
  const column = (i) => grid.slice(1, n + 1).map((row) => row[i]).join('');
  const layer = (top) => [top, ...Array(n - 1).fill(dots)];

  return {
    U: grid.slice(1, n + 1).map((row) => row.slice(1, n + 1)),
    F: layer(grid[n + 1]),
    B: layer(reverse(grid[0])),
    L: layer(column(0)),
    R: layer(reverse(column(n + 1))),
    D: Array(n).fill(dots),
  };
}

function buildTopView(lines, label, options) {
  const grid = lines.map((l) => l.replace(/\s+/g, ''));
  const n = grid.length - 2; // Kantenlänge der Oberseite (3x3 oder 2x2)
  const valid =
    (n === 2 || n === 3) &&
    grid[0].length === n && grid[n + 1].length === n &&
    grid.slice(1, n + 1).every((l) => l.length === n + 2);
  if (!valid) return null;

  const faces = topFaces(grid, n);
  // Die abgewandten Bänder (hinten, links) sind aus dieser Ecke nicht zu
  // sehen. Stehen dort Farben, kommt der Blick von der Gegenecke dazu.
  const views = /[^.]/.test(faces.B[0] + faces.L[0]) ? ['topFront', 'topBack'] : ['topFront'];
  return buildViews(faces, n, views, label, options.has('letters'));
}

// --- Ganzer Würfel (Quelltext: Netz) ----------------------------------------

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

// --- Kamera -----------------------------------------------------------------

const FACE_NORMAL = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};
const FACE_ORDER = ['U', 'D', 'F', 'B', 'L', 'R'];

// Licht von schräg oben: die Deckfläche bleibt hell, die Seiten stehen
// unterschiedlich tief im Schatten. Erst das macht aus drei aneinandergelegten
// Vierecken einen Körper. Die Unterseite bleibt trotzdem hell genug, dass ein
// weißer Sticker in der Gegenansicht noch weiß aussieht.
const FACE_SHADE = {
  U: '', D: 'cd-shade-soft', F: 'cd-shade-soft', B: 'cd-shade-soft',
  R: 'cd-shade-mid', L: 'cd-shade-mid',
};

const DEG = Math.PI / 180;
const CAM_DISTANCE = 6; // Kameraabstand in Kantenlängen – Perspektive, aber dezent

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// Der Blick auf eine Würfelecke, schräg von oben – so, wie der Würfel in der
// Hand liegt. Zentralprojektion statt Isometrie: erst die leicht
// zusammenlaufenden Kanten machen aus dem Muster einen Gegenstand.
//
// azimuth dreht die Kamera um die Hochachse (0° = frontal auf F, 90° = auf R),
// elevation hebt sie an (positiv = von oben, negativ = von unten).
function makeCamera(S, cell, azimuth, elevation) {
  const st = Math.sin(azimuth * DEG);
  const ct = Math.cos(azimuth * DEG);
  const sp = Math.sin(elevation * DEG);
  const cp = Math.cos(elevation * DEG);

  const eye = [st * cp, sp, ct * cp]; // Richtung vom Würfelmittelpunkt zur Kamera
  const right = [ct, 0, -st]; // zeigt im Bild nach rechts
  const up = [-st * sp, cp, -ct * sp]; // zeigt im Bild nach oben
  const dist = CAM_DISTANCE * S;
  const c = S / 2;
  const camPos = [c + eye[0] * dist, c + eye[1] * dist, c + eye[2] * dist];

  // Zentralprojektion: was näher an der Kamera liegt, wird größer abgebildet.
  const raw = (x, y, z) => {
    const q = [x - c, y - c, z - c];
    const k = dist / (dist - dot3(q, eye));
    return [dot3(q, right) * k * cell, -dot3(q, up) * k * cell];
  };

  // Bildausschnitt aus den acht Würfelecken – die Silhouette passt dann immer
  // genau in die viewBox, egal aus welcher Richtung geschaut wird.
  const corners = [];
  for (const x of [0, S]) for (const y of [0, S]) for (const z of [0, S]) corners.push(raw(x, y, z));
  const pad = cell * 0.12;
  const minX = Math.min(...corners.map((p) => p[0])) - pad;
  const minY = Math.min(...corners.map((p) => p[1])) - pad;
  const maxX = Math.max(...corners.map((p) => p[0])) + pad;
  const maxY = Math.max(...corners.map((p) => p[1])) + pad;

  const project = (x, y, z) => {
    const p = raw(x, y, z);
    return [p[0] - minX, p[1] - minY];
  };

  // Sichtbar ist eine Seite, wenn ihre Normale zur Kamera zeigt.
  const visible = (name) => {
    const nrm = FACE_NORMAL[name];
    const center = [c + nrm[0] * c, c + nrm[1] * c, c + nrm[2] * c];
    const toCam = [camPos[0] - center[0], camPos[1] - center[1], camPos[2] - center[2]];
    return dot3(nrm, toCam) > 0;
  };

  // Linearteil der Projektion: wohin zeigt ein Einheitsvektor im Bild?
  const direction = (v) => {
    const o = raw(c, c, c);
    const p = raw(c + v[0], c + v[1], c + v[2]);
    return [p[0] - o[0], p[1] - o[1]];
  };

  return { width: maxX - minX, height: maxY - minY, project, visible, direction };
}

// Konvexe Hülle (Andrew) der acht projizierten Ecken: das ist die Silhouette
// des Würfels. Sie liegt als ein einziger Körper unter den Stickern – daraus
// entstehen die Fugen, und ihre abgerundeten Ecken sind die Kanten des Würfels.
function convexHull(points) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...chain(sorted), ...chain(sorted.reverse())];
}

// --- Ansichten --------------------------------------------------------------

// Ein Körper zeigt nur drei Seiten. Deshalb gibt es zu jeder Ansicht die
// Gegenecke; welche Seiten dabei sichtbar sind, rechnet die Kamera aus.
//
// Die Draufsicht schaut steiler von oben – dort trägt die Oberseite die
// Information. Die Netz-Ansicht bleibt flacher, das ist der Winkel, in dem man
// den Würfel vor sich hält; ihre Gegenansicht schaut von unten auf die
// Unterseite, statt den Würfel im Bild auf den Kopf zu stellen.
const CUBE_VIEWS = {
  topFront: { azimuth: 42, elevation: 40, caption: 'von vorn' },
  topBack: { azimuth: 222, elevation: 40, caption: 'von hinten' },
  netFront: { azimuth: 42, elevation: 28, caption: 'von vorn' },
  netBack: { azimuth: 222, elevation: -28, caption: 'von hinten' },
};

const CELL = 21; // Kantenlänge eines Stickers in viewBox-Einheiten
const STICKER_INSET = 0.86; // Fuge zwischen den Stickern
const STICKER_RADIUS = CELL * 0.22;
const BODY_RADIUS = CELL * 0.3;

let clipUid = 0;

function buildCubeSvg(faces, n, viewName, label, showLetters) {
  const view = CUBE_VIEWS[viewName];
  const cam = makeCamera(n, CELL, view.azimuth, view.elevation);
  const visible = FACE_ORDER.filter(cam.visible);
  const suffix = label ? `: ${label}` : '';
  const svg = createSvg(
    round(cam.width), round(cam.height),
    `Würfel von schräg ${view.elevation >= 0 ? 'oben' : 'unten'}, ` +
      `Seiten ${visible.join(' ')}${suffix}`
  );
  const to2d = (pts) => pts.map(([x, y, z]) => cam.project(x, y, z));

  // 1) Der Würfelkörper als eine Silhouette – mit abgerundeten Kanten.
  const outline = convexHull(
    [0, n].flatMap((x) => [0, n].flatMap((y) => [0, n].map((z) => cam.project(x, y, z))))
  );
  const body = appendShape(svg, outline, 'cd-body', BODY_RADIUS);

  // 2) Sticker, leicht eingezogen und mit weichen Ecken – wie gespritztes
  //    Plastik, nicht wie ausgeschnittenes Papier.
  for (const name of visible) {
    const rows = faces[name];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const quad = shrink(to2d(faceQuad(name, r, c, n)), STICKER_INSET);
        appendSticker(svg, quad, rows[r][c], STICKER_RADIUS);
      }
    }
  }

  // 3) Schattierung pro Seite. Geklammert auf die Silhouette, damit sie an den
  //    abgerundeten Kanten nicht übersteht.
  const shaded = visible.filter((name) => FACE_SHADE[name]);
  if (shaded.length) {
    const id = `cd-clip-${(clipUid += 1)}`;
    const defs = document.createElementNS(SVG_NS, 'defs');
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.setAttribute('id', id);
    clip.appendChild(body.cloneNode());
    defs.appendChild(clip);
    svg.appendChild(defs);

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('clip-path', `url(#${id})`);
    for (const name of shaded) {
      appendShape(group, to2d(faceOutline(name, n)), `cd-shade ${FACE_SHADE[name]}`);
    }
    svg.appendChild(group);
  }

  // 4) Seitenbuchstaben, in die jeweilige Fläche gelegt.
  if (showLetters) {
    for (const name of visible) appendFaceLetter(svg, cam, name, n);
  }
  return svg;
}

// Der Buchstabe liegt in der Fläche, statt davorzuschweben. Auf einer
// Seitenfläche zeigt sein „unten" immer zum Würfelboden; sein „rechts" ist das
// Kreuzprodukt daraus – so steht er nie auf dem Kopf und nie spiegelverkehrt,
// egal von welcher Ecke die Kamera schaut. Die waagerechten Deckflächen
// bekommen keins: dort stünde er in jeder Kantenrichtung so schräg, dass er
// kaum noch zu lesen wäre, er bleibt deshalb aufrecht.
function appendFaceLetter(svg, cam, name, n) {
  const pts = faceOutline(name, n).map(([x, y, z]) => cam.project(x, y, z));
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;

  const text = document.createElementNS(SVG_NS, 'text');
  const normal = FACE_NORMAL[name];
  if (!normal[1]) {
    const down = [0, -1, 0];
    const right = [normal[2], 0, -normal[0]]; // (0,1,0) x normal
    const [rx, ry] = cam.direction(right).map((v) => v / CELL);
    const [dx, dy] = cam.direction(down).map((v) => v / CELL);
    text.setAttribute(
      'transform',
      `matrix(${round(rx)} ${round(ry)} ${round(dx)} ${round(dy)} ${round(cx)} ${round(cy)})`
    );
  } else {
    text.setAttribute('x', round(cx));
    text.setAttribute('y', round(cy));
  }
  text.setAttribute('class', 'cd-letter');
  text.setAttribute('text-anchor', 'middle');
  // Vertikal per dy statt dominant-baseline zentriert: dominant-baseline wird
  // auf <text> nicht überall gleich umgesetzt, dy überall.
  text.setAttribute('dy', '0.35em');
  text.textContent = name;
  svg.appendChild(text);
}

// Eine oder zwei Ansichten nebeneinander, beschriftet nur wenn es zwei sind.
function buildViews(faces, n, viewNames, label, showLetters) {
  const wrap = document.createElement('div');
  wrap.className = 'cube-views';

  for (const viewName of viewNames) {
    const cell = document.createElement('div');
    cell.className = 'cube-view';
    cell.appendChild(buildCubeSvg(faces, n, viewName, label, showLetters));
    if (viewNames.length > 1) {
      const caption = document.createElement('span');
      caption.className = 'cube-view-label';
      caption.textContent = CUBE_VIEWS[viewName].caption;
      cell.appendChild(caption);
    }
    wrap.appendChild(cell);
  }
  return wrap;
}

function buildNetView(lines, label, options) {
  const net = parseNet(lines);
  if (!net) return null;
  const { n, faces } = net;

  // Die Gegenansicht kommt dazu, sobald auf D, B oder L etwas Konkretes steht –
  // bei rein grauen Rückseiten wäre sie nur ein zweiter grauer Klotz. Bei
  // !letters gehören ohnehin alle sechs Seiten dazu.
  const backMatters =
    options.has('letters') ||
    ['D', 'B', 'L'].some((name) => faces[name].some((row) => /[^.]/.test(row)));

  const views = backMatters ? ['netFront', 'netBack'] : ['netFront'];
  return buildViews(faces, n, views, label, options.has('letters'));
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
