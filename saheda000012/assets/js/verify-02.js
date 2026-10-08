
function openMessageModal(){
  var m = document.getElementById('messageModal');
  m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeMessageModal(){
  document.getElementById('messageModal').style.display = 'none';
  document.body.style.overflow = '';
}
document.getElementById('messageModal').addEventListener('click', function(e){
  if (e.target === this) closeMessageModal();
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && document.getElementById('messageModal').style.display === 'flex') closeMessageModal();
});

/* ---- অতিথি বার্তা: শুধু ফোন নম্বর আগে থেকে নিবন্ধিত কিনা যাচাই (OTP প্রয়োজন নেই) ---- */
var msgPhoneAlreadyRegistered = false;
var msgPhoneCheckTimer = null;

function msgOnPhoneChanged(){
  clearTimeout(msgPhoneCheckTimer);
  var v = document.getElementById('msgGPhone').value.trim();
  var statusEl = document.getElementById('msgPhoneStatusMsg');

  if (v.length !== 11) {
    statusEl.style.display = 'none';
    msgPhoneAlreadyRegistered = false;
    return;
  }

  msgPhoneCheckTimer = setTimeout(function(){
    fetch('ajax_check_phoned9bf.json?phone=' + encodeURIComponent(v))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.exists) {
          msgPhoneAlreadyRegistered = true;
          statusEl.style.display = 'block';
          statusEl.style.color = '#c0392b';
          statusEl.innerHTML = '⚠️ এই নম্বরটি আগে থেকে নিবন্ধিত। <a href="login.html">বার্তা পাঠাতে লগিন করুন</a>';
        } else {
          msgPhoneAlreadyRegistered = false;
          statusEl.style.display = 'none';
        }
      });
  }, 500);
}

/* ---- অতিথি বার্তা পাঠানো ---- */
function msgSendGuest(e){
  e.preventDefault();
  var errBox = document.getElementById('msgErr');
  var okBox  = document.getElementById('msgOk');
  var btn    = document.getElementById('msgGuestBtn');
  var name   = document.getElementById('msgGName').value.trim();
  var phone  = document.getElementById('msgGPhone').value.trim();
  var addr   = document.getElementById('msgGAddr').value.trim();
  var text   = document.getElementById('msgGText').value.trim();
  errBox.style.display = 'none'; okBox.style.display = 'none';

  if (!name || !phone || !text) { errBox.textContent = '⚠️ নাম, মোবাইল নম্বর এবং বার্তা আবশ্যক।'; errBox.style.display = 'block'; return false; }
  if (phone.length !== 11) { errBox.textContent = '⚠️ সঠিক মোবাইল নম্বর দিন।'; errBox.style.display = 'block'; return false; }
  if (msgPhoneAlreadyRegistered) { errBox.textContent = '⚠️ এই নম্বরটি আগে থেকে নিবন্ধিত, বার্তা পাঠাতে লগিন করুন।'; errBox.style.display = 'block'; return false; }

  btn.disabled = true; btn.textContent = '⏳ পাঠানো হচ্ছে...';
  var fd = new FormData();
  fd.append('action','send_guest'); fd.append('name',name); fd.append('phone',phone);
  fd.append('address',addr); fd.append('message',text);
  fetch('ajax_message.json', {method:'POST', body:fd})
    .then(function(r){ return r.json(); })
    .then(function(d){
      btn.disabled = false; btn.textContent = '📨 বার্তা পাঠান';
      if (d.ok) {
        okBox.textContent = '✅ আপনার বার্তা পাঠানো হয়েছে। ধন্যবাদ!';
        okBox.style.display = 'block';
        document.getElementById('msgFormGuest').reset();
      } else {
        errBox.textContent = '⚠️ ' + (d.error || 'বার্তা পাঠানো যায়নি।');
        errBox.style.display = 'block';
      }
    })
    .catch(function(){
      btn.disabled = false; btn.textContent = '📨 বার্তা পাঠান';
      errBox.textContent = '⚠️ সংযোগ সমস্যা। আবার চেষ্টা করুন।';
      errBox.style.display = 'block';
    });
  return false;
}
