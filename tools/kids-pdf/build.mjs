// Baut die Bilderanleitung: public/wuerfel-bilderanleitung.pdf
//
//   node tools/kids-pdf/build.mjs      (oder: npm run pdf)
//
// Acht Schritte, ein Schritt pro Seite, A4 quer – zum Ausdrucken und neben
// den Würfel legen. Auf dem Blatt steht kein einziger Buchstabe: es ist für
// ein Kind gemacht, das noch nicht liest. Deshalb trägt jede Seite oben
// dieselbe Punktleiste (der wievielte Schritt ist das?), jede Zugfolge
// beginnt mit ihrer Merkfigur, und jedes Bild sagt entweder „so sieht es
// jetzt aus" oder „so soll es aussehen".
//
// Die Merkfiguren sind die aus dem Wohnzimmer, nicht die der Cubing-Welt:
//   Fahrstuhl              R U R' U'            (auf der Website: ROAR)
//   Spaziergänger          R U R' U R U2 R' U   (Sune mit U)
//   zwei Mädchen im Garten U R U' L' U R' U' L  (Niklas)
//   Fahrstuhl in den Keller R' D' R D
//
// Die Schritte folgen dem Beginner-Pfad aus content/beginner.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PdfDoc } from './pdf.mjs';
import * as A from './art.mjs';
import { net, crossSlots, KEEP } from './state.mjs';

const W = 842;
const H = 595;
const M = 44;
const STEPS = 8;

const ABOVE = { az: 36, el: 28 };
const BELOW = { az: 36, el: -27 };
// Für den Links-Einsetzer: von der anderen Ecke, sonst ist die linke Seite
// (und damit ihr Center) gar nicht im Bild.
const ABOVE_LEFT = { az: -36, el: 28 };

// --- kleine Platzierungshelfer ---------------------------------------------

const tv = (page, cx, cy, cell, src) => {
  const s = A.topViewSize(cell);
  return A.topView(page, cx - s / 2, cy - s / 2, cell, src);
};

const ic = (page, cx, cy, cell, src, view = ABOVE) => {
  const { width, height } = A.isoCubeSize(cell, view);
  return A.isoCube(page, cx - width / 2, cy - height / 2, cell, src, view);
};

const pipsWidth = (size = 15, gap = 7) => STEPS * (size + gap) - gap;

function pips(page, x, y, current, { size = 15, gap = 7 } = {}) {
  for (let i = 0; i < STEPS; i += 1) {
    const done = i < current;
    const now = i === current;
    const grow = now ? size * 0.22 : 0;
    page.roundRect(x + i * (size + gap) - grow / 2, y - grow / 2, size + grow, size + grow, size * 0.28, {
      fill: now ? A.COLORS.accent : done ? A.COLORS.accentSoft : A.COLORS.paper,
      stroke: now ? A.COLORS.ink : A.COLORS.hair,
      width: now ? 2 : 1.2,
    });
  }
  return STEPS * (size + gap) - gap;
}

function frame(doc, step) {
  const page = doc.addPage();
  page.rect(0, 0, W, H, { fill: A.COLORS.paper });
  if (step != null) {
    pips(page, M, 30, step);
    page.line(M, 66, W - M, 66, { stroke: A.COLORS.hair, width: 1.4 });
  }
  return page;
}

function panel(page, x, y, w, h) {
  page.roundRect(x, y, w, h, 18, { fill: A.COLORS.panel, stroke: A.COLORS.hair, width: 1.4 });
  page.roundRect(x, y + h * 0.18, 6, h * 0.64, 3, { fill: A.COLORS.accent });
}

const step2 = (page, x, y, w) => A.arrow(page, x, y, x + w, y, { width: 6.5, head: 17, color: A.COLORS.ink });

// Eine Zugfolge mittig in ein Panel setzen.
function algo(page, { x, y, w, h, moves, badge, size = 52, gap = 10, group = 0, after = null }) {
  panel(page, x, y, w, h);
  const width = A.algStripWidth({ moves, size, gap, group, badge, badgeSize: size * 1.5 });
  const extra = after ? size * 1.5 : 0;
  const startX = x + (w - width - extra) / 2;
  const end = A.algStrip(page, startX, y + (h - size) / 2, {
    moves,
    size,
    gap,
    group,
    badge,
    badgeSize: size * 1.5,
  });
  if (after) after(page, end + size * 0.75, y + h / 2);
  return end;
}

const elevatorBadge = (page, cx, cy, s) => A.elevator(page, cx, cy, s);
const cellarBadge = (page, cx, cy, s) => A.elevator(page, cx, cy, s, { down: true });

// „Nicht die Oberseite von Hand drehen – den ganzen Würfel drehen."
// Ab dem sortierten Kreuz die wichtigste Regel, und ohne Worte sagbar:
// durchgestrichener U-Zug, daneben der gedrehte Würfel.
function dontTurnU(page, cx, cy) {
  A.moveIcon(page, cx - 28, cy - 84, 56, 'U');
  A.cross(page, cx, cy - 56, 48, { color: A.COLORS.bad });
  A.flipHint(page, cx, cy + 34, 60);
}

// ---------------------------------------------------------------------------
// Seite 1 – die Landkarte: acht Schritte auf einen Blick
// ---------------------------------------------------------------------------

const FLOWER = `
. . .
. . w . .
. w y w .
. . w . .
. . .
`;

const YELLOW_CROSS = `
. . .
. . y . .
. y y y .
. . y . .
. . .
`;

const SORTED_CROSS = `
. b .
. . y . .
o y y y r
. . y . .
. g .
`;

// Ecken am Platz, aber noch verdreht (aus content/beginner.md, Lektion 8).
const CORNERS_PLACED = `
b b y
o y y r b
o y y y r
g o y g y
y g r
`;

const MAP = [
  (page, cx, cy) => tv(page, cx, cy, 17, FLOWER),
  (page, cx, cy) => ic(page, cx, cy, 17, net([], KEEP.whiteCross), BELOW),
  (page, cx, cy) => ic(page, cx, cy, 17, net([], KEEP.firstLayer), BELOW),
  (page, cx, cy) => ic(page, cx, cy, 17, net([], KEEP.twoLayers), ABOVE),
  (page, cx, cy) => tv(page, cx, cy, 17, YELLOW_CROSS),
  (page, cx, cy) => tv(page, cx, cy, 17, SORTED_CROSS),
  (page, cx, cy) => tv(page, cx, cy, 17, CORNERS_PLACED),
  (page, cx, cy) => ic(page, cx, cy, 17, net(), ABOVE),
];

function pageMap(doc) {
  const page = frame(doc, null);
  const cardW = 178;
  const cardH = 232;
  const gapX = (W - 2 * M - 4 * cardW) / 3;
  const gapY = 28;
  const top = 44;

  MAP.forEach((draw, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = M + col * (cardW + gapX);
    const y = top + row * (cardH + gapY);
    page.roundRect(x, y, cardW, cardH, 18, { fill: A.COLORS.panel, stroke: A.COLORS.hair, width: 1.4 });
    draw(page, x + cardW / 2, y + cardH * 0.43);
    pips(page, x + (cardW - pipsWidth(12, 5)) / 2, y + cardH - 34, i, { size: 12, gap: 5 });
  });

  // Am Ende steht der gelöste Würfel – deshalb bekommt die letzte Karte
  // zusätzlich den Haken.
  A.check(page, M + 3 * (cardW + gapX) + cardW - 32, top + cardH + gapY + 32, 34);
}

// ---------------------------------------------------------------------------
// Seite 2 – Schritt 1: die weiße Blume
// ---------------------------------------------------------------------------

const SCRAMBLE = ['R', 'U2', "F'", 'L', 'D', "B'", 'R2', 'U', "L'", 'F'];

function pageFlower(doc) {
  const page = frame(doc, 0);
  ic(page, 210, 230, 30, net(SCRAMBLE), ABOVE);
  step2(page, 370, 230, 100);
  tv(page, 620, 230, 30, FLOWER);
  A.eye(page, 620, 372, 46);

  // Unten: die vier Blütenblätter kommen eins nach dem anderen dazu.
  const petals = [
    '. . .\n. . . . .\n. w y . .\n. . . . .\n. . .',
    '. . .\n. . w . .\n. w y . .\n. . . . .\n. . .',
    '. . .\n. . w . .\n. w y w .\n. . . . .\n. . .',
    FLOWER,
  ];
  panel(page, M, 424, W - 2 * M, 130);
  petals.forEach((src, i) => {
    const cx = 150 + i * 190;
    tv(page, cx, 489, 14, src);
    if (i < petals.length - 1) step2(page, cx + 60, 489, 66);
  });
}

// ---------------------------------------------------------------------------
// Seite 3 – Schritt 2: Blütenblätter pflanzen, weißes Kreuz
// ---------------------------------------------------------------------------

// Ein Blütenblatt steht über seinem Center: vorn Rot über Rot.
const PETAL_ALIGNED = `
.w.
wyw
.w.
... .r. ... ...
... .r. ... ...
... ... ... ...
...
...
...
`;

function pageCross(doc) {
  const page = frame(doc, 1);
  const cube = ic(page, 180, 210, 30, PETAL_ALIGNED, ABOVE);
  A.ring(page, ...cube.centerOf('F', 0, 1), 21, { color: A.COLORS.accent, width: 4 });
  A.ring(page, ...cube.centerOf('F', 1, 1), 21, { color: A.COLORS.accent, width: 4 });

  step2(page, 340, 210, 84);

  A.moveIcon(page, 462, 162, 96, 'F2');

  step2(page, 600, 210, 84);

  ic(page, 730, 195, 27, net([], KEEP.whiteCross), BELOW);
  A.flipHint(page, 730, 320, 54);

  // Viermal – für jedes Blütenblatt einmal.
  panel(page, M, 396, W - 2 * M, 158);
  const seats = [['F'], ['F', 'R'], ['F', 'R', 'B'], ['F', 'R', 'B', 'L']];
  seats.forEach((slots, i) => {
    const cx = 152 + i * 186;
    ic(page, cx, 474, 17, net([], crossSlots(slots)), BELOW);
    if (i < seats.length - 1) step2(page, cx + 62, 474, 58);
  });
  A.check(page, 152 + 3 * 186 + 76, 474, 36);
}

// ---------------------------------------------------------------------------
// Seite 4 – Schritt 3: weiße Ecken mit dem Fahrstuhl
// ---------------------------------------------------------------------------

// Die weiß-grün-rote Ecke wartet oben über ihrem Zuhause: Grün über Grün.
const CORNER_PARKED = `
...
...
..r
... ..g w.. ...
... .g. .r. ...
... ... ... ...
...
...
...
`;

function pageWhiteCorners(doc) {
  const page = frame(doc, 2);
  const cube = ic(page, 190, 200, 29, CORNER_PARKED, ABOVE);
  // Grün über Grün: die Ecke wartet über ihrem Zuhause.
  A.ring(page, ...cube.centerOf('F', 0, 2), 15, { color: A.COLORS.accent, width: 3.6 });
  A.ring(page, ...cube.centerOf('F', 1, 1), 15, { color: A.COLORS.accent, width: 3.6 });
  // Die Ecke fährt an ihren Platz ganz unten.
  A.bentArrow(page, cube.centerOf('R', 0, 1), cube.centerOf('R', 2, 1), { bow: 0.3, width: 4.4, head: 13, color: A.COLORS.accent });

  step2(page, 360, 200, 84);

  ic(page, 570, 190, 29, net([], KEEP.firstLayer), BELOW);
  A.flipHint(page, 570, 320, 54);

  A.loop(page, 730, 176, 62);
  A.eye(page, 730, 246, 54);

  algo(page, {
    x: M,
    y: 372,
    w: W - 2 * M,
    h: 178,
    moves: ['R', 'U', "R'", "U'"],
    badge: elevatorBadge,
    size: 76,
    gap: 16,
    after: (pg, cx, cy) => A.loop(pg, cx + 20, cy, 62),
  });
}

// ---------------------------------------------------------------------------
// Seite 5 – Schritt 4: die mittlere Ebene
// ---------------------------------------------------------------------------

// Kante oben, vorn Grün über Grün, oben Rot – Rot wartet rechts.
const EDGE_RIGHT = `
...
...
.r.
... .g. ... ...
... .g. .r. ...
... ... ... ...
...
...
...
`;

// Spiegelbild: oben Orange, Orange wartet links.
const EDGE_LEFT = `
...
...
.o.
... .g. ... ...
.o. .g. ... ...
... ... ... ...
...
...
...
`;

function pageMiddle(doc) {
  const page = frame(doc, 3);

  // Zwei Einsetzer: einer nach rechts, einer nach links – Spiegelbilder.
  const rows = [
    { src: EDGE_RIGHT, view: ABOVE, moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'] },
    { src: EDGE_LEFT, view: ABOVE_LEFT, moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"] },
  ];
  rows.forEach(({ src, view, moves }, i) => {
    const y = 84 + i * 196;
    const h = 178;
    panel(page, M, y, W - 2 * M, h);
    const mid = y + h / 2;
    ic(page, M + 96, mid, 20, src, view);
    A.arrow(page, M + 168, mid, M + 212, mid, { width: 5, head: 14 });
    const size = 52;
    const gap = 10;
    const stripW = moves.length * (size + gap) - gap;
    A.algStrip(page, W - M - stripW - 30, mid - size / 2, { moves, size, gap });
  });

  // Danach stehen zwei Ebenen.
  ic(page, 360, 512, 20, net([], KEEP.twoLayers), ABOVE);
  A.check(page, 470, 512, 40);
}

// ---------------------------------------------------------------------------
// Seite 6 – Schritt 5: das gelbe Kreuz
// ---------------------------------------------------------------------------

const DOT = `
. . .
. . . . .
. . y . .
. . . . .
. . .
`;

// Das L liegt nach hinten und nach links – so herum muss es gehalten werden.
const L_SHAPE = `
. . .
. . y . .
. y y . .
. . . . .
. . .
`;

const LINE = `
. . .
. . . . .
. y y y .
. . . . .
. . .
`;

function pageYellowCross(doc) {
  const page = frame(doc, 4);
  const shapes = [DOT, L_SHAPE, LINE, YELLOW_CROSS];
  shapes.forEach((src, i) => {
    const cx = 152 + i * 186;
    tv(page, cx, 200, 22, src);
    if (i < shapes.length - 1) step2(page, cx + 72, 200, 44);
  });
  A.check(page, 152 + 3 * 186 + 84, 200, 36);

  algo(page, {
    x: M,
    y: 352,
    w: W - 2 * M,
    h: 198,
    moves: ['F', 'R', 'U', "R'", "U'", "F'"],
    size: 76,
    gap: 15,
    after: (pg, cx, cy) => {
      A.loop(pg, cx + 26, cy - 30, 58);
      A.eye(pg, cx + 26, cy + 40, 50);
    },
  });
}

// ---------------------------------------------------------------------------
// Seite 7 – Schritt 6: die Kanten sortieren (Spaziergänger)
// ---------------------------------------------------------------------------

// Hinten und rechts passen schon, vorn und links müssen tauschen.
const EDGES_UNSORTED = `
. b .
. . y . .
g y y y r
. . y . .
. o .
`;

function pageEdges(doc) {
  const page = frame(doc, 5);
  const before = tv(page, 190, 210, 26, EDGES_UNSORTED);
  A.bentArrow(page, before.center('F', 0, 1), before.center('L', 1, 0), {
    both: true,
    bow: 0.32,
    width: 4.2,
    head: 13,
    color: A.COLORS.bad,
  });

  step2(page, 340, 210, 84);

  tv(page, 560, 210, 26, SORTED_CROSS);
  A.check(page, 730, 210, 44);

  // Erinnerung: nicht die Oberseite drehen, sondern den ganzen Würfel.
  dontTurnU(page, 748, 452);

  algo(page, {
    x: M,
    y: 386,
    w: 620,
    h: 164,
    moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'],
    badge: (pg, cx, cy, s) => A.walker(pg, cx, cy, s),
    size: 52,
    gap: 10,
  });
}

// ---------------------------------------------------------------------------
// Seite 8 – Schritt 7: die Ecken ziehen um (zwei Mädchen im Garten)
// ---------------------------------------------------------------------------

// Eine Ecke ist zu Hause (vorne rechts), die anderen drei fahren im Kreis.
const CORNER_ANCHOR = `
. . .
. . . . .
. . . . .
. . . g y
. . r
`;

function pageCornerPlace(doc) {
  const page = frame(doc, 6);
  const before = tv(page, 190, 210, 26, CORNER_ANCHOR);
  // Eine Ecke steht still (Haken), die drei anderen fahren im Kreis.
  const [ax, ay] = before.center('U', 2, 2);
  const [ux, uy] = before.center('U', 1, 1);
  A.curvedArrow(page, ux, uy, Math.hypot(ax - ux, ay - uy) * 0.95, 315, 135, {
    color: A.COLORS.bad,
    width: 4.4,
    head: 15,
  });
  A.checkBadge(page, ax, ay, 30);

  step2(page, 340, 210, 84);

  tv(page, 560, 210, 26, CORNERS_PLACED);
  A.check(page, 730, 210, 44);

  dontTurnU(page, 748, 452);

  algo(page, {
    x: M,
    y: 386,
    w: 620,
    h: 164,
    moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
    badge: (pg, cx, cy, s) => A.girls(pg, cx, cy, s),
    size: 52,
    gap: 10,
  });
}

// ---------------------------------------------------------------------------
// Seite 9 – Schritt 8: der Fahrstuhl fährt in den Keller
// ---------------------------------------------------------------------------

// Gelb zeigt nach rechts – ein Doppelpack. Gelb zeigt nach vorn – zwei.
const TWIST_RIGHT = `
. . .
. . . . .
. . . . .
. . . g y
. . r
`;

const TWIST_FRONT = `
. . .
. . . . .
. . . . .
. . . r g
. . y
`;

function pageTwist(doc) {
  const page = frame(doc, 7);

  const cases = [
    { src: TWIST_RIGHT, times: 1 },
    { src: TWIST_FRONT, times: 2 },
  ];
  cases.forEach(({ src, times }, i) => {
    const x = M + i * 250;
    tv(page, x + 80, 190, 22, src);
    for (let k = 0; k < times; k += 1) A.loop(page, x + 186, 168 + k * 48, 46);
  });

  ic(page, 690, 190, 26, net(), ABOVE);
  A.check(page, 790, 250, 40);

  algo(page, {
    x: M,
    y: 336,
    w: W - 2 * M,
    h: 132,
    moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D'],
    badge: cellarBadge,
    size: 50,
    gap: 9,
    group: 4, // zweimal dieselben vier Züge – der Doppelpack
  });

  // Danach: nur U drehen, bis die nächste Ecke vorne rechts steht.
  panel(page, M, 482, W - 2 * M, 76);
  A.moveIcon(page, 120, 490, 60, 'U');
  A.arrow(page, 200, 520, 250, 520, { width: 5, head: 14 });
  A.eye(page, 290, 520, 50);
  A.arrow(page, 340, 520, 390, 520, { width: 5, head: 14 });
  A.loop(page, 440, 520, 56);
  A.arrow(page, 500, 520, 550, 520, { width: 5, head: 14 });
  A.check(page, 600, 520, 40);
}

// ---------------------------------------------------------------------------

function build() {
  const doc = new PdfDoc({ width: W, height: H });
  pageMap(doc);
  pageFlower(doc);
  pageCross(doc);
  pageWhiteCorners(doc);
  pageMiddle(doc);
  pageYellowCross(doc);
  pageEdges(doc);
  pageCornerPlace(doc);
  pageTwist(doc);
  return doc.toBuffer();
}

const out = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(fileURLToPath(new URL('../../public/wuerfel-bilderanleitung.pdf', import.meta.url)));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, build());
process.stdout.write(`${out}\n`);
