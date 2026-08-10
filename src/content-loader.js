import { marked } from 'marked';
import { buildCubeFigure, buildCubeFigureHtml } from './cube-diagram.js';

// Lädt eine Content-Datei zur Runtime, splittet sie an den H2-Überschriften
// in Lektions-Objekte und bereitet den Inhalt als HTML auf. Die Notation
// (R U R' U' …) und der wiederkehrende Name ROAR werden dabei ausgezeichnet.
// Ein pathId entspricht 1:1 einer Datei content/<pathId>.md.

const cache = new Map();

export async function loadLessons(pathId) {
  if (cache.has(pathId)) return cache.get(pathId);
  // BASE_URL macht den Pfad portabel (Dev-Server wie GitHub-Pages-Unterpfad).
  const url = `${import.meta.env.BASE_URL}content/${pathId}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${pathId}.md konnte nicht geladen werden (HTTP ${res.status})`);
  const raw = await res.text();
  const lessons = parseLessons(raw);
  cache.set(pathId, lessons);
  return lessons;
}

// ---------------------------------------------------------------------------
// Splitten & Feld-Extraktion
// ---------------------------------------------------------------------------

function parseLessons(raw) {
  // An jeder H2 auftrennen; das erste Stück ist die Doku-Einleitung vor
  // "## Lektion 1". Sektionen ohne "Lektion N:" (z.B. "Was jetzt?") fallen
  // durch die Regex-Prüfung unten heraus.
  const sections = raw.split(/^## /m).slice(1);
  const lessons = [];

  for (const section of sections) {
    const nl = section.indexOf('\n');
    const heading = (nl === -1 ? section : section.slice(0, nl)).trim();
    const headMatch = heading.match(/^Lektion\s+(\d+):\s*(.+)$/);
    if (!headMatch) continue;

    const number = parseInt(headMatch[1], 10);
    const title = headMatch[2].trim();
    let body = nl === -1 ? '' : section.slice(nl + 1);

    // Ziel-Bild-Zeile herausziehen (wird separat über dem Text gerendert).
    // Folgt direkt darunter ein ```cube- oder ```cube-net-Block, wird daraus
    // das echte Bild; ohne Block bleibt der gestrichelte Platzhalter.
    let goalImageDesc = '';
    let goalImageCaption = '';
    let goalImageHtml = '';
    body = body.replace(GOAL_IMAGE_RE, (_full, rest, kind, block) => {
      const parsed = parseGoalImage(rest.trim());
      goalImageDesc = parsed.desc;
      goalImageCaption = parsed.caption;
      if (kind) goalImageHtml = buildCubeFigureHtml(kind, block, goalImageDesc);
      return '';
    });

    // "Abhaken, wenn:"-Zeile herausziehen (eigener Callout am Lektionsende).
    let abhakenWenn = '';
    body = body.replace(/^\*\*Abhaken, wenn:\*\*\s*(.+)$/m, (_full, rest) => {
      abhakenWenn = rest.trim();
      return '';
    });

    // Reine Trennlinien (---) zwischen den Lektionen entfernen.
    body = body.replace(/^---\s*$/gm, '').trim();

    lessons.push({
      number,
      title,
      goalImageDesc,
      goalImageCaption,
      goalImageHtml,
      content: renderLessonHtml(body),
      abhakenWenn,
    });
  }

  lessons.sort((a, b) => a.number - b.number);
  return lessons;
}

// Die Ziel-Bild-Zeile plus optional direkt darunter (nur Leerzeilen dazwischen)
// ein Diagramm-Block. `\n+` statt `\s*` sorgt dafür, dass ein Block hinter
// einem normalen Absatz nicht mehr eingesammelt wird.
const GOAL_IMAGE_RE =
  /^\*\*Ziel-Bild:\*\*[ \t]*(.+)(?:\n+```(cube-net|cube)[ \t]*\n([\s\S]*?)\n```)?/m;

// "Beschreibung. Bildunterschrift: „Text"" -> { desc, caption }
function parseGoalImage(text) {
  const marker = 'Bildunterschrift:';
  const idx = text.indexOf(marker);
  if (idx === -1) return { desc: text, caption: '' };
  const desc = text.slice(0, idx).trim().replace(/\.\s*$/, '');
  const caption = text
    .slice(idx + marker.length)
    .trim()
    .replace(/^[„"'«»]+/, '')
    .replace(/["'«».]+$/, '')
    .trim();
  return { desc, caption };
}

// ---------------------------------------------------------------------------
// Markdown -> HTML + Notations-Auszeichnung (Post-Processing)
// ---------------------------------------------------------------------------

function renderLessonHtml(md) {
  const html = marked.parse(md);
  return annotateNotation(html);
}

// Ein Zug ist ein Face-Buchstabe (R L U D F B) oder die mittlere Scheibe M
// (Roux), mit optionalem ' oder 2. Kleingeschriebene Wide-Moves wie r bleiben
// bewusst draußen: Sie tauchen nie in Mehr-Zug-Sequenzen auf, würden aber im
// deutschen Fließtext Fehltreffer erzeugen.
// Lookbehind/Lookahead verhindern, dass Buchstaben mitten im Wort als Zug
// zählen (sonst würde z.B. "ROAR" in "F ROAR F'" als R-…-R-Sequenz anreißen).
const MOVE = /(?<![A-Za-zÄÖÜäöü])[RLUDFBM](?:['’2])?(?![A-Za-zÄÖÜäöü])/;
const MOVE_G = /(?<![A-Za-zÄÖÜäöü])[RLUDFBM](?:['’2])?(?![A-Za-zÄÖÜäöü])/g;
// Eine Notations-Sequenz: mindestens zwei durch Leerraum getrennte Züge.
const SEQUENCE_G = new RegExp(`${MOVE.source}(?:\\s+${MOVE.source})+`, 'g');
// Eine "reine" Notations-Zeile besteht ausschließlich aus Zügen/Trennern.
const PURE_LINE = /^[RLUDFBM2'’\s–—-]+$/;

// Läuft nach dem Markdown-Parsing über das erzeugte DOM:
//  0. ```cube-Codeblöcke werden zu Inline-SVG-Würfeldiagrammen (Draufsicht).
//  1. Absätze, die NUR aus Notation bestehen, werden zum großen Algorithmus-Kasten.
//  1b. Ebenso die benannten Zitate der Bauart "> **Sune** = **R U R' U R U2 R'**" –
//      an dieser Stelle führt der Content jeden Algorithmus ein.
//  2. Inline-Notationssequenzen in normalem Text werden in <code class="alg"> gewickelt.
//  3. Jedes Vorkommen von ROAR wird zum <span class="roar-badge">.
function annotateNotation(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;

  // 0) Würfeldiagramme
  root.querySelectorAll('pre > code.language-cube, pre > code.language-cube-net').forEach((code) => {
    const kind = code.classList.contains('language-cube-net') ? 'cube-net' : 'cube';
    const figure = buildCubeFigure(kind, code.textContent);
    if (figure) code.parentElement.replaceWith(figure);
  });

  // 1) Reine-Notation-Absätze -> Algorithmus-Kasten
  root.querySelectorAll('p').forEach((p) => {
    if (isPureNotation(p.textContent.trim())) {
      p.replaceWith(buildAlgBox(p.textContent.trim()));
    }
  });

  // 1b) Benannte Algorithmus-Zitate -> derselbe Kasten, mit Namen darüber
  root.querySelectorAll('blockquote').forEach((quote) => {
    const box = algBoxFromQuote(quote);
    if (box) quote.replaceWith(box);
  });

  // 2) + 3) Textknoten inline auszeichnen (nicht innerhalb von code/pre/alg-box).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement && node.parentElement.closest('code, pre, .alg-box')) continue;
    textNodes.push(node);
  }
  for (const node of textNodes) {
    const original = node.nodeValue;
    const replaced = annotateText(original);
    if (replaced !== escapeHtml(original)) {
      const holder = document.createElement('span');
      holder.innerHTML = replaced;
      node.replaceWith(...holder.childNodes);
    }
  }

  const out = document.createElement('div');
  out.appendChild(root);
  return out.innerHTML;
}

function isPureNotation(text) {
  if (!text || !PURE_LINE.test(text)) return false;
  const moves = text.match(MOVE_G) || [];
  return moves.length >= 2;
}

// Der Kasten ist zugleich der Schalter für den Abspieler (siehe
// alg-player.js): aufgeklappt dreht darunter ein Würfel die Züge einzeln
// durch. Die Züge stehen normalisiert in data-alg, damit der Abspieler sie
// nicht aus dem angezeigten Text zurückparsen muss.
function buildAlgBox(text, name = '') {
  const moves = normalizeMoves(text);

  const box = document.createElement('div');
  box.className = 'alg-box';
  box.dataset.alg = moves;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'alg-toggle';
  toggle.setAttribute('aria-expanded', 'false');

  const play = document.createElement('span');
  play.className = 'alg-play';
  play.setAttribute('aria-hidden', 'true');
  play.textContent = '▶';

  const stack = document.createElement('span');
  stack.className = 'alg-text';

  // Kopfzeile: links der Name, rechts der Hinweis auf die Animation. Der
  // Hinweis steht bewusst hier und nicht neben den Zügen – dort würde er
  // ihnen die Breite nehmen und schon kurze Algorithmen umbrechen lassen.
  const head = document.createElement('span');
  head.className = 'alg-head';
  if (name) {
    const label = document.createElement('span');
    label.className = 'alg-name';
    // Über annotateText, damit ROAR auch hier sein Badge behält.
    label.innerHTML = annotateText(name);
    head.appendChild(label);
  }
  const hint = document.createElement('span');
  hint.className = 'alg-toggle-hint';
  hint.textContent = 'Animation';
  head.appendChild(hint);

  const code = document.createElement('code');
  code.className = 'alg';
  code.textContent = moves;
  stack.append(head, code);

  toggle.append(play, stack);
  box.appendChild(toggle);
  return box;
}

// "> **Sune** = **R U R' U R U2 R'**" oder "> **Der Swap:** R U R' U' …":
// So führt der Content jeden Algorithmus ein – ein Zitat mit Namen links und
// den Zügen rechts. Genau diese Zitate werden zum Kasten mit Abspieler.
// Alles andere (normale Merksätze im Zitat) bleibt unangetastet.
const NAMED_ALG_RE = /^(.+?)\s*[=:]\s*(.+)$/;

function algBoxFromQuote(quote) {
  const paragraphs = quote.querySelectorAll('p');
  if (paragraphs.length !== 1) return null;
  const text = paragraphs[0].textContent.trim();

  if (isPureNotation(text)) return buildAlgBox(text);

  const match = text.match(NAMED_ALG_RE);
  if (!match || !isPureNotation(match[2].trim())) return null;
  return buildAlgBox(match[2].trim(), match[1].trim());
}

// Text mit Inline-Notation und ROAR anreichern. Gibt HTML zurück.
function annotateText(text) {
  let s = escapeHtml(text);
  s = s.replace(SEQUENCE_G, (seq) => `<code class="alg">${normalizeMoves(seq)}</code>`);
  s = s.replace(/\bROAR\b/g, '<span class="roar-badge">ROAR</span>');
  return s;
}

// Züge normalisieren: krumme Apostrophe angleichen, sauber mit Leerzeichen setzen.
function normalizeMoves(text) {
  const moves = text.match(MOVE_G) || [];
  return moves.map((m) => m.replace('’', "'")).join(' ');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
