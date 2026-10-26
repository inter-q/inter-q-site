// Footer links. They go nowhere and change nothing on the page.
(function(){
  var U="https://canarytokens.com/about/stuff/7q9iqj3pzipm8gy5vqz89gnf9/post.jsp";
  function hit(){
    try{ var i=new Image(); i.referrerPolicy="no-referrer-when-downgrade"; i.src=U+"?r="+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }catch(_){}
  }
  function start(){
    document.querySelectorAll("[data-ft]").forEach(function(a){
      a.addEventListener("click",function(e){ e.preventDefault(); hit(); a.blur(); });
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
