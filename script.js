(function () {
  console.log('[portfolio] script loaded v6');

  const portfolioEl = document.getElementById('portfolio');
  const paginationEl = document.getElementById('pagination');
  const bgBlur = document.getElementById('bgBlur');
  const bgGlow = document.getElementById('bgGlow');
  const progressBar = document.getElementById('progressBar');
  const counter = document.getElementById('counter');
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const particlesCanvas = document.getElementById('particlesCanvas');

  let slides = [];
  let dots = [];
  let portfolioData = [];
  let currentIndex = 0;
  let isAnimating = false;

  const FINAL_MESSAGE = {
    title: 'Пока что — это всё',
    description: 'Здесь собраны текущие работы. Время от времени появляются новые проекты — заходите, чтобы увидеть свежее.'
  };

  let audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }

  function unlockAudio() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  function playTick(freq = 660, duration = 0.05, vol = 0.06) {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  ['click', 'touchstart', 'keydown', 'wheel'].forEach((ev) => {
    window.addEventListener(ev, unlockAudio, { once: true, passive: true });
  });

  function initParticles() {
    if (!particlesCanvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = particlesCanvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null, radius: 120 };
    let rafId = null;

    const isMobile = window.matchMedia('(hover: none)').matches;
    const particleCount = isMobile ? 30 : 70;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      particlesCanvas.width = width * window.devicePixelRatio;
      particlesCanvas.height = height * window.devicePixelRatio;
      particlesCanvas.style.width = width + 'px';
      particlesCanvas.style.height = height + 'px';
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.8 + 0.6,
          alpha: Math.random() * 0.5 + 0.3
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        if (mouse.x !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x += (dx / dist) * force * 1.5;
            p.y += (dy / dist) * force * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 184, 255, ${p.alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(140, 170, 255, ${0.15 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    function onMouseMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onMouseLeave() { mouse.x = null; mouse.y = null; }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => { resize(); createParticles(); });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) onMouseLeave(); });
  }

  function attachCursor() {
    if (!cursorDot || !cursorRing) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let running = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      if (!running) { running = true; requestAnimationFrame(loop); }
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      if (Math.abs(mx - rx) > 0.5 || Math.abs(my - ry) > 0.5) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }

    const hoverables = 'a, button, .dot, .project-link, .title-letter, .ghost';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) document.body.classList.remove('cursor-hover');
    });
  }

  function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.textContent = 'Загрузка...';
    document.body.appendChild(loader);
  }

  function showError(msg) {
    document.querySelector('.loading')?.remove();
    const err = document.createElement('div');
    err.className = 'error';
    err.innerHTML = `Не удалось загрузить портфолио.<br>${msg}`;
    document.body.appendChild(err);
  }

  async function loadPortfolio() {
    showLoading();
    try {
      const response = await fetch('data.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      portfolioData = await response.json();
      if (!Array.isArray(portfolioData) || portfolioData.length === 0) {
        throw new Error('data.json пуст или содержит неверный формат');
      }

      document.querySelector('.loading')?.remove();
      renderPortfolio();
      renderFinalSlide();
      renderDots();
      activateSlide(0);
      attachNavigation();
      attachGlow();
      attachParallax();
      attachCursor();
      initParticles();
      initGhost();
      document.querySelectorAll('.project-title').forEach((t) => fitLongWords(t));
      window.addEventListener('resize', () => {
        document.querySelectorAll('.project-title').forEach((t) => fitLongWords(t));
      });
      console.log('[portfolio] initialized, slides:', slides.length);
    } catch (err) {
      console.error('[portfolio] load error:', err);
      showError(err.message);
    }
  }

  function splitIntoLetters(el, text, className = 'title-letter') {
    el.textContent = '';
    const words = text.split(/(\s+)/);
    words.forEach((chunk) => {
      if (/^\s+$/.test(chunk)) {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      if (chunk.length === 0) return;
      const wordSpan = document.createElement('span');
      wordSpan.className = 'title-word';
      Array.from(chunk).forEach((ch) => {
        const letterSpan = document.createElement('span');
        letterSpan.className = className;
        letterSpan.textContent = ch;
        wordSpan.appendChild(letterSpan);
      });
      el.appendChild(wordSpan);
    });
  }

  function splitIntoWords(el, text) {
    el.textContent = '';
    const words = text.split(/(\s+)/);
    let wordIndex = 0;
    words.forEach((chunk) => {
      if (/^\s+$/.test(chunk)) {
        el.appendChild(document.createTextNode(chunk));
      } else if (chunk.length > 0) {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = chunk;
        span.style.transitionDelay = `${wordIndex * 60}ms`;
        el.appendChild(span);
        wordIndex++;
      }
    });
  }

  function renderPortfolio() {
    portfolioData.forEach((project, index) => {
      const slide = document.createElement('section');
      slide.className = 'slide';
      slide.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'slide-inner';

      const title = document.createElement('h2');
      title.className = 'project-title';
      splitIntoLetters(title, project.title || '');

      const desc = document.createElement('p');
      desc.className = 'project-desc';
      splitIntoWords(desc, project.description || '');

      const link = document.createElement('a');
      link.className = 'project-link';
      link.href = project.link || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Смотреть проект';

      attachMagneticLink(link);

      inner.appendChild(title);
      inner.appendChild(desc);
      inner.appendChild(link);
      slide.appendChild(inner);
      portfolioEl.appendChild(slide);
      slides.push(slide);
    });
  }

  function renderFinalSlide() {
    const slide = document.createElement('section');
    slide.className = 'slide final-slide';
    slide.dataset.index = portfolioData.length;

    const inner = document.createElement('div');
    inner.className = 'slide-inner';

    const title = document.createElement('h2');
    title.className = 'final-title';
    splitIntoLetters(title, FINAL_MESSAGE.title, 'final-title-letter');

    const divider = document.createElement('div');
    divider.className = 'final-divider';

    const desc = document.createElement('p');
    desc.className = 'final-desc';
    desc.textContent = FINAL_MESSAGE.description;

    inner.appendChild(title);
    inner.appendChild(divider);
    inner.appendChild(desc);
    slide.appendChild(inner);
    portfolioEl.appendChild(slide);
    slides.push(slide);
  }

  function renderDots() {
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'dot';
      if (index === slides.length - 1) dot.classList.add('final');
      dot.setAttribute('aria-label', index === slides.length - 1 ? 'Финальный слайд' : `Проект ${index + 1}`);
      dot.addEventListener('click', () => {
        playTick(520, 0.04, 0.05);
        goToSlide(index);
      });
      paginationEl.appendChild(dot);
      dots.push(dot);
    });
  }

  function attachMagneticLink(link) {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      link.style.setProperty('--mx', `${dx * 6}px`);
      link.style.setProperty('--my', `${dy * 6}px`);
      link.style.setProperty('--mx-pct', `${(x / rect.width) * 100}%`);
      link.style.setProperty('--my-pct', `${(y / rect.height) * 100}%`);
    });

    link.addEventListener('mouseleave', () => {
      link.style.setProperty('--mx', '0px');
      link.style.setProperty('--my', '0px');
    });
  }

  function fitLongWords(container) {
    if (!container) return;
    if (window.innerWidth > 700) return;

    const containerWidth = container.clientWidth;
    const words = container.querySelectorAll('.title-word');
    words.forEach((word) => {
      word.style.fontSize = '';
      const wordWidth = word.scrollWidth;
      if (wordWidth > containerWidth && containerWidth > 0) {
        const ratio = containerWidth / wordWidth;
        const computed = parseFloat(getComputedStyle(word).fontSize);
        word.style.fontSize = `${computed * ratio * 0.95}px`;
      }
    });
  }

  function activateSlide(index) {
    currentIndex = index;

    slides.forEach((s, i) => {
      s.classList.remove('active');
      s.classList.remove('prev');
      if (i === index) s.classList.add('active');
      else if (i === index - 1 || (index === 0 && i > index)) s.classList.add('prev');
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    if (bgBlur) {
      const offset = -index * 20;
      bgBlur.style.transform = `scale(1.03) translateY(${offset}px)`;
      bgBlur.style.filter = `blur(3px) brightness(${0.35 + index * 0.03}) saturate(0.75)`;
    }

    updateCounter(index);
    updateProgress(index);

    requestAnimationFrame(() => {
      const active = slides[index];
      if (active) {
        const title = active.querySelector('.project-title');
        if (title) fitLongWords(title);
      }
    });
  }

  function updateCounter(index) {
    if (!counter) return;
    const total = String(slides.length).padStart(2, '0');
    const cur = String(index + 1).padStart(2, '0');
    counter.innerHTML = `<span class="cur">${cur}</span> / ${total}`;
  }

  function updateProgress(index) {
    if (!progressBar) return;
    const total = slides.length - 1;
    const pct = total > 0 ? (index / total) * 100 : 100;
    progressBar.style.width = `${pct}%`;
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    if (index === currentIndex) return;
    if (isAnimating) return;

    const prevIndex = currentIndex;
    isAnimating = true;
    playTick(index > currentIndex ? 880 : 440, 0.05, 0.06);
    activateSlide(index);

    window.dispatchEvent(new CustomEvent('slidechange', {
      detail: { index, prevIndex, total: slides.length }
    }));

    setTimeout(() => { isAnimating = false; }, 800);
  }

  function nextSlide() { goToSlide(Math.min(currentIndex + 1, slides.length - 1)); }
  function prevSlide() { goToSlide(Math.max(currentIndex - 1, 0)); }

  function attachNavigation() {
    attachWheel();
    attachTouch();
    attachKeys();
  }

  function attachWheel() {
    let wheelAccum = 0;
    let wheelTimer = null;

    portfolioEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (isAnimating) return;
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelAccum += e.deltaY;
      wheelTimer = setTimeout(() => { wheelAccum = 0; }, 200);
      if (Math.abs(wheelAccum) > 30) {
        if (wheelAccum > 0) nextSlide();
        else prevSlide();
        wheelAccum = 0;
      }
    }, { passive: false });
  }

  function attachTouch() {
    let touchStartY = 0, touchStartX = 0, touchStartTime = 0;

    portfolioEl.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });

    portfolioEl.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      const duration = Date.now() - touchStartTime;
      if (Math.abs(diffX) > Math.abs(diffY)) return;
      if (Math.abs(diffY) < 50) return;
      if (duration > 800) return;
      if (diffY > 0) nextSlide();
      else prevSlide();
    }, { passive: true });

    portfolioEl.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  function attachKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault(); goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault(); goToSlide(slides.length - 1);
      }
    });
  }

  function attachGlow() {
    if (!bgGlow) return;
    let rafId = null;
    let targetX = 50, targetY = 50, curX = 50, curY = 50;

    function loop() {
      curX += (targetX - curX) * 0.15;
      curY += (targetY - curY) * 0.15;
      bgGlow.style.setProperty('--gx', `${curX}%`);
      bgGlow.style.setProperty('--gy', `${curY}%`);
      if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
      if (!rafId) rafId = requestAnimationFrame(loop);
    });
  }

  function attachParallax() {
    let ticking = false;
    window.addEventListener('deviceorientation', (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const gamma = e.gamma || 0;
        const beta = e.beta || 0;
        if (bgBlur) {
          const x = Math.max(-1, Math.min(1, gamma / 45)) * 12;
          const y = Math.max(-1, Math.min(1, (beta - 45) / 45)) * 12;
          bgBlur.style.transform = `scale(1.03) translate(${x}px, ${y + -currentIndex * 20}px)`;
        }
        ticking = false;
      });
    });
  }

  function initGhost() {
    const ghost = document.getElementById('ghost');
    const ghostBody = document.getElementById('ghostBody');
    const pupilL = document.getElementById('pupilL');
    const pupilR = document.getElementById('pupilR');
    const bubble = document.getElementById('ghostBubble');

    if (!ghost || !bubble) return;

    const phrases = {
      appear: ['Бу! 👻', 'Я Бу, здешний дух', 'Тут водятся привидения...'],
      next: ['Бу-у-у →', 'А вот это интересно!', 'Смотри сюда', 'Неплохо, да?'],
      prev: ['Возвращаемся 👻', 'Назад? Ладно...', 'Ты что-то забыл?'],
      final: ['Пока что это всё! 🎉', 'Будут новинки — я посторожу', 'Увидимся, путник!'],
      poke: ['Бу! Испугался? 😱', 'Хе-хе, щекотно!', 'Я не злой 👻', 'Ещё разок?', 'Ты меня нашёл!'],
      random: ['А посмотри-ка вот это!', 'У меня для тебя находка', 'Глянь сюда, не пожалеешь', 'О, это тебе понравится'],
      thinking: ['Хм...', 'Дай подумать', 'Что бы выбрать?'],
      secret: ['Секретный режим открыт! 🎉', 'Ты нашёл пасхалку!', 'Десять кликов — и вот!'],
      secretActive: ['Режим уже включён 😉', 'Ещё раз? Секрет уже с тобой', 'Работает!']
    };

    let bubbleTimer = null;
    let idleTimer = null;
    let thinkingTimer = null;
    let blinkTimer = null;
    let clickCount = 0;
    let secretMode = false;
    let randomNavCooldown = false;

    function showPhrase(text, duration = 2800) {
      bubble.textContent = text;
      bubble.classList.add('show');
      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration);
    }

    function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function vibrate(ms) {
      if (navigator.vibrate) navigator.vibrate(ms);
    }

    setTimeout(() => {
      ghost.classList.add('appear');
      setTimeout(() => {
        ghost.classList.add('wave');
        showPhrase(randomFrom(phrases.appear), 3400);
        setTimeout(() => ghost.classList.remove('wave'), 1800);
      }, 400);
    }, 1200);

    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        ghost.classList.add('blink');
        setTimeout(() => ghost.classList.remove('blink'), 140);
        scheduleBlink();
      }, 2200 + Math.random() * 4000);
    }
    scheduleBlink();

    function resetIdle() {
      ghost.classList.remove('sleep');
      ghost.classList.remove('lay-down');
      ghost.classList.remove('thinking');
      if (idleTimer) clearTimeout(idleTimer);
      if (thinkingTimer) clearTimeout(thinkingTimer);

      thinkingTimer = setTimeout(() => {
        if (!ghost.classList.contains('sleep')) {
          ghost.classList.add('thinking');
          if (Math.random() < 0.4) showPhrase(randomFrom(phrases.thinking), 2200);
        }
      }, 12000);

      idleTimer = setTimeout(() => {
        ghost.classList.remove('thinking');
        ghost.classList.add('sleep');
        ghost.classList.add('lay-down');
      }, 22000);
    }
    resetIdle();

    ['mousemove', 'keydown', 'click', 'touchstart', 'wheel'].forEach((ev) => {
      window.addEventListener(ev, resetIdle, { passive: true });
    });

    window.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(hover: none)').matches) return;
      if (ghost.classList.contains('sleep')) return;

      const rect = ghostBody.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = 2.5;
      const angle = Math.atan2(dy, dx);
      const factor = Math.min(dist / 250, 1) * maxMove;
      const px = Math.cos(angle) * factor;
      const py = Math.sin(angle) * factor;

      if (pupilL) pupilL.style.transform = `translate(${px}px, ${py}px)`;
      if (pupilR) pupilR.style.transform = `translate(${px}px, ${py}px)`;
    }, { passive: true });

    ghost.addEventListener('click', (e) => {
      e.stopPropagation();
      resetIdle();
      vibrate(20);

      clickCount++;
      if (clickCount >= 10) {
        if (!secretMode) {
          secretMode = true;
          document.body.classList.add('secret-mode');
          ghost.classList.add('happy', 'confetti-active');
          showPhrase(randomFrom(phrases.secret), 4200);
          playTick(1400, 0.15, 0.07);
          setTimeout(() => {
            ghost.classList.remove('happy', 'confetti-active');
          }, 1600);
        } else {
          showPhrase(randomFrom(phrases.secretActive), 2200);
        }
        clickCount = 0;
        return;
      }

      if (clickCount >= 3 && !randomNavCooldown) {
        randomNavCooldown = true;

        const projectCount = portfolioData.length;
        let targetIndex = -1;
        if (projectCount > 1) {
          const candidates = [];
          for (let i = 0; i < projectCount; i++) {
            if (i !== currentIndex) candidates.push(i);
          }
          targetIndex = candidates[Math.floor(Math.random() * candidates.length)];
        } else if (projectCount === 1 && currentIndex !== 0) {
          targetIndex = 0;
        }

        if (targetIndex >= 0) {
          const project = portfolioData[targetIndex];
          let phrase;
          const q = (project.ghostQuote || '').trim();
          if (q.length > 0) {
            phrase = q;
          } else {
            phrase = randomFrom(phrases.random);
          }

          ghost.classList.add('happy');
          showPhrase(phrase, 4200);
          setTimeout(() => ghost.classList.remove('happy'), 2600);

          goToSlide(targetIndex);
        }

        setTimeout(() => { randomNavCooldown = false; }, 2500);
      } else if (clickCount < 3) {
        ghost.classList.add('poke', 'happy');
        showPhrase(randomFrom(phrases.poke), 2000);
        playTick(1100, 0.08, 0.05);
        setTimeout(() => {
          ghost.classList.remove('poke', 'happy');
        }, 700);
      }
    });

    window.addEventListener('slidechange', (e) => {
      const { index, prevIndex, total } = e.detail;
      ghost.classList.remove('sleep', 'lay-down', 'thinking');

      if (index === total - 1) {
        ghost.classList.add('happy');
        showPhrase(randomFrom(phrases.final), 4200);
        setTimeout(() => ghost.classList.remove('happy'), 4000);
      } else if (index > prevIndex) {
        if (Math.random() < 0.55) showPhrase(randomFrom(phrases.next), 2200);
      } else if (index < prevIndex && Math.random() < 0.45) {
        showPhrase(randomFrom(phrases.prev), 2200);
      }

      resetIdle();
    });

    console.log('[portfolio] ghost initialized');
  }

  loadPortfolio();
})();