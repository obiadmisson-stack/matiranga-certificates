
var AJAX_URL = 'ajax_cart_order.json';
var BASE_URL  = 'index.html';
var currency  = '৳';
var _selectedPayMethod = 'cash_on_delivery';
var _authCallback = null; // লগিনের পরে কী করবে

// ===== স্লাইডিং কার্ট প্যানেল =====
function openCartPanel() {
  renderCartPanel();
  document.getElementById('cartOverlay').style.display = 'block';
  var p = document.getElementById('cartPanel');
  p.style.right = '0';
  document.body.style.overflow = 'hidden';
}
function closeCartPanel() {
  document.getElementById('cartOverlay').style.display = 'none';
  document.getElementById('cartPanel').style.right = '-420px';
  document.body.style.overflow = '';
}

function renderCartPanel() {
  var cart   = getCart();
  var items  = document.getElementById('cpItems');
  var total  = 0;
  var count  = 0;

  if (cart.length === 0) {
    items.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#9ca3af"><div style="font-size:3rem;margin-bottom:12px">🛒</div><div style="font-size:15px;font-weight:600">কার্ট খালি</div><div style="font-size:13px;margin-top:6px">পণ্য বা সেবা যোগ করুন</div></div>';
    document.getElementById('cpTotal').textContent = currency + '০';
    document.getElementById('cpCount').textContent = '0';
    return;
  }

  var html = '';
  cart.forEach(function(item, idx) {
    var line = item.price * item.qty;
    total += line;
    count += item.qty;
    var img = item.image ? '<img src="'+item.image+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid #e8eef6">' :
      '<div style="width:44px;height:44px;border-radius:8px;background:#e8f0fe;display:flex;align-items:center;justify-content:center;font-size:20px">📦</div>';
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6">'
      + img
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:13.5px;font-weight:600;color:#1a3c6e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+item.name+'</div>'
      + '<div style="font-size:12px;color:#9ca3af;margin-top:1px">'+currency+parseFloat(item.price).toFixed(0)+' × '+item.qty+'</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">'
      + '<button onclick="cpChangeQty('+idx+',-1)" style="width:26px;height:26px;border:1.5px solid #e5e7eb;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">−</button>'
      + '<span style="font-size:13px;font-weight:700;min-width:20px;text-align:center">'+item.qty+'</span>'
      + '<button onclick="cpChangeQty('+idx+',1)" style="width:26px;height:26px;border:1.5px solid #e5e7eb;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">+</button>'
      + '<button onclick="cpRemove('+idx+')" style="width:26px;height:26px;border:none;background:#fff3f3;border-radius:6px;cursor:pointer;color:#dc3545;font-size:14px;margin-left:2px;display:flex;align-items:center;justify-content:center">✕</button>'
      + '</div>'
      + '</div>';
  });
  items.innerHTML = html;
  document.getElementById('cpTotal').textContent = currency + total.toFixed(0);
  document.getElementById('cpCount').textContent = count;
}

function cpChangeQty(idx, d) {
  var cart = getCart();
  if (!cart[idx]) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + d);
  saveCart(cart);
  renderCartPanel();
}
function cpRemove(idx) {
  var cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  renderCartPanel();
  if (typeof updateFabBadge === 'function') updateFabBadge();
}

// ===== অর্ডার বাটন চাপলে =====
function onClickOrder() {
  var cart = getCart();
  if (cart.length === 0) { alert('কার্ট খালি!'); return; }

  // লগিন চেক (AJAX)
  fetch(AJAX_URL + '?action=status')
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.logged_in) {
        // সরাসরি পেমেন্ট মোডাল
        openPayModal(d.name, d.phone);
      } else {
        // লগিন মোডাল
        _authCallback = function(name, phone) { openPayModal(name, phone); };
        openAuthModal();
      }
    });
}

// ===== লগিন / নিবন্ধন মোডাল =====
function openAuthModal() {
  document.getElementById('authOverlay').style.display = 'block';
  var m = document.getElementById('authModal');
  m.style.display = 'block';
  setTimeout(function() {
    m.style.transform = 'translate(-50%,-50%) scale(1)';
    m.style.opacity   = '1';
  }, 10);
  switchAuthTab('login');
}
function closeAuthModal() {
  var m = document.getElementById('authModal');
  m.style.transform = 'translate(-50%,-50%) scale(.92)';
  m.style.opacity   = '0';
  setTimeout(function() {
    m.style.display = 'none';
    document.getElementById('authOverlay').style.display = 'none';
  }, 220);
}
function switchAuthTab(tab) {
  var isLogin = tab === 'login';
  document.getElementById('loginForm').style.display    = isLogin ? '' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : '';
  var lb = document.getElementById('tabLoginBtn');
  var rb = document.getElementById('tabRegBtn');
  lb.style.background = isLogin ? '#1e3a5f' : 'transparent';
  lb.style.color      = isLogin ? '#fff' : '#6b7280';
  rb.style.background = isLogin ? 'transparent' : '#1e3a5f';
  rb.style.color      = isLogin ? '#6b7280' : '#fff';
}

function doLogin() {
  var phone = document.getElementById('lPhone').value.trim();
  var pass  = document.getElementById('lPass').value;
  var err   = document.getElementById('lError');
  err.style.display = 'none';
  if (!phone || !pass) { err.style.display='block'; err.textContent='মোবাইল নম্বর ও পাসওয়ার্ড দিন।'; return; }

  var fd = new FormData();
  fd.append('action','login'); fd.append('login',phone); fd.append('password',pass);
  fetch(AJAX_URL, {method:'POST', body:fd})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.ok) {
        closeAuthModal();
        if (_authCallback) _authCallback(d.name, d.phone);
      } else {
        err.style.display = 'block';
        err.textContent   = d.msg;
      }
    });
}

function doRegister() {
  var name  = document.getElementById('rName').value.trim();
  var phone = document.getElementById('rPhone').value.trim();
  var pass  = document.getElementById('rPass').value;
  var err   = document.getElementById('rError');
  err.style.display = 'none';
  if (!name || !phone || !pass) { err.style.display='block'; err.textContent='সব ঘর পূরণ করুন।'; return; }

  var fd = new FormData();
  fd.append('action','register'); fd.append('name',name); fd.append('phone',phone); fd.append('password',pass);
  fetch(AJAX_URL, {method:'POST', body:fd})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.ok) {
        closeAuthModal();
        if (_authCallback) _authCallback(d.name, d.phone);
      } else {
        err.style.display = 'block';
        err.textContent   = d.msg;
      }
    });
}

// ===== পেমেন্ট মোডাল =====
function openPayModal(userName, userPhone) {
  closeCartPanel();
  document.getElementById('payUserName').textContent = '✅ লগিন: ' + userName + ' (' + userPhone + ')';

  // কার্ট সারসংক্ষেপ
  var cart  = getCart();
  var total = 0;
  var html  = '';
  cart.forEach(function(item) {
    var line = item.price * item.qty;
    total += line;
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:5px">'
      + '<span>'+item.name+' × '+item.qty+'</span>'
      + '<span style="font-weight:600">'+currency+line.toFixed(0)+'</span>'
      + '</div>';
  });
  document.getElementById('payItemsList').innerHTML = html;
  document.getElementById('payTotalAmt').textContent = currency + total.toFixed(0);

  // পেমেন্ট মেথড
  fetch(AJAX_URL + '?action=payment_methods')
    .then(function(r){ return r.json(); })
    .then(function(d) {
      var pmDiv = document.getElementById('payMethods');
      pmDiv.innerHTML = '';
      var first = true;
      d.methods.forEach(function(m) {
        var btn = document.createElement('button');
        btn.className = 'pm-btn' + (first ? ' selected' : '');
        btn.setAttribute('data-key', m.key);
        btn.innerHTML = '<span style="font-size:18px">'+m.icon+'</span><span>'+m.label+'</span>';
        btn.onclick = function() {
          document.querySelectorAll('.pm-btn').forEach(function(b){ b.classList.remove('selected'); });
          btn.classList.add('selected');
          _selectedPayMethod = m.key;
        };
        if (first) { _selectedPayMethod = m.key; first = false; }
        pmDiv.appendChild(btn);
      });
    });

  document.getElementById('payOverlay').style.display = 'block';
  var m = document.getElementById('payModal');
  m.style.display = 'block';
  setTimeout(function() {
    m.style.transform = 'translate(-50%,-50%) scale(1)';
    m.style.opacity   = '1';
  }, 10);
}
function closePayModal() {
  var m = document.getElementById('payModal');
  m.style.transform = 'translate(-50%,-50%) scale(.92)';
  m.style.opacity   = '0';
  setTimeout(function() {
    m.style.display = 'none';
    document.getElementById('payOverlay').style.display = 'none';
  }, 220);
}

function doPlaceOrder() {
  var cart    = getCart();
  var address = document.getElementById('payAddress').value;
  var err     = document.getElementById('payError');
  var btn     = document.getElementById('doOrderBtn');
  err.style.display = 'none';

  if (cart.length === 0) { err.style.display='block'; err.textContent='কার্ট খালি!'; return; }

  btn.disabled = true;
  btn.textContent = '⏳ প্রক্রিয়াকরণ হচ্ছে...';

  var fd = new FormData();
  fd.append('action','place_order');
  fd.append('cart_json', JSON.stringify(cart));
  fd.append('payment_method', _selectedPayMethod);
  fd.append('address', address);

  fetch(AJAX_URL, {method:'POST', body:fd})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      btn.disabled = false;
      btn.textContent = '✅ অর্ডার নিশ্চিত করুন';
      if (d.ok) {
        // কার্ট খালি করো
        localStorage.removeItem('nagrik_cart');
        if (typeof updateCartCount === 'function') updateCartCount();
        if (typeof updateFabBadge === 'function') updateFabBadge();

        closePayModal();
        showSuccessModal(d);
      } else {
        err.style.display = 'block';
        err.textContent   = d.msg;
      }
    });
}

function showSuccessModal(d) {
  var payLabels = {
    'cash_on_delivery': 'ক্যাশ অন ডেলিভারি',
    'bkash': 'বিকাশ', 'nagad': 'নগদ', 'rocket': 'রকেট'
  };
  var body = '<div style="font-size:1.4rem;font-weight:800;color:#059669;margin-bottom:12px">'+d.currency+parseFloat(d.total).toFixed(0)+'</div>'
    + '<table style="width:100%;font-size:13px;margin-bottom:10px">'
    + '<tr><td style="color:#6b7280;padding:3px 0">অর্ডার নম্বর:</td><td style="font-weight:700;color:#111">'+d.order_id+'</td></tr>'
    + '<tr><td style="color:#6b7280;padding:3px 0">পেমেন্ট মাধ্যম:</td><td style="font-weight:600">'+(payLabels[d.pay_method]||d.pay_method)+'</td></tr>'
    + '<tr><td style="color:#6b7280;padding:3px 0">জমা:</td><td style="font-weight:700;color:#059669">'+d.currency+parseFloat(d.paid).toFixed(0)+'</td></tr>'
    + (d.due > 0 ? '<tr><td style="color:#6b7280;padding:3px 0">বাকি:</td><td style="font-weight:700;color:#dc2626">'+d.currency+parseFloat(d.due).toFixed(0)+'</td></tr>' : '')
    + '</table>';

  document.getElementById('successBody').innerHTML = body;
  document.getElementById('successOverlay').style.display = 'block';
  var sm = document.getElementById('successModal');
  sm.style.display = 'block';
  setTimeout(function() {
    sm.style.transform = 'translate(-50%,-50%)';
    sm.style.opacity = '1';
  }, 10);
}
function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
  document.getElementById('successOverlay').style.display = 'none';
}

// লগিন বাটনেও এখন মোডাল খুলবে (হেডার থেকে)
document.addEventListener('DOMContentLoaded', function() {
  // হেডারের লগিন লিংক পপআপে রুপান্তর (ঐচ্ছিক — শুধু পাবলিক পেজে)
  var loginLinks = document.querySelectorAll('a[href$="/login.php"]');
  loginLinks.forEach(function(a) {
    // top-bar লগিন বোতামটাকে মোডাল বানাও
    if (a.classList.contains('btn-sm') && !a.href.includes('dashboard')) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        _authCallback = function() { window.location.reload(); };
        openAuthModal();
      });
    }
  });
});
