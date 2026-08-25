// Flache, minimalistische Notation: der Würfel als 2D-Quadrat mit Pfeilen.
//
// Blick von vorn auf den Würfel – so, wie man ihn real in der Hand hält. Das
// Quadrat ist die Vorderseite (F). Gelb oben und die Rückseite sieht man dabei
// nicht; die einzige verdeckte Seite ist B, und die kommt in keinem Anfänger-
// Algorithmus vor. Ein Seiten-Zug ist ein gerader Pfeil an der passenden Kante,
// die Vorderseite selbst (F) ein runder Pfeil. Alle Richtungen sind gegen
// applyMove aus src/cube-state.js geprüft:
//   F  rund im Uhrzeigersinn      F' rund gegen den Uhrzeigersinn
//   U  obere Kante   links        U' obere Kante   rechts
//   D  untere Kante  rechts       D' untere Kante  links
//   R  rechte Kante  hoch         R' rechte Kante  runter
//   L  linke Kante   runter       L' linke Kante   hoch
// Eine 2 (z. B. R2) ist ein Doppelpfeil.

const NS = 'http://www.w3.org/2000/svg';

const FILL = {
  y: 'hsl(46 92% 56%)', r: 'hsl(4 66% 55%)', g: 'hsl(135 42% 45%)',
  b: 'hsl(215 60% 52%)', o: 'hsl(27 86% 55%)', w: 'hsl(40 30% 92%)',
  k: 'hsl(25 25% 14%)', n: 'hsl(35 14% 82%)', '.': 'transparent',
};
const INK = 'hsl(25 25% 14%)';

function svg(w, h) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', w); s.setAttribute('height', h);
  return s;
}
function rect(parent, x, y, w, h, fill, stroke, sw, rx = 0) {
  const r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', x); r.setAttribute('y', y);
  r.setAttribute('width', w); r.setAttribute('height', h);
  if (rx) r.setAttribute('rx', rx);
  r.setAttribute('fill', fill);
  if (stroke) { r.setAttribute('stroke', stroke); r.setAttribute('stroke-width', sw); }
  parent.appendChild(r); return r;
}
function path(parent, d, { fill = 'none', stroke = INK, sw = 0 } = {}) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d); p.setAttribute('fill', fill);
  if (sw) { p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', sw); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); }
  parent.appendChild(p); return p;
}

// --- Flaches Würfel-Quadrat -------------------------------------------------

// rows: Array aus n Strings mit n Zeichen (Farbbuchstaben oder '.'/'k').
// Ein Quadrat mit n×n-Raster; gefüllte Zellen zeigen Farben, '.' bleibt leer.
export function flatFace(rows, { cell = 26, border = 4 } = {}) {
  const n = rows.length;
  const size = cell * n;
  const s = svg(size + border, size + border);
  const o = border / 2;
  // Zellen. Gefüllte Zellen bekommen einen feinen Rand, damit auch eine weiße
  // Fläche als Kachel sichtbar bleibt (Weiß ≈ Papierfarbe).
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = rows[r][c];
      const filled = ch !== '.' && ch !== undefined;
      rect(s, o + c * cell, o + r * cell, cell, cell, FILL[ch] ?? 'transparent',
        filled ? 'hsl(25 15% 45% / .55)' : null, filled ? 1 : 0);
    }
  }
  // Raster
  for (let i = 1; i < n; i++) {
    path(s, `M${o + i * cell} ${o} L${o + i * cell} ${o + size}`, { sw: 1.5, stroke: 'hsl(25 15% 45%)' });
    path(s, `M${o} ${o + i * cell} L${o + size} ${o + i * cell}`, { sw: 1.5, stroke: 'hsl(25 15% 45%)' });
  }
  rect(s, o, o, size, size, 'none', INK, border, 3);
  return s;
}

// --- Zug-Glyph --------------------------------------------------------------

// Tabelle: welche Kante, welche Richtung. dir: 'up'|'down'|'left'|'right'
// (gerader Pfeil an einer Kante) oder 'cw'|'ccw' (runder Pfeil = U).
const EDGE = {
  R: ['right', 'up'], "R'": ['right', 'down'], R2: ['right', 'updown'],
  L: ['left', 'down'], "L'": ['left', 'up'], L2: ['left', 'updown'],
  U: ['top', 'left'], "U'": ['top', 'right'], U2: ['top', 'leftright'],
  D: ['bottom', 'right'], "D'": ['bottom', 'left'], D2: ['bottom', 'leftright'],
};
const SPIN = { F: 'cw', "F'": 'ccw', F2: 'cw2' };

function arrowhead(parent, x, y, ang, k = 7) {
  const a = ang * Math.PI / 180;
  const wing = (t) => {
    const w = (ang + t) * Math.PI / 180;
    return `${x - Math.cos(w) * k} ${y - Math.sin(w) * k}`;
  };
  path(parent, `M${x} ${y} L${wing(26)} M${x} ${y} L${wing(-26)}`, { sw: 4 });
}

// Gerader Pfeil entlang einer Kante.
function straight(s, edge, dir, box) {
  const { x, y, w, h } = box;
  const gap = 9, sw = 5;
  let x1, y1, x2, y2, headAng;
  if (edge === 'right' || edge === 'left') {
    const px = edge === 'right' ? x + w + gap : x - gap;
    const top = y + h * 0.12, bot = y + h * 0.88;
    if (dir === 'up') { x1 = px; y1 = bot; x2 = px; y2 = top; headAng = -90; }
    else if (dir === 'down') { x1 = px; y1 = top; x2 = px; y2 = bot; headAng = 90; }
    else { x1 = px; y1 = top; x2 = px; y2 = bot; } // updown
    path(s, `M${x1} ${y1} L${x2} ${y2}`, { sw });
    if (dir === 'updown') { arrowhead(s, px, top, -90); arrowhead(s, px, bot, 90); }
    else arrowhead(s, x2, y2, headAng);
  } else {
    const py = edge === 'bottom' ? y + h + gap : y - gap;
    const l = x + w * 0.12, rr = x + w * 0.88;
    if (dir === 'right') { x1 = l; y1 = py; x2 = rr; y2 = py; headAng = 0; }
    else if (dir === 'left') { x1 = rr; y1 = py; x2 = l; y2 = py; headAng = 180; }
    else { x1 = l; y1 = py; x2 = rr; y2 = py; }
    path(s, `M${x1} ${y1} L${x2} ${y2}`, { sw });
    if (dir === 'leftright') { arrowhead(s, l, py, 180); arrowhead(s, rr, py, 0); }
    else arrowhead(s, x2, y2, headAng);
  }
}

// Runder Pfeil (F) im/gegen den Uhrzeigersinn, mittig im Quadrat.
// 'cw2' zeichnet einen fast vollen Kreis für die Doppeldrehung (F2).
function spin(s, sense, box) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) * 0.3;
  const cw = sense !== 'ccw';
  const wide = sense === 'cw2';
  const a0 = wide ? -100 : (cw ? -60 : 240);
  const a1 = wide ? 250 : (cw ? 210 : -150);
  const steps = 24; const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  path(s, pts.reduce((d, p, i) => d + (i ? 'L' : 'M') + `${p[0].toFixed(1)} ${p[1].toFixed(1)}`, ''), { sw: 5 });
  const end = pts[pts.length - 1], prev = pts[pts.length - 2];
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180 / Math.PI;
  arrowhead(s, end[0], end[1], ang);
}

// Ein einzelner Zug als flaches Quadrat mit Pfeil.
export function moveGlyph(move, { cell = 26, border = 4 } = {}) {
  const n = 3;
  const size = cell * n;
  const pad = 22; // Platz für den äußeren Pfeil
  const s = svg(size + pad * 2, size + pad * 2);
  const box = { x: pad, y: pad, w: size, h: size };

  // leeres Raster
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) rect(s, pad + c * cell, pad + r * cell, cell, cell, 'transparent', null, 0);
  for (let i = 1; i < n; i++) {
    path(s, `M${pad + i * cell} ${pad} L${pad + i * cell} ${pad + size}`, { sw: 1.5, stroke: 'hsl(25 15% 45%)' });
    path(s, `M${pad} ${pad + i * cell} L${pad + size} ${pad + i * cell}`, { sw: 1.5, stroke: 'hsl(25 15% 45%)' });
  }

  if (SPIN[move]) {
    spin(s, SPIN[move], box);
  } else if (EDGE[move]) {
    const [edge, dir] = EDGE[move];
    // betroffene Reihe/Spalte dezent hervorheben (neutrales Grau)
    const hl = 'hsl(25 12% 55% / .16)';
    if (edge === 'right') rect(s, pad + 2 * cell, pad, cell, size, hl, null, 0);
    if (edge === 'left') rect(s, pad, pad, cell, size, hl, null, 0);
    if (edge === 'bottom') rect(s, pad, pad + 2 * cell, size, cell, hl, null, 0);
    if (edge === 'top') rect(s, pad, pad, size, cell, hl, null, 0);
    straight(s, edge, dir, box);
  }
  rect(s, pad, pad, size, size, 'none', INK, border, 3);
  return s;
}
