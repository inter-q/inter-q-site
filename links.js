// Footer links (they go nowhere and change nothing on the page) and the copy-the-bitcoin-address button.
(function(){
  var U="https://canarytokens.com/tags/images/static/4kwr0pg45o8daxr013w3puiox/index.html";
  function hit(){
    try{ var i=new Image(); i.referrerPolicy="no-referrer-when-downgrade"; i.src=U+"?r="+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }catch(_){}
  }
  function copyBtc(btn){
    var ad=btn.querySelector(".ad"), lb=btn.querySelector(".lb"), v=ad?ad.textContent.trim():"";
    var done=function(ok){ if(!lb) return; lb.textContent=ok?"COPIED":"BTC"; clearTimeout(btn._t); btn._t=setTimeout(function(){ lb.textContent="BTC"; },1600); };
    var old=function(){ try{ var r=document.createRange(); r.selectNodeContents(ad); var s=getSelection(); s.removeAllRanges(); s.addRange(r); var ok=document.execCommand("copy"); s.removeAllRanges(); done(ok); }catch(_){ done(false); } };
    if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(v).then(function(){ done(true); },old); else old();
  }
  function start(){
    var b=document.getElementById("btc"); if(b) b.addEventListener("click",function(){ copyBtc(b); });
    document.querySelectorAll("[data-ft]").forEach(function(a){
      a.addEventListener("click",function(e){ e.preventDefault(); hit(); a.blur(); });
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
