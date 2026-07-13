// Hash-basiertes Client-Side-Routing.
// Bewusst kein History-API in Phase 1: Hash-Routing macht das Hosting auf
// GitHub Pages problemlos (keine Server-Rewrites nötig).

// Zerlegt location.hash in saubere Segmente:
//   "#/beginner/1"  -> ["beginner", "1"]
//   "#/"            -> []
//   ""              -> []
export function currentSegments() {
  const raw = location.hash.replace(/^#/, '');
  return raw.split('/').filter(Boolean);
}

// Startet den Router. `handler` bekommt bei jeder Routen-Änderung die Segmente.
export function initRouter(handler) {
  const run = () => handler(currentSegments());
  window.addEventListener('hashchange', run);
  run();
  return run;
}

// Programmatische Navigation. Löst hashchange aus und damit ein Re-Render.
export function navigate(path) {
  const target = path.startsWith('#') ? path : '#' + path;
  if (location.hash === target) {
    // Gleiche Route erneut anfordern (z.B. Reset nach ungültiger URL).
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
}
