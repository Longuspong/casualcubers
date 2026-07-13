import { PATHS } from '../paths.js';
import { countDone } from '../storage.js';
import { mount, appBar, esc } from './layout.js';

// Startseite: drei Pfad-Karten. Beginner ist aktiv und zeigt den Fortschritt,
// die anderen beiden führen zur "Bald verfügbar"-Seite.
export function renderHome(container) {
  const cards = PATHS.map(cardHtml).join('');

  mount(container, {
    accent: null,
    html: `
      ${appBar()}
      <main class="page page--home">
        <section class="hero">
          <h1>Lös den Würfel.<br />In deinem Tempo.</h1>
          <p class="hero-lead">
            Cube&nbsp;Chill ist fürs Puzzeln am Küchentisch, nicht fürs Podium.
            Wenige Algorithmen, viel Verstehen – und am Ende ein Würfel, den
            <em>du</em> gelöst hast.
          </p>
        </section>

        <section class="path-cards" aria-label="Lernpfade">
          ${cards}
        </section>

        <p class="home-footnote">
          Such dir einen Pfad aus. Du kannst jederzeit wechseln – hier hetzt dich niemand.
        </p>
      </main>
    `,
  });
}

function cardHtml(path) {
  const done = path.ready ? countDone(path.id) : 0;
  const progress =
    path.ready && path.lessonCount
      ? `<span class="path-card-progress">${done} / ${path.lessonCount} Lektionen</span>`
      : '';
  const badge = path.ready
    ? ''
    : `<span class="soon-badge">Bald verfügbar</span>`;

  return `
    <a class="path-card ${path.ready ? '' : 'path-card--soon'}"
       href="${path.route}"
       data-accent="${path.accent}">
      <span class="path-card-mark" aria-hidden="true"></span>
      <span class="path-card-body">
        <span class="path-card-head">
          <span class="path-card-name">${esc(path.name)}</span>
          ${badge}
        </span>
        <span class="path-card-tagline">${esc(path.tagline)}</span>
        <span class="path-card-blurb">${esc(path.blurb)}</span>
        ${progress}
      </span>
      <span class="path-card-arrow" aria-hidden="true">→</span>
    </a>
  `;
}
