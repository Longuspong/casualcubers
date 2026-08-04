import {
  SVG_NS, CELL, STICKER_INSET, STICKER_RADIUS, BODY_RADIUS,
  FACE_ORDER, FACE_NORMAL, FACE_SHADE,
  appendShape, appendSticker, shrink, round, createSvg,
  makeCamera, convexHull, faceQuad, faceOutline,
} from './cube-3d.js';

// Würfeldiagramme: ```cube- und ```cube-net-Blöcke -> Inline-SVG (3D)
//
// Die Quellformate bleiben flach und zeilenbasiert – gerendert wird daraus
// aber ein räumlicher Würfel, weil die Vorlage ja ein echter Würfel ist.
//
// ```cube ist der Blick von schräg oben auf die Oberseite – der Blick, den man
// bei den Last-Layer-Schritten wirklich hat:
//
//   . . .        hintere Seitensticker der oberen Ebene (3 Zellen)
//   y . y . y    linker Seitensticker, 3 Felder Oberseite, rechter Seitensticker
//   . y y y .      "        (3 solcher Zeilen, oben = hinten)
//   y . y . y
//   . . .        vordere Seitensticker (3 Zellen)
//   :Beschriftung unter dem Diagramm (optional)
//
// Gerendert wird das als ganzer Würfel, schräg von oben auf eine Ecke gesehen –
// so, wie er in der Hand liegt. Die unteren Ebenen bleiben neutral grau: sie
// sind für den Schritt egal, geben der Ebene aber einen Körper zum Draufstehen.
// Aus dieser Ecke sind zwei der vier Seitenbänder abgewandt; stehen dort
// Farben, kommt der Blick von der Gegenecke daneben.
//
// ```cube-net beschreibt den ganzen Würfel – der Blick für „so sieht der Würfel
// gerade aus". Oben die U-Seite, in der Mitte L F R B nebeneinander, unten D:
//
//       yyy
//       yyy
//       yyy
//   ooo ggg rrr bbb
//   ooo ggg rrr bbb
//   ooo ggg rrr bbb
//       www
//       www
//       www
//   !letters     blendet die Seitenbuchstaben U/L/F/R/B/D ein (optional)
//   :Beschriftung unter dem Diagramm (optional)
//
// Dieselbe Eckansicht, nur etwas flacher – der Winkel, in dem man den Würfel
// vor sich hält. Auch hier zeigt ein Körper nur drei Seiten, deshalb kommt bei
// Bedarf der Blick von unten hinten (D B L) dazu. Sind die abgewandten Seiten
// ohnehin komplett grau, bleibt es bei einer Ansicht.
//
// Beide Formate gibt es auch für den 2x2 (eine Reihe weniger). Mehrere
// Diagramme in einem Block werden durch Leerzeilen getrennt und stehen dann
// nebeneinander. Zeichen: y gelb, r rot, g grün, b blau, o orange, w weiß,
// . beliebige Farbe (grau – „egal, was hier steht").

export function buildCubeFigure(kind, text, ariaLabel = '') {
  const row = document.createElement('div');
  row.className = 'cube-row';

  for (const chunk of text.trim().split(/\n\s*\n/)) {
    const lines = chunk.trim().split('\n').map((l) => l.trim()).filter(Boolean);

    // Optionen (!…) und Beschriftung (:…) von den Farbzeilen trennen.
    let label = '';
    const options = new Set();
    const body = [];
    for (const line of lines) {
      if (line.startsWith(':')) label = line.slice(1).trim();
      else if (line.startsWith('!')) options.add(line.slice(1).trim());
      else body.push(line);
    }

    const visual = kind === 'cube-net' ? buildNetView(body, label, options) : buildTopView(body, label, options);
    if (!visual) continue; // kaputtes Diagramm still überspringen

    const item = document.createElement('div');
    item.className = kind === 'cube-net' ? 'cube-item cube-item--net' : 'cube-item';
    item.appendChild(visual);
    if (label) {
      const span = document.createElement('span');
      span.className = 'cube-label';
      span.textContent = label;
      item.appendChild(span);
    }
    row.appendChild(item);
  }

  if (!row.children.length) return null;
  // Ab drei Diagrammen nebeneinander wird es sonst eine sehr lange Kolonne –
  // dann kleiner rendern, damit auf dem Handy zwei pro Zeile passen.
  if (row.children.length >= 3) row.classList.add('cube-row--many');

  const figure = document.createElement('figure');
  figure.className = 'cube-figure';
  figure.appendChild(row);
  if (ariaLabel) {
    // Beim Ziel-Bild beschreibt die Prosa aus dem Content das Bild besser als
    // jede generierte Zusammenfassung – die einzelnen SVGs sind dann stumm.
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', ariaLabel);
    figure.querySelectorAll('svg').forEach((s) => {
      s.removeAttribute('role');
      s.removeAttribute('aria-label');
      s.setAttribute('aria-hidden', 'true');
    });
  }
  return figure;
}

export function buildCubeFigureHtml(kind, text, ariaLabel) {
  const figure = buildCubeFigure(kind, text, ariaLabel);
  return figure ? figure.outerHTML : '';
}

// --- Blick von schräg oben (```cube```) -------------------------------------

// Die Draufsicht beschreibt nur die oberste Ebene. Für die Kamera ist das
// trotzdem ein ganzer Würfel – die Ebene bekommt so einen Körper, auf dem sie
// sitzt, statt frei im Raum zu schweben. Alles Unbeschriebene ist neutral.
//
// Die Bänder liegen im Quelltext so, wie man von oben draufschaut. Auf den
// Seitenflächen zählt dagegen die Leserichtung der jeweiligen Fläche (siehe
// faceQuad): bei B und R läuft sie andersherum, deshalb werden die beiden
// Bänder umgedreht.
function topFaces(grid, n) {
  const dots = '.'.repeat(n);
  const reverse = (s) => s.split('').reverse().join('');
  const column = (i) => grid.slice(1, n + 1).map((row) => row[i]).join('');
  const layer = (top) => [top, ...Array(n - 1).fill(dots)];

  return {
    U: grid.slice(1, n + 1).map((row) => row.slice(1, n + 1)),
    F: layer(grid[n + 1]),
    B: layer(reverse(grid[0])),
    L: layer(column(0)),
    R: layer(reverse(column(n + 1))),
    D: Array(n).fill(dots),
  };
}

function buildTopView(lines, label, options) {
  const grid = lines.map((l) => l.replace(/\s+/g, ''));
  const n = grid.length - 2; // Kantenlänge der Oberseite (3x3 oder 2x2)
  const valid =
    (n === 2 || n === 3) &&
    grid[0].length === n && grid[n + 1].length === n &&
    grid.slice(1, n + 1).every((l) => l.length === n + 2);
  if (!valid) return null;

  const faces = topFaces(grid, n);
  // Die abgewandten Bänder (hinten, links) sind aus dieser Ecke nicht zu
  // sehen. Stehen dort Farben, kommt der Blick von der Gegenecke dazu.
  const views = /[^.]/.test(faces.B[0] + faces.L[0]) ? ['topFront', 'topBack'] : ['topFront'];
  return buildViews(faces, n, views, label, options.has('letters'));
}

// --- Ganzer Würfel (Quelltext: Netz) ----------------------------------------

// Zeilen -> { n, faces } oder null. Erwartet 3n Zeilen: n Zeilen mit einem
// Block (U), n Zeilen mit vier Blöcken (L F R B), n Zeilen mit einem (D).
function parseNet(lines) {
  const rows = lines.map((l) => l.trim().split(/\s+/).filter(Boolean));
  const n = rows.length / 3;
  if (n !== 2 && n !== 3) return null;

  for (let i = 0; i < rows.length; i++) {
    const expected = i >= n && i < 2 * n ? 4 : 1;
    if (rows[i].length !== expected) return null;
    if (rows[i].some((token) => token.length !== n)) return null;
  }

  const faces = { U: [], L: [], F: [], R: [], B: [], D: [] };
  for (let i = 0; i < n; i++) {
    faces.U.push(rows[i][0]);
    const [l, f, r, b] = rows[n + i];
    faces.L.push(l);
    faces.F.push(f);
    faces.R.push(r);
    faces.B.push(b);
    faces.D.push(rows[2 * n + i][0]);
  }
  return { n, faces };
}

function buildNetView(lines, label, options) {
  const net = parseNet(lines);
  if (!net) return null;
  const { n, faces } = net;

  // Die Gegenansicht kommt dazu, sobald auf D, B oder L etwas Konkretes steht –
  // bei rein grauen Rückseiten wäre sie nur ein zweiter grauer Klotz. Bei
  // !letters gehören ohnehin alle sechs Seiten dazu.
  const backMatters =
    options.has('letters') ||
    ['D', 'B', 'L'].some((name) => faces[name].some((row) => /[^.]/.test(row)));

  const views = backMatters ? ['netFront', 'netBack'] : ['netFront'];
  return buildViews(faces, n, views, label, options.has('letters'));
}

// --- Ansichten --------------------------------------------------------------

// Ein Körper zeigt nur drei Seiten. Deshalb gibt es zu jeder Ansicht die
// Gegenecke; welche Seiten dabei sichtbar sind, rechnet die Kamera aus.
//
// Die Draufsicht schaut steiler von oben – dort trägt die Oberseite die
// Information. Die Netz-Ansicht bleibt flacher, das ist der Winkel, in dem man
// den Würfel vor sich hält; ihre Gegenansicht schaut von unten auf die
// Unterseite, statt den Würfel im Bild auf den Kopf zu stellen.
const CUBE_VIEWS = {
  topFront: { azimuth: 42, elevation: 40, caption: 'von vorn' },
  topBack: { azimuth: 222, elevation: 40, caption: 'von hinten' },
  netFront: { azimuth: 42, elevation: 28, caption: 'von vorn' },
  netBack: { azimuth: 222, elevation: -28, caption: 'von hinten' },
};

let clipUid = 0;

function buildCubeSvg(faces, n, viewName, label, showLetters) {
  const view = CUBE_VIEWS[viewName];
  const cam = makeCamera(n, CELL, view.azimuth, view.elevation);
  const visible = FACE_ORDER.filter(cam.visible);
  const suffix = label ? `: ${label}` : '';
  const svg = createSvg(
    round(cam.width), round(cam.height),
    `Würfel von schräg ${view.elevation >= 0 ? 'oben' : 'unten'}, ` +
      `Seiten ${visible.join(' ')}${suffix}`
  );
  const to2d = (pts) => pts.map(([x, y, z]) => cam.project(x, y, z));

  // 1) Der Würfelkörper als eine Silhouette – mit abgerundeten Kanten.
  const outline = convexHull(
    [0, n].flatMap((x) => [0, n].flatMap((y) => [0, n].map((z) => cam.project(x, y, z))))
  );
  const body = appendShape(svg, outline, 'cd-body', BODY_RADIUS);

  // 2) Sticker, leicht eingezogen und mit weichen Ecken – wie gespritztes
  //    Plastik, nicht wie ausgeschnittenes Papier.
  for (const name of visible) {
    const rows = faces[name];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const quad = shrink(to2d(faceQuad(name, r, c, n)), STICKER_INSET);
        appendSticker(svg, quad, rows[r][c], STICKER_RADIUS);
      }
    }
  }

  // 3) Schattierung pro Seite. Geklammert auf die Silhouette, damit sie an den
  //    abgerundeten Kanten nicht übersteht.
  const shaded = visible.filter((name) => FACE_SHADE[name]);
  if (shaded.length) {
    const id = `cd-clip-${(clipUid += 1)}`;
    const defs = document.createElementNS(SVG_NS, 'defs');
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.setAttribute('id', id);
    clip.appendChild(body.cloneNode());
    defs.appendChild(clip);
    svg.appendChild(defs);

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('clip-path', `url(#${id})`);
    for (const name of shaded) {
      appendShape(group, to2d(faceOutline(name, n)), `cd-shade ${FACE_SHADE[name]}`);
    }
    svg.appendChild(group);
  }

  // 4) Seitenbuchstaben, in die jeweilige Fläche gelegt.
  if (showLetters) {
    for (const name of visible) appendFaceLetter(svg, cam, name, n);
  }
  return svg;
}

// Der Buchstabe liegt in der Fläche, statt davorzuschweben. Auf einer
// Seitenfläche zeigt sein „unten" immer zum Würfelboden; sein „rechts" ist das
// Kreuzprodukt daraus – so steht er nie auf dem Kopf und nie spiegelverkehrt,
// egal von welcher Ecke die Kamera schaut. Die waagerechten Deckflächen
// bekommen keins: dort stünde er in jeder Kantenrichtung so schräg, dass er
// kaum noch zu lesen wäre, er bleibt deshalb aufrecht.
function appendFaceLetter(svg, cam, name, n) {
  const pts = faceOutline(name, n).map(([x, y, z]) => cam.project(x, y, z));
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;

  const text = document.createElementNS(SVG_NS, 'text');
  const normal = FACE_NORMAL[name];
  if (!normal[1]) {
    const down = [0, -1, 0];
    const right = [normal[2], 0, -normal[0]]; // (0,1,0) x normal
    const [rx, ry] = cam.direction(right).map((v) => v / CELL);
    const [dx, dy] = cam.direction(down).map((v) => v / CELL);
    text.setAttribute(
      'transform',
      `matrix(${round(rx)} ${round(ry)} ${round(dx)} ${round(dy)} ${round(cx)} ${round(cy)})`
    );
  } else {
    text.setAttribute('x', round(cx));
    text.setAttribute('y', round(cy));
  }
  text.setAttribute('class', 'cd-letter');
  text.setAttribute('text-anchor', 'middle');
  // Vertikal per dy statt dominant-baseline zentriert: dominant-baseline wird
  // auf <text> nicht überall gleich umgesetzt, dy überall.
  text.setAttribute('dy', '0.35em');
  text.textContent = name;
  svg.appendChild(text);
}

// Eine oder zwei Ansichten nebeneinander, beschriftet nur wenn es zwei sind.
function buildViews(faces, n, viewNames, label, showLetters) {
  const wrap = document.createElement('div');
  wrap.className = 'cube-views';

  for (const viewName of viewNames) {
    const cell = document.createElement('div');
    cell.className = 'cube-view';
    cell.appendChild(buildCubeSvg(faces, n, viewName, label, showLetters));
    if (viewNames.length > 1) {
      const caption = document.createElement('span');
      caption.className = 'cube-view-label';
      caption.textContent = CUBE_VIEWS[viewName].caption;
      cell.appendChild(caption);
    }
    wrap.appendChild(cell);
  }
  return wrap;
}
