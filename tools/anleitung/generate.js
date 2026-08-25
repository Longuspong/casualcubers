// Baut das schriftlose Bilder-PDF (flache Notation) im Browser zusammen.
// Läuft in page.html, die anschließend von build-pdf.mjs als PDF gedruckt wird.

import { moveGlyph, flatFace } from './render2d.js';
import { LESSONS, VOCAB } from './lessons.js';

const el = (tag, cls, parent) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (parent) parent.appendChild(node);
  return node;
};

// Lektionsnummer als Punkte – zum Abzählen, nicht zum Lesen.
function dots(count, cls = 'dots') {
  const wrap = el('span', cls);
  for (let i = 0; i < count; i++) el('span', 'dot', wrap);
  return wrap;
}

// Eine Zugfolge als Klammer-Ausdruck:  [ N× |Zug|Zug|… ]  (⇒ Ziel)
function algExpr(alg, goalRows) {
  const box = el('div', 'expr');
  if (alg.hint) el('span', 'hint', box).textContent = alg.hint;
  el('span', 'brk', box).textContent = '[';
  const rep = el('span', 'rep', box);
  if (alg.bracket === 'repeat') el('span', 'icon', rep).textContent = '🔁';
  else rep.textContent = `${alg.bracket}×`;
  alg.moves.split(/\s+/).filter(Boolean).forEach((mv) => {
    const card = el('div', 'move', box);
    card.appendChild(moveGlyph(mv));
  });
  el('span', 'brk', box).textContent = ']';
  // „×2" hinter der Klammer = die Klammer als Doppelpack fahren (Lektion 9).
  if (alg.repeat && typeof alg.bracket === 'number') {
    el('span', 'icon', box).textContent = '🔁';
  }
  if (goalRows) {
    el('span', 'arrow', box).textContent = '⇒';
    const g = el('div', 'goal', box);
    g.appendChild(flatFace(goalRows, { cell: 22 }));
  }
  return box;
}

// Eine Lektion = ein Abschnitt.
function lessonSection(lesson) {
  const sec = el('section', 'lesson');
  sec.dataset.accent = lesson.accent;

  const head = el('div', 'lesson-head', sec);
  head.appendChild(dots(lesson.n, 'lesson-no'));

  if (lesson.isVocab) {
    const gal = el('div', 'vocab', sec);
    VOCAB.forEach((mv) => {
      const card = el('div', 'vocab-card', gal);
      card.appendChild(moveGlyph(mv));
    });
    return sec;
  }

  // Ziel-Bild(er) mit Zielscheibe.
  if (lesson.goals.length) {
    const goalBox = el('div', 'block goal-block', sec);
    el('span', 'icon icon-goal', goalBox).textContent = '🎯';
    const figs = el('div', 'figs', goalBox);
    lesson.goals.forEach((rows) => figs.appendChild(flatFace(rows, { cell: 24 })));
  }

  // Fälle (z. B. gelbes Kreuz: Punkt / L / Linie) mit Wiederhol-Zahl.
  if (lesson.stages) {
    const stageBox = el('div', 'block stages', sec);
    lesson.stages.forEach((s) => {
      const item = el('div', 'stage', stageBox);
      item.appendChild(flatFace(s.flat, { cell: 20 }));
      const rep = el('div', 'stage-rep', item);
      el('span', 'icon', rep).textContent = '🔁';
      rep.appendChild(dots(s.times, 'count'));
    });
  }

  // Zugfolgen. Das ⇒-Ziel hängt nur an eine einzelne Zugfolge – bei mehreren
  // (Lektion 5: rechts/links) steht das Ziel oben im Ziel-Block.
  lesson.algs.forEach((alg) => {
    const box = el('div', 'block moves', sec);
    const goalRows = lesson.algs.length === 1 && lesson.goals.length ? lesson.goals[0] : null;
    box.appendChild(algExpr(alg, goalRows));
  });

  return sec;
}

// --- Dokument ---------------------------------------------------------------

const root = document.getElementById('doc');

// Deckblatt: einfarbige Seiten (= gelöst), kurzer Titel.
const cover = el('section', 'cover', root);
const coverFaces = el('div', 'cover-faces', cover);
[['yyy', 'yyy', 'yyy'], ['ggg', 'ggg', 'ggg'], ['rrr', 'rrr', 'rrr']].forEach((rows) =>
  coverFaces.appendChild(flatFace(rows, { cell: 40, border: 6 }))
);
el('div', 'cover-title', cover).textContent = 'Mein Würfel';
el('div', 'cover-sub', cover).textContent = 'Bilder-Anleitung · Schritt für Schritt';

// Legende: die Bildsprache einmal erklärt.
const legend = el('section', 'legend', root);
const legendRow = el('div', 'legend-row', legend);
function tile(build, cap) {
  const c = el('div', 'legend-item', legendRow);
  const box = el('div', 'legend-art', c);
  const node = build();
  if (node) box.appendChild(node);
  el('div', 'legend-cap', c).textContent = cap;
}
tile(() => flatFace(['kyk', 'yyy', 'kyk'], { cell: 24 }), '🎯 Ziel');
tile(() => moveGlyph('F'), '↻ drehen (F)');
tile(() => moveGlyph('R'), '↑ drehen (R)');
tile(() => { const s = el('div', 'legend-brk'); s.textContent = '[ 3× ]'; return s; }, 'so oft');
tile(() => { const s = el('div', 'legend-brk'); s.textContent = '⇒'; return s; }, 'ergibt');
const swatches = el('div', 'legend-swatches', legend);
['y', 'w', 'g', 'r', 'b', 'o'].forEach((c) => el('span', `sw sw-${c}`, swatches));

for (const lesson of LESSONS) root.appendChild(lessonSection(lesson));

window.__ready = true;
