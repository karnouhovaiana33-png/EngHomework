'use strict';
(()=>{
  const KEY='english-quest-irregular-time-lab-v1';
  const VERBS=[
    {id:'go',past:'went',ru:'идти, ехать',tail:'to the station.',wrong:'goed',pack:'first'},
    {id:'find',past:'found',ru:'находить',tail:'a key.',wrong:'finded',pack:'first'},
    {id:'send',past:'sent',ru:'отправлять',tail:'a message.',wrong:'sended',pack:'first'},
    {id:'see',past:'saw',ru:'видеть',tail:'a bright light.',wrong:'seed',pack:'first'},
    {id:'have',past:'had',ru:'иметь',tail:'a new idea.',wrong:'haved',pack:'first'},
    {id:'do',past:'did',ru:'делать',tail:'my homework.',wrong:'doed',pack:'first'},
    {id:'come',past:'came',ru:'приходить',tail:'back home.',wrong:'comed',pack:'travel'},
    {id:'get',past:'got',ru:'получать',tail:'a letter.',wrong:'getted',pack:'travel'},
    {id:'take',past:'took',ru:'брать',tail:'a photo.',wrong:'taked',pack:'travel'},
    {id:'give',past:'gave',ru:'давать',tail:'my friend a book.',wrong:'gived',pack:'travel'},
    {id:'make',past:'made',ru:'делать, создавать',tail:'a paper boat.',wrong:'maked',pack:'travel'},
    {id:'meet',past:'met',ru:'встречать',tail:'a friend.',wrong:'meeted',pack:'travel'},
    {id:'eat',past:'ate',ru:'есть',tail:'an apple.',wrong:'eated',pack:'adventure'},
    {id:'drink',past:'drank',ru:'пить',tail:'some water.',wrong:'drinked',pack:'adventure'},
    {id:'run',past:'ran',ru:'бегать',tail:'to the gate.',wrong:'runned',pack:'adventure'},
    {id:'swim',past:'swam',ru:'плавать',tail:'in the lake.',wrong:'swimmed',pack:'adventure'},
    {id:'read',past:'read',ru:'читать',tail:'a book.',wrong:'readed',pack:'adventure',note:'Написание не меняется. V1: /riːd/; V2: /red/.'},
    {id:'write',past:'wrote',ru:'писать',tail:'a short note.',wrong:'writed',pack:'adventure'},
    {id:'buy',past:'bought',ru:'покупать',tail:'a ticket.',wrong:'buyed',pack:'challenge'},
    {id:'bring',past:'brought',ru:'приносить',tail:'a torch.',wrong:'bringed',pack:'challenge'},
    {id:'catch',past:'caught',ru:'ловить',tail:'a ball.',wrong:'catched',pack:'challenge'},
    {id:'think',past:'thought',ru:'думать',tail:'about the map.',wrong:'thinked',pack:'challenge'},
    {id:'put',past:'put',ru:'класть',tail:'the key in my bag.',wrong:'putted',pack:'challenge',note:'В Past Simple форма put не меняется.'},
    {id:'sleep',past:'slept',ru:'спать',tail:'in a tent.',wrong:'sleeped',pack:'challenge'}
  ];
  const INDEX=Object.fromEntries(VERBS.map(v=>[v.id,v]));
  const PACKS=[
    {id:'first',title:'Первые шесть',line:'go · find · send · see · have · do'},
    {id:'travel',title:'В путь',line:'come · get · take · give · make · meet'},
    {id:'adventure',title:'Маленькое приключение',line:'eat · drink · run · swim · read · write'},
    {id:'challenge',title:'Ещё один шаг',line:'buy · bring · catch · think · put · sleep'},
    {id:'all',title:'Все 24 глагола',line:'Смешать все наборы'}
  ];
  const KINDS={pairs:{title:'Парные порталы',brief:'Соедини V1 и V2'},spell:{title:'Сборка капсулы',brief:'Собери слово из букв'},recall:{title:'Код по памяти',brief:'Напиши прошедшую форму'},context:{title:'Запись из прошлого',brief:'Выбери слово для истории'},repair:{title:'Ремонт записи',brief:'Исправь неверную форму'}};
  const MODES=[{id:'mix',title:'◈ Микс из пяти игр'},...Object.entries(KINDS).map(([id,k])=>({id,title:k.title}))];
  const $=s=>document.querySelector(s);
  const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=x=>JSON.parse(JSON.stringify(x));
  const norm=x=>String(x??'').trim().toLowerCase().replace(/[.!?]$/,'');
  const shuffle=xs=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(a.length>1&&a.every((x,i)=>x===xs[i]))a.push(a.shift());return a;};
  const exactBank=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(x=>b.includes(x));
  const unique=xs=>[...new Set(xs)];
  const button=(text,action,extra='',cls='')=>`<button type="button" data-action="${action}" class="${cls}" ${extra}>${text}</button>`;
  const initial=()=>({version:1,view:'home',settings:{pack:'first',mode:'mix',length:6},current:null,history:[],stats:{}});
  const emptyStats=()=>({checks:0,wrong:0,correct:0,unlocked:false,due:false,streak:0});
  let state=initial(),storageOK=true,corrupt=false,noticeTimer,pendingStart=null;

  function makeRound(kind,id,pool){
    const v=INDEX[id];
    const options=unique([v.past,v.id,v.wrong,...VERBS.filter(w=>w.id!==id).map(w=>w.past)]).slice(0,3);
    const ids=[id,...shuffle(pool.filter(x=>x!==id)).slice(0,3)];
    const leftOrder=shuffle(ids);let rightOrder=shuffle(ids);
    if(rightOrder.every((x,i)=>x===leftOrder[i]))rightOrder.push(rightOrder.shift());
    return {kind,verb:id,ids,leftOrder,rightOrder,options:shuffle(options),letters:shuffle([...v.past].map((_,i)=>i)),entry:'',choice:'',tokens:[],left:'',right:'',matched:[],tries:{},missed:[],hints:{},samples:[],assisted:[],status:'idle',checked:false,lastPair:''};
  }
  function hydrateRound(raw){
    if(!raw||!KINDS[raw.kind]||!INDEX[raw.verb])throw Error('Invalid exercise');
    const r=makeRound(raw.kind,raw.verb,VERBS.map(v=>v.id));
    {
      if(!Array.isArray(raw.ids)||raw.ids.length<1||raw.ids.length>4||(raw.kind==='pairs'&&raw.ids.length!==4)||new Set(raw.ids).size!==raw.ids.length||!raw.ids.every(id=>INDEX[id]))throw Error('Invalid pairs');
      r.ids=[...raw.ids];
      if(!exactBank(raw.leftOrder,r.ids)||!exactBank(raw.rightOrder,r.ids))throw Error('Invalid pair bank');
      r.leftOrder=[...raw.leftOrder];r.rightOrder=[...raw.rightOrder];
      r.left=r.ids.includes(raw.left)?raw.left:'';r.right=r.ids.includes(raw.right)?raw.right:'';
      r.matched=unique((raw.matched||[]).filter(id=>r.ids.includes(id)));
    }
    if(!exactBank(raw.letters,r.letters))throw Error('Invalid letters');
    r.letters=[...raw.letters];
    if(!exactBank(raw.options,r.options))throw Error('Invalid choices');
    r.options=[...raw.options];
    r.entry=String(raw.entry??'').slice(0,35);r.choice=r.options.includes(raw.choice)?raw.choice:'';
    r.tokens=unique((raw.tokens||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<INDEX[r.verb].past.length));
    for(const id of r.kind==='pairs'?r.ids:[r.verb]){
      if(Number.isInteger(raw.tries?.[id])&&raw.tries[id]>=0)r.tries[id]=Math.min(raw.tries[id],10000);
      if(Number.isInteger(raw.hints?.[id])&&raw.hints[id]>=0)r.hints[id]=Math.min(raw.hints[id],INDEX[id].past.length-1);
    }
    for(const k of ['missed','samples','assisted'])r[k]=unique((raw[k]||[]).filter(id=>(r.kind==='pairs'?r.ids:[r.verb]).includes(id)));
    r.status=['idle','empty','wrong','correct','hint'].includes(raw.status)?raw.status:'idle';
    r.checked=raw.checked===true;r.lastPair=r.matched.includes(raw.lastPair)?raw.lastPair:'';
    return r;
  }
  function hydrateSession(raw){
    if(!raw||!Array.isArray(raw.rounds)||!raw.rounds.length||raw.rounds.length>48)throw Error('Invalid series');
    const s={id:String(raw.id||Date.now()),config:{...raw.config},rounds:raw.rounds.map(hydrateRound),index:0,started:String(raw.started||''),completed:false,ended:String(raw.ended||'')};
    s.index=Number.isInteger(raw.index)?Math.max(0,Math.min(raw.index,s.rounds.length-1)):0;
    s.completed=raw.completed===true&&s.rounds.every(done);
    return s;
  }
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw){
      if(raw.version!==1)throw Error('Unknown version');
      state.settings={pack:PACKS.some(p=>p.id===raw.settings?.pack)?raw.settings.pack:'first',mode:MODES.some(m=>m.id===raw.settings?.mode)?raw.settings.mode:'mix',length:[6,10,12].includes(raw.settings?.length)?raw.settings.length:6};
      state.current=raw.current?hydrateSession(raw.current):null;
      state.history=(Array.isArray(raw.history)?raw.history:[]).slice(-10).map(hydrateSession);
      for(const v of VERBS){
        const s=raw.stats?.[v.id];if(!s)continue;
        state.stats[v.id]={...emptyStats(),checks:Math.max(0,Number(s.checks)||0),wrong:Math.max(0,Number(s.wrong)||0),correct:Math.max(0,Number(s.correct)||0),unlocked:s.unlocked===true,due:s.due===true,streak:Math.max(0,Math.min(2,Number(s.streak)||0))};
      }
      state.view=['home','play','results','book'].includes(raw.view)?raw.view:'home';
      if(!state.current&&['play','results'].includes(state.view))state.view='home';
      if(state.view==='results'&&!state.current.completed)state.view='play';
    }
  }catch(error){storageOK=false;corrupt=true;}
  function status(){
    const p=$('#storageStatus');p.className='storage-status'+(!storageOK?' warning':'');
    p.textContent=corrupt?'Сохранение не удалось прочитать. Старая запись сохранена; новую серию можно начать явно.':storageOK?'Прогресс сохраняется в этом браузере.':'Браузер не сохранил прогресс. Скачай его через «Ещё» перед закрытием.';
  }
  function save(){
    if(corrupt){status();return;}
    try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}
    status();
  }
  function notice(text){clearTimeout(noticeTimer);$('#notice').textContent=text;$('#notice').classList.add('visible');noticeTimer=setTimeout(()=>$('#notice').classList.remove('visible'),3500);}
  const active=()=>state.current?.rounds[state.current.index];
  const stat=id=>state.stats[id]??=(emptyStats());
  const dueIds=()=>VERBS.filter(v=>state.stats[v.id]?.due).map(v=>v.id);
  const earned=()=>VERBS.filter(v=>state.stats[v.id]?.unlocked);
  function response(r){if(r.kind==='spell')return r.tokens.map(i=>INDEX[r.verb].past[i]).join('');if(r.kind==='context')return r.choice;return r.entry;}
  function done(r){return r.kind==='pairs'?r.matched.length===r.ids.length:r.checked&&norm(response(r))===INDEX[r.verb].past;}
  function seriesTitle(s){return s.config.pack==='review'?'Повторение ошибок':PACKS.find(p=>p.id===s.config.pack)?.title||'Серия глаголов';}
  function mastered(r,id){
    const s=stat(id);s.checks++;s.correct++;s.unlocked=true;
    if(r.assisted.includes(id)){s.due=true;s.streak=0;}
    else if(['recall','repair'].includes(r.kind)){s.streak=Math.min(2,s.streak+1);if(s.streak>=2)s.due=false;}
  }
  function missed(r,id){const s=stat(id);s.checks++;s.wrong++;s.due=true;s.streak=0;r.missed=unique([...r.missed,id]);}
  function support(r,id){r.assisted=unique([...r.assisted,id]);stat(id).due=true;stat(id).streak=0;}
  function newSession(config){
    if(state.current)state.history=[...state.history,clone(state.current)].slice(-10);
    if(corrupt){try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(KEY+'-recovery',old);}catch{}corrupt=false;}
    let rounds=[];
    if(config.pack==='review'){
      const pool=shuffle(config.pool);for(let lap=0;lap<2;lap++)for(const id of shuffle(pool))rounds.push(makeRound(lap?'repair':'recall',id,pool));
    }else{
      const pool=shuffle(VERBS.filter(v=>config.pack==='all'||v.pack===config.pack).map(v=>v.id));
      const cycle=['pairs','spell','context','recall','repair','recall'];
      for(let i=0;i<config.length;i++)rounds.push(makeRound(config.mode==='mix'?cycle[i%cycle.length]:config.mode,pool[i%pool.length],pool));
    }
    state.current={id:Date.now()+'-'+Math.floor(Math.random()*100000),config:clone(config),rounds,index:0,started:new Date().toISOString(),completed:false,ended:''};
    state.view='play';save();render();top();
  }
  function askStart(config){
    if(state.current&&!state.current.completed){
      pendingStart=config;
      dialog('Начать новую серию?',`<p>Текущая серия останется в истории. Её ответы не перейдут в новую серию. Статистика глаголов сохранится.</p><div class="dialog-actions">${button('Продолжить текущую','resume-dialog','','subtle')}${button('Начать новую серию','confirm-start','','primary')}</div>`);
    }else newSession(config);
  }
  function startReview(){const pool=dueIds();if(!pool.length){notice('Сейчас нет глаголов на повторение.');return;}askStart({pack:'review',mode:'review',length:pool.length*2,pool});}
  function top(){window.scrollTo({top:0,behavior:'instant'});}
  function dialog(title,content){$('#dialogContent').innerHTML=`<p class="kicker">TIME LAB</p><h2 id="dialogTitle">${E(title)}</h2>${content}`;$('#labDialog').showModal();}
  function historyView(){
    if(!state.history.length)return '<p class="empty-history">Здесь появятся последние серии. Текущая попытка сохраняется отдельно.</p>';
    return `<ul class="session-history">${state.history.slice(-3).reverse().map(s=>`<li><b>${E(seriesTitle(s))}</b>${s.rounds.filter(done).length} из ${s.rounds.length} · ${s.completed?'завершена':'сохранена незавершённой'}</li>`).join('')}</ul>`;
  }
  function settingsSummary(){
    const mode=MODES.find(m=>m.id===state.settings.mode);
    return state.settings.length+' заданий · '+(state.settings.mode==='mix'?'пять типов игр':mode.title);
  }
  function homeView(){
    const cfg=state.settings,s=state.current;
    return `<section class="hero"><div><p class="kicker">IRREGULAR VERBS · YOUR OWN PACE</p><h1>Верни словам<br><em>их прошлое.</em></h1><p>Найди пары, собери слова и вспомни прошедшие формы. Выбери набор — остальные настройки уже готовы.</p><div class="hero-tags"><span>24 глагола</span><span>5 игровых механик</span><span>Без таймера</span></div></div><div class="clock-art" aria-hidden="true"><div class="clock-ring"></div><div class="clock-face"><b>V1 ↶ V2</b><small>PAST SIMPLE</small></div><span class="clock-label a">TODAY</span><span class="clock-label b">YESTERDAY</span></div></section>
      <div class="dashboard"><section class="paper setup-paper">
        ${s?`<div class="resume-banner"><div><b>${s.completed?'✓ Серия завершена':'Есть сохранённая серия'}</b><p>${E(seriesTitle(s))} · готово ${s.rounds.filter(done).length} из ${s.rounds.length}</p></div>${button(s.completed?'Результат':'Продолжить','resume','','primary')}</div>`:''}
        <h2>${s?'Новая тренировка':'Начнём тренировку'}</h2>
        <label class="setting-field" for="packChoice">Набор глаголов<select id="packChoice" data-setting="pack">${PACKS.map(p=>`<option value="${p.id}" ${cfg.pack===p.id?'selected':''}>${E(p.title)}</option>`).join('')}</select></label>
        <p id="packPreview" class="pack-preview">${E(PACKS.find(p=>p.id===cfg.pack).line)}</p>
        <details class="advanced-settings"><summary>Настроить тренировку</summary><div class="advanced-fields">
          <label class="setting-field" for="modeChoice">Тип игры<select id="modeChoice" data-setting="mode">${MODES.map(m=>`<option value="${m.id}" ${cfg.mode===m.id?'selected':''}>${E(m.title)}</option>`).join('')}</select></label>
          <label class="setting-field" for="lengthChoice">Заданий в серии<select id="lengthChoice" data-setting="length">${[6,10,12].map(n=>`<option value="${n}" ${cfg.length===n?'selected':''}>${n}</option>`).join('')}</select></label>
        </div></details>
        <div class="setup-action"><div><p id="setupSummary" class="setup-summary">${E(settingsSummary())}</p><small>Можно прерваться и продолжить позже.</small></div>${button('Начать '+cfg.length+' заданий →','start','id="startButton"','copper')}</div>
      </section><aside><section class="sidebar-card"><p class="kicker">YOUR COLLECTION</p><h2>Полевой блокнот</h2><div class="metric"><span>Формы в справочнике</span><strong>${earned().length}<small style="font:13px 'Segoe UI'"> / 24</small></strong></div><div class="metric"><span>На повторение</span><strong>${dueIds().length}</strong></div><p>Справочник и прошлые ответы — в меню «Ещё».</p>${dueIds().length?button('Повторить сложные ↶','review','','subtle'):''}</section><section class="sidebar-card"><p class="kicker">SAVED SESSIONS</p><h2>История серий</h2>${historyView()}</section></aside></div>`;
  }
  function field(r){
    const v=INDEX[r.verb],locked=done(r)?'disabled':'';
    if(r.kind==='pairs')return `<div class="pairs-grid"><div class="pair-column"><span class="pair-column-title">V1 · НАЧАЛЬНАЯ ФОРМА</span>${r.leftOrder.map(id=>button(`<b>${E(id)}</b><small>${E(INDEX[id].ru)}</small>`,'pair-left',`data-id="${id}" aria-pressed="${r.left===id}" ${r.matched.includes(id)?'disabled':''}`,`pair-word ${r.left===id?'selected':''} ${r.matched.includes(id)?'matched':''} ${r.status==='wrong'&&r.left===id?'wrong':''}`)).join('')}</div><div class="pair-column"><span class="pair-column-title">V2 · ПРОШЕДШАЯ ФОРМА</span>${r.rightOrder.map(id=>button(`<b>${E(INDEX[id].past)}</b><span class="pair-mark">${r.matched.includes(id)?'✓':''}</span>`,'pair-right',`data-id="${id}" aria-pressed="${r.right===id}" ${r.matched.includes(id)?'disabled':''}`,`pair-word ${r.right===id?'selected':''} ${r.matched.includes(id)?'matched':''} ${r.status==='wrong'&&r.right===id?'wrong':''}`)).join('')}</div></div><p class="match-progress">Восстановлено пар: ${r.matched.length} из ${r.ids.length}</p>`;
    const capsule=`<div class="verb-capsule"><strong data-current-verb="${v.id}">${E(v.id)}</strong><span>${E(v.ru)}</span><small>V1 → V2</small></div>`;
    if(r.kind==='spell')return capsule+`<div class="word-slots" aria-label="Твоё слово">${r.tokens.map((i,pos)=>button(E(v.past[i]),'remove-letter',`data-position="${pos}" ${locked}`)).join('')}</div><div class="letter-bank" aria-label="Буквы для сборки">${r.letters.map(i=>button(E(v.past[i]),'letter',`data-index="${i}" data-used="${r.tokens.includes(i)}" aria-hidden="${r.tokens.includes(i)}" ${r.tokens.includes(i)?'disabled':''} ${locked}`)).join('')}</div>`;
    if(r.kind==='context')return capsule+`<p class="sentence-source">Yesterday, I <strong>${done(r)?E(v.past):'___'}</strong> ${E(v.tail)}</p><div class="context-options">${r.options.map(value=>button(E(value),'option',`data-value="${E(value)}" aria-pressed="${r.choice===value}" ${locked}`,r.choice===value?'selected':'')).join('')}</div>`;
    const sentence=r.kind==='repair'?`<p class="sentence-source">Yesterday, I ${done(r)?`<strong>${E(v.past)}</strong>`:`<s>${E(v.wrong)}</s>`} ${E(v.tail)}</p>`:'';
    return capsule+sentence+`<label class="answer-label" for="answer">${r.kind==='repair'?'Напиши правильную форму вместо ошибки':'Прошедшая форма — одно слово'}<input id="answer" class="answer-input" type="text" value="${E(r.entry)}" maxlength="35" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ${locked}></label>`;
  }
  function feedback(r){
    if(done(r))return `<div class="feedback good" role="status">✓ ${r.kind==='pairs'?'Все четыре пары восстановлены.':r.assisted.length?'Верно. В этот раз помогла опора.':'Верно! Форма восстановлена.'}</div>`;
    if(r.status==='empty')return '<div class="feedback bad" role="status">Сначала выбери пару или запиши свой ответ.</div>';
    if(r.status==='wrong')return `<div class="feedback bad" role="status">↻ ${r.kind==='pairs'?'Эта пара не подходит. Попробуй другую.':'Пока не получилось. Измени ответ и проверь ещё раз.'}</div>`;
    if(r.lastPair)return `<div class="feedback good" role="status">✓ ${E(r.lastPair)} → ${E(INDEX[r.lastPair].past)}. Найди следующую пару.</div>`;
    return '<div class="feedback" role="status">Не торопись. За повторную попытку нет штрафа.</div>';
  }
  function hintId(r){return r.kind==='pairs'?r.left:r.verb;}
  function earnedLine(r){
    if(!done(r)||r.kind==='pairs')return '';
    const v=INDEX[r.verb];return `<div class="earned-answer"><strong>${E(v.id)} → ${E(v.past)}</strong><br>Yesterday, I ${E(v.past)} ${E(v.tail)}${v.note?`<small>${E(v.note)}</small>`:''}</div>`;
  }
  function gameView(){
    const s=state.current,r=active(),kind=KINDS[r.kind],id=hintId(r),finished=done(r);
    const titles={pairs:'Соедини временные порталы',spell:'Собери прошедшую форму',recall:'Вспомни без вариантов',context:'Закончи запись о вчера',repair:'Найди и исправь сбой'};
    const prompts={pairs:'Выбери слово слева и его прошедшую форму справа. Затем проверь пару.',spell:'Буквы перепутались. Собери V2. Нажми на букву в слове, чтобы вернуть её.',recall:'Посмотри на начальную форму. Напиши V2 по памяти.',context:'В записи речь о вчерашнем дне. Выбери подходящую форму глагола.',repair:'В записи неверная форма глагола. Замени только это слово.'};
    const prefix=id&&r.hints[id]?INDEX[id].past.slice(0,r.hints[id])+'·'.repeat(INDEX[id].past.length-r.hints[id]):'';
    const sample=id&&r.samples.includes(id)?INDEX[id].past:'';
    const canHint=id&&!finished&&(r.tries[id]||0)>0&&!sample&&(r.hints[id]||0)<INDEX[id].past.length-1;
    const canSample=id&&!finished&&(r.tries[id]||0)>=2&&!sample;
    const help=canHint||canSample?`<details class="task-help" ${r.assisted.includes(id)?'open':''}><summary>Нужна подсказка?</summary><div>${canHint?button('Открыть ещё одну букву','hint','','subtle'):''}${canSample?button('Посмотреть образец','sample','','subtle'):''}<p>С опорой можно потренироваться; потом глагол вернётся на повторение.</p></div></details>`:'';
    return `<div class="game-heading"><div><div><p class="kicker">${E(seriesTitle(s))}</p><h1>${E(kind.title)}</h1></div></div><span class="series-count">${s.index+1} / ${s.rounds.length}</span></div><div class="progress-track" aria-label="Выполнено ${s.rounds.filter(done).length} из ${s.rounds.length}"><span style="width:${s.rounds.filter(done).length/s.rounds.length*100}%"></span></div>
      <div class="game-grid streamlined"><section class="paper exercise" data-kind="${r.kind}"><div class="exercise-head"><p class="kicker">${E(kind.brief)}</p><small>${r.kind==='pairs'?'4 пары · две формы':'PAST SIMPLE · V2'}</small></div><h2>${E(titles[r.kind])}</h2><p class="instruction">${E(prompts[r.kind])}</p>${field(r)}${prefix?`<div class="support-message">Первые буквы V2: <b>${E(prefix)}</b></div>`:''}${sample?`<div class="support-message">Образец: <b>${E(id)} → ${E(sample)}</b>. Теперь введи или собери форму сам(а).</div>`:''}${feedback(r)}${earnedLine(r)}${help}<footer class="exercise-footer streamlined-footer"><span class="support-caption">${r.assisted.length?'В этом задании использована опора.':''}</span>${!finished?button(r.kind==='pairs'?'Проверить пару':'Проверить','check','','primary'):button(s.index===s.rounds.length-1?'Результат →':'Дальше →','next','','primary')}</footer></section></div>`;
  }
  function resultView(){
    const s=state.current;const first=s.rounds.filter(r=>done(r)&&!r.missed.length&&!r.assisted.length).length;
    const assisted=s.rounds.filter(r=>r.assisted.length).length,errors=unique(s.rounds.flatMap(r=>r.missed));
    const wordIds=unique(s.rounds.flatMap(r=>r.kind==='pairs'?r.ids:[r.verb]));
    return `<section class="completed-view"><div class="result-top"><span class="result-medallion" aria-hidden="true">↶</span><p class="kicker">SESSION COMPLETE · SAVED</p><h1>Капсулы восстановлены.</h1><p>${E(seriesTitle(s))} · ${s.rounds.length} заданий. Твой результат сохранён.</p></div><article class="paper"><h2>Что получилось</h2><div class="result-metrics"><div><strong>${first}</strong><span>с первой попытки</span></div><div><strong>${assisted}</strong><span>с опорой</span></div><div><strong>${errors.length}</strong><span>глаголов с ошибками</span></div></div><p class="small-label">Формы из этой серии</p><div class="result-words">${wordIds.map(id=>`<span>${E(id)} → <b>${E(INDEX[id].past)}</b></span>`).join('')}</div>${errors.length?`<p class="result-note">Ошибки были в: ${errors.map(E).join(', ')}. Можно вернуться к ним без вариантов ответа.</p>`:'<p class="result-note">Серия прошла без ошибок. Попробуй другой набор или режим «Код по памяти».</p>'}<div class="result-actions">${dueIds().length?button('Повторить сложные · '+dueIds().length,'review','','primary'):''}${button('Новая тренировка','home','',dueIds().length?'subtle':'primary')}</div><p class="result-note">Два самостоятельных ответа в режимах «Код по памяти» и «Ремонт записи» снимают глагол с повторения. Это учебная отметка, а не оценка владения языком.</p></article></section>`;
  }
  function bookView(){
    return `<div class="game-heading"><div><div><p class="kicker">EARNED REFERENCE</p><h1>Мои глаголы</h1></div></div><span class="series-count">${earned().length} / 24</span></div><article class="paper"><h2>Твой справочник</h2><p class="instruction">Здесь появляются формы, которые ты уже восстановил(а). Во время задания справочник закрыт — сначала попробуй вспомнить сам(а).</p><div class="book-grid">${VERBS.map(v=>state.stats[v.id]?.unlocked?`<div class="book-card"><strong>${E(v.id)} → ${E(v.past)}</strong><p>${E(v.ru)}</p><small>${state.stats[v.id]?.due?'↶ Вернёмся на повторении':'✓ Пара восстановлена'}${v.note?' · '+E(v.note):''}</small></div>`:`<div class="book-card locked"><strong>${E(v.id)} → ···</strong><p>${E(v.ru)}</p><small>Форма откроется после верного ответа.</small></div>`).join('')}</div><div class="book-actions">${button('Скачать мои пары','download-book',earned().length?'':'disabled','primary')}${dueIds().length?button('Повторить сложные','review','','subtle'):''}</div></article>`;
  }
  function render(){
    $('#app').innerHTML=state.view==='home'?homeView():state.view==='play'?gameView():state.view==='results'?resultView():bookView();
    $('#menuItems').innerHTML=(state.view!=='play'&&state.view!=='book'?button('Мои глаголы','book','id="bookButton"'):'')
      +(state.view==='play'&&state.current.index>0?button('Предыдущее задание','back'):'')
      +(state.current?.completed&&state.view!=='play'?button('Мои ответы в серии','review-session'):'')
      +(state.current?button('Начать серию заново','restart'):'')
      +button('Скачать прогресс','export')+button('Как играть','about');
    status();
  }
  function check(){
    const r=active();if(done(r))return;
    const id=r.kind==='pairs'?r.left:r.verb,value=r.kind==='pairs'?r.right:response(r);
    if(!id||!String(value).trim()){r.status='empty';r.checked=true;save();render();return;}
    r.tries[id]=(r.tries[id]||0)+1;r.checked=true;
    const correct=r.kind==='pairs'?r.left===r.right:norm(value)===INDEX[id].past;
    if(correct){
      mastered(r,id);r.status='correct';
      if(r.kind==='pairs'){r.matched.push(id);r.lastPair=id;r.left='';r.right='';}
    }else{missed(r,id);r.status='wrong';r.lastPair='';}
    save();render();
  }
  function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
    $('#labMenu').open=false;
    if(action==='close-dialog'){$('#labDialog').close();return;}
    if(action==='about'){dialog('Как устроена лаборатория',`<ol class="about-list"><li>Выбери набор из шести глаголов или все 24.</li><li>В миксе есть пары, сборка букв, выбор в контексте, ответ по памяти и исправление ошибки.</li><li>После своей попытки можно открыть буквы. После двух — посмотреть образец.</li><li>Трудные глаголы вернутся в отдельной серии без вариантов. Можно прерваться: ответы сохранятся.</li><li>Верные пары пополняют «Мои глаголы». Повторная серия не стирает статистику. В истории хранятся 10 последних серий.</li></ol><div class="dialog-actions">${button('Понятно','close-dialog','','primary')}</div>`);return;}
    if(action==='export'){download('time-lab-progress.json',JSON.stringify(state,null,2),'application/json;charset=utf-8');notice('Копия прогресса скачана.');return;}
    if(action==='download-book'){download('my-irregular-verbs.txt','MY IRREGULAR VERBS\n\n'+earned().map(v=>v.id+' → '+v.past+' — '+v.ru+(v.note?'\n'+v.note:'')).join('\n')+'\n','text/plain;charset=utf-8');return;}
    if(action==='home'){state.view='home';save();render();top();return;}
    if(action==='book'){if(state.view==='play')return;state.view='book';save();render();top();return;}
    if(action==='start'){askStart({...state.settings});return;}
    if(action==='review'){startReview();return;}
    if(action==='confirm-start'){$('#labDialog').close();const cfg=pendingStart;pendingStart=null;newSession(cfg);return;}
    if(action==='resume-dialog'){$('#labDialog').close();state.view='play';save();render();top();return;}
    if(action==='resume'){state.view=state.current.completed?'results':'play';save();render();top();return;}
    if(action==='review-session'){state.current.index=0;state.view='play';save();render();top();return;}
    const r=active();if(!r)return;
    if(action==='restart'){pendingStart=clone(state.current.config);dialog('Начать серию заново?',`<p>Твои ответы останутся в истории. Новая попытка начнётся с первого задания. Общий справочник и статистика сохранятся.</p><div class="dialog-actions">${button('Оставить мою работу','close-dialog','','subtle')}${button('Начать заново','confirm-start','','primary')}</div>`);return;}
    if(action==='back'){state.current.index=Math.max(0,state.current.index-1);save();render();top();return;}
    if(action==='next'){
      if(!done(r))return;
      if(state.current.index<state.current.rounds.length-1)state.current.index++;
      else{state.current.completed=true;state.current.ended=new Date().toISOString();state.view='results';}
      save();render();top();return;
    }
    if(action==='check'){check();return;}
    if(done(r))return;
    if(action==='hint'||action==='sample'){
      const id=hintId(r);if(!id||(r.tries[id]||0)<(action==='sample'?2:1))return;
      support(r,id);
      if(action==='hint')r.hints[id]=Math.min(INDEX[id].past.length-1,(r.hints[id]||0)+1);
      else r.samples=unique([...r.samples,id]);
      save();render();return;
    }
    r.status='idle';r.checked=false;r.lastPair='';
    if(action==='pair-left'&&!r.matched.includes(b.dataset.id))r.left=b.dataset.id;
    if(action==='pair-right'&&!r.matched.includes(b.dataset.id))r.right=b.dataset.id;
    if(action==='letter'){const i=Number(b.dataset.index);if(!r.tokens.includes(i))r.tokens.push(i);}
    if(action==='remove-letter')r.tokens.splice(Number(b.dataset.position),1);
    if(action==='option')r.choice=b.dataset.value;
    save();render();
  });
  document.addEventListener('input',e=>{
    if(e.target.id!=='answer'||!active()||done(active()))return;
    const r=active();r.entry=e.target.value;r.checked=false;r.status='idle';
    const f=$('.feedback');if(f){f.className='feedback';f.textContent='Проверь ответ, когда будешь готов(а).';}save();
  });
  document.addEventListener('change',e=>{
    const key=e.target.dataset.setting;if(!key)return;
    const value=key==='length'?Number(e.target.value):e.target.value;
    if(key==='pack'&&!PACKS.some(p=>p.id===value)||key==='mode'&&!MODES.some(m=>m.id===value)||key==='length'&&![6,10,12].includes(value))return;
    state.settings[key]=value;save();
    $('#packPreview').textContent=PACKS.find(p=>p.id===state.settings.pack).line;
    $('#setupSummary').textContent=settingsSummary();
    $('#startButton').textContent='Начать '+state.settings.length+' заданий →';
  });
  document.addEventListener('keydown',e=>{if(e.target.id==='answer'&&e.key==='Enter'){e.preventDefault();check();}});
  render();
})();
