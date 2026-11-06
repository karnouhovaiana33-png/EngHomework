/* Offline homework. Only authored text is inserted as HTML; pupil text is escaped. */
(() => {
  'use strict';
  const KEY = 'english-quest-homework04-movers-v1';
  const ARCHIVE = KEY + '-archive';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v ?? '').trim().toLowerCase().replace(/[.!?]+$/g, '').trim();
  const shuffle = values => {
    const a = [...values];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (a.length > 1 && a.every((x, i) => x === values[i])) [a[0], a[1]] = [a[1], a[0]];
    return a;
  };
  const Q = [
    {parts:['Did','you','write','a message','yesterday','?'], extra:'wrote'},
    {parts:['Did','the station','receive','the message','?'], extra:'received'},
    {parts:['Did','the public book','show','the message','?'], extra:'showed'},
  ];
  const M = [
    {source:'Sam sent a message yesterday.', parts:['Did','Sam','_____','a message','yesterday','?'], verb:'send'},
    {source:'Mia checked her bag.', parts:['Did','Mia','_____','her bag','?'], verb:'check'},
    {source:'Ben wrote a letter yesterday.', parts:['Did','Ben','_____','a letter','yesterday','?'], verb:'write'},
  ];
  const STORY = [
    {start:'First, he', end:'the red lights.', verb:'checked', image:'frame-a.webp'},
    {start:'Then, he', end:'a message.', verb:'wrote', image:'frame-b.webp'},
    {start:'Next, he', end:'the message.', verb:'sent', image:'frame-c.webp'},
    {start:'Finally, the station', end:'the message.', verb:'received', image:'frame-d.webp'},
  ];
  const MODEL = ['Did Sam send a message yesterday?','Did Mia check her bag?','Did Ben write a letter yesterday?',
    'First, he checked the red lights.','Then, he wrote a message.','Next, he sent the message.','Finally, the station received the message.'];
  const makeVerbBank = () => {
    const bank = shuffle(['send','check','write','open','read']);
    if (bank.filter(v => ['send','check','write'].includes(v)).join() === 'send,check,write') {
      const a = bank.indexOf('send'), b = bank.indexOf('check'); [bank[a],bank[b]] = [bank[b],bank[a]];
    }
    return bank;
  };
  const empty = () => ({name:'', bank:makeVerbBank(), storyBank:shuffle(STORY.map(x => x.verb)),
    questions:Q.map(q => ({bank:shuffle([...q.parts,q.extra]), order:[], checked:false, attempted:false})),
    missing:M.map(q => ({bank:shuffle(q.parts), order:[], verb:'', checked:false, attempted:false})),
    story:['','','',''], storyChecked:[false,false,false,false], storyAttempted:false,
    heardWarmup:false, warmupSpoken:false, finalUnlocked:false, heardFinal:false,
    questionsSpoken:false, storySpoken:false, completed:false, version:1});
  let storageFailed = false;
  let blockSave = false;
  let archives = [];
  let s;
  try {
    const saved = localStorage.getItem(KEY);
    s = saved ? JSON.parse(saved) : empty();
    archives = JSON.parse(localStorage.getItem(ARCHIVE) || '[]');
    if (!Array.isArray(archives)) archives = [];
    if (!s || s.version !== 1 || s.questions?.length !== 3 || s.missing?.length !== 3 || s.story?.length !== 4) {
      throw new Error('Unknown saved work');
    }
  } catch (_) { s = empty(); storageFailed = true; blockSave = true; }
  const loadedImages = new Set();
  const questionOK = (group, i) => {
    const data = group === 'questions' ? Q[i] : M[i], work = s[group][i];
    return work.checked && work.order.length === data.parts.length &&
      work.order.every((x, j) => x === data.parts[j]) && (group !== 'missing' || norm(work.verb) === data.verb);
  };
  const storyOK = i => s.storyChecked[i] && norm(s.story[i]) === STORY[i].verb;
  const allCorrect = () => Q.every((_,i) => questionOK('questions',i)) && M.every((_,i) => questionOK('missing',i)) && STORY.every((_,i) => storyOK(i));
  const attemptedAll = () => s.questions.every(x => x.attempted) && s.missing.every(x => x.attempted) && s.storyAttempted;
  const finishReady = () => allCorrect() && s.heardWarmup && s.warmupSpoken && s.finalUnlocked && s.heardFinal && s.questionsSpoken && s.storySpoken;
  function save() {
    if (blockSave) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); storageFailed = false; }
    catch (_) { storageFailed = true; }
  }
  function invalidate() {
    s.completed = false; s.questionsSpoken = false; s.storySpoken = false;
    $('#finishStatus').textContent = '';
  }
  function update() {
    if (attemptedAll()) s.finalUnlocked = true;
    if (s.completed && !finishReady()) s.completed = false;
    $('#warmupSpoken').disabled = !s.heardWarmup;
    $('#warmupSpoken').checked = !!s.warmupSpoken;
    $('#warmupHint').hidden = !!s.heardWarmup;
    $('#modelLock').hidden = !!s.finalUnlocked;
    $('#speakingModel').hidden = !s.finalUnlocked;
    const final = $('#finalAudio');
    if (s.finalUnlocked && !final.getAttribute('src')) final.src = final.dataset.src;
    if (!s.finalUnlocked && final.getAttribute('src')) { final.pause(); final.removeAttribute('src'); final.load(); }
    for (const id of ['questionsSpoken','storySpoken']) { $('#' + id).disabled = !s.heardFinal; $('#' + id).checked = !!s[id]; }
    $('#oralHint').hidden = !!s.heardFinal;
    const count = [s.warmupSpoken, Q.every((_,i) => questionOK('questions',i)), M.every((_,i) => questionOK('missing',i)), STORY.every((_,i) => storyOK(i)), s.questionsSpoken && s.storySpoken].filter(Boolean).length;
    $('#progressText').textContent = `Готово: ${count} из 5 частей`;
    $('#progressFill').style.width = count * 20 + '%';
    $('#completedBadge').hidden = !s.completed;
    document.body.classList.toggle('is-complete', !!s.completed);
    $('#restore').hidden = !archives.length;
    save();
    $('#completedBadge').textContent = storageFailed ? 'ДЗ выполнено. Сохрани работу через печать / PDF.' : 'ДЗ выполнено. Твоя работа сохранена.';
    $('#saveStatus').textContent = storageFailed ? 'Не удалось сохранить ответы. Не закрывай страницу: сохрани работу через печать / PDF.' : 'Ответы сохраняются в этом браузере.';
    $('#saveStatus').classList.toggle('failure', storageFailed);
  }
  function renderQuestion(group, i) {
    const work = s[group][i], data = group === 'questions' ? Q[i] : M[i];
    const host = $(`#${group}-${i}`), good = questionOK(group,i);
    host.className = 'question-card' + (work.checked ? good ? ' good' : ' bad' : '');
    const status = work.checked ? good ? 'Верно. Произнеси вопрос вслух.' : 'Пока не получилось. Проверь порядок слов' + (group === 'missing' ? ' и форму глагола после Did.' : ' и убери лишнее слово.') : '';
    host.innerHTML = `<div class="card-heading"><span class="card-number">${i+1}</span><p>${group === 'missing' ? 'Преврати предложение в вопрос' : 'Собери вопрос'}</p></div>
      ${group === 'missing' ? `<p class="source"><span>ПРЕДЛОЖЕНИЕ</span><b lang="en">${esc(data.source)}</b></p>` : ''}
      <div class="build-zone" lang="en" aria-label="Твой вопрос ${i+1}">${work.order.length ? work.order.map((word,j) => `<button class="tile chosen ${word === '_____' ? 'gap' : ''}" type="button" data-remove="${group}" data-i="${i}" data-j="${j}" aria-label="Убрать ${esc(word === '_____' ? 'место для глагола' : word)}">${word === '_____' ? `<span data-gap-preview>${esc(work.verb || '_____')}</span>` : esc(word)}</button>`).join('') : '<span class="empty-label" lang="ru">Твой вопрос появится здесь</span>'}</div>
      <div class="tiles" lang="en" aria-label="Перемешанные слова">${work.bank.map((word,j) => `<button class="tile ${word === '_____' ? 'gap' : ''}" type="button" data-pick="${group}" data-i="${i}" data-j="${j}" ${work.order.includes(word) ? 'disabled' : ''} aria-label="Добавить ${esc(word === '_____' ? 'место для глагола' : word)}">${esc(word)}</button>`).join('')}</div>
      ${group === 'missing' ? `<label class="verb-entry" for="verb-${i}">Пропущенный глагол <input id="verb-${i}" data-verb="${i}" value="${esc(work.verb)}" maxlength="30" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Впиши сам(а)"></label>` : ''}
      <div class="check-row"><button type="button" data-check="${group}" data-i="${i}">Проверить вопрос</button><p class="status" role="status">${status}</p></div>`;
  }
  function pictureHTML(i, oral = false) {
    const data = STORY[i];
    return `<div class="story-picture"><img data-image="${i}" ${oral ? 'data-oral-image' : ''} src="assets/${data.image}" width="1536" height="1024" alt="Кадр ${i+1} из истории лаборатории"><span class="frame-number">${i+1}</span><div class="picture-retry" hidden><span>Картинка не загрузилась.</span><button type="button" data-retry-image="${i}">Загрузить ещё раз</button></div></div>`;
  }
  function renderStory() {
    $('#storyCards').innerHTML = STORY.map((data,i) => `<article id="story-${i}" class="story-card">${pictureHTML(i)}<div class="story-writing"><label lang="en" for="story-verb-${i}">${data.start} <input id="story-verb-${i}" data-story="${i}" value="${esc(s.story[i])}" maxlength="30" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Пропущенный глагол, кадр ${i+1}" disabled> ${data.end}</label><p class="status" role="status"></p></div></article>`).join('');
    for (let i=0;i<4;i++) paintStory(i);
  }
  function paintStory(i) {
    const host = $(`#story-${i}`), good = storyOK(i);
    host.className = 'story-card' + (s.storyChecked[i] ? good ? ' good' : ' bad' : '');
    host.querySelector('.status').textContent = s.storyChecked[i] ? good ? 'Верно.' : 'Попробуй ещё раз: посмотри, что происходит на картинке.' : '';
  }
  function bindPictures(root) {
    root.querySelectorAll('[data-image]').forEach(img => {
      const sync = () => {
        const i = Number(img.dataset.image), good = img.complete && img.naturalWidth > 0;
        img.parentElement.querySelector('.picture-retry').hidden = good;
        if (!img.hasAttribute('data-oral-image')) {
          good ? loadedImages.add(i) : loadedImages.delete(i);
          $(`[data-story="${i}"]`).disabled = !good;
        }
      };
      img.addEventListener('load', sync); img.addEventListener('error', sync);
      if (img.complete) sync();
    });
  }
  function render() {
    $('#pupilName').value = s.name;
    $('#verbBank').innerHTML = s.bank.map(v => `<span>${esc(v)}</span>`).join('');
    $('#storyBank').innerHTML = s.storyBank.map(v => `<span>${esc(v)}</span>`).join('');
    $('#questionCards').innerHTML = Q.map((_,i) => `<article id="questions-${i}"></article>`).join('');
    $('#missingCards').innerHTML = M.map((_,i) => `<article id="missing-${i}"></article>`).join('');
    Q.forEach((_,i) => renderQuestion('questions',i)); M.forEach((_,i) => renderQuestion('missing',i));
    renderStory(); bindPictures($('#storyCards'));
    $('#modelText').innerHTML = MODEL.map(v => `<p>${esc(v)}</p>`).join('');
    $('#storyStatus').textContent = '';
    $('#oralPictures').hidden = true; $('#oralPictures').innerHTML = '';
    $('#storyMode').textContent = 'Открыть картинки без подписей'; $('#storyMode').setAttribute('aria-expanded','false');
    update();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pick || b.dataset.remove) {
      const group = b.dataset.pick || b.dataset.remove, i = Number(b.dataset.i), work = s[group][i];
      if (b.dataset.pick) {
        const word = work.bank[Number(b.dataset.j)];
        if (!work.order.includes(word)) work.order.push(word);
      } else work.order.splice(Number(b.dataset.j),1);
      work.checked = false; invalidate(); renderQuestion(group,i); update();
      const host = $(`#${group}-${i}`);
      (host.querySelector('.tiles button:not(:disabled)') || host.querySelector('[data-check]')).focus({preventScroll:true});
    }
    if (b.dataset.check) {
      const group = b.dataset.check, i = Number(b.dataset.i), work = s[group][i];
      const data = group === 'questions' ? Q[i] : M[i];
      work.checked = true;
      if (work.order.length >= data.parts.length && (group !== 'missing' || norm(work.verb))) work.attempted = true;
      renderQuestion(group,i); update();
      $(`#${group}-${i} [data-check]`).focus({preventScroll:true});
    }
    if (b.dataset.retryImage !== undefined) {
      const img = b.parentElement.parentElement.querySelector('img');
      img.src = img.getAttribute('src').split('?')[0] + '?retry=' + Date.now();
    }
    if (b.dataset.retryAudio) { const a = $('#' + b.dataset.retryAudio); a.load(); a.play().catch(() => {}); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'pupilName') { s.name = e.target.value; update(); }
    if (e.target.dataset.verb !== undefined) {
      const i = Number(e.target.dataset.verb); s.missing[i].verb = e.target.value; s.missing[i].checked = false;
      const host = $(`#missing-${i}`); host.className = 'question-card'; host.querySelector('.status').textContent = '';
      const gap = host.querySelector('[data-gap-preview]'); if (gap) gap.textContent = e.target.value || '_____';
      invalidate(); update();
    }
    if (e.target.dataset.story !== undefined) {
      const i = Number(e.target.dataset.story); s.story[i] = e.target.value; s.storyChecked[i] = false;
      paintStory(i); $('#storyStatus').textContent = ''; invalidate(); update();
    }
  });
  $('#checkStory').addEventListener('click', () => {
    if (loadedImages.size !== 4) { $('#storyStatus').textContent = 'Дождись картинок или нажми «Загрузить ещё раз».'; return; }
    s.storyChecked = [true,true,true,true];
    if (s.story.every(v => norm(v))) s.storyAttempted = true;
    STORY.forEach((_,i) => paintStory(i));
    const correct = STORY.filter((_,i) => storyOK(i)).length;
    $('#storyStatus').textContent = correct === 4 ? 'История готова. Прочитай её вслух.' : `Верно: ${correct} из 4. Исправь ответы и проверь ещё раз.`;
    $('#storyStatus').className = 'status ' + (correct === 4 ? 'good' : 'bad'); update();
  });
  for (const [id,flag,errorId] of [['warmupAudio','heardWarmup','warmupError'],['finalAudio','heardFinal','finalError']]) {
    const a = $('#' + id);
    a.addEventListener('play', () => document.querySelectorAll('audio').forEach(other => { if (other !== a) other.pause(); }));
    a.addEventListener('ended', () => { s[flag] = true; update(); });
    a.addEventListener('error', () => { if (a.getAttribute('src')) $('#' + errorId).hidden = false; });
    a.addEventListener('loadedmetadata', () => { $('#' + errorId).hidden = true; });
  }
  for (const id of ['warmupSpoken','questionsSpoken','storySpoken']) {
    $('#' + id).addEventListener('change', e => { s[id] = e.target.checked; s.completed = false; update(); });
  }
  $('#storyMode').addEventListener('click', () => {
    const host = $('#oralPictures'), opening = host.hidden;
    if (opening && !host.children.length) {
      host.innerHTML = STORY.map((_,i) => `<figure>${pictureHTML(i,true)}<figcaption lang="en">${['First','Then','Next','Finally'][i]}</figcaption></figure>`).join('');
      bindPictures(host);
    }
    host.hidden = !opening; $('#storyMode').setAttribute('aria-expanded', String(opening));
    $('#storyMode').textContent = opening ? 'Скрыть картинки' : 'Открыть картинки без подписей';
    if (opening) { $('#finalAudio').pause(); $('#transcript').open = false; }
  });
  $('#finish').addEventListener('click', () => {
    const errors = [];
    if (!s.heardWarmup || !s.warmupSpoken) errors.push('Послушай начальную запись и отметь повторение вслух.');
    if (!allCorrect()) errors.push('Проверь и исправь ответы в заданиях 2, 3 и 4.');
    if (!s.heardFinal) errors.push('Дослушай финальный образец.');
    if (!s.questionsSpoken || !s.storySpoken) errors.push('Произнеси вопросы, расскажи историю и поставь две отметки.');
    $('#finishStatus').textContent = errors.join(' ');
    $('#finishStatus').className = 'status' + (errors.length ? ' bad' : ' good');
    if (errors.length) return;
    s.completed = true; update(); $('#finishStatus').textContent = 'Готово. Можно показать работу учителю.';
    $('#doneName').textContent = s.name.trim() ? `${s.name.trim()}, твоя работа готова.` : 'Твоя работа готова.';
    $('#doneDialog').showModal();
  });
  $('#closeDone').addEventListener('click', () => $('#doneDialog').close());
  $('#print').addEventListener('click', () => window.print());
  $('#restart').addEventListener('click', () => $('#resetDialog').showModal());
  $('#cancelReset').addEventListener('click', () => $('#resetDialog').close());
  function archiveCurrent() {
    archives.push({date:new Date().toISOString(),work:JSON.parse(JSON.stringify(s))});
    try { localStorage.setItem(ARCHIVE,JSON.stringify(archives)); return true; }
    catch (_) { storageFailed = true; $('#saveStatus').textContent = 'Не удалось сохранить архив. Нынешняя работа оставлена на странице.'; $('#saveStatus').classList.add('failure'); return false; }
  }
  function pauseAll() { document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; }); }
  $('#confirmReset').addEventListener('click', () => {
    if (!archiveCurrent()) return;
    pauseAll(); s = empty(); blockSave = false; storageFailed = false; loadedImages.clear();
    $('#resetDialog').close(); $('.tools').open = false; $('#finishStatus').textContent = ''; render(); $('#warmup').scrollIntoView();
  });
  $('#restore').addEventListener('click', () => {
    if (!archives.length) return;
    const previous = archives[archives.length-1];
    if (!archiveCurrent()) return;
    pauseAll(); s = JSON.parse(JSON.stringify(previous.work)); loadedImages.clear();
    blockSave = false; storageFailed = false; $('.tools').open = false; $('#finishStatus').textContent = ''; render();
  });
  render();
})();
