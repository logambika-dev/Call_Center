/* ─── HERO ROTATING TEXT ─── */
(function () {
  // Phrases — use "|" as a line-break marker.
  // Wrap accent words in {curly} to get the gradient italic treatment.
  const phrases = [
    'Your voice, amplified by intelligence',
    'The future of voice is here',
    'Built to {understand.}|Designed to {connect.}',
    'Turning conversations into connections',
  ];

  const el = document.querySelector('.hero-rotating-text');
  if (!el) return;

  let current   = 0;
  let animating = false;

  const DISPLAY      = 4800;  // ms each phrase stays fully visible
  const EXIT_STAGGER = 38;    // ms between each word on exit
  const ENTER_STAGGER= 72;    // ms between each word on enter
  const EXIT_DONE    = 520;   // ms after exit starts before we swap content

  /* Build inner HTML for a phrase */
  function buildHTML(phrase) {
    const lines = phrase.split('|');
    return lines.map((line, li) => {
      const tokens = line.trim().split(' ');
      const spans  = tokens.map(token => {
        const isAccent = token.startsWith('{') && token.endsWith('}');
        const word     = isAccent ? token.slice(1, -1) : token;
        return `<span class="hero-word${isAccent ? ' accent' : ''}">${word}</span>`;
      }).join('');
      return spans + (li < lines.length - 1 ? '<span class="hero-line-break"></span>' : '');
    }).join('');
  }

  /* Animate all .hero-word spans into view with stagger */
  function enterWords() {
    const words = el.querySelectorAll('.hero-word');
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('show'), i * ENTER_STAGGER);
    });
    const lastDelay = (words.length - 1) * ENTER_STAGGER;
    return lastDelay + 650; // time until all words are fully visible
  }

  /* Animate words out (reverse order for smooth exit) */
  function exitWords(cb) {
    const words = [...el.querySelectorAll('.hero-word')];
    words.reverse().forEach((w, i) => {
      setTimeout(() => {
        w.classList.remove('show');
        w.classList.add('exit');
      }, i * EXIT_STAGGER);
    });
    setTimeout(cb, EXIT_DONE);
  }

  /* Show phrase at index */
  function showPhrase(idx) {
    const plain = phrases[idx].replace(/[{|}]/g, '').replace('|', ' ');
    el.innerHTML = buildHTML(phrases[idx]);
    const h1 = el.closest('h1');
    if (h1) h1.setAttribute('aria-label', plain);
    const enterDone = enterWords();
    // Schedule next cycle after display time
    setTimeout(cycle, enterDone + DISPLAY);
  }

  /* Full cycle: exit current → swap → enter next */
  function cycle() {
    if (animating) return;
    animating = true;
    exitWords(() => {
      current = (current + 1) % phrases.length;
      el.innerHTML = buildHTML(phrases[current]);
      void el.offsetWidth; // force reflow
      const h1 = el.closest('h1');
      const plain = phrases[current].replace(/[{|}]/g, '').replace('|', ' ');
      if (h1) h1.setAttribute('aria-label', plain);
      animating = false;
      const enterDone = enterWords();
      setTimeout(cycle, enterDone + DISPLAY);
    });
  }

  // Kick off immediately
  showPhrase(0);
})();

/* ─── TAB SWITCHER ─── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById('tab-' + tab)?.classList.add('active');
  });
});

/* ─── DEMO CARD PLAY TOGGLE ─── */
function togglePlay(card) {
  const isPlaying = card.classList.contains('playing');

  // Stop all
  document.querySelectorAll('.demo-card').forEach(c => {
    c.classList.remove('playing');
    const btn = c.querySelector('.play-btn svg');
    if (btn) btn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
  });

  if (!isPlaying) {
    card.classList.add('playing');
    const path = card.querySelector('.play-btn svg path');
    if (path) path.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'); // pause icon
  }
}

/* ─── NAVBAR SCROLL SHADOW ─── */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    navbar.style.boxShadow = '0 1px 30px rgba(0,0,0,0.4)';
  } else {
    navbar.style.boxShadow = 'none';
  }
}, { passive: true });

/* ─── MOCK PROGRESS BAR ANIMATION ─── */
document.querySelectorAll('.mock-bar').forEach(bar => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        bar.style.width = bar.style.width || '30%';
        setTimeout(() => { bar.style.width = '75%'; }, 800);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(bar);
});

/* ─── WAVE BARS STAGGER FIX ─── */
document.querySelectorAll('.wave-bars span').forEach((bar, i) => {
  bar.style.animationDelay = (i * 0.06) + 's';
});

/* ─── FADE-IN ON SCROLL ─── */
const fadeEls = document.querySelectorAll(
  '.product-card, .demo-card, .testimonial-card, .price-card, .lang-pill, .stat'
);

const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.04}s, transform 0.5s ease ${i * 0.04}s`;
  fadeObserver.observe(el);
});

/* ─── HAMBURGER (mobile) ─── */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navActions = document.querySelector('.nav-actions');

hamburger?.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  navLinks.style.display = open ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '64px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = '#ffffff';
  navLinks.style.padding = '16px 24px';
  navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
});
