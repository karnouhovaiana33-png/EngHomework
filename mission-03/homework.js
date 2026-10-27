'use strict';
(()=>{
  const KEY='english-quest-homework03-movers-v1';
  const $=s=>document.querySelector(s);
  const tasks=[
    {tail:'the window.',options:['open','opened','opening'],answer:'opened'},
    {tail:'a key.',options:['found','find','finded'],answer:'found'},
    {tail:'a message.',options:['sended','send','sent'],answer:'sent'},
    {tail:'to the archive.',options:['went','go','goed'],answer:'went'},
    {tail:'the switch.',options:['turn','turned','turning'],answer:'turned'},
    {tail:'the button.',options:['pressing','press','pressed'],answer:'pressed'}
  ];
  const story=[
    {step:'First',before:'First, we',after:'the key in the box.',answer:'found',art:'key',alt:'Рука достаёт ключ из маленькой коробки.'},
    {step:'Then',before:'Then, we',after:'the little door.',answer:'opened',art:'door',alt:'Ключ в замке, рука открывает маленькую дверцу.'},
    {step:'Next',before:'Next, we',after:'the switch.',answer:'turned',art:'switch',alt:'Рука поворачивает переключатель рядом с загоревшейся лампочкой.'},
    {step:'Finally',before:'Finally, we',after:'the green button. The gate opened!',answer:'pressed',art:'button',alt:'Палец нажимает зелёную кнопку, большие ворота поднимаются.'}
  ];
  const own=[
    {cue:'📍',prefix:'Yesterday, I went to',hint:'Куда ты отправился / отправилась?'},
    {cue:'🔎',prefix:'I found',hint:'Что ты нашёл / нашла?'},
    {cue:'📖',prefix:'I opened',hint:'Что ты открыл / открыла?'},
    {cue:'✉️',prefix:'I sent a message to',hint:'Кому ты отправил(а) сообщение?'}
  ];
  const model=['Hi, Tiko!','Yesterday, I went to the park.','I found a box.','I opened the box.','I sent a message to my friend.','Bye, Tiko!'];
  function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(a.every((v,i)=>v===xs[i])&&a.length>1)[a[0],a[1]]=[a[1],a[0]];return a;}
  const fresh=()=>({revision:1,name:'',choices:Array(6).fill(''),checked:Array(6).fill(false),story:Array(4).fill(''),storyChecked:false,own:Array(4).fill(''),drawings:Array(4).fill(''),orders:tasks.map(t=>shuffle(t.options)),bank:shuffle(['found','opened','turned','pressed']),spoken:false,finalUnlocked:false,completed:false});
  let storageOK=true,restored=false,state=fresh(),audioRequest=0;
  const allowedOrder=(a,values)=>Array.isArray(a)&&a.length===values.length&&new Set(a).size===values.length&&a.every(v=>values.includes(v));
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw?.revision===1){
      restored=true;state.name=String(raw.name||'').slice(0,70);
      state.choices=tasks.map((t,i)=>t.options.includes(raw.choices?.[i])?raw.choices[i]:'');
      state.checked=tasks.map((_,i)=>raw.checked?.[i]===true);
      state.story=story.map((_,i)=>state.bank.includes(raw.story?.[i])?raw.story[i]:'');state.storyChecked=raw.storyChecked===true;
      state.own=own.map((_,i)=>String(raw.own?.[i]||'').slice(0,240));
      state.drawings=own.map((_,i)=>typeof raw.drawings?.[i]==='string'&&/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(raw.drawings[i])&&raw.drawings[i].length<1500000?raw.drawings[i]:'');
      state.orders=tasks.map((t,i)=>allowedOrder(raw.orders?.[i],t.options)?raw.orders[i]:state.orders[i]);
      if(allowedOrder(raw.bank,state.bank))state.bank=raw.bank;
      state.spoken=raw.spoken===true;state.finalUnlocked=raw.finalUnlocked===true;state.completed=raw.completed===true;
    }
  }catch(err){storageOK=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;$('#saveStatus').textContent='Сохранено на этом устройстве.';}catch(err){storageOK=false;$('#saveStatus').textContent='Не удалось сохранить. Сохрани PDF перед закрытием страницы.';}}
  const button=(text,action,extra={})=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.action=action;Object.assign(b.dataset,extra);return b;};
  const machineOK=i=>state.checked[i]&&state.choices[i]===tasks[i].answer;
  const storyOK=i=>state.storyChecked&&state.story[i]===story[i].answer;
  const written=()=>state.own.every(x=>x.trim().length>0);
  const objective=()=>tasks.every((_,i)=>machineOK(i))&&story.every((_,i)=>storyOK(i));
  const ready=()=>objective()&&written()&&state.spoken;
  function invalidate(){state.completed=false;}
  function sentence(i){return own[i].prefix+' '+state.own[i].trim().replace(/[.!?]+$/,'')+'.';}

  function renderMachine(i){
    const card=$('#machine-'+i),t=tasks[i],good=machineOK(i),checked=state.checked[i];
    card.replaceChildren();card.classList.toggle('good',good);card.classList.toggle('bad',checked&&!good);
    const paper=document.createElement('div');paper.className='machine-paper';
    const number=document.createElement('small');number.textContent=`YESTERDAY · ${i+1} / 6`;
    const line=document.createElement('p');line.textContent=`Yesterday, I ${good?t.answer:'___'} ${t.tail}`;paper.append(number,line);
    const keys=document.createElement('div');keys.className='machine-keys';keys.setAttribute('aria-label','Выбери слово для предложения '+(i+1));
    for(const value of state.orders[i]){const b=button(value,'choice',{index:i,value});b.setAttribute('aria-pressed',String(state.choices[i]===value));keys.append(b);}
    const actions=document.createElement('div');actions.className='machine-actions';
    if(good){const mark=document.createElement('span');mark.className='printed-label';mark.textContent='✓ Printed';actions.append(mark,button('♫ Послушай и повтори','sentence',{index:i}));}
    else actions.append(button('Print ↓','check-machine',{index:i}));
    const status=document.createElement('p');status.className='feedback';status.setAttribute('role','status');
    status.textContent=!checked?'':!state.choices[i]?'Сначала выбери слово.':good?'✓ Получилось! Повтори предложение вслух.':'Пока не получилось. Выбери другое слово и попробуй ещё раз.';
    card.append(paper,keys,actions,status);
  }
  function renderMachines(){const grid=$('#machines');grid.replaceChildren();tasks.forEach((_,i)=>{const a=document.createElement('article');a.className='machine';a.id='machine-'+i;grid.append(a);renderMachine(i);});}
  function renderStory(){
    const bank=$('#storyBank');bank.replaceChildren(...state.bank.map(word=>{const s=document.createElement('span');s.textContent=word;return s;}));
    const grid=$('#storyCards');grid.replaceChildren();
    story.forEach((s,i)=>{
      const card=document.createElement('article');card.className='story-card';card.id='story-'+i;
      const picture=document.createElement('div');picture.className='story-image';
      const img=document.createElement('img');img.src='assets/'+s.art+'.png';img.alt=s.alt;img.loading='lazy';img.decoding='async';img.width=1024;img.height=1024;
      const body=document.createElement('div');body.className='story-body';
      const tag=document.createElement('strong');tag.textContent=s.step;
      const label=document.createElement('label');label.htmlFor='story-word-'+i;
      const before=document.createElement('span');before.textContent=s.before;
      const select=document.createElement('select');select.id='story-word-'+i;select.dataset.story=i;select.setAttribute('aria-label',s.step+': пропущенное слово');select.disabled=true;
      const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='______';select.append(placeholder);
      state.bank.forEach(word=>{const o=document.createElement('option');o.value=word;o.textContent=word;select.append(o);});select.value=state.story[i];
      const after=document.createElement('span');after.textContent=s.after;
      label.append(before,select,after);const line=document.createElement('p');line.append(label);
      const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');
      const retry=button('Картинка не загрузилась. Повторить','retry-picture',{index:i});retry.className='retry';retry.hidden=true;
      const loaded=()=>{select.disabled=false;retry.hidden=true;};img.onload=loaded;img.onerror=()=>{select.disabled=true;retry.hidden=false;};if(img.complete&&img.naturalWidth)loaded();
      picture.append(img,retry);body.append(tag,line,feedback);card.append(picture,body);grid.append(card);
    });updateStory();
  }
  function updateStory(){
    story.forEach((_,i)=>{const card=$('#story-'+i),good=storyOK(i);card.classList.toggle('good',good);card.classList.toggle('bad',state.storyChecked&&!good);card.querySelector('.feedback').textContent=!state.storyChecked?'':good?'✓ Верно.':!state.story[i]?'Выбери слово.':'Посмотри на действие ещё раз.';});
    const count=story.filter((_,i)=>storyOK(i)).length;$('#storyStatus').textContent=!state.storyChecked?'':count===4?'✓ История восстановлена! Прочитай её вслух.':`Верно ${count} из 4. Можно исправить и проверить ещё раз.`;$('#storyStatus').className='status '+(count===4?'good':'');
  }
  function renderOwn(){
    const grid=$('#ownCards');grid.replaceChildren();
    own.forEach((item,i)=>{
      const card=document.createElement('article');card.className='own-card';
      const tag=document.createElement('span');tag.className='draw-label';tag.textContent=`${item.cue} PICTURE ${i+1}`;
      const wrap=document.createElement('div');wrap.className='draw-wrap';
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;canvas.dataset.canvas=i;canvas.setAttribute('aria-label','Рисунок '+(i+1)+': '+item.hint);canvas.tabIndex=0;
      const prompt=document.createElement('span');prompt.className='draw-prompt';prompt.textContent='Нарисуй здесь своё приключение';prompt.hidden=!!state.drawings[i];
      wrap.append(canvas,prompt);const tools=document.createElement('div');tools.className='draw-tools';
      const eraser=button('Ластик','eraser',{index:i});eraser.setAttribute('aria-pressed','false');tools.append(eraser,button('Очистить рисунок','clear-drawing',{index:i}));
      const label=document.createElement('label');label.htmlFor='own-'+i;label.textContent=item.prefix+' …';
      const input=document.createElement('input');input.id='own-'+i;input.dataset.own=i;input.maxLength=240;input.placeholder=item.hint;input.value=state.own[i];label.append(input);card.append(tag,wrap,tools,label);grid.append(card);
      setupCanvas(canvas,prompt);
    });
  }
  function setupCanvas(canvas,prompt){
    const i=Number(canvas.dataset.canvas),context=canvas.getContext('2d');let pointer=null,last=null,canDraw=!state.drawings[i];
    if(state.drawings[i]){const img=new Image();img.onload=()=>{context.drawImage(img,0,0,640,400);canDraw=true;};img.onerror=()=>{canDraw=true;prompt.textContent='Рисунок не загрузился. Можно нарисовать заново.';prompt.hidden=false;};img.src=state.drawings[i];}
    const point=e=>{const b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)*640/b.width,y:(e.clientY-b.top)*400/b.height};};
    function ink(from,to){const erase=$(`[data-action="eraser"][data-index="${i}"]`).getAttribute('aria-pressed')==='true';context.globalCompositeOperation=erase?'destination-out':'source-over';context.strokeStyle='#22594f';context.lineWidth=erase?25:4;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(from.x,from.y);context.lineTo(to.x+.01,to.y+.01);context.stroke();}
    canvas.onpointerdown=e=>{if(!canDraw||e.button!==0)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer=e.pointerId;last=point(e);ink(last,last);prompt.hidden=true;};
    canvas.onpointermove=e=>{if(e.pointerId!==pointer)return;const next=point(e);ink(last,next);last=next;};
    const end=e=>{if(e.pointerId!==pointer)return;pointer=null;last=null;state.drawings[i]=canvas.toDataURL('image/png');save();};canvas.onpointerup=end;canvas.onpointercancel=end;
  }
  function update(){
    const attempted=state.checked.every(Boolean)&&state.storyChecked&&state.story.every(Boolean)&&written();
    if(attempted)state.finalUnlocked=true;
    $('#speakingLock').hidden=state.finalUnlocked;$('#speakingModel').hidden=!state.finalUnlocked;
    if(state.finalUnlocked&&!$('#finalAudio').getAttribute('src'))$('#finalAudio').src=$('#finalAudio').dataset.src;
    const message=$('#ownMessage');
    if(!message.querySelector('[data-voice-own]')){
      const greeting=document.createElement('p');greeting.id='voiceGreeting';message.append(greeting);
      own.forEach((item,i)=>{
        const label=document.createElement('label');label.className='voice-line';label.htmlFor='voice-own-'+i;
        const prefix=document.createElement('span');prefix.textContent=item.prefix;
        const input=document.createElement('input');input.id='voice-own-'+i;input.dataset.voiceOwn=i;input.maxLength=240;input.placeholder=item.hint;input.autocomplete='off';input.spellcheck=false;
        label.append(prefix,input);const print=document.createElement('p');print.className='voice-print';print.dataset.voicePrint=i;
        message.append(label,print);
      });
      const bye=document.createElement('p');bye.textContent='Bye, Tiko!';message.append(bye);
    }
    $('#voiceGreeting').textContent='Hi, Tiko!'+(state.name.trim()?' My name is '+state.name.trim()+'.':'');
    own.forEach((item,i)=>{
      for(const input of [$(`[data-own="${i}"]`),$(`[data-voice-own="${i}"]`)])if(input!==document.activeElement&&input.value!==state.own[i])input.value=state.own[i];
      $(`[data-voice-print="${i}"]`).textContent=state.own[i].trim()?sentence(i):item.prefix+' ___.';
    });
    $('#spoken').checked=state.spoken;
    if(state.completed&&!ready())state.completed=false;
    $('#completedBadge').hidden=!state.completed;$('#finish').textContent=state.completed?'✓ Работа выполнена':'Финиш ✦';
    const machines=tasks.filter((_,i)=>machineOK(i)).length;$('#machineStatus').textContent=machines?`${machines} из 6 предложений напечатано верно.`:'';
    const steps=Number(machines===6)+Number(story.every((_,i)=>storyOK(i)))+Number(written());
    $('#progressText').textContent=state.completed?'✦ Приключение завершено!':`Готово заданий: ${steps} из 3`;
    $('#progressFill').style.width=(steps/3*100)+'%';
  }
  async function playSentence(i){const p=$('#sentenceAudio'),token=++audioRequest;p.pause();p.src='assets/audio/sentence-'+i+'.mp3';try{await p.play();if(token===audioRequest)$('#audioStatus').textContent='Послушай и повтори вслух.';}catch(err){if(token===audioRequest){$('#machine-'+i+' .feedback').textContent='Запись не загрузилась. Нажми «Послушай и повтори» ещё раз.';}}}
  function init(){renderMachines();renderStory();renderOwn();$('#explorerName').value=state.name;const text=$('#modelText');text.replaceChildren(...model.map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));update();}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const i=Number(b.dataset.index),action=b.dataset.action;
    if(action==='choice'){state.choices[i]=b.dataset.value;state.checked[i]=false;invalidate();renderMachine(i);}
    if(action==='check-machine'){state.checked[i]=true;invalidate();renderMachine(i);$('#machine-'+i).classList.remove('printing');void $('#machine-'+i).offsetWidth;$('#machine-'+i).classList.add('printing');if(machineOK(i))playSentence(i);}
    if(action==='sentence'){playSentence(i);return;}
    if(action==='eraser'){b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));return;}
    if(action==='clear-drawing'){
      if(state.drawings[i]&&!confirm('Очистить только этот рисунок? Текст останется.'))return;
      const canvas=$(`[data-canvas="${i}"]`);canvas.getContext('2d').clearRect(0,0,640,400);state.drawings[i]='';canvas.nextElementSibling.hidden=false;
    }
    if(action==='retry-picture'){const img=$('#story-'+i+' img');img.src='assets/'+story[i].art+'.png?retry='+Date.now();return;}
    update();save();
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='explorerName'){state.name=e.target.value;state.spoken=false;invalidate();}
    else if(e.target.matches('[data-own],[data-voice-own]')){state.own[Number(e.target.dataset.own??e.target.dataset.voiceOwn)]=e.target.value;state.spoken=false;invalidate();}
    else return;
    $('#finishStatus').textContent='';update();save();
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-story]')){state.story[Number(e.target.dataset.story)]=e.target.value;state.storyChecked=false;invalidate();updateStory();update();save();}
  });
  $('#checkStory').onclick=()=>{state.storyChecked=true;invalidate();updateStory();update();save();};
  $('#spoken').onchange=()=>{state.spoken=$('#spoken').checked;invalidate();update();save();};
  $('#finish').onclick=()=>{
    const status=$('#finishStatus');let text='';
    if(!objective())text='Проверь печатную машинку и историю. Исправь отмеченные ответы.';
    else if(!written())text='Допиши четыре предложения своего приключения.';
    else if(!state.spoken)text='Расскажи свою историю вслух и поставь отметку.';
    if(text){status.textContent=text;status.className='status bad';return;}
    state.completed=true;status.textContent='✓ Твоя работа готова для учителя.';status.className='status good';update();save();
    document.querySelectorAll('audio').forEach(p=>p.pause());$('#congratsName').textContent=state.name.trim()||'Исследователь';$('#congratulations').showModal();
  };
  $('#closeCongrats').onclick=()=>{$('#congratulations').close();$('#finish').focus();};
  $('#restart').onclick=()=>{$('#resetBox').hidden=false;$('#cancelReset').focus();};
  $('#cancelReset').onclick=()=>{$('#resetBox').hidden=true;$('#restart').focus();};
  $('#confirmReset').onclick=()=>{document.querySelectorAll('audio').forEach(p=>p.pause());audioRequest++;state=fresh();$('#resetBox').hidden=true;$('#finalAudio').removeAttribute('src');$('#finalAudio').load();$('#finishStatus').textContent='';init();save();$('#warmup').scrollIntoView();};
  $('#print').onclick=()=>{save();window.print();};
  document.addEventListener('play',e=>{if(e.target.tagName!=='AUDIO')return;document.querySelectorAll('audio').forEach(p=>{if(p!==e.target)p.pause();});const error=e.target.nextElementSibling;if(error?.classList.contains('audio-error'))error.textContent='';},true);
  document.addEventListener('error',e=>{if(e.target.tagName!=='AUDIO')return;const error=e.target.nextElementSibling;if(error?.classList.contains('audio-error'))error.textContent='Запись не загрузилась. Нажми Play ещё раз.';},true);
  init();save();
  if(restored&&storageOK)$('#saveStatus').textContent='Твои сохранённые ответы и рисунки восстановлены.';
})();
