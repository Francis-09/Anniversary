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

  const STORAGE_KEY = 'mf_keepsake_notes_v3';
  const LEGACY_KEY  = 'mf_anniversary_notes_v2';
  const MAX_CHARS   = 500;

  // ── Keepsake Notes between Francis & Maria ──
  const DEFAULT_ENTRIES = [
    {
      id: 'default-1',
      name: 'Francis',
      message: 'December 1, 2023 was the day my favorite story began. Thank you for every smile, every quiet evening, and every burst of laughter. Forever choosing you, my love.',
      timestamp: 1701460800000
    },
    {
      id: 'default-2',
      name: 'Maria',
      message: 'To our first beach trip, our fireworks nights, endless coffee runs, and all the quiet moments in between. You are my safe place and my favorite adventure.',
      timestamp: 1701513000000
    }
  ];

  // ── Load from localStorage (migrating any custom notes cleanly) ──
  function loadEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Migrate any custom notes written previously in v2 while refreshing defaults
      let initial = [...DEFAULT_ENTRIES];
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) {
          const customNotes = parsedLegacy.filter(
            (e) => e && e.id !== 'default-1' && e.id !== 'default-2' && e.message
          );
          if (customNotes.length) {
            initial = initial.concat(customNotes.map((e) => ({
              id: e.id || ('note-' + Date.now()),
              name: e.name || 'With Love',
              message: e.message,
              timestamp: e.timestamp || Date.now()
            })));
          }
        }
      }

      saveEntries(initial);
      return initial;
    } catch {
      return DEFAULT_ENTRIES;
    }
  }

  // ── Save to localStorage ──
  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  // ── Subtle champagne-gold & lavender sparkle burst on save or unseal ──
  function burstKeepsakeSparkles(originEl) {
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
    saveEntries(entries);

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
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }

  // ── Auto-grow textarea cleanly ──
  function autoGrow() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(160, textarea.scrollHeight) + 'px';
  }

  // ── Events ──
  saveBtn.addEventListener('click', handleSave);

  const waxCrest = document.getElementById('letterWaxCrest');
  const letterCard = document.querySelector('.sealed-letter-card');
  if (waxCrest && letterCard) {
    waxCrest.addEventListener('click', () => {
      letterCard.classList.toggle('unsealed');
      burstKeepsakeSparkles(waxCrest);
    });
    waxCrest.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        waxCrest.click();
      }
    });
  }

  textarea.addEventListener('input', () => {
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

})();
