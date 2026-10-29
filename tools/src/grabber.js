function iqGrabber(cfg){
  "use strict";
  var W=window, d=document, root=d.documentElement;
  if(W.__iqGrabber&&typeof W.__iqGrabber.stop==="function"){ W.__iqGrabber.stop(); return; }
  if(!d.body||d.documentElement.namespaceURI!=="http://www.w3.org/1999/xhtml"){ try{ alert("GRABBER works on web pages. This is a single file on its own: right-click it and choose Save as."); }catch(_){} return; }
  var E=Element.prototype, N=Node.prototype;
  var G=function(o,p){ var x=o; while(x){ var g=Object.getOwnPropertyDescriptor(x,p); if(g&&g.get) return g.get; x=Object.getPrototypeOf(x); } return function(){ return this[p]; }; };
  var gConn=G(N,"isConnected"), gTag=G(E,"tagName"), gShadow=G(E,"shadowRoot"), gPar=G(N,"parentNode");
  function conn(el){ try{ return gConn.call(el); }catch(_){ return false; } }
  function attr(el,a){ try{ return E.getAttribute.call(el,a)||""; }catch(_){ return ""; } }
  function tagOf(el){ try{ return String(gTag.call(el)); }catch(_){ return ""; } }
  function shadowOf(el){ try{ return gShadow.call(el); }catch(_){ return null; } }
  function rectOf(el){ return E.getBoundingClientRect.call(el); }
  function up(el){ var p=gPar.call(el); if(p&&p.nodeType===11&&p.host) return p.host; return p&&p.nodeType===1?p:null; }
  function abs(u,base){ try{ return new URL(String(u).trim(),base||d.baseURI).href; }catch(_){ return ""; } }

  /* ---------- what's on the page ---------- */
  var IMG=/\.(jpe?g|jfif|png|apng|gif|webp|avif|svg|bmp|ico|tiff?|heic|heif)(\?|#|$)/i,
      AUD=/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|mid|midi|amr)(\?|#|$)/i,
      VID=/\.(mp4|m4v|webm|mov|ogv|mkv|avi|3gp|wmv)(\?|#|$)/i,
      STR=/\.(m3u8|mpd)(\?|#|$)/i;
  var MIMEX={"image/jpeg":"jpg","image/png":"png","image/gif":"gif","image/webp":"webp","image/avif":"avif","image/svg+xml":"svg","image/bmp":"bmp","image/x-icon":"ico","image/vnd.microsoft.icon":"ico","image/tiff":"tif",
      "audio/mpeg":"mp3","audio/mp3":"mp3","audio/wav":"wav","audio/x-wav":"wav","audio/wave":"wav","audio/ogg":"ogg","audio/mp4":"m4a","audio/x-m4a":"m4a","audio/aac":"aac","audio/flac":"flac","audio/webm":"weba","audio/opus":"opus",
      "video/mp4":"mp4","video/webm":"webm","video/ogg":"ogv","video/quicktime":"mov","video/x-matroska":"mkv"};
  var EXT={}; "jpg jpeg jfif png apng gif webp avif svg bmp ico tif tiff heic heif mp3 wav ogg oga m4a aac flac opus weba mid midi amr mp4 m4v webm mov ogv mkv avi 3gp wmv m3u8 mpd".split(" ").forEach(function(x){ EXT[x]=1; });
  var SAME={jpeg:"jpg",jfif:"jpg",tiff:"tif",apng:"png"};
  function normX(x){ x=String(x||"").toLowerCase(); return SAME[x]||x; }
  function splitExt(n){ var m=/\.([a-z0-9]{2,5})$/i.exec(n); return m&&EXT[m[1].toLowerCase()]?[n.slice(0,m.index),m[1]]:[n,""]; }
  function kindOf(u,hint){
    var m=/^data:([a-z]+)\//i.exec(u); if(m) return /^(image|audio|video)$/i.test(m[1])?m[1].toLowerCase():"other";
    if(STR.test(u)) return "stream"; if(IMG.test(u)) return "image"; if(AUD.test(u)) return "audio"; if(VID.test(u)) return "video";
    return hint||"other";
  }
  var SVGNS="http://www.w3.org/2000/svg";
  function O(){ return Object.create(null); }
  var items=[], byKey=O(), svgN=0;
  function add(u,hint,el,x){
    x=x||{};
    if(!x.svg&&!String(u||"").trim()) return null;
    var key=x.svg?("svg:"+(++svgN)):abs(u,x.base); if(!key||/^(javascript|about|chrome|moz-extension|chrome-extension):/i.test(key)) return null;
    var it=byKey[key];
    if(!it){ it=byKey[key]={key:key,url:x.svg?"":key,svg:x.svg||null,kind:x.svg?"image":kindOf(key,hint),els:[],w:0,h:0,size:0,from:[],ms:false}; items.push(it); }
    if(hint&&(it.kind==="other"||(hint!=="image"&&it.kind==="image"&&/^(audio|video)$/.test(hint)&&!IMG.test(key)))) it.kind=hint;
    if(el&&it.els.indexOf(el)<0) it.els.push(el);
    if(x.w&&x.w*(x.h||1)>it.w*(it.h||1)){ it.w=x.w; it.h=x.h||0; }
    if(x.from&&it.from.indexOf(x.from)<0) it.from.push(x.from);
    if(x.ms) it.ms=true;
    return it;
  }
  function srcsetBest(ss,base){
    var best=null, bv=-1;
    var str=String(ss||""), i=0, n=str.length;
    while(i<n){
      while(i<n&&/[\s,]/.test(str[i])) i++; if(i>=n) break;
      var j=i; while(j<n&&!/\s/.test(str[j])) j++;
      var url=str.slice(i,j), desc="";
      if(/,$/.test(url)) url=url.replace(/,+$/,"");
      else { var k=str.indexOf(",",j); if(k<0) k=n; desc=str.slice(j,k).trim(); j=k; }
      i=j+1; if(!url) continue;
      var v=1, dm=/([\d.]+)([wxh])/i.exec(desc); if(dm){ v=parseFloat(dm[1])||1; if(/x/i.test(dm[2])) v*=1000; }
      if(v>bv){ bv=v; best=abs(url,base); }
    }
    return best;
  }
  function cssUrls(v){ var out=[], re=/url\(\s*(['"]?)(.*?)\1\s*\)/g, m; while((m=re.exec(v||""))) if(m[2]&&!/^#/.test(m[2])) out.push(m[2]); return out; }
  function scanDoc(doc,frameEl){
    var base=doc.baseURI, list=[];
    (function walk(rt){ var l=rt.querySelectorAll("*"); for(var i=0;i<l.length;i++){ var el=l[i]; if(el===host) continue; list.push(el); var sr=shadowOf(el); if(sr) walk(sr); } })(doc);
    list.forEach(function(el){
      var t=tagOf(el).toUpperCase(), owner=frameEl||el;
      try{
        if(t==="IMG"){ var nw=el.naturalWidth||0, nh=el.naturalHeight||0, cs=el.currentSrc||attr(el,"src");
          if(cs) add(cs,"image",owner,{w:nw,h:nh,from:"picture",base:base});
          var raw=attr(el,"src"); if(raw&&!/^data:image\/gif/i.test(raw)&&abs(raw,base)!==abs(cs,base)) add(raw,"image",owner,{from:"other format",base:base});
          var b=srcsetBest(attr(el,"srcset"),base); if(b&&b!==abs(cs,base)) add(b,"image",owner,{from:"larger version",base:base});
          ["data-src","data-original","data-lazy-src","data-full","data-large"].forEach(function(a){ var v=attr(el,a); if(v&&!/^data:image\/gif/.test(v)) add(v,"image",owner,{from:"picture",base:base}); });
        } else if(t==="SOURCE"){ var p=up(el), pt=p?tagOf(p).toUpperCase():"";
          if(attr(el,"src")) add(attr(el,"src"),pt==="AUDIO"?"audio":pt==="VIDEO"?"video":"",owner,{from:pt.toLowerCase()||"source",base:base});
          if(attr(el,"srcset")){ var b2=srcsetBest(attr(el,"srcset"),base); if(b2) add(b2,"image",owner,{from:"larger version",base:base}); }
        } else if(t==="VIDEO"||t==="AUDIO"){ var k=t.toLowerCase(), u=el.currentSrc||attr(el,"src");
          if(u) add(u,k,owner,{from:k+" player",base:base,w:el.videoWidth||0,h:el.videoHeight||0});
          if(t==="VIDEO"&&attr(el,"poster")) add(attr(el,"poster"),"image",owner,{from:"video cover",base:base});
        } else if(t==="SVG"&&!(up(el)&&tagOf(up(el)).toUpperCase()==="SVG")){ var r=rectOf(el); if(r.width>=16&&r.height>=16) add("", "image", owner, {svg:el,w:Math.round(r.width),h:Math.round(r.height),from:"drawing (SVG)"});
        } else if(t==="IMAGE"){ var h=attr(el,"href")||attr(el,"xlink:href"); if(h) add(h,"image",owner,{from:"drawing (SVG)",base:base});
        } else if(t==="A"){ var hr=attr(el,"href"); if(hr&&(IMG.test(hr)||AUD.test(hr)||VID.test(hr)||STR.test(hr))) add(hr,"",owner,{from:"link",base:base});
        } else if(t==="LINK"){ var rel=attr(el,"rel").toLowerCase(), as=attr(el,"as").toLowerCase();
          if(/icon|image_src/.test(rel)) add(attr(el,"href"),"image",owner,{from:"site icon",base:base});
          else if(rel==="preload"&&/^(image|audio|video)$/.test(as)) add(attr(el,"href"),as,owner,{from:"preloaded",base:base});
        } else if(t==="META"){ var pr=(attr(el,"property")||attr(el,"name")).toLowerCase();
          if(/^(og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src)$/.test(pr)) add(attr(el,"content"),"image",null,{from:"share image",base:base});
          else if(/^(og:audio|og:audio:url|og:audio:secure_url)$/.test(pr)) add(attr(el,"content"),"audio",null,{from:"share audio",base:base});
          else if(/^(og:video|og:video:url|og:video:secure_url|twitter:player:stream)$/.test(pr)) add(attr(el,"content"),"video",null,{from:"share video",base:base});
        } else if(t==="EMBED"||t==="OBJECT"){ var s=attr(el,"src")||attr(el,"data"); if(s) add(s,"",owner,{from:"embedded",base:base}); }
        if(t!=="IFRAME"&&t!=="SCRIPT"&&t!=="STYLE"&&t!=="LINK"&&t!=="META"&&t!=="HEAD"&&!(el.namespaceURI===SVGNS&&t!=="SVG")){
          var vw=doc.defaultView||W;
          [null,"::before","::after"].forEach(function(ps){ var cs2=vw.getComputedStyle(el,ps), bi=cs2.backgroundImage;
            if(bi&&bi!=="none") cssUrls(bi).forEach(function(cu){ add(cu,"image",owner,{from:"background",base:base}); });
            if(ps){ var ct=cs2.content; if(ct&&ct!=="none"&&ct!=="normal") cssUrls(ct).forEach(function(cu){ add(cu,"image",owner,{from:"background",base:base}); }); }
          });
        }
        if(t==="IFRAME"){ try{ var fd=el.contentDocument; if(fd&&fd.documentElement) scanDoc(fd,el); }catch(_){} }
      }catch(_){}
    });
  }
  var PAINT=["fill","stroke","stroke-width","stroke-opacity","fill-opacity","opacity","color","font-family","font-size","font-weight","stop-color"];
  var DEFS="symbol,defs,pattern,marker,clipPath,mask,linearGradient,radialGradient,filter";
  function svgStr(el,lite){
    var c=el.cloneNode(true), os=[el].concat([].slice.call(el.querySelectorAll("*"))), cl=[c].concat([].slice.call(c.querySelectorAll("*")));
    var vw=el.ownerDocument.defaultView||W;
    // The page's colours are written onto the copy, but only where they change, so shapes reused by <use> still inherit theirs.
    if(!lite&&os.length<=4000){ var vals=new Map();
      for(var i=0;i<os.length&&i<cl.length;i++){ try{ var cs=vw.getComputedStyle(os[i]), mine={}; PAINT.forEach(function(p){ mine[p]=cs.getPropertyValue(p); }); vals.set(os[i],mine);
        if(i&&os[i].closest(DEFS)) continue;
        var par=i?vals.get(os[i].parentNode):null;
        PAINT.forEach(function(p){ var v=mine[p]; if(v&&(!par||par[p]!==v)) cl[i].setAttribute(p,v); }); }catch(_){} } }
    var rn=el.getRootNode?el.getRootNode():el.ownerDocument, seen=O(), defs=null, todo=[c], guard=0;
    if(!/(href="#|url\(\s*(?:&quot;|['"])?#)/.test(new XMLSerializer().serializeToString(c))) todo=[];
    while(todo.length&&guard<300){ var n0=todo.shift(), all=[n0].concat([].slice.call(n0.querySelectorAll("*")));
      all.forEach(function(x){ ["href","xlink:href","fill","stroke","clip-path","mask","filter","marker-start","marker-mid","marker-end","style"].forEach(function(a){
        var v=x.getAttribute(a)||"", re=/(?:^#|url\(\s*['"]?#)([^'")\s]+)/g, m;
        while((m=re.exec(v))){ var id=m[1]; if(seen[id]) continue; seen[id]=1; guard++;
          try{ if(c.querySelector('[id="'+id.replace(/["\\]/g,"\\$&")+'"]')) continue; }catch(_){}
          var ref=rn.getElementById?rn.getElementById(id):el.ownerDocument.getElementById(id); if(!ref) continue;
          var rc=ref.cloneNode(true); if(!defs){ defs=el.ownerDocument.createElementNS(SVGNS,"defs"); c.insertBefore(defs,c.firstChild); } defs.appendChild(rc); todo.push(rc); } }); }); }
    if(!c.getAttribute("width")||!c.getAttribute("height")){ try{ var r=rectOf(el); if(r.width&&r.height){ c.setAttribute("width",Math.round(r.width)); c.setAttribute("height",Math.round(r.height)); } }catch(_){} }
    var s=new XMLSerializer().serializeToString(c); if(!/^<svg[^>]*xmlns=/.test(s)) s=s.replace(/^<svg/,'<svg xmlns="'+SVGNS+'"'); return s;
  }
  function scanPerf(){
    try{ (performance.getEntriesByType("resource")||[]).forEach(function(en){
      var u=en.name, k=kindOf(u,""), it;
      if(k==="other"&&/^(img|image|audio|video)$/.test(en.initiatorType||"")) k=en.initiatorType==="img"?"image":en.initiatorType;
      if(k==="other") return;
      it=byKey[abs(u)]||add(u,k,null,{from:"loaded by the page"});
      if(it){ var sz=en.encodedBodySize||en.transferSize||0; if(sz>it.size) it.size=sz; }
    }); }catch(_){}
  }
  function uniq(n,used){ var sp=splitExt(n), x=sp[1]?"."+sp[1]:"", k=2, out=n; while(used[out.toLowerCase()]) out=sp[0]+"-"+(k++)+x; used[out.toLowerCase()]=1; return out; }
  function scan(){ var old=byKey; items=[]; byKey=O(); svgN=0; scanDoc(d,null); scanPerf();
    items=items.filter(function(it){ return it.svg||(it.url&&!/^data:image\/gif;base64,R0lGOD/i.test(it.url)); });
    var used=O();
    items.forEach(function(it){ var o=old[it.key]; if(o&&!o.svg){ if(o.typed){ it.name=o.name; it.typed=true; used[it.name.toLowerCase()]=1; } if(o.fail) it.fail=o.fail; if(o.ms) it.ms=true; if(o.size&&!it.size) it.size=o.size; } });
    items.forEach(function(it,i){ if(!it.typed) it.name=uniq(baseName(it,i),used); }); }

  /* ---------- panel ---------- */
  var host=d.createElement("div"); host.setAttribute("data-iq-grabber","");
  host.style.cssText="all:initial !important;position:fixed !important;inset:0 !important;width:0 !important;height:0 !important;overflow:visible !important;pointer-events:none !important;z-index:2147483647 !important;display:block !important;background:transparent !important;border:0 !important;padding:0 !important;margin:0 !important;transform:none !important;filter:none !important;zoom:1 !important";
  var sh=host.attachShadow({mode:"closed"});
  var CSS=":host{all:initial}*{box-sizing:border-box}"+
    ".p{position:fixed;top:8px;right:8px;bottom:8px;width:min(440px,calc(100vw - 16px));pointer-events:auto;background:#03140a;color:#c9fbd9;border:1px solid #5fe08c;font:13px/1.4 ui-monospace,Consolas,Menlo,monospace;box-shadow:0 8px 28px rgba(0,0,0,.6);display:flex;flex-direction:column;z-index:2;text-align:left;letter-spacing:0;text-transform:none}"+
    ".p.left{right:auto;left:8px}"+
    ".hd{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #1d5a33}"+
    ".t{font-weight:bold;color:#5fe08c;margin-right:auto}"+
    ".fl{display:flex;gap:4px;flex-wrap:wrap;align-items:center;padding:6px 10px;border-bottom:1px solid #1d5a33}"+
    ".fl label{font-size:12px;color:#8fc9a3;display:flex;gap:4px;align-items:center;cursor:pointer}"+
    "input[type=search],input.nm{font:inherit;font-size:12px;color:#c9fbd9;background:#000;border:1px solid #2f9a57;padding:3px 6px;min-width:0;border-radius:0;margin:0;height:auto;width:auto}"+
    "input[type=search]{flex:1 1 120px}"+
    "input[type=checkbox]{margin:0;accent-color:#5fe08c;width:14px;height:14px}"+
    "button{font:inherit;font-size:12px;line-height:1.3;color:#03140a;background:#5fe08c;border:1px solid #5fe08c;padding:3px 8px;cursor:pointer;margin:0;border-radius:0;text-transform:none;min-height:0;width:auto}"+
    "button.o{background:transparent;color:#5fe08c}button.c[aria-pressed=true]{background:#5fe08c;color:#03140a}button:disabled{opacity:.45;cursor:default}"+
    "button:focus-visible,input:focus-visible{outline:2px solid #c9fbd9;outline-offset:1px}"+
    ".ls{flex:1;overflow:auto;overscroll-behavior:contain;padding:4px 0}"+
    ".r{display:grid;grid-template-columns:20px 72px 1fr;gap:6px 8px;padding:8px 10px;border-bottom:1px solid #12331f;align-items:start}"+
    ".r.hl{background:#0b2a17}"+
    ".th{width:72px;height:72px;background:#fff center/contain no-repeat;border:1px solid #2f9a57;display:flex;align-items:center;justify-content:center;color:#03140a;font-size:22px;overflow:hidden}"+
    ".th img,.th video{max-width:100%;max-height:100%;display:block}"+
    ".in{min-width:0;display:flex;flex-direction:column;gap:4px}"+
    ".mt{font-size:11px;color:#8fc9a3;overflow-wrap:anywhere}.mt b{color:#5fe08c;text-transform:uppercase}"+
    ".u{font-size:11px;color:#6fae86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
    ".nm{width:100%}"+
    ".bt{display:flex;gap:4px;flex-wrap:wrap}"+
    ".w{font-size:11px;color:#ffcf6b}"+
    "audio{width:100%;height:28px}"+
    ".ft{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-top:1px solid #1d5a33}"+
    ".m{font-size:12px;color:#c9fbd9;min-height:1em;flex:1 1 100%}"+
    ".e{padding:16px 10px;color:#8fc9a3}"+
    ".cb{flex:1 1 100%;width:100%;font:11px/1.4 ui-monospace,Consolas,Menlo,monospace;color:#c9fbd9;background:#000;border:1px solid #2f9a57;padding:4px 6px;display:none;resize:vertical;margin:0;border-radius:0}"+
    ".cat{position:fixed;inset:0;pointer-events:auto;cursor:crosshair;background:transparent;display:none;z-index:1}"+
    ".box{position:fixed;pointer-events:none;border:2px solid #5fe08c;background:rgba(95,224,140,.16);display:none;z-index:1}"+
    ".tip{position:fixed;left:50%;top:10px;transform:translateX(-50%);pointer-events:none;background:#5fe08c;color:#03140a;font:12px/1.4 ui-monospace,Consolas,Menlo,monospace;padding:4px 10px;display:none;z-index:3}";
  try{ var sheet=new CSSStyleSheet(); sheet.replaceSync(CSS); sh.adoptedStyleSheets=[sheet]; }catch(_){ var st=d.createElement("style"); st.textContent=CSS; sh.appendChild(st); }
  function mk(t,cls,txt,at){ var e=d.createElement(t); if(cls) e.className=cls; if(txt) e.textContent=txt; if(at) for(var a in at) e.setAttribute(a,at[a]); return e; }
  var cat=mk("div","cat"), box=mk("div","box"), tip=mk("div","tip","Point at something on the page and click it. Esc cancels."), P=mk("div","p","",{role:"dialog","aria-label":"GRABBER"});
  var hd=mk("div","hd"), ttl=mk("span","t","GRABBER:_"), bPick=mk("button","","Pick on page",{type:"button",title:"Point at something on the page to see just its files"}), bScan=mk("button","o","Rescan",{type:"button",title:"Look again (after scrolling or playing something)"}), bSide=mk("button","o","⇆",{type:"button",title:"Move this panel to the other side"}), bX=mk("button","o","Close",{type:"button",title:"Close GRABBER (Esc)"});
  [ttl,bPick,bScan,bSide,bX].forEach(function(x){ hd.appendChild(x); });
  var fl=mk("div","fl"), chips={}, kinds=[["all","All"],["image","Images"],["audio","Audio"],["video","Video"],["other","Other"]];
  kinds.forEach(function(k){ var b=mk("button","o c",k[1],{type:"button","data-k":k[0],"aria-pressed":k[0]==="all"?"true":"false"}); chips[k[0]]=b; fl.appendChild(b); });
  var q=mk("input","","",{type:"search",placeholder:"Search name or address","aria-label":"Search"}), smallL=mk("label"), small=mk("input","","",{type:"checkbox"}); small.checked=true; smallL.appendChild(small); smallL.appendChild(d.createTextNode("Hide tiny"));
  fl.appendChild(q); fl.appendChild(smallL);
  var pickInfo=mk("div","fl"); pickInfo.style.display="none"; var piT=mk("span","","",{}), piAll=mk("button","o","Show all",{type:"button"}); piT.style.cssText="font-size:12px;color:#ffcf6b;flex:1"; pickInfo.appendChild(piT); pickInfo.appendChild(piAll);
  var ls=mk("div","ls"), ft=mk("div","ft"), selAll=mk("button","o","Select all shown",{type:"button"}), bSel=mk("button","","Save selected",{type:"button",disabled:""}), msg=mk("div","m","",{"aria-live":"polite"});
  var bY=mk("button","o","yt-dlp",{type:"button",title:"Copy a yt-dlp command for this page — for streamed video GRABBER can't save itself"}), cmdBox=mk("textarea","cb","",{readonly:"",rows:"3","aria-label":"yt-dlp command",spellcheck:"false"});
  ft.appendChild(selAll); ft.appendChild(bSel); ft.appendChild(bY); ft.appendChild(cmdBox); ft.appendChild(msg);
  [hd,fl,pickInfo,ls,ft].forEach(function(x){ P.appendChild(x); });
  sh.appendChild(cat); sh.appendChild(box); sh.appendChild(tip); sh.appendChild(P);
  var rs=getComputedStyle(root), rootOdd=(rs.transform!=="none"||rs.filter!=="none"||rs.perspective!=="none"||/paint|layout|strict|content/.test(rs.contain||""));
  try{ host.popover="manual"; }catch(_){}
  // A page dialog opened as a modal makes everything outside it unclickable, so GRABBER sits inside the topmost one.
  var mseen=[];
  function isModal(x){ try{ return !!x&&tagOf(x).toUpperCase()==="DIALOG"&&conn(x)&&x.matches(":modal"); }catch(_){ return false; } }
  function focusModal(){ var a=d.activeElement, n=0; if(a===host) return null; while(a&&n<30){ var sr=shadowOf(a); if(!sr||!sr.activeElement) break; a=sr.activeElement; n++; }
    for(n=0;a&&n<200;n++){ if(isModal(a)) return a; a=up(a); } return null; }
  function home(){
    var cur=gPar.call(host);
    if(d.activeElement===host&&isModal(cur)) return cur;
    var f=focusModal(); if(f){ if(mseen.indexOf(f)<0) mseen.push(f); return f; }
    try{ [].slice.call(d.querySelectorAll("dialog:modal")).forEach(function(x){ if(mseen.indexOf(x)<0) mseen.push(x); }); }catch(_){}
    if(isModal(cur)&&mseen.indexOf(cur)<0) mseen.push(cur);
    mseen=mseen.filter(isModal); return mseen.length?mseen[mseen.length-1]:(rootOdd?d.body:root); }
  var mo=null; try{ mo=new MutationObserver(function(){ if(!dead) place(); }); }catch(_){}
  // Remember what had focus in the panel, so it gets it back if the page throws GRABBER out of its dialog (lightboxes that rebuild themselves).
  var pf=null;
  function place(){ var h=home(), was=conn(host); if(gPar.call(host)===h&&was) return;
    var x=W.scrollX, y=W.scrollY, fe=sh.activeElement||(was?null:pf), s0=null, s1=null; try{ if(fe&&fe.select){ s0=fe.selectionStart; s1=fe.selectionEnd; } }catch(_){}
    try{ host.hidePopover(); }catch(_){} h.appendChild(host); try{ host.showPopover(); }catch(_){}
    if(W.scrollX!==x||W.scrollY!==y) W.scrollTo(x,y);
    if(fe&&fe!==sh.activeElement){ try{ fe.focus({preventScroll:true}); if(s0!=null) fe.setSelectionRange(s0,s1); }catch(_){} }
    if(mo){ mo.disconnect(); try{ mo.observe(h,{childList:true}); mo.observe(root,{subtree:true,attributes:true,attributeFilter:["open"]}); }catch(_){} } }
  function raise(){ if(dead) return; try{ host.hidePopover(); host.showPopover(); }catch(_){} }
  var dead=false;
  place(); var watch=setInterval(place,400); d.addEventListener("fullscreenchange",raise);
  var kz=1; (function(){ box.style.cssText="display:block;left:0;top:0;width:100px;height:10px;visibility:hidden"; var w=box.getBoundingClientRect().width; box.style.cssText=""; kz=w>0?w/100:1; })();

  var kind="all", picked=null, sel=O(), urls=[], msgT=0, hlT=0, qT=0, side="right", busy=false, limit=200, rowOf=O(), thumbs=new WeakMap();
  var ac=null; try{ ac=new AbortController(); }catch(_){}
  function say(t){ if(dead) return; msg.textContent=t||""; clearTimeout(msgT); if(t) msgT=setTimeout(function(){ msg.textContent=""; },7000); }
  function fmtSize(n){ return !n?"":n<1024?n+" B":n<1048576?(n/1024).toFixed(n<10240?1:0)+" KB":(n/1048576).toFixed(1)+" MB"; }
  function extOf(u){ var m=/\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(String(u).split(/[?#]/)[0]); return m?m[1].toLowerCase():""; }
  function baseName(it,i){
    if(it.svg) return "drawing-"+(i+1)+".svg";
    if(/^data:/i.test(it.url)){ var mm=/^data:([^;,]+)/i.exec(it.url), mx=MIMEX[(mm&&mm[1]||"").toLowerCase()]; return it.kind+"-"+(i+1)+(mx?"."+mx:""); }
    if(/^blob:/i.test(it.url)) return it.kind+"-"+(i+1);
    var path=""; try{ path=new URL(it.url).pathname.split("/").pop()||""; }catch(_){} try{ path=decodeURIComponent(path); }catch(_){}
    path=path.replace(/[\\/:*?"<>|\u0000-\u001f]+/g,"-").replace(/[. ]+$/,"").slice(0,120);
    if(!splitExt(path)[1]) path=path.replace(/\.(php\d?|aspx?|jsp|cgi|pl|py|do|ashx|axd)$/i,"");
    return path||it.kind+"-"+(i+1);
  }
  function shown(){
    var qq=q.value.trim().toLowerCase();
    return items.filter(function(it){
      if(picked&&picked.indexOf(it)<0) return false;
      if(kind!=="all"&&!(kind==="other"?(it.kind==="other"||it.kind==="stream"):it.kind===kind)) return false;
      if(small.checked&&it.kind==="image"&&it.w&&it.h&&it.w<48&&it.h<48&&!picked) return false;
      if(qq&&(it.url+" "+(it.name||"")).toLowerCase().indexOf(qq)<0) return false;
      return true; });
  }
  function counts(){ var c={all:0,image:0,audio:0,video:0,other:0}; items.forEach(function(it){ if(picked&&picked.indexOf(it)<0) return; c.all++; c[it.kind==="stream"?"other":(c[it.kind]!==undefined?it.kind:"other")]++; }); kinds.forEach(function(k){ chips[k[0]].textContent=k[1]+" "+c[k[0]]; chips[k[0]].setAttribute("aria-pressed",String(kind===k[0])); }); }
  function updSel(){ var n=Object.keys(sel).filter(function(k){ return sel[k]; }).length; bSel.textContent=busy?"Saving…":"Save selected"+(n?" ("+n+")":""); if(n&&!busy) bSel.removeAttribute("disabled"); else bSel.setAttribute("disabled",""); if(busy) bScan.setAttribute("disabled",""); else bScan.removeAttribute("disabled"); }
  function noSave(it){ return it.kind==="stream"||it.ms; }
  function paintWarn(it){ var r=rowOf[it.key]; if(!r) return; var w=r.querySelector(".w"); while(w.firstChild) w.removeChild(w.firstChild);
    var sb=r.querySelector(".bt button"), cb=r.querySelector("input[type=checkbox]");
    if(it.kind==="stream"||it.ms){ w.appendChild(d.createTextNode(it.kind==="stream"?"Streaming playlist — the video comes in many small pieces, so GRABBER can't save it as one file. yt-dlp can: ":"Streamed by the player — it isn't one file, so GRABBER can't save it. yt-dlp can: "));
      var yb=mk("button","","Copy yt-dlp command",{type:"button",title:"Copies a command that downloads this page's video with yt-dlp, using your name"}); yb.addEventListener("click",function(){ ytCopy(it); }); w.appendChild(yb); }
    else if(it.fail==="bad") w.textContent="This file's data is damaged, so it can't be saved.";
    else if(it.fail&&it.fail.indexOf("http")===0) w.textContent="The website didn't send this file (error "+it.fail.slice(5)+"). It may have moved — try Rescan.";
    else if(it.fail==="cors"){ w.appendChild(d.createTextNode("This site won't let GRABBER save it directly. "));
      var bb=mk("button","","Open + copy name",{type:"button",title:"Opens the file in a new tab and copies your file name: press Ctrl+S there and paste the name"}); bb.addEventListener("click",function(){ openIt(it,true); }); w.appendChild(bb); }
    if(noSave(it)){ sb.setAttribute("disabled",""); cb.checked=false; cb.disabled=true; sel[it.key]=false; } }
  function render(){
    counts(); while(ls.firstChild) ls.removeChild(ls.firstChild); rowOf=O(); limit=200;
    var L=shown();
    if(!L.length){ ls.appendChild(mk("div","e",items.length?"Nothing matches. Try All, or untick Hide tiny.":"No images, audio or video found on this page yet. Play or scroll to load more, then Rescan.")); updSel(); return; }
    addRows(L,0); updSel();
  }
  function addRows(L,from){
    var old=ls.querySelector(".more"); if(old) old.remove();
    L.slice(from,limit).forEach(function(it){ ls.appendChild(row(it)); });
    if(L.length>limit){ var mb=mk("button","o more","Show more ("+(L.length-limit)+" left)",{type:"button"}); mb.style.margin="8px 10px"; mb.addEventListener("click",function(){ var f=limit; limit+=200; addRows(L,f); }); ls.appendChild(mb); }
  }
  function row(it){
      var r=mk("div","r"), cb=mk("input","","",{type:"checkbox","aria-label":"Select"}); cb.checked=!!sel[it.key]; cb.addEventListener("change",function(){ sel[it.key]=cb.checked; updSel(); });
      var th=mk("div","th");
      if(it.kind==="image"){ var im=d.createElement("img"); im.alt=""; im.loading="lazy"; im.decoding="async"; im.referrerPolicy="no-referrer-when-downgrade";
        im.addEventListener("load",function(){ if(!it.w&&im.naturalWidth){ it.w=im.naturalWidth; it.h=im.naturalHeight; mt.textContent=""; meta(); } });
        if(it.svg){ try{ var tu=thumbs.get(it.svg); if(!tu){ tu=URL.createObjectURL(new Blob([svgStr(it.svg,true)],{type:"image/svg+xml"})); urls.push(tu); thumbs.set(it.svg,tu); } im.src=tu; }catch(_){} }
        else im.src=it.url; th.appendChild(im); }
      else if(it.kind==="video"){ th.textContent="▶"; th.style.background="#0b2a17"; th.style.color="#5fe08c"; }
      else if(it.kind==="audio"){ th.textContent="♪"; th.style.background="#0b2a17"; th.style.color="#5fe08c"; }
      else { th.textContent="?"; th.style.background="#0b2a17"; th.style.color="#5fe08c"; }
      var inn=mk("div","in"), mt=mk("div","mt"), u=mk("div","u",it.svg?"(drawn on the page)":it.url,{title:it.svg?"":it.url}), nm=mk("input","nm","",{type:"text","aria-label":"File name",spellcheck:"false"});
      nm.value=it.name; nm.addEventListener("input",function(){ it.name=nm.value; it.typed=true; });
      function meta(){ while(mt.firstChild) mt.removeChild(mt.firstChild); mt.appendChild(mk("b","",it.kind==="stream"?"stream":it.kind));
        var bits=[]; if(it.w&&it.h) bits.push(it.w+"×"+it.h); if(it.size) bits.push(fmtSize(it.size)); var e=it.svg?"svg":(/^data:/i.test(it.url)?"":extOf(it.url)); if(e) bits.push(e.toUpperCase()); if(it.from.length) bits.push(it.from.join(", "));
        mt.appendChild(d.createTextNode("  "+bits.join(" · "))); }
      meta();
      var bt=mk("div","bt"), bS=mk("button","","Save",{type:"button"}), bO=mk("button","o","Open",{type:"button",title:"Open the file in a new tab"}), bC=mk("button","o","Copy link",{type:"button"}), bF=mk("button","o","Show",{type:"button",title:"Show where it is on the page"});
      var warn=mk("div","w");
      bS.addEventListener("click",function(){ save(it); });
      bO.addEventListener("click",function(){ openIt(it); });
      bC.addEventListener("click",function(){ copy(it.svg?"":it.url,"Link copied."); });
      bF.addEventListener("click",function(){ showOn(it); });
      if(it.svg) bC.setAttribute("disabled","");
      if(!it.els.some(conn)) bF.setAttribute("disabled","");
      [bS,bO,bC,bF].forEach(function(x){ bt.appendChild(x); });
      [mt,u,nm,bt,warn].forEach(function(x){ inn.appendChild(x); });
      if(it.kind==="audio"&&!/^blob:/i.test(it.url)){ var au=d.createElement("audio"); au.controls=true; au.preload="none"; au.src=it.url; inn.insertBefore(au,nm); }
      r.appendChild(cb); r.appendChild(th); r.appendChild(inn); r._it=it; rowOf[it.key]=r; paintWarn(it);
      return r;
  }
  /* ---------- saving ---------- */
  function cleanName(n,blob,it){
    n=String(n||"").replace(/[\\/:*?"<>|\u0000-\u001f]+/g,"-").trim().replace(/^\.+/,"").replace(/[. ]+$/,"").slice(0,180)||baseName(it,items.indexOf(it));
    if(/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(n)) n="_"+n;
    var ty=(blob&&blob.type||"").split(";")[0].toLowerCase(), mx=MIMEX[ty], sp=splitExt(n);
    if(sp[1]){ if(mx&&/^image\//.test(ty)&&normX(sp[1])!==normX(mx)) n=sp[0]+"."+mx; return n; }
    var ue=extOf(it.url), e=mx||(EXT[ue]?ue:"")||(it.svg?"svg":"")||({image:"jpg",audio:"mp3",video:"mp4"})[it.kind]||"";
    return e?n+"."+e:n;
  }
  function dl(blob,name){ if(dead) return; var u=URL.createObjectURL(blob), a=d.createElement("a"); a.href=u; a.download=name; a.style.display="none"; sh.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); },60000); }
  function dataBlob(u){ var m=/^data:([^,]*),([\s\S]*)$/i.exec(u); if(!m) return null; var meta=m[1], ty=meta.split(";")[0]||"text/plain", body=m[2], arr;
    if(/;base64/i.test(meta)){ try{ body=decodeURIComponent(body); }catch(_){} var bin=atob(body.replace(/\s+/g,"")); arr=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); }
    else { var out=[], te=new TextEncoder();
      body.replace(/%([0-9a-f]{2})|[^%]+|%/gi,function(t,h){ if(h) out.push(parseInt(h,16)); else te.encode(t).forEach(function(b){ out.push(b); }); return ""; });
      arr=new Uint8Array(out); }
    return new Blob([arr],{type:ty}); }
  function getBlob(it){
    var bad=function(){ var er=new Error("damaged"); er.bad=true; return Promise.reject(er); };
    if(it.svg){ try{ return Promise.resolve(new Blob([svgStr(it.svg)],{type:"image/svg+xml"})); }catch(e){ return bad(); } }
    if(/^data:/i.test(it.url)){ try{ var db=dataBlob(it.url); return db&&db.size?Promise.resolve(db):bad(); }catch(e){ return bad(); } }
    var o={credentials:"same-origin",cache:"force-cache"}; if(ac) o.signal=ac.signal;
    return fetch(it.url,o).then(function(r){ if(!r.ok&&r.type!=="opaque"){ var er=new Error("HTTP "+r.status); er.status=r.status; throw er; } return r.blob(); });
  }
  function save(it0,used){
    var cur=function(){ return byKey[it0.key]||it0; };
    if(dead||noSave(it0)) return Promise.resolve(false);
    var name=cleanName(it0.name,null,it0); say("Saving "+name+"…");
    return getBlob(it0).then(function(b){ if(dead) return false; if(!b||!b.size) throw new Error("empty"); var it=cur(); name=cleanName(it.name,b,it); if(used) name=uniq(name,used);
        dl(b,name); if(!it.size) it.size=b.size; it.fail=""; paintWarn(it); say("Saved "+name+" to your downloads."); return true; })
      .catch(function(er){
        if(dead) return false; var it=cur();
        if(er&&er.bad){ it.fail="bad"; paintWarn(it); say("Couldn't save "+name+": its data is damaged."); return false; }
        if(/^blob:/i.test(it.url)){ it.ms=true; paintWarn(it); counts(); updSel(); say("Couldn't save "+name+": it's streamed by the player."); return false; }
        if(er&&er.status){ it.fail="http:"+er.status; paintWarn(it); say("Couldn't save "+name+": the website sent error "+er.status+"."); return false; }
        it.fail="cors"; paintWarn(it);
        say("Couldn't save "+name+" directly — use Open + copy name, then Ctrl+S in the new tab.");
        return false; });
  }
  function copy(t,ok){ if(!t) return; try{ navigator.clipboard.writeText(t).then(function(){ say(ok); },function(){ say("Couldn't copy — your browser blocked it."); }); }catch(_){ say("Couldn't copy."); } }
  function openIt(it,withName){
    var u=it.url;
    if(it.svg||/^data:/i.test(u)){ try{ var bl=it.svg?new Blob([svgStr(it.svg)],{type:"image/svg+xml"}):dataBlob(u); u=URL.createObjectURL(bl); setTimeout(function(){ URL.revokeObjectURL(u); },60000); }catch(_){ return say("Couldn't open it."); } }
    if(!u) return;
    if(withName) copy(cleanName(it.name,null,it),"File name copied — press Ctrl+S in the new tab and paste it (Ctrl+V).");
    var a=d.createElement("a"); a.href=u; a.target="_blank"; a.rel="noopener"; a.style.display="none"; sh.appendChild(a); a.click(); a.remove();
  }
  function saveSelected(){
    if(busy) return;
    var L=items.filter(function(it){ return sel[it.key]&&!noSave(it); }); if(!L.length) return;
    var i=0, ok=0, bad=0, used=O(); busy=true; updSel();
    (function next(){ if(dead) return;
      if(i>=L.length){ busy=false; updSel(); say("Saved "+ok+" of "+L.length+(bad?" — "+bad+" couldn't be saved directly (see the notes in the list).":".")+(ok>1?" If your browser asks, allow multiple downloads.":"")); return; }
      var it=L[i++];
      save(it,used).then(function(r){ if(r) ok++; else bad++; if(!dead) setTimeout(next,350); }); })();
  }
  /* ---------- yt-dlp: for video GRABBER can't save itself ---------- */
  var Y=cfg&&typeof cfg==="object"?cfg:{}, yMac=Y.os?Y.os==="mac":/Mac/i.test(navigator.platform||"");
  var yDir=String(typeof Y.dir==="string"&&Y.dir?Y.dir:(yMac?"~/Downloads":"~\\Downloads")).replace(/["$%`!\u0000-\u001f\u2018-\u201f]/g,"").replace(/[\\/]+$/,"")||(yMac?"~/Downloads":"~\\Downloads");
  // Only the options the TOOLS page itself uses are accepted from the bookmark.
  var YOK={"-S":1,"-x":1,"--audio-format":1,"--audio-quality":1,"--embed-thumbnail":1,"--embed-metadata":1,"--merge-output-format":1,"--remux-video":1,"--write-subs":1,"--write-auto-subs":1,"--sub-langs":1,"--embed-subs":1,"--compat-options":1,"--ignore-errors":1};
  function yArgs(a,d0){ return Array.isArray(a)&&a.length&&a.every(function(x){ return typeof x==="string"&&(x.charAt(0)==="-"?YOK[x]===1:/^[A-Za-z0-9_.:,*+-]+$/.test(x)); })?a:d0; }
  var yV=yArgs(Y.v,["-S","res:1080,vcodec:h264,ext:mp4:m4a","--merge-output-format","mp4","--remux-video","mp4"]), yA=yArgs(Y.a,["-x","--audio-format","mp3","--audio-quality","0"]);
  function yq(x){ x=String(x).replace(/[\u0000-\u001f]/g,""); if(/^[A-Za-z0-9_.:=+\/-]+$/.test(x)) return x; return yMac?"'"+x.replace(/'/g,"'\\''")+"'":'"'+x.replace(/["$`!\u2018-\u201f]/g,"")+'"'; }
  function yName(n){ return String(n||"").replace(/[\\/:*?"<>|$%`!\u0000-\u001f\u2018-\u201f]+/g,"-").replace(/\.(mp4|mkv|webm|mov|mp3|m4a|aac|opus|ogg|wav|flac|m3u8|mpd)$/i,"").trim().replace(/[. -]+$/,"").replace(/^[. -]+/,"").slice(0,150); }
  function yUrl(u){ u=String(u).replace(/(?:%[89a-f][0-9a-f])+/gi,function(r){ try{ return decodeURIComponent(r); }catch(_){ return r; } }).replace(/[\u2018-\u201f]/g,encodeURIComponent);
    return u.replace(/["'`$!\\<>^|\s]/g,function(c){ return c.charCodeAt(0)>127?encodeURIComponent(c):"%"+("0"+c.charCodeAt(0).toString(16).toUpperCase()).slice(-2); }); }
  function ytCmd(it){ var nm=it&&it.typed?yName(it.name):"", a=["yt-dlp"].concat(it&&it.kind==="audio"?yA:yV,["--no-playlist","-P",yDir,"-o",(nm||"%(title)s")+".%(ext)s",yUrl(location.href)]);
    return a.map(function(x,i){ return i?yq(x):x; }).join(" "); }
  function ytCopy(it){ var c=ytCmd(it), help="Paste it into Terminal and press Enter (needs yt-dlp — see GRABBER in inter-q.com/tools).";
    cmdBox.value=c; cmdBox.style.display="block"; try{ cmdBox.focus({preventScroll:true}); cmdBox.select(); }catch(_){}
    try{ navigator.clipboard.writeText(c).then(function(){ say("yt-dlp command copied. "+help); },function(){ say("Press Ctrl+C to copy the command. "+help); }); }catch(_){ say("Press Ctrl+C to copy the command. "+help); } }
  bY.addEventListener("click",function(){ ytCopy(null); });
  /* ---------- on the page ---------- */
  function drawBox(el){ try{ var r=rectOf(el); drawRect(r); }catch(_){ box.style.display="none"; } }
  function drawRect(r){ box.style.display="block"; box.style.left=r.left/kz+"px"; box.style.top=r.top/kz+"px"; box.style.width=Math.max(r.width,4)/kz+"px"; box.style.height=Math.max(r.height,4)/kz+"px"; }
  function vis(el){ try{ var r=rectOf(el); if(!(r.width>0&&r.height>0)) return false; if(el.checkVisibility) return el.checkVisibility({opacityProperty:true,visibilityProperty:true}); var cs=getComputedStyle(el); return cs.visibility!=="hidden"&&cs.display!=="none"; }catch(_){ return false; } }
  // The part of the item you can actually see: cut down by the window and by any box around it that hides overflow (slideshows, scrolling panels).
  function seen(el){ var r=rectOf(el), L=r.left, T=r.top, R=r.right, B=r.bottom, a=up(el), n=0;
    while(a&&a!==root&&n<60){ try{ var cs=getComputedStyle(a); if(cs.overflowX!=="visible"||cs.overflowY!=="visible"||cs.overflow==="clip"){ var q=rectOf(a); L=Math.max(L,q.left); T=Math.max(T,q.top); R=Math.min(R,q.right); B=Math.min(B,q.bottom); } }catch(_){} a=up(a); n++; }
    L=Math.max(L,0); T=Math.max(T,0); R=Math.min(R,W.innerWidth*kz); B=Math.min(B,W.innerHeight*kz);
    return R-L>2&&B-T>2?{left:L,top:T,width:R-L,height:B-T,right:R,bottom:B}:null; }
  function showOn(it){
    var all=it.els.filter(conn), el=all.filter(vis)[0];
    if(!el){ // a closed "more" section: open it
      for(var i=0;i<all.length&&!el;i++){ var a=up(all[i]), opened=false; while(a){ if(tagOf(a).toUpperCase()==="DETAILS"&&!a.open){ a.open=true; opened=true; } a=up(a); } if(opened&&vis(all[i])) el=all[i]; } }
    clearTimeout(hlT); box.style.display="none";
    if(!el){ say("It's on the page but hidden right now — in a menu, a slideshow, or a version of the page for another screen size."); return; }
    try{ el.scrollIntoView({block:"center",inline:"nearest"}); }catch(_){ try{ el.scrollIntoView(); }catch(__){} }
    var v=seen(el);
    if(!v){ say("Found it, but it's hidden right now — probably another slide in a slideshow or out of view in a scrolling box."); return; }
    var pr=P.getBoundingClientRect(); if(v.right>pr.left*kz&&v.left<pr.right*kz&&v.bottom>pr.top*kz){ side=side==="right"?"left":"right"; P.classList.toggle("left",side==="left"); say("Moved the panel so you can see it. ⇆ moves it back."); }
    else say("Outlined on the page.");
    var t0=Date.now(); (function f(){ var w=seen(el); if(w) drawRect(w); else box.style.display="none"; if(Date.now()-t0<2500) hlT=setTimeout(f,50); else box.style.display="none"; })();
  }
  var pickOn=false, pcur=null;
  function under(x,y){ cat.style.pointerEvents="none"; P.style.visibility="hidden"; try{ var el=d.elementFromPoint(x,y), sr; while(el&&el!==host&&(sr=shadowOf(el))){ var inn=sr.elementFromPoint(x,y); if(!inn||inn===el) break; el=inn; } return el; } finally { cat.style.pointerEvents="auto"; P.style.visibility=""; } }
  function startPick(){ pickOn=true; cat.style.display="block"; tip.style.display="block"; P.style.opacity=".35"; bPick.textContent="Cancel pick"; }
  function endPick(){ pickOn=false; pcur=null; cat.style.display="none"; tip.style.display="none"; box.style.display="none"; P.style.opacity=""; bPick.textContent="Pick on page"; }
  cat.addEventListener("mousemove",function(e){ e.stopPropagation(); var el=under(e.clientX,e.clientY); pcur=(el&&el!==host&&el!==root&&el!==d.body)?el:null; if(pcur) drawBox(pcur); else box.style.display="none"; });
  ["mousedown","mouseup","pointerdown","pointerup","dblclick","auxclick","contextmenu","dragstart"].forEach(function(t){ cat.addEventListener(t,function(e){ e.preventDefault(); e.stopPropagation(); }); });
  function canScroll(el,dx,dy){ try{ var cs=getComputedStyle(el), ov=/(auto|scroll|overlay)/;
      if(dy&&ov.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight-1)) return true;
      if(dx&&ov.test(cs.overflowX)&&el.scrollWidth>el.clientWidth+1) return true; }catch(_){} return false; }
  cat.addEventListener("wheel",function(e){ if(e.ctrlKey) return; e.preventDefault(); e.stopPropagation();
    var f=e.deltaMode===1?16:e.deltaMode===2?W.innerHeight:1, dx=e.deltaX*f, dy=e.deltaY*f, el=under(e.clientX,e.clientY);
    while(el&&el!==d.body&&el!==root&&!canScroll(el,dx,dy)) el=up(el);
    if(el&&el!==d.body&&el!==root) el.scrollBy(dx,dy); else W.scrollBy(dx,dy);
    setTimeout(function(){ if(!pickOn) return; var n=under(e.clientX,e.clientY); pcur=(n&&n!==host&&n!==root&&n!==d.body)?n:null; if(pcur) drawBox(pcur); else box.style.display="none"; },60); },{passive:false});
  cat.addEventListener("click",function(e){ e.preventDefault(); e.stopPropagation(); var el=under(e.clientX,e.clientY); if(!el||el===host||el===root||el===d.body) el=pcur; endPick(); if(!el) return;
    var found=items.filter(function(it){ return it.els.some(function(x){ if(x===el) return true; try{ return N.contains.call(el,x)||(x.getRootNode&&x.getRootNode().host&&N.contains.call(el,x.getRootNode().host)); }catch(_){ return false; } }); });
    var a=up(el), n=0; while(!found.length&&a&&a!==d.body&&n<3){ found=items.filter(function(it){ return it.els.indexOf(a)>=0; }); a=up(a); n++; }
    picked=found; kind="all"; pickInfo.style.display="flex"; piT.textContent=found.length?"Showing "+found.length+" file"+(found.length>1?"s":"")+" from the part you picked.":"Nothing to save in the part you picked.";
    render(); });
  function clearPick(){ picked=null; pickInfo.style.display="none"; render(); }
  /* ---------- wiring ---------- */
  hd.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b||b.disabled) return;
    if(b===bX) stop(); else if(b===bScan){ scan(); sel=O(); picked=null; pickInfo.style.display="none"; render(); say("Found "+items.length+" file"+(items.length===1?"":"s")+"."); }
    else if(b===bPick){ if(pickOn) endPick(); else startPick(); }
    else if(b===bSide){ side=side==="right"?"left":"right"; P.classList.toggle("left",side==="left"); } });
  fl.addEventListener("click",function(e){ var b=e.target.closest("button[data-k]"); if(!b) return; kind=b.getAttribute("data-k"); render(); });
  q.addEventListener("input",function(){ clearTimeout(qT); qT=setTimeout(render,150); }); small.addEventListener("change",render);
  piAll.addEventListener("click",clearPick);
  selAll.addEventListener("click",function(){ var R=[].slice.call(ls.querySelectorAll(".r")).filter(function(r){ return !noSave(r._it); }), all=R.length&&R.every(function(r){ return sel[r._it.key]; });
    R.forEach(function(r){ sel[r._it.key]=!all; var c=r.querySelector("input[type=checkbox]"); if(c) c.checked=!all; }); updSel(); });
  bSel.addEventListener("click",saveSelected);
  ["keydown","keyup","keypress","input","beforeinput","paste","copy","cut","wheel","mousedown","mouseup","click","pointerdown","pointerup","touchstart","focusin","focusout"].forEach(function(t){ P.addEventListener(t,function(e){ e.stopPropagation(); },t==="wheel"||t==="touchstart"?{passive:true}:false); });
  // Keys typed in the panel are kept away from the page, so its shortcuts don't fire while you name a file.
  function inPanel(e){ try{ return (e.composedPath?e.composedPath():[]).indexOf(host)>=0; }catch(_){ return false; } }
  function onKey(e){
    if(e.isComposing||e.keyCode===229) return;
    if(inPanel(e)){ if(e.type==="keydown"&&e.key==="Escape"){ e.preventDefault(); if(pickOn) endPick(); else stop(); } e.stopImmediatePropagation(); return; }
    if(pickOn&&e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); if(e.type==="keydown") endPick(); }
  }
  // Esc on the page closes GRABBER too, unless the page used it for something of its own (closing its own popup, say).
  function pageOverlay(){ try{ if(d.querySelector("dialog[open]")) return true; }catch(_){} try{ var po=d.querySelectorAll(":popover-open"); for(var i=0;i<po.length;i++) if(po[i]!==host) return true; }catch(_){} return false; }
  function onKeyLate(e){ if(e.key!=="Escape"||e.defaultPrevented||e.isComposing||e.keyCode===229||inPanel(e)) return;
    var t=null; try{ t=e.composedPath()[0]; }catch(_){} t=t||e.target;
    if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(tagOf(t).toUpperCase()))) return;
    if(pageOverlay()) return; stop(); }
  function guardFocus(e){ if(!inPanel(e)) return; e.stopImmediatePropagation();
    if(e.type==="focusin") pf=sh.activeElement; else setTimeout(function(){ if(conn(host)&&!sh.activeElement) pf=null; },0); }
  function stop(){ if(dead) return; dead=true; busy=false; try{ ac&&ac.abort(); }catch(_){} clearInterval(watch); try{ mo&&mo.disconnect(); }catch(_){} d.removeEventListener("fullscreenchange",raise);
    ["focusin","focusout"].forEach(function(t){ W.removeEventListener(t,guardFocus,true); });
    ["keydown","keyup","keypress"].forEach(function(t){ W.removeEventListener(t,onKey,true); }); W.removeEventListener("keydown",onKeyLate,false);
    clearTimeout(msgT); clearTimeout(hlT); clearTimeout(qT); urls.forEach(function(u){ try{ URL.revokeObjectURL(u); }catch(_){} });
    [].slice.call(sh.querySelectorAll("audio")).forEach(function(a){ try{ a.pause(); a.removeAttribute("src"); a.load(); }catch(_){} });
    try{ host.hidePopover(); }catch(_){} host.remove(); try{ delete W.__iqGrabber; }catch(_){ W.__iqGrabber=undefined; } }
  ["keydown","keyup","keypress"].forEach(function(t){ W.addEventListener(t,onKey,true); }); W.addEventListener("keydown",onKeyLate,false);
  ["focusin","focusout"].forEach(function(t){ W.addEventListener(t,guardFocus,true); });
  W.__iqGrabber={stop:stop,scan:function(){ scan(); render(); return items.length; },items:function(){ return items; }};
  scan(); render();
  say(items.length?"Found "+items.length+" file"+(items.length===1?"":"s")+". Name a file, then Save. Pick on page shows just one part.":"");
}
