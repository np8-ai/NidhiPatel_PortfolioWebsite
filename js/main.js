/* =========================================================
   PORTFOLIO — 3D INTERACTIVE & EFFECTS ENGINE
   Styles combined:
   - tanishsaini.vercel.app (Visible 3D wireframe geometric sphere + dust field)
   - divyanshigupta.vercel.app (Celestial gold ribbon trail + 4-point sparkle star cursor)
   ========================================================= */

(() => {
  'use strict';

  /* =========================================================
     1. THREE.JS 3D BACKGROUND (Prominent 3D Sphere & Orbital Rings)
     ========================================================= */
  function init3DScene() {
    const canvas = document.getElementById('bg3d');
    if (!canvas || !window.THREE) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
    } catch (err) {
      console.warn('WebGL not supported, skipping 3D background:', err);
      if (canvas) canvas.remove();
      return;
    }

    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8.6;

    // Palette: Glowing Lime Accent (#b8ff3c) & Vintage Cream (#e9e5d9)
    const colorLime = 0xb8ff3c;
    const colorCream = 0xe9e5d9;

    const rig = new THREE.Group();
    scene.add(rig);

    // 1. Outer 3D Geodesic Wireframe Sphere (High detail & glowing)
    const outerGeo = new THREE.IcosahedronGeometry(3.6, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: colorLime,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const outerSphere = new THREE.Mesh(outerGeo, outerMat);

    // 2. Inner Core (Octahedron)
    const innerGeo = new THREE.OctahedronGeometry(2.1, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: colorCream,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);

    // 3. Orbital Ring 1 (Equatorial circle)
    const ringGeo1 = new THREE.TorusGeometry(4.6, 0.026, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: colorLime,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;

    // 4. Orbital Ring 2 (Perpendicular gyroscopic circle)
    const ringGeo2 = new THREE.TorusGeometry(4.7, 0.02, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: colorCream,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 2.2;

    rig.add(outerSphere, innerCore, ring1, ring2);

    // 5. Orbiting Atmospheric Dust Particles
    const particleCount = isMobile ? 550 : 1200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 5.0 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: colorCream,
      size: 0.045,
      transparent: true,
      opacity: 0.75
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Resize handling
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener('resize', onWindowResize, { passive: true });

    // Mouse Parallax
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    window.addEventListener('pointermove', (e) => {
      target.x = (e.clientX / window.innerWidth) - 0.5;
      target.y = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    // Smooth scroll interpolation
    let scrollProgressTarget = 0;
    let scrollProgressCurrent = 0;

    function animate() {
      requestAnimationFrame(animate);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressTarget = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgressCurrent += (scrollProgressTarget - scrollProgressCurrent) * 0.07;

      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      const time = performance.now() * 0.00022;

      // 3D Rotations
      outerSphere.rotation.set(
        time * 0.8 + scrollProgressCurrent * Math.PI * 1.5 + current.y * 0.6,
        time * 1.2 + scrollProgressCurrent * Math.PI * 2.2 + current.x * 0.8,
        0
      );

      innerCore.rotation.set(
        -time * 1.5 - current.y * 0.5,
        -time * 1.1 - scrollProgressCurrent * Math.PI * 3,
        0
      );

      ring1.rotation.z = time * 0.6 + scrollProgressCurrent * Math.PI;
      ring2.rotation.x = -time * 0.5;

      dust.rotation.y = time * 0.4 + current.x * 0.2;
      dust.rotation.x = current.y * 0.15;

      // Dynamic camera dolly and rig position based on scroll
      camera.position.z = 8.6 - (scrollProgressCurrent * 3.4);
      rig.position.y = (scrollProgressCurrent * 1.5) - 0.2;
      rig.position.x = current.x * 0.5;

      renderer.render(scene, camera);
    }

    animate();
  }

  /* =========================================================
     2. CELESTIAL MOUSE POINTER (divyanshigupta.vercel.app style)
     ========================================================= */
  function initCelestialCursor() {
    const canvas = document.getElementById('cursorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Skip on touch screens or prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.matchMedia('(pointer: coarse)').matches) {
      canvas.style.display = 'none';
      return;
    }

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    let mouseX = -100, mouseY = -100;
    let trailX = -100, trailY = -100;
    let hasMoved = false;
    let points = [];
    let isHovering = false;
    let starScale = 1;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        trailX = mouseX;
        trailY = mouseY;
        hasMoved = true;
      }
    }, { passive: true });

    // Interactive element hover detection
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, input, textarea, .card, .tool-chip, .tag-grid span, .pill-btn, .resume-dl')) {
        isHovering = true;
      } else {
        isHovering = false;
      }
    }, { passive: true });

    function renderCursor() {
      ctx.clearRect(0, 0, width, height);

      if (hasMoved) {
        trailX += (mouseX - trailX) * 0.45;
        trailY += (mouseY - trailY) * 0.45;
        points.unshift({ x: trailX, y: trailY });

        // Cap trail distance at 75-85px
        let totalDist = 0;
        let maxPoints = points.length;
        for (let i = 0; i < points.length - 1; i++) {
          const dx = points[i + 1].x - points[i].x;
          const dy = points[i + 1].y - points[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          totalDist += dist;
          if (totalDist >= 80) {
            const excess = totalDist - 80;
            const ratio = dist > 0 ? (dist - excess) / dist : 0;
            points[i + 1] = {
              x: points[i].x + dx * ratio,
              y: points[i].y + dy * ratio
            };
            maxPoints = i + 2;
            break;
          }
        }
        if (points.length > maxPoints) points.length = maxPoints;

        // Draw fluid golden curve trail (quadratic curves with opacity fade)
        if (points.length > 2) {
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const ratio = i / points.length;
            const alpha = Math.max(0, (1 - ratio) * 0.88);
            const lineWidth = Math.max(0.6, (1 - ratio) * 3.6);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Dual-pass glow on front segment of the ribbon
            if (i < 4) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
              ctx.strokeStyle = `rgba(212, 175, 55, ${0.28 * alpha})`;
              ctx.lineWidth = 3.2 * lineWidth;
              ctx.stroke();
            }
          }
        }

        // Scale star smoothly when hovering over interactive elements
        const targetScale = isHovering ? 1.35 : 1.0;
        starScale += (targetScale - starScale) * 0.15;

        ctx.save();
        ctx.translate(mouseX, mouseY);
        ctx.scale(starScale, starScale);

        // Radial gold halo aura
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        glow.addColorStop(0, 'rgba(255, 240, 190, 0.95)');
        glow.addColorStop(0.35, 'rgba(212, 175, 55, 0.55)');
        glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // 4-point diamond star (white sparkle center)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -6.5);
        ctx.lineTo(2.08, -2.08);
        ctx.lineTo(6.5, 0);
        ctx.lineTo(2.08, 2.08);
        ctx.lineTo(0, 6.5);
        ctx.lineTo(-2.08, 2.08);
        ctx.lineTo(-6.5, 0);
        ctx.lineTo(-2.08, -2.08);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(renderCursor);
    }

    renderCursor();
  }

  /* =========================================================
     3. TEXT SCRAMBLE / DECRYPT EFFECT
     ========================================================= */
  function textScramble(el) {
    if (!el) return;
    const finalText = el.textContent.trim();
    const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789_#/+<>';
    const totalIterations = finalText.length * 3;
    let frame = 0;

    el.setAttribute('aria-label', finalText);

    const interval = setInterval(() => {
      el.textContent = finalText
        .split('')
        .map((char, idx) => {
          if (char === ' ') return ' ';
          if (idx < frame / 3) return char;
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join('');

      frame++;
      if (frame > totalIterations) {
        clearInterval(interval);
        el.textContent = finalText;
      }
    }, 32);
  }

  /* =========================================================
     4. SCROLL PROGRESS BAR & ACTIVE NAV TRACKING
     ========================================================= */
  const scrollProgress = document.getElementById('scrollProgress');
  const navLinks = document.querySelectorAll('.tnav');
  const sections = document.querySelectorAll('section[id], main[id]');
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar fill
    if (scrollProgress && docHeight > 0) {
      const pct = (scrollY / docHeight) * 100;
      scrollProgress.style.width = pct + '%';
    }

    // Back to top button visibility
    if (backToTop) {
      backToTop.classList.toggle('visible', scrollY > 400);
    }

    // Active Section Tracking
    let activeId = 'home';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        activeId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     5. MOBILE HAMBURGER MENU
     ========================================================= */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('.tnav').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* =========================================================
     6. SKILL BARS (Intersection Observer)
     ========================================================= */
  const skillBars = document.querySelectorAll('.skill-fill');
  if (skillBars.length > 0) {
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          bar.style.width = bar.dataset.width + '%';
          skillObserver.unobserve(bar);
        }
      });
    }, { threshold: 0.25 });

    skillBars.forEach((bar) => skillObserver.observe(bar));
  }

  /* =========================================================
     7. CARD REVEAL ON SCROLL (Intersection Observer)
     ========================================================= */
  const revealCards = document.querySelectorAll('.reveal');
  if (revealCards.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealCards.forEach((card) => revealObserver.observe(card));
  }

  /* =========================================================
     8. 3D HOVER PERSPECTIVE TILT
     ========================================================= */
  function initCardTilt() {
    if (window.matchMedia('(hover: none)').matches) return;

    const tiltElements = document.querySelectorAll('.terminal, .card.project-feature');
    tiltElements.forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`;
      });

      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* =========================================================
     INITIALIZE ALL ON DOM READY
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    try {
      init3DScene();
    } catch (e) {
      console.warn('3D initialization failed:', e);
    }

    try {
      initCelestialCursor();
    } catch (e) {
      console.warn('Celestial cursor initialization failed:', e);
    }

    // Run text scramble on hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      setTimeout(() => textScramble(heroTitle), 200);
    }

    initCardTilt();

    // Contact Form handling
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('formStatus');
    if (contactForm && formStatus) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'SENDING...';
        }

        setTimeout(() => {
          formStatus.textContent = '> Message transmitted successfully. Thanks for reaching out!';
          formStatus.className = 'form-status success';
          contactForm.reset();
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'SEND MESSAGE →';
          }
          setTimeout(() => {
            formStatus.className = 'form-status';
          }, 6000);
        }, 800);
      });
    }
  });

})();
