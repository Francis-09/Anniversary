/* ═══════════════════════════════════════════════════
   GALLERY.JS — GSAP Animations, Lightbox, Love Counter & Petals
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
    const captionEl   = document.getElementById('lightboxCaption');
    const prevBtn     = document.getElementById('lightboxPrev');
    const nextBtn     = document.getElementById('lightboxNext');

    if (!modal || !imgEl || !captionEl) return;

    // Collect all archival prints & triptych miniature frames
    const items = [];
    document.querySelectorAll('.polaroid').forEach((p) => {
      const img = p.querySelector('img');
      const cap = p.querySelector('.polaroid-caption');
      if (img) {
        items.push({
          src: img.src,
          alt: img.alt || 'Our Memory',
          caption: cap ? cap.textContent : 'Maria & Francis'
        });
        p.addEventListener('click', () => {
          const idx = items.findIndex(item => item.src === img.src);
          openLightbox(idx >= 0 ? idx : 0);
        });
      }
    });

    // Support clicking triptych keepsake frames
    document.querySelectorAll('.archival-trio .trio-frame').forEach((tf) => {
      const img = tf.querySelector('img');
      if (img) {
        items.push({
          src: img.src,
          alt: img.alt || 'Cherished Moment',
          caption: tf.dataset.caption || 'Cherished Moment'
        });
        tf.style.cursor = 'pointer';
        tf.addEventListener('click', () => {
          const idx = items.findIndex(item => item.src === img.src);
          openLightbox(idx >= 0 ? idx : 0);
        });
      }
    });

    let activeIndex = 0;

    function openLightbox(idx) {
      if (!items.length) return;
      activeIndex = idx;
      updateLightboxContent();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function updateLightboxContent() {
      if (!items[activeIndex]) return;
      const item = items[activeIndex];
      imgEl.src = item.src;
      imgEl.alt = item.alt;
      captionEl.textContent = item.caption;
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

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (nextBtn)  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    if (prevBtn)  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
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

  // ── GSAP ScrollTrigger animations ──
  window.initGallery = function () {
    initLoveCounter();
    initLightbox();
    initAmbientPetals();

    if (galleryInitialized) {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      return;
    }
    galleryInitialized = true;

    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, using fallback');
      fallbackReveal();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    applyRotations();
    setupHoverEffects();

    // Animate polaroid wraps (single clean fromTo tween)
    document.querySelectorAll('.polaroid-wrap').forEach((wrap, i) => {
      const fromLeft = wrap.classList.contains('polaroid-wrap--left');
      gsap.fromTo(
        wrap,
        { opacity: 0, y: 40, x: fromLeft ? -40 : 40 },
        {
          scrollTrigger: {
            trigger: wrap,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.75,
          ease: 'power2.out',
          delay: (i % 2) * 0.08,
        }
      );
    });

    // Miniature triptych archival frames
    const archivalTrio = document.querySelector('.archival-trio');
    if (archivalTrio) {
      gsap.to(archivalTrio, {
        scrollTrigger: {
          trigger: archivalTrio,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }

    // Gold-foil epigraph quotes
    document.querySelectorAll('.epigraph-quote').forEach((quote, i) => {
      gsap.to(quote, {
        scrollTrigger: {
          trigger: quote,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'power2.out',
      });
    });

    // Botanical heart flourish
    const doodle = document.querySelector('.scrap-doodle');
    if (doodle) {
      gsap.to(doodle, {
        scrollTrigger: {
          trigger: doodle,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
      });
    }

    // Gallery footer
    const footer = document.querySelector('.gallery-footer-deco');
    if (footer) {
      gsap.to(footer, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 95%',
          toggleActions: 'play none none reverse',
        },
        opacity: 1,
        duration: 0.6,
        ease: 'power1.out',
      });
    }

    // Hero content reveal
    gsap.from('.hero-content', {
      scrollTrigger: {
        trigger: '#hero-section',
        start: 'top 80%',
        once: true,
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power2.out',
    });
  };

  function fallbackReveal() {
    document.querySelectorAll('.polaroid-wrap, .archival-trio, .epigraph-quote, .scrap-doodle, .gallery-footer-deco').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    applyRotations();
    setupHoverEffects();
  }

  // Initialize hero, gallery scroll animations, lightbox, petals & love counter immediately
  window.initGallery();
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

})();
