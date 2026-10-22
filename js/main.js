/* =========================================================
   PORTFOLIO — 3D INTERACTIVE & EFFECTS ENGINE
   Inspired by digital archive aesthetic (tanishsaini.vercel.app)
   Features:
   - Three.js 3D wireframe geometric sphere + orbiting particle dust
   - Scroll-driven 3D camera depth & rotation
   - Interactive mouse/pointer parallax tilt
   - Terminal text scramble effect
   - Scroll progress indicator
   - Intersection Observer animations (Skill bars, Reveal cards)
   - Topbar active navigation tracker & mobile menu
   - 3D hover perspective tilt on cards
   ========================================================= */

(() => {
  'use strict';

  /* =========================================================
     1. THREE.JS 3D BACKGROUND (Rotating Wireframe Sphere & Dust)
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
    camera.position.z = 9;

    // Palette: Lime accent (#b8ff3c) & Vintage Cream (#e9e5d9)
    const colorWire = 0xb8ff3c;
    const colorDust = 0xe9e5d9;

    const rig = new THREE.Group();
    scene.add(rig);

    // Outer 3D Wireframe Icosahedron Sphere
    const outerGeo = new THREE.IcosahedronGeometry(2.9, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: colorWire,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const outerSphere = new THREE.Mesh(outerGeo, outerMat);

    // Inner 3D Octahedron Core
    const innerGeo = new THREE.OctahedronGeometry(1.6, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: colorDust,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);

    rig.add(outerSphere, innerCore);

    // Orbiting Atmospheric Dust Particles
    const particleCount = isMobile ? 350 : 850;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 5.5 + Math.random() * 11;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: colorDust,
      size: 0.035,
      transparent: true,
      opacity: 0.5
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

    // Mouse Parallax Targets
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

      const time = performance.now() * 0.00018;

      // 3D Rotations influenced by time, scroll progress & mouse position
      outerSphere.rotation.set(
        time * 0.7 + scrollProgressCurrent * Math.PI * 1.5 + current.y * 0.6,
        time * 1.1 + scrollProgressCurrent * Math.PI * 2.2 + current.x * 0.8,
        0
      );

      innerCore.rotation.set(
        -time * 1.5 - current.y * 0.5,
        -time * 1.0 - scrollProgressCurrent * Math.PI * 3,
        0
      );

      dust.rotation.y = time * 0.45 + current.x * 0.2;
      dust.rotation.x = current.y * 0.15;

      // Dynamic camera dolly and rig position based on scroll
      camera.position.z = 9 - (scrollProgressCurrent * 3.5);
      rig.position.y = (scrollProgressCurrent * 1.4) - 0.3;
      rig.position.x = current.x * 0.4;

      renderer.render(scene, camera);
    }

    animate();
  }

  /* =========================================================
     2. TEXT SCRAMBLE / DECRYPT EFFECT
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
     3. SCROLL PROGRESS BAR & ACTIVE NAV TRACKING
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
     4. MOBILE HAMBURGER MENU
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
     5. SKILL BARS (Intersection Observer)
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
     6. CARD REVEAL ON SCROLL (Intersection Observer)
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
     7. 3D HOVER PERSPECTIVE TILT
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
