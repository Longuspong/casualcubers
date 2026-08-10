// Ein sehr kleiner PDF-Schreiber – gerade groß genug für die Bilderanleitung.
//
// Warum kein Renderer von der Stange? Die Anleitung besteht ausschließlich aus
// Vektorformen (Rechtecke, Pfade, Kreise) und enthält bewusst keinen einzigen
// Buchstaben. Damit fällt der einzige wirklich unangenehme Teil eines PDFs weg
// – Fonts – und übrig bleibt: ein Objektbaum, pro Seite ein Content-Stream und
// eine xref-Tabelle. Das ist weniger Code als jede Abhängigkeit, die wir uns
// dafür ins Projekt holen würden, und der Build läuft ohne Browser.
//
// Koordinaten: PDF rechnet von unten links nach oben. Weil sich Seiten so
// schlecht denken lassen, dreht jede Seite die Achse einmal um (`1 0 0 -1 0 H`)
// – ab da gilt in allen Zeichenfunktionen: (0,0) ist oben links, y wächst nach
// unten, genau wie im SVG der Website.

import { deflateSync } from 'node:zlib';

const enc = (s) => Buffer.from(s, 'latin1');

function fmt(n) {
  // Drei Nachkommastellen reichen bei Punkt-Maßen; das hält die Streams klein
  // und die Ausgabe zwischen zwei Läufen identisch.
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

function toRgb(color) {
  const hex = color.replace('#', '');
  const v = parseInt(hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => fmt(c / 255));
}

export class Page {
  constructor(doc, width, height) {
    this.doc = doc;
    this.width = width;
    this.height = height;
    // Ursprung nach oben links, y nach unten.
    this.ops = [`1 0 0 -1 0 ${fmt(height)} cm`, '1 J 1 j'];
  }

  op(s) {
    this.ops.push(s);
    return this;
  }

  save() { return this.op('q'); }

  restore() { return this.op('Q'); }

  translate(x, y) { return this.op(`1 0 0 1 ${fmt(x)} ${fmt(y)} cm`); }

  scale(sx, sy = sx) { return this.op(`${fmt(sx)} 0 0 ${fmt(sy)} 0 0 cm`); }

  rotate(deg) {
    const a = (deg * Math.PI) / 180;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return this.op(`${fmt(c)} ${fmt(s)} ${fmt(-s)} ${fmt(c)} 0 0 cm`);
  }

  fillColor(color) {
    const [r, g, b] = toRgb(color);
    return this.op(`${r} ${g} ${b} rg`);
  }

  strokeColor(color) {
    const [r, g, b] = toRgb(color);
    return this.op(`${r} ${g} ${b} RG`);
  }

  lineWidth(w) { return this.op(`${fmt(w)} w`); }

  // --- Pfade ---------------------------------------------------------------

  moveTo(x, y) { return this.op(`${fmt(x)} ${fmt(y)} m`); }

  lineTo(x, y) { return this.op(`${fmt(x)} ${fmt(y)} l`); }

  curveTo(x1, y1, x2, y2, x3, y3) {
    return this.op(`${fmt(x1)} ${fmt(y1)} ${fmt(x2)} ${fmt(y2)} ${fmt(x3)} ${fmt(y3)} c`);
  }

  close() { return this.op('h'); }

  paint({ fill, stroke, width } = {}) {
    if (fill) this.fillColor(fill);
    if (stroke) this.strokeColor(stroke);
    if (width != null) this.lineWidth(width);
    if (fill && stroke) return this.op('B');
    if (fill) return this.op('f');
    return this.op('S');
  }

  // --- Formen --------------------------------------------------------------

  polygon(points, style) {
    points.forEach(([x, y], i) => (i ? this.lineTo(x, y) : this.moveTo(x, y)));
    this.close();
    return this.paint(style);
  }

  line(x1, y1, x2, y2, style) {
    this.moveTo(x1, y1).lineTo(x2, y2);
    return this.paint({ ...style, fill: null });
  }

  rect(x, y, w, h, style) {
    this.op(`${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re`);
    return this.paint(style);
  }

  roundRect(x, y, w, h, r, style) {
    const rr = Math.min(r, w / 2, h / 2);
    const k = rr * 0.5523;
    this.moveTo(x + rr, y);
    this.lineTo(x + w - rr, y);
    this.curveTo(x + w - rr + k, y, x + w, y + rr - k, x + w, y + rr);
    this.lineTo(x + w, y + h - rr);
    this.curveTo(x + w, y + h - rr + k, x + w - rr + k, y + h, x + w - rr, y + h);
    this.lineTo(x + rr, y + h);
    this.curveTo(x + rr - k, y + h, x, y + h - rr + k, x, y + h - rr);
    this.lineTo(x, y + rr);
    this.curveTo(x, y + rr - k, x + rr - k, y, x + rr, y);
    this.close();
    return this.paint(style);
  }

  circle(cx, cy, r, style) {
    const k = r * 0.5523;
    this.moveTo(cx + r, cy);
    this.curveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
    this.curveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
    this.curveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
    this.curveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
    this.close();
    return this.paint(style);
  }

  // Kreisbogen als Polyline – für die runden Pfeile reicht das völlig und
  // spart die Bezier-Zerlegung.
  arc(cx, cy, r, fromDeg, toDeg, style) {
    const steps = Math.max(6, Math.ceil(Math.abs(toDeg - fromDeg) / 8));
    for (let i = 0; i <= steps; i += 1) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
      const [x, y] = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      if (i === 0) this.moveTo(x, y);
      else this.lineTo(x, y);
    }
    return this.paint({ ...style, fill: null });
  }
}

export class PdfDoc {
  constructor({ width = 842, height = 595 } = {}) {
    this.width = width;
    this.height = height;
    this.pages = [];
  }

  addPage() {
    const page = new Page(this, this.width, this.height);
    this.pages.push(page);
    return page;
  }

  toBuffer() {
    const objects = []; // 1-basiert, objects[i] = Body des Objekts i+1
    const add = (body) => objects.push(body); // push liefert die neue Länge = Objektnummer

    const catalogId = add(''); // Platzhalter, Nummern müssen vorab feststehen
    const pagesId = add('');
    const pageIds = [];
    for (const page of this.pages) {
      // Die Streams sind reiner Text und lassen sich um ~85 % packen – das
      // PDF liegt im Repo, also lohnt sich das.
      const content = deflateSync(Buffer.from(page.ops.join('\n'), 'latin1')).toString('latin1');
      const streamId = add(
        `<< /Length ${content.length} /Filter /FlateDecode >>\nstream\n${content}\nendstream`
      );
      pageIds.push(
        add(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${fmt(this.width)} ${fmt(this.height)}] ` +
            `/Resources << /ProcSet [/PDF] >> /Contents ${streamId} 0 R >>`
        )
      );
    }
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] =
      `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;

    const chunks = [enc('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')];
    let offset = chunks[0].length;
    const offsets = [];
    objects.forEach((body, i) => {
      const chunk = enc(`${i + 1} 0 obj\n${body}\nendobj\n`);
      offsets.push(offset);
      offset += chunk.length;
      chunks.push(chunk);
    });

    const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
    for (const o of offsets) xref.push(`${String(o).padStart(10, '0')} 00000 n \n`);
    chunks.push(enc(xref.join('')));
    chunks.push(
      enc(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${offset}\n%%EOF\n`)
    );
    return Buffer.concat(chunks);
  }
}
