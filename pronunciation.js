/* Local word recordings. Listening never chooses a card or an answer. */
(() => {
  'use strict';
  const allowed = new Set(['open','close','send','receive','window','box','gate','bag','book','door','postcard','gift','photo','letter','parcel','message']);
  const audio = new Audio();
  audio.preload = 'none';
  audio.dataset.wordAudio = '';
  audio.hidden = true;
  document.body.append(audio);
  let currentButton = null, request = 0;
  const status = document.createElement('p');
  status.id = 'pronunciationStatus';
  status.className = 'pronunciation-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.querySelector('#part1 .legend').after(status);
  const icon = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
  function clearButton() {
    if (!currentButton) return;
    currentButton.classList.remove('is-playing');
    currentButton.setAttribute('aria-pressed', 'false');
    currentButton.setAttribute('aria-label', 'Listen: ' + currentButton.dataset.pronounce);
    currentButton = null;
  }
  function stop() {
    request++;
    audio.pause();
    clearButton();
  }
  function makeButton(word, type) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pronounce pronounce-' + type;
    button.dataset.pronounce = word;
    button.title = 'Listen: ' + word;
    button.setAttribute('aria-label', 'Listen: ' + word);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = icon;
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      if (!allowed.has(word)) return;
      stop();
      const attempt = request;
      currentButton = button;
      button.classList.add('is-playing');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Playing: ' + word);
      status.textContent = 'Listen: ' + word;
      audio.src = 'assets/audio/' + word + '.mp3';
      try {
        await audio.play();
      } catch (error) {
        if (attempt !== request) return;
        clearButton();
        status.textContent = 'Tap the speaker to try again.';
      }
    });
    return button;
  }
  audio.addEventListener('ended', () => { clearButton(); status.textContent = ''; });
  audio.addEventListener('pause', () => { if(audio.paused){clearButton(); status.textContent = '';} });
  audio.addEventListener('error', () => { clearButton(); status.textContent = 'Audio could not play. Tap the speaker to try again.'; });
  document.querySelectorAll('[data-bin]').forEach(choice => {
    const slot = document.createElement('div');
    slot.className = 'action-audio-slot';
    choice.before(slot);
    slot.append(choice, makeButton(choice.dataset.bin, 'verb'));
  });
  function addObjectButtons() {
    stop();
    status.textContent = '';
    document.querySelectorAll('#cards > .card').forEach(card => {
      const wrapper = document.createElement('div');
      wrapper.className = 'card-audio-shell';
      card.before(wrapper);
      wrapper.append(card, makeButton(card.dataset.id, 'object'));
    });
  }
  document.addEventListener('cards-rendered', addObjectButtons);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  addObjectButtons();
})();
