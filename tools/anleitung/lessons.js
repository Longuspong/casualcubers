// Die neun Lektionen der Anfänger-Methode als Bild-Bausteine.
//
// Reihenfolge und Inhalte spiegeln content/beginner.md. Für das schriftlose PDF
// zählt nur zweierlei pro Lektion: das Ziel-Bild (wohin) und die Zugfolgen
// (wie) – beides rein grafisch. Die Ziel-Diagramme sind dieselbe ASCII-Notation
// wie in der App (```cube / ```cube-net), gerendert über cube-diagram.js.

// Farbtupfer als „das ist gemeint"-Symbol, wenn ein Schritt sich auf eine Farbe
// bezieht (z. B. gelbes Kreuz).
export const COLORS = { y: 'gelb', w: 'weiß', g: 'grün', r: 'rot', b: 'blau', o: 'orange' };

export const LESSONS = [
  {
    n: 1,
    accent: 'y',
    // Kennenlernen: der ganze, gelöste Würfel als Ziel aller Ziele.
    goals: [
      { kind: 'cube-net', art: 'yyy\nyyy\nyyy\nooo ggg rrr bbb\nooo ggg rrr bbb\nooo ggg rrr bbb\nwww\nwww\nwww' },
    ],
    algs: [],
  },
  {
    n: 2,
    accent: 'g',
    // Notation als Vokabelblatt – alle sechs Grundzüge plus ' und 2.
    // Wird gesondert als Zug-Galerie gerendert (siehe generate.js).
    isVocab: true,
    goals: [],
    algs: [],
  },
  {
    n: 3,
    accent: 'w',
    // Weißes Kreuz: erst Blume (Draufsicht), dann Kreuz unten (ganzer Würfel).
    goals: [
      { kind: 'cube', art: '. b .\n. . w . .\no w y w r\n. . w . .\n. g .' },
      { kind: 'cube-net', art: '...\n...\n...\n... ... ... ...\n.o. .g. .r. .b.\n.o. .g. .r. .b.\n.w.\nwww\n.w.' },
    ],
    algs: [],
  },
  {
    n: 4,
    accent: 'w',
    goals: [
      { kind: 'cube-net', art: '...\n...\n...\n... ... ... ...\n.o. .g. .r. .b.\nooo ggg rrr bbb\nwww\nwww\nwww' },
    ],
    algs: [
      { moves: "R U R' U'", repeat: true },
    ],
  },
  {
    n: 5,
    accent: 'g',
    goals: [
      { kind: 'cube-net', art: '...\n...\n...\n... ... ... ...\nooo ggg rrr bbb\nooo ggg rrr bbb\nwww\nwww\nwww' },
    ],
    algs: [
      { moves: "U R U' R' U' F' U F", badge: 'right' },
      { moves: "U' L' U L U F U' F'", badge: 'left' },
    ],
  },
  {
    n: 6,
    accent: 'y',
    // Zielmuster: Punkt -> L -> Linie -> Kreuz. Zug F R U R' U' F'.
    goals: [
      { kind: 'cube', art: '. . .\n. . y . .\n. y y y .\n. . y . .\n. . .' },
    ],
    stages: [
      { kind: 'cube', art: '. . .\n. . . . .\n. . y . .\n. . . . .\n. . .', dots: 3 },
      { kind: 'cube', art: '. . .\n. . y . .\n. y y . .\n. . . . .\n. . .', dots: 2 },
      { kind: 'cube', art: '. . .\n. . . . .\n. y y y .\n. . . . .\n. . .', dots: 1 },
    ],
    algs: [
      { moves: "F R U R' U' F'", repeat: true },
    ],
  },
  {
    n: 7,
    accent: 'r',
    goals: [
      { kind: 'cube', art: '. b .\n. . y . .\no y y y r\n. . y . .\n. g .' },
    ],
    algs: [
      { moves: "R U R' U R U2 R' U", repeat: true },
    ],
  },
  {
    n: 8,
    accent: 'b',
    goals: [
      { kind: 'cube', art: 'b b y\no y y r b\no y y y r\ng o y g y\ny g r' },
    ],
    algs: [
      { moves: "U R U' L' U R' U' L", repeat: true },
    ],
  },
  {
    n: 9,
    accent: 'y',
    goals: [
      { kind: 'cube-net', art: 'yyy\nyyy\nyyy\nooo ggg rrr bbb\nooo ggg rrr bbb\nooo ggg rrr bbb\nwww\nwww\nwww' },
    ],
    algs: [
      { moves: "R' D' R D", pack2: true, repeat: true },
    ],
  },
];

// Die Grundzüge fürs Vokabelblatt (Lektion 2).
export const VOCAB = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"];
