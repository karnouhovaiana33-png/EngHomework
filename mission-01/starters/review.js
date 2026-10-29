'use strict';
window.StartersReview=(()=>{
  const KEY='english-quest-homework01-starters-review-v1';
  const $=s=>document.querySelector(s);
  const letters=['A','B','I','K','O','T'],targets=['T','I','K','O'];
  const nouns=['pencil','pen','book','ruler','eraser'];
  const shuffle=xs=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(a.length>1&&a.every((v,i)=>v===xs[i]))[a[0],a[1]]=[a[1],a[0]];return a;};
  function fresh(){const bank=shuffle(nouns),pictures=shuffle(nouns);if(bank.every((v,i)=>v===pictures[i]))pictures.push(pictures.shift());return {choices:['','','',''],heard:[false,false,false,false],checked:[false,false,false,false],letterOrders:targets.map(()=>shuffle(letters)),name:[],nameChecked:false,nameHeard:false,nameOrder:shuffle(targets),school:{},schoolChecked:false,bank,pictures};}
  let state=fresh(),selected='',imagesReady=false,storageOK=true;
  const order=(a,allowed)=>Array.isArray(a)&&a.length===allowed.length&&new Set(a).size===allowed.length&&a.every(v=>allowed.includes(v));
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw&&typeof raw==='object'){
      targets.forEach((_,i)=>{state.choices[i]=letters.includes(raw.choices?.[i])?raw.choices[i]:'';state.heard[i]=raw.heard?.[i]===true;state.checked[i]=raw.checked?.[i]===true;if(order(raw.letterOrders?.[i],letters))state.letterOrders[i]=raw.letterOrders[i];});
      if(Array.isArray(raw.name)&&raw.name.length<=4&&new Set(raw.name).size===raw.name.length&&raw.name.every(v=>targets.includes(v)))state.name=raw.name;
      state.nameChecked=raw.nameChecked===true;state.nameHeard=raw.nameHeard===true;
      if(order(raw.nameOrder,targets))state.nameOrder=raw.nameOrder;
      nouns.forEach(id=>{if(nouns.includes(raw.school?.[id]))state.school[id]=raw.school[id];});
      state.schoolChecked=raw.schoolChecked===true;
      for(const k of ['bank','pictures'])if(order(raw[k],nouns))state[k]=raw[k];
    }
  }catch(err){storageOK=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch(err){storageOK=false;$('#saveStatus').textContent='Повторение не удалось сохранить. Сохрани работу в PDF.';}document.dispatchEvent(new Event('starters-review-changed'));}
  const letterOK=i=>state.checked[i]&&state.heard[i]&&state.choices[i]===targets[i];
  const nameOK=()=>state.nameChecked&&state.nameHeard&&state.name.join('')==='TIKO';
  const schoolOK=()=>state.schoolChecked&&nouns.every(id=>state.school[id]===id);
  const ready=()=>targets.every((_,i)=>letterOK(i))&&nameOK()&&schoolOK();
  function button(text,action,extra={}){const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.reviewAction=action;Object.assign(b.dataset,extra);return b;}
  function buildLetters(){
    const study=$('#letterStudy');study.replaceChildren(...letters.map(letter=>{const b=button(letter,'study');b.dataset.audio='letter-'+letter;b.setAttribute('aria-label','Послушай букву '+letter+' и повтори');return b;}));
    const questions=$('#letterQuestions');questions.replaceChildren();
    targets.forEach((_,i)=>{
      const card=document.createElement('div');card.className='letter-question';card.id='letter-question-'+i;
      const heading=document.createElement('h3');heading.textContent='Запись '+(i+1);
      const play=button('▶ Послушай букву','study');play.dataset.audio='letter-check-'+i;play.className='audio';
      const bank=document.createElement('div');bank.className='letter-bank';
      state.letterOrders[i].forEach(letter=>bank.append(button(letter,'letter',{index:i,value:letter})));
      const check=button('Проверить','letter-check',{index:i});
      const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');card.append(heading,play,bank,check,feedback);questions.append(card);
    });buildName();
  }
  function buildName(){
    const built=$('#builtName');built.replaceChildren();
    if(!state.name.length){const hint=document.createElement('span');hint.textContent='● ● ● ●';built.append(hint);}
    else state.name.forEach((letter,i)=>{const b=button(letter,'remove-name',{index:i});b.setAttribute('aria-label','Вернуть букву '+letter+' в банк');built.append(b);});
    $('#nameLetters').replaceChildren(...state.nameOrder.map(letter=>{const b=button(letter,'name-letter',{value:letter});b.disabled=state.name.includes(letter);return b;}));
  }
  function buildSchool(){
    const words=$('#schoolWords');words.replaceChildren(...state.bank.map(word=>{const b=button(word,'school-word',{value:word});b.dataset.audio='school-'+word;b.lang='en';return b;}));
    const pictures=$('#schoolPictures');pictures.replaceChildren();
    state.pictures.forEach((id,i)=>{
      const b=button('','school-picture',{value:id});b.className='school-picture';b.setAttribute('aria-label','Школьный предмет '+(i+1));
      const frame=document.createElement('span');frame.className='school-art';frame.setAttribute('aria-hidden','true');
      const img=document.createElement('img'),tile=nouns.indexOf(id);img.alt='';img.draggable=false;img.style.left=(-(tile%3)*110-5)+'%';img.style.top=(-Math.floor(tile/3)*110-5)+'%';img.style.width='330%';img.style.height='330%';frame.append(img);
      const caption=document.createElement('span');caption.className='school-caption';b.append(frame,caption);pictures.append(b);
    });loadSchool();
  }
  function loadSchool(retry=false){
    imagesReady=false;$('#schoolImageError').hidden=true;
    const src='assets/school-things.png'+(retry?'?retry='+Date.now():'');
    document.querySelectorAll('.school-art img').forEach(img=>img.src=src);
    const probe=new Image();probe.onload=()=>{imagesReady=true;update();};probe.onerror=()=>{$('#schoolImageError').hidden=false;update();};probe.src=src;update();
  }
  function update(){
    targets.forEach((_,i)=>{
      const card=$('#letter-question-'+i),good=letterOK(i);card.classList.toggle('good',good);card.classList.toggle('bad',state.checked[i]&&state.heard[i]&&!good);
      card.querySelectorAll('[data-review-action="letter"]').forEach(b=>{const chosen=b.dataset.value===state.choices[i];b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('selected',chosen);});
      card.querySelector('.feedback').textContent=!state.checked[i]?'':!state.heard[i]?'Сначала послушай запись до конца.':!state.choices[i]?'Выбери букву.':good?'✓ Верно! Назови букву вслух.':'Послушай ещё раз и выбери другую букву.';
    });
    $('#builtName').classList.toggle('good',nameOK());$('#builtName').classList.toggle('bad',state.nameChecked&&state.nameHeard&&!nameOK());
    $('#guideNameFeedback').textContent=!state.nameChecked?'':!state.nameHeard?'Сначала послушай имя до конца.':nameOK()?'✓ Получилось! Назови имя и все четыре буквы вслух.':'Пока не получилось. Послушай имя и поменяй буквы местами.';
    document.querySelectorAll('[data-review-action="school-word"]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.value===selected));});
    document.querySelectorAll('.school-picture').forEach(b=>{
      const id=b.dataset.value,answer=state.school[id],good=state.schoolChecked&&answer===id;
      b.disabled=!imagesReady;b.classList.toggle('good',good);b.classList.toggle('bad',state.schoolChecked&&!good);
      b.querySelector('.school-caption').textContent=answer||'＋';
      b.setAttribute('aria-label','Школьный предмет '+(state.pictures.indexOf(id)+1)+(answer?': '+answer:''));
    });
    const n=nouns.filter(id=>state.school[id]===id).length;
    $('#schoolFeedback').textContent=!state.schoolChecked?'':schoolOK()?'✓ Все пять слов на месте! Назови предметы вслух.':`Верно ${n} из 5. Посмотри на картинки и попробуй ещё раз.`;
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-review-action]');if(!b)return;
    const action=b.dataset.reviewAction,i=Number(b.dataset.index);
    if(action==='study')return;
    if(action==='letter'){state.choices[i]=b.dataset.value;state.checked[i]=false;}
    if(action==='letter-check')state.checked[i]=true;
    if(action==='name-letter'){if(!state.name.includes(b.dataset.value))state.name.push(b.dataset.value);state.nameChecked=false;buildName();}
    if(action==='remove-name'){state.name.splice(i,1);state.nameChecked=false;buildName();}
    if(action==='school-word'){selected=b.dataset.value;update();return;}
    if(action==='school-picture'){
      if(!imagesReady)return;
      if(!selected){$('#schoolFeedback').textContent='Сначала нажми на слово над картинками.';return;}
      for(const id of nouns)if(state.school[id]===selected)delete state.school[id];
      state.school[b.dataset.value]=selected;state.schoolChecked=false;selected='';
    }
    update();save();
  });
  $('#checkGuideName').onclick=()=>{state.nameChecked=true;update();save();};
  $('#checkSchool').onclick=()=>{state.schoolChecked=true;update();save();};
  $('#retrySchool').onclick=()=>loadSchool(true);
  $('#player').addEventListener('ended',()=>{
    const clip=new URL($('#player').currentSrc).pathname.split('/').pop().replace(/\.mp3$/,'');
    if(/^letter-check-[0-3]$/.test(clip))state.heard[Number(clip.slice(-1))]=true;
    else if(clip==='letters-name')state.nameHeard=true;else return;
    update();save();
  });
  function reset(){state=fresh();selected='';buildLetters();buildSchool();update();save();}
  buildLetters();buildSchool();update();save();
  return {ready,reset};
})();
