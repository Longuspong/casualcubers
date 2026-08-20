// Baut das schriftlose Bilder-PDF im Browser zusammen. Läuft in der Seite
// page.html, die anschließend von build-pdf.mjs als PDF gedruckt wird.

import { buildCubeFigure } from '../../src/cube-diagram.js';
import { buildMoveSvg } from './render.js';
import { LESSONS, VOCAB } from './lessons.js';

const el = (tag, cls, parent) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (parent) parent.appendChild(node);
  return node;
};

// Punkte statt Ziffern: eine Lektionsnummer zum Abzählen, nicht zum Lesen.
function dots(count, cls = 'dots') {
  const wrap = el('span', cls);
  for (let i = 0; i < count; i++) el('span', 'dot', wrap);
  return wrap;
}

// Ein Ziel-Diagramm (```cube / ```cube-net) mit der App-Engine gerendert.
function goalFigure(goal) {
  return buildCubeFigure(goal.kind, goal.art);
}

// Eine Zugfolge als Streifen aus Würfelbildern, einer pro Zug, links nach
// rechts zu lesen. Jeder Zug trägt unten einen Zählpunkt-Streifen.
function moveStrip(moves) {
  const strip = el('div', 'strip');
  moves.split(/\s+/).filter(Boolean).forEach((mv, i) => {
    if (i > 0) el('span', 'chain', strip); // Kette zwischen den Zügen
    const card = el('div', 'move', strip);
    card.appendChild(buildMoveSvg(mv));
    card.appendChild(dots(i + 1, 'count'));
  });
  return strip;
}

// Eine Lektion = ein Abschnitt: Kopf mit Nummernpunkten, Ziel, Züge.
function lessonSection(lesson) {
  const sec = el('section', 'lesson');
  sec.dataset.accent = lesson.accent;

  const head = el('div', 'lesson-head', sec);
  head.appendChild(dots(lesson.n, 'lesson-no'));

  if (lesson.isVocab) {
    // Lektion 2: das Zug-Vokabelblatt.
    const gal = el('div', 'vocab', sec);
    VOCAB.forEach((mv) => {
      const card = el('div', 'vocab-card', gal);
      card.appendChild(buildMoveSvg(mv));
    });
    return sec;
  }

  // Ziel-Bild(er) mit Zielscheibe-Markierung.
  if (lesson.goals.length) {
    const goalBox = el('div', 'block goal', sec);
    el('span', 'icon icon-goal', goalBox).textContent = '🎯';
    const figs = el('div', 'figs', goalBox);
    lesson.goals.forEach((g) => { const f = goalFigure(g); if (f) figs.appendChild(f); });
  }

  // Zwischenstufen (z. B. gelbes Kreuz: Punkt -> L -> Linie) mit Wiederhol-Zahl.
  if (lesson.stages) {
    const stageBox = el('div', 'block stages', sec);
    lesson.stages.forEach((s) => {
      const item = el('div', 'stage', stageBox);
      const f = buildCubeFigure(s.kind, s.art);
      if (f) item.appendChild(f);
      const rep = el('div', 'stage-rep', item);
      el('span', 'icon', rep).textContent = '🔁';
      rep.appendChild(dots(s.dots, 'count'));
    });
  }

  // Zugfolgen.
  lesson.algs.forEach((alg) => {
    const box = el('div', 'block moves', sec);
    box.appendChild(moveStrip(alg.moves));
    const flags = el('div', 'flags', box);
    if (alg.pack2) { const p = el('span', 'flag', flags); p.textContent = '×2'; }
    if (alg.repeat) { const r = el('span', 'flag', flags); el('span', 'icon', r).textContent = '🔁'; }
  });

  return sec;
}

// --- Dokument zusammensetzen ------------------------------------------------

const root = document.getElementById('doc');

// Deckblatt: großer gelöster Würfel, ein kurzer Titel für die Großen.
const cover = el('section', 'cover', root);
const coverArt = buildCubeFigure('cube-net', 'yyy\nyyy\nyyy\nooo ggg rrr bbb\nooo ggg rrr bbb\nooo ggg rrr bbb\nwww\nwww\nwww');
if (coverArt) cover.appendChild(coverArt);
el('div', 'cover-title', cover).textContent = 'Mein Würfel';
el('div', 'cover-sub', cover).textContent = 'Bilder-Anleitung · Schritt für Schritt';

// Legende: die Bildsprache einmal erklärt (für die Vorleser).
const legend = el('section', 'legend', root);
const legendRow = el('div', 'legend-row', legend);
function legendTile(build, cap) {
  const c = el('div', 'legend-item', legendRow);
  const box = el('div', 'legend-art', c);
  const node = build();
  if (node) box.appendChild(node);
  el('div', 'legend-cap', c).textContent = cap;
}
legendTile(() => buildCubeFigure('cube', '. . .\n. . . . .\n. . y . .\n. . . . .\n. . .'), '🎯 Ziel');
legendTile(() => buildMoveSvg('R'), '↻ drehen');
legendTile(() => buildCubeFigure('cube', '. . .\n. y . y .\ny . y . y\n. y . y .\n. . .'), 'grau = egal');
legendTile(() => { const w = el('div', 'legend-rep'); el('span', 'icon', w).textContent = '🔁'; w.appendChild(dots(3, 'count')); return w; }, 'nochmal');
legendTile(() => { const s = el('div', 'legend-x2'); s.textContent = '×2'; return s; }, 'zweimal');
// Farbtupfer.
const swatches = el('div', 'legend-swatches', legend);
['y', 'w', 'g', 'r', 'b', 'o'].forEach((c) => { const s = el('span', `sw sw-${c}`, swatches); });

for (const lesson of LESSONS) root.appendChild(lessonSection(lesson));

window.__ready = true;
