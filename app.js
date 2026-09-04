/* ==========================================================================
   Arch. Alaa Mahmoud — GameDev Poppins Portfolio Interactive Engine
   ========================================================================== */

// Section Metadata Lookup Table
/* 'archive' was folded into the work grid (D-009) and its entry here has been
   stale ever since — it could never match a section, so it only shifted the
   numbering. Removed; 'engage' takes 05 (D-017). */
const sectionMeta = {
  'hero': { num: '01', name: 'HOME', idx: 0 },
  'projects': { num: '02', name: 'WORK', idx: 1 },
  'about-me': { num: '03', name: 'ABOUT ME', idx: 2 },
  'twin': { num: '04', name: 'BRIEFING', idx: 3 },
  'engage': { num: '05', name: 'ENGAGE', idx: 4 },
  'contact': { num: '06', name: 'CONTACT', idx: 5 }
};

let scrollLabelTimeout = null;
let zsyncAnimFrame = null;
let activeDemoAnimFrame = null;

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. Background dot matrix.
   A site whose entire pitch is "60 FPS" cannot ship a background that costs
   frames, so this is deliberately optimized and parks when idle. */
function initGlobalCanvas() {
  const canvas = document.getElementById('globalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SPACING = 40;
  const RADIUS = 150;
  const BASE_R = 2.0;
  const BASE_A = 0.20;

  let cssWidth = 0, cssHeight = 0;
  let cols = [], rows = [];
  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
  let running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = window.innerWidth;
    cssHeight = window.innerHeight;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = [];
    for (let x = SPACING / 2; x < cssWidth; x += SPACING) cols.push(x);
    rows = [];
    for (let y = SPACING / 2; y < cssHeight; y += SPACING) rows.push(y);

    draw();
  }

  function accent() {
    return document.documentElement.getAttribute('data-theme') === 'dev'
      ? '0, 240, 255'
      : '229, 196, 131';
  }

  function draw() {
    const rgb = accent();
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.fillStyle = `rgba(${rgb}, ${BASE_A})`;
    ctx.beginPath();
    const hot = [];
    for (let i = 0; i < cols.length; i++) {
      const x = cols[i];
      const dx = mouse.x - x;
      if (dx * dx > RADIUS * RADIUS) {
        for (let j = 0; j < rows.length; j++) {
          ctx.moveTo(x + BASE_R, rows[j]);
          ctx.arc(x, rows[j], BASE_R, 0, Math.PI * 2);
        }
        continue;
      }
      for (let j = 0; j < rows.length; j++) {
        const y = rows[j];
        const dy = mouse.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < RADIUS * RADIUS) {
          hot.push(x, y, 1 - Math.sqrt(d2) / RADIUS);
        } else {
          ctx.moveTo(x + BASE_R, y);
          ctx.arc(x, y, BASE_R, 0, Math.PI * 2);
        }
      }
    }
    ctx.fill();

    for (let k = 0; k < hot.length; k += 3) {
      const force = hot[k + 2];
      ctx.fillStyle = `rgba(${rgb}, ${BASE_A + force * 0.8})`;
      ctx.beginPath();
      ctx.arc(hot[k], hot[k + 1], BASE_R + force * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render() {
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;
    draw();

    if (Math.abs(mouse.targetX - mouse.x) < 0.5 &&
        Math.abs(mouse.targetY - mouse.y) < 0.5) {
      running = false;
      return;
    }
    requestAnimationFrame(render);
  }

  function wake() {
    if (running || prefersReducedMotion) return;
    running = true;
    requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    wake();
  }, { passive: true });

  new MutationObserver(draw).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });
}

// 2. 60 FPS Scroll Progress & Dynamic Section Tracker
function initScrollTracker() {
  const scrollSectionNum = document.getElementById('scrollSectionNum');
  const scrollSectionName = document.getElementById('scrollSectionName');
  const rulerIndicator = document.getElementById('rulerIndicator');
  const rulerTicks = document.querySelectorAll('.ruler-tick');
  const label = document.getElementById('scrollSectionLabel');

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (label) {
          label.classList.add('visible');
          clearTimeout(scrollLabelTimeout);
          scrollLabelTimeout = setTimeout(() => {
            label.classList.remove('visible');
          }, 1200);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        const meta = sectionMeta[id];

        /* The floating button overlaps the footer's right-hand text at the
           bottom of the page, and is redundant once contact is on screen.
           Reuses this observer rather than adding a second one (D-019). */
        const fab = document.querySelector('.floating-contact-btn');
        if (fab) fab.classList.toggle('is-hidden', id === 'contact');

        if (meta) {
          if (scrollSectionNum) scrollSectionNum.textContent = meta.num;
          if (scrollSectionName) scrollSectionName.textContent = meta.name;

          if (rulerIndicator && rulerTicks.length > 1) {
            const topPos = (meta.idx / (rulerTicks.length - 1)) * 170;
            rulerIndicator.style.top = `${topPos}px`;
          }
        }

        rulerTicks.forEach(tick => {
          if (tick.getAttribute('data-section') === id) {
            tick.classList.add('active');
          } else {
            tick.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));
}

/* --- Per-mode categories ---------------------------------------------------
   A category carries an optional block per mode. A null/absent `vision` or
   `systems` means the category is OFF in that mode: no pill, and its projects
   leave that mode's grid entirely, ALL included (decisions.md D-013). A
   category with both blocks is shared, with its own label and order on each
   side. D-009 still holds inside a mode — nothing shown is unreachable — but
   "ALL" now means all of THIS mode, which is the point of having two. */
function modeKeyFor(theme) {
  return theme === 'dev' ? 'systems' : 'vision';
}

function modeCategories(mode) {
  return typeof CATEGORIES === 'undefined' ? [] : CATEGORIES.filter(c => c[mode]);
}

function modeCategoryIds(mode) {
  return new Set(modeCategories(mode).map(c => c.id));
}

/* `hidden: true` on a project takes it off the site everywhere — grid, pills,
   counts, stage — without deleting it from the data. It is the draft switch:
   work that exists but is not ready to be shown, or a plate pulled for a
   specific proposal. Absent means listed, so existing data needs no edit. */
function isListed(p) {
  return p && p.hidden !== true;
}

/* Everything this mode is allowed to show, in data order. */
/* A project can opt out of one side (D-026). `modes: ['vision']` shows it only
   in Vision, `['systems']` only in Systems; ABSENT MEANS BOTH, so every entry
   written before this existed keeps working unchanged — same convention as
   `hidden`. Category still gates first: D-013's per-mode category block turns a
   whole discipline off, this narrows a single project inside one. */
function inMode(p, mode) {
  return !Array.isArray(p.modes) || p.modes.length === 0 || p.modes.includes(mode);
}

function modeProjects(mode) {
  if (typeof allProjects === 'undefined') return [];
  const live = modeCategoryIds(mode);
  return allProjects.filter(p => isListed(p) && live.has(p.category) && inMode(p, mode));
}

/* Builds the work-grid filter pills for the active mode straight from the
   CATEGORY REGISTRY in data/projects.js. Because it is generated, a category
   can never exist in the data without a pill to reach it — in the modes where
   it is switched on. */
function pillSet(mode, allLabel) {
  const pool = modeProjects(mode);
  const row = (cat, label, n) => {
    const on = currentFilter === cat;
    return `<button class="rail-item ${on ? 'active' : ''}" onclick="filterProjects('${cat}', this)"` +
           ` role="tab" aria-selected="${on}">` +
           `<span class="rail-item-label">${label}</span>` +
           `<span class="rail-n">${n}</span></button>`;
  };
  const used = new Set(pool.map(p => p.category));
  const cats = modeCategories(mode)
    .filter(c => used.has(c.id))            // don't show a row that would land on nothing
    .slice()
    .sort((a, b) => a[mode].order - b[mode].order)
    .map(c => row(c.id, c[mode].label, pool.filter(p => p.category === c.id).length));
  return [row('all', allLabel, pool.length), ...cats].join('');
}

/* --- The capability lens ---------------------------------------------------
   `category` files a project; `capabilities` argue about it. The category pills
   above are exclusive and vertical — one project, one pill. Capabilities are
   the opposite: they cut ACROSS categories and across both tiers, so selecting
   'geometry' returns an engine tool, a hybrid solver and two research plates at
   once. That crossing is the whole argument of the site, and it is why the lens
   composes WITH the category pill rather than replacing it.

   Generated from the CAPABILITIES registry for the same reason pillSet() is
   generated from CATEGORIES (D-011): a capability that is not in the registry
   gets no chip, so a project carrying it would be unreachable. */
function capabilityRegistry() {
  return typeof CAPABILITIES === 'undefined' ? [] : CAPABILITIES;
}

function capsOf(p) {
  return (p && Array.isArray(p.capabilities)) ? p.capabilities : [];
}

function capabilityLabel(id) {
  const c = capabilityRegistry().find(x => x.id === id);
  return c ? c.label : id;
}

/* Registry labels are stored HTML-encoded so the admin exporter round-trips
   (D-013). That is correct for innerHTML and wrong for textContent, which
   renders '&amp;' literally. Decode only at the point of use. */
function decodeLabel(s) {
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

/* Capabilities that actually land on something in this mode. A chip that would
   return an empty grid is not shown — same rule pillSet() applies. */
function liveCapabilities(mode) {
  const used = new Set();
  modeProjects(mode).forEach(p => capsOf(p).forEach(c => used.add(c)));
  return capabilityRegistry()
    .filter(c => used.has(c.id))
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function capabilitySet(mode) {
  /* Counts are computed against the CATEGORY THE VISITOR IS STANDING ON, not
     against the whole mode. Sweeping all 120 mode x pill x chip combinations
     found 40 that returned an empty grid: the lens composes with the pill, and
     most capabilities simply do not occur under most categories. A count that
     ignored the pill was advertising work that the next click would not show.
     Zero-count chips are disabled, which makes the empty state unreachable
     rather than merely explained once you are in it. */
  const all = modeProjects(mode);
  const pool = currentFilter && currentFilter !== 'all'
    ? all.filter(p => p.category === currentFilter)
    : all;
  const chips = liveCapabilities(mode).map(c => {
    const n = pool.filter(p => capsOf(p).includes(c.id)).length;
    const on = currentCapability === c.id;
    const dead = n === 0 && !on;
    return `<button class="rail-item cap-chip ${on ? 'active' : ''} ${dead ? 'cap-zero' : ''}"` +
           ` onclick="filterByCapability('${c.id}', this)" ${dead ? 'disabled' : ''}` +
           ` aria-pressed="${on}" title="${dead ? 'No ' + c.label + ' work under this filter' : 'Projects using ' + c.label}">` +
           `<span class="rail-item-label">${c.label}</span><span class="rail-n">${n}</span></button>`;
  });
  if (!chips.length) return '';

  /* A capability that is applied must never be hidden — otherwise the grid is
     narrowed by a filter the visitor cannot see or clear. */
  if (currentCapability) lensOpen = true;

  const clear = currentCapability
    ? `<button class="cap-chip cap-clear" onclick="filterByCapability(null, this)" aria-pressed="false">CLEAR</button>`
    : '';

  const active = currentCapability ? decodeLabel(capabilityLabel(currentCapability)) : '';
  const summary = currentCapability ? active : `All skills`;

  const toggle =
    `<button class="lens-toggle ${lensOpen ? 'open' : ''}" onclick="toggleLens(this)"` +
    ` aria-expanded="${lensOpen}" aria-controls="lensChips">` +
    `<span class="rail-item-label">${summary}</span>` +
    `<i class="fa-solid fa-chevron-down lens-caret" aria-hidden="true"></i></button>`;

  if (!lensOpen) return toggle;

  return `${toggle}<div class="lens-chips" id="lensChips">${chips.join('')}${clear}</div>`;
}

function renderCapabilityLens(mode) {
  const host = document.getElementById('capabilityLens');
  if (host) host.innerHTML = capabilitySet(mode);
}

/* On narrow screens the rail sits above the grid, so it collapses — same
   reasoning as D-019: controls must not stand between a visitor and the work. */
let railOpen = false;
function toggleRail() {
  railOpen = !railOpen;
  const body = document.getElementById('railBody');
  const btn = document.getElementById('railMobileToggle');
  if (body) body.classList.toggle('open', railOpen);
  if (btn) {
    btn.classList.toggle('open', railOpen);
    btn.setAttribute('aria-expanded', String(railOpen));
  }
}

function toggleLens() {
  lensOpen = !lensOpen;
  /* Closing while a capability is applied would hide an active filter, so
     closing also clears it — the grid and the control stay in agreement. */
  if (!lensOpen && currentCapability) currentCapability = null;
  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  renderCapabilityLens(modeKeyFor(theme));
  renderProjectsGrid(currentFilter);
}

/* The lens composes with the category pill, so it never touches currentFilter. */
function filterByCapability(id, el) {
  currentCapability = (currentCapability === id) ? null : id;
  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  renderCapabilityLens(modeKeyFor(theme));
  renderProjectsGrid(currentFilter);
}

/* The capability matrix in the About section. Nine rows: what the stack is made
   of, how many pieces of work in the CURRENT MODE evidence each, and the
   strongest named example. It exists to answer the question the project grid
   cannot — "is this one person's system, or twenty-three unrelated jobs?"

   The counts are taken from the live data rather than written into the copy, so
   they cannot drift away from what the site actually shows (CLAUDE.md rule 3).
   A row with no work in this mode is dropped, not shown as zero. */
function renderCapabilityMatrix() {
  const host = document.getElementById('capabilityMatrix');
  if (!host) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const mode = modeKeyFor(theme);
  const pool = modeProjects(mode);

  const rows = liveCapabilities(mode).map(c => {
    const hits = pool.filter(p => capsOf(p).includes(c.id));
    /* The lead example is the first match in mode order, which already puts the
       offer work ahead of the archive — so the named example is the strongest
       one this mode wants to lead with, not an arbitrary pick. */
    return { c, n: hits.length, lead: hits[0] };
  }).filter(r => r.n > 0);

  /* Rows keep REGISTRY order (deliberate: it reads as a stack, runtime-first,
     rather than as a leaderboard). So the bar has to scale against the largest
     count, not against the first row. */
  const max = Math.max(...rows.map(r => r.n), 1);

  /* The count in the lede is written from the data, not typed into the copy —
     a hardcoded "nine" silently becomes a false statement the moment the
     registry changes (CLAUDE.md rule 3, in miniature). */
  const countEl = document.getElementById('capCount');
  if (countEl) countEl.textContent = ['', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][rows.length] || rows.length;

  host.innerHTML = rows.map(r => `
    <button class="cap-row" onclick="jumpToCapability('${r.c.id}')"
            aria-label="Show the ${decodeLabel(r.c.label)} work">
      <span class="cap-row-label">${r.c.label}</span>
      <span class="cap-row-bar"><span style="width:${Math.round(r.n / max * 100)}%"></span></span>
      <span class="cap-row-n">${r.n}</span>
      <span class="cap-row-lead">${r.lead.title}</span>
    </button>`).join('');
}

/* Matrix row → the work grid, with that lens already applied. */
function jumpToCapability(id) {
  currentFilter = 'all';
  currentCapability = id;
  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  renderCapabilityLens(modeKeyFor(theme));
  renderProjectsGrid('all');
  const el = document.getElementById('projects');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Chips for a card or the modal. Read-only — clicking is the lens's job. */
function capChipsHtml(proj, cls) {
  const caps = capsOf(proj);
  if (!caps.length) return '';
  const chips = caps.map(c => `<span class="cap-tag">${capabilityLabel(c)}</span>`).join('');
  return `<div class="${cls}">${chips}</div>`;
}

// Mode Switcher (Vision ↔ Systems)
function setMode(mode) {
  const html = document.documentElement;
  const btnArt = document.getElementById('btnModeArt');
  const btnDev = document.getElementById('btnModeDev');
  const filterContainer = document.getElementById('filterPills');

  html.setAttribute('data-theme', mode);

  /* Switching mode can strip the pill you were standing on, or the project on
     the stage, since a category may be off on this side. Reconcile BEFORE
     anything renders — otherwise the grid comes back with no pill selected and
     an off-mode hero on the stage. */
  if (typeof CATEGORIES !== 'undefined' && typeof allProjects !== 'undefined') {
    const key = modeKeyFor(mode);
    const live = modeCategoryIds(key);
    if (currentFilter !== 'all' && !live.has(currentFilter)) currentFilter = 'all';
    const active = allProjects.find(p => p.id === activeProjectID);
    if (!active || !isListed(active) || !live.has(active.category)) {
      const first = modeProjects(key)[0];
      if (first) activeProjectID = first.id;
    }
  }

  /* The toggle no longer rewrites the hero (D-017). It used to swap the
     headline, eyebrow and subtext, which made it an identity switch — "which
     version of him are you here for". The whole position is that you do not
     have to pick, so the hero is now static and this only chooses which body
     of work the grid shows. */
  if (mode === 'art') {
    if (btnArt) { btnArt.classList.add('active'); btnArt.setAttribute('aria-selected', 'true'); }
    if (btnDev) { btnDev.classList.remove('active'); btnDev.setAttribute('aria-selected', 'false'); }
    if (filterContainer) filterContainer.innerHTML = pillSet('vision', 'All work');
  } else {
    if (btnArt) { btnArt.classList.remove('active'); btnArt.setAttribute('aria-selected', 'false'); }
    if (btnDev) { btnDev.classList.add('active'); btnDev.setAttribute('aria-selected', 'true'); }
    if (filterContainer) filterContainer.innerHTML = pillSet('systems', 'All work');
  }

  /* The lens is per-mode: a capability can lose all its projects when a
     category is switched off on this side, so rebuild it before the grid. */
  renderCapabilityLens(modeKeyFor(mode));
  renderCapabilityMatrix();

  // Clear plate cache on theme switch to update accents
  Object.keys(plateCache).forEach(k => delete plateCache[k]);

  if (typeof allProjects !== 'undefined' && document.getElementById('projectsGrid')) {
    renderProjectsGrid(currentFilter);
    selectStageProject(activeProjectID, false);
  }
}

/* ==========================================================================
   Project Showcase & Media Rendering
   ========================================================================== */

let activeProjectID = 'zsync';
let currentFilter = 'all';
/* Null means the lens is off. Composes with currentFilter; see capabilitySet(). */
let currentCapability = null;
/* The lens is a power feature and it used to put nine more controls between a
   first-time visitor and the work (D-019). It now starts closed. This lives in
   module scope, NOT the DOM, because renderCapabilityLens() replaces innerHTML
   on every mode switch, pill click and grid render. */
let lensOpen = false;
const plateCache = {};
const W = 800, H = 450;

function plateBackground(g, accent) {
  g.fillStyle = '#0B0B0D';
  g.fillRect(0, 0, W, H);

  // Drafting grid
  g.strokeStyle = 'rgba(255,255,255,0.035)';
  g.lineWidth = 1;
  for (let x = 0; x <= W; x += 25) {
    g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke();
  }
  for (let y = 0; y <= H; y += 25) {
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke();
  }

  // Corner registration marks
  g.strokeStyle = `rgba(${accent}, 0.35)`;
  g.lineWidth = 1.5;
  const m = 22, len = 16;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]
    .forEach(([x, y, sx, sy]) => {
      g.beginPath();
      g.moveTo(x + sx * len, y); g.lineTo(x, y); g.lineTo(x, y + sy * len);
      g.stroke();
    });
}

/* Technical drafting schematic plates for all projects */
const plateArt = {
  // 1. ZSync Parallax Engine
  zsync(g, a) {
    const cx = 400, cy = 250;
    g.strokeStyle = `rgba(${a}, 0.30)`;
    g.lineWidth = 1.5;
    for (let r = 70; r <= 190; r += 30) {
      g.beginPath(); g.arc(cx, cy, r, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    }
    g.strokeStyle = `rgba(${a}, 0.95)`;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(cx - 150, cy + 40); g.lineTo(cx - 92, cy - 62);
    g.lineTo(cx - 10, cy - 96); g.lineTo(cx + 82, cy - 58);
    g.lineTo(cx + 150, cy + 40);
    g.stroke();
    g.fillStyle = `rgba(${a}, 0.10)`; g.fill();

    g.strokeStyle = `rgba(${a}, 0.45)`;
    g.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(cx, cy + 108);
      g.lineTo(cx + i * 52, cy - 92);
      g.stroke();
    }
    g.fillStyle = `rgb(${a})`;
    g.beginPath(); g.arc(cx, cy + 108, 6, 0, Math.PI * 2); g.fill();
  },

  // 2. PCG Runtime City
  'pcg-runtime'(g, a) {
    const cx = 400, cy = 260;
    // Isometric grid base
    g.strokeStyle = `rgba(${a}, 0.25)`;
    g.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      g.beginPath();
      g.moveTo(cx + i * 36 - 160, cy + i * 18 - 80);
      g.lineTo(cx + i * 36 + 160, cy + i * 18 + 80);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - i * 36 - 160, cy + i * 18 + 80);
      g.lineTo(cx - i * 36 + 160, cy + i * 18 - 80);
      g.stroke();
    }
    // Procedural building blocks
    const towers = [
      { x: -70, y: -20, h: 95, w: 32 },
      { x: 0, y: 15, h: 140, w: 40 },
      { x: 80, y: -10, h: 110, w: 36 },
      { x: -30, y: 45, h: 75, w: 28 },
      { x: 50, y: 55, h: 85, w: 30 }
    ];
    towers.forEach(t => {
      const bx = cx + t.x, by = cy + t.y;
      g.fillStyle = `rgba(${a}, 0.18)`;
      g.strokeStyle = `rgb(${a})`;
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(bx, by - t.h);
      g.lineTo(bx + t.w, by - t.h + t.w * 0.5);
      g.lineTo(bx + t.w, by + t.w * 0.5);
      g.lineTo(bx, by);
      g.closePath();
      g.fill(); g.stroke();

      g.beginPath();
      g.moveTo(bx, by - t.h);
      g.lineTo(bx - t.w, by - t.h + t.w * 0.5);
      g.lineTo(bx - t.w, by + t.w * 0.5);
      g.lineTo(bx, by);
      g.closePath();
      g.fill(); g.stroke();
    });
  },

  // 3. OpenCV + Grasshopper
  'opencv-grasshopper'(g, a) {
    const cx = 400, cy = 225;
    // Optical flow tracking bounding box
    g.strokeStyle = `rgba(${a}, 0.45)`;
    g.lineWidth = 1.5;
    g.strokeRect(cx - 220, cy - 100, 200, 160);
    // Facial/Hand contour nodes
    const pts = [
      [cx - 150, cy - 50], [cx - 90, cy - 50], [cx - 120, cy - 10],
      [cx - 160, cy + 20], [cx - 80, cy + 20], [cx - 120, cy + 35]
    ];
    g.fillStyle = `rgb(${a})`;
    pts.forEach(([px, py]) => {
      g.beginPath(); g.arc(px, py, 4, 0, Math.PI * 2); g.fill();
    });
    // Vector stream arrow
    g.strokeStyle = `rgb(${a})`;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx + 5, cy - 20); g.lineTo(cx + 70, cy - 20);
    g.stroke();
    // Grasshopper parametric mesh nodes
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const mx = cx + 110 + col * 36;
        const my = cy - 70 + row * 36;
        const scale = 8 + (col * 3 + row * 2) % 12;
        g.strokeStyle = `rgba(${a}, 0.8)`;
        g.strokeRect(mx - scale/2, my - scale/2, scale, scale);
      }
    }
  },

  // 4. House Walkthrough
  'house-walkthrough'(g, a) {
    const cx = 400, cy = 230;
    // Room perspective wireframe
    g.strokeStyle = `rgba(${a}, 0.85)`;
    g.lineWidth = 2;
    g.strokeRect(cx - 180, cy - 90, 360, 180);
    // Vanishing point lines
    g.strokeStyle = `rgba(${a}, 0.35)`;
    g.lineWidth = 1;
    [
      [cx - 180, cy - 90], [cx + 180, cy - 90],
      [cx - 180, cy + 90], [cx + 180, cy + 90]
    ].forEach(([x, y]) => {
      g.beginPath(); g.moveTo(x, y); g.lineTo(cx, cy); g.stroke();
    });
    // Camera cone
    g.fillStyle = `rgb(${a})`;
    g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
    g.font = '12px "JetBrains Mono", monospace';
    g.fillText('60 FPS LUMEN REAL-TIME RIG', cx - 90, cy + 120);
  },

  // 5. Procedural Interiors
  'procedural-interiors'(g, a) {
    const cx = 400, cy = 225;
    g.strokeStyle = `rgb(${a})`;
    g.lineWidth = 2.4;
    // Dynamic room walls with boolean aperture cuts
    g.beginPath();
    g.moveTo(cx - 160, cy + 60);
    g.lineTo(cx - 160, cy - 70);
    g.lineTo(cx - 40, cy - 70);
    g.moveTo(cx + 20, cy - 70); // Window cut
    g.lineTo(cx + 160, cy - 70);
    g.lineTo(cx + 160, cy + 60);
    g.lineTo(cx + 60, cy + 60);
    g.moveTo(cx - 20, cy + 60); // Door cut
    g.lineTo(cx - 160, cy + 60);
    g.stroke();
    // Door swing arc
    g.strokeStyle = `rgba(${a}, 0.5)`;
    g.setLineDash([4, 4]);
    g.beginPath();
    g.arc(cx + 60, cy + 60, 80, Math.PI, Math.PI * 1.5);
    g.stroke();
    g.setLineDash([]);
  },

  // 6. UE JSON World Hierarchy
  'ue-json'(g, a) {
    const x0 = 250, y0 = 110, step = 42, indent = 46;
    const nodes = [0, 1, 2, 2, 1, 2, 3, 1];
    g.font = '13px "JetBrains Mono", monospace';
    nodes.forEach((depth, i) => {
      const x = x0 + depth * indent;
      const y = y0 + i * step;
      if (i > 0) {
        let p = i - 1;
        while (p >= 0 && nodes[p] >= depth) p--;
        if (p >= 0) {
          const px = x0 + nodes[p] * indent;
          g.strokeStyle = `rgba(${a}, 0.35)`;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(px + 6, y0 + p * step + 8);
          g.lineTo(px + 6, y); g.lineTo(x - 6, y);
          g.stroke();
        }
      }
      g.fillStyle = depth === 0 ? `rgb(${a})` : `rgba(${a}, ${0.85 - depth * 0.16})`;
      g.fillRect(x, y - 7, 14, 14);
      g.fillStyle = `rgba(255,255,255,${0.5 - depth * 0.08})`;
      g.fillText(['World', 'Zone', 'Actor', 'Component'][depth], x + 26, y + 5);
    });
  },

  // 7. ArchViz Automation Dataprep
  'archviz-automation'(g, a) {
    const cx = 400, cy = 225;
    const stages = ['DataTable', 'Dataprep Recipe', 'Level Actors', 'UI Widget'];
    stages.forEach((st, i) => {
      const x = cx - 240 + i * 130;
      g.strokeStyle = i === 1 ? `rgb(${a})` : `rgba(${a}, 0.45)`;
      g.fillStyle = i === 1 ? `rgba(${a}, 0.15)` : 'rgba(255,255,255,0.03)';
      g.lineWidth = i === 1 ? 2 : 1.2;
      g.beginPath(); g.roundRect(x, cy - 35, 105, 70, 4); g.fill(); g.stroke();
      g.fillStyle = `rgb(${a})`;
      g.font = '11px "JetBrains Mono", monospace';
      g.textAlign = 'center';
      g.fillText(st, x + 52, cy + 4);
      if (i < 3) {
        g.strokeStyle = `rgba(${a}, 0.6)`;
        g.beginPath(); g.moveTo(x + 105, cy); g.lineTo(x + 128, cy); g.stroke();
      }
    });
    g.textAlign = 'left';
  },

  // 8. Ladybug Solar & Environmental Bridge
  'ladybug-ue5'(g, a) {
    const cx = 400, cy = 230;
    // Sun trajectory dome
    g.strokeStyle = `rgba(${a}, 0.35)`;
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy + 40, 140, Math.PI, 0); g.stroke();
    // Sun position
    const sunX = cx + Math.cos(Math.PI * 0.7) * 140;
    const sunY = cy + 40 - Math.sin(Math.PI * 0.7) * 140;
    g.fillStyle = '#FFBD2E';
    g.beginPath(); g.arc(sunX, sunY, 10, 0, Math.PI * 2); g.fill();
    // Solar vectors onto building
    g.strokeStyle = 'rgba(255, 189, 46, 0.6)';
    g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(sunX, sunY); g.lineTo(cx, cy); g.stroke();
    g.setLineDash([]);
    // Building thermal surface
    g.strokeStyle = `rgb(${a})`;
    g.lineWidth = 2;
    g.strokeRect(cx - 60, cy - 40, 120, 80);
    g.fillStyle = `rgba(${a}, 0.2)`;
    g.fillRect(cx - 60, cy - 40, 120, 80);
  },

  // 9. Spline UV Parameterisation
  'spline-uv'(g, a) {
    const draw = (yBase, even) => {
      const p = [[120, yBase], [290, yBase - 60], [510, yBase + 60], [680, yBase]];
      const at = t => {
        const u = 1 - t;
        return [
          u*u*u*p[0][0] + 3*u*u*t*p[1][0] + 3*u*t*t*p[2][0] + t*t*t*p[3][0],
          u*u*u*p[0][1] + 3*u*u*t*p[1][1] + 3*u*t*t*p[2][1] + t*t*t*p[3][1]
        ];
      };
      g.strokeStyle = `rgba(${a}, 0.5)`;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(p[0][0], p[0][1]);
      g.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
      g.stroke();
      g.fillStyle = even ? `rgb(${a})` : 'rgba(255,120,90,0.95)';
      for (let i = 0; i <= 22; i++) {
        const f = i / 22;
        const t = even ? f : 0.5 - Math.cos(Math.PI * f) / 2;
        const [x, y] = at(t);
        g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill();
      }
    };
    draw(160, false);
    draw(310, true);
  },

  // 10. Grasshopper MCP Bridge
  'gh-mcp'(g, a) {
    const box = (x, y, w, h, label, strong) => {
      g.strokeStyle = strong ? `rgb(${a})` : `rgba(${a}, 0.4)`;
      g.lineWidth = strong ? 2.4 : 1.4;
      g.fillStyle = strong ? `rgba(${a}, 0.12)` : 'rgba(255,255,255,0.02)';
      g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); g.stroke();
      g.fillStyle = strong ? `rgb(${a})` : 'rgba(255,255,255,0.62)';
      g.font = '13px "JetBrains Mono", monospace';
      g.textAlign = 'center';
      g.fillText(label, x + w / 2, y + h / 2 + 5);
      g.textAlign = 'left';
    };
    const arrow = (x1, x2, y) => {
      g.strokeStyle = `rgba(${a}, 0.55)`; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x2 - 8, y); g.stroke();
      g.beginPath(); g.moveTo(x2, y); g.lineTo(x2 - 10, y - 5);
      g.lineTo(x2 - 10, y + 5); g.closePath();
      g.fillStyle = `rgba(${a}, 0.55)`; g.fill();
    };
    box(70, 195, 150, 60, 'AI agent', false);
    arrow(228, 288, 225);
    box(296, 195, 150, 60, 'MCP', false);
    arrow(454, 514, 225);
    box(522, 165, 208, 120, 'Grasshopper', true);
    g.fillStyle = `rgba(${a}, 0.7)`;
    g.font = '11px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    g.fillText('holds the constraints', 626, 252);
    g.textAlign = 'left';
  },

  // 11. C++ AST Compiler Loop
  'cpp-ast'(g, a) {
    const cx = 400, cy = 228, r = 118;
    g.strokeStyle = `rgba(${a}, 0.4)`;
    g.lineWidth = 2;
    g.setLineDash([7, 7]);
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]);
    const pts = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    const labels = ['propose', 'AST check', 'cl.exe', 'diagnostics'];
    pts.forEach(([x, y], i) => {
      const strong = i === 2;
      g.fillStyle = strong ? `rgb(${a})` : '#0B0B0D';
      g.strokeStyle = `rgb(${a})`;
      g.lineWidth = strong ? 3 : 2;
      g.beginPath(); g.arc(x, y, strong ? 15 : 11, 0, Math.PI * 2);
      g.fill(); g.stroke();
      g.fillStyle = strong ? `rgb(${a})` : 'rgba(255,255,255,0.62)';
      g.font = `${strong ? 'bold ' : ''}13px "JetBrains Mono", monospace`;
      g.textAlign = 'center';
      g.fillText(labels[i], x, y + (i === 2 ? 40 : i === 0 ? -24 : 32));
      g.textAlign = 'left';
    });
  },

  // 12. ComfyUI Diffusion Pipeline
  'comfy-ai'(g, a) {
    const labels = ['depth', 'control', 'sample', 'sheet'];
    const w = 150, h = 74, y = 190;
    labels.forEach((label, i) => {
      const x = 62 + i * (w + 12);
      const last = i === labels.length - 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + w - 18, y);
      g.lineTo(x + w, y + h / 2);
      g.lineTo(x + w - 18, y + h);
      g.lineTo(x, y + h);
      g.lineTo(x + 18, y + h / 2);
      g.closePath();
      g.fillStyle = last ? `rgba(${a}, 0.16)` : 'rgba(255,255,255,0.025)';
      g.strokeStyle = last ? `rgb(${a})` : `rgba(${a}, 0.42)`;
      g.lineWidth = last ? 2.4 : 1.4;
      g.fill(); g.stroke();
      g.fillStyle = last ? `rgb(${a})` : 'rgba(255,255,255,0.62)';
      g.font = '13px "JetBrains Mono", monospace';
      g.textAlign = 'center';
      g.fillText(label, x + w / 2 + 4, y + h / 2 + 5);
      g.textAlign = 'left';
    });
  },

  // 13. Text-to-Image AI App
  'text-to-image-app'(g, a) {
    const cx = 400, cy = 225;
    g.strokeStyle = `rgba(${a}, 0.6)`;
    g.lineWidth = 1.5;
    g.strokeRect(cx - 240, cy - 40, 140, 80);
    g.fillStyle = `rgb(${a})`;
    g.font = '12px "JetBrains Mono", monospace';
    g.fillText('distilgpt2', cx - 215, cy + 5);
    g.strokeStyle = `rgb(${a})`;
    g.beginPath(); g.moveTo(cx - 95, cy); g.lineTo(cx - 20, cy); g.stroke();
    g.strokeRect(cx - 15, cy - 50, 160, 100);
    g.fillText('Stable Diffusion', cx, cy + 5);
    g.fillText('Architectural Prompt Engine', cx - 110, cy + 85);
  },

  /* 14–17. The four public-repository projects. None of them ship footage or a
     demo panel, so the generated plate is the only image the card ever has —
     it has to carry the idea on its own. Each one draws the actual shape of the
     experiment, not a logo. */

  // 14. Concrete Compressive Strength — predicted against measured
  'concrete-strength'(g, a) {
    /* `.card-thumb` is a fixed 150–168 px box with `background-size: cover`, so
       an 800×450 plate is cropped top and bottom — hardest on a one-column
       card, where only roughly y 110–340 survives. Every plate below is drawn
       inside that band. */
    const x0 = 250, y0 = 330, s = 168;
    g.strokeStyle = `rgba(${a}, 0.55)`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0, y0 - s); g.lineTo(x0, y0); g.lineTo(x0 + s, y0);
    g.stroke();

    // Perfect-prediction diagonal
    g.strokeStyle = `rgba(${a}, 0.32)`;
    g.setLineDash([5, 5]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + s, y0 - s); g.stroke();
    g.setLineDash([]);

    // Scatter hugging the diagonal — R² 0.918 looks like this, not like a line
    g.fillStyle = `rgba(${a}, 0.72)`;
    for (let i = 0; i < 46; i++) {
      const t = (i * 37 % 100) / 100;
      const spread = ((i * 53 % 21) - 10) / 100;
      const px = x0 + t * s;
      const py = y0 - (t + spread * 0.5) * s;
      g.beginPath(); g.arc(px, py, 2.6, 0, Math.PI * 2); g.fill();
    }

    g.fillStyle = 'rgba(255,255,255,0.62)';
    g.font = '12px "JetBrains Mono", monospace';
    // Beside the axis end rather than under it — under it is outside the crop.
    g.fillText('measured strength (MPa)', x0 + s + 12, y0 + 4);
    g.save();
    g.translate(x0 - 14, y0 - s / 2 + 60);
    g.rotate(-Math.PI / 2);
    g.fillText('predicted', 0, 0);
    g.restore();
    g.fillStyle = `rgb(${a})`;
    g.fillText('XGBoost · degree 2 · R² 0.918', x0 - 4, y0 - s - 16);
  },

  // 15. Heart Failure — three objectives selecting three different models
  'heart-failure'(g, a) {
    const rows = [
      ['accuracy', 0.62, false],
      ['f1_macro', 0.78, false],
      ['recall_macro', 0.92, true]
    ];
    const x0 = 210, w = 340, h = 40;
    g.font = '13px "JetBrains Mono", monospace';
    rows.forEach(([label, v, picked], i) => {
      const y = 150 + i * 62;
      g.strokeStyle = `rgba(${a}, 0.28)`;
      g.lineWidth = 1;
      g.strokeRect(x0, y, w, h);
      g.fillStyle = picked ? `rgba(${a}, 0.22)` : 'rgba(255,255,255,0.04)';
      g.fillRect(x0, y, w * v, h);
      if (picked) {
        g.strokeStyle = `rgb(${a})`;
        g.lineWidth = 2.2;
        g.strokeRect(x0, y, w * v, h);
      }
      g.fillStyle = picked ? `rgb(${a})` : 'rgba(255,255,255,0.6)';
      g.textAlign = 'right';
      g.fillText(label, x0 - 14, y + h / 2 + 5);
      g.textAlign = 'left';
      if (picked) g.fillText('← selected', x0 + w * v + 12, y + h / 2 + 5);
    });
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.font = '12px "JetBrains Mono", monospace';
    g.fillText('six classifiers · three objectives each', x0 - 14, 118);
  },

  // 16. Dog Breed — five backbones fused into one head
  'dog-breed-id'(g, a) {
    const names = ['MobileNetV2', 'ResNet152V2', 'Xception', 'NASNetLarge', 'VGG19'];
    // Five rows inside the crop band: 5 × 34 + 4 × 10 = 210 px, from 118 to 328.
    const bx = 92, bw = 168, bh = 34, top = 118, gap = 10;
    const jx = 470, jy = top + (names.length * (bh + gap) - gap) / 2;
    g.font = '12px "JetBrains Mono", monospace';
    names.forEach((n, i) => {
      const y = top + i * (bh + gap);
      g.strokeStyle = `rgba(${a}, 0.45)`;
      g.lineWidth = 1.3;
      g.fillStyle = 'rgba(255,255,255,0.03)';
      g.fillRect(bx, y, bw, bh);
      g.strokeRect(bx, y, bw, bh);
      g.fillStyle = 'rgba(255,255,255,0.66)';
      g.fillText(n, bx + 14, y + bh / 2 + 4);
      g.strokeStyle = `rgba(${a}, 0.5)`;
      g.beginPath();
      g.moveTo(bx + bw, y + bh / 2);
      g.lineTo(jx - 26, jy);
      g.stroke();
    });

    // Fusion node, then the expansion, then the head
    g.strokeStyle = `rgb(${a})`;
    g.lineWidth = 2;
    g.beginPath(); g.arc(jx, jy, 22, 0, Math.PI * 2); g.stroke();
    g.fillStyle = `rgb(${a})`;
    g.font = '18px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    g.fillText('+', jx, jy + 6);
    g.font = '12px "JetBrains Mono", monospace';
    g.beginPath(); g.moveTo(jx + 24, jy); g.lineTo(jx + 68, jy); g.stroke();
    g.strokeRect(jx + 68, jy - 26, 172, 52);
    g.fillText('poly³ → 302,621', jx + 154, jy - 2);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText('dense head · 120 classes', jx + 154, jy + 18);
    g.textAlign = 'left';
  },

  // 17. Cats and Dogs App — frozen base, shippable head
  'cats-dogs-app'(g, a) {
    const x = 110, y = 150, w = 580, h = 150;
    g.font = '13px "JetBrains Mono", monospace';

    // Upload panel
    g.strokeStyle = `rgba(${a}, 0.45)`;
    g.lineWidth = 1.4;
    g.setLineDash([6, 5]);
    g.strokeRect(x, y, 150, h);
    g.setLineDash([]);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillText('upload', x + 46, y + h / 2 + 5);

    // Frozen VGG16 base — hatched, to read as "not trained here"
    const fx = x + 190;
    g.strokeStyle = `rgba(${a}, 0.5)`;
    g.strokeRect(fx, y, 190, h);
    g.save();
    g.beginPath(); g.rect(fx, y, 190, h); g.clip();
    g.strokeStyle = `rgba(${a}, 0.14)`;
    g.lineWidth = 1;
    for (let i = -h; i < 190; i += 12) {
      g.beginPath(); g.moveTo(fx + i, y + h); g.lineTo(fx + i + h, y); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.72)';
    g.fillText('VGG16 · frozen', fx + 40, y + h / 2 - 6);
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.font = '11px "JetBrains Mono", monospace';
    g.fillText('pretrained, never trained', fx + 22, y + h / 2 + 16);

    // The one artefact that actually ships
    const cx2 = fx + 230;
    g.font = '13px "JetBrains Mono", monospace';
    g.strokeStyle = `rgb(${a})`;
    g.lineWidth = 2.2;
    g.fillStyle = `rgba(${a}, 0.16)`;
    g.fillRect(cx2, y + 30, 160, 90);
    g.strokeRect(cx2, y + 30, 160, 90);
    g.fillStyle = `rgb(${a})`;
    g.fillText('logreg head', cx2 + 30, y + 68);
    g.fillText('197 KB', cx2 + 50, y + 92);

    // Connectors
    g.strokeStyle = `rgba(${a}, 0.55)`;
    g.lineWidth = 1.5;
    [[x + 150, fx], [fx + 190, cx2]].forEach(([a1, b1]) => {
      g.beginPath(); g.moveTo(a1 + 6, y + h / 2); g.lineTo(b1 - 6, y + h / 2); g.stroke();
    });
  }
};

function projectPlate(id) {
  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const key = `${id}:${theme}`;
  if (plateCache[key]) return plateCache[key];

  const accent = theme === 'dev' ? '0, 240, 255' : '229, 196, 131';
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  plateBackground(g, accent);
  (plateArt[id] || (() => {}))(g, accent);

  const grad = g.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, 'rgba(11,11,13,0)');
  grad.addColorStop(1, 'rgba(11,11,13,0.88)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  plateCache[key] = c.toDataURL('image/png');
  return plateCache[key];
}

const heroFor = (proj) => proj.hero || (proj.media && proj.media.poster) || projectPlate(proj.id);
const thumbFor = (proj) => proj.heroThumb || (proj.media && proj.media.thumb) || projectPlate(proj.id);

/* One grid, two kinds of project. Gallery-backed archive work opens the
   plate lightbox; built tools open the case-study modal with its live demo. */
function openProjectCard(id) {
  const proj = allProjects.find(p => p.id === id);
  if (!proj) return;
  if (proj.tier === 'portfolio') {
    activeProjectID = id;
    openArchiveProject(id);
    return;
  }
  selectStageProject(id, true);
}

function renderProjectsGrid(filter = 'all') {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const mode = modeKeyFor(theme);
  const live = modeCategoryIds(mode);
  /* A pill that is switched off on this side cannot stay selected. */
  if (filter !== 'all' && !live.has(filter)) filter = 'all';
  currentFilter = filter;

  /* The mode's whole pool. Membership is now the registry's call (D-013); the
     priority lists below still only decide ORDER, never who is in. */
  const pool = modeProjects(mode);

  let filtered = [];
  if (filter === 'all') {
    /* "ALL" means every project this mode carries — never a curated id list.
       A hand-picked list here silently hid projects that had no pill of their
       own (see decisions.md D-009). */
    /* Current professional work leads in both modes: the Vancore
       presentations are the most recent, and the only client-facing
       real-time work on the page. */
    const priority = theme === 'art'
      // Vision: lead with what moves and what reads visually.
      ? ['vancore-205', 'vancore-aljar', 'vancore-verdana', 'vancore-cairowest', 'vancore-miraf', 'pcg-runtime', 'procedural-interiors', 'studio-walkthrough', 'arch-stills', 'opencv-grasshopper', 'comfy-ai', 'zsync', 'ladybug-ue5', 'bim-to-ue', 'dancing-shell', 'house-01', 'annex-villa']
      // Systems: lead with C++, PCG, Geometry Script, AST and pipeline work.
      : ['vancore-205', 'vancore-aljar', 'vancore-verdana', 'vancore-cairowest', 'vancore-miraf', 'pcg-runtime', 'procedural-interiors', 'archviz-automation', 'ue-json', 'cpp-ast', 'gh-mcp', 'spline-uv', 'ladybug-ue5', 'text-to-image-app', 'opencv-grasshopper', 'ml-in-grasshopper', 'generative-surface', 'zsync'];
    const lead = priority.map(id => pool.find(p => p.id === id)).filter(Boolean);
    const rest = pool.filter(p => !priority.includes(p.id));
    filtered = [...lead, ...rest];
  } else {
    /* Every pill maps to exactly one category. 'hybrid' used to also sweep in
       'computational', which is why computational work had no home of its own. */
    filtered = pool.filter(p => p.category === filter);
  }

  /* The lens narrows whatever the category pill produced. A capability that is
     off-mode cannot stay selected, for the same reason a pill cannot (D-013). */
  if (currentCapability) {
    const liveCaps = new Set(liveCapabilities(mode).map(c => c.id));
    if (!liveCaps.has(currentCapability)) {
      currentCapability = null;
      renderCapabilityLens(mode);
    } else {
      filtered = filtered.filter(p => capsOf(p).includes(currentCapability));
    }
  }

  if (!filtered.length) {
    const note = document.createElement('p');
    note.className = 'grid-empty';
    /* Say which of the two filters emptied it, otherwise the lens looks broken. */
    note.textContent = currentCapability
      ? `No ${decodeLabel(capabilityLabel(currentCapability))} work under this category.`
      : 'No projects under this category.';
    grid.appendChild(note);
    return;
  }

  /* The pill just changed the pool, so the chip counts are now stale. */
  renderCapabilityLens(mode);

  /* Say what the filter produced. Without this the visitor changes a control
     and gets no confirmation of what it did. */
  const n = filtered.length;
  const countText = `${n} project${n === 1 ? '' : 's'}`;
  const railCount = document.getElementById('railCount');
  if (railCount) railCount.textContent = `Showing ${countText}`;
  const mobileCount = document.getElementById('railMobileCount');
  if (mobileCount) mobileCount.textContent = countText;

  filtered.forEach(proj => {
    const card = document.createElement('div');
    card.className = `grid-card ${proj.id === activeProjectID ? 'active' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open case study for ${proj.title}`);
    const open = () => openProjectCard(proj.id);
    card.onclick = open;
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    };

    const thumb = document.createElement('div');
    thumb.className = 'card-thumb';
    thumb.style.backgroundImage = `url("${thumbFor(proj)}")`;

    // Media type badge
    let mediaIcon = 'fa-bolt';
    let mediaLabel = 'INTERACTIVE';
    if (proj.media) {
      if (proj.media.type === 'video') { mediaIcon = 'fa-play'; mediaLabel = 'VIDEO'; }
      else if (proj.media.type === 'embed') { mediaIcon = 'fa-play'; mediaLabel = 'VIDEO'; }
      else if (proj.media.type === 'gif') { mediaIcon = 'fa-film'; mediaLabel = 'GIF'; }
      /* `repo` is work whose only artefact is public source — a notebook or an
         app in a GitHub repository. It has no demo panel and no footage, so the
         pill must not inherit the default INTERACTIVE label and promise one. */
      else if (proj.media.type === 'repo') {
        mediaIcon = 'fa-code-branch';
        mediaLabel = proj.media.badge === 'NOTEBOOK' ? 'NOTEBOOK' : 'SOURCE';
      }
      // Plate galleries are not interactive demos — say what they actually are.
      else if (proj.media.type === 'gallery') {
        mediaIcon = 'fa-images';
        mediaLabel = proj.count ? `${proj.count} PLATE${proj.count === 1 ? '' : 'S'}` : 'GALLERY';
      }
    }

    const pill = document.createElement('span');
    pill.className = 'card-media-pill';
    pill.innerHTML = `<i class="fa-solid ${mediaIcon}" aria-hidden="true"></i> ${mediaLabel}`;
    thumb.appendChild(pill);

    const body = document.createElement('div');
    body.className = 'card-body';
    /* `proves` is the claim the work supports — what it says I can do, as
       opposed to what it is. An R&D lead is hired for judgement, and the card
       used to show only the artefact (D-019). Kept structurally apart from
       `proof`, the citation: collapsing those is how D-010 happened. */
    const claim = proj.spine && proj.spine.proves;

    body.innerHTML = `
      <span class="card-badge"></span>
      <h4 class="card-title"></h4>
      <p class="card-desc"></p>
      ${claim ? '<p class="card-proves"></p>' : ''}
      ${capChipsHtml(proj, 'card-caps')}
      <div class="card-footer">
        <span>Open case</span>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </div>
    `;
    body.querySelector('.card-badge').textContent = proj.badge;
    body.querySelector('.card-title').textContent = proj.title;
    body.querySelector('.card-desc').textContent = proj.desc;
    if (claim) body.querySelector('.card-proves').textContent = decodeLabel(claim);

    card.appendChild(thumb);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function selectStageProject(id, openModal = true) {
  const proj = allProjects.find(p => p.id === id);
  if (!proj) return;

  /* Never stage a project the grid will not show. An unlisted or off-mode
     project reaching the stage puts work on the page that a visitor cannot
     find, click through, or filter to — and in ZSync's case, work that was
     deliberately withheld (D-027). Fall back to the first project this mode
     actually carries. */
  const key = modeKeyFor(document.documentElement.getAttribute('data-theme') || 'art');
  if (!isListed(proj) || !modeProjects(key).some(p => p.id === id)) {
    const first = modeProjects(key)[0];
    if (!first || first.id === id) return;
    return selectStageProject(first.id, openModal);
  }

  activeProjectID = id;

  document.getElementById('stageBadge').textContent = proj.badge;
  document.getElementById('stageTitle').textContent = proj.title;
  document.getElementById('stageTech').textContent = proj.tech;
  document.getElementById('stageDesc').textContent = proj.desc;
  
  const stageMedia = document.getElementById('stageMedia');
  if (stageMedia) {
    stageMedia.innerHTML = '';
    // Render dynamic media on stage
    if (proj.media && proj.media.type === 'video' && proj.media.videoClip) {
      stageMedia.style.backgroundImage = 'none';
      const vid = document.createElement('video');
      vid.className = 'stage-media-video';
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.poster = proj.media.poster || '';
      vid.src = proj.media.videoClip;
      stageMedia.appendChild(vid);
    } else if (proj.media && proj.media.type === 'gif' && proj.media.gifUrl) {
      stageMedia.style.backgroundImage = 'none';
      const img = document.createElement('img');
      img.className = 'stage-media-gif';
      img.alt = proj.title;
      /* The 28.6 MB GIF is over the free-host per-file cap and is not deployed
         (see .gitignore). Fall back to the poster rather than showing a broken
         image in production. Remove once it is re-encoded to MP4. */
      img.onerror = () => {
        img.remove();
        stageMedia.style.backgroundImage = `url("${heroFor(proj)}")`;
      };
      img.src = proj.media.gifUrl;
      stageMedia.appendChild(img);
    } else {
      stageMedia.style.backgroundImage = `url("${heroFor(proj)}")`;
    }
  }

  renderProjectsGrid(currentFilter);

  if (openModal) {
    openProofModal(id);
  }
}

/* --- Tier 2 archive: built architecture & computational research ---------- */

function renderArchive(filter = 'all') {
  const grid = document.getElementById('archiveGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const shown = portfolioProjects.filter(isListed);
  const filtered = filter === 'all'
    ? shown
    : shown.filter(p => p.category === filter);

  filtered.forEach(proj => {
    const card = document.createElement('article');
    card.className = 'archive-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open gallery for ${proj.title}`);
    card.onclick = () => openArchiveProject(proj.id);
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArchiveProject(proj.id);
      }
    };

    const img = document.createElement('img');
    img.className = 'archive-img';
    img.src = proj.heroThumb;
    img.alt = `${proj.title} — ${proj.badge.toLowerCase()}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    const meta = document.createElement('div');
    meta.className = 'archive-meta';
    meta.innerHTML = `
      <span class="archive-badge"></span>
      <h4 class="archive-title"></h4>
      <p class="archive-sub"></p>
      <span class="archive-count"></span>
    `;
    meta.querySelector('.archive-badge').textContent = proj.badge;
    meta.querySelector('.archive-title').textContent = proj.title;
    meta.querySelector('.archive-sub').textContent = proj.meta;
    meta.querySelector('.archive-count').textContent =
      `${proj.count} plate${proj.count === 1 ? '' : 's'}`;

    card.appendChild(img);
    card.appendChild(meta);
    grid.appendChild(card);
  });
}

function filterArchive(cat, btnElement) {
  document.querySelectorAll('#archiveFilters .pill').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  if (btnElement) {
    btnElement.classList.add('active');
    btnElement.setAttribute('aria-selected', 'true');
  }
  renderArchive(cat);
}

function filterProjects(cat, btnElement) {
  const btns = document.querySelectorAll('#filterPills .rail-item');
  btns.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  if (btnElement) {
    btnElement.classList.add('active');
    btnElement.setAttribute('aria-selected', 'true');
  }

  renderProjectsGrid(cat);
}

function openCurrentProjectSoul() {
  openProofModal(activeProjectID);
}

/* ==========================================================================
   Interactive Case-Study Demos & Rich Media Panels
   ========================================================================== */

const demoPanels = {
  // 1. ZSync 3D Parallax
  parallax: {
    heading: 'The trade being made',
    note: 'Drag inside the frame. The shell is cheap geometry; the panorama supplies the detail. Parallax comes from the offset between them, which is why the cost stays flat as the interior gets richer.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="simFov">Camera FOV</label>
          <input type="range" min="30" max="110" value="65" id="simFov" oninput="updateZsyncSim()">
          <span id="valFov" class="demo-readout">65°</span>
        </div>
        <div class="demo-slider">
          <label for="simOffset">Shell / panorama offset</label>
          <input type="range" min="1" max="50" value="25" id="simOffset" oninput="updateZsyncSim()">
          <span id="valOffset" class="demo-readout">25</span>
        </div>
        <div class="demo-viewport" id="zsyncVisualBox">
          <i class="fa-solid fa-cube" aria-hidden="true"></i>
          <span>Move cursor across this frame for real-time 3D parallax</span>
        </div>
      </div>`
  },

  // 2. PCG Runtime City
  pcg: {
    heading: 'Real-Time PCG Urban Ecosystem (Blocks, Streets & Trees)',
    note: 'Adjust the procedural parameters below. The PCG solver generates coordinated street road networks, parcel setbacks, 3D architectural massing, and street-side tree canopies / urban park biomes in real-time.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="pcgGrid">Grid Dimensions</label>
          <input type="range" min="4" max="8" value="6" id="pcgGrid" oninput="drawPcgDemoCanvas()">
          <span id="valPcgGrid" class="demo-readout">6x6</span>
        </div>
        <div class="demo-slider">
          <label for="pcgHeight">Max Height Envelope</label>
          <input type="range" min="40" max="180" value="100" id="pcgHeight" oninput="drawPcgDemoCanvas()">
          <span id="valPcgHeight" class="demo-readout">100m</span>
        </div>
        <div class="demo-slider">
          <label for="pcgDensity">Building Block Density</label>
          <input type="range" min="20" max="90" value="60" id="pcgDensity" oninput="drawPcgDemoCanvas()">
          <span id="valPcgDensity" class="demo-readout">60%</span>
        </div>
        <div class="demo-slider">
          <label for="pcgTrees">Tree &amp; Park Density</label>
          <input type="range" min="10" max="95" value="70" id="pcgTrees" oninput="drawPcgDemoCanvas()">
          <span id="valPcgTrees" class="demo-readout">70%</span>
        </div>
        <div class="demo-slider">
          <label for="pcgRoads">Street Network Layout</label>
          <input type="range" min="1" max="3" value="2" id="pcgRoads" oninput="drawPcgDemoCanvas()">
          <span id="valPcgRoads" class="demo-readout">Boulevard</span>
        </div>
        <canvas id="pcgCanvas" class="demo-canvas" height="260"></canvas>
      </div>`
  },

  // 3. Computer Vision & YOLO Spatial Multi-Gesture Lab
  cv: {
    heading: 'YOLO11 Spatial Hand Kinematics & Grasshopper Parametric Twin',
    note: 'Touchless spatial computing bridge: Ultralytics YOLO 21-keypoint hand pose tracks continuous multi-finger kinematics. Caliper pinch scales footprint, clutched wrist roll drives rotary twist dials, V-sign spread modulates subdivisions, and closed fists orbit the 3D viewport at 60 FPS.',
    build: () => `
      <div class="cv-lab-wrap">
        <!-- Mode Selector Buttons -->
        <div class="cv-mode-bar" role="tablist">
          <button class="cv-mode-btn active" id="btnCvDial" onclick="switchCvMode('dial')" role="tab" aria-selected="true">
            <i class="fa-solid fa-arrows-spin" aria-hidden="true"></i> Wrist Dial (Twist)
          </button>
          <button class="cv-mode-btn" id="btnCvScale" onclick="switchCvMode('scale')" role="tab" aria-selected="false">
            <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i> Caliper Pinch (Scale)
          </button>
          <button class="cv-mode-btn" id="btnCvSubdiv" onclick="switchCvMode('subdiv')" role="tab" aria-selected="false">
            <i class="fa-solid fa-grip-lines-vertical" aria-hidden="true"></i> V-Sign (Subdivide)
          </button>
          <button class="cv-mode-btn" id="btnCvOrbit" onclick="switchCvMode('orbit')" role="tab" aria-selected="false">
            <i class="fa-solid fa-cube" aria-hidden="true"></i> Fist (3D Viewport Orbit)
          </button>
        </div>

        <!-- Dynamic Control Row: Active Gesture Slider + Surgical Clutch Toggle -->
        <div class="cv-control-row">
          <div class="demo-slider cv-slider-box" id="cvDynamicSliderContainer">
            <label id="cvDynamicLabel" for="cvDynamicInput">Wrist Roll Rotation Angle (θ)</label>
            <input type="range" min="-180" max="180" value="45" id="cvDynamicInput" oninput="updateCvFromSlider()">
            <span id="cvDynamicVal" class="demo-readout">45.0° (Rotary Dial)</span>
          </div>

          <div class="cv-clutch-box">
            <button class="cv-clutch-btn active" id="btnCvClutch" onclick="toggleCvClutch()" title="Toggle Midas-Touch Clutch">
              <span class="cv-clutch-dot"></span>
              <span id="lblCvClutch">CLUTCH: ENGAGED</span>
            </button>
            <span class="cv-clutch-caption">Midas-touch clutch: Pinch thumb &amp; index (&lt;25mm) to transmit changes</span>
          </div>
        </div>

        <!-- Twin-View Interactive Canvases: Left = Hand Kinematics, Right = Parametric Geometry -->
        <div class="cv-twin-grid">
          <div class="cv-canvas-panel">
            <div class="cv-canvas-header">
              <span class="cv-panel-tag"><i class="fa-solid fa-hand" aria-hidden="true"></i> YOLO11-POSE (21 KEYPOINTS)</span>
              <span class="cv-panel-badge" id="cvHandFps">120 FPS · 4.1ms</span>
            </div>
            <div class="cv-canvas-box">
              <canvas id="cvHandCanvas" class="demo-canvas cv-sub-canvas" height="260"></canvas>
            </div>
            <div class="cv-canvas-caption">Drag inside frame to rotate wrist or adjust pinch aperture directly</div>
          </div>

          <div class="cv-canvas-panel">
            <div class="cv-canvas-header">
              <span class="cv-panel-tag"><i class="fa-solid fa-shapes" aria-hidden="true"></i> GRASSHOPPER PARAMETRIC TWIN</span>
              <span class="cv-panel-badge" id="cvGeomStatus">UDP :8088 · Active</span>
            </div>
            <div class="cv-canvas-box">
              <canvas id="cvGeomCanvas" class="demo-canvas cv-sub-canvas" height="260"></canvas>
            </div>
            <div class="cv-canvas-caption">Real-time 60 FPS tower geometry responding to spatial kinematics</div>
          </div>
        </div>

        <!-- Telemetry HUD Grid -->
        <div class="cv-telemetry-grid">
          <div class="cv-metric-box">
            <span class="cv-metric-val" id="metricCvInference">YOLO11-Pose (4.1 ms)</span>
            <span class="cv-metric-lbl">Inference Latency (TensorRT FP16)</span>
          </div>
          <div class="cv-metric-box">
            <span class="cv-metric-val" id="metricCvGesture">Wrist Roll: +45.0°</span>
            <span class="cv-metric-lbl" id="lblMetricCvGesture">Active Kinematic Modulation</span>
          </div>
          <div class="cv-metric-box">
            <span class="cv-metric-val" id="metricCvFilter">1-Euro (Jitter &lt; 0.04°)</span>
            <span class="cv-metric-lbl">CAD Precision Stabilization</span>
          </div>
          <div class="cv-metric-box">
            <span class="cv-metric-val" id="metricCvTransport">0.6 ms (UDP Socket :8088)</span>
            <span class="cv-metric-lbl">Rhino / Grasshopper IPC Stream</span>
          </div>
        </div>

        <!-- Technical Architecture & Code Pipeline -->
        <details class="cv-code-accordion">
          <summary class="cv-code-summary">
            <i class="fa-solid fa-code" aria-hidden="true"></i> Python YOLO Streamer &amp; RhinoCommon Receiver Pipeline
          </summary>
          <div class="cv-code-body">
            <p class="cv-code-desc">
              Low-latency architecture: Ultralytics YOLO11-Pose runs on GPU with 1-Euro adaptive jitter filtration. Coordinates stream over non-blocking UDP to Rhino 8 / Grasshopper, decoupling 60 FPS viewport camera orbit from parametric geometry re-solving.
            </p>
            <pre class="cv-code-snippet"><code># Python 3 Daemon (YOLO11-Pose -> 1-Euro Filter -> UDP :8088)
from ultralytics import YOLO
import socket, json, math, time

model = YOLO("yolo11n-pose.pt")  # 21 hand keypoints
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
euro = OneEuroFilter(time.time(), 0.0, min_cutoff=1.0, beta=0.007)

for frame in camera.stream():
    res = model(frame, verbose=False)[0]
    if res.keypoints is not None and len(res.keypoints.xy[0]) >= 21:
        kp = res.keypoints.xy[0].cpu().numpy()
        pinch_d = math.hypot(kp[4][0]-kp[8][0], kp[4][1]-kp[8][1])
        clutched = pinch_d &lt; 25.0  # Midas-touch clutch
        raw_angle = math.degrees(math.atan2(kp[9][1]-kp[0][1], kp[9][0]-kp[0][0]))
        smooth_angle = euro.filter(time.time(), raw_angle)
        sock.sendto(json.dumps({"clutch": clutched, "angle": smooth_angle, "pinch": pinch_d}).encode(), ("127.0.0.1", 8088))</code></pre>
          </div>
        </details>
      </div>`
  },

  // 4. Procedural Interiors
  interiors: {
    heading: 'Geometry Script Dynamic Room Apertures',
    note: 'Parametrically cuts doors, windows, and mouldings using native Unreal Engine Geometry Script dynamic meshes.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="roomWidth">Room Width</label>
          <input type="range" min="4" max="12" value="8" id="roomWidth" oninput="drawInteriorsDemoCanvas()">
          <span id="valRoomWidth" class="demo-readout">8m</span>
        </div>
        <div class="demo-slider">
          <label for="windowCount">Aperture Windows</label>
          <input type="range" min="1" max="5" value="3" id="windowCount" oninput="drawInteriorsDemoCanvas()">
          <span id="valWindowCount" class="demo-readout">3 Units</span>
        </div>
        <canvas id="interiorsCanvas" class="demo-canvas" height="200"></canvas>
      </div>`
  },

  // 5. Environmental Ladybug Bridge
  ladybug: {
    heading: 'Solar Radiation Stream to Engine Shaders',
    note: 'Ladybug sun path vectors calculate surface irradiance in real-time, streaming false-color thermal data to Unreal Engine HLSL materials.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="solarHour">Solar Time</label>
          <input type="range" min="6" max="18" value="13" id="solarHour" oninput="drawLadybugDemoCanvas()">
          <span id="valSolarHour" class="demo-readout">13:00 PM</span>
        </div>
        <canvas id="ladybugCanvas" class="demo-canvas" height="200"></canvas>
      </div>`
  },

  // 6. Arc Length UV Parameterisation
  arclength: {
    heading: 'What the t parameter does to a texture',
    note: 'Same curve, same texture, two parameterisations. The upper ribbon steps '
      + 'the UV in the Bezier t parameter, which is what most tools do by default — and t '
      + 'does not advance evenly through a bend, so the stripes crowd exactly where the '
      + 'curvature is highest. The lower one steps in true arc length. The ratio underneath '
      + 'is computed from the curve on screen, so it updates as you drag it.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="uvRepeats">Texture repeats</label>
          <input type="range" min="6" max="40" value="18" id="uvRepeats" oninput="drawSplineComparisonCanvas()">
          <span id="valUvRepeats" class="demo-readout">18</span>
        </div>
        <canvas id="splineCanvas" class="demo-canvas demo-canvas-tall"></canvas>
        <p class="demo-hint">Drag either handle — the ratio is measured off the curve you leave behind.</p>
        <div class="uv-metric" id="uvMetric"></div>
      </div>`
  },

  // 7. Hierarchy Exporter
  hierarchy: {
    heading: 'The world on the left, the schema on the right',
    note: 'Click any node. The artist sees zones and rooms they recognise from the level; '
      + 'the pipeline sees a typed hierarchy it can consume. Keeping those two views of the '
      + 'same object in sync is the entire job — it is what removes the manual re-entry '
      + 'step, because the layout stops being something a person retypes and becomes '
      + 'something the world already knows about itself.',
    build: () => `
      <div class="demo-stack">
        <div class="hier-wrap">
          <div class="hier-pane">
            <div class="hier-head">UE WORLD OUTLINER</div>
            <div class="hier-tree" id="hierTree"></div>
          </div>
          <div class="hier-pane">
            <div class="hier-head">EXPORTED JSON</div>
            <pre class="hier-json" id="hierJson"></pre>
          </div>
        </div>
        <div class="hier-stat" id="hierStat"></div>
      </div>`
  },

  // 8. ArchViz Automation Dataprep
  'archviz-pipeline': {
    heading: 'Dataprep Recipe Automation Flow',
    note: 'Automates geometry decimation, lightmap resolution assignments, collision generation, and master material instantiation from external CSV schedules.',
    build: () => `
      <div class="demo-flow">
        <div class="flow-node bridge"><span>CSV / DataTable</span><small>schedule ingest</small></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node truth"><span>Dataprep Recipe</span><small>rule-based filters</small></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node agent"><span>Engine Level</span><small>60 FPS staged scene</small></div>
      </div>`
  },

  // 9. AI Governance MCP Bridge
  governance: {
    heading: 'Ask for something it will not give you',
    note: 'You are the agent. The sliders are a request, not a command — the massing you '
      + 'see is always what the solver returned, never what was asked for. Push the floors '
      + 'up and the height cap binds; pull the setback in to gain floor plate and the area '
      + 'cap binds instead. The constraints interact, which is exactly why they cannot live '
      + 'in the prompt: an agent that owned them would satisfy one and quietly break the other.',
    build: () => `
      <div class="demo-stack">
        <div class="demo-slider">
          <label for="govFloors">Agent requests floors</label>
          <input type="range" min="1" max="20" value="18" id="govFloors" oninput="drawGovernanceDemo()">
          <span id="valGovFloors" class="demo-readout">18</span>
        </div>
        <div class="demo-slider">
          <label for="govSetback">Agent requests setback</label>
          <input type="range" min="0" max="8" value="1" id="govSetback" oninput="drawGovernanceDemo()">
          <span id="valGovSetback" class="demo-readout">1 m</span>
        </div>
        <canvas id="govCanvas" class="demo-canvas demo-canvas-tall"></canvas>
        <div class="gov-verdict" id="govVerdict"></div>
        <p class="demo-quote">“AI serves the ground truth, it never owns it.”</p>
      </div>`
  },

  // 10. Compiler Loop
  compiler: {
    heading: 'Confident, and wrong, twice',
    note: 'The loop is scripted here, but the failure it shows is the real one: an LLM '
      + 'reports success on code that does not build. Nothing in the model can catch that, '
      + 'because the model is what produced both the code and the confidence. Handing the '
      + 'verdict to cl.exe is what makes the repair loop terminate on a fact instead of on '
      + 'a claim.',
    build: () => `
      <div class="demo-stack">
        <div class="loop-bar">
          <button class="loop-btn" id="loopRun" onclick="runCompilerLoop()">▶ RUN THE LOOP</button>
          <span class="loop-iter" id="loopIter">iteration 0 / 3</span>
          <span class="loop-scripted">scripted illustration · real MSVC diagnostics · not a live compile</span>
        </div>
        <pre class="demo-code loop-code" id="loopCode"><span class="c">// press run — the model will propose an edit to the world exporter</span></pre>
        <div class="loop-verdicts">
          <div class="loop-verdict" id="loopModel"><span class="loop-who">model says</span><span class="loop-what">—</span></div>
          <div class="loop-verdict" id="loopCl"><span class="loop-who">cl.exe says</span><span class="loop-what">—</span></div>
        </div>
      </div>`
  },

  // 11. ComfyUI Diffusion
  diffusion: {
    heading: 'Where it sits in the cycle',
    note: 'Concept exploration moves off the render queue and onto a workflow that answers in seconds, so the slow render is spent on the option that survived.',
    build: () => `
      <div class="demo-flow">
        <div class="flow-node bridge"><span>massing / depth pass</span></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node bridge"><span>ControlNet conditioning</span><small>geometry locked</small></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node truth"><span>concept sheet</span><small>seconds, not hours</small></div>
      </div>`
  },

  // 12. Text-to-Image AI
  text2img: {
    heading: 'Fine-Tuned Prompt Expander Matrix',
    note: 'Architectural input keywords are enriched by distilgpt2 into full conditioning tokens for Stable Diffusion.',
    build: () => `
      <div class="demo-flow">
        <div class="flow-node agent"><span>Raw Concept Intent</span><small>"cantilever concrete villa"</small></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node bridge"><span>distilgpt2 Expander</span><small>token enrichment</small></div>
        <div class="flow-arrow" aria-hidden="true">→</div>
        <div class="flow-node truth"><span>Latent Diffusion</span><small>conditioned generation</small></div>
      </div>`
  }
};

function openProofModal(key) {
  const proj = allProjects.find(p => p.id === key);
  if (!proj) return;

  const modal = document.getElementById('proofModal');
  const modalBody = document.getElementById('modalBody');
  modal.setAttribute('aria-hidden', 'false');

  const panel = demoPanels[proj.demo];

  /* The case-study spine (D-014). Every field is optional and renders nothing
     when absent, so the untagged projects are unaffected until their pass.
     `spine.proves` is the CLAIM and is rendered apart from `proof`, which is the
     CITATION — collapsing the two is exactly how D-010 went wrong. */
  const sp = proj.spine || {};
  const spineRow = (k, v) => v
    ? `<div class="spine-row"><span class="spine-k">${k}</span><p class="spine-v">${v}</p></div>`
    : '';
  const spineBody = spineRow('The problem', sp.problem)
    + spineRow('The constraint', sp.constraint)
    + spineRow('How it works', sp.mechanism)
    + spineRow('The trade', sp.tradeoff);
  const spineHtml = spineBody ? `<div class="spine">${spineBody}</div>` : '';
  /* `spine.mechanism` PROMOTES `detail` rather than joining it — the two say the
     same thing, and rendering both reads as padding. Projects without a spine
     still show `detail` untouched. */
  const provesHtml = sp.proves
    ? `<div class="spine-proves"><span class="spine-k">What this proves</span><p>${sp.proves}</p></div>`
    : '';

  // Media embed section in modal
  let mediaEmbedHtml = '';
  if (proj.media) {
    if (proj.media.type === 'video' && proj.media.videoUrl) {
      mediaEmbedHtml = `
        <div class="modal-media-embed">
          <div class="video-player-wrap">
            <video class="modal-video-player" id="modalVideoPlayer" controls playsinline preload="metadata" poster="${proj.media.poster || ''}">
              <source src="${proj.media.videoUrl}" type="video/mp4">
              Your browser does not support HTML5 video.
            </video>
          </div>
          <p class="modal-media-caption"><i class="fa-solid fa-circle-play" aria-hidden="true"></i> ${proj.media.caption}</p>
        </div>
      `;
    } else if (proj.media.type === 'gif' && proj.media.gifUrl) {
      mediaEmbedHtml = `
        <div class="modal-media-embed">
          <div class="gif-player-wrap" onclick="openLightboxDirect('${proj.media.gifUrl}', '${proj.title} — Live Demo')">
            <img src="${proj.media.gifUrl}" alt="${proj.title}" class="modal-gif-image">
            <div class="gif-zoom-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> Click to enlarge</div>
          </div>
          <p class="modal-media-caption"><i class="fa-solid fa-film" aria-hidden="true"></i> ${proj.media.caption}</p>
        </div>
      `;
    } else if (proj.media.type === 'embed' && proj.media.embedId) {
      // Platform-hosted video. We embed, never rehost (decisions.md D-016):
      // the file keeps serving from the platform, which is what makes using
      // someone else's footage legitimate. nocookie host so a visitor is not
      // tracked by opening a project card.
      mediaEmbedHtml = `
        <div class="modal-media-embed">
          <div class="video-embed-wrap">
            <iframe
              class="modal-video-embed"
              src="https://www.youtube-nocookie.com/embed/${proj.media.embedId}?rel=0&modestbranding=1"
              title="${proj.title}"
              loading="lazy"
              frameborder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>
          <p class="modal-media-caption"><i class="fa-brands fa-youtube" aria-hidden="true"></i> ${proj.media.caption}</p>
          ${proj.media.credit ? `<p class="modal-media-credit">${proj.media.credit}</p>` : ''}
        </div>
      `;
    }
  }

  // Gallery thumbnails if project has gallery
  let galleryStripHtml = '';
  if (proj.gallery && proj.gallery.length > 0) {
    galleryStripHtml = `
      <div class="modal-gallery-section">
        <h4 class="demo-heading">Visual Plates &amp; Renderings (${proj.gallery.length})</h4>
        <div class="gallery-grid" id="modalGalleryGrid"></div>
      </div>
    `;
  }

  // Live link button if present
  let liveLinkHtml = '';
  if (proj.media && proj.media.liveUrl) {
    liveLinkHtml = `
      <a href="${proj.media.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn-live-external">
        <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        <span>${proj.media.liveLabel || 'View Live Verification'}</span>
      </a>
    `;
  }

  modalBody.innerHTML = `
    <span class="modal-badge">${proj.badge}</span>
    <h2 class="modal-title" id="modalTitle">${proj.title}</h2>
    <p class="modal-tech">${proj.tech}</p>
    <p class="modal-desc">${proj.desc}</p>
    ${sp.mechanism ? '' : `<p class="modal-detail">${proj.detail || ''}</p>`}
    ${capChipsHtml(proj, 'modal-caps')}
    ${spineHtml}

    ${mediaEmbedHtml}
    
    ${panel ? `
      <div class="demo-panel">
        <h4 class="demo-heading">${panel.heading}</h4>
        ${panel.build()}
        <p class="demo-note">${panel.note}</p>
      </div>` : ''}

    ${galleryStripHtml}

    ${provesHtml}

    <div class="modal-footer-row">
      <p class="modal-proof"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> <span>${proj.proof || ''}</span></p>
      ${liveLinkHtml}
    </div>
  `;

  // Attach gallery events if present
  if (proj.gallery && proj.gallery.length > 0) {
    const gg = modalBody.querySelector('#modalGalleryGrid');
    lightboxSet = proj.gallery;
    proj.gallery.forEach((img, i) => {
      const fig = document.createElement('button');
      fig.className = 'gallery-cell';
      fig.type = 'button';
      fig.setAttribute('aria-label', `${proj.title}, plate ${i + 1} — enlarge`);
      const el = document.createElement('img');
      el.src = img.thumb;
      el.alt = img.caption || `${proj.title}, plate ${i + 1}`;
      el.loading = 'lazy';
      fig.appendChild(el);
      fig.onclick = () => openLightbox(i);
      gg.appendChild(fig);
    });
  }

  modal.classList.add('active');
  document.body.classList.add('modal-open');

  // Trigger interactive canvas initializations
  if (proj.demo === 'parallax') initZsyncMouseTilt();
  if (proj.demo === 'arclength') drawSplineComparisonCanvas();
  if (proj.demo === 'compiler') renderCompilerStep(0);
  if (proj.demo === 'governance') drawGovernanceDemo();
  if (proj.demo === 'hierarchy') renderHierarchyDemo();
  if (proj.demo === 'pcg') drawPcgDemoCanvas();
  if (proj.demo === 'cv') initCvYoloLab();
  if (proj.demo === 'interiors') drawInteriorsDemoCanvas();
  if (proj.demo === 'ladybug') drawLadybugDemoCanvas();
}

/* --- Archive gallery modal + lightbox ------------------------------------ */

let lightboxSet = [];
let lightboxIdx = 0;

function openArchiveProject(id) {
  const proj = portfolioProjects.find(p => p.id === id);
  if (!proj) return;

  const modal = document.getElementById('proofModal');
  const modalBody = document.getElementById('modalBody');
  modal.setAttribute('aria-hidden', 'false');

  modalBody.innerHTML = `
    <span class="modal-badge">${proj.badge}</span>
    <h2 class="modal-title" id="modalTitle">${proj.title}</h2>
    <p class="modal-tech">${proj.tech}</p>
    <p class="modal-meta-line">${proj.meta}</p>
    <p class="modal-desc">${proj.desc}</p>
    <p class="modal-detail">${proj.detail || ''}</p>
    ${capChipsHtml(proj, 'modal-caps')}
    <div class="gallery-grid" id="galleryGrid"></div>
  `;

  const gg = modalBody.querySelector('#galleryGrid');
  lightboxSet = proj.gallery;
  proj.gallery.forEach((img, i) => {
    const fig = document.createElement('button');
    fig.className = 'gallery-cell';
    fig.type = 'button';
    fig.setAttribute('aria-label', `${proj.title}, plate ${i + 1} of ${proj.gallery.length} — enlarge`);
    const el = document.createElement('img');
    el.src = img.thumb;
    el.alt = `${proj.title}, plate ${i + 1}`;
    el.loading = 'lazy';
    el.decoding = 'async';
    fig.appendChild(el);
    fig.onclick = () => openLightbox(i);
    gg.appendChild(fig);
  });

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function openLightbox(idx) {
  lightboxIdx = idx;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const vid = document.getElementById('lightboxVideo');
  const captionEl = document.getElementById('lightboxCaption');
  const countEl = document.getElementById('lightboxCount');
  
  if (!lb || !lightboxSet.length) return;

  const item = lightboxSet[idx];
  
  if (item.videoUrl) {
    if (img) img.style.display = 'none';
    if (vid) {
      vid.style.display = 'block';
      vid.src = item.videoUrl;
      vid.play().catch(() => {});
    }
  } else {
    if (vid) {
      vid.pause();
      vid.style.display = 'none';
    }
    if (img) {
      img.style.display = 'block';
      img.src = item.display || item;
    }
  }

  if (captionEl) captionEl.textContent = item.caption || '';
  if (countEl) countEl.textContent = `${idx + 1} / ${lightboxSet.length}`;

  lb.classList.add('active');
  lb.setAttribute('aria-hidden', 'false');
  document.getElementById('lightboxClose').focus();
}

function openLightboxDirect(src, caption = '') {
  lightboxSet = [{ display: src, caption: caption }];
  openLightbox(0);
}

function stepLightbox(delta) {
  if (!lightboxSet.length) return;
  openLightbox((lightboxIdx + delta + lightboxSet.length) % lightboxSet.length);
}

function closeLightbox(event) {
  if (event && event.target !== event.currentTarget && !event.target.classList.contains('lightbox-close')) return;
  const lb = document.getElementById('lightbox');
  const vid = document.getElementById('lightboxVideo');
  if (vid) vid.pause();
  if (!lb) return;
  lb.classList.remove('active');
  lb.setAttribute('aria-hidden', 'true');
}

function initZsyncMouseTilt() {
  const box = document.getElementById('zsyncVisualBox');
  if (!box) return;

  box.addEventListener('mousemove', (e) => {
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const fovEl = document.getElementById('simFov');
    const offEl = document.getElementById('simOffset');
    const fov = fovEl ? Number(fovEl.value) : 65;
    const off = offEl ? Number(offEl.value) : 25;

    const k = 0.06 + off / 500;
    box.style.transform =
      `perspective(${fov * 5}px) rotateY(${x * k}deg) rotateX(${-y * k}deg)`;
  });

  box.addEventListener('mouseleave', () => {
    box.style.transform = 'perspective(300px) rotateY(0deg) rotateX(0deg)';
  });
}

function updateZsyncSim() {
  const fov = document.getElementById('simFov');
  const offset = document.getElementById('simOffset');
  if (fov) document.getElementById('valFov').textContent = fov.value + '°';
  if (offset) document.getElementById('valOffset').textContent = offset.value;
}

/* PCG Interactive Canvas Solver — Combined Blocks, Streets, and Trees */
function drawPcgDemoCanvas() {
  const canvas = document.getElementById('pcgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const gridEl = document.getElementById('pcgGrid');
  const heightEl = document.getElementById('pcgHeight');
  const densityEl = document.getElementById('pcgDensity');
  const treesEl = document.getElementById('pcgTrees');
  const roadsEl = document.getElementById('pcgRoads');

  const gridN = gridEl ? Number(gridEl.value) : 6;
  const maxH = heightEl ? Number(heightEl.value) : 100;
  const buildingDensity = densityEl ? Number(densityEl.value) / 100 : 0.60;
  const treeDensity = treesEl ? Number(treesEl.value) / 100 : 0.70;
  const roadLayout = roadsEl ? Number(roadsEl.value) : 2;

  const roadLabels = ['Alley Grid', 'Boulevard', 'Avenue & Plaza'];
  if (document.getElementById('valPcgGrid')) document.getElementById('valPcgGrid').textContent = `${gridN}x${gridN}`;
  if (document.getElementById('valPcgHeight')) document.getElementById('valPcgHeight').textContent = `${maxH}m`;
  if (document.getElementById('valPcgDensity')) document.getElementById('valPcgDensity').textContent = `${Math.round(buildingDensity * 100)}%`;
  if (document.getElementById('valPcgTrees')) document.getElementById('valPcgTrees').textContent = `${Math.round(treeDensity * 100)}%`;
  if (document.getElementById('valPcgRoads')) document.getElementById('valPcgRoads').textContent = roadLabels[roadLayout - 1] || 'Boulevard';

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(rect.width || 420);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2;
  const cy = size * 0.56;
  const tileW = Math.min(30, (size * 0.74) / (gridN * 2));
  const tileH = tileW * 0.52;

  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const rgb = theme === 'dev' ? '0, 240, 255' : '229, 196, 131';

  ctx.clearRect(0, 0, size, size);

  // Helper: Draw 3D Isometric Tree
  function drawIsoTree(x, y, scale = 1.0) {
    const trunkH = 8 * scale;
    const crownR = 7 * scale;

    // Tree Trunk
    ctx.strokeStyle = '#6D4C41';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - trunkH);
    ctx.stroke();

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foliage Canopy Layer 1 (Dark Green)
    ctx.fillStyle = '#27AE60';
    ctx.beginPath();
    ctx.arc(x, y - trunkH - crownR * 0.4, crownR, 0, Math.PI * 2);
    ctx.fill();

    // Foliage Canopy Layer 2 (Lush Highlight Green)
    ctx.fillStyle = '#2ECC71';
    ctx.beginPath();
    ctx.arc(x - crownR * 0.25, y - trunkH - crownR * 0.7, crownR * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Foliage Outline
    ctx.strokeStyle = 'rgba(15, 60, 30, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y - trunkH - crownR * 0.4, crownR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pre-calculate grid cell types
  const roadInterval = roadLayout === 1 ? 2 : roadLayout === 2 ? 3 : 4;
  const cells = [];

  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      const isRoad = (r % roadInterval === 0 || c % roadInterval === 0);
      const hash = Math.sin(c * 17.13 + r * 91.57) * 43758.5453;
      const seed = hash - Math.floor(hash);
      const isBuilding = !isRoad && (seed < buildingDensity);
      const isPark = !isRoad && !isBuilding;
      const height = isBuilding ? (0.35 + seed * 0.65) * (maxH * 0.95) : 0;

      cells.push({
        r, c,
        isRoad,
        isBuilding,
        isPark,
        height,
        seed,
        depth: r + c
      });
    }
  }

  // Sort by depth (back to front) for flawless isometric occlusion
  cells.sort((a, b) => a.depth - b.depth || a.r - b.r);

  // Render ground base & roads first
  cells.forEach(cell => {
    const { r, c, isRoad, isBuilding, isPark, height, seed } = cell;
    const isoX = cx + (c - r) * tileW;
    const isoY = cy + (c + r) * tileH - (gridN * tileH * 0.5);

    if (isRoad) {
      // Asphalt Road Surface
      ctx.fillStyle = '#2A2D34';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY);
      ctx.lineTo(isoX + tileW, isoY + tileH);
      ctx.lineTo(isoX, isoY + tileH * 2);
      ctx.lineTo(isoX - tileW, isoY + tileH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Road Center Markings
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      if (r % roadInterval === 0) {
        ctx.moveTo(isoX - tileW * 0.6, isoY + tileH * 0.7);
        ctx.lineTo(isoX + tileW * 0.6, isoY + tileH * 1.3);
      } else {
        ctx.moveTo(isoX + tileW * 0.6, isoY + tileH * 0.7);
        ctx.lineTo(isoX - tileW * 0.6, isoY + tileH * 1.3);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Street-side Trees along sidewalk
      if (seed < treeDensity) {
        drawIsoTree(isoX + (seed > 0.5 ? tileW * 0.5 : -tileW * 0.5), isoY + tileH * 0.85, 0.75);
      }
    } else if (isPark) {
      // Lush Green Park Parcel
      ctx.fillStyle = 'rgba(34, 112, 60, 0.85)';
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY);
      ctx.lineTo(isoX + tileW, isoY + tileH);
      ctx.lineTo(isoX, isoY + tileH * 2);
      ctx.lineTo(isoX - tileW, isoY + tileH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plaza Pathway
      ctx.fillStyle = 'rgba(200, 180, 150, 0.25)';
      ctx.beginPath();
      ctx.arc(isoX, isoY + tileH, tileW * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Park Tree Clusters
      drawIsoTree(isoX, isoY + tileH * 0.65, 0.95);
      if (seed > 0.35) {
        drawIsoTree(isoX - tileW * 0.35, isoY + tileH * 1.1, 0.75);
      }
      if (seed > 0.65) {
        drawIsoTree(isoX + tileW * 0.35, isoY + tileH * 1.1, 0.8);
      }
    } else if (isBuilding) {
      // Plot Foundation / Sidewalk Setback
      ctx.fillStyle = '#1A1C23';
      ctx.strokeStyle = `rgba(${rgb}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY);
      ctx.lineTo(isoX + tileW, isoY + tileH);
      ctx.lineTo(isoX, isoY + tileH * 2);
      ctx.lineTo(isoX - tileW, isoY + tileH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Extruded 3D Architectural Tower
      const bW = tileW * 0.82;
      const bH = tileH * 0.82;
      const bh = height;

      // Right Facade Wall
      ctx.fillStyle = `rgba(${rgb}, 0.18)`;
      ctx.strokeStyle = `rgb(${rgb})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + tileH - bh);
      ctx.lineTo(isoX + bW, isoY + tileH - bh + bH);
      ctx.lineTo(isoX + bW, isoY + tileH + bH);
      ctx.lineTo(isoX, isoY + tileH * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left Facade Wall
      ctx.fillStyle = `rgba(${rgb}, 0.32)`;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + tileH - bh);
      ctx.lineTo(isoX - bW, isoY + tileH - bh + bH);
      ctx.lineTo(isoX - bW, isoY + tileH + bH);
      ctx.lineTo(isoX, isoY + tileH * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Horizontal Floor Bands
      const floors = Math.floor(bh / 14);
      ctx.strokeStyle = `rgba(${rgb}, 0.45)`;
      ctx.lineWidth = 0.8;
      for (let f = 1; f < floors; f++) {
        const fy = (isoY + tileH * 2) - f * 14;
        ctx.beginPath();
        ctx.moveTo(isoX, fy);
        ctx.lineTo(isoX + bW, fy - bH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(isoX, fy);
        ctx.lineTo(isoX - bW, fy - bH);
        ctx.stroke();
      }

      // Roof Surface
      ctx.fillStyle = `rgba(${rgb}, 0.65)`;
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + tileH - bh);
      ctx.lineTo(isoX + bW, isoY + tileH - bh + bH);
      ctx.lineTo(isoX, isoY + tileH - bh + bH * 2);
      ctx.lineTo(isoX - bW, isoY + tileH - bh + bH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rooftop Penthouse / Mechanical Box
      if (bh > 50) {
        const rh = 8;
        const rw = bW * 0.4;
        const rhh = bH * 0.4;
        const rx = isoX;
        const ry = isoY + tileH - bh + bH - 4;

        ctx.fillStyle = `rgb(${rgb})`;
        ctx.fillRect(rx - rw/2, ry - rh, rw, rh);
      }

      // Corner Sidewalk Tree at Building Entrance
      if (seed < treeDensity * 0.6) {
        drawIsoTree(isoX - tileW * 0.7, isoY + tileH * 1.5, 0.65);
      }
    }
  });

  // Legend at bottom
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('⚡ PCG Runtime Spawner: 3D Blocks, Street Network & Tree Biomes', 24, size - 14);
}

/* ==========================================================================
   Computer Vision & YOLO11 Spatial Multi-Gesture Lab Logic
   ========================================================================== */

let cvLabAnimFrame = null;
let cvMode = 'dial'; // 'dial', 'scale', 'subdiv', 'orbit'
let cvClutched = true;
let cvWristAngle = 45; // -180 to 180 deg
let cvPinchDist = 55; // 15 to 95 mm
let cvSubdivisions = 14; // 4 to 24 floors
let cvOrbitAngle = 35; // 0 to 360 deg
let cvDraggingHand = false;
let cvDraggingGeom = false;
let cvDragStartX = 0;
let cvDragStartY = 0;

function switchCvMode(mode) {
  cvMode = mode;
  ['btnCvDial', 'btnCvScale', 'btnCvSubdiv', 'btnCvOrbit'].forEach(id => {
    const b = document.getElementById(id);
    if (b) {
      const active = (id === 'btnCvDial' && mode === 'dial') ||
                     (id === 'btnCvScale' && mode === 'scale') ||
                     (id === 'btnCvSubdiv' && mode === 'subdiv') ||
                     (id === 'btnCvOrbit' && mode === 'orbit');
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    }
  });

  const slider = document.getElementById('cvDynamicInput');
  const label = document.getElementById('cvDynamicLabel');
  if (slider && label) {
    if (mode === 'dial') {
      label.textContent = 'Wrist Roll Rotation Angle (θ)';
      slider.min = '-180'; slider.max = '180'; slider.step = '1';
      slider.value = String(Math.round(cvWristAngle));
    } else if (mode === 'scale') {
      label.textContent = 'Caliper Pinch Aperture (Thumb-to-Index mm)';
      slider.min = '15'; slider.max = '95'; slider.step = '1';
      slider.value = String(Math.round(cvPinchDist));
    } else if (mode === 'subdiv') {
      label.textContent = 'V-Sign Scissors Aperture (Floor Count)';
      slider.min = '4'; slider.max = '24'; slider.step = '1';
      slider.value = String(cvSubdivisions);
    } else if (mode === 'orbit') {
      label.textContent = 'Rhino Viewport Camera Azimuth (Orbit)';
      slider.min = '0'; slider.max = '360'; slider.step = '1';
      slider.value = String(Math.round(cvOrbitAngle));
    }
  }

  updateCvFromSlider();
}

function toggleCvClutch() {
  cvClutched = !cvClutched;
  const btn = document.getElementById('btnCvClutch');
  const lbl = document.getElementById('lblCvClutch');
  if (btn) btn.classList.toggle('active', cvClutched);
  if (lbl) lbl.textContent = cvClutched ? 'CLUTCH: ENGAGED' : 'CLUTCH: DISENGAGED (LOCKED)';
  updateCvTelemetry();
}

function updateCvFromSlider() {
  const slider = document.getElementById('cvDynamicInput');
  if (!slider) return;
  const val = Number(slider.value);

  if (cvMode === 'dial') cvWristAngle = val;
  else if (cvMode === 'scale') cvPinchDist = val;
  else if (cvMode === 'subdiv') cvSubdivisions = val;
  else if (cvMode === 'orbit') cvOrbitAngle = val;

  const readout = document.getElementById('cvDynamicVal');
  if (readout) {
    if (cvMode === 'dial') readout.textContent = `${cvWristAngle >= 0 ? '+' : ''}${cvWristAngle.toFixed(1)}° (Rotary Dial)`;
    else if (cvMode === 'scale') readout.textContent = `${Math.round(cvPinchDist)}mm (${(0.45 + (cvPinchDist / 60) * 0.75).toFixed(2)}x Scale)`;
    else if (cvMode === 'subdiv') readout.textContent = `${cvSubdivisions} Floors (Subdivisions)`;
    else if (cvMode === 'orbit') readout.textContent = `${cvOrbitAngle.toFixed(1)}° Viewport Azimuth`;
  }

  updateCvTelemetry();
}

function updateCvTelemetry() {
  const metricGest = document.getElementById('metricCvGesture');
  const lblGest = document.getElementById('lblMetricCvGesture');
  const statusEl = document.getElementById('cvGeomStatus');

  if (metricGest) {
    if (cvMode === 'dial') metricGest.textContent = `Wrist Roll: ${cvWristAngle >= 0 ? '+' : ''}${cvWristAngle.toFixed(1)}°`;
    else if (cvMode === 'scale') metricGest.textContent = `Pinch Scale: ${(0.45 + (cvPinchDist / 60) * 0.75).toFixed(2)}x (${Math.round(cvPinchDist)}mm)`;
    else if (cvMode === 'subdiv') metricGest.textContent = `Subdivisions: ${cvSubdivisions} Bays`;
    else if (cvMode === 'orbit') metricGest.textContent = `Viewport Orbit: ${cvOrbitAngle.toFixed(1)}°`;
  }

  if (lblGest) {
    lblGest.textContent = cvClutched ? 'Active Kinematic Modulation (Transmitting)' : 'Spatial Pose Held (Clutch Disengaged)';
  }

  if (statusEl) {
    statusEl.textContent = cvClutched ? 'UDP :8088 · Streaming' : 'UDP :8088 · Latched';
  }
}

function initCvYoloLab() {
  cvMode = 'dial';
  cvClutched = true;
  cvWristAngle = 45;
  cvPinchDist = 55;
  cvSubdivisions = 14;
  cvOrbitAngle = 35;

  const handCanvas = document.getElementById('cvHandCanvas');
  const geomCanvas = document.getElementById('cvGeomCanvas');

  // Interactive mouse/touch dragging on Hand Canvas
  if (handCanvas) {
    handCanvas.onmousedown = (e) => {
      cvDraggingHand = true;
      cvDragStartX = e.clientX;
      cvDragStartY = e.clientY;
    };
    handCanvas.ontouchstart = (e) => {
      if (e.touches[0]) {
        cvDraggingHand = true;
        cvDragStartX = e.touches[0].clientX;
        cvDragStartY = e.touches[0].clientY;
      }
    };
  }

  // Interactive mouse/touch dragging on Geom Canvas (Orbit)
  if (geomCanvas) {
    geomCanvas.onmousedown = (e) => {
      cvDraggingGeom = true;
      cvDragStartX = e.clientX;
      cvDragStartY = e.clientY;
    };
    geomCanvas.ontouchstart = (e) => {
      if (e.touches[0]) {
        cvDraggingGeom = true;
        cvDragStartX = e.touches[0].clientX;
        cvDragStartY = e.touches[0].clientY;
      }
    };
  }

  window.addEventListener('mouseup', () => { cvDraggingHand = false; cvDraggingGeom = false; });
  window.addEventListener('touchend', () => { cvDraggingHand = false; cvDraggingGeom = false; });

  window.addEventListener('mousemove', (e) => {
    if (cvDraggingHand) {
      const dx = e.clientX - cvDragStartX;
      const dy = e.clientY - cvDragStartY;
      cvDragStartX = e.clientX;
      cvDragStartY = e.clientY;
      if (cvMode === 'dial') {
        cvWristAngle = Math.max(-180, Math.min(180, cvWristAngle + dx * 0.7));
      } else if (cvMode === 'scale') {
        cvPinchDist = Math.max(15, Math.min(95, cvPinchDist - dy * 0.5));
      } else if (cvMode === 'subdiv') {
        cvSubdivisions = Math.max(4, Math.min(24, Math.round(cvSubdivisions + dx * 0.08)));
      } else if (cvMode === 'orbit') {
        cvOrbitAngle = (cvOrbitAngle + dx * 0.6 + 360) % 360;
      }
      syncCvSliders();
    } else if (cvDraggingGeom) {
      const dx = e.clientX - cvDragStartX;
      cvDragStartX = e.clientX;
      cvOrbitAngle = (cvOrbitAngle + dx * 0.6 + 360) % 360;
      syncCvSliders();
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    if (cvDraggingHand) {
      const dx = e.touches[0].clientX - cvDragStartX;
      const dy = e.touches[0].clientY - cvDragStartY;
      cvDragStartX = e.touches[0].clientX;
      cvDragStartY = e.touches[0].clientY;
      if (cvMode === 'dial') cvWristAngle = Math.max(-180, Math.min(180, cvWristAngle + dx * 0.7));
      else if (cvMode === 'scale') cvPinchDist = Math.max(15, Math.min(95, cvPinchDist - dy * 0.5));
      else if (cvMode === 'subdiv') cvSubdivisions = Math.max(4, Math.min(24, Math.round(cvSubdivisions + dx * 0.08)));
      else if (cvMode === 'orbit') cvOrbitAngle = (cvOrbitAngle + dx * 0.6 + 360) % 360;
      syncCvSliders();
    } else if (cvDraggingGeom) {
      const dx = e.touches[0].clientX - cvDragStartX;
      cvDragStartX = e.touches[0].clientX;
      cvOrbitAngle = (cvOrbitAngle + dx * 0.6 + 360) % 360;
      syncCvSliders();
    }
  }, { passive: true });

  switchCvMode('dial');
  runCvAnimationLoop();
}

function syncCvSliders() {
  const slider = document.getElementById('cvDynamicInput');
  if (slider) {
    if (cvMode === 'dial') slider.value = String(Math.round(cvWristAngle));
    else if (cvMode === 'scale') slider.value = String(Math.round(cvPinchDist));
    else if (cvMode === 'subdiv') slider.value = String(cvSubdivisions);
    else if (cvMode === 'orbit') slider.value = String(Math.round(cvOrbitAngle));
  }
  const readout = document.getElementById('cvDynamicVal');
  if (readout) {
    if (cvMode === 'dial') readout.textContent = `${cvWristAngle >= 0 ? '+' : ''}${cvWristAngle.toFixed(1)}° (Rotary Dial)`;
    else if (cvMode === 'scale') readout.textContent = `${Math.round(cvPinchDist)}mm (${(0.45 + (cvPinchDist / 60) * 0.75).toFixed(2)}x Scale)`;
    else if (cvMode === 'subdiv') readout.textContent = `${cvSubdivisions} Floors (Subdivisions)`;
    else if (cvMode === 'orbit') readout.textContent = `${cvOrbitAngle.toFixed(1)}° Viewport Azimuth`;
  }
  updateCvTelemetry();
}

function runCvAnimationLoop() {
  if (cvLabAnimFrame) cancelAnimationFrame(cvLabAnimFrame);

  function loop() {
    const handCanvas = document.getElementById('cvHandCanvas');
    const geomCanvas = document.getElementById('cvGeomCanvas');
    if (!handCanvas || !geomCanvas || handCanvas.offsetParent === null) {
      cvLabAnimFrame = null;
      return;
    }

    drawCvHandFrame(handCanvas);
    drawCvGeomFrame(geomCanvas);

    cvLabAnimFrame = requestAnimationFrame(loop);
  }

  cvLabAnimFrame = requestAnimationFrame(loop);
}

// 21 Keypoints Hand Skeleton Renderer
function drawCvHandFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = Math.round(rect.width || 360);
  const H = 260;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = '#0B0B0D';
  ctx.fillRect(0, 0, W, H);

  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const rgb = theme === 'dev' ? '0, 240, 255' : '229, 196, 131';

  const cx = W / 2;
  const cy = H - 55;

  // Base rotation angle of wrist
  const rotRad = (cvWristAngle * Math.PI) / 180 - Math.PI / 2;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  // Clutch halo around wrist/palm
  ctx.save();
  ctx.lineWidth = 2;
  if (cvClutched) {
    ctx.strokeStyle = '#F59E0B'; // Amber
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.setLineDash([4, 4]);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
  ctx.restore();

  // Draw Rotary Dial circular gauge in dial mode
  if (cvMode === 'dial') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 85, 0, Math.PI * 2);
    ctx.stroke();

    // Active angle arc
    ctx.strokeStyle = `rgba(${rgb}, 0.8)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    ctx.arc(cx, cy, 85, startAngle, rotRad, cvWristAngle < 0);
    ctx.stroke();

    // Radial needle
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cosR * 92, cy + sinR * 92);
    ctx.stroke();
  }

  // Generate 21 2D Keypoints based on mode & angles
  const kp = [];
  const trans = (x, y) => ({
    x: cx + x * Math.cos(rotRad + Math.PI / 2) - y * Math.sin(rotRad + Math.PI / 2),
    y: cy + x * Math.sin(rotRad + Math.PI / 2) + y * Math.cos(rotRad + Math.PI / 2)
  });

  // 0: Wrist
  kp[0] = { x: cx, y: cy };

  const pinchOffset = (cvPinchDist - 55) * 0.45; // mm to px delta
  const isFist = cvMode === 'orbit';
  const isV = cvMode === 'subdiv';
  const vSpread = isV ? (cvSubdivisions / 24) * 22 : 8;

  // Thumb: 1, 2, 3, 4
  kp[1] = trans(-18, -26);
  kp[2] = trans(-32, -48);
  kp[3] = trans(-38 + (isFist ? 18 : pinchOffset * 0.3), -68 + (isFist ? 22 : 0));
  kp[4] = trans(-22 + (isFist ? 14 : pinchOffset), -88 + (isFist ? 38 : 0)); // Thumb Tip

  // Index: 5, 6, 7, 8
  kp[5] = trans(-12, -60);
  kp[6] = trans(-15 - (isV ? vSpread * 0.4 : 0), -84 + (isFist ? 20 : 0));
  kp[7] = trans(-18 - (isV ? vSpread * 0.7 : 0), -106 + (isFist ? 36 : 0));
  kp[8] = trans(-18 - (isV ? vSpread : -pinchOffset * 0.3), -126 + (isFist ? 52 : 0)); // Index Tip

  // Middle: 9, 10, 11, 12
  kp[9] = trans(0, -64);
  kp[10] = trans(2 + (isV ? vSpread * 0.4 : 0), -90 + (isFist ? 22 : 0));
  kp[11] = trans(4 + (isV ? vSpread * 0.7 : 0), -115 + (isFist ? 42 : 0));
  kp[12] = trans(6 + (isV ? vSpread : 0), -136 + (isFist ? 58 : 0)); // Middle Tip

  // Ring: 13, 14, 15, 16
  kp[13] = trans(12, -58);
  kp[14] = trans(16, -82 + (isFist || isV ? 24 : 0));
  kp[15] = trans(18, -102 + (isFist || isV ? 42 : 0));
  kp[16] = trans(20, -120 + (isFist || isV ? 56 : 0)); // Ring Tip

  // Pinky: 17, 18, 19, 20
  kp[17] = trans(22, -50);
  kp[18] = trans(28, -70 + (isFist || isV ? 22 : 0));
  kp[19] = trans(32, -86 + (isFist || isV ? 38 : 0));
  kp[20] = trans(34, -102 + (isFist || isV ? 50 : 0)); // Pinky Tip

  // Bone linkages (20 segments)
  const bones = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16],// Ring
    [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [5, 9], [9, 13], [13, 17]              // Knuckle Bridge
  ];

  // Draw bones
  ctx.strokeStyle = `rgba(${rgb}, 0.65)`;
  ctx.lineWidth = 2.2;
  bones.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(kp[a].x, kp[a].y);
    ctx.lineTo(kp[b].x, kp[b].y);
    ctx.stroke();
  });

  // Draw keypoints (21 joints)
  kp.forEach((pt, i) => {
    ctx.fillStyle = (i === 4 || i === 8 || i === 12) ? '#F59E0B' : `rgb(${rgb})`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (i === 4 || i === 8 || i === 0) ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0B0B0D';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Caliper Dimension Callout in 'scale' mode
  if (cvMode === 'scale') {
    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(kp[4].x, kp[4].y);
    ctx.lineTo(kp[8].x, kp[8].y);
    ctx.stroke();

    const mx = (kp[4].x + kp[8].x) / 2;
    const my = (kp[4].y + kp[8].y) / 2;
    ctx.fillStyle = 'rgba(11, 11, 13, 0.85)';
    ctx.fillRect(mx - 32, my - 12, 64, 20);
    ctx.strokeStyle = '#F59E0B';
    ctx.setLineDash([]);
    ctx.strokeRect(mx - 32, my - 12, 64, 20);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(cvPinchDist)} mm`, mx, my + 2);
    ctx.restore();
  }

  // V-Sign Scissors Angle Arc in 'subdiv' mode
  if (cvMode === 'subdiv') {
    ctx.save();
    ctx.strokeStyle = '#10B981'; // Emerald
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(kp[9].x, kp[9].y, 36, Math.atan2(kp[8].y - kp[5].y, kp[8].x - kp[5].x), Math.atan2(kp[12].y - kp[9].y, kp[12].x - kp[9].x));
    ctx.stroke();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10B981';
    ctx.textAlign = 'center';
    ctx.fillText(`${cvSubdivisions} BAYS`, kp[9].x, kp[9].y - 44);
    ctx.restore();
  }

  // Status caption inside canvas
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = cvClutched ? '#F59E0B' : 'rgba(0, 240, 255, 0.6)';
  ctx.textAlign = 'left';
  ctx.fillText(cvClutched ? '● CLUTCH: ENGAGED' : '○ CLUTCH: DISENGAGED (LOCKED)', 14, 22);
}

// 3D Parametric Skyscraper & Kinetic Facade Twin Renderer
function drawCvGeomFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = Math.round(rect.width || 360);
  const H = 260;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = '#07080A';
  ctx.fillRect(0, 0, W, H);

  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const rgb = theme === 'dev' ? '0, 240, 255' : '229, 196, 131';

  const cx = W / 2;
  const cy = H - 32;
  const towerH = 175;

  // Orbit angle (continuous or interactive)
  const orbitRad = (cvOrbitAngle * Math.PI) / 180;

  // Scale factor from caliper pinch
  const scaleFactor = cvClutched ? (0.45 + (cvPinchDist / 60) * 0.75) : 1.0;
  const baseR = 56 * scaleFactor;

  // Number of floors from V-sign subdivisions
  const floors = cvSubdivisions;

  // Twist angle from wrist rotary dial
  const twistRad = (cvClutched ? cvWristAngle : 45) * (Math.PI / 180);

  // Ground perspective grid rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let gr = 40; gr <= 120; gr += 35) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, gr * scaleFactor, gr * 0.32 * scaleFactor, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pre-calculate floor slab polygons
  const slabs = [];
  for (let i = 0; i <= floors; i++) {
    const u = i / floors;
    const fy = cy - u * towerH;
    const r = baseR * (1.0 - 0.38 * u);
    const theta = orbitRad + u * twistRad;

    // 6-sided faceted polygon
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const a = theta + (k * Math.PI) / 3;
      const vx = cx + Math.cos(a) * r;
      const vy = fy + Math.sin(a) * r * 0.42;
      pts.push({ x: vx, y: vy });
    }
    slabs.push({ y: fy, pts, r, u, theta });
  }

  // Draw vertical corner columns between slabs
  ctx.strokeStyle = `rgba(${rgb}, 0.28)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < floors; i++) {
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(slabs[i].pts[k].x, slabs[i].pts[k].y);
      ctx.lineTo(slabs[i + 1].pts[k].x, slabs[i + 1].pts[k].y);
      ctx.stroke();
    }
  }

  // Draw floor slabs with depth shading
  slabs.forEach((slab, i) => {
    ctx.fillStyle = `rgba(18, 22, 32, ${0.4 + slab.u * 0.4})`;
    ctx.strokeStyle = (i === 0 || i === floors) ? `rgba(${rgb}, 0.95)` : `rgba(${rgb}, 0.55)`;
    ctx.lineWidth = (i === 0 || i === floors) ? 1.8 : 1.1;

    ctx.beginPath();
    ctx.moveTo(slab.pts[0].x, slab.pts[0].y);
    for (let k = 1; k < 6; k++) ctx.lineTo(slab.pts[k].x, slab.pts[k].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kinetic Louvres rotating on alternating floors
    if (i % 2 === 0) {
      ctx.strokeStyle = '#D35400'; // Terracotta louvre fin
      ctx.lineWidth = 1.3;
      const louvreRad = slab.theta + (cvWristAngle * 0.4 * Math.PI) / 180;
      for (let k = 0; k < 6; k++) {
        const lx = slab.pts[k].x + Math.cos(louvreRad) * 8;
        const ly = slab.pts[k].y + Math.sin(louvreRad) * 4;
        ctx.beginPath();
        ctx.moveTo(slab.pts[k].x, slab.pts[k].y);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }
  });

  // Top Spire
  const top = slabs[floors];
  ctx.strokeStyle = `rgb(${rgb})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, top.y);
  ctx.lineTo(cx, top.y - 28);
  ctx.stroke();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(cx, top.y - 28, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Telemetry stamp
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'left';
  ctx.fillText(`GH SOLVER: ${floors} FLOORS | TWIST: ${cvWristAngle.toFixed(1)}° | SCALE: ${scaleFactor.toFixed(2)}x`, 14, 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = cvClutched ? '#10B981' : '#F59E0B';
  ctx.fillText(cvClutched ? 'UDP :8088 LIVE (60 FPS)' : 'GEOMETRY LOCKED', W - 14, 22);
}

/* Geometry Script Interiors Canvas */
function drawInteriorsDemoCanvas() {
  const canvas = document.getElementById('interiorsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wEl = document.getElementById('roomWidth');
  const winEl = document.getElementById('windowCount');
  const rw = wEl ? Number(wEl.value) : 8;
  const wCount = winEl ? Number(winEl.value) : 3;

  if (document.getElementById('valRoomWidth')) document.getElementById('valRoomWidth').textContent = `${rw}m`;
  if (document.getElementById('valWindowCount')) document.getElementById('valWindowCount').textContent = `${wCount} Units`;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(200 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const theme = document.documentElement.getAttribute('data-theme') || 'art';
  const rgb = theme === 'dev' ? '0, 240, 255' : '229, 196, 131';

  ctx.clearRect(0, 0, rect.width, 200);

  const cx = rect.width / 2, cy = 100;
  const boxW = rw * 22;
  const boxH = 110;

  // Outer Room Wall
  ctx.strokeStyle = `rgb(${rgb})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - boxW/2, cy - boxH/2, boxW, boxH);

  // Apertures (Windows)
  const winStep = boxW / (wCount + 1);
  for (let i = 1; i <= wCount; i++) {
    const wx = cx - boxW/2 + i * winStep;
    ctx.clearRect(wx - 14, cy - boxH/2 - 2, 28, 4);
    ctx.strokeStyle = 'rgba(255, 189, 46, 0.9)';
    ctx.strokeRect(wx - 12, cy - boxH/2 - 3, 24, 6);
  }

  // Door Cut
  ctx.clearRect(cx - 16, cy + boxH/2 - 2, 32, 4);
  ctx.strokeStyle = `rgba(${rgb}, 0.7)`;
  ctx.beginPath();
  ctx.arc(cx - 16, cy + boxH/2, 32, 0, Math.PI * 0.5);
  ctx.stroke();

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Geometry Script dynamic wall & boolean aperture generator', 30, 185);
}

/* Ladybug Solar Simulation Canvas */
function drawLadybugDemoCanvas() {
  const canvas = document.getElementById('ladybugCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hourEl = document.getElementById('solarHour');
  const hour = hourEl ? Number(hourEl.value) : 13;
  if (document.getElementById('valSolarHour')) document.getElementById('valSolarHour').textContent = `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(200 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, rect.width, 200);

  const cx = rect.width / 2, cy = 130;
  const sunAngle = Math.PI - ((hour - 6) / 12) * Math.PI;
  const sunX = cx + Math.cos(sunAngle) * 120;
  const sunY = cy - Math.sin(sunAngle) * 90;

  // Sun Arc
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 120, Math.PI, 0); ctx.stroke();

  // Sun
  ctx.fillStyle = '#FFBD2E';
  ctx.beginPath(); ctx.arc(sunX, sunY, 8, 0, Math.PI * 2); ctx.fill();

  // Solar Ray
  ctx.strokeStyle = 'rgba(255, 189, 46, 0.4)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(cx, cy - 20); ctx.stroke();
  ctx.setLineDash([]);

  // Building Facade Thermal Grid
  const intensity = Math.sin(sunAngle);
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 3; r++) {
      const fx = cx - 75 + c * 30;
      const fy = cy - 60 + r * 20;
      const heat = Math.max(0, intensity * (1 - (c * 0.1)));
      ctx.fillStyle = `rgba(${Math.round(heat * 255)}, ${Math.round((1 - heat) * 180 + 50)}, 255, 0.7)`;
      ctx.fillRect(fx, fy, 26, 16);
    }
  }

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Ladybug EPW Solar Matrix → UE5 Dynamic Thermal Shader Stream', 30, 185);
}

/* Arc-Length Reparameterisation Canvas */
/* --- C++ AST compiler-verification loop (scripted illustration) -------------
   Three attempts at the same edit. The model reports success on the first two;
   cl.exe rejects both with real MSVC diagnostics, and those diagnostics are what
   drive the next attempt. The third builds.

   This is a FIXED SEQUENCE, not a live model and not a live compiler — the panel
   says so on screen. D-005 removed a scripted FAQ from this site that had been
   dressed up as an AI engine; the fix then was to label the mechanism honestly
   rather than to fake it, and the same rule applies here. */
const COMPILER_LOOP = [
  {
    code: [
      ['c',  '// attempt 1 — add the location field to the exported node'],
      ['',   'void FWorldExporter::WriteNode(TSharedPtr<FJsonObject> Node)'],
      ['',   '{'],
      ['bad','    Node->SetStringField(TEXT("Location"), Actor->GetActorLocation().ToString());'],
      ['',   '}']
    ],
    model: { ok: true,  text: 'Added the Location field. This looks correct.' },
    cl:    { ok: false, text: "error C2065: 'Actor': undeclared identifier" }
  },
  {
    code: [
      ['c',  '// attempt 2 — the diagnostic named the undeclared identifier'],
      ['fix','void FWorldExporter::WriteNode(AActor* Actor, TSharedPtr<FJsonObject> Node)'],
      ['',   '{'],
      ['bad','    FVector Loc = Actor->GetTransform();'],
      ['',   '    Node->SetStringField(TEXT("Location"), Loc.ToString());'],
      ['',   '}']
    ],
    model: { ok: true,  text: 'Fixed the undeclared identifier. This should build.' },
    cl:    { ok: false, text: "error C2440: 'initializing': cannot convert from 'FTransform' to 'FVector'" }
  },
  {
    code: [
      ['c',  '// attempt 3 — the diagnostic named the type, not just the symbol'],
      ['',   'void FWorldExporter::WriteNode(AActor* Actor, TSharedPtr<FJsonObject> Node)'],
      ['',   '{'],
      ['fix','    const FVector Loc = Actor->GetActorLocation();'],
      ['',   '    Node->SetStringField(TEXT("Location"), Loc.ToString());'],
      ['',   '}']
    ],
    model: { ok: true,  text: 'Corrected the return type. This should build.' },
    cl:    { ok: true,  text: 'Build succeeded. 0 error(s), 0 warning(s)' }
  }
];

let compilerLoopTimer = null;

function renderCompilerStep(i) {
  const step = COMPILER_LOOP[i];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const code = document.getElementById('loopCode');
  if (code) {
    code.innerHTML = step.code.map(([cls, line]) => {
      if (cls === 'c')   return `<span class="c">${esc(line)}</span>`;
      if (cls === 'bad') return `<span class="l-bad">${esc(line)}</span>`;
      if (cls === 'fix') return `<span class="l-fix">${esc(line)}</span>`;
      return esc(line);
    }).join('\n');
  }

  const put = (id, v) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'loop-verdict ' + (v.ok ? 'is-ok' : 'is-bad');
    el.querySelector('.loop-what').textContent = v.text;
  };
  put('loopModel', step.model);
  put('loopCl', step.cl);

  const it = document.getElementById('loopIter');
  if (it) it.textContent = `iteration ${i + 1} / ${COMPILER_LOOP.length}`;
}

function runCompilerLoop() {
  if (compilerLoopTimer) clearTimeout(compilerLoopTimer);
  const btn = document.getElementById('loopRun');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let i = 0;
  const step = () => {
    renderCompilerStep(i);
    const modal = document.getElementById('proofModal');
    const stillOpen = modal && modal.classList.contains('active');
    if (i < COMPILER_LOOP.length - 1 && stillOpen) {
      i++;
      /* Reduced motion still advances — the sequence IS the content, so skipping
         it would remove the point rather than just the motion. It simply steps
         faster and without waiting on the eye. */
      compilerLoopTimer = setTimeout(step, reduce ? 400 : 2100);
      if (btn) btn.textContent = '● RUNNING';
    } else if (btn) {
      btn.textContent = '↻ RUN AGAIN';
    }
  };
  step();
}

/* --- Grasshopper <-> MCP governance demo ------------------------------------
   The visitor plays the agent. Sliders are the REQUEST; everything drawn is the
   solver's RESPONSE. The gap between the two is the whole project.

   Constraint values are illustrative planning-style limits, not a real site.
   They are held here in one place for the same reason they are held in the
   Grasshopper definition in the real tool: whoever owns this object owns the
   design, and it must not be the agent. */
const GOV = {
  FLOOR_H: 3.2,        // m
  MAX_HEIGHT: 45,      // m
  MIN_SETBACK: 3,      // m
  SITE_W: 40,          // m
  DEPTH: 12,           // m
  MAX_GFA: 4800        // m^2
};

function solveGovernance(reqFloors, reqSetback) {
  /* The solver evaluates; it does not negotiate. Each rule returns a ceiling,
     and the binding one is simply the lowest — which is why adding a rule can
     never quietly loosen the result. */
  const setback = Math.max(GOV.MIN_SETBACK, reqSetback);
  const plateW = GOV.SITE_W - 2 * setback;
  const plate = plateW * GOV.DEPTH;

  const byHeight = Math.floor(GOV.MAX_HEIGHT / GOV.FLOOR_H);
  const byArea = Math.floor(GOV.MAX_GFA / plate);
  const floors = Math.max(1, Math.min(reqFloors, byHeight, byArea));

  let bound = null;
  if (floors < reqFloors) bound = (byArea < byHeight) ? 'area' : 'height';

  return {
    setback, plateW, plate, floors, byHeight, byArea,
    setbackClamped: setback > reqSetback,
    bound,
    gfa: plate * floors,
    height: floors * GOV.FLOOR_H
  };
}

function drawGovernanceDemo() {
  const canvas = document.getElementById('govCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reqFloors = parseInt(document.getElementById('govFloors')?.value || 18, 10);
  const reqSetback = parseInt(document.getElementById('govSetback')?.value || 1, 10);
  const fOut = document.getElementById('valGovFloors');
  const sOut = document.getElementById('valGovSetback');
  if (fOut) fOut.textContent = reqFloors;
  if (sOut) sOut.textContent = reqSetback + ' m';

  const r = solveGovernance(reqFloors, reqSetback);

  const W = 700, H = 300;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.scale(rect.width / W, 1);
  ctx.clearRect(0, 0, W, H);

  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#E5C483';

  // --- scales -------------------------------------------------------------
  const GROUND = 262, LEFT = 150, SITE_PX = 400;
  const mx = SITE_PX / GOV.SITE_W;                  // m -> px, horizontal
  const my = (GROUND - 40) / (GOV.MAX_HEIGHT * 1.25); // m -> px, vertical

  // --- site + the height cap ---------------------------------------------
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LEFT - 30, GROUND); ctx.lineTo(LEFT + SITE_PX + 30, GROUND); ctx.stroke();

  const capY = GROUND - GOV.MAX_HEIGHT * my;
  ctx.strokeStyle = 'rgba(255,107,107,0.75)';
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(LEFT - 30, capY); ctx.lineTo(LEFT + SITE_PX + 30, capY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,107,107,0.9)';
  ctx.fillText('height cap  ' + GOV.MAX_HEIGHT + ' m', LEFT + SITE_PX - 100, capY - 7);

  // --- what the agent ASKED for: ghost only -------------------------------
  const gSet = Math.max(0, reqSetback);
  const gW = (GOV.SITE_W - 2 * gSet) * mx;
  const gH = reqFloors * GOV.FLOOR_H * my;
  ctx.strokeStyle = 'rgba(255,255,255,0.30)';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(LEFT + gSet * mx, GROUND - gH, gW, gH);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.fillText('requested', LEFT + gSet * mx + 4, GROUND - gH - 7);

  // --- what the solver GRANTED: the only solid geometry on screen ---------
  const sW = r.plateW * mx;
  const sH = r.height * my;
  const sX = LEFT + r.setback * mx;
  ctx.fillStyle = 'rgba(' + (getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb').trim() || '229,196,131') + ',0.20)';
  ctx.fillRect(sX, GROUND - sH, sW, sH);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(sX, GROUND - sH, sW, sH);

  // floor plates, so "floors" is something you can count
  ctx.strokeStyle = 'rgba(' + (getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb').trim() || '229,196,131') + ',0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < r.floors; i++) {
    const y = GROUND - i * GOV.FLOOR_H * my;
    ctx.beginPath(); ctx.moveTo(sX, y); ctx.lineTo(sX + sW, y); ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.fillText('granted', sX + 4, GROUND - sH - 7);

  // --- setback dimension --------------------------------------------------
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(LEFT, GROUND + 12); ctx.lineTo(sX, GROUND + 12); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(r.setback + ' m', LEFT + 3, GROUND + 26);

  // --- the verdict --------------------------------------------------------
  const v = document.getElementById('govVerdict');
  if (!v) return;

  const rows = [];
  if (r.bound === 'height') {
    rows.push(['refused', `${reqFloors} floors would reach ${(reqFloors * GOV.FLOOR_H).toFixed(1)} m — the ${GOV.MAX_HEIGHT} m height cap binds first.`]);
  } else if (r.bound === 'area') {
    rows.push(['refused', `${reqFloors} floors on a ${Math.round(r.plate)} m² plate is ${Math.round(r.plate * reqFloors)} m² — over the ${GOV.MAX_GFA} m² area cap.`]);
  }
  if (r.setbackClamped) {
    rows.push(['refused', `${reqSetback} m setback is under the ${GOV.MIN_SETBACK} m minimum.`]);
  }
  const plural = r.floors === 1 ? 'floor' : 'floors';
  rows.push(['granted', `${r.floors} ${plural} · ${r.setback} m setback · ${r.height.toFixed(1)} m tall · ${Math.round(r.gfa)} m² GFA`]);

  v.innerHTML = rows.map(([kind, text]) =>
    `<div class="gov-row is-${kind}"><span class="gov-kind">${kind}</span><span class="gov-text">${text}</span></div>`
  ).join('') +
  `<div class="gov-note">The agent proposed; Grasshopper decided. Every number above came back from the solver.</div>`;
}

/* --- UE world -> JSON hierarchy --------------------------------------------
   A representative slice of an exported world, not a real project's data. The
   point being demonstrated is the CORRESPONDENCE — same tree, two readings —
   so the two panes are generated from one structure and can never drift apart.
   Types mirror the real schema's node kinds: World / Zone / BuildingBlock /
   Actor. */
const UE_WORLD = {
  id: 'Villa_Site', type: 'World',
  children: [
    { id: 'Zone_Ground', type: 'Zone', children: [
      { id: 'BP_Wall_Ext_01', type: 'Actor', t: '(0.0, 0.0, 0.0)' },
      { id: 'BP_Door_Main',   type: 'Actor', t: '(420.0, 0.0, 0.0)' },
      { id: 'Room_Living', type: 'BuildingBlock', children: [
        { id: 'BP_Window_01',   type: 'Actor', t: '(180.0, 610.0, 120.0)' },
        { id: 'BP_Floor_Living', type: 'Actor', t: '(0.0, 610.0, 0.0)' }
      ]}
    ]},
    { id: 'Zone_First', type: 'Zone', children: [
      { id: 'Room_Bed_01', type: 'BuildingBlock', children: [
        { id: 'BP_Window_02', type: 'Actor', t: '(180.0, 610.0, 420.0)' }
      ]},
      { id: 'BP_Stair_Main', type: 'Actor', t: '(890.0, 210.0, 0.0)' }
    ]},
    { id: 'Zone_Roof', type: 'Zone', children: [
      { id: 'BP_Roof_Slab', type: 'Actor', t: '(0.0, 0.0, 840.0)' }
    ]}
  ]
};

let hierSelected = 'Room_Living';

function hierCount(node, acc) {
  acc[node.type] = (acc[node.type] || 0) + 1;
  (node.children || []).forEach(c => hierCount(c, acc));
  return acc;
}

function renderHierarchyDemo() {
  const treeEl = document.getElementById('hierTree');
  const jsonEl = document.getElementById('hierJson');
  if (!treeEl || !jsonEl) return;

  const ICON = { World: '🌐', Zone: '▣', BuildingBlock: '▤', Actor: '•' };

  // --- the outliner -------------------------------------------------------
  const tree = (node, depth) => {
    const on = node.id === hierSelected;
    const kids = (node.children || []).map(c => tree(c, depth + 1)).join('');
    return `<button class="hier-node ${on ? 'is-sel' : ''}" style="padding-left:${8 + depth * 16}px"
              onclick="selectHierNode('${node.id}')" title="${node.type}">
              <span class="hier-ico">${ICON[node.type] || '•'}</span>
              <span class="hier-id">${node.id}</span>
              <span class="hier-type">${node.type}</span>
            </button>${kids}`;
  };
  treeEl.innerHTML = tree(UE_WORLD, 0);

  // --- the same tree, as the schema ---------------------------------------
  const json = (node, depth) => {
    const pad = '  '.repeat(depth + 1);
    const on = node.id === hierSelected;
    const kids = node.children || [];
    let s = `${pad}<span class="j-node ${on ? 'is-sel' : ''}" data-id="${node.id}">{\n`;
    s += `${pad}  "ActorID": <span class="j-str">"${node.id}"</span>,\n`;
    s += `${pad}  "Type": <span class="j-str">"${node.type}"</span>`;
    if (node.t) s += `,\n${pad}  "Transform": <span class="j-str">"${node.t}"</span>`;
    if (kids.length) {
      s += `,\n${pad}  "Contains": [\n`;
      /* +1, not +2. The schema really does nest twice here (object -> "Contains"
         array -> child object), but indenting for both pushes a depth-4 actor off
         the right edge. Visual indent tracks the TREE, which is what the reader
         is matching against on the left. */
      s += kids.map(c => json(c, depth + 1)).join(',\n');
      s += `\n${pad}  ]`;
    }
    s += `\n${pad}}</span>`;
    return s;
  };
  jsonEl.innerHTML = json(UE_WORLD, 0);

  const sel = jsonEl.querySelector('.j-node.is-sel');
  if (sel) sel.scrollIntoView({ block: 'nearest' });

  const c = hierCount(UE_WORLD, {});
  const stat = document.getElementById('hierStat');
  if (stat) {
    stat.textContent =
      `${c.Zone || 0} zones · ${c.BuildingBlock || 0} building blocks · ${c.Actor || 0} actors ` +
      `— one pass, no manual re-entry. Representative slice, not a client project.`;
  }
}

function selectHierNode(id) {
  hierSelected = id;
  renderHierarchyDemo();
}

function drawSplineComparisonCanvas() {
  const canvas = document.getElementById('splineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = 700, H = 300;
  const STRIPES = parseInt(document.getElementById('uvRepeats')?.value || 18, 10);
  const out = document.getElementById('valUvRepeats');
  if (out) out.textContent = STRIPES;

  /* Handles live on the element, so a slider redraw keeps whatever the visitor
     dragged while a freshly opened modal starts from the default curve. */
  if (!canvas._pts) {
    canvas._pts = [
      { x: 60,  y: 0,   fixed: true  },
      { x: 500, y: -62, fixed: false },
      { x: 200, y: 62,  fixed: false },
      { x: 640, y: 0,   fixed: true  }
    ];
  }
  const P = canvas._pts;

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.scale(rect.width / W, 1);
    return rect;
  }

  const at = (t) => {
    const u = 1 - t;
    return {
      x: u * u * u * P[0].x + 3 * u * u * t * P[1].x + 3 * u * t * t * P[2].x + t * t * t * P[3].x,
      y: u * u * u * P[0].y + 3 * u * u * t * P[1].y + 3 * u * t * t * P[2].y + t * t * t * P[3].y
    };
  };

  /* B'(t) — needed for the ribbon normal, and it is also what makes the point:
     the curve's SPEED varies with t, and that variation is the whole bug. */
  const deriv = (t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (P[1].x - P[0].x) + 6 * u * t * (P[2].x - P[1].x) + 3 * t * t * (P[3].x - P[2].x),
      y: 3 * u * u * (P[1].y - P[0].y) + 6 * u * t * (P[2].y - P[1].y) + 3 * t * t * (P[3].y - P[2].y)
    };
  };

  const SAMPLES = 600;
  function buildLUT() {
    const lut = [{ t: 0, s: 0 }];
    let prev = at(0), total = 0;
    for (let i = 1; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const cur = at(t);
      total += Math.hypot(cur.x - prev.x, cur.y - prev.y);
      lut.push({ t, s: total });
      prev = cur;
    }
    return { lut, total };
  }

  /* Arc length -> t. Binary search the table, then lerp inside the bracket.
     This inversion is the entire tool in four lines; everything else is plumbing. */
  function tAtLength(L, frac) {
    const target = frac * L.total, lut = L.lut;
    let lo = 0, hi = lut.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (lut[mid].s < target) lo = mid; else hi = mid;
    }
    const span = lut[hi].s - lut[lo].s;
    const k = span > 0 ? (target - lut[lo].s) / span : 0;
    return lut[lo].t + k * (lut[hi].t - lut[lo].t);
  }

  // t -> arc length, for measuring how long each stripe actually came out.
  function sAtT(L, t) {
    const f = Math.max(0, Math.min(1, t)) * SAMPLES;
    const i = Math.floor(f), k = f - i;
    const a = L.lut[i], b = L.lut[Math.min(i + 1, SAMPLES)];
    return a.s + (b.s - a.s) * k;
  }

  const HALF = 17;          // ribbon half-width in virtual px
  const STEPS = 420;        // fine samples along the ribbon

  /* Both ribbons use the SAME stripe colours on purpose. If one were tinted
     "wrong" and the other "right" the eye would follow the colour; identical
     texture means the only visible difference is the distortion itself. */
  const INK = 'rgba(255,255,255,0.88)';
  const GAP = 'rgba(255,255,255,0.07)';

  function ribbon(L, yBase, mapping) {
    /* Precompute both ribbon edges once, walking at constant PHYSICAL speed so
       that bunching shows up on screen as bunching. */
    const edge = [];
    for (let i = 0; i <= STEPS; i++) {
      const f = i / STEPS;
      const t = tAtLength(L, f);
      const c = at(t), d = deriv(t);
      const n = Math.hypot(d.x, d.y) || 1;
      const off = { x: -d.y / n * HALF, y: d.x / n * HALF };
      edge.push({
        ax: c.x + off.x, ay: yBase + c.y + off.y,   // outer edge
        bx: c.x - off.x, by: yBase + c.y - off.y,   // inner edge
        u: mapping === 't' ? t : f                  // the texture coordinate
      });
    }

    /* One polygon PER STRIPE, not per sample. Filling each sample separately
       antialiases every internal boundary and the ribbon reads as hatching
       instead of as a texture. Runs share their boundary sample, so the seam
       between two stripes is a single shared edge. */
    let runStart = 0;
    let band = Math.floor(edge[0].u * STRIPES) % 2;

    const flush = (from, to, ink) => {
      if (to <= from) return;
      ctx.fillStyle = ink ? INK : GAP;
      ctx.beginPath();
      ctx.moveTo(edge[from].ax, edge[from].ay);
      for (let i = from + 1; i <= to; i++) ctx.lineTo(edge[i].ax, edge[i].ay);
      for (let i = to; i >= from; i--) ctx.lineTo(edge[i].bx, edge[i].by);
      ctx.closePath();
      ctx.fill();
    };

    for (let i = 1; i <= STEPS; i++) {
      const b = Math.floor(edge[i].u * STRIPES) % 2;
      if (b !== band) {
        flush(runStart, i, band);
        runStart = i;
        band = b;
      }
    }
    flush(runStart, STEPS, band);
  }

  /* The honest number: how long each stripe actually came out along the curve,
     worst over best. Arc length is 1.00 by construction — that is the claim
     being demonstrated, not asserted. */
  function distortion(L, mapping) {
    let min = Infinity, max = 0;
    for (let k = 0; k < STRIPES; k++) {
      const u0 = k / STRIPES, u1 = (k + 1) / STRIPES;
      const len = mapping === 't'
        ? sAtT(L, u1) - sAtT(L, u0)
        : L.total / STRIPES;
      if (len < min) min = len;
      if (len > max) max = len;
    }
    return min > 0 ? max / min : Infinity;
  }

  function label(text, x, y, colour) {
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
  }

  function handleDots() {
    P.forEach((pt, i) => {
      if (pt.fixed) return;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(P[i === 1 ? 0 : 3].x, 78 + P[i === 1 ? 0 : 3].y);
      ctx.lineTo(pt.x, 78 + pt.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'var(--accent)';
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim() || '#E5C483';
      ctx.beginPath();
      ctx.arc(pt.x, 78 + pt.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render() {
    layout();
    const L = buildLUT();
    ctx.clearRect(0, 0, W, H);

    label('UV STEPPED IN  t  — the default, and the bug', 58, 24, 'rgba(255,189,46,0.9)');
    ribbon(L, 78, 't');
    handleDots();

    label('UV STEPPED IN ARC LENGTH — what the tool does', 58, 196, 'rgba(120,255,190,0.9)');
    ribbon(L, 250, 's');

    const dT = distortion(L, 't');
    const m = document.getElementById('uvMetric');
    if (m) {
      /* Degenerate handle positions are reachable by dragging (both handles onto
         the same point, or swapped past each other) and produce ratios in the
         hundreds. The number is correct, but printing "1141.0x" reads as a
         broken demo rather than as a strong result — so cap the DISPLAY and say
         it is a cap. The measurement itself is untouched. */
      const shown = dT > 99 ? '99+' : dT.toFixed(1);
      m.innerHTML =
        `<span class="uv-metric-row"><b>${shown}×</b> widest stripe over narrowest, stepping in <code>t</code></span>` +
        `<span class="uv-metric-row"><b>1.0×</b> stepping in arc length</span>` +
        `<span class="uv-metric-note">Measured off the curve above, in this browser, as you drag it.</span>`;
    }
  }

  /* --- Dragging. The point of making it draggable is that a canned animation
     proves nothing: the reparameterisation has to survive a curve the visitor
     chose, including the degenerate ones. ------------------------------------ */
  if (!canvas._wired) {
    canvas._wired = true;
    let dragging = -1;

    const toVirtual = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const src = ev.touches ? ev.touches[0] : ev;
      return {
        x: (src.clientX - rect.left) * W / rect.width,
        y: (src.clientY - rect.top) - 78
      };
    };

    const pick = (ev) => {
      const v = toVirtual(ev);
      for (let i = 0; i < P.length; i++) {
        if (P[i].fixed) continue;
        if (Math.hypot(P[i].x - v.x, P[i].y - v.y) < 22) return i;
      }
      return -1;
    };

    const move = (ev) => {
      if (dragging < 0) return;
      ev.preventDefault();
      const v = toVirtual(ev);
      // Clamped so a drag cannot push the curve off its own canvas.
      P[dragging].x = Math.max(20, Math.min(W - 20, v.x));
      P[dragging].y = Math.max(-70, Math.min(70, v.y));
      drawSplineComparisonCanvas();
    };

    const up = () => {
      dragging = -1;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };

    const down = (ev) => {
      dragging = pick(ev);
      if (dragging < 0) return;
      ev.preventDefault();
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
    };

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('mousemove', (ev) => {
      canvas.style.cursor = pick(ev) >= 0 ? 'grab' : 'default';
    });
  }

  render();
}

function closeProofModal(event) {
  if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
  const modal = document.getElementById('proofModal');
  const vid = document.getElementById('modalVideoPlayer');
  if (vid) vid.pause();
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');
  if (zsyncAnimFrame) cancelAnimationFrame(zsyncAnimFrame);
  if (activeDemoAnimFrame) cancelAnimationFrame(activeDemoAnimFrame);
  if (cvLabAnimFrame) { cancelAnimationFrame(cvLabAnimFrame); cvLabAnimFrame = null; }
  /* The loop schedules itself with setTimeout, so closing the modal has to
     cancel it or it keeps stepping against a detached DOM. */
  if (compilerLoopTimer) { clearTimeout(compilerLoopTimer); compilerLoopTimer = null; }
}

/* ==========================================================================
   Briefing Panel (Written Q&A)
   ========================================================================== */

const FALLBACK_ANSWER =
  `That one is not in the written set — these are prepared answers, not a live model, ` +
  `so anything outside them is best asked directly. archalaamahmoud@gmail.com reaches me fastest.`;

/* Prepared answers about WHO HE IS and WHERE HE HAS WORKED — not technical
   explanations (D-025). The old set answered "how do you guarantee 60 FPS" and
   "explain the Grasshopper-MCP bridge", which Alaa flagged as not accurate. One
   of them also contradicted the site: it claimed performance came from writing
   C++ "instead of relying on bloated Blueprints", while the five Vancore cards
   say the work is built in Blueprints. A panel that argues with the grid above
   it is worse than no panel.

   Everything here traces to something already evidenced on the page — the
   timeline, the ITI row, the Vancore entries — so nothing new is being claimed
   in a place nobody audits. */
const twinAnswers = {
  'Who are you?': `Alaa Mahmoud — a licensed architect who moved into real-time engine development. Architectural practice since 2019, engine work since 2021. I hold the line from design intent through to a system that runs: geometry, pipeline, engine, delivery. The architecture half is not background — it is why the design survives the build.`,

  'Where have you worked?': `Currently Unreal Engine Developer at Vancore Studios (Nov 2025 – present), on interactive real-estate presentations. Before that: Cube Consultants (2025), Creative Motions (2024), CitiesOS (2022), and Techno Vision (2021–22) as architect and UE technical artist. I started in architectural practice at Abdulelah Al-Mohanna Architects in 2019, and have worked freelance on parametric and interior projects throughout.`,

  'Have you led or taught anyone?': `Yes. In 2025 I advised and mentored 15 students across 3 graduation project teams at Egypt's Information Technology Institute, building in Unreal Engine — reviewing work I did not write and directing how it should be approached. In studio work I have set the technical approach, chosen the pipeline other artists then worked inside, scoped and estimated work, and carried projects end to end.`,

  'What are you available for?': `Three sizes. A short technical review of something specific that is stuck; a fractional technical lead engagement where I own the real-time side of a project; or a full-time R&D or technical direction role. I am in Cairo, Egypt and work globally remote. The fastest start is a short message describing the problem.`
};

/* Deliberately conservative: say plainly that there is no answer rather than
   guess one. The panel is a set of written answers, not a model (D-005). */

function appendChatMessage(container, author, text, isUser = false) {
  const row = document.createElement('div');
  row.className = `chat-row ${isUser ? 'user-row' : 'ai-row'}`;
  
  const authorSpan = document.createElement('span');
  authorSpan.className = 'chat-author';
  if (isUser) authorSpan.style.color = 'var(--text-muted)';
  authorSpan.textContent = author;

  const textP = document.createElement('p');
  textP.className = 'chat-text';
  if (isUser) {
    textP.style.color = 'var(--accent)';
    textP.style.fontWeight = '600';
    textP.textContent = text;
  }

  row.appendChild(authorSpan);
  row.appendChild(textP);
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;

  if (!isUser) {
    if (prefersReducedMotion) {
      textP.textContent = text;
      return;
    }
    let charIdx = 0;
    textP.textContent = '';
    const speed = 14;
    function typeChar() {
      if (charIdx < text.length) {
        textP.textContent += text.charAt(charIdx);
        charIdx++;
        setTimeout(typeChar, speed);
      }
    }
    typeChar();
  }
}

function askTwin(question) {
  const chatBody = document.getElementById('twinChatBody');
  if (!chatBody) return;

  const answer = twinAnswers[question] || FALLBACK_ANSWER;

  appendChatMessage(chatBody, 'YOU', question, true);
  setTimeout(() => {
    appendChatMessage(chatBody, 'ALAA — WRITTEN ANSWER', answer, false);
  }, 300);
}

function handleCustomTwinQuery(event) {
  event.preventDefault();
  const input = document.getElementById('twinQueryInput');
  if (!input || !input.value.trim()) return;

  const query = input.value.trim();
  input.value = '';

  const lower = query.toLowerCase();
  let response = FALLBACK_ANSWER;

  const has = (...w) => w.some(x => lower.includes(x));
  if (has('worked', 'work history', 'experience', 'vancore', 'cube', 'employer', 'job', 'career', 'cv', 'resume')) {
    response = twinAnswers['Where have you worked?'];
  } else if (has('lead', 'led', 'manage', 'team', 'teach', 'taught', 'mentor', 'advis', 'iti', 'student')) {
    response = twinAnswers['Have you led or taught anyone?'];
  } else if (has('available', 'availab', 'hire', 'contact', 'email', 'consult', 'rate', 'freelance', 'role')) {
    response = twinAnswers['What are you available for?'];
  } else if (has('who', 'about', 'background', 'architect', 'study', 'degree', 'you')) {
    response = twinAnswers['Who are you?'];
  }

  askTwinWithCustomResponse(query, response);
}

function askTwinWithCustomResponse(question, answer) {
  const chatBody = document.getElementById('twinChatBody');
  if (!chatBody) return;

  appendChatMessage(chatBody, 'YOU', question, true);
  setTimeout(() => {
    appendChatMessage(chatBody, 'ALAA — WRITTEN ANSWER', answer, false);
  }, 300);
}

// 5. Global Event Listeners & Keyboard Accessibility
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  const lightboxOpen = lb && lb.classList.contains('active');

  if (e.key === 'Escape') {
    if (lightboxOpen) { closeLightbox(); return; }
    const modal = document.getElementById('proofModal');
    if (modal && modal.classList.contains('active')) closeProofModal();
    return;
  }

  if (lightboxOpen) {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setMode('dev');
  /* Was hardcoded to 'zsync', which overrode the reconciliation setMode does
     on the line above. Let the data decide which project leads. */
  const opening = modeProjects(modeKeyFor('dev'))[0];
  if (opening) selectStageProject(opening.id, false);
  // (archive section folded into the work grid — see D-009)
  initGlobalCanvas();
  initScrollTracker();
});
