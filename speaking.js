/* Two echo recordings. Completion is learner-confirmed; playing is not speech assessment. */
(() => {
  'use strict';
  const freshSpeaking=()=>({warmupRepeated:false,finalRepeated:false,finalUnlocked:false});
  function ensure(){
    const old=state.speaking;
    state.speaking={...freshSpeaking(),...(old&&typeof old==='object'?old:{})};
  }
  function sync(){
    ensure();
    const eligible=state.checkedNow&&state.now.every(x=>String(x).trim())&&['compare1','compare2','message'].every(k=>String(state[k]).trim());
    if(eligible&&!state.speaking.finalUnlocked){state.speaking.finalUnlocked=true;save();return;}
    for(const [id,key] of [['repeat-start','warmupRepeated'],['repeat-final','finalRepeated']]){
      const block=document.getElementById(id),check=block.querySelector('[data-repeat-check]');
      check.checked=!!state.speaking[key];block.classList.toggle('repeated',check.checked);
      const status=block.querySelector('.repeat-status');
      if(!status.classList.contains('error'))status.textContent=check.checked?'✓ Repeated aloud. You can practise again.':'';
    }
    const last=document.getElementById('repeat-final'),unlocked=!!state.speaking.finalUnlocked;
    last.dataset.unlocked=String(unlocked);
    last.querySelector('.repeat-lock').hidden=unlocked;
    last.querySelector('[data-repeat-player]').hidden=!unlocked;
    const audio=document.getElementById('repeat-final-audio');
    if(unlocked&&!audio.getAttribute('src'))audio.src=audio.dataset.src;
    if(!unlocked){audio.pause();audio.removeAttribute('src');audio.load();}
  }
  document.addEventListener('homework02-saved',sync);
  document.addEventListener('change',event=>{
    const check=event.target.closest('[data-repeat-check]');if(!check)return;
    ensure();state.speaking[check.dataset.repeatCheck]=check.checked;save();
  });
  document.addEventListener('click',async event=>{
    if(event.target.closest('#confirmReset'))document.querySelectorAll('audio').forEach(a=>a.pause());
    const replay=event.target.closest('[data-repeat-replay]');if(!replay)return;
    const audio=document.getElementById(replay.dataset.repeatReplay);
    if(!audio.getAttribute('src'))return;
    if(audio.error)audio.load();
    audio.currentTime=0;
    try{await audio.play();}catch{audio.closest('.repeat-block').querySelector('.repeat-status').textContent='Press Play or Replay to try again.';}
  });
  document.addEventListener('play',event=>{
    if(event.target.tagName!=='AUDIO')return;
    document.querySelectorAll('audio').forEach(a=>{if(a!==event.target&&!a.paused)a.pause();});
  },true);
  document.addEventListener('error',event=>{
    if(!event.target.matches?.('audio[data-repeat-audio]')||!event.target.getAttribute('src'))return;
    const status=event.target.closest('.repeat-block').querySelector('.repeat-status');status.classList.add('error');status.textContent='Recording could not load. Press Replay to try again.';
  },true);
  document.addEventListener('playing',event=>{
    if(!event.target.matches?.('audio[data-repeat-audio]'))return;
    const status=event.target.closest('.repeat-block').querySelector('.repeat-status');status.classList.remove('error');status.textContent='Listen. Say it aloud in each pause.';
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('audio').forEach(a=>a.pause());});
  const nav=document.querySelector('.quest-nav');
  new ResizeObserver(()=>document.documentElement.style.setProperty('--hw-nav-height',Math.ceil(nav.getBoundingClientRect().height)+'px')).observe(nav);
  sync();
})();
