/* Images are learning sources: wait for them instead of presenting blank cards. */
(() => {
  'use strict';
  const cards = document.getElementById('cards');
  const feedback = document.createElement('div');
  feedback.className = 'picture-feedback';
  feedback.hidden = true;
  const message = document.createElement('span');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Retry pictures';
  feedback.append(message, retry);
  cards.before(feedback);
  function sources(card) { return [...card.querySelectorAll('.atlas-image,.station-token>img')]; }
  function update(card) {
    const images = sources(card);
    const failed = images.some(img => img.complete && !img.naturalWidth);
    const ready = images.length > 0 && images.every(img => img.complete && img.naturalWidth > 0);
    card.disabled = !ready;
    card.classList.toggle('is-art-loading', !ready && !failed);
    card.classList.toggle('is-art-error', failed);
    let hint = card.querySelector('.art-loading-hint');
    if (!hint) { hint = document.createElement('span'); hint.className = 'art-loading-hint'; card.append(hint); }
    hint.textContent = failed ? 'Picture unavailable. Please retry below.' : 'Loading picture…';
  }
  function refresh() {
    cards.querySelectorAll('.card').forEach(update);
    const failed = !!cards.querySelector('.is-art-error');
    const pending = !!cards.querySelector('.is-art-loading');
    feedback.hidden = !failed && !pending;
    retry.hidden = !failed;
    message.textContent = failed ? 'Some pictures could not load. Your answers are kept.' : 'Loading the pictures before you begin…';
  }
  document.addEventListener('load', event => { if (event.target.closest?.('#cards .card')) refresh(); }, true);
  document.addEventListener('error', event => { if (event.target.closest?.('#cards .card')) refresh(); }, true);
  document.addEventListener('cards-rendered', refresh);
  retry.addEventListener('click', () => {
    const stamp = Date.now();
    cards.querySelectorAll('.atlas-image,.station-token>img').forEach(img => {
      if (img.complete && !img.naturalWidth) {
        const url = new URL(img.src);
        url.searchParams.set('retry', String(stamp));
        img.src = url.href;
      }
    });
    refresh();
  });
  refresh();
})();
