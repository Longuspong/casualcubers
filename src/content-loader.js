import { marked } from 'marked';

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

    // Ziel-Bild-Zeile herausziehen (wird separat als Platzhalter gerendert).
    let goalImageDesc = '';
    let goalImageCaption = '';
    body = body.replace(/^\*\*Ziel-Bild:\*\*\s*(.+)$/m, (_full, rest) => {
      const parsed = parseGoalImage(rest.trim());
      goalImageDesc = parsed.desc;
      goalImageCaption = parsed.caption;
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
      content: renderLessonHtml(body),
      abhakenWenn,
    });
  }

  lessons.sort((a, b) => a.number - b.number);
  return lessons;
}

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
const MOVE = /[RLUDFBM](?:['’2])?/;
const MOVE_G = /[RLUDFBM](?:['’2])?/g;
// Eine Notations-Sequenz: mindestens zwei durch Leerraum getrennte Züge.
const SEQUENCE_G = new RegExp(`${MOVE.source}(?:\\s+${MOVE.source})+`, 'g');
// Eine "reine" Notations-Zeile besteht ausschließlich aus Zügen/Trennern.
const PURE_LINE = /^[RLUDFBM2'’\s–—-]+$/;

// Läuft nach dem Markdown-Parsing über das erzeugte DOM:
//  1. Absätze, die NUR aus Notation bestehen, werden zum großen Algorithmus-Kasten.
//  2. Inline-Notationssequenzen in normalem Text werden in <code class="alg"> gewickelt.
//  3. Jedes Vorkommen von ROAR wird zum <span class="roar-badge">.
function annotateNotation(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;

  // 1) Reine-Notation-Absätze -> Algorithmus-Kasten
  root.querySelectorAll('p').forEach((p) => {
    if (isPureNotation(p.textContent.trim())) {
      p.replaceWith(buildAlgBox(p.textContent.trim()));
    }
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

function buildAlgBox(text) {
  const box = document.createElement('div');
  box.className = 'alg-box';

  const play = document.createElement('span');
  play.className = 'alg-play';
  play.setAttribute('aria-hidden', 'true');
  play.textContent = '▶';

  const code = document.createElement('code');
  code.className = 'alg';
  code.textContent = normalizeMoves(text);

  box.append(play, code);
  return box;
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
