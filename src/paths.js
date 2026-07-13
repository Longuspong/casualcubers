// Zentrale Definition der drei Lernpfade. Eine Quelle der Wahrheit für
// Startseite, Übersicht und Router.

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
    id: 'cfop-light',
    route: '#/cfop-light',
    accent: 'cfop',
    name: 'CFOP light',
    tagline: 'Dieselbe Idee, ein paar Umwege weniger.',
    blurb: 'Intuitives F2L statt getrennter Ebenen. Die Methode der meisten Speedcuber – radikal für Gelegenheits-Cuber entschlackt.',
    lessonCount: null,
    ready: false,
  },
  {
    id: 'roux',
    route: '#/roux',
    accent: 'roux',
    name: 'Roux',
    tagline: 'Der Weg der Ruhe: zwei Blöcke, dann der Rest.',
    blurb: 'Wenig auswendig lernen, viel verstehen. Fühlt sich anders an – und genau das ist das Schöne.',
    lessonCount: null,
    ready: false,
  },
];

export function getPath(id) {
  return PATHS.find((p) => p.id === id) || null;
}
