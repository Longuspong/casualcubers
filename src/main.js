import './styles.css';
import { initRouter, navigate } from './router.js';
import { loadBeginnerLessons } from './content-loader.js';
import { renderHome } from './views/home.js';
import { renderPathOverview } from './views/path-overview.js';
import { renderLesson } from './views/lesson.js';
import { renderComingSoon } from './views/coming-soon.js';

const app = document.getElementById('app');

// Routen-Tabelle (hash-basiert):
//   #/                       -> Startseite
//   #/beginner               -> Beginner-Übersicht
//   #/beginner/1 .. /8       -> einzelne Lektion
//   #/cfop-light, #/roux     -> "Bald verfügbar"
//   alles andere             -> sanft zurück zu #/
async function route(segments) {
  try {
    if (segments.length === 0) {
      renderHome(app);
      return;
    }

    const [head, second] = segments;

    if (head === 'beginner') {
      const lessons = await loadBeginnerLessons();
      if (segments.length === 1) {
        renderPathOverview(app, { path: 'beginner', lessons });
        return;
      }
      const number = parseInt(second, 10);
      const lesson = lessons.find((l) => l.number === number);
      if (!lesson) {
        navigate('/beginner');
        return;
      }
      renderLesson(app, { path: 'beginner', lessons, lesson });
      return;
    }

    if (head === 'cfop-light' || head === 'roux') {
      renderComingSoon(app, head);
      return;
    }

    // Unbekannte Route: sanft zur Startseite.
    navigate('/');
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
