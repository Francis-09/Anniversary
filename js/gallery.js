/* ═══════════════════════════════════════════════════
   GALLERY.JS — Gallery Reveals, Lightbox, Love Counter & Petals
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Apply random initial rotations from data-rotate ──
  function applyRotations() {
    document.querySelectorAll('.polaroid-wrap').forEach((wrap) => {
      const deg = parseFloat(wrap.dataset.rotate || 0);
      const polaroid = wrap.querySelector('.polaroid');
      if (polaroid) {
        polaroid.style.transform = `rotate(${deg}deg)`;
        polaroid.dataset.baseRotate = deg;
      }
    });
  }

  // ── Hover lift effect preserving base rotation ──
  function setupHoverEffects() {
    document.querySelectorAll('.polaroid').forEach((polaroid) => {
      const base = parseFloat(polaroid.dataset.baseRotate || 0);
      polaroid.addEventListener('mouseenter', () => {
        polaroid.style.transform = `rotate(0deg) scale(1.05)`;
        polaroid.style.zIndex = '20';
      });
      polaroid.addEventListener('mouseleave', () => {
        polaroid.style.transform = `rotate(${base}deg) scale(1)`;
        polaroid.style.zIndex = '';
      });
    });
  }

  let counterInitialized = false;
  // ── Live Love Counter ──
  function initLoveCounter() {
    if (counterInitialized) return;
    counterInitialized = true;

    // Anniversary: December 1, 2023
    const anniversaryDate = new Date('2023-12-01T00:00:00');
    const daysEl = document.getElementById('timerDays');
    const hoursEl = document.getElementById('timerHours');
    const minsEl = document.getElementById('timerMinutes');
    const secsEl = document.getElementById('timerSeconds');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function updateTimer() {
      const now = new Date();
      let diff = Math.max(0, now - anniversaryDate);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);

      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * (1000 * 60);

      const seconds = Math.floor(diff / 1000);

      daysEl.textContent = String(days).padStart(3, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(minutes).padStart(2, '0');
      secsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  let lightboxInitialized = false;
  // ── Polaroid Lightbox Modal ──
  function initLightbox() {
    if (lightboxInitialized) return;
    lightboxInitialized = true;
    const modal       = document.getElementById('lightboxModal');
    const backdrop    = document.getElementById('lightboxBackdrop');
    const closeBtn    = document.getElementById('lightboxClose');
    const imgEl       = document.getElementById('lightboxImg');
    const prevBtn     = document.getElementById('lightboxPrev');
    const nextBtn     = document.getElementById('lightboxNext');

    if (!modal || !imgEl) return;

    const items = Array.from(document.querySelectorAll('.polaroid, .trio-frame'));
    let activeIndex = 0;
    let opener = null;

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        opener = item;
        activeIndex = index;
        updateLightboxContent();
        modal.showModal();
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
      });
    });

    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
      opener?.focus({ preventScroll: true });
    });

    function updateLightboxContent() {
      if (!items[activeIndex]) return;
      const item = items[activeIndex];
      const img = item.querySelector('img');
      imgEl.src = img.src;
      imgEl.alt = img.alt;
    }

    function showNext() {
      if (!items.length) return;
      activeIndex = (activeIndex + 1) % items.length;
      updateLightboxContent();
    }

    function showPrev() {
      if (!items.length) return;
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateLightboxContent();
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.close());
    if (backdrop) backdrop.addEventListener('click', () => modal.close());
    if (nextBtn)  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    if (prevBtn)  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });
  }

  let petalsInitialized = false;
  // ── Ambient Scrapbook Petals Canvas ──
  function initAmbientPetals() {
    if (petalsInitialized) return;
    petalsInitialized = true;
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let petals = [];
    let motes = [];
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Create a gentle flower petal
    function createPetal() {
      return {
        x: Math.random() * canvas.width,
        y: -20,
        size: Math.random() * 7 + 5,
        speedY: Math.random() * 0.75 + 0.35,
        speedX: Math.sin(Math.random() * Math.PI) * 0.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.35 + 0.18,
        color: Math.random() > 0.45 ? 'rgba(196, 168, 212, ' : 'rgba(240, 212, 224, '
      };
    }

    // Create a microscopic golden candlelight dust mote
    function createMote() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.4 + 0.8,
        speedY: (Math.random() - 0.45) * 0.35,
        speedX: (Math.random() - 0.5) * 0.4,
        pulseSpeed: Math.random() * 0.025 + 0.012,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.45 + 0.25,
        color: Math.random() > 0.35 ? '232, 207, 136' : '212, 175, 55'
      };
    }

    for (let i = 0; i < 14; i++) {
      const p = createPetal();
      p.y = Math.random() * canvas.height;
      petals.push(p);
    }

    for (let i = 0; i < 32; i++) {
      motes.push(createMote());
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color + p.opacity + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawMote(m, time) {
      const alpha = Math.max(0.05, m.baseAlpha * (0.6 + 0.4 * Math.sin(time * m.pulseSpeed + m.phase)));
      ctx.fillStyle = `rgba(${m.color}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }

    let frameCount = 0;
    function loop() {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Golden candlelight dust motes (background layer)
      motes.forEach((m) => {
        m.y += m.speedY;
        m.x += m.speedX + Math.sin(frameCount * 0.01 + m.phase) * 0.15;
        if (m.y < -10) m.y = canvas.height + 10;
        else if (m.y > canvas.height + 10) m.y = -10;
        if (m.x < -10) m.x = canvas.width + 10;
        else if (m.x > canvas.width + 10) m.x = -10;

        drawMote(m, frameCount);
      });

      // 2. Drifting flower petals
      petals.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.008) * 0.45 + p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + 20) {
          petals[idx] = createPetal();
        } else {
          drawPetal(p);
        }
      });
      animId = requestAnimationFrame(loop);
    }

    loop();
  }

  let galleryInitialized = false;

  window.initGallery = function () {
    if (galleryInitialized) return;
    galleryInitialized = true;
    initLoveCounter();
    initLightbox();
    applyRotations();
    setupHoverEffects();

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    initAmbientPetals();
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (!motion.matches) {
          entry.target.animate([
            { opacity: 0, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 420, easing: 'ease-out' });
        }
      }
    });
    document.querySelectorAll('.hero-content, .gallery-grid > *, .gallery-footer-deco')
      .forEach(element => observer.observe(element));
  };

  window.initGallery();

})();
