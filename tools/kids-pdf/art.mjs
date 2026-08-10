// Die Bildsprache der Anleitung: Sticker, Würfel, Zug-Symbole, Pfeile,
// Merkfiguren. Alles hier zeichnet auf eine Seite aus pdf.mjs und kennt
// keinen Text – die Anleitung ist für ein Kind gedacht, das noch nicht liest.
//
// Zwei Sorten Würfelbilder, dieselben Quellformate wie im Content der Website
// (siehe src/cube-diagram.js), damit ein Bild hier und ein Bild dort aus
// derselben Notation entsteht:
//
//   topView  = ```cube      – Blick von schräg oben, hier flach ausgeklappt
//   isoCube  = ```cube-net  – ganzer Würfel, räumlich von einer Ecke
//
// Zeichen: y r g b o w und . (egal – wird grau).

const DEG = Math.PI / 180;

// Farben wie in src/styles.css (dort als HSL), damit Blatt und Website
// dieselbe Würfelwelt zeigen.
export const COLORS = {
  y: '#f6c627',
  r: '#d84a40',
  g: '#42a35b',
  b: '#3b78ce',
  o: '#ef822a',
  w: '#f8f6f2',
  '.': '#c3bbad', // „egal" – deutlich grauer als Weiß, sonst verschwindet das weiße Kreuz
  body: '#352a22',
  ink: '#2f2620',
  accent: '#d49a35',
  accentSoft: '#fbeacd',
  paper: '#ffffff',
  panel: '#fbf8f2',
  hair: '#e4ddd1',
  good: '#42a35b',
  bad: '#d84a40',
};

export function shade(hex, factor) {
  const v = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(Math.min(255, Math.max(0, c * factor)));
  const out = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(mix);
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const stickerColor = (ch) => COLORS[ch] || COLORS['.'];

// ---------------------------------------------------------------------------
// Pfeile
// ---------------------------------------------------------------------------

// Gerader Pfeil. `head` ist die Größe der Spitze; `heads: 2` malt zwei
// Winkel hintereinander – so heißt ein Zug „zweimal", ohne eine Ziffer zu
// benutzen, die das Kind noch nicht lesen kann.
export function arrow(page, x1, y1, x2, y2, { color = COLORS.ink, width = 4, head = 10, heads = 1 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const back = head * 0.72;
  const tipX = x2;
  const tipY = y2;
  page.line(x1, y1, tipX - Math.cos(a) * back * 0.4, tipY - Math.sin(a) * back * 0.4, { stroke: color, width });
  for (let i = 0; i < heads; i += 1) {
    const bx = tipX - Math.cos(a) * back * i;
    const by = tipY - Math.sin(a) * back * i;
    arrowHead(page, bx, by, a, head, color);
  }
}

function arrowHead(page, x, y, angle, size, color) {
  const wing = size * 0.62;
  const p = (d, o) => [x - Math.cos(angle) * d - Math.sin(angle) * o, y - Math.sin(angle) * d + Math.cos(angle) * o];
  page.polygon([[x, y], p(size, wing), p(size * 0.68, 0), p(size, -wing)], { fill: color });
}

// Kreisbogen mit Spitze. Winkel in Grad, im Seitensystem (y nach unten) läuft
// ein wachsender Winkel im Uhrzeigersinn.
export function curvedArrow(page, cx, cy, r, from, to, { color = COLORS.ink, width = 4, head = 11, heads = 1 } = {}) {
  const dir = Math.sign(to - from);
  const perHead = (head * 0.72 * 180) / (Math.PI * r); // Spitzenlänge in Grad
  page.arc(cx, cy, r, from, to - dir * perHead * 0.5, { stroke: color, width });
  for (let i = 0; i < heads; i += 1) {
    const a = (to - dir * perHead * i) * DEG;
    arrowHead(page, cx + r * Math.cos(a), cy + r * Math.sin(a), a + dir * (Math.PI / 2), head, color);
  }
}

// Gebogener Pfeil zwischen zwei Punkten im Bild – zeigt, welches Teil wohin
// wandert. `both` malt an beiden Enden eine Spitze („die zwei tauschen").
export function bentArrow(page, p1, p2, { color = COLORS.ink, width = 3.6, head = 11, bow = 0.26, both = false } = {}) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const [nx, ny] = [-(y2 - y1) / len, (x2 - x1) / len];
  const cx = (x1 + x2) / 2 + nx * len * bow;
  const cy = (y1 + y2) / 2 + ny * len * bow;
  const trim = (px, py) => {
    const a = Math.atan2(py - cy, px - cx);
    return [px - Math.cos(a) * head * 0.55, py - Math.sin(a) * head * 0.55, a];
  };
  const [ex, ey, ea] = trim(x2, y2);
  const [sx, sy, sa] = both ? trim(x1, y1) : [x1, y1, 0];
  const ctrl = (px, py) => [px + (2 / 3) * (cx - px), py + (2 / 3) * (cy - py)];
  const [c1x, c1y] = ctrl(sx, sy);
  const [c2x, c2y] = ctrl(ex, ey);
  page.moveTo(sx, sy);
  page.curveTo(c1x, c1y, c2x, c2y, ex, ey);
  page.paint({ stroke: color, width });
  arrowHead(page, x2, y2, ea, head, color);
  if (both) arrowHead(page, x1, y1, sa, head, color);
}

// ---------------------------------------------------------------------------
// Flache Sticker-Felder
// ---------------------------------------------------------------------------

export function sticker(page, x, y, size, ch, { radius = null, alpha = 1 } = {}) {
  const c = alpha === 1 ? stickerColor(ch) : shade(stickerColor(ch), alpha);
  page.roundRect(x, y, size, size, radius == null ? size * 0.18 : radius, {
    fill: c,
    stroke: COLORS.body,
    width: Math.max(0.8, size * 0.055),
  });
}

// Ein flaches 3x3-Feld (auch 1x3 oder 3x1 – über rows/cols).
export function stickerBlock(page, x, y, cell, cells, { rows = 3, cols = 3, gap = null } = {}) {
  const g = gap == null ? cell * 0.1 : gap;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      sticker(page, x + c * (cell + g), y + r * (cell + g), cell, cells[r * cols + c]);
    }
  }
}

// ---------------------------------------------------------------------------
// Draufsicht (```cube```) – flach ausgeklappt
// ---------------------------------------------------------------------------
//
//        b b b          hintere Seitenreihe
//   l    u u u    r     links / Oberseite / rechts
//   l    u u u    r
//   l    u u u    r
//        f f f          vordere Seitenreihe
//

// Kantenlänge des fertigen Bildes – für zentriertes Platzieren.
export const topViewSize = (cell) => 5.88 * cell;

// Rückgabe: { width, height, center(face, r, c) } – damit Markierungen
// (Pfeile, Haken, Kreuze) präzise über dem Bild sitzen können.
export function topView(page, x, y, cell, src) {
  const lines = src.trim().split('\n').map((l) => l.trim().split(/\s+/));
  const back = lines[0];
  const front = lines[4];
  const u = [];
  const left = [];
  const right = [];
  for (let r = 0; r < 3; r += 1) {
    const row = lines[r + 1];
    left.push(row[0]);
    u.push(row[1], row[2], row[3]);
    right.push(row[4]);
  }

  const step = cell * 1.1; // Sticker + Fuge
  const block = 3 * cell + 2 * (step - cell);
  const bandGap = cell * 0.34;
  const ux = x + cell + bandGap;
  const uy = y + cell + bandGap;
  const rightX = ux + block + bandGap;
  const frontY = uy + block + bandGap;
  const size = 2 * (cell + bandGap) + block;

  stickerBlock(page, ux, y, cell, back, { rows: 1, cols: 3 });
  stickerBlock(page, ux, frontY, cell, front, { rows: 1, cols: 3 });
  stickerBlock(page, x, uy, cell, left, { rows: 3, cols: 1 });
  stickerBlock(page, rightX, uy, cell, right, { rows: 3, cols: 1 });
  stickerBlock(page, ux, uy, cell, u);

  const center = (face, r = 0, c = 0) => {
    if (face === 'U') return [ux + c * step + cell / 2, uy + r * step + cell / 2];
    if (face === 'B') return [ux + c * step + cell / 2, y + cell / 2];
    if (face === 'F') return [ux + c * step + cell / 2, frontY + cell / 2];
    if (face === 'L') return [x + cell / 2, uy + r * step + cell / 2];
    return [rightX + cell / 2, uy + r * step + cell / 2];
  };
  return { width: size, height: size, center };
}

// ---------------------------------------------------------------------------
// Räumlicher Würfel (```cube-net```)
// ---------------------------------------------------------------------------

const S = 3;

function parseNet(src) {
  const lines = src.trim().split('\n').map((l) => l.trimEnd());
  const faces = { U: [], L: [], F: [], R: [], B: [], D: [] };
  for (let r = 0; r < 3; r += 1) faces.U.push(...lines[r].trim().split(''));
  for (let r = 0; r < 3; r += 1) {
    const [l, f, rr, b] = lines[3 + r].trim().split(/\s+/);
    faces.L.push(...l.split(''));
    faces.F.push(...f.split(''));
    faces.R.push(...rr.split(''));
    faces.B.push(...b.split(''));
  }
  for (let r = 0; r < 3; r += 1) faces.D.push(...lines[6 + r].trim().split(''));
  return faces;
}

// Die vier Ecken eines Feldes im Würfelraum: x nach rechts, y nach oben,
// z nach vorn. Die Zeilen/Spalten folgen der Leserichtung des Netzes.
function quad(face, r, c) {
  const [x0, x1] = [c, c + 1];
  const [yTop, yBot] = [S - r, S - r - 1];
  switch (face) {
    case 'U': return [[x0, S, r], [x1, S, r], [x1, S, r + 1], [x0, S, r + 1]];
    case 'D': return [[x0, 0, S - r], [x1, 0, S - r], [x1, 0, S - r - 1], [x0, 0, S - r - 1]];
    case 'F': return [[x0, yTop, S], [x1, yTop, S], [x1, yBot, S], [x0, yBot, S]];
    case 'B': return [[S - c, yTop, 0], [S - c - 1, yTop, 0], [S - c - 1, yBot, 0], [S - c, yBot, 0]];
    case 'L': return [[0, yTop, c], [0, yTop, c + 1], [0, yBot, c + 1], [0, yBot, c]];
    default: return [[S, yTop, S - c], [S, yTop, S - c - 1], [S, yBot, S - c - 1], [S, yBot, S - c]];
  }
}

const NORMAL = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
// Licht von schräg oben-vorn: erst die unterschiedlichen Helligkeiten machen
// aus drei Vierecken einen Körper.
const SHADE = { U: 1, D: 0.96, F: 0.93, B: 0.88, R: 0.82, L: 0.78 };

function camera({ az = 36, el = 28 }) {
  const [a, e] = [az * DEG, el * DEG];
  const toCam = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const right = [Math.cos(a), 0, -Math.sin(a)];
  const up = [-Math.sin(a) * Math.sin(e), Math.cos(e), -Math.cos(a) * Math.sin(e)];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  return {
    toCam,
    visible: (face) => dot(NORMAL[face], toCam) > 0.001,
    flat: (p) => [dot(p, right), -dot(p, up)],
  };
}

function inset(points, k) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([px, py]) => [cx + (px - cx) * k, cy + (py - cy) * k]);
}

function bounds(cam) {
  const corners = [];
  for (const xx of [0, S]) for (const yy of [0, S]) for (const zz of [0, S]) corners.push(cam.flat([xx, yy, zz]));
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

// Maße des fertigen Würfelbildes – für zentriertes Platzieren.
export function isoCubeSize(cell, view = {}) {
  const { w, h } = bounds(camera(view));
  return { width: w * cell, height: h * cell };
}

// Zeichnet den Würfel in eine Box, deren linke obere Ecke (x,y) ist.
// Rückgabe: { project, centerOf, width, height } – damit Markierungen
// (Ringe, Pfeile) genau auf einem Sticker sitzen können.
export function isoCube(page, x, y, cell, src, view = {}) {
  const faces = parseNet(src);
  const cam = camera(view);
  const { minX, minY, w, h } = bounds(cam);
  const width = w * cell;
  const height = h * cell;
  const project = (p) => {
    const [fx, fy] = cam.flat(p);
    return [x + (fx - minX) * cell, y + (fy - minY) * cell];
  };

  for (const face of ['D', 'B', 'L', 'U', 'F', 'R']) {
    if (!cam.visible(face)) continue;
    // Erst die ganze Fläche in Körperfarbe – die Fugen zwischen den Stickern
    // sind dann der Würfel selbst und nicht das Papier.
    const outline = [quad(face, 0, 0)[0], quad(face, 0, 2)[1], quad(face, 2, 2)[2], quad(face, 2, 0)[3]];
    page.polygon(outline.map(project), { fill: COLORS.body });
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const pts = inset(quad(face, r, c).map(project), 0.86);
        page.polygon(pts, { fill: shade(stickerColor(faces[face][r * 3 + c]), SHADE[face]) });
      }
    }
  }
  const centerOf = (face, r, c) => {
    const pts = quad(face, r, c).map(project);
    return [
      pts.reduce((s, p) => s + p[0], 0) / 4,
      pts.reduce((s, p) => s + p[1], 0) / 4,
    ];
  };
  return { project, centerOf, width, height, visible: cam.visible };
}

// ---------------------------------------------------------------------------
// Zug-Symbole
// ---------------------------------------------------------------------------
//
// Ein Zug ist ein Blick von vorn auf den Würfel: das Feld, das sich dreht,
// ist eingefärbt, ein dicker Pfeil zeigt, wohin es wandert. Genau die
// Bildsprache, die auf Papier von Hand entsteht.
//
//   R  rechte Spalte hoch      R'  rechte Spalte runter
//   L  linke Spalte runter     L'  linke Spalte hoch
//   U  obere Reihe nach links  U'  obere Reihe nach rechts
//   D  untere Reihe rechts     D'  untere Reihe links
//   F  ganze Fläche im Uhrzeigersinn   F'  dagegen
// Ein „2" wird zur doppelten Pfeilspitze.

const BAND = {
  R: { kind: 'col', index: 2, dir: 'up' },
  L: { kind: 'col', index: 0, dir: 'down' },
  U: { kind: 'row', index: 0, dir: 'left' },
  D: { kind: 'row', index: 2, dir: 'right' },
};

export function moveIcon(page, x, y, size, move) {
  const face = move[0];
  const double = move.includes('2');
  const prime = move.includes("'");
  const cell = size / 3;
  const grid = (i) => x + i * cell;

  page.roundRect(x, y, size, size, size * 0.1, { fill: COLORS.paper, stroke: COLORS.ink, width: size * 0.045 });

  if (face === 'F') {
    page.roundRect(x + cell * 0.16, y + cell * 0.16, size - cell * 0.32, size - cell * 0.32, size * 0.08, {
      fill: COLORS.accentSoft,
    });
  } else {
    const band = BAND[face];
    const [bx, by, bw, bh] = band.kind === 'col'
      ? [grid(band.index), y, cell, size]
      : [x, y + band.index * cell, size, cell];
    page.rect(bx, by, bw, bh, { fill: COLORS.accentSoft });
  }

  page.strokeColor(COLORS.ink).lineWidth(size * 0.035);
  for (let i = 1; i < 3; i += 1) {
    page.line(grid(i), y, grid(i), y + size, { stroke: COLORS.ink, width: size * 0.035 });
    page.line(x, y + i * cell, x + size, y + i * cell, { stroke: COLORS.ink, width: size * 0.035 });
  }
  page.roundRect(x, y, size, size, size * 0.1, { stroke: COLORS.ink, width: size * 0.055 });

  const style = { color: COLORS.ink, width: size * 0.085, head: size * 0.2, heads: double ? 2 : 1 };
  if (face === 'F') {
    const r = size * 0.29;
    const [cx, cy] = [x + size / 2, y + size / 2];
    // Uhrzeigersinn heißt auf dem Papier: wachsender Winkel (y zeigt nach unten).
    const turn = { ...style, head: size * 0.24 };
    if (prime) curvedArrow(page, cx, cy, r, 150, -150, turn);
    else curvedArrow(page, cx, cy, r, 30, 330, turn);
    return;
  }

  const band = BAND[face];
  let dir = band.dir;
  if (prime) dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
  const pad = cell * 0.28;
  if (band.kind === 'col') {
    const cx = grid(band.index) + cell / 2;
    const [y1, y2] = dir === 'up' ? [y + size - pad, y + pad] : [y + pad, y + size - pad];
    arrow(page, cx, y1, cx, y2, style);
  } else {
    const cy = y + band.index * cell + cell / 2;
    const [x1, x2] = dir === 'left' ? [x + size - pad, x + pad] : [x + pad, x + size - pad];
    arrow(page, x1, cy, x2, cy, style);
  }
}

// Eine Zugfolge als Reihe von Symbolen, links davor die Merkfigur.
export function algStrip(page, x, y, { moves, size = 46, gap = 9, badge = null, badgeSize = 74, group = 0 }) {
  let cursor = x;
  if (badge) {
    const box = badgeSize;
    page.roundRect(cursor, y + size / 2 - box / 2, box, box, box * 0.16, {
      fill: COLORS.panel,
      stroke: COLORS.accent,
      width: 2.4,
    });
    badge(page, cursor + box * 0.5, y + size / 2, box * 0.78);
    cursor += box + gap * 2.2;
  }
  moves.forEach((move, i) => {
    moveIcon(page, cursor, y, size, move);
    // Eine Lücke nach jeder Gruppe: „und jetzt dasselbe noch einmal".
    const boundary = group && (i + 1) % group === 0 && i + 1 < moves.length;
    cursor += size + gap + (boundary ? size * 0.45 : 0);
  });
  return cursor - gap;
}

export function algStripWidth({ moves, size = 46, gap = 9, badge = null, badgeSize = 74, group = 0 }) {
  const badgeWidth = badge ? badgeSize + gap * 2.2 : 0;
  const groups = group ? Math.ceil(moves.length / group) - 1 : 0;
  return badgeWidth + moves.length * (size + gap) - gap + groups * size * 0.45;
}

// ---------------------------------------------------------------------------
// Merkfiguren
// ---------------------------------------------------------------------------
//
// Die Namen kommen vom Vater, nicht aus der Cubing-Welt: der Fahrstuhl
// (R U R' U'), der Spaziergänger (Sune), die zwei Mädchen im Garten (Niklas)
// und der Fahrstuhl in den Keller (R' D' R D). Auf dem Blatt steht statt des
// Namens die Figur – die kann man auch ohne Lesen wiedererkennen.

// Fahrstuhl: Schacht, Kabine, Richtungspfeil. `down` schickt ihn in den Keller.
export function elevator(page, cx, cy, size, { down = false } = {}) {
  const w = size * 0.52;
  const h = size;
  const x = cx - w * 0.78;
  const y = cy - h / 2;
  page.roundRect(x, y, w, h, w * 0.14, { fill: COLORS.paper, stroke: COLORS.ink, width: size * 0.055 });
  const cabH = h * 0.3;
  const cabY = down ? y + h - cabH - h * 0.05 : y + h * 0.05;
  // Seil: die Kabine hängt im Schacht
  page.line(x + w / 2, y + h * 0.05, x + w / 2, cabY + cabH, { stroke: COLORS.ink, width: size * 0.028 });
  page.roundRect(x + w * 0.16, cabY, w * 0.68, cabH, w * 0.1, {
    fill: COLORS.accent,
    stroke: COLORS.ink,
    width: size * 0.04,
  });
  if (down) {
    // Kellerdecke: der Fahrstuhl fährt unter den Boden.
    page.line(x - size * 0.08, y + h * 0.6, x + w + size * 0.08, y + h * 0.6, { stroke: COLORS.ink, width: size * 0.055 });
  }
  const ax = cx + size * 0.4;
  const [y1, y2] = down ? [cy - h * 0.36, cy + h * 0.4] : [cy + h * 0.36, cy - h * 0.4];
  arrow(page, ax, y1, ax, y2, { color: COLORS.accent, width: size * 0.1, head: size * 0.24 });
}

function stickFigure(page, cx, cy, size, { walking = false, skirt = false, color = COLORS.ink } = {}) {
  const w = size * 0.09;
  const headR = size * 0.15;
  const headY = cy - size * 0.34;
  const hip = cy + size * 0.06;
  page.circle(cx, headY, headR, { fill: COLORS.paper, stroke: color, width: w });
  page.line(cx, headY + headR, cx, hip, { stroke: color, width: w });
  if (skirt) {
    page.polygon(
      [[cx, cy - size * 0.06], [cx + size * 0.19, hip + size * 0.06], [cx - size * 0.19, hip + size * 0.06]],
      { fill: color }
    );
  }
  // Arme
  const armY = cy - size * 0.12;
  page.line(cx - size * 0.2, armY + (walking ? size * 0.08 : -size * 0.06), cx + size * 0.2, armY + (walking ? -size * 0.08 : -size * 0.06), {
    stroke: color,
    width: w,
  });
  // Beine
  const footY = cy + size * 0.42;
  const spread = walking ? size * 0.22 : size * 0.13;
  const startY = skirt ? hip + size * 0.06 : hip;
  page.line(cx, startY, cx - spread, footY, { stroke: color, width: w });
  page.line(cx, startY, cx + spread * (walking ? 0.55 : 1), footY, { stroke: color, width: w });
}

// Spaziergänger: eine Figur, die losgeht – für die Sune.
export function walker(page, cx, cy, size) {
  page.line(cx - size * 0.44, cy + size * 0.46, cx + size * 0.44, cy + size * 0.46, { stroke: COLORS.accent, width: size * 0.07 });
  stickFigure(page, cx - size * 0.05, cy - size * 0.02, size * 0.92, { walking: true });
}

// Zwei Mädchen, die im Garten spielen – für das Karussell (Niklas).
export function girls(page, cx, cy, size) {
  page.line(cx - size * 0.48, cy + size * 0.44, cx + size * 0.48, cy + size * 0.44, { stroke: COLORS.good, width: size * 0.07 });
  stickFigure(page, cx - size * 0.24, cy - size * 0.02, size * 0.78, { skirt: true });
  stickFigure(page, cx + size * 0.24, cy - size * 0.02, size * 0.78, { skirt: true });
  // Blume dazwischen
  const fy = cy + size * 0.26;
  page.line(cx, fy + size * 0.16, cx, fy, { stroke: COLORS.good, width: size * 0.045 });
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    page.circle(cx + Math.cos(a) * size * 0.065, fy - size * 0.02 + Math.sin(a) * size * 0.065, size * 0.045, { fill: COLORS.y });
  }
  page.circle(cx, fy - size * 0.02, size * 0.035, { fill: COLORS.accent });
}

// Auge: „jetzt hinschauen".
export function eye(page, cx, cy, size, { color = COLORS.ink } = {}) {
  const w = size * 0.5;
  const h = size * 0.3;
  page.moveTo(cx - w, cy);
  page.curveTo(cx - w * 0.45, cy - h, cx + w * 0.45, cy - h, cx + w, cy);
  page.curveTo(cx + w * 0.45, cy + h, cx - w * 0.45, cy + h, cx - w, cy);
  page.close();
  page.paint({ fill: COLORS.paper, stroke: color, width: size * 0.07 });
  page.circle(cx, cy, size * 0.13, { fill: color });
}

// Wiederholen: Kreispfeil.
export function loop(page, cx, cy, size, { color = COLORS.accent } = {}) {
  curvedArrow(page, cx, cy, size * 0.4, 60, 340, { color, width: size * 0.11, head: size * 0.26 });
}

// Haken auf hellem Grund – zum Setzen mitten ins Würfelbild, wo ein nackter
// Haken auf einem grünen Sticker verschwinden würde.
export function checkBadge(page, cx, cy, size) {
  page.circle(cx, cy, size * 0.5, { fill: COLORS.paper, stroke: COLORS.good, width: size * 0.1 });
  check(page, cx, cy, size * 0.72);
}

export function check(page, cx, cy, size, { color = COLORS.good } = {}) {
  page.moveTo(cx - size * 0.36, cy);
  page.lineTo(cx - size * 0.08, cy + size * 0.3);
  page.lineTo(cx + size * 0.38, cy - size * 0.32);
  page.paint({ stroke: color, width: size * 0.18 });
}

export function cross(page, cx, cy, size, { color = COLORS.bad } = {}) {
  const d = size * 0.32;
  page.line(cx - d, cy - d, cx + d, cy + d, { stroke: color, width: size * 0.17 });
  page.line(cx + d, cy - d, cx - d, cy + d, { stroke: color, width: size * 0.17 });
}

// Ring um eine Stelle im Bild – zeigt, worauf es gerade ankommt.
export function ring(page, cx, cy, r, { color = COLORS.bad, width = 3.4 } = {}) {
  page.circle(cx, cy, r, { stroke: color, width });
}

// Ganzen Würfel in der Hand drehen (nicht nur eine Ebene): zwei Bögen um das Bild.
export function turnWholeCube(page, cx, cy, size, { color = COLORS.accent } = {}) {
  curvedArrow(page, cx, cy, size * 0.5, 200, 340, { color, width: size * 0.09, head: size * 0.22 });
  curvedArrow(page, cx, cy, size * 0.5, 20, 160, { color, width: size * 0.09, head: size * 0.22 });
}

// „Dreh ihn einmal um" – steht neben Bildern, die die Unterseite zeigen.
export function flipHint(page, cx, cy, size) {
  page.roundRect(cx - size * 0.19, cy - size * 0.19, size * 0.38, size * 0.38, size * 0.08, {
    fill: COLORS.panel,
    stroke: COLORS.ink,
    width: size * 0.045,
  });
  turnWholeCube(page, cx, cy, size);
}
