/* Show updates on reopen; never reload an active exercise without consent. */
(function(){
  let installPrompt=null,registration=null,waitingWorker=null,replacing=false,dismissed=false;
  const dialog=document.getElementById('app-update-dialog');
  function offer(){
    waitingWorker=registration?.waiting||null;
    if(!waitingWorker||!navigator.serviceWorker.controller||dismissed||document.visibilityState==='hidden')return;
    if(typeof state!=='undefined'&&(state.busy||state.page==='quiz'))return;
    if(!dialog.open)dialog.showModal();
  }
  async function check(){
    if(!registration)return;
    try{await registration.update();offer();if(!registration.waiting&&!registration.installing)notify('目前已是最新版本。');}catch(e){notify('無法檢查更新，請確認網路後重試。');}
  }
  window.epopUpdates={offer,check,async install(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else notify('請使用瀏覽器選單「加入主畫面」安裝。');}};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
  window.addEventListener('appinstalled',()=>{installPrompt=null;});
  document.getElementById('update-later').onclick=()=>{dismissed=true;dialog.close();};
  dialog.addEventListener('cancel',()=>{dismissed=true;});
  document.getElementById('update-now').onclick=()=>{
    if(typeof state!=='undefined'&&(state.busy||state.page==='quiz')){dialog.close();notify('請先暫停練習再更新。');return;}
    waitingWorker?.postMessage({type:'ACTIVATE_UPDATE'});
  };
  if('serviceWorker' in navigator&&window.isSecureContext){
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      registration=reg;offer();
      reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{if(reg.waiting)offer();}));
      reg.update().catch(()=>{});
    }).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(waitingWorker&&!replacing){replacing=true;location.reload();}});
  }
  const reopen=()=>{if(document.visibilityState==='visible'){dismissed=false;registration?.update().catch(()=>{});offer();}};
  window.addEventListener('pageshow',reopen);document.addEventListener('visibilitychange',reopen);
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
