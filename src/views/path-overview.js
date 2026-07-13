import { getPath } from '../paths.js';
import { isDone, countDone, resetPath } from '../storage.js';
import { mount, appBar, esc } from './layout.js';

// Übersicht eines Pfades: Fortschrittsanzeige + Liste aller Lektionen.
// Aktuell nur für den Beginner-Pfad mit echten Lektionen belegt.
export function renderPathOverview(container, { path, lessons }) {
  const meta = getPath(path);
  const total = lessons.length;
  const done = countDone(path);
  const pct = total ? Math.round((done / total) * 100) : 0;

  const items = lessons
    .map((lesson) => {
      const checked = isDone(path, lesson.number);
      return `
        <li>
          <a class="lesson-row ${checked ? 'is-done' : ''}" href="#/${path}/${lesson.number}">
            <span class="lesson-row-num" aria-hidden="true">${lesson.number}</span>
            <span class="lesson-row-text">
              <span class="lesson-row-title">${esc(lesson.title)}</span>
            </span>
            <span class="lesson-row-check" aria-hidden="true">${checked ? '✓' : ''}</span>
          </a>
        </li>`;
    })
    .join('');

  mount(container, {
    accent: meta ? meta.accent : null,
    html: `
      ${appBar({ back: { href: '#/', label: 'Startseite' }, title: `${esc(meta ? meta.name : path)}-Pfad` })}
      <main class="page page--overview">
        <section class="overview-intro">
          <h1>${esc(meta ? meta.name : path)}-Pfad</h1>
          <p class="overview-lead">${esc(meta ? meta.tagline : '')}</p>

          <div class="progress" role="group" aria-label="Fortschritt">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="progress-label">${done} / ${total} Lektionen</span>
          </div>
        </section>

        <ol class="lesson-list">${items}</ol>

        <footer class="overview-footer">
          <button type="button" class="link-reset" id="reset-progress">
            Fortschritt zurücksetzen
          </button>
        </footer>
      </main>
    `,
  });

  const resetBtn = container.querySelector('#reset-progress');
  resetBtn?.addEventListener('click', () => {
    if (done === 0) return;
    const ok = window.confirm(
      `Fortschritt im ${meta ? meta.name : path}-Pfad wirklich zurücksetzen? ` +
        `Deine ${done} abgehakte${done === 1 ? '' : 'n'} Lektion${done === 1 ? '' : 'en'} ` +
        `${done === 1 ? 'wird' : 'werden'} gelöscht.`
    );
    if (ok) {
      resetPath(path);
      renderPathOverview(container, { path, lessons });
    }
  });
}
