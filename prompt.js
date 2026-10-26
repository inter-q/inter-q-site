/* Inter-Q command prompt. Shared by the homepage badge and the title of every app (TOOLS, LOGSTAT, CONTACTS, CRASH,
   REMOVE): clicking an element marked data-prompt opens it. Typing a command word and Enter opens the folder of the
   same name. What's typed is never shown: each keystroke adds 1-3 # marks, so neither the letters nor the length can be read.
   Only fingerprints (SHA-256 of "inter-q:" + word) are kept here. To add an app, add the fingerprint of its word to H.
   Installed apps keep a copy of this file for offline use (it's in each app's sw.js), so bump their CACHE after editing it. */
(function(){
  "use strict";
  if(window.__iqPrompt)return;window.__iqPrompt=true;
  var H=["b07c5b245b7b5d3823e940e76d5b5876d1266b634a146a74686eedbcee23b207","fcf87c120980ce6fdfb650fb75846c565c46c21e900f164ffdc00e4390c318c2","7785673297ddfcfdee3fc8b61a068e8f06f28674ec7ef3c232c21129bfdadb9b","b3162f178b84069017e58e96c2940fb45be7ab8b32951067cd33bed6cdd46d5e","1dbedaa450fbed3e0fbe0dc9962adc522f765e3082bde5d8f0f54f009228c657"];
  var css=
    '.iqp-term{padding:0;border:2px solid #5fe08c;border-radius:12px;background:#020d06;color:#5fe08c;width:min(420px,calc(100vw - 32px));max-width:none;max-height:none;margin:22vh auto auto;box-shadow:0 0 34px rgba(95,224,140,.25);overflow:hidden}'+
    '.iqp-term::backdrop{background:rgba(1,8,4,.78)}'+
    '.iqp-line{position:relative;display:flex;align-items:center;padding:20px 22px;font:700 20px/1 "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;text-align:left;letter-spacing:normal;text-transform:none}'+
    '.iqp-pr,.iqp-cur,.iqp-mask{text-shadow:0 0 8px rgba(95,224,140,.5)}.iqp-pr{flex:none}'+
    '.iqp-cur{animation:iqp-blink 1.06s steps(1,end) infinite}@keyframes iqp-blink{50%{opacity:0}}'+
    '@media (prefers-reduced-motion:reduce){.iqp-cur{animation:none}}'+
    '.iqp-in{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0 22px;border:0;border-radius:0;outline:none;box-shadow:none;min-height:0;'+
      'background:transparent;color:transparent;caret-color:transparent;-webkit-text-security:disc;font:400 16px/1 ui-monospace,monospace;-webkit-text-fill-color:transparent;cursor:default;-webkit-appearance:none;appearance:none}'+
    '.iqp-in::selection{background:transparent;color:transparent}.iqp-in:-webkit-autofill{-webkit-box-shadow:0 0 0 40px #020d06 inset}'+
    '.iqp-msg{flex:1;margin-left:10px;color:#8fc9a3;font-weight:400;font-size:15px}'+
    '.iqp-mask{flex:none;max-width:calc(100% - 64px);overflow:hidden;white-space:nowrap;letter-spacing:.04em}'+
    '[data-prompt]{cursor:pointer;-webkit-tap-highlight-color:transparent}[data-prompt]:focus-visible{outline:3px solid #f2e27a;outline-offset:4px}';
  function start(){
    var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
    var term=document.createElement("dialog");term.className="iqp-term";term.setAttribute("aria-label","Inter-Q Labs");
    term.innerHTML='<div class="iqp-line"><span class="iqp-pr" aria-hidden="true">IQ:</span><span class="iqp-mask" aria-hidden="true"></span><span class="iqp-cur" aria-hidden="true">_</span><span class="iqp-msg" hidden></span>'+
      '<input class="iqp-in" type="text" maxlength="64" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Input" data-1p-ignore data-lpignore="true" data-form-type="other"></div>';
    document.body.appendChild(term);
    var q=function(s){return term.querySelector(s);},cmd=q(".iqp-in"),mask=q(".iqp-mask"),msg=q(".iqp-msg"),cur=q(".iqp-cur"),t,shown=0,typed=0;
    function rnd(){var a=new Uint8Array(1);crypto.getRandomValues(a);return 1+a[0]%3;}
    function paint(){mask.textContent=new Array(shown+1).join("#");}
    // Each added character shows 1-3 marks and each deleted one removes 1-3, so the marks never match what was typed.
    cmd.addEventListener("input",function(){var n=cmd.value.length;
      if(!n)shown=0;else if(n>typed)for(var i=typed;i<n;i++)shown+=rnd();else for(var j=n;j<typed;j++)shown=Math.max(1,shown-rnd());
      shown=Math.min(shown,24);typed=n;paint();});
    function reset(){clearTimeout(t);cmd.value="";shown=0;typed=0;paint();mask.hidden=false;msg.hidden=true;cur.hidden=false;cmd.disabled=false;}
    function open(e){if(e){e.preventDefault();e.stopPropagation();}if(term.open)return;reset();
      document.querySelectorAll("dialog[open]").forEach(function(d){if(d!==term)d.close();});
      term.showModal();cmd.focus();}
    term.addEventListener("close",reset);
    term.addEventListener("click",function(e){if(e.target===term)term.close();else if(!cmd.disabled)cmd.focus();});
    function nope(){cur.hidden=true;mask.hidden=true;msg.textContent="command not found";msg.hidden=false;cmd.disabled=true;
      t=setTimeout(function(){term.close();},1400);}
    cmd.addEventListener("keydown",function(e){
      e.stopPropagation();   // the app underneath never sees these keys
      if(e.key!=="Enter")return;
      e.preventDefault();
      var v=cmd.value.trim().toLowerCase();cmd.value="";shown=0;typed=0;paint();
      if(!v)return;
      if(!/^[a-z0-9-]{1,32}$/.test(v)||!(window.crypto&&crypto.subtle)){nope();return;}
      crypto.subtle.digest("SHA-256",new TextEncoder().encode("inter-q:"+v)).then(function(buf){
        var hex=Array.prototype.map.call(new Uint8Array(buf),function(x){return ("0"+x.toString(16)).slice(-2);}).join("");
        if(H.indexOf(hex)>=0)location.assign("/"+v+"/");else nope();
      },nope);
    });
    // Titles: click, tap, Enter or Space opens the prompt (capture phase, so the app's own handlers never fire).
    document.querySelectorAll("[data-prompt]").forEach(function(el){
      if(el.tagName!=="BUTTON"){el.setAttribute("role","button");if(!el.hasAttribute("tabindex"))el.tabIndex=0;}
      el.removeAttribute("href");
      el.addEventListener("click",open,true);
      el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")open(e);},true);
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
