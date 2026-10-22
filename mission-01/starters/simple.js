(() => {
  'use strict';
  const KEY = 'english-quest-homework01-starters-simple-v2';
  const $ = s => document.querySelector(s);
  const words = {
    draw: {x:0,y:0,ru:'рисовать'}, jump:{x:1,y:0,ru:'прыгать'},
    swim:{x:2,y:0,ru:'плавать'},kind:{x:0,y:1,ru:'добрый / добрая'},
    funny:{x:1,y:1,ru:'весёлый / весёлая'}
  };
  const answers = ['jump','draw'];
  const shuffle = a => {
    const b = [...a];
    for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
    return b;
  };
  const fresh = () => ({name:'',trait:'',skill:'',read:false,chosen:['',''],heard:[false,false],
    checked:[false,false],order:{traits:shuffle(['kind','funny']),skills:shuffle(['draw','jump','swim']),
      q0:shuffle(['draw','jump','swim']),q1:shuffle(['draw','jump','swim'])}});
  let state=fresh(),storageOK=true;
  try {
    const s=JSON.parse(localStorage.getItem(KEY));
    if(s && typeof s==='object'){
      state.name=typeof s.name==='string'?s.name.slice(0,35):'';
      if(['kind','funny'].includes(s.trait))state.trait=s.trait;
      if(['draw','jump','swim'].includes(s.skill))state.skill=s.skill;
      state.read=s.read===true;
      for(let i=0;i<2;i++){
        state.chosen[i]=['draw','jump','swim'].includes(s.chosen?.[i])?s.chosen[i]:'';
        state.heard[i]=s.heard?.[i]===true;state.checked[i]=s.checked?.[i]===true;
      }
      for(const group of Object.keys(state.order)){
        const a=s.order?.[group],b=state.order[group];
        if(Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(x=>b.includes(x)))state.order[group]=a;
      }
    }
  }catch(e){storageOK=false;}
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;}
    $('#saveStatus').textContent=storageOK?'Ответы сохранены в этом браузере.':'Сохранение недоступно. Сохрани готовую работу в PDF перед закрытием.';
  }
  function makeChoice(value,group,index,labelled){
    const w=words[value],box=document.createElement('div');box.className='choice';
    const b=document.createElement('button');b.type='button';b.className='pick';
    b.dataset.group=group;b.dataset.value=value;
    b.setAttribute('aria-label',labelled?value+' — '+w.ru:'Картинка '+(index+1));
    const art=document.createElement('span');art.className='art';art.setAttribute('aria-hidden','true');
    art.style.backgroundPosition=`${w.x*50}% ${w.y*100}%`;b.append(art);
    if(labelled){
      const word=document.createElement('span');word.className='word';word.lang='en';word.textContent=value;
      const ru=document.createElement('span');ru.className='translation';ru.textContent=w.ru;b.append(word,ru);
    }
    b.onclick=()=>{
      if(group==='traits'||group==='skills'){
        state[group==='traits'?'trait':'skill']=value;state.read=false;
      }else{const i=Number(group.slice(1));state.chosen[i]=value;state.checked[i]=false;}
      update();save();
    };
    box.append(b);
    if(labelled){const audio=document.createElement('button');audio.className='word-audio';audio.type='button';
      audio.textContent='▶';audio.dataset.audio=value;audio.setAttribute('aria-label','Послушать слово '+value);box.append(audio);}
    return box;
  }
  function build(){
    for(const group of ['traits','skills']){
      const parent=$('#'+group);parent.replaceChildren();
      state.order[group].forEach((v,i)=>parent.append(makeChoice(v,group,i,true)));
    }
    const parent=$('#listening');parent.replaceChildren();
    for(let i=0;i<2;i++){
      const q=document.createElement('div');q.className='question';q.id='q'+i;
      q.innerHTML=`<h3>Аудио ${i+1}</h3><button class="audio" data-audio="listen-${i+1}">▶ Послушать</button><div class="choices"></div><button class="check">Проверить</button><p class="feedback" role="status"></p>`;
      state.order['q'+i].forEach((v,j)=>q.querySelector('.choices').append(makeChoice(v,'q'+i,j,false)));
      q.querySelector('.check').onclick=()=>{state.checked[i]=true;update();save();};parent.append(q);
    }
    $('#name').value=state.name;update();
  }
  const validName=()=>/^[a-zA-Z][a-zA-Z '\-]*$/.test(state.name.trim());
  const cardReady=()=>validName()&&!!state.trait&&!!state.skill;
  function update(){
    $('#cardName').textContent=state.name.trim()||'…';$('#cardTrait').textContent=state.trait||'…';$('#cardSkill').textContent=state.skill||'…';
    $('#read').checked=state.read;
    $('#read').disabled=!cardReady();
    $('#name').setAttribute('aria-invalid',String(!!state.name.trim()&&!validName()));
    for(const group of ['traits','skills']){
      const val=state[group==='traits'?'trait':'skill'];
      $('#'+group).querySelectorAll('.pick').forEach(b=>{
        const selected=b.dataset.value===val;b.setAttribute('aria-pressed',String(selected));b.parentElement.classList.toggle('selected',selected);
      });
    }
    const done=[];
    for(let i=0;i<2;i++){
      const q=$('#q'+i),v=state.chosen[i],checked=state.checked[i],heard=state.heard[i];
      const good=checked&&heard&&v===answers[i];done.push(good);q.classList.toggle('done',good);
      q.querySelectorAll('.pick').forEach(b=>{
        const selected=b.dataset.value===v;b.setAttribute('aria-pressed',String(selected));
        b.parentElement.classList.toggle('selected',selected);
        b.parentElement.classList.toggle('correct',selected&&good);
        b.parentElement.classList.toggle('wrong',selected&&checked&&heard&&!good);
      });
      q.querySelector('.feedback').textContent=!checked?'':!heard?'Сначала послушай аудио до конца.':!v?'Выбери одну картинку.':good?'✓ Верно! Молодец!':'Попробуй ещё раз. Послушай и выбери другую картинку.';
    }
    const complete=cardReady()&&state.read&&done.every(Boolean);
    $('#finish').classList.toggle('ready',complete);
    $('#finishTitle').textContent=complete?'Миссия выполнена!':'Собери свою первую карточку';
    let todo=[];
    if(!validName())todo.push('напиши имя английскими буквами');if(!state.trait)todo.push('выбери качество');
    if(!state.skill)todo.push('выбери умение');if(!state.read)todo.push('прочитай карточку вслух');
    if(!done.every(Boolean))todo.push('выполни два задания на слух');
    $('#finishStatus').textContent=complete?'Отлично! Твоя карточка готова, оба задания на слух выполнены.':'Осталось: '+todo.join(', ')+'.';
  }
  const player=$('#player');let clip=null;
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-audio]');if(!b)return;
    player.pause();clip=b.dataset.audio;player.src='assets/'+clip+'.mp3';
    $('#audioStatus').textContent='Слушаем…';
    try{await player.play();}catch(err){$('#audioStatus').textContent='Не удалось включить звук. Проверь подключение и нажми ещё раз.';}
  });
  player.addEventListener('ended',()=>{
    if(clip?.startsWith('listen-')){state.heard[Number(clip.slice(-1))-1]=true;update();save();}
    $('#audioStatus').textContent='';
  });
  player.addEventListener('error',()=>{$('#audioStatus').textContent='Звук не загрузился. Проверь подключение и нажми ещё раз.';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.pause();$('#audioStatus').textContent='';}});
  $('#name').addEventListener('input',e=>{state.name=e.target.value;state.read=false;update();save();});
  $('#read').addEventListener('change',e=>{state.read=e.target.checked;update();save();});
  $('#restart').onclick=()=>{$('#resetBox').hidden=false;$('#cancelReset').focus();};
  $('#cancelReset').onclick=()=>{$('#resetBox').hidden=true;$('#restart').focus();};
  $('#confirmReset').onclick=()=>{
    player.pause();clip=null;$('#audioStatus').textContent='';state=fresh();save();build();$('#resetBox').hidden=true;$('#name').focus();
  };
  $('#print').onclick=()=>window.print();
  build();save();
})();
