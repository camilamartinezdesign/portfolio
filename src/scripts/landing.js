// Interactive behaviour for the landing. Ported from the Claude Design
// `Component extends DCLogic` block; everything is driven by data-* attributes
// in index.html so no framework is needed.

const FINE_POINTER = () => !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches);

function initScrollProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = p + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initRotatingWord() {
  const rot = document.querySelector('[data-rotator]');
  if (!rot) return;
  const words = ['CONECTA', 'VENDE', 'ENAMORA', 'BRILLA'];
  let i = 0;
  setInterval(() => {
    rot.classList.remove('cm-word-in');
    rot.classList.add('cm-word-out');
    setTimeout(() => {
      i = (i + 1) % words.length;
      rot.textContent = words[i];
      rot.classList.remove('cm-word-out');
      rot.classList.add('cm-word-in');
    }, 380);
  }, 2200);
}

function initReveals() {
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
  const imgReveals = Array.from(document.querySelectorAll('[data-img-reveal]'));
  const counters = Array.from(document.querySelectorAll('[data-count]'));

  reveals.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(34px)';
    el.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)';
  });
  imgReveals.forEach((el) => {
    el.style.clipPath = 'inset(0 0 100% 0)';
    el.style.transition = 'clip-path 1s cubic-bezier(.16,1,.3,1)';
  });

  const fmt = (n, sep) => (sep ? n.toLocaleString('en-US') : String(n));
  const runCount = (el) => {
    const to = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    const sep = el.getAttribute('data-count-sep') === '1';
    const suf = el.getAttribute('data-count-suffix') || '';
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(to * eased), sep) + suf;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    imgReveals.forEach((el) => { el.style.clipPath = 'none'; });
    counters.forEach(runCount);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.hasAttribute('data-reveal')) { el.style.opacity = '1'; el.style.transform = 'none'; }
      if (el.hasAttribute('data-img-reveal')) { el.style.clipPath = 'inset(0 0 0% 0)'; }
      if (el.hasAttribute('data-count')) runCount(el);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => io.observe(el));
  imgReveals.forEach((el) => io.observe(el));
  counters.forEach((el) => io.observe(el));
}

function initSparkleCursor() {
  const layer = document.querySelector('[data-cursor]');
  if (!layer || !FINE_POINTER()) return;
  const palette = ['#FF2D9E', '#7B3CFF', '#D7FF00', '#00C9AE', '#FF8A00', '#FFC1E8'];
  const glyphs = ['✦', '✧', '★', '✩', '❋', '✸', '+'];
  let last = 0;
  const spawn = (x, y) => {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < count; k++) {
      const s = document.createElement('span');
      s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      const size = 9 + Math.random() * 15;
      const jx = (Math.random() - 0.5) * 14;
      const jy = (Math.random() - 0.5) * 14;
      s.style.cssText = 'position:absolute; left:' + (x + jx) + 'px; top:' + (y + jy) + 'px; font-size:' + size + 'px; line-height:1; color:' + palette[(Math.random() * palette.length) | 0] + '; pointer-events:none; will-change:transform,opacity; text-shadow:0 0 8px rgba(255,255,255,0.6); filter:drop-shadow(0 0 3px rgba(255,255,255,0.35));';
      layer.appendChild(s);
      const dx = (Math.random() - 0.5) * 54;
      const dy = 14 + Math.random() * 40;
      const rot = (Math.random() - 0.5) * 260;
      const dur = 950 + Math.random() * 450;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(calc(-50% + ' + (dx * 0.32) + 'px), calc(-50% + ' + (dy * 0.28) + 'px)) scale(1.12) rotate(' + (rot * 0.35) + 'deg)', opacity: 1, offset: 0.22 },
        { transform: 'translate(calc(-50% + ' + (dx * 0.7) + 'px), calc(-50% + ' + (dy * 0.62) + 'px)) scale(0.82) rotate(' + (rot * 0.72) + 'deg)', opacity: 0.95, offset: 0.6 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0) rotate(' + rot + 'deg)', opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => s.remove();
    }
  };
  window.addEventListener('mousemove', (ev) => {
    const now = performance.now();
    if (now - last < 20) return;
    last = now;
    spawn(ev.clientX, ev.clientY);
  }, { passive: true });
}

function initCards() {
  const fine = FINE_POINTER();
  document.querySelectorAll('[data-card]').forEach((card) => {
    const slot = card.querySelector('image-slot');
    const arrow = card.querySelector('[data-arrow]');
    const box = card.querySelector('[data-tilt]');
    const ver = card.querySelector('[data-ver]');
    card.addEventListener('mouseenter', () => {
      if (slot) { slot.style.transform = 'scale(1.06)'; slot.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; }
      if (arrow) arrow.style.transform = 'translate(5px,-5px)';
      if (box) box.style.boxShadow = '12px 12px 0 #FF2D9E';
      if (ver) { ver.style.opacity = '1'; ver.style.transform = 'translate(-50%,-50%) scale(1)'; }
    });
    card.addEventListener('mouseleave', () => {
      if (slot) slot.style.transform = 'scale(1)';
      if (arrow) arrow.style.transform = 'none';
      if (box) { box.style.boxShadow = '6px 6px 0 #1A1430'; box.style.transform = 'none'; }
      if (ver) { ver.style.opacity = '0'; ver.style.transform = 'translate(-50%,-50%) scale(0.9)'; }
    });
    // 3D tilt
    if (box && fine) {
      box.style.transformStyle = 'preserve-3d';
      box.style.transition = 'box-shadow .3s ease, transform .15s ease';
      card.addEventListener('mousemove', (ev) => {
        const r = box.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        box.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
      });
    }
  });
}

function initProjectDetails() {
  const overlay = document.querySelector('[data-detail]');
  if (!overlay) return;
  const panels = overlay.querySelectorAll('[data-detail-panel]');

  const openDetail = (key) => {
    let found = false;
    panels.forEach((p) => {
      const match = p.id === 'cm-detail-' + key;
      p.style.display = match ? 'block' : 'none';
      if (match) found = true;
    });
    if (!found) return;
    overlay.style.display = 'block';
    overlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  };
  const closeDetail = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-card]').forEach((card) => {
    card.addEventListener('click', (ev) => {
      ev.preventDefault();
      const s = card.querySelector('image-slot');
      const key = s ? s.id.replace('cm-proj-', '') : null;
      if (key) openDetail(key);
    });
  });
  overlay.querySelectorAll('[data-detail-close]').forEach((b) => b.addEventListener('click', closeDetail));
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && overlay.style.display === 'block') closeDetail();
  });

  // Interactive project index: hover preview (follows cursor) + click opens detail
  const projList = document.querySelector('[data-projlist]');
  if (!projList) return;
  const preview = projList.querySelector('[data-preview]');
  const plabel = projList.querySelector('[data-preview-label]');
  let praf = null, ptx = 0, pty = 0, pcx = 0, pcy = 0;
  const ploop = () => {
    pcx += (ptx - pcx) * 0.2; pcy += (pty - pcy) * 0.2;
    if (preview) { preview.style.left = pcx + 'px'; preview.style.top = pcy + 'px'; }
    praf = requestAnimationFrame(ploop);
  };
  projList.addEventListener('mousemove', (e) => {
    const r = projList.getBoundingClientRect();
    ptx = e.clientX - r.left; pty = e.clientY - r.top;
    if (!praf) { pcx = ptx; pcy = pty; ploop(); }
  });
  projList.querySelectorAll('[data-prow]').forEach((row) => {
    const nm = row.querySelector('[data-rowname]');
    const ar = row.querySelector('[data-rowarrow]');
    const accent = row.getAttribute('data-accent');
    const key = row.getAttribute('data-project');
    row.addEventListener('mouseenter', () => {
      if (preview) {
        const cover = document.getElementById('cm-d-' + key + '-cover');
        const cimg = cover && cover.shadowRoot && cover.shadowRoot.querySelector('img');
        const csrc = cimg && cimg.getAttribute('src');
        preview.style.backgroundImage = csrc ? 'url("' + csrc + '")' : row.getAttribute('data-grad');
        preview.style.opacity = '1';
        preview.style.transform = 'translate(18px,18px) scale(1)';
      }
      if (plabel) plabel.textContent = row.getAttribute('data-name');
      if (nm) { nm.style.color = accent; nm.style.transform = 'translateX(12px)'; }
      if (ar) { ar.style.color = accent; ar.style.transform = 'translateX(6px)'; }
      row.style.background = 'rgba(26,20,48,0.03)';
    });
    row.addEventListener('mouseleave', () => {
      if (preview) { preview.style.opacity = '0'; preview.style.transform = 'translate(18px,18px) scale(0.92)'; }
      if (nm) { nm.style.color = '#1A1430'; nm.style.transform = 'none'; }
      if (ar) { ar.style.color = '#c3bccd'; ar.style.transform = 'none'; }
      row.style.background = 'transparent';
    });
    row.addEventListener('click', (ev) => { ev.preventDefault(); if (key) openDetail(key); });
  });
}

function initHoverEffects() {
  const fine = FINE_POINTER();
  document.querySelectorAll('[data-exp]').forEach((row) => {
    row.addEventListener('mouseenter', () => { row.style.background = 'rgba(255,255,255,0.10)'; row.style.transform = 'translateX(10px)'; });
    row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; row.style.transform = 'none'; });
  });
  if (fine) {
    document.querySelectorAll('[data-magnet]').forEach((btn) => {
      btn.addEventListener('mousemove', (ev) => {
        const r = btn.getBoundingClientRect();
        const mx = ev.clientX - r.left - r.width / 2;
        const my = ev.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${mx * 0.3}px, ${my * 0.4}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'none'; });
    });
  }
  document.querySelectorAll('[data-link]').forEach((l) => {
    l.addEventListener('mouseenter', () => { l.style.transform = 'translateX(8px)'; });
    l.addEventListener('mouseleave', () => { l.style.transform = 'none'; });
  });
}

export function initLanding() {
  initScrollProgress();
  initRotatingWord();
  initReveals();
  initSparkleCursor();
  initCards();
  initProjectDetails();
  initHoverEffects();
}
