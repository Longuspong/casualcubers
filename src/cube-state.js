import { FACE_NORMAL, dot3 } from './cube-3d.js';

// Der Würfel als 26 Steine (der Kern in der Mitte wird nie gesehen und fehlt).
// Ein Stein kennt nur zwei Dinge:
//   pos      – sein Gitterplatz [x,y,z] mit 0..2, in derselben Achsenlage wie
//              cube-3d.js (x nach rechts, y nach oben, z nach vorn).
//   stickers – seine Aufkleber, abgelegt unter der Würfelseite, in die sie
//              gerade zeigen: { U: 'y', F: 'g' }.
// Ein Zug dreht beides – Platz und Aufkleberrichtungen – um dieselbe Achse.
// Damit braucht es keine 54-Felder-Tabelle und keine Umrechnung: Was gezeichnet
// wird, steht direkt am Stein.

// Farbschema wie in den Diagrammen: Gelb oben, Weiß unten, Grün vorn.
const SOLVED = { U: 'y', D: 'w', F: 'g', B: 'b', L: 'o', R: 'r' };

// Welche Scheibe ein Zug mitnimmt, und um welche Seitennormale er dreht.
// M ist die mittlere Scheibe und läuft in Richtung L – so ist die Notation
// vereinbart, und so lesen es die Roux-Lektionen.
const MOVE_AXIS = { U: 'U', D: 'D', F: 'F', B: 'B', R: 'R', L: 'L', M: 'L' };

export function createCube() {
  const cubies = [];
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        if (x === 1 && y === 1 && z === 1) continue; // Kern
        const stickers = {};
        if (y === 2) stickers.U = SOLVED.U;
        if (y === 0) stickers.D = SOLVED.D;
        if (z === 2) stickers.F = SOLVED.F;
        if (z === 0) stickers.B = SOLVED.B;
        if (x === 2) stickers.R = SOLVED.R;
        if (x === 0) stickers.L = SOLVED.L;
        cubies.push({ pos: [x, y, z], stickers });
      }
    }
  }
  return cubies;
}

// Gehört der Stein zur Scheibe, die dieser Zug dreht? Die Scheibe ist eine
// Lage im Raum, kein Satz Steine – deshalb funktioniert derselbe Test auch
// rückwärts, wenn ein Zug wieder zurückgenommen wird.
export function inLayer(pos, face) {
  switch (face) {
    case 'U': return pos[1] === 2;
    case 'D': return pos[1] === 0;
    case 'F': return pos[2] === 2;
    case 'B': return pos[2] === 0;
    case 'R': return pos[0] === 2;
    case 'L': return pos[0] === 0;
    default: return pos[0] === 1; // M
  }
}

// "R'" -> { face: 'R', layer: 'R', axis: [1,0,0], turns: -1 }
// turns zählt Vierteldrehungen im Uhrzeigersinn, von außen auf die Seite
// gesehen: 1 für R, 2 für R2, -1 für R'.
export function parseMove(move) {
  const face = move[0];
  const turns = move.endsWith("'") ? -1 : move.endsWith('2') ? 2 : 1;
  return { face, layer: face, axis: FACE_NORMAL[MOVE_AXIS[face]], turns };
}

export function invertMove(move) {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move[0];
  return `${move}'`;
}

// Vektor um die Achse n im Uhrzeigersinn drehen (von außen auf die Seite
// gesehen, also mathematisch −90°): v' = n(n·v) − (n × v).
function turnCW(v, n) {
  const d = dot3(n, v);
  return [
    n[0] * d - (n[1] * v[2] - n[2] * v[1]),
    n[1] * d - (n[2] * v[0] - n[0] * v[2]),
    n[2] * d - (n[0] * v[1] - n[1] * v[0]),
  ];
}

const NAME_OF_NORMAL = { '0,1,0': 'U', '0,-1,0': 'D', '0,0,1': 'F', '0,0,-1': 'B', '1,0,0': 'R', '-1,0,0': 'L' };

export function applyMove(cubies, move) {
  const { layer, axis, turns } = parseMove(move);
  const quarters = ((turns % 4) + 4) % 4;

  for (let q = 0; q < quarters; q++) {
    for (const cubie of cubies) {
      // Steine der Scheibe bleiben in der Scheibe, fremde kommen nie hinein –
      // deshalb darf hier an Ort und Stelle gedreht werden.
      if (!inLayer(cubie.pos, layer)) continue;
      const rel = turnCW([cubie.pos[0] - 1, cubie.pos[1] - 1, cubie.pos[2] - 1], axis);
      cubie.pos = [rel[0] + 1, rel[1] + 1, rel[2] + 1];

      const moved = {};
      for (const [name, color] of Object.entries(cubie.stickers)) {
        moved[NAME_OF_NORMAL[turnCW(FACE_NORMAL[name], axis).join(',')]] = color;
      }
      cubie.stickers = moved;
    }
  }
}

export function applyMoves(cubies, moves) {
  for (const move of moves) applyMove(cubies, move);
}

// Die Züge rückwärts und jeder einzelne umgedreht – aus "R U R'" wird
// "R U' R'". Auf den gelösten Würfel angewandt ergibt das die Stellung, die
// der Algorithmus auflöst: der Fall, um den es in der Lektion geht.
export function inverseMoves(moves) {
  return moves.slice().reverse().map(invertMove);
}
