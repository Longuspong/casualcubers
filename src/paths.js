// Zentrale Definition der Lernpfade. Eine Quelle der Wahrheit für
// Startseite, Übersicht und Router. Die Reihenfolge hier bestimmt die
// Reihenfolge der Karten auf der Startseite.
//
// Gruppierung: zuerst die zwei Einstiegspfade (3x3-Beginner und 2x2),
// darunter die zwei weiterführenden Pfade, die den Beginner voraussetzen.

export const PATHS = [
  {
    id: 'beginner',
    route: '#/beginner',
    accent: 'beginner',
    name: 'Beginner',
    tagline: 'Vom Chaos zum ersten selbst gelösten Würfel.',
    blurb: 'Acht ruhige Lektionen, so wenige Algorithmen wie möglich. Der Einstieg für alle, die den Würfel als Puzzle mögen.',
    lessonCount: 8,
    ready: true,
  },
  {
    id: '2x2',
    route: '#/2x2',
    accent: '2x2',
    name: '2x2',
    tagline: 'Acht Ecken, kein Drama.',
    blurb: 'Die entspannte Tour: keine Kanten, keine Mittelebene. Drei Schritte, zwei kleine Zugfolgen – und ganz nebenbei das Fundament fürs große Geschwister.',
    lessonCount: 4,
    ready: true,
  },
  {
    id: 'cfop-light',
    route: '#/cfop-light',
    accent: 'cfop',
    name: 'CFOP light',
    tagline: 'Dieselbe Idee, ein paar Umwege weniger.',
    blurb: 'Intuitives F2L statt getrennter Ebenen – aus deiner Recycling-Tonne gebaut, mit genau einem neuen Algorithmus. Setzt den Beginner-Pfad voraus.',
    lessonCount: 5,
    ready: true,
  },
  {
    id: 'roux',
    route: '#/roux',
    accent: 'roux',
    name: 'Roux',
    tagline: 'Der Weg der Ruhe: zwei Blöcke, dann der Rest.',
    blurb: 'Quer gelöst statt Ebene für Ebene. Wenig auswendig lernen, viel verstehen. Setzt den Beginner-Pfad voraus.',
    lessonCount: 5,
    ready: true,
  },
];

export function getPath(id) {
  return PATHS.find((p) => p.id === id) || null;
}
