/* ============================================================
   MAIN.JS — Logique principale du portfolio
   Fond plexus animé, curseur fluide, navigation SPA,
   accordéon projets, veille RSS
   ============================================================ */

// ========== 1. FOND ANIMÉ PLEXUS ==========
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let points = [];
  const pointCount = 80;
  const connectionDist = 150;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Point {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
  }

  for (let i = 0; i < pointCount; i++) points.push(new Point());

  function animateBG() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(p => {
      p.update();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.fill();

      points.forEach(p2 => {
        let d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
        if (d < connectionDist) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${1 - d / connectionDist})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(animateBG);
  }
  animateBG();
})();

// ========== 2. CURSEUR FLUIDE ==========
(function () {
  const cursor = document.getElementById('cur');
  const cursorRing = document.getElementById('curRing');
  if (!cursor || !cursorRing) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX, curY = mouseY, ringX = mouseX, ringY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.opacity = '1'; cursorRing.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0'; cursorRing.style.opacity = '0';
  });

  function animateCursor() {
    curX += (mouseX - curX) * 0.2;
    curY += (mouseY - curY) * 0.2;
    cursor.style.left = curX + 'px';
    cursor.style.top = curY + 'px';

    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';

    requestAnimationFrame(animateCursor);
  }
  animateCursor();
})();

// ========== 3. NAVIGATION SPA ==========
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  document.querySelector('.main') && (document.querySelector('.main').scrollTop = 0);
  window.scrollTo(0, 0);
  if (pageId === 'veille') loadRSS();
}

document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', function () {
    showPage(this.getAttribute('data-page'));
  });
});

// ========== 4. PROJETS — ACCORDÉON ==========
document.querySelectorAll('.proj-head').forEach(head => {
  head.addEventListener('click', function () {
    const card = this.closest('.proj-card');
    const body = card.querySelector('.proj-body');
    const btn = this.querySelector('.proj-toggle');

    body.classList.toggle('open');
    btn.classList.toggle('open');
    btn.textContent = body.classList.contains('open') ? 'x' : '+';
  });
});

// ========== 5. VEILLE RSS ==========
let rssLoaded = false;

const CYBER_FEEDS = [
  { url: 'https://www.cert.ssi.gouv.fr/feed/', name: 'ANSSI CERT-FR' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hacker News' }
];

const ADMIN_FEEDS = [
  { url: 'https://www.it-connect.fr/feed/', name: 'IT-Connect.fr' },
  { url: 'https://windowsreport.com/feed/', name: 'Windows Report' }
];

async function loadRSS() {
  if (rssLoaded) return;
  rssLoaded = true;
  await Promise.all([
    fetchFeeds(CYBER_FEEDS, 'feed-cyber', 'ts-cyber'),
    fetchFeeds(ADMIN_FEEDS, 'feed-admin', 'ts-admin')
  ]);
}

async function fetchFeeds(feeds, containerId, tsId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="rss-msg">Chargement des flux en cours...</div>';
  let items = [];

  for (const f of feeds) {
    try {
      const r = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(f.url));
      const d = await r.json();
      if (d.status === 'ok') {
        d.items.forEach(it => {
          const title = it.title || '';
          const link = it.link || '#';
          const pub = it.pubDate || '';
          const date = pub ? new Date(pub).toLocaleDateString('fr-FR') : '';
          if (title) items.push({ title, link, date, src: f.name });
        });
      }
    } catch (e) {
      console.error('Erreur flux :', f.name, e);
    }
  }

  if (!items.length) {
    el.innerHTML = '<div class="rss-msg" style="color:var(--orange);">! Impossible de charger les flux.</div>';
    return;
  }

  el.innerHTML = items.slice(0, 10).map(i =>
    `<div class="rss-item">
      <a href="${i.link}" target="_blank" rel="noopener noreferrer">
        <div class="rss-ttl">${i.title}</div>
        <div class="rss-meta">
          <span class="rss-src">${i.src}</span>
          <span>${i.date}</span>
        </div>
      </a>
    </div>`
  ).join('');

  const tsEl = document.getElementById(tsId);
  if (tsEl) tsEl.textContent = 'Dernière MAJ : ' + new Date().toLocaleTimeString('fr-FR');
}

// Filtres catégories veille
document.querySelectorAll('.vcat').forEach(catBtn => {
  catBtn.addEventListener('click', function () {
    document.querySelectorAll('.vcat').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    const cat = this.getAttribute('data-cat');
    const colCyber = document.getElementById('col-cyber');
    const colAdmin = document.getElementById('col-admin');
    if (colCyber) colCyber.style.display = (cat === 'admin') ? 'none' : '';
    if (colAdmin) colAdmin.style.display = (cat === 'cyber') ? 'none' : '';
  });
});

// ========== 6. PLACEHOLDER ARMATIS ==========
window.addEventListener('load', function () {
  const img = document.querySelector('img[src="armatis-site.jpg"]');
  if (img && !img.complete) {
    img.style.display = 'none';
    const ph = document.getElementById('armatis-placeholder');
    if (ph) ph.style.display = 'flex';
  }
});
