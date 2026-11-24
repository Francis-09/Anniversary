/* ═══════════════════════════════════════════════════
   NOTEBOOK.JS — Private Keepsake Journal Between Us
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const nameInput  = document.getElementById('notebookName');
  const textarea   = document.getElementById('notebookInput');
  const saveBtn    = document.getElementById('saveBtn');
  const entriesEl  = document.getElementById('memoryEntries');
  const emptyEl    = document.getElementById('memoryEmpty');

  if (!nameInput || !textarea || !saveBtn || !entriesEl || !emptyEl) return;

  const STORAGE_KEY = 'mf_keepsake_notes_v4';
  const LEGACY_KEY  = 'mf_anniversary_notes_v2';
  const MAX_CHARS   = 500;

  // ── Load from localStorage ──
  function loadEntries() {
    let entries = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return entries;

      const saved = JSON.parse(stored);
      // Older notebooks include two prewritten notes with reserved IDs.
      entries = saved.filter(entry => entry.id !== 'default-1' && entry.id !== 'default-2');
      if (entries.length !== saved.length) {
        saveEntries(entries);
      }
    } catch {
      // Storage can be unavailable when the site is opened as a local file.
    }
    return entries;
  }

  // ── Save to localStorage ──
  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  // ── Subtle champagne-gold & lavender sparkle burst on save or unseal ──
  function burstKeepsakeSparkles(originEl) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = originEl || saveBtn;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const glyphs = ['♥\uFE0E', '✦', '✧', '•'];
    const palette = ['#c4a8d4', '#e8cf88', '#d4af37', '#fdf4d1', '#e0c8ee'];

    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.textContent = glyphs[i % glyphs.length];
      p.style.position = 'fixed';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.fontFamily = 'var(--ff-serif)';
      p.style.fontSize = (Math.random() * 7 + 10) + 'px';
      p.style.color = palette[i % palette.length];
      p.style.zIndex = '99999';
      p.style.pointerEvents = 'none';
      p.style.transition = 'transform 0.85s cubic-bezier(0.18, 0.85, 0.25, 1), opacity 0.85s ease';
      document.body.appendChild(p);

      const angle = (Math.random() * 360) * (Math.PI / 180);
      const velocity = Math.random() * 95 + 35;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 22;

      requestAnimationFrame(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) scale(${Math.random() * 0.7 + 0.6}) rotate(${Math.random() * 60 - 30}deg)`;
        p.style.opacity = '0';
      });

      setTimeout(() => p.remove(), 900);
    }
  }

  // ── Render entries ──
  function renderEntries() {
    const entries = loadEntries();
    entriesEl.innerHTML = '';

    if (!entries.length) {
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';

    // Show newest first
    [...entries].reverse().forEach((entry, i) => {
      const card = createEntryCard(entry, i);
      entriesEl.appendChild(card);
    });
  }

  // ── Create serene heirloom note card (no timestamps, tallies, or trash chrome) ──
  function createEntryCard(entry, i) {
    const rotates = [-0.6, 0.45, -0.35, 0.55, -0.75, 0.4];
    const rotate  = rotates[i % rotates.length];

    const card = document.createElement('article');
    card.classList.add('memory-entry');
    card.style.setProperty('--entry-rotate', rotate + 'deg');
    card.style.animationDelay = (i * 0.05) + 's';

    const name = document.createElement('div');
    name.classList.add('entry-name');
    name.textContent = entry.name || 'With Love';

    const msg = document.createElement('p');
    msg.classList.add('entry-message');
    msg.textContent = entry.message;

    card.appendChild(name);
    card.appendChild(msg);

    return card;
  }

  // ── Handle save ──
  function handleSave() {
    const name    = nameInput.value.trim();
    const message = textarea.value.trim();

    if (!message) {
      textarea.style.boxShadow = 'inset 0 -2px 0 rgba(155, 124, 184, 0.65)';
      textarea.placeholder = 'Write a brief note before sealing...';
      setTimeout(() => {
        textarea.style.boxShadow = '';
        textarea.placeholder = 'Write something from the heart...';
      }, 2000);
      return;
    }

    const entries = loadEntries();
    entries.push({
      id: 'note-' + Date.now(),
      name: name || 'With Love',
      message,
      timestamp: Date.now()
    });
    try {
      saveEntries(entries);
    } catch {
      textarea.setCustomValidity('Your browser could not save this note. Your draft is still here.');
      textarea.reportValidity();
      return;
    }

    // Clear inputs
    nameInput.value = '';
    textarea.value  = '';
    textarea.style.height = '';

    // Subtle sparkle feedback
    burstKeepsakeSparkles();

    // Update save button state briefly
    saveBtn.classList.add('saved');
    const labelSpan = saveBtn.querySelector('span:last-child');
    const origText  = labelSpan ? labelSpan.textContent : 'Seal in Our Keepsake';
    if (labelSpan) labelSpan.textContent = 'Sealed in Keepsake';
    setTimeout(() => {
      saveBtn.classList.remove('saved');
      if (labelSpan) labelSpan.textContent = origText;
    }, 2000);

    // Re-render and gently bring new note into view
    renderEntries();
    setTimeout(() => {
      const first = entriesEl.firstElementChild;
      if (first) first.scrollIntoView({ block: 'nearest' });
    }, 120);
  }

  // ── Auto-grow textarea cleanly ──
  function autoGrow() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(160, textarea.scrollHeight) + 'px';
  }

  // ── Events ──
  saveBtn.addEventListener('click', handleSave);

  const waxCrest   = document.getElementById('letterWaxCrest');
  const letterCard = document.querySelector('.sealed-letter-card');
  const letterText = document.getElementById('letterInnerFrame');

  function triggerUnseal() {
    if (!letterCard || !letterText) return;
    const opened = letterCard.classList.toggle('is-unsealed');
    letterCard.classList.toggle('is-sealed', !opened);
    letterText.hidden = !opened;
    waxCrest.setAttribute('aria-expanded', String(opened));
    waxCrest.title = opened ? 'Reseal love letter' : 'Unseal love letter';
    waxCrest.setAttribute('aria-label', waxCrest.title);
    if (opened) {
      burstKeepsakeSparkles(waxCrest);
      if (typeof playPaperRustle === 'function') {
        playPaperRustle(1.0);
      }
    }
  }

  if (waxCrest) {
    waxCrest.addEventListener('click', triggerUnseal);
  }

  textarea.addEventListener('input', () => {
    textarea.setCustomValidity('');
    if (textarea.value.length > MAX_CHARS) {
      textarea.value = textarea.value.slice(0, MAX_CHARS);
    }
    autoGrow();
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textarea.focus();
    }
  });

  // ── Init ──
  renderEntries();
  initBouquet();
  initBouquetViewer();

  function initBouquet() {
    const bouquet = document.querySelector('.keepsake-bouquet');
    if (!bouquet || !window.IntersectionObserver || !window.matchMedia ||
        !window.CSS?.supports('animation-name', 'bouquet-open')) return;

    const visitKey = 'mf_rose_bouquet_seen';
    try {
      if (sessionStorage.getItem(visitKey)) return;
    } catch {
      // The observer still limits the reveal to once on this page.
    }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!motion.matches) bouquet.dataset.reveal = 'waiting';
    bouquet.addEventListener('animationend', function finishReveal(event) {
      if (event.animationName !== 'bouquet-open') return;
      delete bouquet.dataset.reveal;
      bouquet.removeEventListener('animationend', finishReveal);
    });
    motion.addEventListener?.('change', () => {
      delete bouquet.dataset.reveal;
    }, { once: true });

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.intersectionRatio >= 0.5)) return;
      observer.disconnect();
      if (bouquet.dataset.reveal === 'waiting' && !motion.matches) {
        bouquet.dataset.reveal = 'opening';
      }
      try {
        sessionStorage.setItem(visitKey, '1');
      } catch {
        // Other visits can replay the reveal when storage is unavailable.
      }
    }, { threshold: 0.5 });
    observer.observe(bouquet);
  }

  function initBouquetViewer() {
    const viewer = document.getElementById('bouquetViewer');
    const trigger = document.querySelector('.bouquet-trigger');
    if (!trigger || !viewer?.showModal) return;

    const motionBtn = viewer.querySelector('.bouquet-motion');

    trigger.hidden = false;
    trigger.addEventListener('click', () => viewer.showModal());
    motionBtn.addEventListener('click', () => {
      const paused = document.documentElement.classList.toggle('bouquet-still');
      motionBtn.textContent = paused ? 'Resume sway' : 'Pause sway';
    });

    viewer.querySelector('.bouquet-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('close', () => trigger.focus({ preventScroll: true }));
  }

})();
