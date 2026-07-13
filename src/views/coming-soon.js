import { getPath } from '../paths.js';
import { mount, appBar, esc } from './layout.js';

// Platzhalter für CFOP light und Roux. Kein Fake-Content – nur ein ruhiger
// Hinweis, dass der Pfad noch entsteht, plus der Blurb aus paths.js.
export function renderComingSoon(container, pathId) {
  const meta = getPath(pathId);
  const name = meta ? meta.name : pathId;

  mount(container, {
    accent: meta ? meta.accent : null,
    html: `
      ${appBar({ back: { href: '#/', label: 'Startseite' }, title: esc(name) })}
      <main class="page page--soon">
        <div class="soon-card">
          <span class="soon-badge soon-badge--lg">Bald verfügbar</span>
          <h1>${esc(name)}</h1>
          <p class="soon-tagline">${esc(meta ? meta.tagline : '')}</p>
          <p class="soon-blurb">${esc(meta ? meta.blurb : '')}</p>
          <p class="soon-note">
            Dieser Pfad ist noch in Arbeit. Bis dahin: Der Beginner-Pfad wartet
            schon fertig auf dich.
          </p>
          <a class="btn btn--accent" href="#/beginner">Zum Beginner-Pfad</a>
        </div>
      </main>
    `,
  });
}
