/* ==========================================================================
   Yesenia Vargas Hair — main.js (maqueta)
   Vanilla JS, sin dependencias. En WordPress, la lógica de variaciones,
   carrito y checkout la aporta WooCommerce; aquí solo se simula para revisar
   estados visuales. Ver docs/guia-implementacion.md.
   ========================================================================== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var lang = (root.lang || 'es').slice(0, 2);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var T = {
    es: {
      needVariation: 'Elige un color antes de añadir al carrito.',
      added: 'se ha añadido a tu carrito.', viewCart: 'Ver carrito',
      formErrors: 'Revisa los campos marcados:', required: 'Este campo es obligatorio.',
      email: 'Introduce un email válido.', sent: 'Esta es una versión de prueba: el mensaje no se ha enviado.',
      chosen: 'Elegido:', none: 'Ninguno', removed: 'Producto eliminado.',
      menuOpen: 'Abrir menú', menuClose: 'Cerrar menú', markersOn: 'Marcadores: ON', markersOff: 'Marcadores: OFF',
      showFilters: 'Filtros', hideFilters: 'Ocultar filtros', results: function (n) { return n === 1 ? 'Mostrando 1 resultado' : 'Mostrando los ' + n + ' resultados'; }
    },
    en: {
      needVariation: 'Choose a color before adding to cart.',
      added: 'has been added to your cart.', viewCart: 'View cart',
      formErrors: 'Please check the highlighted fields:', required: 'This field is required.',
      email: 'Enter a valid email address.', sent: 'This is a preview version: your message has not been sent.',
      chosen: 'Selected:', none: 'None', removed: 'Item removed.',
      menuOpen: 'Open menu', menuClose: 'Close menu', markersOn: 'Markers: ON', markersOff: 'Markers: OFF',
      showFilters: 'Filters', hideFilters: 'Hide filters', results: function (n) { return n === 1 ? 'Showing the single result' : 'Showing all ' + n + ' results'; }
    }
  }[lang] || {};

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function money(n) { return '$' + n.toFixed(2); }

  /* --- Marcadores de maqueta ------------------------------------------ */
  var mBtn = $('[data-toggle-markers]');
  function setMarkers(on) {
    d.body.classList.toggle('show-markers', on);
    if (mBtn) { mBtn.textContent = on ? T.markersOn : T.markersOff; mBtn.setAttribute('aria-pressed', on); }
  }
  setMarkers(!!mBtn && store('yv-markers') !== 'off'); // sin barra de maqueta = marcadores ocultos
  if (mBtn) mBtn.addEventListener('click', function () {
    var on = !d.body.classList.contains('show-markers'); setMarkers(on); store('yv-markers', on ? 'on' : 'off');
  });

  /* --- Menú móvil ------------------------------------------------------- */
  var drawer = $('#nav-drawer'), openBtn = $('.menu-toggle'), lastFocus;
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open'); d.body.classList.remove('drawer-open');
    openBtn.setAttribute('aria-expanded', 'false'); if (lastFocus) lastFocus.focus();
  }
  if (drawer && openBtn) {
    openBtn.addEventListener('click', function () {
      lastFocus = d.activeElement; drawer.classList.add('is-open'); d.body.classList.add('drawer-open');
      openBtn.setAttribute('aria-expanded', 'true'); var f = $('.nav-drawer__close', drawer); if (f) f.focus();
    });
    $$('[data-close-drawer]', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
    d.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Tab') { // trampa de foco
        var f = $$('a,button', $('.nav-drawer__panel', drawer)); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* --- Aparición al hacer scroll --------------------------------------- */
  var rev = $$('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('is-in'); });

  /* --- Contador del carrito (simulado) --------------------------------- */
  function cartCount(n) {
    $$('.cart-count').forEach(function (c) { c.textContent = n; c.setAttribute('data-count', n); });
  }
  var savedCount = parseInt(store('yv-cart') || '1', 10); cartCount(isNaN(savedCount) ? 1 : savedCount);

  /* --- Selector de colores de la home ----------------------------------- */
  $$('[data-color-picker]').forEach(function (picker) {
    var btns = $$('[data-color]', picker), pv = $('[data-preview]', picker);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var c = JSON.parse(b.getAttribute('data-color'));
        $('[data-pv-img]', pv).src = c.img; $('[data-pv-img]', pv).alt = c.alt;
        $('[data-pv-name]', pv).textContent = c.name;
        $$('[data-pv-link]', pv).forEach(function (a) { a.href = a.getAttribute('data-base') + '?color=' + c.slug; });
      });
    });
  });

  /* --- Variaciones (ficha de producto) ---------------------------------- */
  $$('form.variations_form').forEach(function (form) {
    var radios = $$('input[name="yv_color"]', form), select = $('select[name="attribute_pa_color"]', form);
    var btn = $('.single_add_to_cart_button', form), msg = $('.variation-needed', form), out = $('[data-selected-value]', form);
    var reset = $('.reset_variations', form), sku = $('[data-sku]'), mbarName = $('[data-mbar-variation]');
    var galleryLabel = $('[data-gallery-label]'), gallerySwatch = $('[data-gallery-swatch]');
    function update() {
      var r = radios.filter(function (x) { return x.checked; })[0];
      if (!r) {
        select.value = ''; btn.classList.add('disabled', 'wc-variation-selection-needed'); btn.setAttribute('aria-disabled', 'true');
        out.textContent = T.none; if (reset) reset.hidden = true; if (sku) sku.textContent = sku.getAttribute('data-base') + '-…';
        if (galleryLabel) galleryLabel.textContent = galleryLabel.getAttribute('data-default');
        if (gallerySwatch) gallerySwatch.hidden = true;
        return;
      }
      select.value = r.value; btn.classList.remove('disabled', 'wc-variation-selection-needed'); btn.removeAttribute('aria-disabled');
      msg.classList.remove('is-visible'); out.textContent = r.getAttribute('data-label'); if (reset) reset.hidden = false;
      if (sku) sku.textContent = sku.getAttribute('data-base') + '-' + r.getAttribute('data-code') + '-20';
      if (mbarName) mbarName.textContent = r.getAttribute('data-label');
      if (galleryLabel) galleryLabel.textContent = r.getAttribute('data-label');
      if (gallerySwatch) { gallerySwatch.src = r.getAttribute('data-swatch'); gallerySwatch.hidden = false; }
    }
    radios.forEach(function (r) { r.addEventListener('change', update); });
    if (reset) reset.addEventListener('click', function (e) { e.preventDefault(); radios.forEach(function (r) { r.checked = false; }); update(); radios[0].focus(); });
    var pre = new URLSearchParams(location.search).get('color');
    if (pre) radios.forEach(function (r) { if (r.value === pre) r.checked = true; });
    update();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.classList.contains('disabled')) { msg.textContent = T.needVariation; msg.classList.add('is-visible'); radios[0].focus(); return; }
      var q = parseInt($('.qty', form).value, 10) || 1, n = (parseInt(store('yv-cart') || '1', 10) || 0) + q;
      store('yv-cart', n); cartCount(n);
      var notice = $('.woocommerce-notices-wrapper');
      if (notice) {
        notice.innerHTML = '<div class="woocommerce-message" role="alert">“' + form.getAttribute('data-product') + ' — ' + out.textContent + '” ' + T.added +
          ' <a href="' + form.getAttribute('data-cart') + '" class="button wc-forward">' + T.viewCart + '</a></div>';
        notice.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
    // Barra fija móvil
    var mbar = $('.mbar');
    if (mbar && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { mbar.classList.toggle('is-visible', !es[0].isIntersecting && es[0].boundingClientRect.top < 0); }).observe(btn);
      var mbtn = $('[data-mbar-add]'); if (mbtn) mbtn.addEventListener('click', function () { btn.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); btn.focus(); });
    }
  });

  /* --- Cantidad +/- ------------------------------------------------------ */
  $$('.quantity').forEach(function (q) {
    var input = $('.qty', q);
    $$('.qty-btn', q).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = (parseInt(input.value, 10) || 1) + (b.getAttribute('data-step') === 'up' ? 1 : -1);
        input.value = Math.max(parseInt(input.min || '1', 10), Math.min(v, parseInt(input.max || '99', 10)));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  /* --- Galería de producto (miniaturas) ---------------------------------- */
  $$('.flex-control-thumbs').forEach(function (list) {
    var bs = $$('button', list);
    bs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        bs.forEach(function (x) { x.setAttribute('aria-current', x === b); });
        var lbl = $('[data-gallery-view]'); if (lbl) lbl.textContent = b.getAttribute('data-view');
      });
    });
  });

  /* --- Pestañas ARIA ----------------------------------------------------- */
  $$('[role="tablist"]').forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        x.parentNode.classList.toggle('active', on); d.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0]; if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* --- Lightbox (prensa, galería) ---------------------------------------- */
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('img', lb).src = b.getAttribute('data-lightbox'); $('img', lb).alt = b.getAttribute('data-alt') || '';
        $('figcaption', lb).textContent = b.getAttribute('data-caption') || ''; lb.showModal();
      });
    });
    $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { $('img', lb).src = ''; });
  }

  /* --- Tienda: filtros (demo en cliente) --------------------------------- */
  var ft = $('.filters-toggle'), sb = $('.shop-sidebar');
  if (ft && sb) ft.addEventListener('click', function () {
    var open = sb.classList.toggle('is-open'); ft.setAttribute('aria-expanded', open); ft.querySelector('span').textContent = open ? T.hideFilters : T.showFilters;
  });
  var techFilters = $$('[data-filter-tech]');
  if (techFilters.length) {
    var items = $$('ul.products li.product'), count = $('.woocommerce-result-count');
    function applyFilters() {
      var active = techFilters.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }), n = 0;
      items.forEach(function (li) { var show = !active.length || active.indexOf(li.getAttribute('data-tech')) > -1; li.hidden = !show; if (show) n++; });
      if (count) count.textContent = T.results(n);
    }
    techFilters.forEach(function (c) { c.addEventListener('change', applyFilters); });
  }

  /* --- Carrito (demo): cantidades y vaciado ------------------------------ */
  var cartForm = $('.woocommerce-cart-form');
  if (cartForm) {
    var price = parseFloat(cartForm.getAttribute('data-price'));
    function recalc() {
      var total = 0;
      $$('.cart_item', cartForm).forEach(function (row) {
        var q = parseInt($('.qty', row).value, 10) || 1, st = q * price; total += st;
        $('[data-subtotal]', row).textContent = money(st);
      });
      $$('[data-cart-subtotal],[data-cart-total]').forEach(function (el) { el.textContent = money(total); });
      var n = $$('.cart_item', cartForm).reduce(function (a, row) { return a + (parseInt($('.qty', row).value, 10) || 1); }, 0);
      store('yv-cart', n); cartCount(n);
    }
    cartForm.addEventListener('change', recalc);
    $$('.product-remove a', cartForm).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); a.closest('.cart_item').remove(); recalc();
        if (!$('.cart_item', cartForm)) {
          $$('[data-cart-full]').forEach(function (x) { x.hidden = true; }); $('[data-cart-empty]').hidden = false;
          $('.woocommerce').classList.remove('has-items'); store('yv-cart', 0); cartCount(0);
          $('[data-cart-empty] .cart-empty').focus();
        }
      });
    });
  }

  /* --- Checkout: enviar a otra dirección --------------------------------- */
  var ship = $('#ship-to-different-address-checkbox');
  if (ship) ship.addEventListener('change', function () { $('.shipping_address').hidden = !ship.checked; });

  /* --- Contacto: preselección mayoristas -------------------------------- */
  if (location.hash === '#mayoristas') { var s = $('#contact_type'); if (s) s.value = 'wholesale'; }

  /* --- Validación de formularios (demo de estados de error) --------------- */
  $$('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = [], box = $('.form-errors', form);
      $$('[required]', form).forEach(function (f) {
        if (f.closest('[hidden]')) return;
        var wrap = f.closest('.form-row, .field'), bad = false, m = T.required;
        if (f.type === 'checkbox') bad = !f.checked;
        else if (!f.value.trim()) bad = true;
        else if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) { bad = true; m = T.email; }
        if (wrap) {
          wrap.classList.toggle('woocommerce-invalid', bad); wrap.classList.toggle('is-invalid', bad);
          wrap.classList.toggle('woocommerce-validated', !bad && f.type !== 'checkbox');
          var fe = $('.field-error', wrap); if (fe) fe.textContent = m;
        }
        f.setAttribute('aria-invalid', bad);
        if (bad) { var l = form.querySelector('label[for="' + f.id + '"]'); errors.push({ id: f.id, label: l ? l.textContent.replace('*', '').trim() : f.name, msg: m }); }
      });
      if (!box) return;
      if (errors.length) {
        box.innerHTML = '<ul class="woocommerce-error" role="alert" tabindex="-1"><li><strong>' + T.formErrors + '</strong></li>' +
          errors.map(function (x) { return '<li><a href="#' + x.id + '">' + x.label + '</a>: ' + x.msg + '</li>'; }).join('') + '</ul>';
        box.firstChild.focus();
      } else {
        box.innerHTML = '<div class="woocommerce-message" role="status" tabindex="-1">' + T.sent + '</div>'; box.firstChild.focus();
      }
    });
  });
})();
