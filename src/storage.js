// Minimaler localStorage-Wrapper für den Lern-Fortschritt.
// Datenform:  { "beginner": { "1": true, "3": true }, ... }
// Ein Eintrag existiert nur, wenn eine Lektion abgehakt ist – abgewählte
// Lektionen werden gelöscht, damit der Speicher schlank bleibt.

const KEY = 'cubechill:progress';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    // Kaputter oder gesperrter Storage: lieber leer weitermachen als crashen.
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Privater Modus / voller Storage: Fortschritt hält dann eben nur die Sitzung.
  }
}

export function isDone(path, lesson) {
  const data = readAll();
  return Boolean(data[path] && data[path][lesson]);
}

export function setDone(path, lesson, done) {
  const data = readAll();
  data[path] = data[path] || {};
  if (done) {
    data[path][lesson] = true;
  } else {
    delete data[path][lesson];
    if (Object.keys(data[path]).length === 0) delete data[path];
  }
  writeAll(data);
  return done;
}

export function toggleDone(path, lesson) {
  return setDone(path, lesson, !isDone(path, lesson));
}

export function countDone(path) {
  const data = readAll();
  return data[path] ? Object.keys(data[path]).length : 0;
}

export function resetPath(path) {
  const data = readAll();
  delete data[path];
  writeAll(data);
}
