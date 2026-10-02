/* Portfolio de Lil Sanguchito.
   Toda la web sale de los datos que arma js/data.js: los reales (la planilla, YouTube, Drive y TikTok) cuando
   js/config.js tiene la key y la planilla, y si no, los de ejemplo (js/mock-data.js), con la misma forma. */
(function () {
  'use strict';
  // las imágenes aparecen suave cuando terminan de cargar (el fundido está en el CSS): acá se marca cada una
  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG') t.classList.add('ok'); }, true);
  var ready = window.loadSiteData ? window.loadSiteData() : Promise.resolve(window.MOCK_DATA);
  ready.then(function (M) { start(M); }, function () { start(window.MOCK_DATA); })
    .catch(function (e) { setTimeout(function () { throw e; }); });   // un error de la web, a la consola
  function start(M) {
  var LIVE = !!M.live;                               // datos reales: los videos se reproducen de verdad
  var DRIVE = 'https://drive.google.com/drive/folders/1Z_5rqiiCmAw5smuPmzadTzrB4z85pqG_';   // la carpeta, para los de ejemplo

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var PAGE = document.getElementById('page');   // lo que se desliza: los videos y el pie (la barra de arriba queda afuera)
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  function abbr(n) {                                 // 1.190 M · 53,8 M · 146 K · 12,4 K
    if (n == null) return '';
    if (n >= 1e9) return Math.round(n / 1e6).toLocaleString('es-AR') + ' M';
    if (n >= 1e6) return nf.format(n >= 1e8 ? Math.round(n / 1e6) : Math.round(n / 1e5) / 10) + ' M';
    if (n >= 1e3) return nf.format(n >= 1e5 ? Math.round(n / 1e3) : Math.round(n / 100) / 10) + ' K';
    return String(n);
  }
  function dur(iso) {                                // PT14M52S → 14:52 · PT1H2M3S → 1:02:03
    var m = String(iso || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/), p = function (n) { return (n < 10 ? '0' : '') + n; };
    if (!m || !(m[1] || m[2] || m[3])) return '';
    var h = +m[1] || 0, mi = +m[2] || 0, s = +m[3] || 0;
    return h ? h + ':' + p(mi) + ':' + p(s) : mi + ':' + p(s);
  }
  function setHash(h) { try { history.replaceState(null, '', '#' + h); } catch (e) { /* sin historial: no pasa nada */ } }

  // ---------------- datos ----------------
  function parseLink(url) {
    var m;
    if ((m = url.match(/youtube\.com\/shorts\/([\w-]{6,})/))) return { kind: 'yt', id: m[1], short: true };
    if ((m = url.match(/(?:youtu\.be\/|[?&]v=|\/live\/|\/embed\/)([\w-]{6,})/))) return { kind: 'yt', id: m[1] };
    if (/tiktok\.com\//.test(url)) return { kind: 'tiktok', id: url };
    if ((m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/drive\.google\.com\/open\?id=([\w-]+)/))) return { kind: 'drive', id: m[1] };
    return { kind: 'otro', id: url };
  }
  var videos = {}, channels = {};
  M.youtube.videos.items.forEach(function (v) { videos[v.id] = v; });
  M.youtube.channels.items.forEach(function (c) { channels[c.id] = c; });
  var chUrl = function (ch) { return 'https://www.youtube.com/' + (ch.snippet.customUrl || 'channel/' + ch.id); };

  // ---------------- los temas de cada video, de YouTube ----------------
  // videos.list con part=topicDetails trae, en topicCategories, links de Wikipedia que describen de qué
  // trata el video (siempre de una misma lista corta). Acá van con su nombre en castellano; uno que no
  // esté en la lista va con su nombre de Wikipedia. Si un video no trae temas, va su categoría de YouTube
  // (snippet.categoryId), con el mismo nombre que el tema parecido, así no se repiten.
  var TOPIC = {
    Video_game_culture: 'Videojuegos', Action_game: 'Juegos de acción', 'Action-adventure_game': 'Acción y aventura',
    Casual_game: 'Juegos casuales', Music_video_game: 'Juegos de música', Puzzle_video_game: 'Puzles',
    Racing_video_game: 'Carreras', 'Role-playing_video_game': 'Rol', Simulation_video_game: 'Simulación',
    Sports_game: 'Juegos de deportes', Strategy_video_game: 'Estrategia',
    Entertainment: 'Entretenimiento', Humour: 'Humor', Film: 'Cine', Performing_arts: 'Artes escénicas',
    Television_program: 'Televisión', 'Lifestyle_(sociology)': 'Estilo de vida', Fashion: 'Moda',
    Physical_fitness: 'Fitness', Food: 'Comida', Hobby: 'Hobbies', Pet: 'Mascotas', Physical_attractiveness: 'Belleza',
    Technology: 'Tecnología', Tourism: 'Viajes', Vehicle: 'Autos', Society: 'Sociedad', Business: 'Negocios',
    Health: 'Salud', Military: 'Militar', Politics: 'Política', Religion: 'Religión', Knowledge: 'Conocimiento',
    Music: 'Música', Christian_music: 'Música cristiana', Classical_music: 'Clásica', Country_music: 'Country',
    Electronic_music: 'Electrónica', Hip_hop_music: 'Hip hop', Independent_music: 'Indie', Jazz: 'Jazz',
    Music_of_Asia: 'Música asiática', Music_of_Latin_America: 'Música latina', Pop_music: 'Pop', Reggae: 'Reggae',
    Rhythm_and_blues: 'R&B', Rock_music: 'Rock', Soul_music: 'Soul', Sport: 'Deportes',
    Association_football: 'Fútbol', American_football: 'Fútbol americano', Baseball: 'Béisbol', Basketball: 'Básquet',
    Boxing: 'Boxeo', Cricket: 'Críquet', Golf: 'Golf', Ice_hockey: 'Hockey', Mixed_martial_arts: 'MMA',
    Motorsport: 'Automovilismo', Professional_wrestling: 'Lucha libre', Tennis: 'Tenis', Volleyball: 'Vóley'
  };
  var CAT = { 1: 'Cine', 2: 'Autos', 10: 'Música', 15: 'Mascotas', 17: 'Deportes', 19: 'Viajes', 20: 'Videojuegos',
    22: 'Vlogs', 23: 'Humor', 24: 'Entretenimiento', 25: 'Noticias', 26: 'Tutoriales', 27: 'Educación',
    28: 'Tecnología', 29: 'Causas' };
  function topicsOf(v) {
    var t = ((v.topicDetails && v.topicDetails.topicCategories) || []).map(function (u) {
      var k = String(u).split('/wiki/')[1] || '';
      try { k = decodeURIComponent(k); } catch (e) {}
      return TOPIC[k] || k.replace(/_/g, ' ').replace(/\s*\(.*\)$/, '');
    }).filter(Boolean);
    if (!t.length && CAT[v.snippet.categoryId]) t = [CAT[v.snippet.categoryId]];
    return t.filter(function (x, i) { return t.indexOf(x) === i; });
  }

  var works = [];
  M.sheet.trabajos.forEach(function (r, i) {
    var link = r[0], L, w;
    // columnas de Trabajos: Link, Título, Cliente, Mostrar
    if (!link || r[3] === 'FALSE' || r[3] === false) return;   // columna Mostrar destildada
    L = parseLink(link);
    w = { id: 'w' + i, i: i, client: r[2] || '' };
    if (L.kind === 'yt') {
      var v = videos[L.id], th, ch;
      if (!v) return;                                 // privado o borrado: desaparece solo
      var t = v.snippet.thumbnails || {}, st = v.statistics || {};
      th = t.maxres || t.standard || t.high || t.medium || t.default || {}; ch = channels[v.snippet.channelId];
      w.title = r[1] || v.snippet.title || 'Video de YouTube'; w.channelId = v.snippet.channelId; w.who = r[2] || v.snippet.channelTitle;
      // vertical: un link de Shorts o, con datos reales, el reproductor más alto que ancho
      w.views = st.viewCount != null ? +st.viewCount : null; w.thumb = th.url;
      w.vertical = !!L.short || (v.player && v.player.embedWidth ? +v.player.embedHeight > +v.player.embedWidth : th.height > th.width);
      w.yt = L.id; w.embed = !(v.status && v.status.embeddable === false);   // si no se puede insertar, se abre en YouTube
      w.likes = st.likeCount != null ? +st.likeCount : null;   // si el canal los esconde, no vienen
      w.dur = w.vertical ? '' : dur(v.contentDetails && v.contentDetails.duration);
      w.desc = v.snippet.description || '';        // la descripción original, tal como está en YouTube
      w.out = LIVE ? 'https://www.youtube.com/' + (L.short ? 'shorts/' : 'watch?v=') + L.id : ch ? chUrl(ch) : 'https://www.youtube.com/'; w.outLabel = 'Ver en YouTube ↗';
      w.topics = topicsOf(v);                       // de qué trata, según YouTube: para los temas de arriba
    } else if (L.kind === 'tiktok') {
      var t = M.tiktok[link] || {};
      w.title = r[1] || t.title || 'TikTok'; w.who = r[2] || t.author_name || ''; w.views = null; w.thumb = t.thumbnail_url; w.vertical = true;
      w.tt = (link.match(/\/video\/(\d+)/) || [])[1];
      w.out = LIVE ? link : 'https://www.tiktok.com/'; w.outLabel = 'Ver en TikTok ↗';
    } else if (L.kind === 'drive') {
      var f = M.drive.files[L.id] || {};
      w.title = r[1] || String(f.name || '').replace(/\.[^.]+$/, ''); w.who = r[2] || ''; w.views = null; w.thumb = f.thumbnailUrl;
      w.vertical = f.height > f.width; w.drive = L.id;
      w.out = LIVE ? 'https://drive.google.com/file/d/' + L.id + '/view' : DRIVE; w.outLabel = 'Ver en Drive ↗';
    } else return;
    works.push(w);
  });
  var byId = {};
  works.forEach(function (w) { byId[w.id] = w; });

  // ---------------- tarjeta, como en YouTube ----------------
  // La miniatura (con la duración) y, abajo, la foto del canal con el título y, debajo, el canal y las
  // views. Sin fecha. Los verticales, sin foto. La foto y el nombre del canal abren el canal en YouTube.
  function face(w) {
    var ch = w.channelId ? channels[w.channelId] : null;
    if (ch) return '<a class="yt-av" href="' + esc(chUrl(ch)) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" draggable="false">' +
      '<img src="' + esc(ch.snippet.thumbnails.medium.url) + '" alt="" loading="lazy" draggable="false"></a>';
    if (w.who) return '<span class="yt-av ini" aria-hidden="true">' + esc(w.who.charAt(0).toUpperCase()) + '</span>';   // fuera de YouTube: la inicial
    return '';
  }
  function card(w) {
    var ch = w.channelId ? channels[w.channelId] : null;
    var name = !w.who ? '' : ch
      ? '<a class="yt-ch" href="' + esc(chUrl(ch)) + '" target="_blank" rel="noopener" draggable="false">' + esc(w.who) + '</a>'
      : '<span class="yt-ch">' + esc(w.who) + '</span>';
    var views = w.views != null ? '<span class="yt-v"><i aria-hidden="true">▶</i> ' + abbr(w.views) + '<span class="sr"> views</span></span>' : '';
    return '<div class="work' + (w.vertical ? ' v' : '') + '" data-work="' + w.id + '">' +
      '<button class="thumb ' + (w.vertical ? 'r916' : 'r169') + '" type="button" aria-label="' + esc('Ver “' + w.title + '”') + '">' +
      (w.thumb ? '<img src="' + esc(w.thumb) + '" alt="" loading="lazy" decoding="async" draggable="false">' : '') +
      (w.dur ? '<span class="dur">' + w.dur + '</span>' : '') + '</button>' +
      '<div class="yt-m">' + (w.vertical ? '' : face(w)) + '<div class="yt-t"><span class="yt-ttl">' + esc(w.title) + '</span>' +
      (name || views ? '<span class="yt-s">' + name + views + '</span>' : '') + '</div></div></div>';
  }

  // ---------------- fila infinita de verticales ----------------
  // Una cinta que nunca se para: anda sola, siempre a la misma velocidad, también con el mouse encima y
  // mientras scrolleás la página. Se la puede empujar arrastrándola de costado (con el mouse o el dedo), con
  // el trackpad o con shift + rueda: al soltarla sigue un poco con el envión, lo justo para que se sienta, y
  // enseguida vuelve suave a su velocidad de siempre, que es también la mínima, así nunca se termina de parar
  // (y sigue para el lado al que la empujaste). Las filas se alternan: una va para un lado y la siguiente
  // para el otro. Es infinita: después del último viene el primero.
  var SPEED = 30;                                          // px por segundo: la velocidad de siempre y la mínima
  var GLIDE = 300;                                         // ms: qué tan rápido se apaga el envión
  var MAXV = 1600;                                         // px por segundo: el envión más fuerte
  var lastTab = 0;                                         // cuándo se apretó Tab por última vez
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab') lastTab = Date.now(); }, true);
  var belts = [];                                          // un solo cuadro de animación para todas las filas
  requestAnimationFrame(function frame(now) { belts.forEach(function (f) { f(now); }); requestAnimationFrame(frame); });
  function carousel(track, n) {
    // A cada lado de los videos va una copia de la tanda completa. Cuando la fila entra en la zona de
    // copias, salta en silencio a la posición igual de la tanda original, así después del último viene
    // el primero sin rebobinar (y para atrás, igual).
    var car = track.parentNode;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dir = n % 2 ? -1 : 1;                          // para qué lado va: se alterna de una fila a la otra
    var focused = false, inView = false, drag = null, moved = false;
    var originals = [].slice.call(track.children), looped = false, start = 0, setW = 0, idx = 0;
    var v = dir * SPEED, pos = 0, running = false, last = 0;
    var pad = function () { return parseFloat(getComputedStyle(track).paddingLeft) || 0; };
    var max = function () { return track.scrollWidth - track.clientWidth; };
    var posOf = function (el) { return el.offsetLeft - pad(); };
    function nearest(x) {
      var best = 0, d = Infinity;
      [].forEach.call(track.children, function (el, i) { var dd = Math.abs(posOf(el) - x); if (dd < d) { d = dd; best = i; } });
      return best;
    }
    function current() {                               // qué video original está primero a la vista
      var i = nearest(track.scrollLeft), k = originals.length;
      return looped ? ((i % k) + k) % k : i;
    }
    // el scroll solo acepta píxeles enteros: el resto va como un corrimiento de las tarjetas
    function sub(x) { track.style.setProperty('--sub', (x || 0).toFixed(2) + 'px'); }
    function halt() {                                  // la agarró la mano: queda donde está
      if (running) { track.scrollLeft = Math.round(pos); sub(0); }
      running = false;
    }
    function push(vel) {                               // la soltaron con este envión (px/s, para donde avanza el scroll)
      vel = Math.max(-MAXV, Math.min(MAXV, vel || 0));
      if (Math.abs(vel) > SPEED / 2) dir = vel > 0 ? 1 : -1;   // sigue para el lado al que la empujaste
      v = dir * Math.max(Math.abs(vel), SPEED);        // nunca más lento que su velocidad de siempre
    }
    function build() {
      var keep = idx;                                  // el video que estaba primero (medido antes del cambio de ancho)
      halt();
      [].slice.call(track.querySelectorAll('.clone')).forEach(function (c) { c.remove(); });
      looped = false;
      var fits = max() <= 4;
      car.classList.toggle('fits', fits);
      if (fits || originals.length < 2) { track.dataset.home = 0; return; }
      var copy = function (el) {
        var c = el.cloneNode(true), t = c.querySelector('.thumb');
        c.classList.add('clone'); c.classList.remove('tilt', 'hov');
        if (t) ['--rx', '--ry', '--gx', '--gy', '--s'].forEach(function (p) { t.style.removeProperty(p); });
        c.setAttribute('aria-hidden', 'true');
        [].forEach.call(c.querySelectorAll('button, a'), function (x) { x.tabIndex = -1; });   // las copias no se recorren con Tab
        return c;
      };
      originals.forEach(function (el) { track.insertBefore(copy(el), originals[0]); });
      originals.forEach(function (el) { track.appendChild(copy(el)); });
      looped = true;
      start = posOf(originals[0]);
      setW = posOf(track.children[originals.length * 2]) - start;
      track.dataset.home = start;
      track.scrollLeft = start + posOf(originals[keep]) - posOf(originals[0]);
    }
    function wrap(x) {                                 // la misma vista, dentro de la tanda original
      if (!looped) return x;
      while (x < start) x += setW;
      while (x >= start + setW) x -= setW;
      return x;
    }
    var belt = function (now) {                        // cada cuadro: avanza, y el envión se apaga suave
      var dt = last ? Math.min(50, now - last) : 16;
      last = now;
      if (!looped || reduce || document.hidden || window.__snap || focused || (drag && drag.on) || wh.on) return halt();
      if (!inView) { halt(); v = dir * SPEED; return; }   // fuera de la pantalla espera, ya a su velocidad
      if (!running) { running = true; pos = track.scrollLeft; }
      v = dir * SPEED + (v - dir * SPEED) * Math.exp(-dt / GLIDE);
      pos = wrap(pos + v * dt / 1000);                 // terminó la tanda: la misma vista, sin corte
      var base = Math.floor(pos);
      if (track.scrollLeft !== base) track.scrollLeft = base;
      var off = track.scrollLeft - pos;
      if (off > 1 || off < -1) { pos = track.scrollLeft; off = 0; }   // si el scroll no la siguió, no se acumula el corrimiento
      sub(off);
    };
    belts.push(belt);
    track.addEventListener('focusin', function () { focused = Date.now() - lastTab < 800; });   // recorriéndola con Tab, se queda quieta (el clic o volver de una ventana no cuentan)
    track.addEventListener('focusout', function () { focused = false; });
    // trackpad o shift + rueda, de costado: la empujan; para arriba o para abajo es la página y la fila sigue
    var wh = { on: false, t: 0, v: 0, timer: 0 };
    track.addEventListener('wheel', function (e) {
      var dx = e.deltaX, dy = e.deltaY;
      if (e.shiftKey && !dx) { dx = dy; dy = 0; }
      if (Math.abs(dx) <= Math.abs(dy) || !looped) return;
      e.preventDefault();
      if (e.deltaMode === 1) dx *= 16; else if (e.deltaMode === 2) dx *= track.clientWidth;
      var now = performance.now();
      if (!wh.on) { halt(); wh.on = true; wh.v = 0; wh.t = now - 16; }
      track.scrollLeft = wrap(track.scrollLeft + dx);
      wh.v = 0.7 * wh.v + 0.3 * (dx / Math.max(8, now - wh.t) * 1000); wh.t = now;
      clearTimeout(wh.timer);
      wh.timer = setTimeout(function () { wh.on = false; push(wh.v); }, 80);
    }, { passive: false });
    track.addEventListener('scroll', function () { idx = current(); }, { passive: true });
    // arrastrar de costado, con el mouse o con el dedo: se engancha recién después de 7 px y solo de costado,
    // así un clic o un toque siguen abriendo el video y para arriba o para abajo se mueve la página (el dedo
    // también: la fila deja la página al navegador y lo de costado lo maneja ella, con su envión)
    track.addEventListener('pointerdown', function (e) {
      if ((e.pointerType === 'mouse' && e.button !== 0) || !looped) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: track.scrollLeft, on: false, v: 0, lx: e.clientX, lt: performance.now() };
      moved = false;
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, now = performance.now(), x;
      if (!drag.on) {
        var ax = Math.abs(dx), ay = Math.abs(e.clientY - drag.y);
        if (ax < 7 && ay < 7) return;
        if (ay > ax) { drag = null; return; }          // para arriba o para abajo: es la página
        halt();
        drag.on = true; moved = true; drag.left = track.scrollLeft; drag.x = e.clientX; dx = 0;
        track.classList.add('dragging');
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      x = drag.left - dx;
      if (looped) { var w = wrap(x); drag.left += w - x; x = w; }   // arrastrar sin fin
      track.scrollLeft = x;
      drag.v = 0.75 * drag.v + 0.25 * ((e.clientX - drag.lx) / Math.max(1, now - drag.lt));   // px por ms
      drag.lx = e.clientX; drag.lt = now;
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var g = drag; drag = null;
      if (!g.on) return;
      track.classList.remove('dragging');
      push(performance.now() - g.lt > 90 ? 0 : -g.v * 1000);   // si la soltaste quieta, sin envión
    }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    // anda desde un poco antes de asomar en la pantalla, así al scrollear ya llega moviéndose
    var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0, rootMargin: '200px 0px' }) : null;
    if (io) io.observe(track);
    var lastW = 0, ro = window.ResizeObserver ? new ResizeObserver(function () {
      if (track.clientWidth !== lastW) { lastW = track.clientWidth; build(); }
    }) : null;
    if (ro) ro.observe(track);
    lastW = track.clientWidth; build();
    return function () {                               // al rearmar el feed: esta fila deja de andar
      var k = belts.indexOf(belt);
      if (k >= 0) belts.splice(k, 1);
      clearTimeout(wh.timer);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
    };
  }

  // ---------------- los videos, como el inicio de YouTube ----------------
  // Al entrar se ven los videos, sin títulos ni números arriba. Un solo feed: dos filas de horizontales,
  // una fila infinita de verticales, dos filas más y así. Se ordenan solos, de más a menos views; los que
  // no tienen views (Drive y TikTok) van al final, en el orden de la planilla.
  var byViews = function (a, b) { return (b.views == null ? -1 : b.views) - (a.views == null ? -1 : a.views) || a.i - b.i; };
  var hs = works.filter(function (w) { return !w.vertical; }).sort(byViews);
  var vs = works.filter(function (w) { return w.vertical; }).sort(byViews);

  var feed = $('#all'), built = '', undo = [], topic = '';   // topic: el tema elegido arriba ('' = Todo)
  var inTopic = function (w) { return !topic || (w.topics || []).indexOf(topic) >= 0; };
  function layout() {                                // se rearma solo si cambian las columnas o el tema
    var cs = getComputedStyle(feed);
    var cols = parseInt(cs.getPropertyValue('--cols'), 10) || 3, vis = parseFloat(cs.getPropertyValue('--vis')) || 6;
    if (built === cols + '/' + vis + '/' + topic) return;
    built = cols + '/' + vis + '/' + topic;
    undo.forEach(function (f) { f(); }); undo = [];
    var H = hs.filter(inTopic), V = vs.filter(inTopic);
    var per = cols >= 2 ? cols * 2 : 4, step = Math.max(1, Math.floor(vis)), blocks = [], out = [], k;   // dos filas; en el celular, 4 videos
    for (k = 0; k < H.length; k += per) blocks.push(H.slice(k, k + per));
    var shelf = function (n) {                       // cada fila de verticales arranca donde terminó la vista de la anterior
      var r = (n * step) % V.length, seq = V.slice(r).concat(V.slice(0, r));
      return '<div class="shelf"><span class="lab shelf-h">Shorts, TikToks y reels</span>' +
        '<div class="car"><div class="track rail">' + seq.map(card).join('') + '</div></div></div>';
    };
    blocks.forEach(function (b, n) {
      out.push('<div class="hgrid">' + b.map(card).join('') + '</div>');
      if (V.length && (n < blocks.length - 1 || blocks.length === 1)) out.push(shelf(n));
    });
    if (!blocks.length && V.length) out.push(shelf(0));
    if (!out.length) out.push('<p class="empty">' + (works.length ? 'No hay videos con este tema.' : 'Todavía no hay trabajos: pegá los links en la pestaña Trabajos de la planilla.') + '</p>');
    feed.innerHTML = out.join('');
    [].forEach.call(feed.querySelectorAll('.track'), function (t, n) { undo.push(carousel(t, n)); });   // una para cada lado
  }
  layout(); $('#trabajos').classList.add('in');      // los videos aparecen suave
  window.addEventListener('resize', layout);

  // ---------------- los temas, entre el canal y los videos ----------------
  // Como los del inicio de YouTube: primero Todo y después los temas de los videos, de los que más videos
  // tienen a los que menos (a igual cantidad, el del video con más views primero). Salen solos, de lo que
  // YouTube dice de cada video. Van los que tienen al menos dos videos (si así quedan menos de tres, también
  // los de uno) y no va uno que tengan todos, porque sería lo mismo que Todo. Tocando uno, quedan solo sus
  // videos (los de Drive y TikTok no tienen temas: están en Todo). Si no entran, se deslizan de costado y,
  // con mouse, aparecen las flechas.
  function topicsFor(pool) {                         // los temas de un grupo de videos, con esas reglas
    var count = {}, list = [];
    pool.slice().sort(byViews).forEach(function (w) {
      (w.topics || []).forEach(function (t) { if (!count[t]) { count[t] = 0; list.push(t); } count[t]++; });
    });
    list = list.filter(function (t) { return count[t] < pool.length; });
    var min = list.filter(function (t) { return count[t] >= 2; }).length >= 3 ? 2 : 1;
    return list.filter(function (t) { return count[t] >= min; })
      .map(function (t, i) { return { t: t, i: i }; })
      .sort(function (a, b) { return count[b.t] - count[a.t] || a.i - b.i; })
      .slice(0, 12).map(function (x) { return x.t; });
  }
  // una fila de temas: Todo y los temas. pick(t) al tocar uno; set(t) marca uno desde afuera
  function chipRow(box, row, list, pick) {
    var cur = '', reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.innerHTML = [''].concat(list).map(function (t) {
      return '<button class="chip" type="button" data-topic="' + esc(t) + '" aria-pressed="' + (t === cur) + '">' + esc(t || 'Todo') + '</button>';
    }).join('');
    box.hidden = false;
    function edges() {                               // las flechas, solo si hay más para ese lado
      var max = row.scrollWidth - row.clientWidth;
      box.classList.toggle('l', row.scrollLeft > 2);
      box.classList.toggle('r', row.scrollLeft < max - 2);
    }
    function set(t) { cur = t; [].forEach.call(row.children, function (c) { c.setAttribute('aria-pressed', String(c.dataset.topic === t)); }); }
    row.addEventListener('scroll', edges, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(edges).observe(row);
    edges();
    box.addEventListener('click', function (e) {
      var a = e.target.closest('.chip-a');
      if (a) { row.scrollBy({ left: (a.classList.contains('next') ? 1 : -1) * row.clientWidth * .7, behavior: reduce ? 'auto' : 'smooth' }); return; }
      var b = e.target.closest('.chip');
      if (!b || b.dataset.topic === cur) return;
      set(b.dataset.topic);
      // el elegido, entero a la vista (solo de costado: la página no se mueve)
      var r = row.getBoundingClientRect(), cr = b.getBoundingClientRect();
      if (cr.left < r.left + 40) row.scrollBy({ left: cr.left - r.left - 40, behavior: reduce ? 'auto' : 'smooth' });
      else if (cr.right > r.right - 40) row.scrollBy({ left: cr.right - r.right + 40, behavior: reduce ? 'auto' : 'smooth' });
      pick(cur);
    });
    return { set: function (t) { set(t); row.scrollLeft = 0; edges(); } };
  }
  (function () {
    var list = topicsFor(works);
    if (!list.length) return;                        // sin temas, el canal y los videos quedan separados solo por la línea
    chipRow($('#chips'), $('#chip-r'), list, function (t) {
      topic = t; layout();
      feed.classList.remove('swap'); void feed.offsetWidth; feed.classList.add('swap');
    });
  })();

  // ---------------- hover como la biblioteca de Steam: las fotos de los canales ----------------
  // Solo las fotos de los canales (en la página y en las ventanas) y solo con el mouse sobre la foto: se
  // agrandan, se inclinan hacia el mouse y un brillo las recorre, con una sombra. Todo lo demás se ilumina
  // entero (CSS). La activa es la que tiene el mouse dentro de su círculo quieto (inclinada o agrandada no
  // puede "perderlo", así no tiembla en los bordes) y el movimiento lo lleva una sola animación. Solo con mouse.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var flat = matchMedia('(prefers-reduced-motion: reduce)').matches;   // menos movimiento: sin inclinación (otro nombre que el still() de las ventanas, que lo pisaba y apagaba la inclinación)
    var hot = null, pt = null, live = [], tl = 0, AV = '.yt-av, .w-av, .sh-av, .ch-av';
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    var boxOf = function (w) {                         // el círculo quieto de la foto (sin la inclinación ni el agrandado)
      var r = w.getBoundingClientRect();
      var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, hw = w.offsetWidth / 2, hh = w.offsetHeight / 2;
      return { left: cx - hw, right: cx + hw, top: cy - hh, bottom: cy + hh, width: hw * 2, height: hh * 2 };
    };
    var inside = function (w, x, y) { var r = boxOf(w); return x >= r.left && x < r.right && y >= r.top && y < r.bottom; };
    var stateOf = function (w) {
      for (var i = 0; i < live.length; i++) if (live[i].w === w) return live[i];
      var s = { w: w, t: w, k: w.matches('.ch-av') ? [14, 10, 1.05] : [30, 24, 1.18], rx: 0, ry: 0, gx: 50, gy: 0, sc: 1, on: false, trx: 0, tRy: 0, tgx: 50, tgy: 0, tsc: 1 };   // la del canal de arriba es grande: se inclina menos
      s.t.style.setProperty('--s', '1');
      live.push(s); w.classList.add('tilt');
      return s;
    };
    var aim = function (w, x, y) {                   // la inclinación se mide sobre la foto quieta
      var s = stateOf(w), r = boxOf(w), L = r.left, T = r.top, W = r.width, H = r.height;
      var px = clamp((x - L) / W), py = clamp((y - T) / H);
      s.on = true; s.tRy = (px - 0.5) * s.k[0]; s.trx = (0.5 - py) * s.k[1]; s.tgx = px * 100; s.tgy = py * 100; s.tsc = s.k[2];
    };
    var drop = function (w) {
      w.classList.remove('hov');
      for (var i = 0; i < live.length; i++) if (live[i].w === w) { var s = live[i]; s.on = false; s.trx = s.tRy = 0; s.tsc = 1; }
    };
    var follow = function (x, y) {
      var el = document.elementFromPoint(x, y), w = el && el.closest ? el.closest(AV) : null;
      if (!w && hot && hot.isConnected && el && el.closest && el.closest('dialog') === hot.closest('dialog') && inside(hot, x, y)) w = hot;   // inclinada, sigue siendo la misma hasta salir de su círculo quieto
      if (w && !inside(w, x, y)) w = null;             // solo sobre la foto: el nombre y el resto no cuentan
      if (document.querySelector('.track.dragging, .w-list.dragging') || document.documentElement.classList.contains('grabbing')) w = null;
      if (w !== hot) { if (hot) drop(hot); hot = w; if (w) w.classList.add('hov'); }
      if (w && !flat) aim(w, x, y);
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pt = [e.clientX, e.clientY]; follow(pt[0], pt[1]);
    }, { passive: true });
    // si la página o una fila se mueve debajo del mouse quieto, pasa a activa la foto que queda abajo
    document.addEventListener('scroll', function () { if (pt) follow(pt[0], pt[1]); }, { passive: true, capture: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { pt = null; if (hot) { drop(hot); hot = null; } } });
    if (!flat) requestAnimationFrame(function tick(now) {
      var dt = tl ? Math.min(50, now - tl) : 16, a = 1 - Math.exp(-dt / 90);
      tl = now;
      for (var i = live.length - 1; i >= 0; i--) {
        var s = live[i];
        s.rx += (s.trx - s.rx) * a; s.ry += (s.tRy - s.ry) * a; s.gx += (s.tgx - s.gx) * a; s.gy += (s.tgy - s.gy) * a; s.sc += (s.tsc - s.sc) * a;
        if (!s.on && Math.abs(s.rx) < 0.02 && Math.abs(s.ry) < 0.02 && Math.abs(s.sc - 1) < 0.0005) {
          ['--rx', '--ry', '--gx', '--gy', '--s'].forEach(function (p) { s.t.style.removeProperty(p); });
          s.w.classList.remove('tilt'); live.splice(i, 1);
          continue;
        }
        s.t.style.setProperty('--rx', s.rx.toFixed(2) + 'deg');
        s.t.style.setProperty('--ry', s.ry.toFixed(2) + 'deg');
        s.t.style.setProperty('--gx', s.gx.toFixed(1) + '%');
        s.t.style.setProperty('--gy', s.gy.toFixed(1) + '%');
        s.t.style.setProperty('--s', s.sc.toFixed(4));
      }
      requestAnimationFrame(tick);
    });
  }

  // ---------------- ventanas ----------------
  function show(d) { if (d.open) return; try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
  var EASE = 'cubic-bezier(.2, .8, .2, 1)';
  var still = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var full = new Intl.NumberFormat('es-AR');
  var linkify = function (s) { return esc(s).replace(/https?:\/\/[^\s<]+/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }); };
  var channelBlock = function (w) {                    // foto, nombre y suscriptores; abre el canal
    var ch = w.channelId ? channels[w.channelId] : null;
    var subs = ch && ch.statistics && ch.statistics.subscriberCount != null ? abbr(+ch.statistics.subscriberCount) + ' de suscriptores' : '';
    var face = ch ? '<span class="w-av"><img src="' + esc(ch.snippet.thumbnails.medium.url) + '" alt=""></span>'
      : '<span class="w-av ini" aria-hidden="true">' + esc((w.who || '·').charAt(0).toUpperCase()) + '</span>';
    var who = face + '<span class="w-cht"><b>' + esc(w.who || 'Lil Sanguchito') + '</b>' + (subs ? '<span>' + subs + '</span>' : '') + '</span>';
    return ch ? '<a class="w-chl" href="' + esc(chUrl(ch)) + '" target="_blank" rel="noopener">' + who + '</a>' : '<span class="w-chl">' + who + '</span>';
  };

  function openWork(id) {
    var w = byId[id];
    if (!w) return;
    return w.vertical ? openShorts(id) : openWatch(id);   // horizontales: como YouTube; verticales: como Shorts
  }
  // El play es a mano: recién ahí se carga el reproductor de YouTube, Drive o TikTok, en el lugar de la
  // miniatura. Un video que su canal no deja insertar se abre en YouTube. Con los datos de ejemplo, un aviso.
  function embedOf(w) {
    if (w.yt) return w.embed ? 'https://www.youtube-nocookie.com/embed/' + w.yt + '?autoplay=1&playsinline=1&rel=0&enablejsapi=1' +   // enablejsapi: para el mini reproductor
      (location.origin && location.origin !== 'null' ? '&origin=' + encodeURIComponent(location.origin) : '') : '';
    if (w.drive) return 'https://drive.google.com/file/d/' + w.drive + '/preview';
    if (w.tt) return 'https://www.tiktok.com/player/v1/' + w.tt + '?autoplay=1&rel=0';
    return '';
  }
  function playHere(btn, stage, w) {
    var src = LIVE && w ? embedOf(w) : '';
    if (LIVE && w && !src) { window.open(w.out, '_blank', 'noopener'); return; }
    btn.hidden = true;
    if (src) {
      var f = document.createElement('iframe');
      f.src = src; f.title = w.title; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      stage.appendChild(f); stage.classList.add('playing');
      return;
    }
    var m = document.createElement('div');
    m.className = 'msg'; m.textContent = 'Prototipo: en la web real el video se reproduce acá';
    stage.appendChild(m);
  }
  function stopHere(stage) {                          // se va el video: deja de sonar y vuelve la miniatura
    if (!stage) return;
    [].forEach.call(stage.querySelectorAll('iframe, .msg'), function (x) { x.remove(); });
    stage.classList.remove('playing');
    var pl = stage.querySelector('.play'); if (pl) pl.hidden = false;
    if (stage.id === 'w-stage') YT = { f: null, ok: false, st: -1, t: 0, d: 0 };
  }
  $('#w-play').addEventListener('click', function () {
    playHere(this, $('#w-stage'), WA.now);
    var f = $('#w-stage iframe'); if (f && WA.now && WA.now.yt) ytHook(f);   // para el mini reproductor: cómo va, play y pausa
  });

  // ---------------- V1 · el video horizontal, como la página de un video en YouTube ----------------
  // El video grande con su miniatura y el play a mano; abajo el título y la fila del canal, con las views;
  // más abajo, la descripción original. A la derecha, los demás videos (el que estás viendo no está),
  // con variedad: la lista se mueve sola, con la rueda, el dedo
  // o arrastrándola con el mouse. Si el creador no tiene otros, muestra los más vistos del resto.
  // Al tocar otro, cambia directo, sin animación. Arriba de la lista, los temas, como los de la página.
  var creator = function (w) { return w.client ? 'c:' + w.client.toLowerCase() : w.channelId ? 'y:' + w.channelId : 'w:' + w.id; };
  // Lo que sigue al que estás viendo, con variedad: el que elegiste primero y después se alternan uno del
  // mismo creador y uno de otro. Los de otros creadores van rotando (cada vuelta, el más visto de cada uno,
  // sin repetir creador seguido); cuando se terminan los del mismo, siguen los demás rotando igual.
  // La pila llega ordenada de más a menos views.
  function mix(cur, pool) {
    var me = creator(cur), mine = [], rest = [], out = [cur], used = {}, turn = 1;
    pool.forEach(function (v) { if (v !== cur) (creator(v) === me ? mine : rest).push(v); });
    while (mine.length || rest.length) {
      if ((turn && mine.length) || !rest.length) out.push(mine.shift());
      else {
        var k = -1, last = creator(out[out.length - 1]);
        rest.some(function (v, n) { if (!used[creator(v)] && creator(v) !== last) { k = n; return true; } });
        if (k < 0) {                                     // terminó la vuelta: arranca otra
          used = {};
          rest.some(function (v, n) { if (creator(v) !== last) { k = n; return true; } });
          if (k < 0) k = 0;
        }
        used[creator(rest[k])] = true;
        out.push(rest.splice(k, 1)[0]);
      }
      turn = 1 - turn;
    }
    return out;
  }
  var WA = { now: null, key: '', seq: 0, topic: '', keep: 0 };
  var WB = ownBar($('#dlgWatch'), function () { return stacked() ? $('#w-body') : $('#w-list'); });   // la barra propia: la lista (en el celular, todo lo de abajo)
  var STACK = matchMedia('(max-width: 1000px)');
  var stacked = function () { return STACK.matches; };
  // en el celular y la tablet, la lista va dentro de lo que se desliza debajo del video; en la compu, a la derecha
  function placeSide() {
    var side = $('#dlgWatch .w-side'), body = $('#w-body');
    if (stacked()) { if (side.parentNode !== body) body.appendChild(side); }
    else if (side.parentNode === body) $('#dlgWatch .panel').insertBefore(side, $('#dlgWatch .w-x'));
  }
  if (STACK.addEventListener) STACK.addEventListener('change', placeSide); else STACK.addListener(placeSide);
  placeSide();
  function sideItem(v) {
    return '<button class="w-it" type="button" data-watch="' + v.id + '" aria-label="' + esc('Ver “' + v.title + '”') + '">' +
      '<span class="w-th r169"><img src="' + esc(v.thumb) + '" alt="" loading="lazy" draggable="false">' + (v.dur ? '<span class="dur">' + v.dur + '</span>' : '') + '</span>' +
      '<span class="w-it-t"><span class="w-it-ttl">' + esc(v.title) + '</span>' + (v.who ? '<span class="w-it-s">' + esc(v.who) + '</span>' : '') +
      (v.views != null ? '<span class="w-it-s w-it-v"><i aria-hidden="true">▶</i> ' + abbr(v.views) + '<span class="sr"> views</span></span>' : '') + '</span></button>';
  }
  // los demás horizontales, sin el que estás viendo, con variedad (del tema elegido arriba de la lista)
  function listFor(w) {
    var pool = WA.topic ? hs.filter(function (v) { return (v.topics || []).indexOf(WA.topic) >= 0; }) : hs;
    return { key: 'mix:' + w.id + ':' + WA.topic, title: 'Más trabajos', items: mix(w, pool).slice(1) };
  }
  function fillList(L) {
    $('#w-more').textContent = L.title;
    $('#w-list').innerHTML = L.items.length ? L.items.map(sideItem).join('') : '<p class="empty">No hay otros videos con este tema.</p>';
    WA.key = L.key; WB();
  }
  function fillStage(w) {
    stopHere($('#w-stage'));
    var im = $('#w-img');
    if (im.getAttribute('src') !== w.thumb) { im.classList.remove('ok'); im.src = w.thumb; }   // la nueva aparece suave
    $('#w-dur').textContent = w.dur || ''; $('#w-dur').hidden = !w.dur;
  }
  function fillMeta(w) {
    var tt = $('#w-t');                               // el título lleva al original; con el mouse, el cartel lo dice
    tt.innerHTML = '<a class="w-tl" href="' + esc(w.out) + '" target="_blank" rel="noopener">' + esc(w.title) + '</a>';
    tt.setAttribute('data-tip', w.outLabel);
    var stat = w.views != null ? '<b class="w-views">' + full.format(w.views) + ' visualizaciones</b>' : '';
    $('#w-ch').innerHTML = channelBlock(w) + (stat ? '<div class="w-stat">' + stat + '</div>' : '');
    var box = $('#w-desc');
    box.innerHTML = w.desc ? '<div class="d-txt">' + linkify(w.desc) + '<button class="d-more" type="button" hidden>…más</button></div>'
      : '<span class="nod">Sin descripción.</span>';
    box.classList.remove('open');
  }
  // arriba de la lista, los temas, como los de la página: tocando uno, la lista queda con los de ese tema
  var wChips = (function () {
    var list = topicsFor(hs);
    if (!list.length) return null;
    return chipRow($('#w-chips'), $('#w-chip-r'), list, function (t) {
      WA.topic = t;
      fillList(listFor(WA.now)); $('#w-list').scrollTop = 0;
    });
  })();
  // el cartel del título sigue al mouse, sin salirse del título
  $('#w-t').addEventListener('mousemove', function (e) {
    var r = this.getBoundingClientRect(), pw = parseFloat(getComputedStyle(this, '::after').width) || 120;
    this.style.setProperty('--tx', Math.round(Math.max(pw / 2, Math.min(r.width - pw / 2, e.clientX - r.left))) + 'px');
  });
  function autoPlay() { if (LIVE && WA.now && embedOf(WA.now)) $('#w-play').click(); }   // al tocar un video, arranca solo
  function openWatch(id, from) {
    var w = byId[id], d = $('#dlgWatch');
    if (!w) return;
    if (isMini()) {                                    // con el mini reproductor: el mismo se agranda; otro, se abre grande
      if (WA.now && w.id === WA.now.id) return reopen(false);
      WA.keep++; d.close(); setMini(false); stopHere($('#w-stage'));
    }
    if (!d.open) {
      WA.now = w; WA.seq++; WA.topic = ''; if (wChips) wChips.set('');   // cada vez que se abre, con Todo
      fillStage(w); fillMeta(w); fillList(listFor(w));
      show(d); setTimeout(WB, 320);
      // cada video que abrís arranca arriba de todo: la lista, la columna del video y lo de abajo en el celular.
      // Va después de abrir la ventana, porque cerrada no tiene scroll y el navegador volvía a donde había quedado
      ['#w-list', '#w-main', '#w-body'].forEach(function (s) { var el = $(s); if (el) el.scrollTop = 0; });
      requestAnimationFrame(fitDesc);
      autoPlay();
      return;
    }
    if (WA.now && w.id === WA.now.id) {                          // el que ya está: solo el toque
      if (from && !still()) from.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 300, easing: EASE });
      return;
    }
    switchWatch(w);
  }
  function switchWatch(w) {                          // otro video: cambia directo, sin animación
    WA.now = w; WA.seq++;
    fillStage(w); fillMeta(w); fitDesc();
    fillList(listFor(w)); $('#w-list').scrollTop = 0;
    (stacked() ? $('#w-body') : $('#w-main')).scrollTop = 0;   // todo vuelve arriba, para ver el video y su título
    autoPlay();
  }
  // La descripción arranca minimizada, como en YouTube: en la compu, los renglones que entran debajo del
  // canal (dos como mínimo); en el celular y la tablet, tres. Si no entra entera, termina en “…más”
  function fitDesc() {
    var box = $('#w-desc'), tx = $('#w-desc .d-txt'), more = $('#w-desc .d-more');
    if (!tx || !more || box.classList.contains('open')) return;
    var lh = parseFloat(getComputedStyle(tx).lineHeight) || 20;
    box.classList.add('fits'); more.hidden = true;     // ¿entra entera, con sus renglones? entonces va así, sin “…más”
    var room = stacked() ? 3 * lh : box.clientHeight - 2 * (parseFloat(getComputedStyle(box).paddingTop) || 0);
    if (tx.scrollHeight <= room + 1) return;
    box.classList.remove('fits');
    if (stacked()) tx.style.removeProperty('--lines');
    else tx.style.setProperty('--lines', Math.max(2, Math.floor(room / lh)));
    more.hidden = false;
    box.classList.remove('cut');                       // “…más” justo después del texto o, si el texto se corta,
    if (tx.scrollHeight > tx.clientHeight + 1) box.classList.add('cut');   // encima del final del último renglón
  }
  window.addEventListener('resize', function () { if ($('#dlgWatch').open) fitDesc(); });
  $('#dlgWatch').addEventListener('close', function () {
    if (WA.keep > 0) { WA.keep--; return; }           // se cerró para volver a abrirse, grande o chica: el video sigue
    WA.seq++; setMini(false);
    stopHere($('#w-stage'));
  });

  // ---------------- mini reproductor, como el de YouTube ----------------
  // Si cerrás el reproductor con un video horizontal sonando (con la cruz, tocando afuera o con Esc), sigue en
  // uno chico: en la compu, abajo a la derecha, con los botones encima del video al pasar el mouse; en el
  // celular, una barra abajo de todo, como en la app. Tocándolo se agranda de nuevo y la cruz lo cierra. Es la
  // misma ventana, achicada, así que el video no se corta ni se recarga. Con YouTube, además, el play y la
  // pausa y la barrita de cuánto va (el reproductor de YouTube avisa cómo va y acepta órdenes).
  var WD = $('#dlgWatch'), YT = { f: null, ok: false, st: -1, t: 0, d: 0 }, miOn = null;
  var MINI_ICON = { play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>' };
  var isMini = function () { return WD.open && WD.classList.contains('mini'); };
  var sounding = function () { return !!$('#w-stage iframe') && YT.st !== 0 && YT.st !== 2; };   // sin saberlo (Drive), cuenta como que suena
  function setMini(on) { WD.classList.toggle('mini', on); if (!on) WD.classList.remove('ytoff'); document.documentElement.classList.toggle('has-mini', on); }
  function reopen(mini) {                             // la misma ventana, grande o chica: el video sigue sonando
    WA.keep++; WD.close(); setMini(mini);
    if (mini) { WD.show(); miOn = null; paintMini(); try { PAGE.focus({ preventScroll: true }); } catch (e) {} }
    else { show(WD); requestAnimationFrame(fitDesc); setTimeout(WB, 320); }
    WB();
  }
  function closeWatch() { if (!isMini() && sounding()) reopen(true); else WD.close(); }
  function hushMini() { if (!isMini()) return; if (YT.f && YT.ok) ytCmd('pauseVideo'); else WD.close(); }   // al abrir un vertical, el chico se calla
  function paintMini() {
    if (!isMini() || !WA.now) return;
    $('#mi-t').textContent = WA.now.title; $('#mi-c').textContent = WA.now.who || '';
    var on = YT.st === 1 || YT.st === 3, b = $('#mi-play');
    b.hidden = $('#mi-bar').hidden = !YT.f || !YT.ok;
    WD.classList.toggle('ytoff', !!YT.f && YT.ok && (YT.st === 2 || YT.st === 0));
    if (miOn !== on) { miOn = on; b.innerHTML = on ? MINI_ICON.pause : MINI_ICON.play; b.setAttribute('aria-label', on ? 'Pausar' : 'Reproducir'); }
    $('#mi-fill').style.width = YT.d ? Math.min(100, 100 * YT.t / YT.d).toFixed(2) + '%' : '0';
  }
  function miniAct(a) {
    if (a === 'open') return reopen(false);
    if (a === 'close') return WD.close();
    if (a === 'play') ytCmd(YT.st === 1 || YT.st === 3 ? 'pauseVideo' : 'playVideo');
  }
  function ytCmd(fn) { try { YT.f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: fn, args: [] }), '*'); } catch (e) {} }
  function ytHook(f) {                                // le pide al reproductor que avise cómo va
    YT = { f: f, ok: false, st: -1, t: 0, d: 0 };
    var n = 0, hi = function () {
      if (YT.f !== f || YT.ok || n++ > 25) return;
      try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {}
      setTimeout(hi, 400);
    };
    f.addEventListener('load', hi);
  }
  window.addEventListener('message', function (e) {
    if (!YT.f || e.source !== YT.f.contentWindow) return;
    var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!m || !m.event) return;
    YT.ok = true;
    var i = m.info;
    if (m.event === 'onStateChange' && typeof i === 'number') YT.st = i;
    else if (i && typeof i === 'object') {
      if (typeof i.playerState === 'number') YT.st = i.playerState;
      if (typeof i.currentTime === 'number') YT.t = i.currentTime;
      if (typeof i.duration === 'number') YT.d = i.duration;
    }
    paintMini();
  });
  // En la compu, el chico se arrastra a cualquier lado y al soltarlo va a la esquina más cercana (queda
  // recordada). Un toque sin arrastrar lo agranda.
  var MI = { c: 'br', drag: null, moved: false, swallow: false };
  try { MI.c = localStorage.getItem('portfolio-mini') || 'br'; } catch (e) {}
  function miCorner(c) { ['tl', 'tr', 'bl', 'br'].forEach(function (k) { WD.classList.toggle('c-' + k, k === c); }); }
  miCorner(MI.c);
  WD.addEventListener('pointerdown', function (e) {
    if (!isMini() || stacked() || e.button !== 0 || e.target.closest('.mi-b')) return;
    MI.drag = { x: e.clientX, y: e.clientY, r: WD.getBoundingClientRect(), id: e.pointerId }; MI.moved = false;
  });
  window.addEventListener('pointermove', function (e) {
    var g = MI.drag;
    if (!g || e.pointerId !== g.id) return;
    var dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!MI.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      MI.moved = true; document.documentElement.classList.add('grabbing');
      WD.getAnimations().forEach(function (a) { a.cancel(); });
    }
    dx = Math.max(-g.r.left, Math.min(innerWidth - g.r.right, dx)); dy = Math.max(-g.r.top, Math.min(innerHeight - g.r.bottom, dy));
    WD.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  });
  function miDrop() {
    var g = MI.drag; MI.drag = null;
    if (!g || !MI.moved) return;
    MI.moved = false; MI.swallow = true; setTimeout(function () { MI.swallow = false; });   // el clic de soltar no lo agranda
    document.documentElement.classList.remove('grabbing');
    var a = WD.getBoundingClientRect(), c = (a.top + a.height / 2 < innerHeight / 2 ? 't' : 'b') + (a.left + a.width / 2 < innerWidth / 2 ? 'l' : 'r');
    WD.style.transform = ''; miCorner(c);
    var b = WD.getBoundingClientRect();
    if (!still()) WD.animate([{ transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px)' }, { transform: 'none' }], { duration: 280, easing: EASE });
    MI.c = c; try { localStorage.setItem('portfolio-mini', c); } catch (x) {}
  }
  window.addEventListener('pointerup', miDrop); window.addEventListener('pointercancel', miDrop);
  WD.addEventListener('cancel', function (e) { if (sounding()) { e.preventDefault(); setTimeout(function () { reopen(true); }); } });   // Esc

  // ---------------- en la compu, también se scrollea arrastrando, como con el dedo ----------------
  // Con el mouse se agarra la página, el reproductor o su lista y se los desliza para arriba o para abajo;
  // al soltar siguen un poco por inercia y frenan solos. Un clic sin mover sigue siendo un clic, y arrastrar
  // de costado queda para la fila de verticales. Los verticales (V2) tienen su arrastre propio, de a uno.
  (function () {
    var html = document.documentElement, page = PAGE;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var d = null, moved = false, raf = 0;
    var scrolls = function (el) {
      var o = getComputedStyle(el).overflowY;
      return (o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1;
    };
    function scrollerAt(t) {                           // lo primero que se desliza para arriba o para abajo
      for (var el = t; el && el !== document.body && el !== html; el = el.parentElement) {
        if (el.tagName === 'DIALOG') return null;      // en una ventana, la página de atrás no se mueve
        if (el.classList.contains('track')) continue;  // la fila de verticales se mueve de costado
        if (scrolls(el)) return el;
      }
      return document.querySelector('dialog[open]') || !page.contains(t) ? null : page;   // la barra de arriba no arrastra nada
    }
    var get = function (el) { return el.scrollTop; };
    var set = function (el, y) { el.scrollTop = y; };
    function settle() {                                // terminó: la página vuelve a su scroll suave
      cancelAnimationFrame(raf); raf = 0;
      page.style.removeProperty('scroll-behavior');
    }
    document.addEventListener('pointerdown', function (e) {
      settle();
      moved = false; d = null;
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      var t = e.target;
      if (!t.closest || t.closest('#dlgShorts, input, textarea, select, [contenteditable]')) return;
      var el = scrollerAt(t);
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (e.clientX >= r.left + el.clientLeft + el.clientWidth) return;   // sobre la barra de scroll: la barra manda
      d = { id: e.pointerId, el: el, x: e.clientX, y: e.clientY, top: get(el), ly: e.clientY, lt: performance.now(), v: 0, on: false };
    });
    document.addEventListener('pointermove', function (e) {
      if (!d || e.pointerId !== d.id) return;
      var now = performance.now();
      if (!d.on) {
        var ax = Math.abs(e.clientX - d.x), ay = Math.abs(e.clientY - d.y);
        if (ax < 7 && ay < 7) return;
        if (ax >= ay) { d = null; return; }            // de costado: no es scroll
        d.on = true; moved = true; d.y = e.clientY; d.top = get(d.el); d.ly = e.clientY; d.lt = now;
        if (d.el === page) page.style.scrollBehavior = 'auto';   // mientras se arrastra, sin scroll suave
        html.classList.add('grabbing');
        var sel = getSelection && getSelection(); if (sel && sel.rangeCount) sel.removeAllRanges();
        try { d.el.setPointerCapture(e.pointerId); } catch (x) {}
        return;
      }
      set(d.el, d.top - (e.clientY - d.y));
      d.v = 0.8 * d.v + 0.2 * ((e.clientY - d.ly) / Math.max(1, now - d.lt));   // px por ms
      d.ly = e.clientY; d.lt = now;
    });
    function end(e) {
      if (!d || (e && e.pointerId !== d.id)) return;
      var g = d; d = null;
      if (!g.on) return;
      html.classList.remove('grabbing');
      setTimeout(function () { moved = false; }, 0);  // el clic que viene al soltar no cuenta
      if (reduce || Math.abs(g.v) < 0.05) return settle();
      var v = -g.v * 16, last = 0;                     // px por cuadro
      raf = requestAnimationFrame(function step(now) {
        var dt = last ? Math.min(50, now - last) : 16; last = now;
        set(g.el, get(g.el) + v * dt / 16); v *= Math.pow(0.94, dt / 16);
        if (Math.abs(v) > 0.3) raf = requestAnimationFrame(step); else settle();
      });
    }
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
    document.addEventListener('wheel', settle, { passive: true });
    document.addEventListener('close', settle, true);   // al cerrar una ventana, el envión que quedaba se corta
    document.addEventListener('dragstart', function (e) { if (d) e.preventDefault(); });   // ni la foto ni el link se despegan
    document.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  })();

  // ---------------- V2 · los verticales, como Shorts ----------------
  // Uno por pantalla, en el orden de la fila, con el anterior asomando arriba y el siguiente abajo, más
  // oscuros. Se pasan con la rueda (uno por gesto), el dedo, arrastrando con el mouse, las flechas del
  // teclado o los botones ↑ ↓, y siempre frena en uno. El play, al centro; al lado, siempre abierta, la
  // descripción con el título, las views y los likes, y el canal. En el celular, como Shorts: a pantalla
  // completa, con el canal, el título y la descripción sobre el video y los likes y las views a la derecha.
  var SH = { d: $('#dlgShorts'), feed: $('#sh-feed'), items: [], i: -1, mt: 0 };
  var SB = ownBar(SH.d, function () { var it = SH.items[SH.i]; return it && it.querySelector('.sh-pan .d-txt'); });   // la barra propia: la descripción
  var ICON = {
    like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.6s-7.3-4.4-7.3-9.9A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.3 2.5c0 5.5-7.3 9.9-7.3 9.9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    views: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4L18.4 12z" fill="currentColor"/></svg>'
  };
  function shortItem(w) {
    var ch = w.channelId ? channels[w.channelId] : null;
    var av = ch ? '<span class="sh-av"><img src="' + esc(ch.snippet.thumbnails.medium.url) + '" alt="" draggable="false"></span>'
      : w.who ? '<span class="sh-av ini" aria-hidden="true">' + esc(w.who.charAt(0).toUpperCase()) + '</span>' : '';
    var who = !w.who ? '' : ch ? '<a class="sh-ch" href="' + esc(chUrl(ch)) + '" target="_blank" rel="noopener" draggable="false">' + av + '<b>' + esc(w.who) + '</b></a>'
      : '<span class="sh-ch">' + av + '<b>' + esc(w.who) + '</b></span>';
    var acts = (w.likes != null ? '<div class="sh-a"><span class="sh-i">' + ICON.like + '</span><span>' + abbr(w.likes) + '<span class="sr"> Me gusta</span></span></div>' : '') +
      (w.views != null ? '<div class="sh-a v"><span class="sh-i">' + ICON.views + '</span><span>' + abbr(w.views) + '<span class="sr"> views</span></span></div>' : '');
    var text = w.desc ? linkify(w.desc) : '';
    var foot = (w.who ? (ch ? '<a class="sd-ch" href="' + esc(chUrl(ch)) + '" target="_blank" rel="noopener">' + av + '<b>' + esc(w.who) + '</b></a>' : '<span class="sd-ch">' + av + '<b>' + esc(w.who) + '</b></span>') : '') +
      (w.views != null ? '<span class="sd-n sd-v">' + ICON.views + abbr(w.views) + '<span class="sr"> views</span></span>' : '') +
      (w.likes != null ? '<span class="sd-n">' + ICON.like + abbr(w.likes) + '<span class="sr"> Me gusta</span></span>' : '');
    return '<article class="sh-it" data-short="' + w.id + '" aria-label="' + esc(w.title) + '">' +
      '<div class="sh-v"><img src="' + esc(w.thumb) + '" alt="" draggable="false">' +
      '<button class="play" type="button" aria-label="' + esc('Reproducir “' + w.title + '”') + '"><span>▶</span></button>' +
      '<div class="sh-info">' + who + '<p class="sh-ttl">' + esc(w.title) + '</p>' + (text ? '<div class="sh-dx">' + text + '</div>' : '') + '</div></div>' +
      '<div class="sh-act">' + acts + '</div>' +
      '<aside class="sh-pan" aria-label="Descripción"><h3 class="sd-t">' + esc(w.title) + '</h3><button class="x sd-x" type="button" data-close aria-label="Cerrar">✕</button>' +
      (text ? '<div class="d-txt">' + text + '</div>' : '<div class="nod">Sin descripción.</div>') + (foot ? '<div class="sd-foot">' + foot + '</div>' : '') + '</aside></article>';
  }
  // Toques el que toques, ese va primero (arriba no hay nada) y abajo siguen los demás reels con variedad:
  // uno del mismo creador, uno de otro. Al terminarse, terminan
  function openShorts(id) {
    var w = byId[id];
    if (!w || vs.indexOf(w) < 0) return;
    hushMini();
    SH.feed.innerHTML = mix(w, vs).map(shortItem).join('');
    SH.items = [].slice.call(SH.feed.children);
    SH.i = -1;
    show(SH.d);
    SH.mt = parseFloat(getComputedStyle(SH.items[0]).scrollMarginTop) || 0;
    SH.feed.scrollTop = 0;
    shActive(0); setTimeout(SB, 320);
  }
  function shIndex() {                                   // el que quedó en el centro
    var top = SH.feed.scrollTop + SH.mt, best = 0, dd = Infinity;
    SH.items.forEach(function (el, n) { var x = Math.abs(el.offsetTop - top); if (x < dd) { dd = x; best = n; } });
    return best;
  }
  function shActive(n) {
    if (n === SH.i) return;
    var prev = SH.items[SH.i];
    if (prev) {                                            // el que se va deja de sonar
      prev.classList.remove('on');
      stopHere(prev.querySelector('.sh-v'));
      var dx = prev.querySelector('.sh-dx'); if (dx) dx.scrollTop = 0;
    }
    SH.i = n;
    var it = SH.items[n];
    if (!it) return;
    it.classList.add('on');
    var pb = it.querySelector('.sh-v .play'), sw = byId[it.dataset.short];   // el que queda en pantalla arranca solo
    if (LIVE && pb && !pb.hidden && sw && embedOf(sw)) playHere(pb, pb.closest('.sh-v'), sw);
    var btns = SH.d.querySelectorAll('.sh-nav button');
    btns[0].disabled = n === 0; btns[1].disabled = n === SH.items.length - 1;
    SB();
  }
  function shGo(n, fast) {
    n = Math.max(0, Math.min(SH.items.length - 1, n));
    SH.feed.scrollTo({ top: SH.items[n].offsetTop - SH.mt, behavior: still() || fast ? 'auto' : 'smooth' });
  }
  var shTick = false;
  SH.feed.addEventListener('scroll', function () {
    if (shTick) return;
    shTick = true;
    requestAnimationFrame(function () { shTick = false; shActive(shIndex()); });
  }, { passive: true });
  SH.d.addEventListener('close', function () { if (SH.d.open) return; SH.feed.innerHTML = ''; SH.items = []; SH.i = -1; });   // si ya se volvió a abrir, no se vacía
  // la rueda o el trackpad pasan de a uno por gesto, en cualquier parte de la pantalla (como en Shorts)
  var wh = { acc: 0, lock: false, until: 0, idle: 0 };
  SH.d.addEventListener('wheel', function (e) {
    var rd = e.target.closest && e.target.closest('.sh-pan .d-txt, .sh-dx');
    if (e.ctrlKey || (rd && rd.scrollHeight > rd.clientHeight + 1)) return;   // zoom, o leyendo una descripción larga
    e.preventDefault();
    var now = performance.now();
    clearTimeout(wh.idle);
    var release = function () { var left = wh.until - performance.now(); if (left > 0) wh.idle = setTimeout(release, left); else { wh.lock = false; wh.acc = 0; } };
    wh.idle = setTimeout(release, 180);                  // el gesto terminó cuando la rueda se queda quieta
    if (wh.lock) return;
    wh.acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(wh.acc) < 24) return;
    wh.lock = true; wh.until = now + 420;
    shGo(SH.i + (wh.acc > 0 ? 1 : -1)); wh.acc = 0;
  }, { passive: false });
  // con el mouse también se desliza: arrastrando el video para arriba o para abajo, como con el dedo
  (function () {
    var f = SH.feed, drag = null, moved = false;
    f.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, .sh-pan, .sh-dx')) return;
      drag = { id: e.pointerId, y: e.clientY, top: f.scrollTop, ly: e.clientY, lt: performance.now(), v: 0, on: false, from: SH.i }; moved = false;
    });
    f.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y, now = performance.now();
      if (!drag.on && Math.abs(dy) > 6) { drag.on = true; moved = true; f.classList.add('drag'); f.setPointerCapture(e.pointerId); }
      if (!drag.on) return;
      f.scrollTop = drag.top - dy;
      drag.v = 0.8 * drag.v + 0.2 * ((e.clientY - drag.ly) / Math.max(1, now - drag.lt));   // px por ms
      drag.ly = e.clientY; drag.lt = now;
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      if (!d.on) return;
      var dy = e.clientY - d.y, to = d.from;                       // pasa si lo arrastraste un poco o rápido
      if (dy < -60 || d.v < -0.45) to = d.from + 1; else if (dy > 60 || d.v > 0.45) to = d.from - 1;
      shGo(to);
      var done = function () { f.classList.remove('drag'); f.removeEventListener('scrollend', done); };
      f.addEventListener('scrollend', done); setTimeout(done, 700);
    }
    f.addEventListener('pointerup', end);
    f.addEventListener('pointercancel', end);
    f.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  })();
  document.addEventListener('keydown', function (e) {
    if (!SH.d.open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('.sh-pan')) return;     // en la descripción, las flechas la leen
    if (/^(ArrowDown|PageDown|j)$/.test(e.key)) { e.preventDefault(); shGo(SH.i + 1); }
    else if (/^(ArrowUp|PageUp|k)$/.test(e.key)) { e.preventDefault(); shGo(SH.i - 1); }
  });

  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if (MI.swallow) { MI.swallow = false; return; }                // soltando el mini reproductor después de moverlo
    if (t.closest('#top-t')) { e.preventDefault(); return toEnd(); }  // el título de la barra: hasta abajo de todo o, si ya estás abajo, arriba
    if ((el = t.closest('a[href^="#"]'))) {
      var id = el.getAttribute('href').slice(1);
      if (id === 'top' || document.getElementById(id)) { e.preventDefault(); return goTo(id); }
    }
    if (t.closest('a[href]')) return;                                 // el canal y el original: se abren aparte
    if ((el = t.closest('.d-more'))) {                                // abre y cierra la descripción
      var open = $('#w-desc').classList.toggle('open');
      el.textContent = open ? 'Mostrar menos' : '…más';
      if (!open) fitDesc();
      WB();
      return;
    }
    if ((el = t.closest('[data-mini]'))) return miniAct(el.dataset.mini);              // el mini reproductor
    if ((el = t.closest('[data-watch]'))) return openWatch(el.dataset.watch, el);   // de la lista del reproductor
    if ((el = t.closest('.sh-it:not(.on)'))) return shGo(SH.items.indexOf(el));     // el de abajo (o arriba): pasa a ese
    if (t.closest('.sh-dx')) return;                                                  // leyendo la descripción: no es play
    if ((el = t.closest('.sh-v .play'))) return playHere(el, el.closest('.sh-v'), byId[el.closest('.sh-it').dataset.short]);
    if ((el = t.closest('[data-sh]'))) return shGo(SH.i + (+el.dataset.sh));
    if ((el = t.closest('[data-work]'))) return openWork(el.dataset.work);
    if (t.closest('[data-close]')) { el = t.closest('dialog'); return el === WD ? closeWatch() : el.close(); }
    if (t.tagName === 'DIALOG' || t === SH.feed) {                                  // clic afuera
      el = t.closest('dialog');
      return el === WD ? (isMini() ? reopen(false) : closeWatch()) : el.close();
    }
  });

  // el título de la barra: baja hasta el final de la página y, si ya estás abajo de todo, sube al principio
  function atEnd() { return PAGE.scrollTop + PAGE.clientHeight >= PAGE.scrollHeight - 8; }
  function toEnd() {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    PAGE.scrollTo({ top: atEnd() ? 0 : PAGE.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }

  // los links de la página: con scroll suave
  function goTo(id, hash) {
    var el = id === 'top' ? document.body : document.getElementById(id);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el) return;
    if (id === 'top') PAGE.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setHash(hash || id);
  }

  // ---------------- config: la barra de arriba ----------------
  // El título y, a la derecha, Discord, Instagram y el canal (con el ícono de YouTube), en blanco. Salen de la
  // config: la pestaña Config de la planilla (la lee js/data.js) o, sin planilla, la de ejemplo de
  // js/config.js. Los íconos son los de cada marca (Font Awesome); si no cargan, va uno de muestra.
  var ICONS = {
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.5" cy="11.3" r="1.2" fill="currentColor"/><circle cx="12" cy="11.3" r="1.2" fill="currentColor"/><circle cx="15.5" cy="11.3" r="1.2" fill="currentColor"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.6l1.6-2.2h5.6L16.4 7H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12.8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14l4-4M9 7l1.5-1.5a3.5 3.5 0 0 1 5 5L14 12M10 12l-1.5 1.5a3.5 3.5 0 0 1-5-5L5 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  };
  var BRAND = { discord: 'discord', instagram: 'instagram', youtube: 'youtube', tiktok: 'tiktok', twitch: 'twitch', x: 'x-twitter' };   // los íconos de cada marca, de Font Awesome
  ICONS.play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4L18.4 12z" fill="currentColor"/></svg>';
  function loadConfig() { return Promise.resolve(M.config || (window.SITE_CONFIG || {}).mock || {}); }
  // la barra de arriba: el título y los links, en blanco (el canal, con el ícono de YouTube)
  function renderTop(c) {
    if (c && c.title) $('#top-t').textContent = c.title;
    var links = (c && c.links || []).filter(function (l) { return l && /^https?:\/\//.test(l.url || ''); });
    $('#top-links').innerHTML = links.map(function (l) {
      var b = BRAND[l.id] || (l.id === 'canal' ? 'youtube' : '');
      var face = l.icon ? '<img class="tl-ic" src="' + esc(l.icon) + '" alt="" draggable="false">'                  // el ícono oficial, si la config lo trae
        : b ? '<i class="fa-brands fa-' + b + '" aria-hidden="true"></i><span class="tl-gen">' + (ICONS[l.id] || ICONS.play) + '</span>'   // el de la marca; si no carga, el de muestra
        : ICONS.link;
      return '<a class="tl-' + esc(l.id || 'link') + '" href="' + esc(l.url) + '" target="_blank" rel="noopener" title="' + esc(l.label || '') + '" aria-label="' + esc(l.label || l.url) + '" draggable="false">' + face + '</a>';
    }).join('');
  }
  // el canal de arriba: la foto (abre el canal en YouTube), el nombre, el canal con sus suscriptores (de
  // YouTube) y cuántos videos hay en la página, la descripción entera y las redes
  ICONS.mail = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4.5 7l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  function renderChannel(c) {
    var ch = (c && c.channel) || {}, handle = String(ch.handle || ''), yt = (M.youtube.self && channels[M.youtube.self]) || null;
    if (!yt) Object.keys(channels).forEach(function (k) { var sn = channels[k].snippet; if (handle && String(sn.customUrl || '').toLowerCase() === handle.toLowerCase()) yt = channels[k]; });
    var url = 'https://www.youtube.com/' + handle, st = yt && yt.statistics;
    $('#ch-n').textContent = ch.name || (yt && yt.snippet.title) || '';
    var tn = yt && yt.snippet.thumbnails, yav = tn ? ((tn.high || tn.medium || tn.default || {}).url || '') : '', img = $('#ch-img');
    img.onerror = function () { if (yav && img.src !== yav) img.src = yav; };   // si la foto de la planilla no carga (un link vencido o privado), va la del canal
    img.src = ch.photo || yav;
    $('#ch-av').href = url;
    // los suscriptores, de YouTube (salvo que el canal los esconda); los videos, todos los trabajos de la página
    var subs = st && !st.hiddenSubscriberCount && st.subscriberCount != null ? +st.subscriberCount : null, n = works.length;
    $('#ch-s').innerHTML = [handle ? '<b>' + esc(handle) + '</b>' : '', subs != null ? abbr(subs) + ' suscriptores' : '',
      n ? n.toLocaleString('es-AR') + (n === 1 ? ' video' : ' videos') : ''].filter(Boolean).join(' · ');
    $('#ch-d').textContent = ch.description || '';
    var links = (ch.links || []).filter(function (l) { return l && /^(https?:\/\/|mailto:)/.test(l.url || ''); });
    $('#ch-l').innerHTML = links.map(function (l) {
      var b = BRAND[l.id];
      var face = b ? '<i class="fa-brands fa-' + b + '" aria-hidden="true"></i><span class="tl-gen">' + (ICONS[l.id] || ICONS.link) + '</span>' : (ICONS[l.id] || ICONS.link);
      var out = /^mailto:/.test(l.url) ? '' : ' target="_blank" rel="noopener"';
      return '<a href="' + esc(l.url) + '"' + out + ' draggable="false">' + face + esc(l.label || l.url) + '</a>';
    }).join('');
    $('#ch-l').hidden = !links.length;
    $('#canal').hidden = !(ch.name || ch.description || yt);
  }
  loadConfig().then(function (c) { renderTop(c); renderChannel(c); $('#canal').classList.add('in'); });   // aparece suave
  var badge = document.querySelector('.proto');      // abajo a la izquierda: con datos de ejemplo, o qué no respondió
  if (badge) {
    if (M.warn) { badge.textContent = M.warn; badge.classList.add('warn'); }
    badge.hidden = LIVE && !M.warn;
  }
  // ---------------- el canal se vuelve la barra de arriba ----------------
  // Arriba de todo no hay barra: está el canal entero. Al bajar, el canal se va achicando con el scroll hasta ser
  // una barra como la de antes, pegada arriba de todo: la foto chica y el nombre a la izquierda, y a la derecha
  // los íconos de la barra (Discord, Instagram y YouTube). Lo demás del canal se apaga. Al subir, se agranda de
  // nuevo. En la barra, tocando el nombre vuelve arriba.
  (function () {
    var ch = $('#canal'), avw = $('#ch-avw'), nm = $('#ch-n'), G = null, raf = 0;
    var px = function (css) {                          // cuánto mide algo de CSS (la barra, la muesca del celular)
      var d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;height:' + css;
      document.body.appendChild(d); var h = d.offsetHeight; d.remove(); return h;
    };
    function measure() {
      if (ch.hidden || !ch.offsetHeight) { G = null; return; }
      var cs = getComputedStyle(ch), ns = getComputedStyle(nm), fs = parseFloat(ns.fontSize) || 36, lh = parseFloat(ns.lineHeight) || fs * 1.2;
      var bar = px('var(--barH)'), notch = px('env(safe-area-inset-top, 0px)'), D = Math.max(0, ch.offsetHeight - bar);
      var L = parseFloat(cs.paddingLeft) || 16, mid = D + notch + (bar - notch) / 2, AV = 32, k = 18 / fs;   // en la barra: la foto de 32 y el nombre de 18
      G = { D: D, ax: avw.offsetLeft, ay: avw.offsetTop, as: avw.offsetWidth || 1, nx: nm.offsetLeft, ny: nm.offsetTop, k: k,
        tax: L, tay: mid - AV / 2, ts: AV, tnx: L + AV + 12, tny: mid - lh * k / 2 };
      ch.style.setProperty('--chD', D + 'px'); ch.style.setProperty('--chPR', (parseFloat(cs.paddingRight) || 16) + 'px');
      paint();
    }
    function paint() {
      raf = 0;
      if (!G) return;
      var p = G.D ? Math.max(0, Math.min(1, PAGE.scrollTop / G.D)) : 0, q = function (a, b) { return a + (b - a) * p; };
      var set = function (k, v) { ch.style.setProperty(k, v); };
      set('--avx', q(0, G.tax - G.ax).toFixed(1) + 'px'); set('--avy', q(0, G.tay - G.ay).toFixed(1) + 'px'); set('--avs', q(1, G.ts / G.as).toFixed(4));
      set('--nx', q(0, G.tnx - G.nx).toFixed(1) + 'px'); set('--ny', q(0, G.tny - G.ny).toFixed(1) + 'px'); set('--ns', q(1, G.k).toFixed(4));
      set('--chR', Math.max(0, 1 - p * 2.2).toFixed(3));                       // lo demás se apaga primero
      set('--chB', Math.max(0, Math.min(1, (p - .55) / .45)).toFixed(3));       // el fondo de barra, al final
      set('--chI', Math.max(0, Math.min(1, (p - .7) / .3)).toFixed(3));         // los íconos, al final
      ch.classList.toggle('gone', p > .45); ch.classList.toggle('bar', p > .98);
    }
    PAGE.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener('resize', measure);
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); }).observe(ch);
    measure();
    nm.addEventListener('click', function () { if (ch.classList.contains('bar')) PAGE.scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); });
  })();
  // el link del título apunta adonde va: al pie o, abajo de todo, al principio
  var bar = $('#topbar'), titleHref = function () { $('#top-t').setAttribute('href', atEnd() ? '#top' : '#pie'); };
  PAGE.addEventListener('scroll', titleHref, { passive: true }); titleHref();
  // la rueda sobre la barra (y sobre la barra de scroll) también desliza los videos, como si fueran parte de la página
  var wheelToPage = function (e) {
    if (e.ctrlKey || !e.deltaY) return;
    var k = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? PAGE.clientHeight : 1;
    PAGE.style.scrollBehavior = 'auto'; PAGE.scrollTop += e.deltaY * k; PAGE.style.removeProperty('scroll-behavior');
  };
  bar.addEventListener('wheel', wheelToPage, { passive: true });

  // ---------------- la barra de scroll propia, adentro de las ventanas ----------------
  // La misma de la página, sobre el borde derecho de lo que se desliza adentro de una ventana: la lista del
  // reproductor (en el celular, todo lo de abajo del video) y la descripción de los verticales. get() dice cuál
  // es en cada momento; devuelve con qué avisarle que cambió lo de adentro.
  function ownBar(host, get) {
    var rail = document.createElement('div'), knob = document.createElement('div');
    rail.className = 'sbar in'; knob.className = 'sbar-k'; rail.setAttribute('aria-hidden', 'true'); rail.hidden = true;
    rail.appendChild(knob); host.appendChild(rail);
    var drag = null, raf = 0, nap = 0, sc = null;
    var max = function () { return sc ? sc.scrollHeight - sc.clientHeight : 0; };
    function size() {
      sc = host.open ? get() : null;
      var b = sc && sc.getBoundingClientRect(), m = max();
      rail.hidden = !b || !b.height || m <= 1;
      if (rail.hidden) return;
      var H = Math.max(0, b.height - 6), kh = Math.max(36, Math.round(H * sc.clientHeight / sc.scrollHeight));
      rail.style.top = (b.top + 3) + 'px'; rail.style.left = (b.right - 14) + 'px'; rail.style.height = H + 'px';
      knob.style.height = kh + 'px';
      knob.style.transform = 'translateY(' + ((H - kh) * sc.scrollTop / m).toFixed(1) + 'px)';
    }
    var later = function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; size(); }); };
    host.addEventListener('scroll', function (e) {     // también si se mueve lo de afuera (los verticales)
      later();
      if (e.target !== get()) return;
      rail.classList.add('on');
      clearTimeout(nap); nap = setTimeout(function () { rail.classList.remove('on'); }, 900);
    }, true);
    window.addEventListener('resize', later);
    knob.addEventListener('pointerdown', function (e) {                      // arrastrar la perilla
      if (e.button !== 0 || !sc) return;
      e.preventDefault(); e.stopPropagation();
      drag = { y: e.clientY, top: sc.scrollTop };
      try { knob.setPointerCapture(e.pointerId); } catch (x) {}
      rail.classList.add('drag');
    });
    knob.addEventListener('pointermove', function (e) {
      if (drag && sc) sc.scrollTop = drag.top + (e.clientY - drag.y) * max() / Math.max(1, rail.clientHeight - knob.offsetHeight);
    });
    var end = function () { if (!drag) return; drag = null; rail.classList.remove('drag'); };
    knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
    rail.addEventListener('pointerdown', function (e) {                      // tocar el riel: salta hasta ahí
      if (e.target !== rail || e.button !== 0 || !sc) return;
      e.stopPropagation();
      var r = rail.getBoundingClientRect(), kh = knob.offsetHeight;
      var f = Math.max(0, Math.min(1, (e.clientY - r.top - kh / 2) / Math.max(1, r.height - kh)));
      sc.scrollTo({ top: f * max(), behavior: still() ? 'auto' : 'smooth' });
    });
    rail.addEventListener('wheel', function (e) {
      if (sc && !e.ctrlKey && e.deltaY) sc.scrollTop += e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? sc.clientHeight : 1);
    }, { passive: true });
    return later;
  }

  // ---------------- la barra de scroll propia ----------------
  // La del sistema no se ve: esta arranca justo debajo de la barra de arriba y llega hasta abajo. La perilla
  // se arrastra; tocando el riel, la página salta hasta ahí. Mientras se desliza se ve un poco más.
  (function () {
    var rail = document.createElement('div'), knob = document.createElement('div');
    rail.className = 'sbar'; knob.className = 'sbar-k'; rail.setAttribute('aria-hidden', 'true');
    rail.appendChild(knob); document.body.appendChild(rail);
    var drag = null, raf = 0, nap = 0;
    var max = function () { return PAGE.scrollHeight - PAGE.clientHeight; };
    function size() {
      var H = rail.clientHeight, m = max(), kh = Math.max(36, Math.round(H * PAGE.clientHeight / Math.max(1, PAGE.scrollHeight)));
      rail.hidden = m <= 0;
      knob.style.height = kh + 'px';
      knob.style.transform = 'translateY(' + (m > 0 ? (H - kh) * PAGE.scrollTop / m : 0).toFixed(1) + 'px)';
    }
    var later = function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; size(); }); };
    PAGE.addEventListener('scroll', function () {
      later(); rail.classList.add('on');
      clearTimeout(nap); nap = setTimeout(function () { rail.classList.remove('on'); }, 900);
    }, { passive: true });
    window.addEventListener('resize', later);
    if (window.ResizeObserver) { var ro = new ResizeObserver(later); [].forEach.call(PAGE.children, function (c) { ro.observe(c); }); }
    knob.addEventListener('pointerdown', function (e) {                      // arrastrar la perilla
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      drag = { y: e.clientY, top: PAGE.scrollTop };
      try { knob.setPointerCapture(e.pointerId); } catch (x) {}
      rail.classList.add('drag'); PAGE.style.scrollBehavior = 'auto';
    });
    knob.addEventListener('pointermove', function (e) {
      if (!drag) return;
      PAGE.scrollTop = drag.top + (e.clientY - drag.y) * max() / Math.max(1, rail.clientHeight - knob.offsetHeight);
    });
    var end = function () { if (!drag) return; drag = null; rail.classList.remove('drag'); PAGE.style.removeProperty('scroll-behavior'); };
    knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
    rail.addEventListener('pointerdown', function (e) {                      // tocar el riel: salta hasta ahí
      if (e.target !== rail || e.button !== 0) return;
      var r = rail.getBoundingClientRect(), kh = knob.offsetHeight;
      var f = Math.max(0, Math.min(1, (e.clientY - r.top - kh / 2) / Math.max(1, r.height - kh)));
      PAGE.scrollTo({ top: f * max(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    rail.addEventListener('wheel', wheelToPage, { passive: true });
    size();
  })();
  try { PAGE.focus({ preventScroll: true }); } catch (e) {}   // así las flechas, la barra espaciadora y AvPág deslizan los videos desde el principio
  }
})();
