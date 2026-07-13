// Kleine gemeinsame Bausteine für die Views. Kein Framework – reine
// DOM-Erzeugung und Template-Strings.

// Setzt den Seiteninhalt und schaltet die Pfad-Leitfarbe über eine
// data-Eigenschaft am <body>. Das CSS mappt sie auf die Variable --accent.
export function mount(container, { accent = null, html }) {
  document.body.dataset.accent = accent || '';
  container.innerHTML = html;
  container.scrollTop = 0;
  window.scrollTo(0, 0);
}

// Obere App-Leiste. `back` ist optional { href, label }.
export function appBar({ back = null, title = 'Cube&nbsp;Chill', subtitle = '' } = {}) {
  const backLink = back
    ? `<a class="appbar-back" href="${back.href}" aria-label="${back.label}">
         <span class="chevron" aria-hidden="true">‹</span><span>${back.label}</span>
       </a>`
    : `<span class="appbar-brand">🧊 Cube&nbsp;Chill</span>`;
  const heading = back
    ? `<div class="appbar-heading"><span class="appbar-title">${title}</span>${
        subtitle ? `<span class="appbar-sub">${subtitle}</span>` : ''
      }</div>`
    : '';
  return `<header class="appbar">${backLink}${heading}</header>`;
}

// HTML-escape für dynamisch eingesetzte Texte (Titel, Captions).
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
