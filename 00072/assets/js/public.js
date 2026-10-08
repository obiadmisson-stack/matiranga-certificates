// assets/js/public.js — নাগরিক সেবা কেন্দ্র

// ============================================================
// মোবাইল স্লাইডিং ড্রয়ার মেনু
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

  var toggleBtn  = document.getElementById('menuToggle');
  var nav        = document.getElementById('mainNav');
  var overlay    = document.getElementById('navOverlay');
  var closeBtn   = document.getElementById('navCloseBtn');

  function openMenu() {
    if (!nav) return;
    nav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.innerHTML = '&#10005;';
    }
    document.body.style.overflow = 'hidden'; // স্ক্রল বন্ধ
  }

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '&#9776;';
    }
    document.body.style.overflow = '';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      nav.classList.contains('open') ? closeMenu() : openMenu();
    });
  }

  // ড্রয়ারের ভেতরে ✕ বাটন
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Overlay ক্লিক করলে বন্ধ
  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // মেনু আইটেমে ক্লিক করলে বন্ধ (মোবাইলে navigate)
  if (nav) {
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) closeMenu();
      });
    });
  }

  // ============================================================
  // নেভবার — উপরের লাইনে (লোগো-বাটনের মাঝের ফাঁকা জায়গায়) যতগুলো ধরে ততগুলো,
  // বাকিগুলো নিচের পূর্ণ-প্রস্থ দ্বিতীয় লাইনে; এরপরও বাকি থাকলে "অন্যান্য" ড্রপডাউনে।
  // মোবাইলে সবগুলো আগের মতোই ড্রয়ারে একটার নিচে একটা তালিকা আকারে থাকে।
  //
  // এই পুরো ফাংশনটা "সেলফ-হিলিং" — অর্থাৎ কোনো কারণে (ফন্ট সোয়াপ, ধীর নেটওয়ার্ক,
  // zoom, ইত্যাদি) হিসাব ভুল হয়ে আইটেম হারিয়ে/লুকিয়ে গেলে, সেটা নিজে থেকেই ধরে ফেলে
  // পুনরায় সঠিকভাবে বসিয়ে দেয় — যাতে নেভবার কখনো "গায়েব" দেখা না যায়।
  // ============================================================

  // একই স্ক্রিপ্ট ভুলবশত দুইবার লোড হলেও যেন দুইবার init না হয়
  if (window.__navDistributeInit) return;
  window.__navDistributeInit = true;

  // container তে items[] থেকে এক এক করে যোগ করে, যতক্ষণ এক লাইনে ধরে (২য় সারিতে না গিয়ে);
  // যেটা প্রথম wrap করাবে সেটাসহ বাকি আইটেমগুলো ফেরত পাঠায়
  function fillOneLine(container, items) {
    for (var i = 0; i < items.length; i++) {
      container.appendChild(items[i]);
      var kids = container.children;
      if (kids.length > 1 && kids[kids.length - 1].offsetTop !== kids[0].offsetTop) {
        container.removeChild(items[i]);
        return items.slice(i);
      }
    }
    return [];
  }

  // মূল ক্রম (PHP থেকে যেভাবে এসেছে / অ্যাডমিনের sort_order অনুযায়ী) একবারই সংরক্ষণ করি,
  // যাতে বারবার distributeNav() চালালে (load/resize) আইটেমগুলোর ক্রম এলোমেলো না হয়ে যায়
  var navMasterOrder = null;

  // navMasterOrder — মূল সোর্স অফ ট্রুথ থেকে (মোবাইল ড্রয়ার #mainNav এর ভেতরের লিংকগুলো)
  // সরাসরি বের করে আনে। এটা primary/secondary/more — যেখানেই আইটেমগুলো এই মুহূর্তে থাকুক
  // না কেন, সবসময় নির্ভরযোগ্যভাবে কাজ করে (DOM এ attached আছে এমন সব লিংক ধরে)।
  function buildMasterOrderFromDOM() {
    var mainNav = document.getElementById('mainNav');
    if (!mainNav) return [];
    var closeBtn = document.getElementById('navCloseBtn');
    return Array.prototype.filter.call(mainNav.querySelectorAll('a'), function(el) {
      return el !== closeBtn && el.id !== 'navMore';
    });
  }

  // মডেল-২: বাঁ পাশের অদৃশ্য স্পেসার (hdr-actions-spacer) ও ডানের বাটন গ্রুপ
  // (hdr-actions) — দুটোই CSS-এ সমান flex-basis (flex:1 1 0) পাওয়ায় ব্রাউজার
  // নিজে থেকেই সমান-প্রস্থ রাখে, তাই এখানে JS দিয়ে width মেপে সিঙ্ক করার
  // (আগের ভঙ্গুর পদ্ধতি) আর দরকার নেই।

  function distributeNav() {
    var flow      = document.getElementById('navFlow');
    var more      = document.getElementById('navMore');
    var moreMenu  = document.getElementById('navMoreMenu');
    var primary   = document.getElementById('navPrimarySlot');
    var secondary = document.getElementById('navSecondaryRow');
    if (!flow || !more || !moreMenu || !primary || !secondary) return;

    // প্রথমবার চলার সময় মূল ক্রমটা (শুধু লিংকগুলো, "more" বাদে) মুখস্থ রাখি
    if (!navMasterOrder || !navMasterOrder.length) {
      navMasterOrder = Array.prototype.filter.call(flow.children, function(el) { return el !== more; });
    }
    // সুরক্ষা: কোনো কারণে element গুলো DOM থেকে বিচ্ছিন্ন হয়ে গেলে (isConnected===false),
    // সেটাকে নির্ভরযোগ্য সোর্স (#mainNav) থেকে আবার বানিয়ে নিই — যাতে আইটেম কখনো "হারিয়ে" না যায়
    var hasDetached = navMasterOrder.some(function(el) { return !el.isConnected; });
    if (!navMasterOrder.length || hasDetached) {
      var rebuilt = buildMasterOrderFromDOM();
      if (rebuilt.length) navMasterOrder = rebuilt;
    }
    if (!navMasterOrder.length) return; // সত্যিই কোনো নেভ লিংক নেই — কিছু করার নেই

    // ধাপ ১: সংরক্ষিত মূল ক্রম অনুযায়ীই সব আইটেম মূল তালিকা (navFlow) তে ফিরিয়ে আনি —
    // (moreMenu/secondary/primary যেখানেই থাকুক, ক্রম সবসময় navMasterOrder থেকেই ঠিক হয়)
    navMasterOrder.forEach(function(el) { flow.appendChild(el); });
    if (secondary.contains(more)) secondary.removeChild(more);
    more.style.display = 'none';
    flow.appendChild(more);

    // মোবাইলে ড্রয়ারে সব আইটেম একটার নিচে একটা — এই বিলি-বণ্টনের দরকার নেই
    if (window.innerWidth <= 768) {
      secondary.style.display = 'none';
      return;
    }

    var items = Array.prototype.filter.call(flow.children, function(el) { return el !== more; });

    // ধাপ ২: উপরের লাইনের ফাঁকা জায়গায় (navPrimarySlot) যতগুলো ধরে
    var leftover1 = fillOneLine(primary, items);

    // ধাপ ৩: বাকিগুলো নিচের পূর্ণ-প্রস্থ লাইনে (navSecondaryRow), যতগুলো এক লাইনে ধরে
    if (!leftover1.length) {
      secondary.style.display = 'none';
      return;
    }
    secondary.style.display = 'flex';
    var leftover2 = fillOneLine(secondary, leftover1);

    // ধাপ ৪: এরপরও বাকি থাকলে "অন্যান্য" ড্রপডাউনে
    if (!leftover2.length) { more.style.display = 'none'; return; }

    secondary.appendChild(more);
    more.style.display = '';
    leftover2.forEach(function(el) { moreMenu.appendChild(el); });

    // "more" ট্রিগার নিজেও জায়গা নেয় বলে যোগ হওয়ার পর হয়ত secondaryRow থেকে আরেকটা
    // আইটেম push out হতে পারে — স্থিতিশীল না হওয়া পর্যন্ত যাচাই করে সরাতে থাকি
    var guard = 0;
    while (guard++ < 30) {
      var kids = Array.prototype.slice.call(secondary.children);
      if (kids.length < 2) break;
      var firstTop = kids[0].offsetTop, overflowEl = null;
      for (var i = 1; i < kids.length; i++) {
        if (kids[i].offsetTop !== firstTop) { overflowEl = kids[i]; break; }
      }
      if (!overflowEl) break;
      var target = (overflowEl === more) ? kids[kids.indexOf(more) - 1] : overflowEl;
      if (!target || target === more) break;
      moreMenu.appendChild(target);
    }
  }

  // debounce করে distributeNav চালানোর helper — একাধিক ইভেন্ট প্রায় একসাথে ফায়ার হলেও
  // যেন বারবার রিফ্লো না ঘটে
  var _navRunTimer = null;
  function scheduleDistributeNav(delay) {
    clearTimeout(_navRunTimer);
    _navRunTimer = setTimeout(distributeNav, delay || 0);
  }

  distributeNav();
  window.addEventListener('load', distributeNav); // ফন্ট/ছবি লোড হওয়ার পর মাপ বদলাতে পারে বলে আবার চালাই

  // বাংলা ওয়েবফন্ট (Hind Siliguri ইত্যাদি) display:swap দিয়ে লোড হয় বলে অনেক সময়
  // DOMContentLoaded/load ইভেন্টের পরেও ফন্ট সোয়াপ হয় — তখন লেখার প্রস্থ বদলে যায় এবং
  // আগে ঠিকভাবে "ফিট" হওয়া আইটেমগুলো নতুন প্রস্থে আর না ধরে ভুলভাবে বসে যেতে পারে
  // ("নেভবার হাইড হয়ে যাওয়া" বাগ) — তাই ফন্ট আসলেই রেডি হলে আরেকবার recalculate করি
  if (window.document && document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () {
      distributeNav();
      // কিছু ব্রাউজারে ready resolve হওয়ার পরও ১ ফ্রেম দেরিতে reflow হয় — নিরাপদ থাকতে আরেকবার
      scheduleDistributeNav(60);
    });
  }
  // ধীর নেটওয়ার্ক/ছবি লোডে সামান্য দেরি হতে পারে — extra safety net হিসেবে আরেকবার চালাই
  scheduleDistributeNav(500);

  // ===== চূড়ান্ত সুরক্ষা: ResizeObserver =====
  // primary/secondary স্লটের আসল উচ্চতা/প্রস্থ যদি হঠাৎ (যেকোনো কারণে — ফন্ট, zoom,
  // অন্য কোনো স্ক্রিপ্টের হস্তক্ষেপ) প্রত্যাশার বাইরে বদলে যায়, সেটা স্বয়ংক্রিয়ভাবে ধরে
  // আবার সঠিকভাবে বিলি-বণ্টন করে — এভাবে "কেন" ভুল হলো তা না জেনেও ফলাফল সবসময় ঠিক থাকে
  if (window.ResizeObserver) {
    var _navRO = new ResizeObserver(function () { scheduleDistributeNav(80); });
    var _navPrimaryEl = document.getElementById('navPrimarySlot');
    var _navSecondaryEl = document.getElementById('navSecondaryRow');
    if (_navPrimaryEl)  _navRO.observe(_navPrimaryEl);
    if (_navSecondaryEl) _navRO.observe(_navSecondaryEl);
  }

  var _navResizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(_navResizeTimer);
    _navResizeTimer = setTimeout(distributeNav, 150);
  });

  // ============================================================
  // কার্ট কাউন্ট আপডেট
  // ============================================================
  updateCartCount();

  // ============================================================
  // FAQ অ্যাকর্ডিয়ান
  // ============================================================
  document.querySelectorAll('.faq-question').forEach(function(q) {
    q.addEventListener('click', function() {
      var isOpen = this.classList.contains('open');
      // সব বন্ধ করো
      document.querySelectorAll('.faq-question').forEach(function(qi) {
        qi.classList.remove('open');
        if (qi.nextElementSibling) qi.nextElementSibling.classList.remove('open');
      });
      // এটা খোলো
      if (!isOpen) {
        this.classList.add('open');
        if (this.nextElementSibling) this.nextElementSibling.classList.add('open');
      }
    });
  });

  // ============================================================
  // Flash message অটো-হাইড ৫ সেকেন্ড পর
  // ============================================================
  var flashMsg = document.getElementById('flashMsg');
  if (flashMsg) {
    setTimeout(function() { flashMsg.remove(); }, 5000);
  }

});

// ============================================================
// কার্ট সিস্টেম (localStorage)
// ============================================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('nagrik_cart') || '[]');
  } catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('nagrik_cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  var cart = getCart();
  var total = cart.reduce(function(s, i) { return s + (i.qty || 0); }, 0);
  document.querySelectorAll('#cart-count, .cart-badge').forEach(function(el) {
    el.textContent = total;
  });
}

function addToCart(item) {
  var cart = getCart();
  var key = item.type + '_' + item.id;
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].key === key) { existing = cart[i]; break; }
  }
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ key: key, id: item.id, type: item.type, name: item.name, price: parseFloat(item.price), qty: 1 });
  }
  saveCart(cart);
  showCartToast();
}

function showCartToast() {
  var toast = document.getElementById('cartToast');
  if (!toast) return;
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 3000);
}
