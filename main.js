/* GREENNATURA · interacciones
   Patrón IIFE, sin módulos. Cada init va envuelto en safe() para que un fallo no tumbe el resto. */
(function () {
  'use strict';

  var WA = '34634287740';
  var doc = document.documentElement;
  doc.classList.add('js');

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[greennatura] ' + name + ' falló:', e); }
  }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }
  function euros(n) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  }

  /* ---------- Reveal on view ---------- */
  function initReveal() {
    var els = $$('.reveal');
    // Escalonado dentro de cada grupo de hermanos
    els.forEach(function (el) {
      var sibs = $$(':scope > .reveal', el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
    });
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Red de seguridad: a los 6 s todo visible
    setTimeout(function () { els.forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
  }

  /* ---------- Nav: estado al hacer scroll + menú móvil ---------- */
  function initNav() {
    var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
    var lastY = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      var hide = y > 640 && y > lastY && !document.body.classList.contains('menu-open');
      nav.classList.toggle('is-hidden', hide);
      lastY = y; ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    function setMenu(open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

    // Enlace actual según la sección visible
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav__links a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    function fmt(el, v) {
      var s = Math.round(v).toString();
      if (el.dataset.sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, el.dataset.sep);
      return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseFloat(el.dataset.count), t0 = performance.now(), dur = 1600;
        io.unobserve(el);
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur);
          el.textContent = fmt(el, end * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Césped animado del hero ---------- */
  function initGrass() {
    var canvas = $('#grass');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var blades = [], W = 0, H = 0, dpr = 1, mouseX = -9999, running = true, raf = 0;
    var colors = ['#123F26', '#1D5233', '#2F6B3F', '#5E9A2E', '#7DB544', '#4C8A2A'];

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(W / (W < 700 ? 3.2 : 2.4));
      blades = [];
      for (var i = 0; i < n; i++) {
        var depth = Math.random();
        blades.push({
          x: Math.random() * W,
          h: H * (0.35 + depth * 0.6),
          w: 2 + depth * 3,
          c: colors[Math.floor(depth * colors.length * 0.999)],
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 0.8,
          bend: 0,
          depth: depth
        });
      }
      blades.sort(function (a, b) { return a.depth - b.depth; });
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var time = t / 1000;
      for (var i = 0; i < blades.length; i++) {
        var b = blades[i];
        var sway = Math.sin(time * b.speed + b.phase + b.x * 0.004) * (6 + b.depth * 8);
        var dx = b.x - mouseX;
        var push = Math.abs(dx) < 120 ? (1 - Math.abs(dx) / 120) * (dx > 0 ? 1 : -1) * 38 : 0;
        b.bend += (push - b.bend) * 0.08;
        var tipX = b.x + sway + b.bend;
        var tipY = H - b.h;
        ctx.beginPath();
        ctx.moveTo(b.x - b.w, H);
        ctx.quadraticCurveTo(b.x - b.w * 0.4, H - b.h * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(b.x + b.w * 0.4, H - b.h * 0.5, b.x + b.w, H);
        ctx.closePath();
        ctx.fillStyle = b.c;
        ctx.fill();
      }
      // Base sólida que enlaza con la cinta verde de abajo
      ctx.fillStyle = '#123F26';
      ctx.fillRect(0, H - 6, W, 6);
      if (running) raf = requestAnimationFrame(draw);
    }

    build();
    raf = requestAnimationFrame(draw);

    var rT;
    window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(build, 150); });
    // El césped se aparta cuando el puntero pasa cerca
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouseX = (e.clientY > r.top - 120 && e.clientY < r.bottom) ? e.clientX - r.left : -9999;
    }, { passive: true });

    // Pausa cuando no se ve, para no gastar batería
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; raf = requestAnimationFrame(draw); }
        if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
  }

  /* ---------- Lema: palabra a palabra con el scroll ---------- */
  function initTagline() {
    var el = $('#tagline');
    if (!el || el.children.length > 0) return;
    var leaf = { 'calidad,': 1, 'confianza.': 1 };
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) {
      return '<span class="w' + (leaf[w] ? ' is-leaf' : '') + '" aria-hidden="true">' + w + '</span>';
    }).join(' ');
    var spans = $$('.w', el), ticking = false;
    function update() {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      // Empieza cuando el bloque entra por el 85 % y termina al llegar al 35 %
      var p = (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.5);
      p = Math.max(0, Math.min(1, p));
      var on = Math.round(p * spans.length);
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-on', i < on);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Filtros del catálogo ---------- */
  function initFilters() {
    var chips = $$('.chip'), models = $$('.model'), empty = $('#models-empty');
    function apply(f) {
      var shown = 0;
      models.forEach(function (m) {
        var ok = f === 'all' || (' ' + m.dataset.tags + ' ').indexOf(' ' + f + ' ') > -1;
        m.classList.toggle('is-filtered', !ok);
        if (ok) { shown++; m.classList.add('is-in'); }
      });
      chips.forEach(function (c) {
        var on = c.dataset.filter === f;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      empty.hidden = shown > 0;
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.filter); }); });
    $$('[data-filter]', empty).forEach(function (b) { b.addEventListener('click', function () { apply('all'); }); });
  }

  /* ---------- Botones "Lo quiero" con mensaje prellenado ---------- */
  function initModelLinks() {
    $$('[data-wa-model]').forEach(function (a) {
      a.href = waLink('Hola GREENNATURA, me interesa el modelo ' + a.dataset.waModel + '. ¿Tenéis stock? Necesito unos __ m² para __.');
    });
  }

  /* ---------- Calculadora ---------- */
  function initCalc() {
    var form = $('#calc');
    if (!form) return;
    var out2 = $('#calc-m2'), outT = $('#calc-total'), wa = $('#calc-wa'), err = $('#calc-error');
    function calc() {
      var l = parseFloat(form.largo.value.replace(',', '.'));
      var a = parseFloat(form.ancho.value.replace(',', '.'));
      var price = parseFloat(form.modelo.value);
      var label = form.modelo.options[form.modelo.selectedIndex].text;
      if (!(l > 0) || !(a > 0)) {
        err.textContent = 'Introduce el largo y el ancho en metros, por ejemplo 8 y 6.';
        err.hidden = false;
        out2.textContent = '·'; outT.textContent = '·';
        wa.setAttribute('aria-disabled', 'true');
        return;
      }
      err.hidden = true;
      wa.removeAttribute('aria-disabled');
      var base = l * a;
      var m2 = form.margen.checked ? base * 1.05 : base;
      m2 = Math.ceil(m2 * 10) / 10;
      var total = Math.round(m2 * price);
      out2.textContent = m2.toLocaleString('es-ES') + ' m²';
      outT.textContent = euros(total);
      wa.href = waLink(
        'Hola GREENNATURA, he usado la calculadora de la web:\n' +
        '· Medidas: ' + l + ' x ' + a + ' m (' + m2.toLocaleString('es-ES') + ' m²' + (form.margen.checked ? ' con margen' : '') + ')\n' +
        '· Modelo: ' + label + '\n' +
        '· Estimación: ' + euros(total) + '\n' +
        '¿Me confirmáis precio final con portes? Gracias.'
      );
    }
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    wa.addEventListener('click', function (e) { if (wa.getAttribute('aria-disabled')) e.preventDefault(); });
    calc();
  }

  /* ---------- Formulario de contacto → WhatsApp ---------- */
  function initContact() {
    var form = $('#contact-form');
    if (!form) return;
    function check(input) {
      var ok = input.value.trim() !== '' && (input.type !== 'number' || parseFloat(input.value) > 0);
      input.closest('.field').classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    $$('[required]', form).forEach(function (i) {
      i.addEventListener('blur', function () { if (i.value) check(i); });
      i.addEventListener('input', function () { if (i.closest('.field').classList.contains('is-invalid')) check(i); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var req = $$('[required]', form), firstBad = null;
      req.forEach(function (i) { if (!check(i) && !firstBad) firstBad = i; });
      if (firstBad) { firstBad.focus(); return; }
      var d = form.elements;
      var msg =
        'Hola GREENNATURA, soy ' + d.nombre.value.trim() + '.\n' +
        '· Localidad: ' + d.localidad.value.trim() + '\n' +
        '· Metros aprox.: ' + d.metros.value + ' m²\n' +
        '· Uso: ' + d.uso.value + '\n' +
        '· Necesito: ' + form.querySelector('[name=servicio]:checked').value +
        (d.mensaje.value.trim() ? '\n· Comentarios: ' + d.mensaje.value.trim() : '') +
        '\n¿Me pasáis presupuesto? Gracias.';
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  function initYear() { var y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

  /* ==========================================================
     Escenas con scroll tipo Apple (GSAP + ScrollTrigger, gratis y en local)
     Sin GSAP no se añade .motion y la página queda estática y completa.
     ========================================================== */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* Instalación capa a capa: diorama dibujado en canvas, el scroll mueve el tiempo */
  function buildScene(canvas, copyEl) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, P = 0, running = true, raf = 0, g = {};
    var C = {
      soil: '#7A5534', soilSide: '#5E3F25', soilTop: '#8E6A45',
      gravel: '#B9AD98', gravelSide: '#9C907B', gravelTop: '#D3C8B2',
      mesh: '#2A2A26', meshTop: '#3B3B35',
      backing: '#1D5233', backingTop: '#2F6B3F',
      blades: ['#1D5233', '#2F6B3F', '#4C8A2A', '#5E9A2E', '#7DB544'],
      ink: '#123F26', muted: '#56675B', sand: '#E8DCC0', gold: '#C9A44C', shadow: 'rgba(18,63,38,.10)'
    };
    // Semillas normalizadas (u a lo largo, v en profundidad): no dependen del tamaño
    function rnd(n) { var a = []; for (var i = 0; i < n; i++) a.push(Math.random()); return a; }
    var blades = [], ROWS = 9;
    for (var r = 0; r < ROWS; r++) {
      for (var k = 0; k < 110; k++) {
        blades.push({ u: Math.random(), v: (r + Math.random() * 0.9) / ROWS, h: 0.65 + Math.random() * 0.35,
          c: Math.floor(Math.random() * 5), ph: Math.random() * 6.28, row: r, lean: (Math.random() - 0.5) * 0.5 });
      }
    }
    blades.sort(function (a, b) { return b.row - a.row || a.c - b.c; });
    var weeds = [], stones = [], mounds = [], sand = [];
    for (var i = 0; i < 16; i++) weeds.push({ u: 0.05 + Math.random() * 0.9, v: Math.random(), s: 0.6 + Math.random() * 0.6 });
    for (i = 0; i < 10; i++) stones.push({ u: Math.random(), v: Math.random(), s: 0.5 + Math.random() * 0.8 });
    for (i = 0; i < 7; i++) mounds.push({ u: 0.08 + Math.random() * 0.84, v: 0.2 + Math.random() * 0.6, s: 0.6 + Math.random() * 0.6 });
    for (i = 0; i < 140; i++) sand.push({ u: Math.random(), v: Math.random(), d: Math.random() });

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var mobile = W < 900;
      var copyRight = 0, copyBottom = 0;
      if (copyEl) {
        var cr = copyEl.getBoundingClientRect(), kr = canvas.getBoundingClientRect();
        var last = copyEl.querySelector('.build__steps');
        copyRight = (last ? last.getBoundingClientRect().right : cr.right) - kr.left;
        copyBottom = (last ? last.getBoundingClientRect().bottom : cr.bottom) - kr.top;
      }
      if (mobile) {
        g.sw = W * 0.74; g.sx = (W - g.sw * 1.22) / 2;
      } else {
        g.sx = Math.max(W * 0.44, copyRight + 64);
        g.sw = Math.min((W - 72 - g.sx) / 1.22, H * 0.95);
      }
      g.dx = g.sw * 0.22; g.dy = -g.sw * 0.16; g.T = g.sw * 0.28;
      g.gMax = g.T * 0.3; g.hb = g.T * 0.24; g.rMax = g.T * 0.2;
      // Centro vertical: en móvil, por debajo del texto
      var blockH = -g.dy + g.T + 64;
      var mid = mobile ? Math.max(copyBottom + 40 + (-g.dy) + g.hb, (copyBottom + H - 40) / 2 - blockH / 2 + (-g.dy) + g.hb) : H / 2 - blockH / 2 + (-g.dy) + 16;
      g.top = mid; g.mobile = mobile;
    }
    function X(u, v, y) { return [g.sx + u * g.sw + v * g.dx, y + v * g.dy]; }
    function poly(pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    function topFace(u0, u1, y, fill) { poly([X(u0, 0, y), X(u1, 0, y), X(u1, 1, y), X(u0, 1, y)], fill); }

    function draw(now) {
      var t = now / 1000, p = P;
      var e0 = easeInOut(seg(p, 0.02, 0.18)), e1 = easeInOut(seg(p, 0.22, 0.38)), e2 = easeInOut(seg(p, 0.42, 0.58)),
          e3 = easeInOut(seg(p, 0.62, 0.8)), e4 = easeOut(seg(p, 0.82, 0.98));
      ctx.clearRect(0, 0, W, H);
      var top = g.top, T = g.T, sw = g.sw, sx = g.sx, dx = g.dx, dy = g.dy;
      var bottom = top + T;
      var surf = top + g.gMax * (e0 - e1);           // nivel actual del terreno
      var gravelTop = top + g.gMax * (1 - e1);

      // Sombra de apoyo
      ctx.fillStyle = C.shadow;
      ctx.beginPath(); ctx.ellipse(sx + sw / 2 + dx / 2, bottom + dy / 2 + 18, sw * 0.62, T * 0.18, 0, 0, 6.283); ctx.fill();

      // Cara lateral derecha
      poly([[sx + sw, surf], [sx + sw + dx, surf + dy], [sx + sw + dx, bottom + dy], [sx + sw, bottom]], C.soilSide);
      if (e1 > 0) poly([[sx + sw, gravelTop], [sx + sw + dx, gravelTop + dy], [sx + sw + dx, top + g.gMax + dy], [sx + sw, top + g.gMax]], C.gravelSide);
      // Cara frontal
      ctx.fillStyle = C.soil; ctx.fillRect(sx, surf, sw, bottom - surf);
      // Vetas de la tierra
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
      for (var s = 1; s < 4; s++) { var yy = top + g.gMax + (T - g.gMax) * s / 4; ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + sw, yy); ctx.stroke(); }
      if (e1 > 0) {
        ctx.fillStyle = C.gravel; ctx.fillRect(sx, gravelTop, sw, top + g.gMax - gravelTop);
        ctx.fillStyle = 'rgba(0,0,0,.12)';
        for (var q = 0; q < 70; q++) {
          var gu = (q * 0.6180339) % 1, gv = (q * 0.4142) % 1;
          var gy = gravelTop + (top + g.gMax - gravelTop) * gv;
          ctx.beginPath(); ctx.arc(sx + gu * sw, gy, 1.6, 0, 6.283); ctx.fill();
        }
      }
      // Cara superior (material de arriba)
      topFace(0, 1, surf, e1 > 0.02 ? C.gravelTop : C.soilTop);

      // Fase 1: montículos, piedras y malas hierbas que desaparecen
      if (e0 < 1) {
        var k0 = 1 - e0;
        mounds.forEach(function (m) { var c = X(m.u, m.v, surf); ctx.fillStyle = C.soil; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 2 * k0, sw * 0.07 * m.s * k0, sw * 0.025 * m.s * k0 + 0.01, 0, 0, 6.283); ctx.fill(); });
        stones.forEach(function (st) { var c = X(st.u, st.v, surf); ctx.globalAlpha = k0; ctx.fillStyle = '#9A9488'; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 2, 5 * st.s, 3 * st.s, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; });
        ctx.strokeStyle = '#3F6B2A'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        weeds.forEach(function (w) {
          var c = X(w.u, w.v, surf), h = g.hb * 0.9 * w.s * k0;
          for (var b = -1; b <= 1; b++) { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.quadraticCurveTo(c[0] + b * 4, c[1] - h * 0.6, c[0] + b * 8 + Math.sin(t * 2 + w.u * 9) * 2, c[1] - h); ctx.stroke(); }
        });
        // Regla de nivelar que barre el terreno
        if (e0 > 0 && e0 < 1) {
          var a = X(e0, -0.05, surf - 6), b2 = X(e0, 1.05, surf - 6);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
          ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo((a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2); ctx.lineTo((a[0] + b2[0]) / 2 - 18, (a[1] + b2[1]) / 2 - T * 0.5); ctx.stroke();
        }
      }
      // Fase 2: compactadora
      if (e1 > 0 && e1 < 1) {
        var cp = X(e1, 0.5, surf), bw = sw * 0.07;
        ctx.fillStyle = C.gold; ctx.fillRect(cp[0] - bw / 2, cp[1] - bw * 0.6 + Math.sin(t * 40) * 1.2, bw, bw * 0.6);
        ctx.fillStyle = C.ink; ctx.fillRect(cp[0] - bw / 2, cp[1] - 4, bw, 4);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cp[0], cp[1] - bw * 0.6); ctx.lineTo(cp[0] - bw * 0.6, cp[1] - bw * 1.8); ctx.stroke();
      }
      // Fase 3: malla antihierbas (se despliega de izquierda a derecha)
      if (e2 > 0) {
        topFace(0, e2, top - 1, C.meshTop);
        ctx.fillStyle = C.mesh; ctx.fillRect(sx, top - 1, sw * e2, 3);
        if (e2 > 0.99) poly([[sx + sw, top - 1], [sx + sw + dx, top - 1 + dy], [sx + sw + dx, top + 2 + dy], [sx + sw, top + 2]], C.mesh);
      }
      // Fase 4: base del césped + fibras tumbadas + rollo
      var turfY = top - 4;
      if (e3 > 0) {
        topFace(0, e3, turfY, C.backingTop);
        ctx.fillStyle = C.backing; ctx.fillRect(sx, turfY, sw * e3, 4);
        if (e3 > 0.99) poly([[sx + sw, turfY], [sx + sw + dx, turfY + dy], [sx + sw + dx, turfY + 4 + dy], [sx + sw, turfY + 4]], C.backing);
      }
      // Fibras
      if (e3 > 0) {
        var grow = 0.3 + 0.7 * e4;
        ctx.lineCap = 'round'; ctx.lineWidth = g.mobile ? 1.6 : 2.2;
        var lastKey = '';
        ctx.beginPath();
        for (var n = 0; n < blades.length; n++) {
          var bl = blades[n];
          if (bl.u > e3) continue;
          var key = bl.row + ':' + bl.c;
          if (key !== lastKey) { if (lastKey) ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = C.blades[bl.c]; lastKey = key; }
          var base = X(bl.u, bl.v, turfY);
          var h = g.hb * bl.h * grow;
          var lay = (1 - e4) * g.hb * 0.9;                       // fibra tumbada antes del cepillado
          var sway = Math.sin(t * 1.4 + bl.ph + bl.u * 6) * 2.5 * e4;
          var tipX = base[0] + lay + bl.lean * h + sway, tipY = base[1] - h;
          ctx.moveTo(base[0], base[1]);
          ctx.quadraticCurveTo(base[0] + (tipX - base[0]) * 0.3, base[1] - h * 0.6, tipX, tipY);
        }
        if (lastKey) ctx.stroke();
      }
      if (e3 > 0 && e3 < 1) {
        // Rollo que se desenrolla: cilindro tumbado a lo largo de la profundidad
        var rr = g.rMax * (1 - 0.7 * e3);
        var len = Math.hypot(dx, dy), ax = dx / len, ay = dy / len, nx = -ay, ny = ax;
        var c0 = X(e3, 0, turfY), c1 = X(e3, 1, turfY);
        c0 = [c0[0] + rr * 0.7, c0[1] - rr]; c1 = [c1[0] + rr * 0.7, c1[1] - rr];
        ctx.fillStyle = C.backing; ctx.beginPath(); ctx.arc(c1[0], c1[1], rr, 0, 6.283); ctx.fill();
        poly([[c0[0] + nx * rr, c0[1] + ny * rr], [c1[0] + nx * rr, c1[1] + ny * rr], [c1[0] - nx * rr, c1[1] - ny * rr], [c0[0] - nx * rr, c0[1] - ny * rr]], '#3F7F36');
        ctx.fillStyle = '#4C8A2A'; ctx.beginPath(); ctx.arc(c0[0], c0[1], rr, 0, 6.283); ctx.fill();
        ctx.strokeStyle = C.backing; ctx.lineWidth = 1.5; ctx.beginPath();
        for (var sp = 0; sp < 26; sp++) { var ang = sp * 0.6 - t * 0, rad = rr * (1 - sp / 28); ctx.lineTo(c0[0] + Math.cos(ang) * rad, c0[1] + Math.sin(ang) * rad); }
        ctx.stroke();
      }
      // Fase 5: arena de sílice cayendo y sol
      if (e4 > 0) {
        var fall = seg(p, 0.82, 0.93);
        if (fall > 0 && fall < 1) {
          ctx.fillStyle = C.sand;
          sand.forEach(function (d) {
            var yy = (fall * 1.6 - d.d * 0.6); if (yy < 0 || yy > 1) return;
            var c = X(d.u, d.v, turfY - g.hb * 2.2 + yy * g.hb * 2.2);
            ctx.fillRect(c[0], c[1], 2, 2);
          });
        }
        var sun = X(0.72, 1, top - T * 1.05);
        ctx.globalAlpha = e4;
        ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(sun[0], sun[1], T * 0.12, 0, 6.283); ctx.fill();
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
        for (var ry = 0; ry < 8; ry++) { var an = ry * 0.785 + t * 0.3; ctx.beginPath(); ctx.moveTo(sun[0] + Math.cos(an) * T * 0.17, sun[1] + Math.sin(an) * T * 0.17); ctx.lineTo(sun[0] + Math.cos(an) * T * 0.23, sun[1] + Math.sin(an) * T * 0.23); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }

      // Rótulos tipo despiece, bajo el bloque
      var short = g.mobile || sw < 560;
      var labels = short
        ? [['Zahorra', 0.12, gravelTop + 6, e1], ['Malla', 0.38, top + 1, e2], ['Césped', 0.64, turfY + 2, e3], ['Sílice', 0.88, turfY + 2, e4]]
        : [['Base de zahorra', 0.1, gravelTop + 8, e1], ['Malla antihierbas', 0.37, top + 1, e2], ['Césped 40/50 mm', 0.63, turfY + 2, e3], ['Arena de sílice', 0.88, turfY + 2, e4]];
      ctx.font = '600 ' + (short ? 12 : 14) + 'px Manrope, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      labels.forEach(function (L) {
        var a2 = seg(L[3], 0.35, 0.8); if (a2 <= 0) return;
        var x = sx + sw * L[1], y0 = L[2], y1 = bottom + 24;
        ctx.globalAlpha = a2;
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y0, 3, 0, 6.283); ctx.fillStyle = C.ink; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + (y1 - y0) * a2); ctx.stroke();
        ctx.fillStyle = C.ink; ctx.fillText(L[0], x, y1 + 6);
        ctx.globalAlpha = 1;
      });

      if (running) raf = requestAnimationFrame(draw);
    }

    layout();
    raf = requestAnimationFrame(draw);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; raf = requestAnimationFrame(draw); }
        if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
    return { set: function (p) { P = p; }, layout: layout };
  }

  function initMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var buildCanvas = $('#build-canvas');
    if (!gsap || !ST) {
      // Sin GSAP: la escena de instalación se muestra terminada y estática
      if (buildCanvas) buildScene(buildCanvas, null).set(1);
      return;
    }
    gsap.registerPlugin(ST);
    doc.classList.add('motion');

    // Escena = sección alta con un bloque sticky; el scroll da un progreso 0..1 suavizado
    function scene(el, render) {
      var o = { p: 0 };
      gsap.to(o, { p: 1, ease: 'none', onUpdate: function () { render(o.p); },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      render(0);
    }

    /* 1 · Hero: la foto se abre de tarjeta a pantalla completa */
    var hero = $('.hero'), copy = $('.hero__copy'), stage = $('#hero-stage'), sticky = $('.hero__sticky');
    var hg = {};
    function measureHero() {
      var W = sticky.clientWidth, H = sticky.clientHeight;
      hg.t = Math.min(copy.offsetTop + copy.offsetHeight + 40, H * 0.72);
      hg.x = Math.max(16, (W - Math.min(W - 32, 1100)) / 2);
      hg.b = 24;
    }
    measureHero();
    ST.addEventListener('refreshInit', measureHero);
    scene(hero, function (p) {
      var e = easeInOut(seg(p, 0, 0.6)), s = stage.style;
      s.setProperty('--t', (hg.t * (1 - e)).toFixed(1) + 'px');
      s.setProperty('--x', (hg.x * (1 - e)).toFixed(1) + 'px');
      s.setProperty('--b', (hg.b * (1 - e)).toFixed(1) + 'px');
      s.setProperty('--r', (32 * (1 - e)).toFixed(1) + 'px');
      s.setProperty('--zoom', (1.2 - 0.2 * e).toFixed(4));
      s.setProperty('--shade', (0.05 + 0.4 * seg(p, 0.4, 0.75)).toFixed(3));
      s.setProperty('--over', easeOut(seg(p, 0.55, 0.85)).toFixed(3));
      var c = seg(p, 0, 0.35);
      copy.style.setProperty('--copy', (1 - c).toFixed(3));
      copy.style.setProperty('--copy-y', (-c * 96).toFixed(1) + 'px');
      copy.style.visibility = c > 0.99 ? 'hidden' : '';
    });

    /* 2 · Instalación capa a capa */
    var build = $('#instalacion');
    if (build && buildCanvas) {
      var steps = $$('.build__step'), rails = $$('.build__rail span');
      var B = buildScene(buildCanvas, $('.build__copy'));
      ST.addEventListener('refresh', function () { B.layout(); });
      var cur = -1;
      scene(build, function (p) {
        B.set(p);
        var i = Math.min(4, Math.floor(p * 5));
        rails.forEach(function (r, k) { r.style.setProperty('--f', seg(p, k / 5, (k + 1) / 5).toFixed(3)); });
        if (i !== cur) { cur = i; steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); }); }
      });
    }

    /* 3 · El 7 € se tacha y entra el 4 € */
    var drop = $('.drop');
    if (drop) {
      var oldEl = $('.drop__old');
      scene(drop, function (p) {
        var st = easeOut(seg(p, 0.08, 0.32)), o = easeInOut(seg(p, 0.36, 0.58)), n = easeOut(seg(p, 0.44, 0.68)), c = easeOut(seg(p, 0.66, 0.86));
        var d = drop.style, hOld = oldEl.offsetHeight;
        d.setProperty('--strike', st.toFixed(3));
        d.setProperty('--old-o', (1 - 0.7 * o).toFixed(3));
        d.setProperty('--old-y', (-o * hOld * 0.95).toFixed(1) + 'px');
        d.setProperty('--old-s', (1 - 0.45 * o).toFixed(3));
        d.setProperty('--new-o', n.toFixed(3));
        d.setProperty('--new-y', ((1 - n) * 80).toFixed(1) + 'px');
        d.setProperty('--new-s', (0.8 + 0.2 * n).toFixed(3));
        d.setProperty('--cap-o', c.toFixed(3));
        d.setProperty('--cap-y', ((1 - c) * 32).toFixed(1) + 'px');
      });
    }

    /* 4 · Línea de progreso del proceso */
    var line = $('#steps-line');
    if (line) {
      line.style.setProperty('--s', 0);
      ST.create({ trigger: '.steps', start: 'top 85%', end: 'bottom 55%', scrub: 0.6,
        onUpdate: function (self) { line.style.setProperty('--s', self.progress.toFixed(3)); } });
    }

    /* 5 · Parallax en las fotos de obra */
    $$('.project img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* 6 · Vídeos en carrusel horizontal movido por el scroll (solo escritorio) */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var wrap = $('#hscroll'), track = $('#reels');
      if (!wrap || !track) return;
      function dist() { return Math.max(0, track.scrollWidth - track.clientWidth); }
      function size() { wrap.style.height = (dist() + window.innerHeight) + 'px'; }
      size();
      ST.addEventListener('refreshInit', size);
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
      return function () { wrap.style.height = ''; ST.removeEventListener('refreshInit', size); };
    });

    // Las imágenes cambian alturas: recalcular cuando todo ha cargado
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  function boot() {
    safe(initMotion, 'motion');
    safe(initReveal, 'reveal');
    safe(initNav, 'nav');
    safe(initCounters, 'counters');
    safe(initGrass, 'grass');
    safe(initTagline, 'tagline');
    safe(initFilters, 'filters');
    safe(initModelLinks, 'modelLinks');
    safe(initCalc, 'calc');
    safe(initContact, 'contact');
    safe(initYear, 'year');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
