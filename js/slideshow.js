/* ═══════════════════════════════════════════════════
   SLIDESHOW.JS — Physics-Driven 3D Antique Memory Book
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const slideshowSection = document.getElementById('slideshow-section');
  const dataContainer    = document.getElementById('bookChaptersData');
  const bookAssembly     = document.getElementById('bookAssembly');
  const boardBack        = document.querySelector('.book-board-back');
  const boardBackShadow  = boardBack ? boardBack.querySelector('.leaf-cast-shadow') : null;
  const leavesContainer  = document.getElementById('bookLeavesContainer');
  const heartsLayer      = document.getElementById('bookHeartsLayer');

  const dockPrevBtn      = document.getElementById('dockPrevBtn');
  const dockNextBtn      = document.getElementById('dockNextBtn');
  const readoutEl        = document.getElementById('bookReadout');
  const enterBtn         = document.getElementById('enterBtn');

  const heroSection      = document.getElementById('hero-section');
  const gallerySection   = document.getElementById('gallery-section');
  const notebookSection  = document.getElementById('notebook-section');

  if (!slideshowSection || !dataContainer || !leavesContainer) return;

  // ── Extract the 12 Chapters cleanly from HTML data source ──
  const chapters = Array.from(dataContainer.querySelectorAll('.book-chapter-item')).map((el, idx) => ({
    index:    idx,
    img:      el.dataset.img,
    alt:      el.dataset.alt || `Memory ${idx + 1}`,
    numeral:  el.dataset.numeral || String(idx + 1),
    subtitle: el.dataset.subtitle || '',
    title:    el.dataset.title || '',
    quote:    el.dataset.quote || ''
  }));

  const TOTAL_LEAVES = chapters.length + 1; // Leaf 0 (Cover) + 12 chapter leaves = 13 turns
  const TOTAL_TURNS  = TOTAL_LEAVES;        // States 0..13 (0=Cover, 1..12=Chapters I..XII, 13=Epilogue)

  let leaves = [];
  let leafMeta = [];
  let initialized = false;
  let uiSynced = false;
  let rafId = null;

  // Frame-rate-independent critically damped spring physics
  let targetProgress   = 0;
  let currentProgress  = 0;
  let progressVelocity = 0;
  let lastFrameTime    = 0;

  // Hover corner-lift anticipation state (for pointer devices)
  const canHover       = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  let hoveredLeafIdx   = -1;
  let hoverAmounts     = new Array(TOTAL_LEAVES).fill(0);

  // Interaction & smooth programmatic scroll glide
  let isTouching       = false;
  let settleTimer      = null;
  let glideRafId       = null;
  let activeSpreadIdx  = 0;

  // ── Helper: Escape HTML safely ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Procedural Web Audio API Paper Rustle Synthesizer ──
  let paperAudioCtx = null;
  let lastRustleTime = 0;

  function getPaperAudioContext() {
    if (!paperAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      paperAudioCtx = new Ctx();
    }
    if (paperAudioCtx && paperAudioCtx.state === 'suspended') {
      paperAudioCtx.resume().catch(() => {});
    }
    return paperAudioCtx;
  }

  function playPaperRustle(intensity) {
    const now = performance.now();
    if (now - lastRustleTime < 130) return;
    lastRustleTime = now;

    try {
      const ctx = getPaperAudioContext();
      if (!ctx || ctx.state !== 'running') return;

      const sampleRate = ctx.sampleRate;
      const duration = 0.16 + Math.random() * 0.05;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish/brown noise with smooth decaying paper texture
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.1;
        data[i] = pink * 0.28;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350 + Math.random() * 250, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      const peak = 0.055 * Math.min(Math.max(intensity || 1, 0.4), 1.3);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(ctx.currentTime);
    } catch {
      // Graceful fallback if audio is restricted
    }
  }

  // ── Preload images gently once book initializes ──
  function preloadBookPhotos() {
    chapters.forEach((ch) => {
      const img = new Image();
      img.src = ch.img;
    });
  }

  // ── Render Left Photo Face Markup ──
  function createPhotoPageMarkup(chapter, isInsideCover) {
    const tilt = ((chapter.index % 2 === 0 ? -0.6 : 0.6)).toFixed(2);
    return `
      <div class="leaf-face leaf-face--back parchment-surface book-photo-page ${isInsideCover ? 'cover-inside-endpaper' : ''}">
        <div class="leaf-paper-glare" aria-hidden="true"></div>
        <div class="leaf-cast-shadow" aria-hidden="true"></div>
        <div class="book-photo-frame-area">
          <figure class="book-photo-mat" style="--plate-tilt: ${tilt}deg;">
            <span class="photo-mount-corner photo-mount-corner--tl"></span>
            <span class="photo-mount-corner photo-mount-corner--tr"></span>
            <span class="photo-mount-corner photo-mount-corner--bl"></span>
            <span class="photo-mount-corner photo-mount-corner--br"></span>
            <img src="${escapeHtml(chapter.img)}" alt="${escapeHtml(chapter.alt)}" loading="eager" />
          </figure>
        </div>
      </div>
    `;
  }

  // ── Render Right Story Face Markup (with inline Mobile photo fallback & illuminated dropcap) ──
  function createStoryPageMarkup(chapter) {
    const rawQuote = chapter.quote || '';
    const firstChar = rawQuote.charAt(0) || '';
    const restQuote = rawQuote.slice(1);
    const illuminatedQuote = firstChar
      ? `<span class="story-dropcap">${escapeHtml(firstChar)}</span>${escapeHtml(restQuote)}`
      : '';

    return `
      <div class="leaf-face leaf-face--front parchment-surface book-story-page">
        <div class="leaf-paper-glare" aria-hidden="true"></div>
        <div class="leaf-cast-shadow" aria-hidden="true"></div>
        <div class="story-inner-border">
          <span class="story-chapter-eyebrow">Chapter ${escapeHtml(chapter.numeral)} · ${escapeHtml(chapter.subtitle)}</span>

          <!-- Shown cleanly on <=768px portrait mobile single-page view -->
          <div class="mobile-photo-slot">
            <figure class="book-photo-mat" style="--plate-tilt: -0.4deg;">
              <span class="photo-mount-corner photo-mount-corner--tl"></span>
              <span class="photo-mount-corner photo-mount-corner--tr"></span>
              <span class="photo-mount-corner photo-mount-corner--bl"></span>
              <span class="photo-mount-corner photo-mount-corner--br"></span>
              <img src="${escapeHtml(chapter.img)}" alt="${escapeHtml(chapter.alt)}" loading="eager" />
            </figure>
          </div>

          <div class="story-center-body">
            <div class="story-floral-rule" aria-hidden="true">
              <svg width="24" height="12" viewBox="0 0 26 14" fill="none">
                <path d="M13 1 C11 5 7 7 1 7 C7 7 11 9 13 13 C15 9 19 7 25 7 C19 7 15 5 13 1Z" fill="currentColor" opacity="0.85"/>
              </svg>
            </div>
            <h3 class="story-title">${escapeHtml(chapter.title)}</h3>
            <p class="story-quote">${illuminatedQuote}</p>
            <span class="story-handwritten-note">Always with you, Francis &amp; Maria</span>
          </div>

          <div class="story-footer-row">
            <button type="button" class="story-heart-btn" data-chapter="${escapeHtml(chapter.numeral)}" aria-label="Send love" title="Send love">♥\uFE0E</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Build All 13 Interactive 3D Leaves ──
  function buildBookLeaves() {
    leavesContainer.innerHTML = '';
    leaves = [];
    leafMeta = [];

    for (let k = 0; k < TOTAL_LEAVES; k++) {
      const leaf = document.createElement('div');
      leaf.classList.add('book-leaf');
      if (k === 0) leaf.classList.add('book-leaf--cover');
      leaf.dataset.leafIndex = String(k);

      if (k === 0) {
        // Leaf 0: Front Hardcover + Inside Cover Left Photo 1
        leaf.innerHTML = `
          <div class="leaf-face leaf-face--front cover-front-face" id="bookFrontCoverFace" title="Click or scroll to open Our Story">
            <div class="leaf-paper-glare" aria-hidden="true"></div>
            <div class="cover-spine-ribs" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="cover-foil-frame">
              <span class="cover-corner cover-corner--tl"></span>
              <span class="cover-corner cover-corner--tr"></span>
              <span class="cover-corner cover-corner--bl"></span>
              <span class="cover-corner cover-corner--br"></span>

              <span class="cover-vol-tag">MMXXIII</span>

              <div class="cover-medallion">
                <svg class="cover-botanical-svg" viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 28 C40 28 24 18 24 10 C24 5.5 27.5 2 32 2 C35.5 2 38.5 4.5 40 7.5 C41.5 4.5 44.5 2 48 2 C52.5 2 56 5.5 56 10 C56 18 40 28 40 28Z" stroke="#e8cf88" stroke-width="1.4" fill="rgba(196,168,212,0.22)"/>
                  <path d="M8 22 Q24 20 34 26 M72 22 Q56 20 46 26" stroke="#d4af37" stroke-width="1" stroke-linecap="round"/>
                </svg>
                <h2 class="cover-main-title">Our Story</h2>
                <p class="cover-couple-names">Maria &amp; Francis</p>
                <p class="cover-date-rule">December 1, 2023 – Forever</p>
              </div>

              <span class="cover-bottom-ornament" aria-hidden="true">M &amp; F</span>
            </div>
          </div>
          ${createPhotoPageMarkup(chapters[0], true)}
        `;
      } else if (k < TOTAL_LEAVES - 1) {
        // Leaves 1..11: Story k on front, Photo k+1 on back
        leaf.innerHTML = `
          ${createStoryPageMarkup(chapters[k - 1])}
          ${createPhotoPageMarkup(chapters[k], false)}
        `;
      } else {
        // Final Leaf (k = 12): Chapter XII story on front, Epilogue Left Crest on back
        leaf.innerHTML = `
          ${createStoryPageMarkup(chapters[k - 1])}
          <div class="leaf-face leaf-face--back parchment-surface epilogue-left-face">
            <div class="leaf-paper-glare" aria-hidden="true"></div>
            <div class="leaf-cast-shadow" aria-hidden="true"></div>
            <div class="epilogue-crest-box">
              <div class="epilogue-monogram-seal">
                <span>M&amp;F</span>
                <span>♥\uFE0E</span>
              </div>
              <h3 class="epilogue-left-title">Twelve Chapters Read</h3>
              <p class="epilogue-left-sub">
                "Every cherished memory bound forever in these pages — and every tomorrow still belongs to us."
              </p>
            </div>
          </div>
        `;
      }

      leavesContainer.appendChild(leaf);
      leaves.push(leaf);

      const frontFace = leaf.querySelector('.leaf-face--front');
      const backFace  = leaf.querySelector('.leaf-face--back');
      leafMeta.push({
        frontFace,
        backFace,
        frontShadow: frontFace ? frontFace.querySelector('.leaf-cast-shadow') : null,
        backShadow:  backFace  ? backFace.querySelector('.leaf-cast-shadow')  : null,
      });

      // Subtle corner-lift peek when pointer hovers resting cover or right page
      if (canHover && frontFace) {
        frontFace.addEventListener('mouseenter', () => {
          hoveredLeafIdx = k;
        });
        frontFace.addEventListener('mouseleave', () => {
          if (hoveredLeafIdx === k) hoveredLeafIdx = -1;
        });
      }
    }

    // Bind front cover click -> open to Chapter I
    const coverFace = document.getElementById('bookFrontCoverFace');
    if (coverFace) {
      coverFace.style.cursor = 'pointer';
      coverFace.addEventListener('mousemove', (e) => {
        const rect = coverFace.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%';
        const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%';
        coverFace.style.setProperty('--cover-glint-x', x);
        coverFace.style.setProperty('--cover-glint-y', y);
      });
      coverFace.addEventListener('click', () => {
        playPaperRustle(1.1);
        scrollToSpread(1);
      });
    }

    // Bind right story page click -> gentle turn to next spread
    leavesContainer.querySelectorAll('.book-story-page').forEach((pageEl) => {
      pageEl.style.cursor = 'pointer';
      pageEl.addEventListener('click', (e) => {
        if (e.target.closest('.story-heart-btn')) return;
        playPaperRustle(0.9);
        scrollToSpread(activeSpreadIdx + 1);
      });
    });

    // Bind subtle heart flourish button on story pages
    leavesContainer.querySelectorAll('.story-heart-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        burstBookHearts(e);
      });
    });
  }

  // ── Burst Champagne-Gold & Lavender Hearts/Petals ──
  function burstBookHearts(event) {
    if (!heartsLayer) return;
    const rect = heartsLayer.getBoundingClientRect();
    const clickX = event && event.clientX ? ((event.clientX - rect.left) / rect.width) * 100 : 65;
    const glyphs = ['♥\uFE0E', '✦', '✧'];
    const palette = ['#d4af37', '#9b7cb8', '#e8cf88'];

    for (let i = 0; i < 8; i++) {
      const h = document.createElement('div');
      h.classList.add('book-burst-heart');
      h.textContent = glyphs[i % glyphs.length];
      h.style.color = palette[i % palette.length];
      h.style.fontFamily = 'var(--ff-serif)';
      const spreadX = clickX + (Math.random() * 20 - 10);
      h.style.left = Math.max(10, Math.min(90, spreadX)) + '%';
      h.style.bottom = (Math.random() * 20 + 16) + '%';
      h.style.animationDelay = (i * 0.06) + 's';
      heartsLayer.appendChild(h);
      setTimeout(() => h.remove(), 1700);
    }
  }

  // ── Read Raw Scroll Progress Across Book Track [0 .. 1] ──
  function readTargetProgressFromScroll() {
    const rect = slideshowSection.getBoundingClientRect();
    const maxScroll = Math.max(1, slideshowSection.offsetHeight - window.innerHeight);
    return Math.max(0, Math.min(1, -rect.top / maxScroll));
  }

  // ── Cancel any programmatic click scroll glide cleanly ──
  function cancelProgrammaticGlide() {
    if (glideRafId) {
      cancelAnimationFrame(glideRafId);
      glideRafId = null;
    }
    document.documentElement.style.scrollBehavior = '';
  }

  // ── Smooth Programmatic Page-Turn Glide (Custom Quintic/Quartic Curve) ──
  function scrollToSpread(spreadIdx, customDuration) {
    const clamped = Math.max(0, Math.min(TOTAL_TURNS, spreadIdx));
    const sectionTop = window.scrollY + slideshowSection.getBoundingClientRect().top;
    const maxScroll = Math.max(1, slideshowSection.offsetHeight - window.innerHeight);
    const destY = sectionTop + (clamped / TOTAL_TURNS) * maxScroll;
    const startY = window.scrollY;
    const deltaY = destY - startY;

    clearTimeout(settleTimer);
    cancelProgrammaticGlide();

    if (Math.abs(deltaY) < 1) return;

    const spreadsMoved = Math.max(1, Math.abs(clamped - currentProgress * TOTAL_TURNS));
    const duration = customDuration || Math.min(1150, 740 + (spreadsMoved - 1) * 140);
    const startTime = performance.now();

    // Disable CSS native smooth scroll during bespoke rAF glide so zero double-smoothing occurs
    document.documentElement.style.scrollBehavior = 'auto';

    function stepGlide(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Balanced quartic ease-in-out gives slow paper lift, crisp arc, soft cushioned landing
      const eased = t < 0.5
        ? 8 * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 4) / 2;

      window.scrollTo(0, startY + deltaY * eased);

      if (t < 1) {
        glideRafId = requestAnimationFrame(stepGlide);
      } else {
        glideRafId = null;
        document.documentElement.style.scrollBehavior = '';
      }
    }

    glideRafId = requestAnimationFrame(stepGlide);
  }

  // ── Gentle Idle Spread Snap (never interrupts active glide or top/bottom exits) ──
  function scheduleGentleSettle() {
    clearTimeout(settleTimer);
    if (isTouching || glideRafId) return;

    settleTimer = setTimeout(() => {
      if (isTouching || glideRafId) return;
      const p = readTargetProgressFromScroll();
      if (p <= 0.01 || p >= 0.99) return;

      const rawSpread = p * TOTAL_TURNS;
      const nearest = Math.round(rawSpread);
      const frac = Math.abs(rawSpread - nearest);

      if (frac > 0.09) {
        scrollToSpread(nearest, 560);
      }
    }, 360);
  }

  // ── Custom Weighted S-Curve for Paper Rotation ──
  function easePaperRotation(t) {
    // Smooth cosine base blended slightly toward gentler lift & cushion settle
    return 0.5 - 0.5 * Math.cos(t * Math.PI);
  }

  // ── Update 3D Book Leaves, Physical Stack Depth, Glare & Cast Shadows ──
  function renderBookState(progress, dt) {
    const continuousTurn = progress * TOTAL_TURNS;
    const isMobile = window.innerWidth <= 768;

    // Cover center glide & subtle reading angle settle
    const coverOpenRaw = Math.max(0, Math.min(1, continuousTurn));
    const coverOpenSmooth = easePaperRotation(coverOpenRaw);
    bookAssembly.style.setProperty('--cover-open', coverOpenSmooth.toFixed(4));
    bookAssembly.style.setProperty('--book-tilt', (3 - coverOpenSmooth * 0.65).toFixed(2) + 'deg');

    const nearestSpread = Math.min(TOTAL_TURNS, Math.max(0, Math.round(continuousTurn)));

    // First leaf still on the right side (closest to viewer)
    let topRightLeafIdx = -1;
    for (let k = 0; k < TOTAL_LEAVES; k++) {
      if (Math.max(0, Math.min(1, continuousTurn - k)) < 0.5) {
        topRightLeafIdx = k;
        break;
      }
    }

    // Track turning shadow cast onto right & left pages underneath
    const castRightAlpha = new Array(TOTAL_LEAVES + 1).fill(0);
    const castLeftAlpha  = new Array(TOTAL_LEAVES).fill(0);
    const baseTurns      = new Array(TOTAL_LEAVES);

    for (let k = 0; k < TOTAL_LEAVES; k++) {
      const rawLocal = Math.max(0, Math.min(1, continuousTurn - k));
      baseTurns[k] = easePaperRotation(rawLocal);
    }

    // Sympathetic paper coupling (adjacent pages breathe slightly as a sheet peels off them)
    for (let k = 0; k < TOTAL_LEAVES; k++) {
      let localT = baseTurns[k];
      if (k > 0 && baseTurns[k - 1] > 0.2 && baseTurns[k - 1] < 0.98) {
        localT = Math.min(1, localT + Math.sin(baseTurns[k - 1] * Math.PI) * 0.0028);
      }

      const fold = Math.sin(localT * Math.PI);
      const peel = Math.sin(localT * Math.PI * 2) * fold;

      // Smooth hover anticipation lift strictly on resting active right face
      const isRestingTop = k === topRightLeafIdx && Math.abs(localT) < 0.015;
      const targetHover = (hoveredLeafIdx === k && isRestingTop) ? 1 : 0;
      const hoverLerp = 1 - Math.exp(-14 * dt);
      hoverAmounts[k] += (targetHover - hoverAmounts[k]) * hoverLerp;
      if (Math.abs(hoverAmounts[k]) < 0.001) hoverAmounts[k] = 0;

      // Accumulate cast shadows onto pages directly beneath active turning sheets
      if (fold > 0.005) {
        // Right stack underneath (k + 1 front face, or boardBack for k = 12)
        castRightAlpha[k + 1] = Math.max(castRightAlpha[k + 1], fold * (1 - localT * 0.72) * 0.42);
        // Left stack underneath (k - 1 back face)
        if (k > 0) {
          castLeftAlpha[k - 1] = Math.max(castLeftAlpha[k - 1], fold * localT * 0.44);
        }
      }

      // True physical paper stack elevation in 3D space (prevents clipping/z-fighting)
      const zRight = (TOTAL_LEAVES - k) * 0.55;
      const zLeft  = (k + 1) * 0.55;
      const stackZ = zRight * (1 - localT) + zLeft * localT;

      const leaf = leaves[k];
      leaf.style.setProperty('--turn', localT.toFixed(5));
      leaf.style.setProperty('--fold', fold.toFixed(4));
      leaf.style.setProperty('--peel', peel.toFixed(4));
      leaf.style.setProperty('--hover', hoverAmounts[k].toFixed(3));
      leaf.style.setProperty('--glare-x', localT.toFixed(4));
      leaf.style.setProperty('--stack-z', stackZ.toFixed(2) + 'px');

      const rawLocal = Math.max(0, Math.min(1, continuousTurn - k));
      const isActivelyTurning = rawLocal > 0.002 && rawLocal < 0.998;
      if (localT < 0.5) {
        leaf.style.zIndex = String(isActivelyTurning ? 60 + (TOTAL_LEAVES - k) : 10 + (TOTAL_LEAVES - k));
      } else {
        leaf.style.zIndex = String(isActivelyTurning ? 60 + k : 10 + k + 1);
      }

      if (isMobile) {
        if (localT > 0.5) {
          const fadeLinear = Math.max(0, 1 - (localT - 0.5) * 2.5);
          const fade = Math.pow(fadeLinear, 1.45);
          leaf.style.opacity = fade.toFixed(3);
          leaf.style.visibility = fade <= 0.01 ? 'hidden' : 'visible';
        } else {
          leaf.style.opacity = '1';
          leaf.style.visibility = 'visible';
        }
        leaf.style.pointerEvents = k === topRightLeafIdx ? 'auto' : 'none';
      } else {
        leaf.style.opacity = '1';
        leaf.style.visibility = 'visible';
        leaf.style.pointerEvents = k === topRightLeafIdx ? 'auto' : 'none';
      }
    }

    // Apply calculated cast shadow opacities via CSS vars
    for (let k = 0; k < TOTAL_LEAVES; k++) {
      const meta = leafMeta[k];
      if (meta.frontShadow) {
        meta.frontShadow.style.setProperty('--cast-alpha', castRightAlpha[k].toFixed(3));
      }
      if (meta.backShadow) {
        meta.backShadow.style.setProperty('--cast-alpha', castLeftAlpha[k].toFixed(3));
      }
    }
    if (boardBackShadow) {
      boardBackShadow.style.setProperty('--cast-alpha', castRightAlpha[TOTAL_LEAVES].toFixed(3));
    }

    // Update Quiet Roman Readout & Navigation Controls whenever spread changes
    if (nearestSpread !== activeSpreadIdx || !uiSynced) {
      if (uiSynced && Math.abs(nearestSpread - activeSpreadIdx) === 1) {
        playPaperRustle(0.85);
      }
      activeSpreadIdx = nearestSpread;
      uiSynced = true;

      if (readoutEl) {
        if (nearestSpread === 0) {
          readoutEl.textContent = 'Cover';
        } else if (nearestSpread <= chapters.length) {
          const ch = chapters[nearestSpread - 1];
          readoutEl.textContent = `${ch.numeral} of XII`;
        } else {
          readoutEl.textContent = 'Epilogue';
        }
      }

      if (dockPrevBtn) dockPrevBtn.disabled = nearestSpread === 0;
      if (boardBack) boardBack.style.pointerEvents = nearestSpread === TOTAL_TURNS ? 'auto' : 'none';
    }
  }

  // ── 60–120fps Delta-Time Spring Interpolation Loop ──
  function animationLoop(now) {
    if (!lastFrameTime) lastFrameTime = now;
    const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    targetProgress = readTargetProgressFromScroll();
    const displacement = currentProgress - targetProgress;

    const hoverNeedsUpdate = hoverAmounts.some((val, idx) => {
      const wantsHover = hoveredLeafIdx === idx ? 1 : 0;
      return Math.abs(wantsHover - val) > 0.002;
    });

    if (Math.abs(displacement) > 0.00008 || Math.abs(progressVelocity) > 0.0004 || hoverNeedsUpdate) {
      // Critically damped physical spring (natural page mass + smooth settling, zero overshoot)
      const omega = glideRafId ? 13.5 : 10.2;
      const force = -omega * omega * displacement - 2 * omega * progressVelocity;
      progressVelocity += force * dt;
      currentProgress  += progressVelocity * dt;

      if (currentProgress <= 0) {
        currentProgress = 0;
        if (progressVelocity < 0) progressVelocity = 0;
      } else if (currentProgress >= 1) {
        currentProgress = 1;
        if (progressVelocity > 0) progressVelocity = 0;
      }

      renderBookState(currentProgress, dt);
    } else if (currentProgress !== targetProgress) {
      currentProgress = targetProgress;
      progressVelocity = 0;
      renderBookState(currentProgress, dt);
    }

    rafId = requestAnimationFrame(animationLoop);
  }

  // ── Scroll to Main Hero / Scrapbook Below ──
  function scrollToScrapbookBelow() {
    if (!heroSection) return;
    cancelProgrammaticGlide();
    clearTimeout(settleTimer);
    heroSection.classList.remove('hidden');
    if (gallerySection) gallerySection.classList.remove('hidden');
    if (notebookSection) notebookSection.classList.remove('hidden');
    heroSection.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Global Desk Controls: Romantic Music & Wax Seal Scroll-to-Top ──
  function initGlobalControls() {
    const bgMusic     = document.getElementById('bgMusic');
    const musicPill   = document.getElementById('musicPill');
    const musicToggle = document.getElementById('musicToggle');
    const waxSealBtn  = document.getElementById('waxSealBtn');

    let fadeTimer = null;

    function clearFadeTimer() {
      if (fadeTimer) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
    }

    function fadeInMusic() {
      if (!bgMusic) return;
      clearFadeTimer();
      const target = 0.55;
      const step = 0.025;
      fadeTimer = setInterval(() => {
        if (bgMusic.paused) {
          clearFadeTimer();
          return;
        }
        if (bgMusic.volume < target - step) {
          bgMusic.volume = Math.min(bgMusic.volume + step, target);
        } else {
          bgMusic.volume = target;
          clearFadeTimer();
        }
      }, 60);
    }

    function syncPlayingUI() {
      if (musicPill) musicPill.classList.remove('paused');
      if (musicToggle) musicToggle.title = 'Pause "Ikaw Lang Ang Mamahalin"';
    }

    function syncPausedUI() {
      if (musicPill) musicPill.classList.add('paused');
      if (musicToggle) musicToggle.title = 'Play "Ikaw Lang Ang Mamahalin"';
    }

    function removeUnlockListeners() {
      document.removeEventListener('click', unlockMusicOnFirstInteraction);
      document.removeEventListener('keydown', unlockMusicOnFirstInteraction);
    }

    function attemptPlayMusic() {
      if (!bgMusic) return Promise.resolve(false);
      if (musicPill) musicPill.style.display = 'flex';
      bgMusic.volume = 0;
      return bgMusic.play().then(() => {
        syncPlayingUI();
        fadeInMusic();
        removeUnlockListeners();
        return true;
      }).catch(() => {
        syncPausedUI();
        return false;
      });
    }

    function unlockMusicOnFirstInteraction(e) {
      if (e && e.target && e.target.closest('#musicToggle')) return;
      removeUnlockListeners();
      if (bgMusic && bgMusic.paused) {
        attemptPlayMusic();
      }
    }

    if (musicPill) {
      musicPill.style.display = 'flex';
    }

    if (musicToggle && bgMusic) {
      musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        removeUnlockListeners();
        if (bgMusic.paused) {
          attemptPlayMusic();
        } else {
          clearFadeTimer();
          bgMusic.pause();
          syncPausedUI();
        }
      });
    }

    // Attempt autoplay; if browser requires a click/keypress first, arm first gesture listener
    attemptPlayMusic().then((started) => {
      if (!started) {
        document.addEventListener('click', unlockMusicOnFirstInteraction);
        document.addEventListener('keydown', unlockMusicOnFirstInteraction);
      }
    });

    // Wax Seal back-to-top button
    if (waxSealBtn) {
      const updateWaxSeal = () => {
        waxSealBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
      };
      updateWaxSeal();
      window.addEventListener('scroll', updateWaxSeal, { passive: true });
      waxSealBtn.addEventListener('click', () => {
        cancelProgrammaticGlide();
        clearTimeout(settleTimer);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ── Public Init & Auto-Start on First Load ──
  window.startBookSlideshow = function () {
    if (!initialized) {
      initialized = true;
      buildBookLeaves();
    }
    preloadBookPhotos();

    slideshowSection.classList.remove('hidden');
    slideshowSection.classList.add('visible');

    targetProgress = readTargetProgressFromScroll();
    currentProgress = targetProgress;
    progressVelocity = 0;
    renderBookState(currentProgress, 0.016);

    if (!rafId) {
      lastFrameTime = performance.now();
      rafId = requestAnimationFrame(animationLoop);
    }
  };

  // Alias kept so any existing hook continues to work cleanly
  window.startCinemaSlideshow = window.startBookSlideshow;

  // ── Event Listeners ──
  window.addEventListener('wheel', () => {
    cancelProgrammaticGlide();
    scheduleGentleSettle();
  }, { passive: true });
  window.addEventListener('scroll', scheduleGentleSettle, { passive: true });
  window.addEventListener('resize', () => renderBookState(currentProgress, 0.016), { passive: true });
  window.addEventListener('touchstart', () => {
    isTouching = true;
    cancelProgrammaticGlide();
    clearTimeout(settleTimer);
  }, { passive: true });
  window.addEventListener('touchend', () => {
    isTouching = false;
    scheduleGentleSettle();
  }, { passive: true });

  function handlePrev() {
    playPaperRustle(0.95);
    scrollToSpread(activeSpreadIdx - 1);
  }

  function handleNext() {
    playPaperRustle(0.95);
    if (activeSpreadIdx >= TOTAL_TURNS) {
      scrollToScrapbookBelow();
    } else {
      scrollToSpread(activeSpreadIdx + 1);
    }
  }

  if (dockPrevBtn) dockPrevBtn.addEventListener('click', handlePrev);
  if (dockNextBtn) dockNextBtn.addEventListener('click', handleNext);
  if (enterBtn) enterBtn.addEventListener('click', scrollToScrapbookBelow);

  // Keyboard support while viewing book section
  document.addEventListener('keydown', (e) => {
    if (slideshowSection.classList.contains('hidden')) return;
    const rect = slideshowSection.getBoundingClientRect();
    // Respond only when book section intersects viewport meaningfully
    if (rect.bottom < 80 || rect.top > window.innerHeight - 80) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    }
  });

  // Start directly on the closed heirloom book cover
  window.startBookSlideshow();
  initGlobalControls();

})();
