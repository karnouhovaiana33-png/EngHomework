(() => {
  'use strict';
  const KEY='english-quest-homework01-bridge-v1',$=s=>document.querySelector(s);
  const jobs={navigator:{picture:[1,0],skills:['read maps','show the way']},technician:{picture:[3,0],skills:['fix machines','check machines']},archivist:{picture:[1,2],skills:['read the log','keep books']}};
  const traits={kind:'I help my friends.',friendly:'I say hello to new people.',funny:'I make people laugh.',careful:'I check my work.'};
  const traitPictures={kind:[0,0],friendly:[1,0],funny:[0,1],careful:[1,1]};
  const skills={'read maps':[1,0],'show the way':[1,0],'fix machines':[3,0],'check machines':[3,0],'read the log':[1,2],'keep books':[0,1]};
  const skillPictures={'read maps':[0,0],'show the way':[1,0],'fix machines':[2,0],'check machines':[0,1],'read the log':[1,1],'keep books':[2,1]};
  const listen=['fix machines','read the log','read maps'];
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const notSolved=a=>{let b;do{b=shuffle(a);}while(b.every((v,i)=>v===a[i]));return b;};
  const fresh=()=>({name:'',age:'',job:'',trait:'',skill:'',read:false,lines:[[],[],[]],lineChecked:[false,false,false],
    banks:[[],[],[]],answers:['','',''],heard:[false,false,false],checked:[false,false,false],
    order:{jobs:shuffle(Object.keys(jobs)),traits:shuffle(Object.keys(traits)),skills:[],q0:shuffle(listen),q1:shuffle(listen),q2:shuffle(listen)}});
  let state=fresh(),storage=true;
  const tokens=i=>i===0?(state.job?['I','am',state.job==='archivist'?'an':'a',state.job]:[]):i===1?(state.trait?['I','am',state.trait]:[]):state.skill?['I','can',state.skill]:[];
  const permutation=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(x=>b.includes(x));
  try{
    const s=JSON.parse(localStorage.getItem(KEY));
    if(s&&typeof s==='object'){
      state.name=typeof s.name==='string'?s.name.slice(0,35):'';state.age=typeof s.age==='string'?s.age:'';
      state.job=Object.hasOwn(jobs,s.job)?s.job:'';state.trait=Object.hasOwn(traits,s.trait)?s.trait:'';
      state.skill=jobs[state.job]?.skills.includes(s.skill)?s.skill:'';state.read=s.read===true;
      for(const group of Object.keys(state.order)){
        const valid=group==='skills'?(jobs[state.job]?.skills||[]):state.order[group];
        state.order[group]=permutation(s.order?.[group],valid)?s.order[group]:shuffle(valid);
      }
      for(let i=0;i<3;i++){
        const ids=tokens(i).map((_,j)=>j),line=s.lines?.[i];
        state.lines[i]=Array.isArray(line)&&new Set(line).size===line.length&&line.every(x=>ids.includes(x))?line:[];
        state.banks[i]=permutation(s.banks?.[i],ids)?s.banks[i]:(ids.length?notSolved(ids):[]);
        state.lineChecked[i]=s.lineChecked?.[i]===true;
        state.answers[i]=listen.includes(s.answers?.[i])?s.answers[i]:'';
        state.heard[i]=s.heard?.[i]===true;state.checked[i]=s.checked?.[i]===true;
      }
    }
  }catch(e){storage=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storage=false;}
    $('#saveStatus').textContent=storage?'Saved on this device · Starters Plus':'Saving unavailable. Save a PDF before closing.';
  }
  const nameOK=()=>/^[a-zA-Z][a-zA-Z '\-]*$/.test(state.name.trim());
  const ageOK=()=>/^\d{1,2}$/.test(state.age)&&Number(state.age)>=5&&Number(state.age)<=99;
  const lineOK=i=>{const t=tokens(i);return t.length>0&&state.lineChecked[i]&&state.lines[i].length===t.length&&state.lines[i].every((v,j)=>v===j);};
  const cardOK=()=>nameOK()&&ageOK()&&[0,1,2].every(lineOK);
  function resetLine(i){const ids=tokens(i).map((_,j)=>j);state.lines[i]=[];state.lineChecked[i]=false;state.banks[i]=ids.length?notSolved(ids):[];state.read=false;}
  function audioButton(word){const b=document.createElement('button');b.className='word-audio';b.type='button';b.textContent='▶';b.dataset.audio=word;b.setAttribute('aria-label','Listen: '+word);return b;}
  function option(value,group,picture,meaning,index){
    const box=document.createElement('div');box.className='choice';const b=document.createElement('button');b.className='pick';b.type='button';b.dataset.group=group;b.dataset.value=value;
    b.setAttribute('aria-label',group.startsWith('q')?'Picture '+(index+1):value);
    if(group==='traits'){
      const frame=document.createElement('span');frame.className='trait-picture';frame.setAttribute('aria-hidden','true');
      const img=document.createElement('img');img.src='assets/trait-scenes.webp';img.alt='';img.draggable=false;
      img.style.left=(-traitPictures[value][0]*100)+'%';img.style.top=(-traitPictures[value][1]*100)+'%';frame.append(img);b.append(frame);
    }else if(group==='skills'||group.startsWith('q')){
      const frame=document.createElement('span');frame.className='skill-picture';frame.setAttribute('aria-hidden','true');
      const img=document.createElement('img');img.src='assets/skill-scenes.webp';img.alt='';img.draggable=false;
      img.style.left=(-skillPictures[value][0]*100)+'%';img.style.top=(-skillPictures[value][1]*100)+'%';frame.append(img);b.append(frame);
    }else if(picture){const art=document.createElement('span');art.className='art';art.style.backgroundPosition=`${picture[0]*100/3}% ${picture[1]*50}%`;art.setAttribute('aria-hidden','true');b.append(art);}
    if(!group.startsWith('q')){
      const text=document.createElement('span');text.className='word';text.textContent=value;b.append(text);
      if(meaning){const small=document.createElement('span');small.className='meaning';small.textContent=meaning;b.append(small);}
    }
    b.onclick=()=>{
      if(group==='jobs'){
        if(state.job!==value){state.job=value;state.skill='';state.order.skills=shuffle(jobs[value].skills);resetLine(0);resetLine(2);renderSkills();renderSentences();}
      }else if(group==='traits'){
        if(state.trait!==value){state.trait=value;resetLine(1);renderSentences();}
      }else if(group==='skills'){
        if(state.skill!==value){state.skill=value;resetLine(2);renderSentences();}
      }else{const i=Number(group.slice(1));state.answers[i]=value;state.checked[i]=false;}
      update();save();
    };
    box.append(b);if(!group.startsWith('q'))box.append(audioButton(value));
    if(group==='traits'){
      const sentence=document.createElement('button');sentence.type='button';sentence.className='meaning-audio';sentence.dataset.audio='trait-'+value;
      sentence.textContent='▶ Listen to the sentence';sentence.setAttribute('aria-label','Listen: '+meaning);box.append(sentence);
    }
    return box;
  }
  function renderSkills(){
    const area=$('#skills');area.replaceChildren();$('#skillHint').hidden=!!state.job;
    state.order.skills.forEach((v,i)=>area.append(option(v,'skills',skills[v],null,i)));
  }
  function renderSentences(){
    const area=$('#sentences');area.replaceChildren();
    const headings=['My job','About me','My skill'];
    for(let i=0;i<3;i++){
      const t=tokens(i),row=document.createElement('div');row.className='sentence-task';row.id='sentence'+i;
      const heading=document.createElement('h3');heading.textContent=(i+1)+' · '+headings[i];row.append(heading);
      if(!t.length){
        const p=document.createElement('p');p.className='small';p.lang='ru';p.textContent=['Сначала выбери профессию в задании 2. Здесь появятся слова для твоего предложения.','Сначала выбери качество для себя в задании 2. Здесь появятся слова для твоего предложения.','Сначала выбери профессию и умение в задании 2. Здесь появятся слова для твоего предложения.'][i];
        const link=document.createElement('a');link.className='choice-link';link.href=['#jobs','#traits','#skills'][i];link.textContent=['Choose my job ↑','Choose my quality ↑','Choose my skill ↑'][i];
        if(i===2&&!state.job)link.href='#jobs';row.append(p,link);area.append(row);continue;
      }
      const line=document.createElement('div');line.className='answer-line';line.setAttribute('aria-label','Your sentence '+(i+1));
      const bank=document.createElement('div');bank.className='bank';bank.setAttribute('aria-label','Word bank '+(i+1));
      const tile=(id,inLine)=>{const b=document.createElement('button');b.type='button';b.textContent=t[id];b.dataset.token=String(id);b.setAttribute('aria-label',(inLine?'Return word: ':'Add word: ')+t[id]);
        b.onclick=()=>{if(inLine)state.lines[i]=state.lines[i].filter(x=>x!==id);else state.lines[i].push(id);state.lineChecked[i]=false;state.read=false;renderSentences();update();save();};return b;};
      state.lines[i].forEach(id=>line.append(tile(id,true)));state.banks[i].filter(id=>!state.lines[i].includes(id)).forEach(id=>bank.append(tile(id,false)));
      const actions=document.createElement('div');actions.className='sentence-actions';const check=document.createElement('button');check.className='check';check.textContent='Check';
      check.onclick=()=>{state.lineChecked[i]=true;update();save();};const clear=document.createElement('button');clear.textContent='Clear';
      clear.onclick=()=>{state.lines[i]=[];state.lineChecked[i]=false;state.read=false;renderSentences();update();save();};actions.append(check,clear);
      const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');row.append(line,bank,actions,feedback);area.append(row);
    }
  }
  function build(){
    for(const group of ['jobs','traits']){const area=$('#'+group);area.replaceChildren();state.order[group].forEach((v,i)=>area.append(option(v,group,group==='jobs'?jobs[v].picture:null,group==='traits'?traits[v]:null,i)));}
    renderSkills();renderSentences();const area=$('#listening');area.replaceChildren();
    for(let i=0;i<3;i++){
      const row=document.createElement('div');row.className='question';row.id='q'+i;
      row.innerHTML=`<h3>Message ${i+1}</h3><button class="audio" data-audio="listen-${i+1}">▶ Listen</button><div class="choices"></div><button class="check">Check</button><p class="feedback" role="status"></p>`;
      state.order['q'+i].forEach((v,j)=>row.querySelector('.choices').append(option(v,'q'+i,skills[v],null,j)));
      row.querySelector('.check').onclick=()=>{state.checked[i]=true;update();save();};area.append(row);
    }
    $('#name').value=state.name;$('#age').value=state.age;update();
  }
  function update(){
    for(const group of ['jobs','traits','skills']){
      const v=state[{jobs:'job',traits:'trait',skills:'skill'}[group]];
      $('#'+group).querySelectorAll('.pick').forEach(b=>{const selected=b.dataset.value===v;b.setAttribute('aria-pressed',String(selected));b.parentElement.classList.toggle('selected',selected);});
    }
    const card=$('#myCard');card.replaceChildren();
    const add=(text,pending)=>{const p=document.createElement('p');p.textContent=text;if(pending)p.className='pending';card.append(p);};
    add('My name is '+(state.name.trim()||'…')+'.');add('I am '+(state.age||'…')+' years old.');
    for(let i=0;i<3;i++){
      const row=$('#sentence'+i),good=lineOK(i);row.classList.toggle('correct',good);row.classList.toggle('wrong',state.lineChecked[i]&&!good);
      const f=row.querySelector('.feedback');if(f)f.textContent=!state.lineChecked[i]?'':good?'✓ Well done!':state.lines[i].length!==tokens(i).length?'Use all the words.':'Try a different word order.';
      add(good?tokens(i).join(' ')+'.':['My job: …','About me: …','My skill: …'][i],!good);
    }
    $('#read').checked=state.read;$('#read').disabled=!cardOK();
    $('#name').setAttribute('aria-invalid',String(!!state.name&&!nameOK()));$('#age').setAttribute('aria-invalid',String(!!state.age&&!ageOK()));
    const done=[];
    for(let i=0;i<3;i++){
      const row=$('#q'+i),good=state.checked[i]&&state.heard[i]&&state.answers[i]===listen[i];done.push(good);row.classList.toggle('done',good);
      row.querySelectorAll('.pick').forEach(b=>{const selected=b.dataset.value===state.answers[i];b.setAttribute('aria-pressed',String(selected));b.parentElement.classList.toggle('selected',selected);b.parentElement.classList.toggle('correct',selected&&good);b.parentElement.classList.toggle('wrong',selected&&state.checked[i]&&state.heard[i]&&!good);});
      row.querySelector('.feedback').textContent=!state.checked[i]?'':!state.heard[i]?'Listen to the whole message first.':!state.answers[i]?'Choose one picture.':good?'✓ Well done!':'Listen again and try another picture.';
    }
    const complete=cardOK()&&state.read&&done.every(Boolean);$('#finish').classList.toggle('ready',complete);
    $('#finishTitle').textContent=complete?'Welcome to the crew!':'Your next adventure awaits';
    $('#finishStatus').textContent=complete?'Mission complete! Your crew pass and Listening Quest are ready.':'Complete your crew pass, read it aloud and finish all three messages.';
  }
  const player=$('#player');let playing=null,request=0;
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-audio]');if(!b)return;const current=++request;player.pause();playing=b.dataset.audio;
    player.src=/^(listen-|trait-)/.test(playing)?'assets/'+playing+'.mp3':'../assets/audio/'+playing.replaceAll(' ','-')+'.mp3';
    $('#audioStatus').textContent='Listening…';try{await player.play();}catch(e){if(current===request)$('#audioStatus').textContent='Audio unavailable. Tap Listen to try again.';}
  });
  player.onended=()=>{if(playing?.startsWith('listen-')){state.heard[Number(playing.slice(-1))-1]=true;update();save();}$('#audioStatus').textContent='';};
  player.onerror=()=>{$('#audioStatus').textContent='Audio unavailable. Tap Listen to try again.';};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.pause();$('#audioStatus').textContent='';}});
  for(const id of ['name','age'])$('#'+id).oninput=e=>{state[id]=e.target.value;state.read=false;update();save();};
  $('#read').onchange=e=>{state.read=e.target.checked;update();save();};
  $('#restart').onclick=()=>{$('#resetBox').hidden=false;$('#cancelReset').focus();};
  $('#cancelReset').onclick=()=>{$('#resetBox').hidden=true;$('#restart').focus();};
  $('#confirmReset').onclick=()=>{request++;player.pause();playing=null;$('#audioStatus').textContent='';state=fresh();build();save();$('#resetBox').hidden=true;$('#name').focus();};
  $('#print').onclick=()=>window.print();build();save();
})();
