/* Los datos de la web: la planilla de Google (pestañas Trabajos y Config), YouTube, Drive y TikTok.
   Con la API key y el ID de la planilla en SITE_CONFIG.google (js/config.js), la web lee todo de ahí; sin
   eso, usa los datos de ejemplo (js/mock-data.js). Devuelve lo mismo que el mock, que tiene la forma de las
   respuestas de las APIs, así el resto de la web no cambia.
   Guarda lo que trae en el navegador: la planilla por 10 minutos y lo de YouTube, Drive y TikTok por 12 horas
   (con ?refresh=1 en la dirección vuelve a pedir todo). Si Google no responde, usa lo último guardado; si no
   hay nada guardado, muestra lo que pueda y avisa abajo a la izquierda qué falló. */
window.loadSiteData = (function () {
  'use strict';
  var C = window.SITE_CONFIG || {}, G = C.google || {}, MOCK = window.MOCK_DATA;
  var MIN = 60e3, SHEET_TTL = 10 * MIN, MEDIA_TTL = 12 * 60 * MIN;
  var refresh = /[?&]refresh=1(&|$)/.test(location.search);
  var API = 'https://www.googleapis.com/';

  // ---------------- lo guardado en el navegador ----------------
  function load(k) { try { return JSON.parse(localStorage.getItem('lil:' + k)); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem('lil:' + k, JSON.stringify(v)); } catch (e) { /* lleno o bloqueado: sigue sin guardar */ } }
  function box(name) {                               // { id: {t, v} }: cada video, canal o archivo por separado
    var all = load(name) || {}, now = {};            // now: lo que se trajo en esta visita (vale aunque sea ?refresh=1)
    return {
      fresh: function (id) { var e = all[id]; return e && (now[id] || (!refresh && Date.now() - e.t < MEDIA_TTL)) ? e.v : undefined; },
      stale: function (id) { var e = all[id]; return e ? e.v : undefined; },
      put: function (id, v) { all[id] = { t: Date.now(), v: v }; now[id] = 1; },
      keep: function () { save(name, all); }
    };
  }

  // ---------------- pedidos ----------------
  function qs(o) {
    return Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&');
  }
  function get(url) {
    return fetch(url).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (r.ok) return b;
        var e = new Error((b && b.error && b.error.message) || 'HTTP ' + r.status);
        e.status = r.status; throw e;
      });
    });
  }
  function chunks(a, n) { var out = []; for (var i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; }
  function unique(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  var str = function (v) { return String(v == null ? '' : v).trim(); };
  var hidden = function (v) { return v === false || /^(false|falso|no)$/i.test(str(v)); };   // la casilla Mostrar, destildada

  function parseLink(url) {                          // el mismo que usa la web (app.js)
    var m;
    if ((m = url.match(/youtube\.com\/shorts\/([\w-]{6,})/))) return { kind: 'yt', id: m[1] };
    if ((m = url.match(/(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/)([\w-]{6,})/))) return { kind: 'yt', id: m[1] };
    if (/tiktok\.com\//.test(url)) return { kind: 'tiktok', id: url };
    if ((m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/drive\.google\.com\/open\?id=([\w-]+)/))) return { kind: 'drive', id: m[1] };
    return { kind: 'otro', id: url };
  }

  // ---------------- la planilla: Trabajos y Config ----------------
  function range(r) {
    return get('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(G.sheetId) + '/values/' + encodeURIComponent(r) + '?' +
      qs({ valueRenderOption: 'UNFORMATTED_VALUE', key: G.apiKey })).then(function (b) { return b.values || []; });
  }
  function readSheet() {
    var c = load('sheet');
    if (!refresh && c && Date.now() - c.t < SHEET_TTL) return Promise.resolve(c.v);
    return Promise.all([range('Trabajos!A2:D'), range('Config!A2:C').catch(function () { return null; })])   // sin pestaña Config: la de ejemplo
      .then(function (r) { var v = { trabajos: r[0], config: r[1] }; save('sheet', { t: Date.now(), v: v }); return v; })
      .catch(function (e) { if (c) return c.v; throw e; });
  }
  // Config, como tabla de tres columnas: Campo, Texto y Link. Los campos: Título, Barra (un link de la barra
  // por fila), Foto, Nombre, Canal (tu @), Descripción y Red (una red del canal por fila). El ícono de cada
  // link sale solo de la dirección (Discord, Instagram, YouTube, TikTok, un mail…).
  var keyOf = function (s) { return str(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); };
  function kind(u, bar) {
    if (/^mailto:/i.test(u)) return 'mail';
    if (/discord\.(gg|com)\//i.test(u)) return 'discord';
    if (/instagram\.com\//i.test(u)) return 'instagram';
    if (/(youtube\.com|youtu\.be)\//i.test(u)) return bar ? 'canal' : 'youtube';
    if (/tiktok\.com\//i.test(u)) return 'tiktok';
    if (/twitch\.tv\//i.test(u)) return 'twitch';
    if (/\/\/(www\.)?(x|twitter)\.com\//i.test(u)) return 'x';
    return 'link';
  }
  function linkOf(u) {
    u = str(u);
    if (/^[^@\s/:]+@[^@\s/]+\.[a-z]{2,}$/i.test(u)) return 'mailto:' + u;   // un mail suelto
    if (u && !/^(https?:|mailto:)/i.test(u)) return 'https://' + u;
    return u;
  }
  function imageOf(u) {                              // un archivo del Drive se muestra con su miniatura
    var m = str(u).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400' : str(u);
  }
  function readConfig(rows) {
    if (!rows || !rows.length) return null;
    var c = { title: '', links: [], channel: { photo: '', name: '', handle: '', description: '', links: [] } }, any = false;
    rows.forEach(function (r) {
      var k = keyOf(r[0]), t = str(r[1]), u = linkOf(r[2]);
      if (!k) return;
      any = true;
      if (k === 'titulo') c.title = t;
      else if (k === 'barra') { if (u) c.links.push({ id: kind(u, true), label: t, url: u, icon: '' }); }
      else if (k === 'foto') c.channel.photo = imageOf(r[2] || r[1]);
      else if (k === 'nombre') c.channel.name = t;
      else if (k === 'canal') { var h = (t || str(r[2])).match(/@[\w.-]+/); c.channel.handle = h ? h[0] : t ? '@' + t.replace(/^@/, '') : ''; }
      else if (k === 'descripcion') c.channel.description = t;
      else if (k === 'red' || k === 'redes') { if (u) c.channel.links.push({ id: kind(u), label: t || u.replace(/^(mailto:|https?:\/\/(www\.)?)/i, '').replace(/\/$/, ''), url: u }); }
    });
    return any ? c : null;
  }

  // ---------------- YouTube ----------------
  function ytList(what, part, ids, name, extra) {    // videos o canales: lo guardado y el resto, de a 50 por pedido
    var b = box(name), need = ids.filter(function (id) { return b.fresh(id) === undefined; });
    var pick = function (fn) { return ids.map(fn).filter(Boolean); };
    return Promise.all(chunks(need, 50).map(function (ch) {
      var o = { part: part, id: ch.join(','), maxResults: 50, key: G.apiKey };
      Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
      return get(API + 'youtube/v3/' + what + '?' + qs(o)).then(function (res) {
        var got = {};
        (res.items || []).forEach(function (it) { got[it.id] = 1; b.put(it.id, it); });
        ch.forEach(function (id) { if (!got[id]) b.put(id, null); });   // privado o borrado: no vuelve, y la web lo esconde
      });
    })).then(function () { b.keep(); return pick(b.fresh); }, function (e) {
      b.keep();
      if (ids.some(function (id) { return b.stale(id) === undefined; })) throw e;   // alguno nunca llegó: que avise
      return pick(b.stale);                          // todos estaban guardados: sigue con eso
    });
  }
  function ytHandle(handle) {                        // tu canal, por el @ de la config (forHandle va de a uno)
    var h = str(handle).toLowerCase(), b = box('yt:h');
    if (!h) return Promise.resolve(null);
    if (b.fresh(h) !== undefined) return Promise.resolve(b.fresh(h));
    return get(API + 'youtube/v3/channels?' + qs({ part: 'snippet,statistics', forHandle: h, key: G.apiKey }))
      .then(function (res) { var it = (res.items || [])[0] || null; b.put(h, it); b.keep(); return it; })
      .catch(function () { return b.stale(h) || null; });
  }
  function ytStub(id) {                              // YouTube no respondió: la miniatura pública, sin números
    return { id: id, snippet: { title: '', channelId: '', channelTitle: '', description: '',
      thumbnails: { high: { url: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', width: 480, height: 360 } } }, statistics: {}, contentDetails: {}, status: {} };
  }

  // ---------------- Drive y TikTok ----------------
  function driveFile(id) {
    var b = box('drive'), hit = b.fresh(id), thumb = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1280';
    if (hit) return Promise.resolve(hit);
    return get(API + 'drive/v3/files/' + encodeURIComponent(id) + '?' + qs({ fields: 'id,name,videoMediaMetadata(width,height),imageMediaMetadata(width,height)', supportsAllDrives: 'true', key: G.apiKey }))
      .then(function (f) {
        var m = f.videoMediaMetadata || f.imageMediaMetadata || {};
        var v = { name: f.name || '', thumbnailUrl: thumb, width: m.width || 16, height: m.height || 9 };
        b.put(id, v); b.keep(); return v;
      })
      .catch(function () { return b.stale(id) || { name: '', thumbnailUrl: thumb, width: 16, height: 9, error: true }; });   // sin compartir o sin la API: igual se ve
  }
  function tiktok(url) {
    var b = box('tiktok'), hit = b.fresh(url);
    if (hit) return Promise.resolve(hit);
    return get('https://www.tiktok.com/oembed?' + qs({ url: url }))
      .then(function (o) { var v = { title: o.title || '', thumbnail_url: o.thumbnail_url || '', author_name: o.author_name || '' }; b.put(url, v); b.keep(); return v; })
      .catch(function () { return b.stale(url) || {}; });
  }

  // ---------------- todo junto ----------------
  function live() {
    return readSheet().then(function (S) {
      var rows = (S.trabajos || []).map(function (r) { return [str(r[0]), str(r[1]), str(r[2]), hidden(r[3]) ? 'FALSE' : 'TRUE']; });
      var shown = rows.filter(function (r) { return r[0] && r[3] !== 'FALSE'; }).map(function (r) { return parseLink(r[0]); });
      var ids = function (k) { return unique(shown.filter(function (L) { return L.kind === k; }).map(function (L) { return L.id; })); };
      var vIds = ids('yt'), dIds = ids('drive'), tUrls = ids('tiktok');
      var cfg = readConfig(S.config) || (C.mock || null), warn = [];
      if (S.config === null) warn.push('No está la pestaña Config: va la config de ejemplo');
      return Promise.all([
        // player + maxWidth: el tamaño del reproductor dice si el video es vertical
        ytList('videos', 'snippet,statistics,contentDetails,status,topicDetails,player', vIds, 'yt:v', { maxWidth: 480 })
          .catch(function (e) { warn.push('YouTube no respondió (' + e.message + ')'); return vIds.map(function (id) { return box('yt:v').stale(id) || ytStub(id); }); }),
        ytHandle(cfg && cfg.channel && cfg.channel.handle),
        Promise.all(dIds.map(driveFile)),
        Promise.all(tUrls.map(tiktok))
      ]).then(function (r) {
        var videos = r[0], self = r[1];
        var chIds = unique(videos.map(function (v) { return v.snippet && v.snippet.channelId; }));
        return ytList('channels', 'snippet,statistics', chIds, 'yt:c').catch(function () { return []; }).then(function (chs) {
          if (self && !chs.some(function (c) { return c.id === self.id; })) chs.push(self);
          var files = {}, tk = {};
          dIds.forEach(function (id, i) { files[id] = r[2][i]; });
          tUrls.forEach(function (u, i) { tk[u] = r[3][i]; });
          if (dIds.some(function (id) { return files[id].error; })) warn.push('Hay archivos del Drive sin compartir');
          return { live: true, warn: warn.join(' · '), sheet: { trabajos: rows }, config: cfg,
            youtube: { videos: { items: videos }, channels: { items: chs }, self: self ? self.id : '' }, drive: { files: files }, tiktok: tk };
        });
      });
    });
  }

  return function loadSiteData() {
    if (!G.apiKey || !G.sheetId) return Promise.resolve(MOCK);   // sin conectar: los datos de ejemplo
    return live().catch(function (e) {
      if (window.console) console.warn('[datos] no se pudo leer la planilla:', e);
      var m = {}; Object.keys(MOCK).forEach(function (k) { m[k] = MOCK[k]; });
      m.warn = 'No se pudo leer la planilla (' + e.message + '): datos de ejemplo';
      return m;
    });
  };
})();
