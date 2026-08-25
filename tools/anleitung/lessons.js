// Die neun Lektionen der Anfänger-Methode als flache Bild-Bausteine.
//
// Reihenfolge und Inhalte wie in content/beginner.md. Alles ist flach gedacht:
// Blick von vorn auf den Würfel. Ziel-/Fall-Bilder sind kleine Quadrate
// (3×3-Gitter, Farbbuchstaben y/w/g/r/b/o, n = neutral/grau, . = leer, k =
// schwarz), Zugfolgen sind Ketten aus flachen Zug-Quadraten mit Pfeil.

export const LESSONS = [
  {
    n: 1,
    accent: 'y',
    // Kennenlernen: Ziel aller Ziele – jede Seite einfarbig.
    goals: [['yyy', 'yyy', 'yyy'], ['ggg', 'ggg', 'ggg'], ['rrr', 'rrr', 'rrr']],
    algs: [],
  },
  {
    n: 2,
    accent: 'g',
    // Notation als Bild-Vokabelblatt (siehe generate.js).
    isVocab: true,
    goals: [],
    algs: [],
  },
  {
    n: 3,
    accent: 'w',
    // Weißes Kreuz: erst die Blume (Gelb-Mitte, weiße Blätter), dann das Kreuz.
    goals: [['kwk', 'wyw', 'kwk'], ['kwk', 'www', 'kwk']],
    algs: [],
  },
  {
    n: 4,
    accent: 'w',
    // Erste Ebene: weiße Seite komplett.
    goals: [['www', 'www', 'www']],
    algs: [{ moves: "R U R' U'", bracket: 'repeat' }],
  },
  {
    n: 5,
    accent: 'g',
    // Zwei Ebenen: untere zwei Reihen der Vorderseite voll, oben noch offen.
    goals: [['nnn', 'ggg', 'ggg']],
    algs: [
      { moves: "U R U' R' U' F' U F", bracket: 1, hint: '→' },
      { moves: "U' L' U L U F U' F'", bracket: 1, hint: '←' },
    ],
  },
  {
    n: 6,
    accent: 'y',
    // Gelbes Kreuz. Fälle Punkt / L / Linie mit Wiederhol-Zahl.
    goals: [['kyk', 'yyy', 'kyk']],
    stages: [
      { flat: ['nnn', 'nyn', 'nnn'], times: 3 },
      { flat: ['nyn', 'yyn', 'nnn'], times: 2 },
      { flat: ['nnn', 'yyy', 'nnn'], times: 1 },
    ],
    algs: [{ moves: "F R U R' U' F'", bracket: 'repeat' }],
  },
  {
    n: 7,
    accent: 'r',
    // Kanten sortieren. Ziel: gelbes Kreuz, jede Kante an ihrem Platz.
    goals: [['kyk', 'yyy', 'kyk']],
    algs: [{ moves: "R U R' U R U2 R' U", bracket: 'repeat' }],
  },
  {
    n: 8,
    accent: 'b',
    // Ecken an ihre Plätze (noch verdreht -> Ecken grau).
    goals: [['nyn', 'yyy', 'nyn']],
    algs: [{ moves: "U R U' L' U R' U' L", bracket: 'repeat' }],
  },
  {
    n: 9,
    accent: 'y',
    // Ecken drehen -> gelbe Seite komplett, Würfel fertig.
    goals: [['yyy', 'yyy', 'yyy']],
    algs: [{ moves: "R' D' R D", bracket: 2, repeat: true }],
  },
];

// Die Grundzüge fürs Vokabelblatt (Lektion 2). B fehlt bewusst – kein Anfänger-
// Algorithmus braucht die Rückseite.
export const VOCAB = ['F', "F'", 'R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'R2', 'F2'];
