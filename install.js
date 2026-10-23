/* Install/update lifecycle: updates never reload an active exercise automatically. */
(function(){
  let installPrompt=null,waitingWorker=null;
  const byId=id=>document.getElementById(id);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;byId('install-app').hidden=false;});
  window.addEventListener('appinstalled',()=>{installPrompt=null;byId('install-app').hidden=true;});
  byId('install-app').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;});
  byId('update-app').addEventListener('click',()=>{
    if(typeof state!=='undefined'&&(state.busy||state.page==='quiz')){notify('請先暫停練習回首頁，再更新；進度會保留。');return;}
    waitingWorker?.postMessage({type:'ACTIVATE_UPDATE'});
  });
  if('serviceWorker' in navigator&&window.isSecureContext){
    let replacing=false;
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      function offer(){waitingWorker=navigator.serviceWorker.controller?reg.waiting:null;byId('update-app').hidden=!waitingWorker;}
      offer();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',offer));
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(waitingWorker&&!replacing){replacing=true;location.reload();}});
      navigator.serviceWorker.ready.then(()=>{byId('offline-ready').textContent=window.epopCloud?'介面已快取 · 學習需要連線':'介面與題庫已下載，可離線學習';});
    }).catch(()=>{byId('offline-ready').textContent='離線快取尚未成功，可重開頁面再試';});
  }else byId('offline-ready').textContent='安裝與離線開啟需使用 HTTPS 或 localhost';
  const sync=()=>{if(typeof learnerId!=='undefined')window.epopOffline?.sync(learnerId);};
  window.addEventListener('online',sync);
  window.addEventListener('offline',()=>{byId('sync-status').textContent=window.epopCloud?'已離線 · 請恢復連線後再作答':'離線 · 進度已存裝置';});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
  setInterval(sync,30000);
  document.addEventListener('DOMContentLoaded',sync);
  // visualViewport measures only the visible area above the software keyboard.
  const viewport=window.visualViewport;
  let baseline=window.innerHeight;
  function resize(){
    const focused=document.activeElement?.id==='answer-input';
    if(!focused)baseline=window.innerHeight;
    const height=viewport?.height||window.innerHeight;
    const keyboard=focused&&Math.max(baseline,window.innerHeight)-height>100;
    document.body.classList.toggle('keyboard-open',!!keyboard);
    document.documentElement.style.setProperty('--quiz-height',height+'px');
    document.documentElement.style.setProperty('--quiz-top',(viewport?.offsetTop||0)+'px');
  }
  viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize);
  window.addEventListener('resize',resize);document.addEventListener('focusin',resize);
  document.addEventListener('focusout',()=>requestAnimationFrame(resize));resize();
})();
