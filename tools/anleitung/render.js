// Bild-Anleitung: Würfel + Zug-Pfeile für das schriftlose PDF.
//
// Baut auf derselben Kamera und Geometrie wie die App (cube-3d.js), damit die
// Bilder im PDF genauso aussehen wie die Diagramme auf der Website. Neu ist nur
// der Zug-Pfeil: ein einzelner Zug (R, U', F2 …) wird als gebogener Pfeil auf
// der drehenden Scheibe gezeichnet – ganz ohne Buchstaben, damit auch ein Kind,
// das noch nicht liest, der Reihe nach nachdrehen kann.

import {
  SVG_NS, CELL, STICKER_INSET, STICKER_RADIUS, BODY_RADIUS, DEG,
  FACE_ORDER, FACE_NORMAL, FACE_SHADE,
  appendShape, appendSticker, shrink, round, createSvg,
  makeCamera, convexHull, faceQuad, faceOutline,
} from '../../src/cube-3d.js';
import { parseMove, inLayer } from '../../src/cube-state.js';

const SOLVED = { U: 'y', D: 'w', F: 'g', B: 'b', L: 'o', R: 'r' };
const VIEW = { azimuth: 42, elevation: 32 };
const PAD = 0.5; // Rand, damit die Pfeilspitze nicht am Bildrand klebt

// Gelöste Seiten als n×n-Farbgitter – die Referenzstellung, auf der jeder Zug
// gezeigt wird. Die Farben verankern die Blickrichtung (Gelb oben, Grün vorn).
function solvedFaces(n = 3) {
  const faces = {};
  for (const name of FACE_ORDER) faces[name] = Array(n).fill(SOLVED[name].repeat(n));
  return faces;
}

// --- Kleiner Vektor-Werkzeugkasten (Rodrigues-Drehung) ----------------------

function rotationMatrix(axis, deg) {
  const a = deg * DEG;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const t = 1 - c;
  const [x, y, z] = axis;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}
function mul(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function len2(a) { return Math.hypot(a[0], a[1]); }
function norm2(a) { const l = len2(a) || 1; return [a[0] / l, a[1] / l]; }

// „Im Uhrzeigersinn von außen" wie in cube-state.js – v um die Normale n
// gedreht. Damit ist die Pfeilrichtung garantiert dieselbe wie die echte
// Drehung im Abspieler, statt ein zweites Mal von Hand hergeleitet.
function turnCW(v, n) {
  const d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
  return [
    n[0] * d - (n[1] * v[2] - n[2] * v[1]),
    n[1] * d - (n[2] * v[0] - n[0] * v[2]),
    n[2] * d - (n[0] * v[1] - n[1] * v[0]),
  ];
}

// Welches Vorzeichen hat eine Rechte-Hand-Drehung (rotationMatrix) um axis, das
// derselben Richtung entspricht wie turnCW? Einmal an einem Testvektor geeicht.
function cwHandSign(axis) {
  // Ein Vektor quer zur Achse.
  let w = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const along = w[0] * axis[0] + w[1] * axis[1] + w[2] * axis[2];
  w = [w[0] - axis[0] * along, w[1] - axis[1] * along, w[2] - axis[2] * along];
  const cw = turnCW(w, axis);
  const step = mul(rotationMatrix(axis, 1), w);
  const toward = (step[0] - w[0]) * (cw[0] - w[0]) + (step[1] - w[1]) * (cw[1] - w[1]) + (step[2] - w[2]) * (cw[2] - w[2]);
  return toward >= 0 ? 1 : -1;
}

// --- Der gelöste Würfelkörper (wie buildCubeSvg, aber immer alle Farben) -----

function drawCubeBody(svg, cam, faces, n) {
  const to2d = (pts) => pts.map(([x, y, z]) => cam.project(x, y, z));
  const visible = FACE_ORDER.filter(cam.visible);

  const outline = convexHull(
    [0, n].flatMap((x) => [0, n].flatMap((y) => [0, n].map((z) => cam.project(x, y, z))))
  );
  const body = appendShape(svg, outline, 'cd-body', BODY_RADIUS);

  for (const name of visible) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const quad = shrink(to2d(faceQuad(name, r, c, n)), STICKER_INSET);
        appendSticker(svg, quad, faces[name][r][c], STICKER_RADIUS);
      }
    }
  }

  // Schattierung über der Silhouette, wie in der App.
  const shaded = visible.filter((name) => FACE_SHADE[name]);
  if (shaded.length) {
    const id = `bclip-${Math.random().toString(36).slice(2)}`;
    const defs = document.createElementNS(SVG_NS, 'defs');
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.setAttribute('id', id);
    clip.appendChild(body.cloneNode());
    defs.appendChild(clip);
    svg.appendChild(defs);
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('clip-path', `url(#${id})`);
    for (const name of shaded) appendShape(g, to2d(faceOutline(name, n)), `cd-shade ${FACE_SHADE[name]}`);
    svg.appendChild(g);
  }
  return { visible, to2d };
}

// --- Der Zug-Pfeil ----------------------------------------------------------

// Ein Sticker der drehenden Scheibe wandert auf einem Kreisbogen um die
// Drehachse. Wir suchen den am besten sichtbaren Sticker der Scheibe, verfolgen
// seine Mitte über ein paar Grad Drehung und zeichnen daraus einen Bogen mit
// Spitze – in genau der Richtung, in die sich die Scheibe dreht.
function drawMoveArrow(svg, cam, move, n) {
  const { face, axis, turns } = parseMove(move);
  // Richtung direkt aus turnCW geeicht (siehe cwHandSign) – turns>0 ist im
  // Uhrzeigersinn von außen, turns<0 dagegen.
  const dir = (turns === 2 ? 1 : Math.sign(turns)) * cwHandSign(axis);
  const sweep = turns === 2 ? 150 : 90; // wie weit der Bogen zeigt
  const cx = n / 2;

  // Mittelpunkt eines Stickers (r,c) auf Seite g im Raum.
  const stickerCenter = (g, r, c) => {
    const q = faceQuad(g, r, c, n);
    return [0, 1, 2].map((k) => (q[0][k] + q[1][k] + q[2][k] + q[3][k]) / 4);
  };
  // Zu welchem Stein gehört dieser Sticker? Koordinate -> Zellindex 0..2.
  const cellOf = (v) => v.map((coord) => Math.max(0, Math.min(n - 1, Math.floor(coord - 1e-6))));

  // Kandidaten: sichtbare Sticker der Scheibe, aber nicht auf der Drehfläche
  // selbst (dort dreht sich der Mittelpunkt kaum, der Bogen wäre winzig).
  let best = null;
  for (const g of FACE_ORDER.filter(cam.visible)) {
    if (g === face) continue;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const center = stickerCenter(g, r, c);
        if (!inLayer(cellOf(center), face)) continue;
        // Abstand von der Drehachse: weiter außen = größerer, klarer Bogen.
        const rel = [center[0] - cx, center[1] - cx, center[2] - cx];
        const along = rel[0] * axis[0] + rel[1] * axis[1] + rel[2] * axis[2];
        const radial = Math.hypot(rel[0] - axis[0] * along, rel[1] - axis[1] * along, rel[2] - axis[2] * along);
        // Sticker, die frontal zur Kamera stehen, zeigen den Bogen am besten.
        const facing = cam.facesCamera(center, FACE_NORMAL[g]) ? 1 : 0;
        const score = radial + facing * 0.6;
        if (!best || score > best.score) best = { center, score };
      }
    }
  }
  if (!best) return;

  // Den Mittelpunkt über den Bogen drehen und dabei projizieren.
  const samples = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const ang = dir * sweep * (i / steps); // dir ist auf turnCW geeicht
    const m = rotationMatrix(axis, ang);
    const rel = [best.center[0] - cx, best.center[1] - cx, best.center[2] - cx];
    const p = mul(m, rel);
    samples.push(cam.project(p[0] + cx, p[1] + cx, p[2] + cx));
  }

  // Glatter Pfad durch die projizierten Punkte.
  const d = samples.reduce((acc, p, i) => acc + (i ? 'L' : 'M') + `${round(p[0])} ${round(p[1])}`, '');

  // Pfeilspitze am Ende, entlang der letzten Bewegungsrichtung.
  const tip = samples[samples.length - 1];
  const prev = samples[samples.length - 2];
  const t = norm2(sub(tip, prev));
  const head = CELL * 0.85;
  const wing = (deg) => {
    const a = deg * DEG;
    const rx = t[0] * Math.cos(a) - t[1] * Math.sin(a);
    const ry = t[0] * Math.sin(a) + t[1] * Math.cos(a);
    return `${round(tip[0] - rx * head)} ${round(tip[1] - ry * head)}`;
  };
  const headPath = `M${round(tip[0])} ${round(tip[1])}L${wing(28)}L${wing(-28)}Z`;

  // Zweimal zeichnen: heller Halo, damit der Pfeil über jeder Farbe sichtbar
  // bleibt, dann die dunkle Linie darüber.
  const line = (cls, w) => {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('class', cls);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke-width', w);
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(el);
  };
  const headEl = (cls, w) => {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', headPath);
    el.setAttribute('class', cls);
    if (w) { el.setAttribute('stroke-width', w); el.setAttribute('stroke-linejoin', 'round'); }
    svg.appendChild(el);
  };
  line('arrow-halo', CELL * 0.62);
  headEl('arrow-halo-fill', CELL * 0.62);
  line('arrow-body', CELL * 0.32);
  headEl('arrow-body-fill', 0);
}

// --- Öffentlich -------------------------------------------------------------

// Ein Würfelbild mit einem Zug-Pfeil.
export function buildMoveSvg(move, n = 3) {
  const cam = makeCamera(n, CELL, VIEW.azimuth, VIEW.elevation, PAD);
  const svg = createSvg(round(cam.width), round(cam.height), `Zug ${move}`);
  drawCubeBody(svg, cam, solvedFaces(n), n);
  drawMoveArrow(svg, cam, move, n);
  return svg;
}
