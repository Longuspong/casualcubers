import './styles.css';
import { initRouter, navigate } from './router.js';
import { loadLessons } from './content-loader.js';
import { getPath } from './paths.js';
import { renderHome } from './views/home.js';
import { renderPathOverview } from './views/path-overview.js';
import { renderLesson } from './views/lesson.js';
import { renderComingSoon } from './views/coming-soon.js';

const app = document.getElementById('app');

// Routen-Tabelle (hash-basiert):
//   #/                        -> Startseite
//   #/<pfad>                  -> Pfad-Übersicht (bei ready:false "Bald verfügbar")
//   #/<pfad>/1 .. /N          -> einzelne Lektion
//   alles andere              -> sanft zurück zu #/
async function route(segments) {
  try {
    if (segments.length === 0) {
      renderHome(app);
      return;
    }

    const [head, second] = segments;
    const path = getPath(head);

    if (!path) {
      // Unbekannte Route: sanft zur Startseite.
      navigate('/');
      return;
    }

    if (!path.ready) {
      renderComingSoon(app, path.id);
      return;
    }

    const lessons = await loadLessons(path.id);

    if (segments.length === 1) {
      renderPathOverview(app, { path: path.id, lessons });
      return;
    }

    const number = parseInt(second, 10);
    const lesson = lessons.find((l) => l.number === number);
    if (!lesson) {
      navigate('/' + path.id);
      return;
    }
    renderLesson(app, { path: path.id, lessons, lesson });
  } catch (err) {
    renderError(err);
  }
}

function renderError(err) {
  app.innerHTML = `
    <main class="page page--error">
      <div class="error-card">
        <h1>Da ist etwas verrutscht</h1>
        <p>Der Inhalt konnte gerade nicht geladen werden.</p>
        <pre>${String(err && err.message ? err.message : err)}</pre>
        <a class="btn btn--accent" href="#/">Zurück zum Start</a>
      </div>
    </main>`;
}

initRouter(route);
