
/* ---- modal open/close ---- */
function openLoginModal(tab){
  var m=document.getElementById('loginModal');
  m.style.display='flex';
  document.body.style.overflow='hidden';
  lmSwitch(tab||'login');
  setTimeout(function(){
    var f=document.getElementById(tab==='register'?'lmRName':'mlLogin');
    if(f) f.focus();
  },150);
}
function closeLoginModal(){
  document.getElementById('loginModal').style.display='none';
  document.body.style.overflow='';
}
document.getElementById('loginModal').addEventListener('click',function(e){
  if(e.target===this) closeLoginModal();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&document.getElementById('loginModal').style.display==='flex') closeLoginModal();
});

/* ---- tab switch ---- */
function lmSwitch(tab){
  document.getElementById('lmPanelLogin').classList.toggle('active', tab==='login');
  document.getElementById('lmPanelReg').classList.toggle('active', tab==='register');
  document.getElementById('lmTabLogin').classList.toggle('active', tab==='login');
  document.getElementById('lmTabReg').classList.toggle('active', tab==='register');
}

/* ---- লগিন ---- */
function lmDoLogin(e){
  e.preventDefault();
  var errBox=document.getElementById('lmLoginErr');
  var btn=document.getElementById('lmLoginBtn');
  var login=document.getElementById('mlLogin').value.trim();
  var pass=document.getElementById('mlPass').value;
  errBox.style.display='none';
  btn.disabled=true; btn.textContent='⏳ লগিন হচ্ছে...';
  var fd=new FormData();
  fd.append('action','login'); fd.append('ajax','1');
  fd.append('login',login); fd.append('password',pass);
  fetch('login.html',{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.success){window.location.href=d.redirect;}
      else{
        errBox.textContent='⚠️ '+(d.error||'লগিন ব্যর্থ হয়েছে।');
        errBox.style.display='block';
        btn.disabled=false; btn.textContent='🔐 লগিন করুন';
        document.getElementById('mlPass').value='';
        document.getElementById('mlPass').focus();
      }
    })
    .catch(function(){
      errBox.textContent='⚠️ সংযোগ সমস্যা। আবার চেষ্টা করুন।';
      errBox.style.display='block';
      btn.disabled=false; btn.textContent='🔐 লগিন করুন';
    });
}

/* ---- নিবন্ধনের মোবাইল OTP যাচাই ---- */
var lmOtpVerifiedPhone = null;
var lmOtpTimer = null;

function lmOnPhoneChanged(){
  var v = document.getElementById('lmRPhone').value.trim();
  var sendBtn = document.getElementById('lmOtpSendBtn');
  if(sendBtn) sendBtn.disabled = (v.length !== 11);
  if(lmOtpVerifiedPhone && lmOtpVerifiedPhone !== v){
    lmOtpVerifiedPhone = null;
    if(lmOtpTimer){ clearInterval(lmOtpTimer); lmOtpTimer = null; }
    var badge=document.getElementById('lmOtpVerifiedBadge'); if(badge) badge.style.display='none';
    var codeRow=document.getElementById('lmOtpCodeRow'); if(codeRow) codeRow.style.display='none';
    var statusEl=document.getElementById('lmOtpStatusMsg'); if(statusEl) statusEl.textContent='';
    if(sendBtn){ sendBtn.style.display=''; sendBtn.textContent='কোড নিন'; }
  }
}

function lmRequestOtp(){
  var phone = document.getElementById('lmRPhone').value.trim();
  if(phone.length !== 11) return;
  var btn = document.getElementById('lmOtpSendBtn');
  var statusEl = document.getElementById('lmOtpStatusMsg');
  if(btn) btn.disabled = true;
  var fd = new URLSearchParams({action:'send', phone:phone});
  fetch('ajax_otp.json', {method:'POST', body:fd})
    .then(function(r){return r.json();})
    .then(function(res){
      if(res.ok){
        var codeRow=document.getElementById('lmOtpCodeRow'); if(codeRow) codeRow.style.display='block';
        var codeInp=document.getElementById('lmOtpCodeInput'); if(codeInp) codeInp.value='';
        if(statusEl){ statusEl.style.color='#065f46'; statusEl.textContent='মোবাইল নম্বরে একটি কোড পাঠানো হয়েছে।'; }
        lmStartOtpCountdown(res.remaining || 600);
      } else {
        if(btn) btn.disabled=false;
        if(statusEl){ statusEl.style.color='#dc2626'; statusEl.textContent=res.error || 'কোড পাঠানো যায়নি।'; }
      }
    })
    .catch(function(){
      if(btn) btn.disabled=false;
      if(statusEl){ statusEl.style.color='#dc2626'; statusEl.textContent='নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন।'; }
    });
}

function lmStartOtpCountdown(seconds){
  var btn=document.getElementById('lmOtpSendBtn');
  if(lmOtpTimer) clearInterval(lmOtpTimer);
  var remaining = Math.max(0, parseInt(seconds,10)||0);
  function tick(){
    var m=Math.floor(remaining/60), s=remaining%60;
    var mm=(m<10?'0':'')+m, ss=(s<10?'0':'')+s;
    if(btn){ btn.disabled=true; btn.textContent='পুনরায় '+mm+':'+ss; }
    if(remaining<=0){
      clearInterval(lmOtpTimer); lmOtpTimer=null;
      if(btn){ btn.disabled=false; btn.textContent='আবার কোড নিন'; }
      return;
    }
    remaining--;
  }
  tick();
  lmOtpTimer=setInterval(tick,1000);
}

function lmVerifyOtp(){
  var phone=document.getElementById('lmRPhone').value.trim();
  var codeInp=document.getElementById('lmOtpCodeInput');
  var code=codeInp?codeInp.value.trim():'';
  var statusEl=document.getElementById('lmOtpStatusMsg');
  if(!code){ if(statusEl){statusEl.style.color='#dc2626'; statusEl.textContent='কোড লিখুন।';} return; }
  var vbtn=document.getElementById('lmOtpVerifyBtn');
  if(vbtn) vbtn.disabled=true;
  var fd=new URLSearchParams({action:'verify', phone:phone, code:code});
  fetch('ajax_otp.json', {method:'POST', body:fd})
    .then(function(r){return r.json();})
    .then(function(res){
      if(vbtn) vbtn.disabled=false;
      if(res.ok){
        lmOtpVerifiedPhone=phone;
        if(lmOtpTimer){ clearInterval(lmOtpTimer); lmOtpTimer=null; }
        var codeRow=document.getElementById('lmOtpCodeRow'); if(codeRow) codeRow.style.display='none';
        var sendBtn=document.getElementById('lmOtpSendBtn'); if(sendBtn) sendBtn.style.display='none';
        var badge=document.getElementById('lmOtpVerifiedBadge'); if(badge) badge.style.display='block';
        if(statusEl) statusEl.textContent='';
      } else {
        if(statusEl){ statusEl.style.color='#dc2626'; statusEl.textContent=res.error || 'যাচাই ব্যর্থ হয়েছে।'; }
      }
    })
    .catch(function(){
      if(vbtn) vbtn.disabled=false;
      if(statusEl){ statusEl.style.color='#dc2626'; statusEl.textContent='নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন।'; }
    });
}

/* ---- নিবন্ধন ---- */
function lmDoRegister(e){
  e.preventDefault();
  var errBox=document.getElementById('lmRegErr');
  var okBox=document.getElementById('lmRegOk');
  var hint=document.getElementById('lmRegHint');
  var btn=document.getElementById('lmRegBtn');
  var name=document.getElementById('lmRName').value.trim();
  var phone=document.getElementById('lmRPhone').value.trim();
  var email=document.getElementById('lmREmail').value.trim();
  var addr=document.getElementById('lmRAddr').value.trim();
  var pass=document.getElementById('lmRPass').value;
  var pass2=document.getElementById('lmRPass2').value;
  errBox.style.display='none'; okBox.style.display='none';
  if(!name||!phone||!pass){errBox.textContent='⚠️ নাম, ফোন ও পাসওয়ার্ড দেওয়া আবশ্যক।';errBox.style.display='block';return;}
  if(pass.length<6){errBox.textContent='⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';errBox.style.display='block';return;}
  if(pass!==pass2){errBox.textContent='⚠️ পাসওয়ার্ড দুটি মিলছে না।';errBox.style.display='block';return;}
  if(lmOtpVerifiedPhone !== phone){errBox.textContent='⚠️ আগে মোবাইল নম্বরটি OTP কোড দিয়ে যাচাই করুন।';errBox.style.display='block';return;}
  btn.disabled=true; btn.textContent='⏳ নিবন্ধন হচ্ছে...';
  var fd=new FormData();
  fd.append('action','register'); fd.append('ajax','1');
  fd.append('reg_name',name); fd.append('reg_phone',phone);
  fd.append('reg_email',email); fd.append('reg_address',addr);
  fd.append('reg_password',pass); fd.append('reg_password2',pass2);
  fetch('login.html',{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.success){
        okBox.innerHTML='✅ একাউন্ট তৈরি সফল! আপনার কাস্টমার আইডি: <strong>'+d.id+'</strong> — এটি সংরক্ষণ করুন।<br><br><button onclick="lmSwitch(\'login\')" style="background:#1a3a6e;color:#fff;border:none;padding:8px 18px;border-radius:7px;font-size:13px;cursor:pointer;font-weight:600">→ লগিন করুন</button>';
        okBox.style.display='block';
        hint.style.display='none';
        document.getElementById('lmRegForm').style.display='none';
        btn.disabled=false; btn.textContent='📝 একাউন্ট খুলুন';
      } else {
        errBox.textContent='⚠️ '+(d.error||'নিবন্ধন ব্যর্থ হয়েছে।');
        errBox.style.display='block';
        btn.disabled=false; btn.textContent='📝 একাউন্ট খুলুন';
      }
    })
    .catch(function(){
      errBox.textContent='⚠️ সংযোগ সমস্যা। আবার চেষ্টা করুন।';
      errBox.style.display='block';
      btn.disabled=false; btn.textContent='📝 একাউন্ট খুলুন';
    });
}
