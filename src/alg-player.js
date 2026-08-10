import {
  SVG_NS, CELL, DEG, CUBE_STICKER_CLASS, FACE_NORMAL,
  STICKER_INSET, STICKER_RADIUS, dot3, round, shapePath, shrink, createSvg,
  makeCamera,
} from './cube-3d.js';
import {
  createCube, applyMove, applyMoves, inverseMoves, invertMove, inLayer, parseMove,
} from './cube-state.js';

// Der Algorithmus-Kasten wird zum Abspieler: ein Würfel, der die Züge einzeln
// dreht, mit Vor und Zurück und der Anzeige „Zug 4 von 8".
//
// Ausgangsstellung ist der Algorithmus rückwärts auf einem gelösten Würfel –
// also genau der Fall, den er auflöst. Wer die Züge bis zum Ende durchklickt,
// hat den Würfel wieder gelöst; das ist die Probe aufs Exempel und erspart es,
// die Startstellung im Content nochmal von Hand zu beschreiben.
//
// Gezeichnet wird nicht mit CSS-3D, sondern mit derselben Kamera wie die
// stehenden Diagramme (cube-3d.js): pro Bild werden alle sichtbaren
// Steinflächen projiziert, von hinten nach vorn sortiert und in einen festen
// Vorrat an <path>-Elementen geschrieben. Die Elemente bleiben dabei liegen,
// es wird nur ihr `d` neu gesetzt – kein Umhängen im DOM, deshalb läuft das
// auch auf dem Handy flüssig.

const VIEW = { azimuth: 42, elevation: 34 };
// Eine drehende Scheibe schwingt über den ruhenden Umriss hinaus (in der
// Diagonale bis zu √2·1,5 statt 1,5 Kantenlängen). Ohne diesen Rand würde die
// viewBox sie im 45°-Moment abschneiden.
const VIEW_PAD = 0.8;

const QUARTER_MS = 210; // eine Vierteldrehung – zügig, aber noch verfolgbar
const HALF_MS = 300; // …2-Züge etwas länger, sonst wirken sie wie ein Sprung
const AUTOPLAY_GAP = 90; // Atempause zwischen zwei Zügen beim Abspielen

const BODY_RADIUS = CELL * 0.1;
// Licht von schräg oben-vorn-rechts. Der Schatten läuft weich über die
// Flächen mit – nur so sieht man einer drehenden Scheibe die Drehung an,
// bevor sie die Silhouette verändert.
const LIGHT = normalize([0.45, 1, 0.55]);
const SHADE_MAX = 0.26;

// Die sechs Flächen eines Steins, als Ecken relativ zu seiner Mitte.
const CUBIE_FACES = Object.entries({
  U: [[-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]],
  D: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5]],
  F: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]],
  B: [[0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5]],
  R: [[0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5]],
  L: [[-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5], [-0.5, -0.5, -0.5]],
});

// ---------------------------------------------------------------------------
// Einstieg
// ---------------------------------------------------------------------------

// Hängt an jeden Algorithmus-Kasten im Container den Abspieler. Der Würfel
// selbst entsteht erst beim ersten Aufklappen – eine Lektion hat schnell ein
// halbes Dutzend Algorithmen, und die meisten schaut man sich nie an.
export function initAlgPlayers(root) {
  root.querySelectorAll('.alg-box').forEach(setupAlgBox);
}

function setupAlgBox(box) {
  const toggle = box.querySelector('.alg-toggle');
  const moves = (box.dataset.alg || '').split(' ').filter(Boolean);
  if (!toggle || moves.length < 2) return;

  let player = null;
  toggle.addEventListener('click', () => {
    const open = !box.classList.contains('is-open');
    box.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) {
      player?.stop();
      return;
    }
    if (!player) player = createPlayer(box, moves);
  });
}

// ---------------------------------------------------------------------------
// Zeichnen
// ---------------------------------------------------------------------------

// Ein fester Vorrat an <path>-Elementen in fester Reihenfolge. Pro Bild werden
// sie der Tiefe nach neu beschrieben; nicht gebrauchte bekommen ein leeres `d`.
function createPainter(svg) {
  const pool = [];
  let used = 0;

  return {
    begin() {
      used = 0;
    },
    path(d, className, opacity) {
      let el = pool[used];
      if (!el) {
        el = document.createElementNS(SVG_NS, 'path');
        pool.push(el);
        svg.appendChild(el);
      }
      el.setAttribute('d', d);
      if (el.getAttribute('class') !== className) el.setAttribute('class', className);
      if (opacity === undefined) el.removeAttribute('fill-opacity');
      else el.setAttribute('fill-opacity', opacity);
      used += 1;
    },
    end() {
      for (let i = used; i < pool.length; i++) pool[i].setAttribute('d', '');
    },
  };
}

// Ein Bild: alle Steine der Tiefe nach, jeder mit seinen der Kamera
// zugewandten Flächen. Steine sind konvex und stoßen nicht ineinander –
// deshalb reicht es, sie nach ihrem Abstand zur Kamera zu sortieren, statt
// jede einzelne Fläche einzusortieren.
function paintCube(painter, cam, cubies, anim) {
  const mat = anim ? rotationMatrix(anim.axis, anim.angle) : null;

  const order = cubies.map((cubie) => {
    const moving = anim ? inLayer(cubie.pos, anim.layer) : false;
    const rel = [cubie.pos[0] - 1, cubie.pos[1] - 1, cubie.pos[2] - 1];
    const center = moving ? apply(mat, rel) : rel;
    return { cubie, moving, center, depth: distanceTo(cam.camPos, world(center)) };
  });
  order.sort((a, b) => b.depth - a.depth);

  painter.begin();
  for (const item of order) {
    for (const [name, corners] of CUBIE_FACES) {
      const normal = item.moving ? apply(mat, FACE_NORMAL[name]) : FACE_NORMAL[name];
      const faceCenter = world([
        item.center[0] + normal[0] * 0.5,
        item.center[1] + normal[1] * 0.5,
        item.center[2] + normal[2] * 0.5,
      ]);
      if (!cam.facesCamera(faceCenter, normal)) continue;

      const quad = corners.map((corner) => {
        const c = item.moving ? apply(mat, corner) : corner;
        const [x, y, z] = world([item.center[0] + c[0], item.center[1] + c[1], item.center[2] + c[2]]);
        return cam.project(x, y, z);
      });

      // Erst der Kunststoffkörper – er füllt die Fugen und ist bei den
      // Innenflächen einer drehenden Scheibe alles, was man sieht.
      painter.path(shapePath(quad, BODY_RADIUS), 'cd-body');

      const color = item.cubie.stickers[name];
      if (!color) continue;
      const d = shapePath(shrink(quad, STICKER_INSET), STICKER_RADIUS);
      painter.path(d, `cd ${CUBE_STICKER_CLASS[color]}`);
      painter.path(d, 'cd-shade', shadeFor(normal));
    }
  }
  painter.end();
}

// Gitterkoordinaten (Mitte bei 0) -> Weltkoordinaten der Kamera (Würfel in [0,3]).
function world(rel) {
  return [rel[0] + 1.5, rel[1] + 1.5, rel[2] + 1.5];
}

function distanceTo(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function shadeFor(normal) {
  return round(SHADE_MAX * (1 - (dot3(normal, LIGHT) + 1) / 2));
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}

// Drehmatrix um eine Einheitsachse (Rodrigues). Der Winkel läuft während einer
// Animation von 0 auf sein Ziel; ganzzahlige Zwischenstände gibt es nicht,
// deshalb hier Fließkomma statt der ganzzahligen Drehung aus cube-state.js.
function rotationMatrix(axis, deg) {
  const a = deg * DEG;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const t = 1 - c;
  const [x, y, z] = axis;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}

function apply(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

// Weich anfahren, weich ankommen – eine Scheibe hat Masse.
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

// ---------------------------------------------------------------------------
// Der Abspieler
// ---------------------------------------------------------------------------

function createPlayer(box, moves) {
  const total = moves.length;
  const cam = makeCamera(3, CELL, VIEW.azimuth, VIEW.elevation, VIEW_PAD);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const ui = buildPlayerDom(box, moves);
  const svg = createSvg(round(cam.width), round(cam.height), `Würfel, ${total} Züge`);
  ui.stage.appendChild(svg);
  const painter = createPainter(svg);

  let cubies = stateAt(0);
  let index = 0; // wie viele Züge des Algorithmus angewandt sind
  let active = -1; // Zug, der gerade hervorgehoben ist
  let anim = null; // die Drehung, die gerade läuft
  let settleCurrent = null; // bringt sie vorzeitig zu Ende
  let playing = false;
  let raf = 0;
  let timer = 0;

  function stateAt(n) {
    const cube = createCube();
    applyMoves(cube, inverseMoves(moves)); // in den Fall zurückbauen
    applyMoves(cube, moves.slice(0, n));
    return cube;
  }

  function draw() {
    paintCube(painter, cam, cubies, anim);
  }

  function update() {
    ui.status.textContent =
      index === 0
        ? `Ausgangsstellung · ${total} ${total === 1 ? 'Zug' : 'Züge'}`
        : `Zug ${index} von ${total}${index === total ? ' · gelöst' : ''}`;
    svg.setAttribute(
      'aria-label',
      index === 0 ? `Würfel in der Ausgangsstellung, ${total} Züge` : `Würfel nach Zug ${index} von ${total}`
    );
    ui.steps.forEach((step, i) => {
      step.classList.toggle('is-done', i < index);
      step.classList.toggle('is-current', i === active);
    });
    ui.reset.disabled = index === 0 && !playing;
    ui.prev.disabled = index === 0;
    ui.next.disabled = index === total;
    ui.play.classList.toggle('is-playing', playing);
    ui.play.textContent = playing ? '❚❚' : '▶';
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Abspielen');

    // Wer sich am letzten Zug entlangklickt, steht plötzlich auf einem
    // deaktivierten Knopf – der Browser wirft den Fokus dann aus dem
    // Abspieler heraus und die Pfeiltasten wären tot. Also auffangen.
    const focused = document.activeElement;
    if (focused?.disabled && ui.player.contains(focused)) ui.player.focus();
  }

  // Eine Vierteldrehung (oder halbe) als Animation. `target` ist der Winkel,
  // auf den die Scheibe zuläuft: im Uhrzeigersinn um die Seitennormale ist das
  // −90°, deshalb das Minus in den Aufrufern.
  function animate(layer, axis, target, longTurn, done) {
    const duration = reduceMotion.matches ? 0 : longTurn ? HALF_MS : QUARTER_MS;
    const started = performance.now();
    anim = { layer, axis, angle: 0 };
    settleCurrent = () => {
      settleCurrent = null;
      anim = null;
      done();
      draw();
      update();
    };

    const tick = (now) => {
      const t = duration ? Math.min(1, (now - started) / duration) : 1;
      anim.angle = target * ease(t);
      draw();
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      settleCurrent();
    };
    raf = requestAnimationFrame(tick);
  }

  // Eine laufende Drehung sofort zu Ende bringen. Wer ungeduldig zweimal auf
  // „weiter" tippt, will den nächsten Zug sehen – nicht denselben nochmal.
  function settle() {
    cancelAnimationFrame(raf);
    settleCurrent?.();
  }

  function stepForward(after) {
    settle();
    if (index === total) {
      after?.();
      return;
    }
    const move = moves[index];
    const { layer, axis, turns } = parseMove(move);
    active = index;
    update();
    animate(layer, axis, -90 * turns, Math.abs(turns) === 2, () => {
      applyMove(cubies, move);
      index += 1;
      after?.();
    });
  }

  function stepBack() {
    settle();
    if (index === 0) return;
    const move = moves[index - 1];
    const { layer, axis, turns } = parseMove(move);
    active = index - 1;
    update();
    // Zurück heißt: dieselbe Scheibe, andere Richtung.
    animate(layer, axis, 90 * turns, Math.abs(turns) === 2, () => {
      applyMove(cubies, invertMove(move));
      index -= 1;
      active = index - 1;
    });
  }

  // Sprung über mehrere Züge – dafür wird der Würfel neu aufgebaut statt Zug
  // für Zug durchgedreht. Nachbarschritte laufen als Animation, damit ein
  // Klick auf den nächsten Zug in der Liste sich anfühlt wie „Weiter".
  function jumpTo(n) {
    settle();
    if (n === index + 1) {
      stepForward();
      return;
    }
    if (n === index - 1) {
      stepBack();
      return;
    }
    stop();
    index = Math.max(0, Math.min(total, n));
    active = index - 1;
    cubies = stateAt(index);
    draw();
    update();
  }

  function advance() {
    if (!playing) return;
    if (index === total) {
      playing = false;
      update();
      return;
    }
    stepForward(() => {
      timer = window.setTimeout(advance, AUTOPLAY_GAP);
    });
  }

  function togglePlay() {
    if (playing) {
      stop();
      return;
    }
    if (index === total) jumpTo(0); // am Ende: von vorn
    playing = true;
    update();
    advance();
  }

  // Abspielen anhalten. Ein Zug, der gerade läuft, wird dabei zu Ende gedreht –
  // auf halbem Weg stehenbleiben wäre keine Stellung, die es am Würfel gibt.
  function stop() {
    playing = false;
    window.clearTimeout(timer);
    settle();
    update();
  }

  ui.reset.addEventListener('click', () => {
    stop();
    jumpTo(0);
  });
  ui.prev.addEventListener('click', () => {
    stop();
    stepBack();
  });
  ui.next.addEventListener('click', () => {
    stop();
    stepForward();
  });
  ui.play.addEventListener('click', togglePlay);
  ui.steps.forEach((step, i) => {
    step.addEventListener('click', () => {
      stop();
      jumpTo(i + 1);
    });
  });
  // Pfeiltasten blättern, sobald der Fokus irgendwo im Abspieler steht.
  ui.player.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      stop();
      stepForward();
    } else if (event.key === 'ArrowLeft') {
      stop();
      stepBack();
    } else {
      return;
    }
    event.preventDefault();
  });
  // Beim Wechsel auf „Bewegung reduzieren" laufende Animationen nicht
  // weiterlaufen lassen – ab jetzt springen die Züge.
  reduceMotion.addEventListener?.('change', () => stop());

  draw();
  update();
  return { stop };
}

function buildPlayerDom(box, moves) {
  const player = document.createElement('div');
  player.className = 'alg-player';
  player.setAttribute('role', 'group');
  player.setAttribute('aria-label', 'Algorithmus Schritt für Schritt');
  // Nicht in der Tab-Reihenfolge, aber programmatisch fokussierbar – siehe
  // die Fokus-Rettung in update().
  player.tabIndex = -1;

  const stage = document.createElement('div');
  stage.className = 'alg-stage';

  const list = document.createElement('ol');
  list.className = 'alg-steps';
  const steps = moves.map((move, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'alg-step';
    button.textContent = move;
    button.setAttribute('aria-label', `Zug ${i + 1}: ${move}`);
    li.appendChild(button);
    list.appendChild(li);
    return button;
  });

  const controls = document.createElement('div');
  controls.className = 'alg-controls';
  const reset = controlButton('⟲', 'Zurück zur Ausgangsstellung');
  const prev = controlButton('‹', 'Ein Zug zurück');
  const play = controlButton('▶', 'Abspielen', 'alg-ctl--play');
  const next = controlButton('›', 'Ein Zug weiter');
  controls.append(reset, prev, play, next);

  const status = document.createElement('p');
  status.className = 'alg-status';
  status.setAttribute('aria-live', 'polite');

  const hint = document.createElement('p');
  hint.className = 'alg-hint';
  hint.textContent = 'Der Würfel startet in der Stellung, die dieser Algorithmus auflöst.';

  player.append(stage, list, controls, status, hint);
  box.appendChild(player);
  return { player, stage, steps, reset, prev, play, next, status };
}

function controlButton(glyph, label, extra = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `alg-ctl ${extra}`.trim();
  button.textContent = glyph;
  button.setAttribute('aria-label', label);
  return button;
}
