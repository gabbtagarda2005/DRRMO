import './style.css';

/* ==========================================================================
   Configuration (Vercel environment variables, baked in at build time)
   ========================================================================== */
const env = import.meta.env;
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const trimSlash = (v) => (v ? String(v).replace(/\/+$/, '') : '');

const CONFIG = {
  api: trimSlash(env.VITE_API_URL) || (isLocal ? 'http://localhost:5000' : ''),
  portals: {
    admin: trimSlash(env.VITE_ADMIN_URL) || (isLocal ? 'http://localhost:3000' : ''),
    officer: trimSlash(env.VITE_OFFICER_URL) || (isLocal ? 'http://localhost:3001' : ''),
    barangay: trimSlash(env.VITE_BARANGAY_URL) || (isLocal ? 'http://localhost:3003' : ''),
  },
  localHotline: env.VITE_LOCAL_HOTLINE || '',
  municipality: env.VITE_MUNICIPALITY_NAME || '',
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ==========================================================================
   Portal links
   ========================================================================== */
function wirePortals() {
  $$('[data-portal]').forEach((el) => {
    const url = CONFIG.portals[el.dataset.portal];
    if (url) {
      el.href = `${url}/login`;
      el.rel = 'noopener';
    } else {
      // Not configured yet: keep visitors on the page instead of a dead link.
      el.href = '#portals';
      el.title = 'Portal URL not configured yet';
    }
  });
}

/* ==========================================================================
   Navigation
   ========================================================================== */
function wireNav() {
  const nav = $('[data-nav]');
  const toggle = $('[data-nav-toggle]');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  $$('.nav__drawer a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
}

/* ==========================================================================
   Reveal-on-scroll + timeline progress
   ========================================================================== */
function wireReveals() {
  const items = $$('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    items.forEach((el) => io.observe(el));
  }

  const timeline = $('[data-timeline]');
  if (timeline && 'IntersectionObserver' in window) {
    const tio = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeline.style.setProperty('--progress', '1');
          setTimeout(() => timeline.classList.add('is-lit'), prefersReducedMotion ? 0 : 900);
          tio.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    tio.observe(timeline);
  }
}

/* Cursor-following glow on feature cards */
function wireCardGlow() {
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ==========================================================================
   Preparedness tabs (keyboard accessible)
   ========================================================================== */
function wireTabs() {
  const tabs = $$('[data-tab]');
  const select = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
}

/* ==========================================================================
   Live municipal status (public, count-only endpoint)
   ========================================================================== */
const numberFmt = new Intl.NumberFormat('en-PH');

function countUp(el, target) {
  const from = Number(el.dataset.value || 0);
  el.dataset.value = String(target);
  if (prefersReducedMotion || from === target) {
    el.textContent = numberFmt.format(target);
    return;
  }
  const start = performance.now();
  const duration = 1200;
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = numberFmt.format(Math.round(from + (target - from) * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function loadLiveStatus() {
  const live = $('[data-live]');
  const pill = $('[data-status-pill]');
  const pillText = $('[data-status-text]');
  const updated = $('[data-live-updated]');

  if (!CONFIG.api) {
    live.classList.add('is-offline');
    updated.textContent = 'Live data appears once the platform API is connected.';
    pillText.textContent = 'Not connected';
    return;
  }

  try {
    const controller = new AbortController();
    // Render free instances sleep when idle; give a cold start time to wake.
    const timer = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(`${CONFIG.api}/api/public/overview`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    $$('[data-stat]').forEach((el) => countUp(el, Number(data[el.dataset.stat] ?? 0)));
    $$('[data-stat-suffix]').forEach((el) => {
      const v = Number(data[el.dataset.statSuffix] ?? 0);
      el.textContent = v ? `/ ${numberFmt.format(v)}` : '';
    });

    const operational = data.status === 'operational';
    live.classList.remove('is-offline');
    pill.classList.toggle('is-online', operational);
    pill.classList.toggle('is-degraded', !operational);
    pillText.textContent = operational ? 'All systems operational' : 'Degraded service';
    updated.textContent = `Updated ${new Date(data.updatedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} · refreshes every minute`;
  } catch {
    live.classList.add('is-offline');
    pill.classList.remove('is-online');
    pill.classList.add('is-degraded');
    pillText.textContent = 'Status unavailable';
    updated.textContent = 'Live status is temporarily unavailable. Retrying…';
  }
}

/* ==========================================================================
   Hotlines, footer details
   ========================================================================== */
function wireDetails() {
  $('[data-year]').textContent = String(new Date().getFullYear());
  if (CONFIG.municipality) {
    $('[data-municipality]').textContent = `Disaster Risk Reduction & Management Office · ${CONFIG.municipality}`;
  }
  if (CONFIG.localHotline) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'hotline';
    a.href = `tel:${CONFIG.localHotline.replace(/[^\d+]/g, '')}`;
    const num = document.createElement('span');
    num.className = 'hotline__num';
    num.style.fontSize = CONFIG.localHotline.length > 6 ? '30px' : '';
    num.textContent = CONFIG.localHotline;
    const label = document.createElement('span');
    label.className = 'hotline__label';
    label.textContent = CONFIG.municipality ? `${CONFIG.municipality} DRRMO` : 'Local DRRMO Operations Center';
    const small = document.createElement('small');
    small.textContent = 'Municipal command center · 24/7';
    label.appendChild(small);
    a.append(num, label);
    li.appendChild(a);
    $('[data-hotlines]').appendChild(li);
  }
}

/* ==========================================================================
   Hero: animated topographic contours (marching squares over drifting noise)
   ========================================================================== */
function createNoise(seed = 7) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256).map((_, i) => i);
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => ((h & 1 ? -x : x) + (h & 2 ? -y : y)) * (h & 4 ? 0.7071 : 1);
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  return (x, y) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u), lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v);
  };
}

function startContours() {
  const canvas = $('[data-contours]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const noise = createNoise(20251116);

  const CELL = 12;
  const LEVELS = Array.from({ length: 15 }, (_, i) => -0.7 + i * 0.1);
  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let field = new Float32Array(0);
  let running = true;
  let last = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    field = new Float32Array(cols * rows);
  };

  const sample = (t) => {
    const k = 0.0042;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * CELL;
        const y = j * CELL;
        // Two drifting octaves plus a gentle domain warp — reads like terrain.
        const wx = noise(x * k * 0.6 + t * 0.018, y * k * 0.6) * 0.9;
        const n1 = noise(x * k + t * 0.03 + wx, y * k - t * 0.02);
        const n2 = noise(x * k * 2.1 - t * 0.025, y * k * 2.1 + t * 0.035 + wx) * 0.42;
        // Bias toward a ridge on the right so the composition frames the headline.
        const bias = ((x / w) - 0.55) * 0.35;
        field[j * cols + i] = n1 + n2 + bias;
      }
    }
  };

  const draw = (t) => {
    sample(t);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let li = 0; li < LEVELS.length; li++) {
      const level = LEVELS[li];
      const major = li % 5 === 0;
      const flood = li === 10;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i];
          const b = field[j * cols + i + 1];
          const c = field[(j + 1) * cols + i + 1];
          const d = field[(j + 1) * cols + i];
          let idx = 0;
          if (a > level) idx |= 8;
          if (b > level) idx |= 4;
          if (c > level) idx |= 2;
          if (d > level) idx |= 1;
          if (idx === 0 || idx === 15) continue;

          const x = i * CELL;
          const y = j * CELL;
          const top = [x + CELL * ((level - a) / (b - a)), y];
          const right = [x + CELL, y + CELL * ((level - b) / (c - b))];
          const bottom = [x + CELL * ((level - d) / (c - d)), y + CELL];
          const left = [x, y + CELL * ((level - a) / (d - a))];
          const seg = (p, q) => {
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(q[0], q[1]);
          };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 10: seg(left, bottom); seg(top, right); break;
          }
        }
      }
      ctx.strokeStyle = flood
        ? 'rgba(245, 165, 36, 0.42)'
        : major
          ? 'rgba(170, 196, 240, 0.30)'
          : 'rgba(150, 178, 228, 0.13)';
      ctx.lineWidth = flood || major ? 1.15 : 0.85;
      ctx.stroke();
    }
  };

  const loop = (now) => {
    if (!running) return;
    // ~24fps is plenty for a slow drift and keeps laptops cool.
    if (now - last > 42) {
      draw(now / 1000);
      last = now;
    }
    requestAnimationFrame(loop);
  };

  resize();
  draw(0);
  canvas.classList.add('is-ready');

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      draw(performance.now() / 1000);
    }, 120);
  });

  if (prefersReducedMotion) return;

  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    if (on) requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting && !document.hidden)).observe(canvas);
  }
  requestAnimationFrame(loop);
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.documentElement.classList.remove('no-js');
wirePortals();
wireNav();
wireReveals();
wireCardGlow();
wireTabs();
wireDetails();
startContours();
loadLiveStatus();
setInterval(loadLiveStatus, 60_000);
