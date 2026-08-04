// Die gemeinsame Grundlage aller Würfelgrafiken: eine Kamera, die den Würfel
// schräg auf eine Ecke abbildet, und die Formen, aus denen ein Sticker wird.
//
// Zwei Dinge bauen darauf auf:
//   cube-diagram.js  – die stehenden Diagramme aus ```cube- und ```cube-net.
//   alg-player.js    – der Würfel, der einen Algorithmus Zug für Zug dreht.
//
// Der Würfel füllt [0,S]³ mit
//   x: links -> rechts (x=0 ist L, x=S ist R)
//   y: unten -> oben   (y=0 ist D, y=S ist U)
//   z: hinten -> vorn  (z=0 ist B, z=S ist F)

export const SVG_NS = 'http://www.w3.org/2000/svg';

export const CUBE_STICKER_CLASS = {
  y: 'cd-y', r: 'cd-r', g: 'cd-g', b: 'cd-b', o: 'cd-o', w: 'cd-w', '.': 'cd-n',
};

export const FACE_NORMAL = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};
export const FACE_ORDER = ['U', 'D', 'F', 'B', 'L', 'R'];

// Licht von schräg oben: die Deckfläche bleibt hell, die Seiten stehen
// unterschiedlich tief im Schatten. Erst das macht aus drei aneinandergelegten
// Vierecken einen Körper. Die Unterseite bleibt trotzdem hell genug, dass ein
// weißer Sticker in der Gegenansicht noch weiß aussieht.
export const FACE_SHADE = {
  U: '', D: 'cd-shade-soft', F: 'cd-shade-soft', B: 'cd-shade-soft',
  R: 'cd-shade-mid', L: 'cd-shade-mid',
};

export const CELL = 21; // Kantenlänge eines Stickers in viewBox-Einheiten
export const STICKER_INSET = 0.86; // Fuge zwischen den Stickern
export const STICKER_RADIUS = CELL * 0.22;
export const BODY_RADIUS = CELL * 0.3;

export const DEG = Math.PI / 180;
const CAM_DISTANCE = 6; // Kameraabstand in Kantenlängen – Perspektive, aber dezent

export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function round(v) {
  return Math.round(v * 100) / 100;
}

// ---------------------------------------------------------------------------
// Formen
// ---------------------------------------------------------------------------

// Projiziert ist kein Sticker mehr ein Rechteck – gezeichnet wird durchweg das
// Viereck, das die Kamera liefert.
export function appendShape(target, points, className, radius = 0) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', shapePath(points, radius));
  p.setAttribute('class', className);
  target.appendChild(p);
  return p;
}

export function appendSticker(target, points, ch, radius) {
  appendShape(target, points, `cd ${CUBE_STICKER_CLASS[ch] || 'cd-n'}`, radius);
}

// Ecken überschleifen: echte Würfel sind gespritztes Plastik, keine
// ausgeschnittenen Papierquadrate. Jede Ecke wird ein Stück vor dem Eckpunkt
// verlassen und ein Stück dahinter wieder aufgenommen, dazwischen zieht eine
// quadratische Kurve durch. radius = 0 liefert wieder das reine Polygon.
export function shapePath(points, radius) {
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
export function shrink(points, k) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

// SVG mit fester Größe: width/height als Attribut, damit auch Browser ohne
// „intrinsisches Seitenverhältnis aus der viewBox" (ältere iOS-Safaris) die
// Grafik nicht auf Höhe 0 zusammenfallen lassen. Die CSS-Breite skaliert sie.
export function createSvg(w, h, label) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  return svg;
}

// ---------------------------------------------------------------------------
// Würfelgeometrie
// ---------------------------------------------------------------------------

// Räumliche Lage eines Stickers als Viereck. r/c sind Zeile/Spalte so, wie sie
// im Netz-Quelltext stehen. Die Umrechnung folgt aus dem Kreuz-Layout: U liegt
// über F, also ist U-Zeile 0 hinten und D-Zeile 0 vorn; der Gürtel läuft von
// links nach rechts durch L F R B, also zeigt Spalte 0 bei L nach hinten, bei R
// nach vorn und bei B nach rechts. Nachgerechnet wird das nicht hier, sondern
// an den geteilten Kanten: zwei im Netz benachbarte Sticker müssen genau zwei
// Eckpunkte gemeinsam haben.
export function faceQuad(name, r, c, S) {
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
export function faceOutline(name, S) {
  switch (name) {
    case 'U': return [[0, S, 0], [S, S, 0], [S, S, S], [0, S, S]];
    case 'D': return [[0, 0, 0], [S, 0, 0], [S, 0, S], [0, 0, S]];
    case 'F': return [[0, S, S], [S, S, S], [S, 0, S], [0, 0, S]];
    case 'B': return [[0, S, 0], [S, S, 0], [S, 0, 0], [0, 0, 0]];
    case 'R': return [[S, S, 0], [S, S, S], [S, 0, S], [S, 0, 0]];
    default: return [[0, S, 0], [0, S, S], [0, 0, S], [0, 0, 0]]; // L
  }
}

// ---------------------------------------------------------------------------
// Kamera
// ---------------------------------------------------------------------------

// Der Blick auf eine Würfelecke, schräg von oben – so, wie der Würfel in der
// Hand liegt. Zentralprojektion statt Isometrie: erst die leicht
// zusammenlaufenden Kanten machen aus dem Muster einen Gegenstand.
//
// azimuth dreht die Kamera um die Hochachse (0° = frontal auf F, 90° = auf R),
// elevation hebt sie an (positiv = von oben, negativ = von unten).
// padCells ist der Rand um die Silhouette, in Zellbreiten. Der Player braucht
// mehr davon: eine drehende Ebene schwingt über den ruhenden Umriss hinaus.
export function makeCamera(S, cell, azimuth, elevation, padCells = 0.12) {
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
  const pad = cell * padCells;
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
    return facesCamera(center, nrm);
  };

  // Dasselbe für eine beliebige Fläche im Raum – der Player dreht einzelne
  // Steine, deren Flächen in keiner der sechs Würfelrichtungen mehr liegen.
  const facesCamera = (point, normal) => {
    const toCam = [camPos[0] - point[0], camPos[1] - point[1], camPos[2] - point[2]];
    return dot3(normal, toCam) > 0;
  };

  // Linearteil der Projektion: wohin zeigt ein Einheitsvektor im Bild?
  const direction = (v) => {
    const o = raw(c, c, c);
    const p = raw(c + v[0], c + v[1], c + v[2]);
    return [p[0] - o[0], p[1] - o[1]];
  };

  return {
    width: maxX - minX, height: maxY - minY,
    camPos, project, visible, facesCamera, direction,
  };
}

// Konvexe Hülle (Andrew) der acht projizierten Ecken: das ist die Silhouette
// des Würfels. Sie liegt als ein einziger Körper unter den Stickern – daraus
// entstehen die Fugen, und ihre abgerundeten Ecken sind die Kanten des Würfels.
export function convexHull(points) {
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
