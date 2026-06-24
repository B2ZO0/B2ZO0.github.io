/* ============================================================
   TILT 3D — Effet d'inclinaison au survol
   Applique un effet de carte qui "bascule" vers le curseur
   sur les cartes projet, formation, compétences, tâches.
   ============================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Sélecteurs des éléments à rendre interactifs en 3D
  const SELECTORS = [
    '.fc',
    '.task-card',
    '.bts-card',
    '.veille-domain-card',
    '.proj-card',
  ];

  const MAX_TILT = 6;        // degrés max d'inclinaison
  const PERSPECTIVE = 900;   // px

  function initTilt(el) {
    el.classList.add('tilt');

    let rafId = null;
    let targetRX = 0, targetRY = 0, targetMX = 50, targetMY = 50;
    let curRX = 0, curRY = 0, curMX = 50, curMY = 50;

    function loop() {
      curRX += (targetRX - curRX) * 0.12;
      curRY += (targetRY - curRY) * 0.12;
      curMX += (targetMX - curMX) * 0.12;
      curMY += (targetMY - curMY) * 0.12;

      el.style.transform =
        `perspective(${PERSPECTIVE}px) rotateX(${curRX}deg) rotateY(${curRY}deg) translateZ(0)`;
      el.style.setProperty('--mx', curMX + '%');
      el.style.setProperty('--my', curMY + '%');

      if (
        Math.abs(targetRX - curRX) > 0.01 ||
        Math.abs(targetRY - curRY) > 0.01 ||
        Math.abs(targetMX - curMX) > 0.1 ||
        Math.abs(targetMY - curMY) > 0.1
      ) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    function start() {
      if (!rafId) rafId = requestAnimationFrame(loop);
    }

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1

      targetRY = (px - 0.5) * MAX_TILT * 2;   // gauche/droite -> rotateY
      targetRX = -(py - 0.5) * MAX_TILT * 2;  // haut/bas -> rotateX
      targetMX = px * 100;
      targetMY = py * 100;

      start();
    });

    el.addEventListener('mouseleave', () => {
      targetRX = 0;
      targetRY = 0;
      targetMX = 50;
      targetMY = 50;
      start();
    });
  }

  function bindAll() {
    SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.dataset.tiltBound) {
          el.dataset.tiltBound = '1';
          initTilt(el);
        }
      });
    });
  }

  // Premier passage
  document.addEventListener('DOMContentLoaded', bindAll);
  if (document.readyState !== 'loading') bindAll();

  // Ré-application si la navigation SPA insère de nouveaux éléments
  // (au cas où des pages sont régénérées dynamiquement)
  const observer = new MutationObserver(() => bindAll());
  observer.observe(document.body, { childList: true, subtree: true });

})();
