(() => {
  'use strict';
  const KEY='english-quest-homework02-bridge-v1',$=s=>document.querySelector(s);
  const ids=['gate','radio','screen'];
  const positions={gate:[0,0],radio:[1,0],screen:[0,1]};
  const answers=['is opening','is sending messages','is not working'];
  const options=[['is opening','is closing'],['is sending messages','is receiving messages'],['is working','is not working']];
  const tokens=[['The gate','is','opening.'],['The radio','is','sending messages.'],['The screen','is not','working.']];
  const listens=['radio','screen','gate'];
  const words=['a gate','a radio','a screen','is opening','is closing','is sending messages','is receiving messages','is working','is not working'];
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const mixed=a=>{const b=shuffle(a);if(b.length>1&&b.every((x,i)=>x===a[i]))[b[0],b[1]]=[b[1],b[0]];return b;};
  const fresh=()=>{const nouns=shuffle(ids);return {name:'',nouns:{},nounsChecked:false,now:['','',''],nowChecked:[false,false,false],lines:[[],[],[]],lineChecked:[false,false,false],listening:['','',''],heard:[false,false,false],listenChecked:[false,false,false],read:false,modelHeard:false,
    order:{nouns,pictures:mixed(nouns),choices:options.map(shuffle),banks:tokens.map(t=>mixed(t.map((_,i)=>i))),listening:ids.map(()=>shuffle(ids))}};};
  const perm=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(x=>b.includes(x));
  let state=fresh(),storage=true,selected='',playing='',request=0;
  try{
    const old=JSON.parse(localStorage.getItem(KEY));
    if(old&&typeof old==='object'){
      state.name=typeof old.name==='string'?old.name.slice(0,35):'';
      state.nouns=Object.fromEntries(ids.filter(id=>ids.includes(old.nouns?.[id])).map(id=>[id,old.nouns[id]]));state.nounsChecked=old.nounsChecked===true;
      for(let i=0;i<3;i++){
        state.now[i]=options[i].includes(old.now?.[i])?old.now[i]:'';state.nowChecked[i]=old.nowChecked?.[i]===true;
        const line=old.lines?.[i];state.lines[i]=Array.isArray(line)&&new Set(line).size===line.length&&line.every(x=>[0,1,2].includes(x))?line:[];
        state.lineChecked[i]=old.lineChecked?.[i]===true;state.listening[i]=ids.includes(old.listening?.[i])?old.listening[i]:'';state.heard[i]=old.heard?.[i]===true;state.listenChecked[i]=old.listenChecked?.[i]===true;
        if(perm(old.order?.choices?.[i],options[i]))state.order.choices[i]=old.order.choices[i];
        if(perm(old.order?.banks?.[i],[0,1,2]))state.order.banks[i]=old.order.banks[i];
        if(perm(old.order?.listening?.[i],ids))state.order.listening[i]=old.order.listening[i];
      }
      for(const group of ['nouns','pictures'])if(perm(old.order?.[group],ids))state.order[group]=old.order[group];
      state.read=old.read===true;state.modelHeard=old.modelHeard===true;
    }
  }catch(e){storage=false;}
  const nowOK=i=>state.nowChecked[i]&&state.now[i]===answers[i];
  const allNow=()=>ids.every((_,i)=>nowOK(i));
  const lineOK=i=>state.lineChecked[i]&&state.lines[i].length===3&&state.lines[i].every((x,j)=>x===j);
  const reportOK=()=>allNow()&&ids.every((_,i)=>lineOK(i))&&/^[A-Za-z][A-Za-z '\-]*$/.test(state.name.trim());
  const listenOK=i=>state.heard[i]&&state.listenChecked[i]&&state.listening[i]===listens[i];
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('#saveStatus').textContent='Saved on this device · Mission 2 Starters Plus';}catch(e){storage=false;$('#saveStatus').textContent='Saving unavailable. Save a PDF before closing.';}}
  function picture(id,action=true){
    const frame=document.createElement('span');frame.className='camera-image'+(action?'':' noun-picture');frame.setAttribute('aria-hidden','true');
    const img=document.createElement('img');img.src='assets/cameras.webp';img.alt='';img.draggable=false;img.style.left=(-positions[id][0]*100)+'%';img.style.height=id==='screen'?'185.95%':'216.34%';img.style.top=id==='screen'?'-85.95%':'0';frame.append(img);
    if(action){const mark=document.createElement('span');mark.className=id==='radio'?'signal-path':'action-mark';
      if(id==='radio')mark.innerHTML='<span>📻</span><b>→ ✉ →</b><span>🏠</span>';
      else mark.textContent=id==='gate'?'↑':'×';frame.append(mark);}
    return frame;
  }
  function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;}
  function buildNouns(){
    $('#nounBank').replaceChildren(...state.order.nouns.map(id=>{const box=document.createElement('span');box.className='noun-word';const b=button(id,()=>{selected=id;$('#nounBank').querySelectorAll('[data-word]').forEach(x=>{x.setAttribute('aria-pressed',String(x.dataset.word===id));x.classList.toggle('selected',x.dataset.word===id);});});b.dataset.word=id;b.setAttribute('aria-pressed',String(selected===id));const play=button('▶',()=>{});play.dataset.audio='word-'+id;play.setAttribute('aria-label','Listen and repeat aloud: '+id);box.append(b,play);return box;}));
    $('#nounPictures').replaceChildren(...state.order.pictures.map((id,i)=>{const b=button('',()=>{if(!selected){$('#nounFeedback').textContent='Choose a word first.';return;}state.nouns[id]=selected;state.nounsChecked=false;state.read=false;update();save();});b.className='picture-slot';b.dataset.picture=id;b.setAttribute('aria-label','Picture '+(i+1));b.append(picture(id,false));const label=document.createElement('span');label.className='placed-label';label.textContent=state.nouns[id]||'…';b.append(label);return b;}));
  }
  function buildNow(){
    const area=$('#observations');area.replaceChildren();
    ids.forEach((id,i)=>{const row=document.createElement('div');row.className='observation';row.id='now'+i;const heading=document.createElement('h3');heading.textContent='The '+id;row.append(heading);
      const body=document.createElement('div');body.className='observation-body';body.append(picture(id));const choices=document.createElement('div');choices.className='choice-buttons';
      state.order.choices[i].forEach(value=>{const b=button(value,()=>{state.now[i]=value;state.nowChecked[i]=false;state.read=false;update();save();});b.dataset.value=value;choices.append(b);});body.append(choices);row.append(body);
      const check=button('Check',()=>{state.nowChecked[i]=true;update();save();});check.className='check';const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');row.append(check,feedback);area.append(row);
    });
  }
  function buildSentences(){
    const area=$('#sentences');area.replaceChildren();if(!allNow())return;
    ids.forEach((id,i)=>{const row=document.createElement('div');row.className='sentence-task';row.id='sentence'+i;const h=document.createElement('h3');h.textContent=(i+1)+' · The '+id;row.append(h);
      const line=document.createElement('div');line.className='answer-line';line.setAttribute('aria-label','Your sentence '+(i+1));const bank=document.createElement('div');bank.className='bank';
      const tile=(n,inLine)=>{const b=button(tokens[i][n],()=>{state.lines[i]=inLine?state.lines[i].filter(x=>x!==n):[...state.lines[i],n];state.lineChecked[i]=false;state.read=false;buildSentences();update();save();});b.dataset.token=n;return b;};
      state.lines[i].forEach(n=>line.append(tile(n,true)));state.order.banks[i].filter(n=>!state.lines[i].includes(n)).forEach(n=>bank.append(tile(n,false)));
      const actions=document.createElement('div');actions.className='sentence-actions';actions.append(button('Check',()=>{state.lineChecked[i]=true;update();save();}),button('Clear',()=>{state.lines[i]=[];state.lineChecked[i]=false;state.read=false;buildSentences();update();save();}));
      const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');row.append(line,bank,actions,feedback);area.append(row);
    });
  }
  function buildListening(){
    const area=$('#listening');area.replaceChildren();
    for(let i=0;i<3;i++){
      const row=document.createElement('div');row.className='question';row.id='q'+i;const h=document.createElement('h3');h.textContent='Message '+(i+1);const play=button('▶ Listen and repeat aloud',()=>{});play.className='audio';play.dataset.audio='listen-'+i;
      const choices=document.createElement('div');choices.className='choices';state.order.listening[i].forEach((id,j)=>{const b=button('',()=>{state.listening[i]=id;state.listenChecked[i]=false;state.read=false;update();save();});b.className='listen-picture';b.dataset.value=id;b.setAttribute('aria-label','Picture '+(j+1));b.append(picture(id));choices.append(b);});
      const check=button('Check',()=>{state.listenChecked[i]=true;update();save();});check.className='check';const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');row.append(h,play,choices,check,feedback);area.append(row);
    }
  }
  function update(){
    $('#nounPictures').querySelectorAll('[data-picture]').forEach(b=>{const id=b.dataset.picture;b.querySelector('.placed-label').textContent=state.nouns[id]||'…';b.classList.toggle('good',state.nounsChecked&&state.nouns[id]===id);b.classList.toggle('bad',state.nounsChecked&&state.nouns[id]!==id);});
    const nounsOK=state.nounsChecked&&ids.every(id=>state.nouns[id]===id);$('#nounFeedback').textContent=state.nounsChecked?(nounsOK?'✓ Well done!':'Look again. Change your labels and check again.'):'';
    ids.forEach((_,i)=>{const row=$('#now'+i);row.classList.toggle('good',nowOK(i));row.classList.toggle('bad',state.nowChecked[i]&&!nowOK(i));row.querySelectorAll('[data-value]').forEach(b=>{b.classList.toggle('selected',state.now[i]===b.dataset.value);b.setAttribute('aria-pressed',String(state.now[i]===b.dataset.value));});row.querySelector('.feedback').textContent=!state.nowChecked[i]?'':nowOK(i)?'✓ Well done!':state.now[i]?'Look at the picture and arrow. Try again.':'Choose an answer.';});
    if(allNow()&&!$('#sentences').children.length)buildSentences();
    $('#sentences').hidden=!allNow();$('#buildLock').hidden=allNow();
    ids.forEach((_,i)=>{const row=$('#sentence'+i);if(!row)return;row.classList.toggle('good',lineOK(i));row.classList.toggle('bad',state.lineChecked[i]&&!lineOK(i));row.querySelector('.feedback').textContent=!state.lineChecked[i]?'':lineOK(i)?'✓ Well done!':state.lines[i].length<3?'Use all the words.':'Try a different word order.';});
    $('#name').setAttribute('aria-invalid',String(!!state.name&&!/^[A-Za-z][A-Za-z '\-]*$/.test(state.name.trim())));
    const report=$('#reportLines');report.replaceChildren();const add=(text,pending=false)=>{const p=document.createElement('p');p.textContent=text;if(pending)p.className='pending';report.append(p);};add('Hi, Tiko!');add('My name is '+(state.name.trim()||'…')+'.');ids.forEach((_,i)=>add(allNow()&&lineOK(i)?tokens[i].join(' '):'Observation '+(i+1)+': …',!allNow()||!lineOK(i)));add('Bye, Tiko!');
    const built=allNow()&&ids.every((_,i)=>lineOK(i));$('#listeningLock').hidden=built;$('#listening').hidden=!built;$('#speakingPractice').hidden=!reportOK();$('#speakingLock').hidden=reportOK();$('#read').disabled=!reportOK();$('#read').checked=state.read&&reportOK();$('#modelStatus').textContent=state.modelHeard?'✓ Model played. Now read your own message aloud.':'';
    for(let i=0;i<3;i++){const row=$('#q'+i),good=listenOK(i);row.querySelectorAll('[data-value]').forEach(b=>{const chosen=b.dataset.value===state.listening[i];b.classList.toggle('selected',chosen);b.classList.toggle('good',chosen&&good);b.classList.toggle('bad',chosen&&state.listenChecked[i]&&state.heard[i]&&!good);b.setAttribute('aria-pressed',String(chosen));});row.querySelector('.feedback').textContent=!state.listenChecked[i]?'':!state.heard[i]?'Listen to the whole message and repeat aloud first.':!state.listening[i]?'Choose a picture.':good?'✓ Well done!':'Listen and repeat aloud again. Try another picture.';}
    const complete=nounsOK&&built&&ids.every((_,i)=>listenOK(i))&&reportOK()&&state.read;$('#finish').classList.toggle('ready',complete);$('#task5').classList.toggle('done',reportOK()&&state.read);$('#finishTitle').textContent=complete?'Your message is ready!':'Your next adventure awaits';$('#finishStatus').textContent=complete?'Mission complete! Show your report to your teacher.':'Check your pictures and sentences, finish three messages and read your own report aloud.';
  }
  function build(){buildNouns();buildNow();buildSentences();buildListening();$('#name').value=state.name;update();checkImages();}
  const player=$('#player');
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-audio]');if(!b)return;const clip=b.dataset.audio;if(clip==='model'&&!reportOK()||clip.startsWith('listen-')&&!ids.every((_,i)=>lineOK(i)))return;
    const attempt=++request;player.pause();playing=clip;player.src='assets/audio/'+clip+'.mp3';$('#audioStatus').textContent='Listen and repeat aloud…';
    try{await player.play();}catch(error){if(request===attempt)$('#audioStatus').textContent='Audio unavailable. Tap Listen and repeat aloud to try again.';}
  });
  player.onended=()=>{if(playing.startsWith('listen-'))state.heard[Number(playing.slice(-1))]=true;if(playing==='model')state.modelHeard=true;$('#audioStatus').textContent='';update();save();};player.onerror=()=>{$('#audioStatus').textContent='Audio unavailable. Tap Listen and repeat aloud to try again.';};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.pause();$('#audioStatus').textContent='';}});
  function checkImages(){document.querySelectorAll('.picture-slot,.listen-picture').forEach(b=>{const img=b.querySelector('img');b.disabled=!(img?.complete&&img.naturalWidth);});document.querySelectorAll('.observation').forEach(row=>{const img=row.querySelector('img');row.querySelectorAll('button').forEach(b=>b.disabled=!(img?.complete&&img.naturalWidth));});$('#checkNouns').disabled=[...$('#nounPictures').querySelectorAll('img')].some(img=>!img.complete||!img.naturalWidth);}
  document.addEventListener('load',e=>{if(e.target.matches?.('.camera-image>img'))checkImages();},true);
  document.addEventListener('error',e=>{if(!e.target.matches?.('.camera-image>img'))return;checkImages();if(!$('#imageError')){const box=document.createElement('p');box.id='imageError';box.className='image-status';box.textContent='Picture unavailable. Your answers are kept. ';box.append(button('Retry pictures',()=>{document.querySelectorAll('.camera-image>img').forEach(img=>{if(!img.naturalWidth)img.src='assets/cameras.webp?retry='+Date.now();});box.remove();}));$('#nounPictures').before(box);}},true);
  $('#checkNouns').onclick=()=>{state.nounsChecked=true;update();save();};$('#name').oninput=e=>{state.name=e.target.value;state.read=false;update();save();};$('#read').onchange=e=>{state.read=e.target.checked;update();save();};
  $('#restart').onclick=()=>{$('#resetBox').hidden=false;$('#cancelReset').focus();};$('#cancelReset').onclick=()=>{$('#resetBox').hidden=true;$('#restart').focus();};$('#confirmReset').onclick=()=>{request++;player.pause();playing='';state=fresh();selected='';$('#audioStatus').textContent='';$('#resetBox').hidden=true;build();save();$('#name').focus();};$('#print').onclick=()=>window.print();
  $('#wordList').replaceChildren(...words.map(word=>{const span=document.createElement('span');span.textContent=word;return span;}));build();save();
})();
