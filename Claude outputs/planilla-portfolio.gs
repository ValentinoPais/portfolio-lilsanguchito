/**
 * La planilla del portfolio: Tags (con Activo), Pinneado y la explicación de cada columna.
 *   1. En la planilla: Extensiones > Apps Script. Borrar todo lo que haya (el script de antes también), pegar
 *      esto y guardar (el ícono del disquete).
 *   2. Arriba, elegir «prepararPlanilla», tocar Ejecutar y aceptar el permiso (es solo para esta planilla).
 * Se puede correr de nuevo cuando quieras: no duplica nada ni cambia lo que ya tildaste o cargaste.
 *
 * Qué deja:
 *   - En Trabajos, dos columnas de casillas, cada una con su color y su explicación en el encabezado (con el
 *     mouse encima):
 *       Mostrar (verde): tildado, el video aparece en la web; destildado, no aparece (queda guardado acá).
 *       Pinneado (violeta, después de Tags): tildado, el video va siempre primero, en el orden de esta lista.
 *   - La pestaña Tags con todos los tags (los de la lista, los que ya usaste en Trabajos y Reel) y, al lado de
 *     cada uno, la casilla Activo: destildada, ese tag no aparece en la web (ni su botón), sin borrarlo.
 *   - Un tag nuevo escrito en la pestaña Tags queda activo solo.
 */
var VERDE = '#188038', VIOLETA = '#7c5ce0';
var NOTA = {
  mostrar: 'MOSTRAR (casilla verde)\nTildado: el video aparece en la web.\nDestildado: no aparece (queda guardado acá).',
  tags: 'TAGS (opcional)\nElegí uno o varios de la pestaña Tags: el video aparece en Todo y en esos.\nVacío: aparece solo en Todo.\nLos verticales van solos a «Reel»: no hace falta ponérselo.',
  pin: 'PINNEADO (casilla violeta)\nTildado: el video va siempre primero (en Todo, en sus tags y en los reels), en el orden de esta lista.\nDestildado: va en el orden de siempre (de más a menos views).',
  tag: 'TAG\nUn tag por fila, sin comas. En la web, los botones van en el orden de esta lista (Todo, siempre primero); un tag sin videos no aparece.',
  activo: 'ACTIVO\nTildado: el tag aparece en la web.\nDestildado: no aparece (ni su botón), sin borrarlo. Sus videos siguen en Todo y en sus otros tags.',
  reel: 'Automático: todos los videos verticales (Shorts, TikToks y reels) van solos acá. Destildá Activo para sacar el botón Reel.'
};
var AYUDA_TAGS = ['Cómo usar',
  'Un tag por fila, en las celdas amarillas: se pueden agregar, cambiar de nombre, ordenar o borrar.',
  'Activo: tildado, el tag aparece en la web; destildado, no aparece (ni su botón), sin borrarlo.',
  'En Trabajos, columna Tags, cada video lleva los que elijas: uno o varios. Aparece en Todo y en esos.',
  'Un video sin tags aparece solo en Todo.',
  'Reel es automático: lo llevan todos los videos verticales (no hace falta ponérselo).',
  'En la web, los botones van en el orden de esta lista; un tag sin videos no aparece.',
  'Si le cambiás el nombre a un tag, cambialo también en los videos que lo tenían.'];

function prepararPlanilla() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tr = ss.getSheetByName('Trabajos');
  if (!tr) throw new Error('No está la pestaña Trabajos');
  var rows = tr.getMaxRows();
  var cabeza = function () { return tr.getRange(1, 1, 1, tr.getMaxColumns()).getValues()[0].map(function (v) { return String(v).trim(); }); };
  var mc = cabeza().indexOf('Mostrar') + 1 || 4;

  // ---- Trabajos: Tags, después de Mostrar ----
  var col = cabeza().indexOf('Tags') + 1;
  if (!col) {
    tr.insertColumnAfter(mc);
    col = mc + 1;
    tr.getRange(2, col, rows - 1, 1).clearDataValidations().clearContent();   // al insertarla, Sheets le copia las casillas de Mostrar
    tr.getRange(1, mc).copyFormatToRange(tr, col, col, 1, 1);
    tr.getRange(2, 3, rows - 1, 1).copyFormatToRange(tr, col, col, 2, rows);   // las celdas amarillas, como las de Cliente
    tr.getRange(1, col).setValue('Tags');
    tr.setColumnWidth(col, 260);
  }

  // ---- Trabajos: Pinneado, después de Tags ----
  var pc = cabeza().indexOf('Pinneado') + 1;
  if (!pc) {
    tr.insertColumnAfter(col);
    pc = col + 1;
    var cel = tr.getRange(2, pc, rows - 1, 1);
    cel.clearDataValidations().clearContent();                                 // al insertarla, Sheets le copia el desplegable de Tags
    tr.getRange(1, mc).copyFormatToRange(tr, pc, pc, 1, 1);
    tr.getRange(2, mc, rows - 1, 1).copyFormatToRange(tr, pc, pc, 2, rows);   // las celdas, como las de Mostrar
    tr.getRange(1, pc).setValue('Pinneado');
    cel.insertCheckboxes();                                                    // todas destildadas
    tr.setColumnWidth(pc, 90);
  }

  // ---- cuál es cuál: cada casilla con su color y la explicación en cada encabezado ----
  tr.getRange(2, mc, rows - 1, 1).setFontColor(VERDE);
  tr.getRange(2, pc, rows - 1, 1).setFontColor(VIOLETA);
  tr.getRange(1, mc).setNote(NOTA.mostrar);
  tr.getRange(1, col).setNote(NOTA.tags);
  tr.getRange(1, pc).setNote(NOTA.pin);

  // ---- la pestaña Tags: el tag y su casilla Activo ----
  var tg = ss.getSheetByName('Tags');
  if (!tg) {
    tg = ss.insertSheet('Tags', tr.getIndex());
    tr.getRange(1, mc).copyFormatToRange(tg, 1, 2, 1, 1);
    tg.getRange(1, 1, 1, 2).setValues([['Tag', 'Activo']]);
    tr.getRange(2, 3).copyFormatToRange(tg, 1, 1, 2, 101);                     // las celdas amarillas
    tg.setColumnWidth(1, 220); tg.setColumnWidth(2, 70); tg.setColumnWidth(3, 20); tg.setColumnWidth(4, 520);
    tg.setFrozenRows(1);
  } else if (String(tg.getRange(1, 2).getValue()).trim() !== 'Activo') {
    tg.insertColumnAfter(1);                                                   // al lado de cada tag (la ayuda se corre a la derecha)
    tg.getRange(2, 2, tg.getMaxRows() - 1, 1).clearDataValidations().clearContent();
    tg.getRange(1, 1).copyFormatToRange(tg, 2, 2, 1, 1);
    tg.getRange(1, 2).setValue('Activo');
    tg.setColumnWidth(2, 70);
  }
  tg.getRange(1, 1).setNote(NOTA.tag);
  tg.getRange(1, 2).setNote(NOTA.activo);

  // todos los tags: los de la lista, los que ya se usaron en Trabajos y Reel (los que faltan, al final)
  var n = Math.max(1, tg.getLastRow() - 1);
  var lista = tg.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); });
  var hay = {}, faltan = [];
  lista.forEach(function (t) { if (t) hay[t.toLowerCase()] = 1; });
  tr.getRange(2, col, rows - 1, 1).getValues().forEach(function (r) {
    if (typeof r[0] !== 'string') return;
    r[0].split(',').forEach(function (t) { t = t.trim(); if (t && !hay[t.toLowerCase()]) { hay[t.toLowerCase()] = 1; faltan.push(t); } });
  });
  if (!hay.reel && !hay.reels) faltan.push('Reel');
  var ultima = 1;
  lista.forEach(function (t, i) { if (t) ultima = i + 2; });
  if (faltan.length) tg.getRange(ultima + 1, 1, faltan.length, 1).setValues(faltan.map(function (t) { return [t]; }));
  ultima += faltan.length;

  // las casillas Activo: las que ya estaban quedan como estaban; los tags sin casilla, tildados
  var hasta = Math.max(101, ultima + 20);
  if (tg.getMaxRows() < hasta) tg.insertRowsAfter(tg.getMaxRows(), hasta - tg.getMaxRows());
  var tags = tg.getRange(2, 1, hasta - 1, 1).getValues(), act = tg.getRange(2, 2, hasta - 1, 1);
  var vals = act.getValues().map(function (r, i) {
    if (typeof r[0] === 'boolean') return [r[0]];
    return [String(tags[i][0]).trim() ? true : ''];
  });
  act.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  act.setValues(vals).setFontColor(VERDE).setHorizontalAlignment('center');
  tags.forEach(function (r, i) { if (/^reels?$/i.test(String(r[0]).trim())) tg.getRange(i + 2, 1).setNote(NOTA.reel); });

  // la ayuda de la pestaña Tags (la columna «Cómo usar»)
  var top = tg.getRange(1, 1, 1, tg.getMaxColumns()).getValues()[0], hc = 0;
  for (var c = 3; c <= top.length; c++) if (String(top[c - 1]).trim() === 'Cómo usar') { hc = c; break; }
  if (!hc) hc = 4;
  tg.getRange(1, hc, 12, 1).clearContent();
  tg.getRange(1, hc, AYUDA_TAGS.length, 1).setValues(AYUDA_TAGS.map(function (t) { return [t]; }))
    .setFontFamily('Arial').setFontSize(10).setFontColor('#444444').setWrap(true).setVerticalAlignment('top');
  tg.getRange(1, hc).setFontWeight('bold').setFontColor('#000000');

  // ---- la ayuda de Trabajos (la columna «Cómo cargar») ----
  var tt = cabeza(), help = 0;
  for (var k = pc + 1; k <= tt.length; k++) if (tt[k - 1] === 'Cómo cargar') { help = k; break; }
  if (help) {
    var v = tr.getRange(1, help, Math.min(40, rows), 1).getValues().map(function (r) { return String(r[0]); });
    var cambiar = function (de, a) { var i = v.indexOf(de); if (i >= 0) { tr.getRange(i + 1, help).setValue(a); v[i] = a; } return i; };
    var debajo = function (de, linea) {                                        // una línea nueva, debajo de otra
      if (v.indexOf(linea) >= 0) return;
      var i = v.indexOf(de), at = i >= 0 ? i + 2 : v.filter(function (t) { return t.trim(); }).length + 1;
      tr.getRange(at, help).insertCells(SpreadsheetApp.Dimension.ROWS);
      tr.getRange(at - 1, help).copyFormatToRange(tr, help, help, at, at);
      tr.getRange(at, help).setValue(linea);
      v.splice(at - 1, 0, linea);
    };
    var letra = String.fromCharCode(64 + pc + 1);
    ['E', 'F', 'G'].forEach(function (l) { cambiar('Todo lo que está de la columna ' + l + ' para la derecha es esta ayuda: la web no lo lee.', 'Todo lo que está de la columna ' + letra + ' para la derecha es esta ayuda: la web no lo lee.'); });
    var tagsLinea = 'Tags: uno o varios por video, de la pestaña Tags. Sin tags, el video aparece solo en Todo; con tags, en Todo y en esos. Los verticales van solos a «Reel».';
    cambiar('Tags: uno o varios por video, de la pestaña Tags. Vacío: los automáticos de YouTube; con tags, el video aparece solo en esos.', tagsLinea);
    cambiar('Tags: uno o varios por video, de la pestaña Tags. Vacío: los automáticos (los de YouTube y, en los verticales, «Reel»); con tags, el video aparece solo en esos.', tagsLinea);
    debajo('Mostrar: en Hojas de cálculo, seleccioná la columna D y Insertar > Casilla de verificación.', tagsLinea);
    debajo(tagsLinea, 'Pinneado: tildado, el video va siempre primero (en Todo, en sus tags y en los reels), en el orden de esta lista.');
  }

  ss.toast('Mostrar (verde) y Pinneado (violeta) en Trabajos; Activo en Tags. Con el mouse sobre cada encabezado está la explicación.', 'Planilla lista', 15);
}

// un tag nuevo escrito en la pestaña Tags: queda activo solo
function onEdit(e) {
  var r = e && e.range;
  if (!r || r.getColumn() !== 1 || r.getRow() < 2 || r.getNumColumns() !== 1) return;
  var sh = r.getSheet();
  if (sh.getName() !== 'Tags' || String(sh.getRange(1, 2).getValue()).trim() !== 'Activo') return;
  var tags = r.getValues(), act = r.offset(0, 1), vals = act.getValues(), cambio = false;
  tags.forEach(function (t, i) { if (String(t[0]).trim() && typeof vals[i][0] !== 'boolean') { vals[i][0] = true; cambio = true; } });
  if (!cambio) return;
  act.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  act.setValues(vals).setFontColor(VERDE).setHorizontalAlignment('center');
}
