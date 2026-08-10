// Würfelbilder, die nicht lügen können.
//
// Die Zustände der Anleitung entstehen nicht von Hand, sondern aus echten
// Zügen: Wir nehmen den gelösten Würfel aus src/cube-state.js (dieselbe
// Mechanik, die auf der Website die Algorithmen abspielt), lassen eine
// Zugfolge darüberlaufen und lesen die 54 Felder ab. Was auf dem Blatt steht,
// ist damit garantiert eine Stellung, die es wirklich gibt.
//
// Eine Maske blendet aus, was für den Schritt egal ist – graue Felder sind auf
// der Website und hier dieselbe Aussage: „Dieser Sticker spielt jetzt keine
// Rolle."

import { createCube, applyMoves } from '../../src/cube-state.js';

// Vom Gitterplatz eines Steins (x rechts, y oben, z vorn) auf Zeile/Spalte
// der Seite, in der Leserichtung des Netzes.
const CELL_OF = {
  U: ([x, , z]) => [z, x],
  D: ([x, , z]) => [2 - z, x],
  F: ([x, y]) => [2 - y, x],
  B: ([x, y]) => [2 - y, 2 - x],
  L: ([, y, z]) => [2 - y, z],
  R: ([, y, z]) => [2 - y, 2 - z],
};

export function facelets(moves = []) {
  const cubies = createCube();
  applyMoves(cubies, moves);
  const faces = { U: [], D: [], F: [], B: [], L: [], R: [] };
  for (const face of Object.keys(faces)) faces[face] = Array(9).fill('.');
  for (const cubie of cubies) {
    for (const [face, color] of Object.entries(cubie.stickers)) {
      const [r, c] = CELL_OF[face](cubie.pos);
      faces[face][r * 3 + c] = color;
    }
  }
  return faces;
}

// Wo eine Kante des weißen Kreuzes auf der Unterseite liegt – in der
// Leserichtung des Netzes ist die erste D-Zeile die vordere.
const CROSS_CELL = { F: [0, 1], R: [1, 2], B: [2, 1], L: [1, 0] };

// Nur die schon gepflanzten Blütenblätter zeigen, der Rest bleibt grau.
export const crossSlots = (faces) => (f, r, c) => {
  if (f === 'D') return (r === 1 && c === 1) || faces.some((n) => CROSS_CELL[n][0] === r && CROSS_CELL[n][1] === c);
  if (f === 'U') return false;
  return faces.includes(f) && r === 2 && c === 1;
};

// Masken: welche Sticker der Schritt überhaupt meint.
export const KEEP = {
  all: () => true,
  whiteCross: crossSlots(['F', 'R', 'B', 'L']),
  firstLayer: (f, r) => f === 'D' || (f !== 'U' && r === 2),
  twoLayers: (f, r) => f === 'D' || (f !== 'U' && r >= 1),
};

// Netz im Quellformat von src/cube-diagram.js (```cube-net```).
export function net(moves = [], keep = KEEP.all) {
  const faces = facelets(moves);
  const cell = (f, i) => (keep(f, Math.floor(i / 3), i % 3) ? faces[f][i] : '.');
  const row = (f, r) => [0, 1, 2].map((c) => cell(f, r * 3 + c)).join('');
  const lines = [];
  for (let r = 0; r < 3; r += 1) lines.push(row('U', r));
  for (let r = 0; r < 3; r += 1) lines.push(['L', 'F', 'R', 'B'].map((f) => row(f, r)).join(' '));
  for (let r = 0; r < 3; r += 1) lines.push(row('D', r));
  return lines.join('\n');
}
