import { getPath } from '../paths.js';
import { isDone, toggleDone } from '../storage.js';
import { mount, appBar, esc } from './layout.js';

// Die aufwendigste Ansicht: eine einzelne Lektion. Ziel-Bild-Platzhalter,
// aufbereiteter Inhalt, "Abhaken, wenn"-Kriterium, Abhaken-Button und eine
// daumenerreichbare Fixed-Navigation zwischen den Lektionen.
export function renderLesson(container, { path, lessons, lesson }) {
  const meta = getPath(path);
  const total = lessons.length;
  const idx = lessons.findIndex((l) => l.number === lesson.number);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const done = isDone(path, lesson.number);

  const goalImage = lesson.goalImageCaption || lesson.goalImageDesc
    ? `<figure class="goal-image">
         <div class="goal-image-frame" role="img" aria-label="${esc(lesson.goalImageDesc)}">
           <span class="goal-image-tag" aria-hidden="true">Ziel-Bild</span>
         </div>
         ${lesson.goalImageCaption ? `<figcaption>„${esc(lesson.goalImageCaption)}“</figcaption>` : ''}
       </figure>`
    : '';

  const abhaken = lesson.abhakenWenn
    ? `<aside class="abhaken">
         <span class="abhaken-label">Abhaken, wenn</span>
         <p>${esc(lesson.abhakenWenn)}</p>
       </aside>`
    : '';

  mount(container, {
    accent: meta ? meta.accent : null,
    html: `
      ${appBar({
        back: { href: `#/${path}`, label: `${meta ? meta.name : path}-Pfad` },
        title: `Lektion ${lesson.number}`,
        subtitle: `von ${total}`,
      })}

      <main class="page page--lesson">
        <article class="lesson">
          <p class="lesson-kicker">Lektion ${lesson.number} · ${total} insgesamt</p>
          <h1 class="lesson-title">${esc(lesson.title)}</h1>
          ${goalImage}
          <div class="lesson-body">${lesson.content}</div>
          ${abhaken}

          <button type="button" class="done-toggle ${done ? 'is-done' : ''}" id="done-toggle" aria-pressed="${done}">
            <span class="done-toggle-box" aria-hidden="true">${done ? '✓' : ''}</span>
            <span class="done-toggle-label">${done ? 'Abgehakt' : 'Als erledigt abhaken'}</span>
          </button>
        </article>
      </main>

      <nav class="lesson-nav" aria-label="Lektions-Navigation">
        ${
          prev
            ? `<a class="lesson-nav-btn" href="#/${path}/${prev.number}">
                 <span class="chevron" aria-hidden="true">‹</span>
                 <span class="lesson-nav-text"><small>Zurück</small><span>${esc(prev.title)}</span></span>
               </a>`
            : `<a class="lesson-nav-btn" href="#/${path}">
                 <span class="chevron" aria-hidden="true">‹</span>
                 <span class="lesson-nav-text"><small>Zurück</small><span>Übersicht</span></span>
               </a>`
        }
        ${
          next
            ? `<a class="lesson-nav-btn lesson-nav-btn--next" href="#/${path}/${next.number}">
                 <span class="lesson-nav-text"><small>Weiter</small><span>${esc(next.title)}</span></span>
                 <span class="chevron" aria-hidden="true">›</span>
               </a>`
            : `<a class="lesson-nav-btn lesson-nav-btn--next" href="#/${path}">
                 <span class="lesson-nav-text"><small>Geschafft</small><span>Zur Übersicht</span></span>
                 <span class="chevron" aria-hidden="true">›</span>
               </a>`
        }
      </nav>
    `,
  });

  const btn = container.querySelector('#done-toggle');
  btn?.addEventListener('click', () => {
    const nowDone = toggleDone(path, lesson.number);
    btn.classList.toggle('is-done', nowDone);
    btn.setAttribute('aria-pressed', String(nowDone));
    btn.querySelector('.done-toggle-box').textContent = nowDone ? '✓' : '';
    btn.querySelector('.done-toggle-label').textContent = nowDone
      ? 'Abgehakt'
      : 'Als erledigt abhaken';
  });
}
