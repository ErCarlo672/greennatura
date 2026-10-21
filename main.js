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
    var hero = $('.hero');
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
    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
    });
    hero.addEventListener('pointerleave', function () { mouseX = -9999; });

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

  /* ---------- Antes y después: deslizador ---------- */
  function initCompare() {
    $$('.ba__compare').forEach(function (box) {
      var range = box.querySelector('.ba__range');
      if (!range) return;
      function update() { box.style.setProperty('--pos', range.value + '%'); }
      range.addEventListener('input', update);
      update();
    });
  }

  function initYear() { var y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

  function boot() {
    safe(initReveal, 'reveal');
    safe(initNav, 'nav');
    safe(initCounters, 'counters');
    safe(initGrass, 'grass');
    safe(initTagline, 'tagline');
    safe(initFilters, 'filters');
    safe(initModelLinks, 'modelLinks');
    safe(initCalc, 'calc');
    safe(initContact, 'contact');
    safe(initCompare, 'compare');
    safe(initYear, 'year');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
