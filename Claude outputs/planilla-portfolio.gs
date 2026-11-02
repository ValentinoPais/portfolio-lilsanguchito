/**
 * La planilla del portfolio: Tags (con Activo), Pinneado, la explicación de cada columna y los datos de los TikTok
 * y reels de Instagram (la pestaña Redes).
 *   1. En la planilla: Extensiones > Apps Script. Borrar todo lo que haya (el script de antes también), pegar
 *      esto y guardar (el ícono del disquete).
 *   2. Arriba, elegir «activarRedes», tocar Ejecutar y aceptar los permisos. Google avisa que la app no está
 *      verificada porque es un script propio: Configuración avanzada > Ir a … (no seguro) > Permitir.
 *   3. Volver a cargar la planilla: aparece el menú Portfolio.
 * Desde ahí, los TikTok y reels de Instagram de Trabajos se completan solos cada hora (o en el momento, con
 * Portfolio > Completar TikTok e Instagram ahora): solo hace falta pegar el link.
 * «prepararPlanilla» ya está hecho; se puede correr de nuevo cuando quieras: no duplica nada ni cambia lo que ya
 * tildaste o cargaste.
 *
 * Qué deja «prepararPlanilla»:
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

// ======================= TikTok e Instagram: la pestaña Redes =======================
// TikTok e Instagram ya no les pasan a otras páginas el título, la miniatura ni las views de sus videos. Este script
// los busca: de cada link de TikTok o de Instagram de Trabajos completa una fila de la pestaña Redes (oculta), que
// es lo que lee la web. Las miniaturas quedan guardadas en una carpeta del Drive («Portfolio - miniaturas de TikTok
// e Instagram»), compartida con cualquiera que tenga el link, así la web las puede mostrar.
// Corre solo cada hora: completa los links nuevos y, cada 12 horas, las views y los likes de los que ya estaban.
// También desde el menú Portfolio > Completar TikTok e Instagram ahora.
var REDES = 'Redes';
var COLUMNAS = ['Link', 'Título', 'Autor', 'Miniatura', 'Views', 'Likes', 'Video', 'Actualizado', 'Nota'];   // la web lee de Link a Video
var CADA = 12 * 3600e3;                                                    // cada cuánto se actualizan las views y los likes
var NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Portfolio')
    .addItem('Completar TikTok e Instagram ahora', 'completarRedes')
    .addToUi();
}

// Una sola vez: crea la pestaña Redes y la carpeta de las miniaturas, deja el script corriendo solo cada hora y
// completa todo por primera vez.
function activarRedes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  hojaRedes(ss);
  carpetaMiniaturas();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'completarRedes') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('completarRedes').timeBased().everyHours(1).create();
  var r = completarRedes();
  var msg = 'Listo: se completa solo cada hora.' + (r ? ' Ahora: ' + resumen(r) : '');
  Logger.log(msg);
  ss.toast(msg, 'TikTok e Instagram', 20);
}

function completarRedes() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return null;                                    // ya está corriendo (el de cada hora y el del menú a la vez)
  try {
    var r = completar();
    SpreadsheetApp.getActiveSpreadsheet().toast(resumen(r), 'TikTok e Instagram', 15);
    return r;
  } finally { lock.releaseLock(); }
}

function resumen(r) {
  return r.links + (r.links === 1 ? ' link' : ' links') + ' de TikTok e Instagram; ' + r.hechos + (r.hechos === 1 ? ' completado' : ' completados') + ' ahora' +
    (r.fallas ? ', ' + r.fallas + ' con problemas (la columna Nota de la pestaña Redes dice cuál)' : '') + '.';
}

function completar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tr = ss.getSheetByName('Trabajos');
  if (!tr) throw new Error('No está la pestaña Trabajos');
  var sh = hojaRedes(ss);
  // los links de TikTok y de Instagram de Trabajos (cada uno una vez)
  var links = [], visto = {};
  if (tr.getLastRow() > 1) tr.getRange(2, 1, tr.getLastRow() - 1, 1).getValues().forEach(function (r) {
    var u = String(r[0]).trim();
    if (u && red(u) && !visto[u]) { visto[u] = 1; links.push(u); }
  });
  // lo que ya está en Redes
  var filas = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, COLUMNAS.length).getValues() : [], fila = {};
  filas.forEach(function (f, i) { var u = String(f[0]).trim(); if (u) fila[u] = i; });
  var inicio = Date.now(), hechos = 0, fallas = 0;
  links.forEach(function (u) {
    if (Date.now() - inicio > 4.5 * 60e3) return;                         // Apps Script corta a los 6 minutos: lo que falte, la próxima vez
    var i = fila[u], f = i == null ? null : filas[i];
    var completa = f && f[3] && f[6], cuando = f && f[7] instanceof Date ? f[7].getTime() : 0;
    if (completa && Date.now() - cuando < CADA) return;
    var nueva;
    try {
      var d = red(u) === 'tiktok' ? leerTikTok(u) : leerInstagram(u);
      var mini = guardarMiniatura(d.portada, red(u) + '-' + d.id, f && f[3]);
      nueva = [u, limpiarTitulo(d.titulo), d.autor || '', mini, d.views == null ? '' : d.views, d.likes == null ? '' : d.likes, d.id, new Date(),
        mini ? '' : 'Sin miniatura: se vuelve a probar en una hora'];
      if (f) [1, 2, 4, 5].forEach(function (k) { if (nueva[k] === '' && f[k] !== '') nueva[k] = f[k]; });   // lo que esta vez no vino, queda como estaba
      hechos++;
    } catch (e) {
      fallas++;
      nueva = f ? f.slice() : [u, '', '', '', '', '', '', '', ''];
      nueva[7] = new Date(); nueva[8] = String(e && e.message || e);
    }
    if (i == null) { fila[u] = filas.length; filas.push(nueva); } else filas[i] = nueva;
    Utilities.sleep(400);
  });
  if (filas.length) sh.getRange(2, 1, filas.length, COLUMNAS.length).setValues(filas);
  return { links: links.length, hechos: hechos, fallas: fallas };
}

// Para ver qué encuentra el script, sin guardar nada: elegir «probarRedes» arriba, Ejecutar y mirar el registro de
// ejecución (abajo). Prueba el primer link de TikTok y el primero de Instagram de Trabajos.
function probarRedes() {
  var tr = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trabajos'), hecho = {};
  tr.getRange(2, 1, Math.max(1, tr.getLastRow() - 1), 1).getValues().forEach(function (r) {
    var u = String(r[0]).trim(), k = red(u);
    if (!k || hecho[k]) return;
    hecho[k] = 1;
    try { Logger.log(u + '\n' + JSON.stringify(k === 'tiktok' ? leerTikTok(u) : leerInstagram(u), null, 1)); }
    catch (e) { Logger.log(u + '\nNo anduvo: ' + (e && e.message || e)); }
  });
  if (!hecho.tiktok && !hecho.instagram) Logger.log('No hay links de TikTok ni de Instagram en Trabajos');
}

function red(u) {                                                          // como en la web (js/data.js)
  if (/tiktok\.com\//i.test(u)) return 'tiktok';
  if (/instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/[\w-]+/i.test(u) || /instagr\.am\/(?:reels?|p)\/[\w-]+/i.test(u)) return 'instagram';
  return '';
}

function hojaRedes(ss) {
  var sh = ss.getSheetByName(REDES);
  if (sh) return sh;
  sh = ss.insertSheet(REDES, ss.getNumSheets());
  sh.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  [330, 260, 160, 120, 90, 90, 170, 140, 360].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(1, 1).setNote('Esta pestaña la completa sola el script de la planilla, cada hora: de cada TikTok y reel de Instagram de ' +
    'Trabajos, lo que la web necesita y esas redes ya no pasan. No hace falta tocarla: si se borra una fila, se vuelve a completar.\n' +
    'Para cambiarle el título a un video, en Trabajos, columna Título.');
  sh.hideSheet();
  return sh;
}

// ---------------- TikTok ----------------
// Del embed de TikTok (lo que usa para mostrar sus videos en otras páginas) y, si ahí no está todo, de la página del video.
function leerTikTok(link) {
  var id = buscar(link, /\/(?:video|photo)\/(\d+)/), pagina = id ? link : '';
  if (!id) {                                                               // un link corto (vm.tiktok.com, tiktok.com/t/…): adónde lleva
    var r = traer(link, { followRedirects: false }), a = r ? r.headers.Location || r.headers.location || '' : '';
    id = buscar(a, /\/(?:video|photo)\/(\d+)/);
    if (id) pagina = a;
  }
  if (!id) id = String((leerJSON(traer('https://www.tiktok.com/oembed?url=' + encodeURIComponent(link))) || {}).embed_product_id || '');
  if (!/^\d+$/.test(id)) throw new Error('No encontré el video: ¿el link está bien?');
  var d = datosTikTokEmbed(texto(traer('https://www.tiktok.com/embed/v2/' + id))) || {};
  if (!d.portada || d.views == null) {
    var p = datosTikTokPagina(texto(traer(pagina || 'https://www.tiktok.com/@/video/' + id)));
    if (p) d = mezclar(d, p);
  }
  if (!d.titulo && !d.portada && d.views == null) throw new Error('TikTok no pasó los datos del video (o está borrado o es privado)');
  d.id = id;
  return d;
}

function datosTikTokEmbed(html) {
  var S = jsonDeScript(html, '__FRONTITY_CONNECT_STATE__'), data = S && S.source && S.source.data, v = null;
  if (data) for (var k in data) if (data[k] && data[k].videoData && data[k].videoData.itemInfos) { v = data[k].videoData; break; }
  if (!v) return null;
  var it = v.itemInfos, au = v.authorInfos || {};
  return { titulo: it.text || '', autor: au.nickName || au.uniqueId || '', portada: jpg([].concat(it.coversOrigin || [], it.covers || [])),
    views: numero(it.playCount), likes: numero(it.diggCount) };
}

function datosTikTokPagina(html) {
  var S = jsonDeScript(html, '__UNIVERSAL_DATA_FOR_REHYDRATION__');
  var vd = S && S.__DEFAULT_SCOPE__ && S.__DEFAULT_SCOPE__['webapp.video-detail'], it = vd && vd.itemInfo && vd.itemInfo.itemStruct;
  if (!it) return null;
  var au = it.author || {}, vi = it.video || {}, s1 = it.stats || {}, s2 = it.statsV2 || {};
  return { titulo: it.desc || '', autor: au.nickname || au.uniqueId || '', portada: jpg([vi.originCover, vi.cover]),
    views: numero(s1.playCount != null ? s1.playCount : s2.playCount), likes: numero(s1.diggCount != null ? s1.diggCount : s2.diggCount) };
}

// ---------------- Instagram ----------------
// Del embed del reel (lo que usa Instagram para mostrarlo en otras páginas).
function leerInstagram(link) {
  var code = buscar(link, /instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]+)/i) || buscar(link, /instagr\.am\/(?:reels?|p)\/([\w-]+)/i);
  if (!code) throw new Error('No es el link de un reel o de un posteo de Instagram');
  var r = traer('https://www.instagram.com/p/' + code + '/embed/captioned/'), d = datosInstagram(texto(r));
  if (!d) throw new Error('Instagram no pasó los datos del reel (' + (r ? 'código ' + r.code : 'no respondió') + '; o es privado o está borrado)');
  d.id = code;
  return d;
}

function datosInstagram(html) {
  if (!html) return null;
  var c = cadenaJSON(html, 'contextJSON'), m = null;
  if (c) try { var x = JSON.parse(c); m = x && x.gql_data && x.gql_data.shortcode_media; } catch (e) { m = null; }
  if (m) {
    var cap = m.edge_media_to_caption && m.edge_media_to_caption.edges && m.edge_media_to_caption.edges[0];
    return { titulo: cap && cap.node ? cap.node.text || '' : '', autor: m.owner ? m.owner.username || '' : '', portada: m.display_url || m.thumbnail_src || '',
      views: numero(m.video_play_count != null ? m.video_play_count : m.video_view_count), likes: numero((m.edge_liked_by || m.edge_media_preview_like || {}).count) };
  }
  // si no vino ese JSON: lo que se ve en el embed
  var img = buscar(html, /<img[^>]*class="EmbeddedMediaImage"[^>]*>/), portada = desescapar(buscar(img, /\ssrc="([^"]+)"/));
  if (!portada) return null;
  var cap2 = buscar(html, /class="CaptionUsername"[^>]*>[^<]*<\/a>([\s\S]*?)<div/);
  return { titulo: desescapar(cap2.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim(), autor: desescapar(buscar(html, /class="UsernameText"[^>]*>([^<]*)/)).trim(),
    portada: portada, views: null, likes: numero(buscar(html, /class="SocialProof"[\s\S]{0,300}?>\s*([\d.,]+)\s*(?:likes?|Me gusta)/i)) };
}

// ---------------- las miniaturas, en el Drive ----------------
function guardarMiniatura(url, nombre, anterior) {
  if (anterior) try { if (!DriveApp.getFileById(anterior).isTrashed()) return anterior; } catch (e) { /* la borraron: se baja de nuevo */ }
  if (!url) return '';
  var r = traer(url, { imagen: true }), tipo = r && r.blob ? String(r.blob.getContentType()).split(';')[0] : '';
  if (!r || r.code !== 200 || !/^image\//.test(tipo)) return '';
  var f = carpetaMiniaturas().createFile(r.blob.setName(nombre + '.' + ({ 'image/png': 'png', 'image/webp': 'webp' }[tipo] || 'jpg')));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* ya la comparte la carpeta */ }
  return f.getId();
}

function carpetaMiniaturas() {
  var P = PropertiesService.getUserProperties(), id = P.getProperty('carpetaMiniaturas'), c = null;
  if (id) try { c = DriveApp.getFolderById(id); if (c.isTrashed()) c = null; } catch (e) { c = null; }
  if (c) return c;
  c = DriveApp.createFolder('Portfolio - miniaturas de TikTok e Instagram');
  c.setDescription('Las miniaturas de los TikTok y reels de Instagram de la web del portfolio. Las guarda el script de la planilla: no hace falta tocarlas.');
  c.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);   // para que la web las pueda mostrar
  P.setProperty('carpetaMiniaturas', c.getId());
  return c;
}

// ---------------- ayudas ----------------
function traer(url, o) {
  o = o || {};
  try {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: o.followRedirects !== false, headers: {
      'User-Agent': NAVEGADOR, 'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Accept': o.imagen ? 'image/jpeg,image/png,image/*;q=0.8' : 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' } });
    return { code: r.getResponseCode(), headers: r.getHeaders(), text: o.imagen ? '' : r.getContentText('UTF-8'), blob: o.imagen ? r.getBlob() : null };
  } catch (e) { return null; }                                             // sin conexión o la dirección no existe
}
function texto(r) { return r && r.code === 200 ? r.text : ''; }
function leerJSON(r) { try { return r && r.code === 200 ? JSON.parse(r.text) : null; } catch (e) { return null; } }
function buscar(t, re) { var m = String(t || '').match(re); return !m ? '' : m.length > 1 ? m[1] || '' : m[0]; }   // lo del paréntesis, o todo
function mezclar(a, b) { for (var k in b) if (a[k] == null || a[k] === '') a[k] = b[k]; return a; }
function jpg(a) {                                                          // de las portadas, mejor una en JPG
  a = a.filter(function (u) { return u; });
  for (var i = 0; i < a.length; i++) if (/\.jpe?g(\?|$)/i.test(a[i])) return a[i];
  return a[0] || '';
}
function numero(v) {
  if (v == null || v === '') return null;
  var n = typeof v === 'number' ? v : +String(v).trim().replace(/[\s.,](?=\d{3}(\D|$))/g, '');
  return isFinite(n) ? n : null;
}
function jsonDeScript(html, id) {                                          // el JSON de un <script id="…">
  var m = String(html || '').match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>'));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}
function cadenaJSON(t, clave) {                                            // el texto de "clave":"…" (un JSON adentro de otro)
  var k = t.indexOf('"' + clave + '":"');
  if (k < 0) return '';
  var i = k + clave.length + 4, j = i;
  while (j < t.length && t.charAt(j) !== '"') j += t.charAt(j) === '\\' ? 2 : 1;
  try { return JSON.parse(t.slice(i - 1, j + 1)); } catch (e) { return ''; }
}
function desescapar(s) {                                                   // &amp; &quot; &#064; … de una página
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, function (m, e) {
    e = e.toLowerCase();
    if (e.charAt(0) === '#') try { return String.fromCodePoint(e.charAt(1) === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)); } catch (x) { return m; }
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }[e];
  });
}
function limpiarTitulo(s) {                                                // la primera línea, sin los hashtags del final
  s = String(s || '').split(/\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l; })[0] || '';
  s = s.replace(/(\s*#[^\s#]+)+\s*$/, '').replace(/\s+/g, ' ').trim();
  if (s.length > 120) s = s.slice(0, 117).replace(/\s+\S*$/, '') + '…';
  return s;
}
