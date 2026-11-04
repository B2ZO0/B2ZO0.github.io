/* =========================================================
   Portfolio Enzo MARECHAL — v7 · identité « cockpit »
   Script classique sans bibliothèque : marche en ligne comme
   en ouvrant index.html directement depuis le disque.
   ========================================================= */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

  /* ---------------------------------------------------------
     Icônes
     --------------------------------------------------------- */
  var P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.5 5.5"/><circle cx="12" cy="12" r="1"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    school: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    monitor: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/>',
    phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    network: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 1-5-5L9 6 6 3 3 6l3 3 3.3-3.3"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 3 3-3 3M12 15h6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    box: '<path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
    cable: '<path d="M4 9V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4M6.5 9v5a4 4 0 0 0 8 0v-4a3 3 0 0 1 6 0v10"/><rect x="3" y="9" width="7" height="3" rx="1"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M6 14h12v7H6z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    hdd: '<rect x="2" y="13" width="20" height="8" rx="2"/><path d="M5 13 7.5 4h9L19 13M6 17h.01M10 17h.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  var FILLED = {
    linkedin: '<path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.6-2.64-1.62 0-1.86 1.26-1.86 2.56v4.92h-4z"/>',
    github: '<path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/>'
  };
  function icon(n) {
    if (FILLED[n]) return '<svg viewBox="0 0 24 24" aria-hidden="true">' + FILLED[n] + '</svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';
  }
  function drawIcons(root) {
    $$('i[data-i]', root).forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-i'));
    });
  }

  /* ---------------------------------------------------------
     Thème jour / nuit (mémorisé)
     --------------------------------------------------------- */
  function initTheme() {
    var btn = $('#themeBtn');
    var root = document.documentElement;
    function paint() {
      var day = root.getAttribute('data-theme') === 'day';
      btn.innerHTML = '<i data-i="' + (day ? 'moon' : 'sun') + '"></i>';
      drawIcons(btn);
      $('meta[name="theme-color"]').setAttribute('content', day ? '#eceef4' : '#11131d');
    }
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'day' ? 'night' : 'day';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('em-theme', next); } catch (e) {}
      paint();
      drawSkillTopo();
    });
    paint();
  }

  /* ---------------------------------------------------------
     Compétences (voyant vert = quotidien, bleu = régulier,
     violet = en atelier / homelab)
     --------------------------------------------------------- */
  var LV = { q: ['up', 'quotidien'], r: ['info', 'régulier'], l: ['violet', 'atelier / lab'] };
  var SKILLS = [
    { t: 'Systèmes Windows', ic: 'monitor', d: "Installer et dépanner les postes, gérer le domaine et ses stratégies de groupe.", l: [['Windows 10 / 11', 'q'], ['Active Directory', 'q'], ['GPO', 'q'], ['Windows Server', 'q'], ['DNS / DHCP', 'r'], ['WDS / MDT', 'r'], ['PowerShell', 'r']] },
    { t: 'Réseau', ic: 'network', d: "Câbler, configurer les switchs, découper en VLAN et filtrer avec un pare-feu.", l: [['Brassage et câblage', 'q'], ['Switchs', 'q'], ['VLAN', 'q'], ['VLAN voix / QoS', 'r'], ['Routage', 'r'], ['pfSense', 'l'], ['VPN', 'l']] },
    { t: 'Supervision & outils', ic: 'chart', d: "Voir les pannes avant les utilisateurs et garder le parc sous contrôle.", l: [['Outil RMM', 'q'], ['NetCockpit', 'q'], ['Zabbix', 'r'], ['Grafana', 'r'], ['Prometheus / Loki', 'r'], ['GLPI', 'l'], ['Wazuh', 'l']] },
    { t: 'Services', ic: 'server', d: "Mettre en place et maintenir les services dont l'équipe a besoin.", l: [['3CX', 'q'], ['Vaultwarden', 'q'], ['Imprimantes Zebra', 'r'], ['Nginx / reverse proxy', 'r'], ['MariaDB', 'l']] },
    { t: 'Linux & virtualisation', ic: 'box', d: "Monter un serveur Debian, des VM et des conteneurs, et les sauvegarder.", l: [['Debian', 'r'], ['Docker / Compose', 'r'], ['Proxmox VE', 'r'], ['SSH / Bash', 'r'], ['VMware ESXi', 'l'], ['Hyper-V', 'l'], ['Ansible', 'l']] },
    { t: 'Support & savoir-être', ic: 'users', d: "Aider, expliquer simplement et laisser une trace utile.", l: [['Support N1 à N3', 'q'], ['Maintenance matérielle', 'q'], ['Gestion des tickets', 'q'], ['Rédaction de procédures', 'r'], ['Travail en équipe', 'q']] }
  ];
  function renderSkills() {
    var box = $('#skills');
    box.innerHTML = SKILLS.map(function (s) {
      return '<article class="panel skill reveal"><div class="skill__head"><i data-i="' + s.ic + '"></i><h3>' + esc(s.t) + '</h3></div>' +
        '<p>' + esc(s.d) + '</p><ul class="skill__list">' + s.l.map(function (x) {
          return '<li><span class="lamp ' + LV[x[1]][0] + '"></span>' + esc(x[0]) + '<em>' + LV[x[1]][1] + '</em></li>';
        }).join('') + '</ul></article>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Topologie des compétences (SVG, impulsions animées)
     --------------------------------------------------------- */
  var TOPO = [
    { t: 'Windows', s: 'AD · GPO · MDT', a: -90 },
    { t: 'Réseau', s: 'VLAN · switchs', a: -30 },
    { t: 'Supervision', s: 'NetCockpit · Zabbix', a: 30 },
    { t: 'Services', s: '3CX · Vaultwarden', a: 90 },
    { t: 'Virtualisation', s: 'Proxmox · Docker', a: 150 },
    { t: 'Support', s: 'N1 → N3', a: 210 }
  ];
  function drawSkillTopo() {
    var box = $('#skillTopo');
    if (!box) return;
    var W = 560, H = 360, cx = W / 2, cy = H / 2 + 6, rx = 205, ry = 118;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-label="Domaines de compétences reliés à Enzo">';
    TOPO.forEach(function (n, i) {
      var a = n.a * Math.PI / 180, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      n.x = x; n.y = y;
      s += '<path id="tl' + i + '" d="M' + cx + ',' + cy + ' L' + x.toFixed(1) + ',' + y.toFixed(1) + '" fill="none" style="stroke:var(--violet)" stroke-width="2" opacity=".75"/>';
    });
    TOPO.forEach(function (n, i) {
      if (!reduce) {
        s += '<circle r="3.5" style="fill:var(--magenta)"><animateMotion dur="' + (2.2 + i * 0.35).toFixed(2) + 's" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#tl' + i + '" xlink:href="#tl' + i + '"/></animateMotion></circle>';
      }
    });
    TOPO.forEach(function (n) {
      s += '<g><circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="17" style="fill:var(--surface);stroke:var(--up)" stroke-width="2"/>' +
        '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="4" style="fill:var(--up)"/>' +
        '<text class="n-label" x="' + n.x.toFixed(1) + '" y="' + (n.a === -90 ? n.y - 38 : n.y + 32).toFixed(1) + '" text-anchor="middle">' + esc(n.t) + '</text>' +
        '<text class="n-sub" x="' + n.x.toFixed(1) + '" y="' + (n.a === -90 ? n.y - 25 : n.y + 45).toFixed(1) + '" text-anchor="middle">' + esc(n.s) + '</text></g>';
    });
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="31" style="fill:var(--raised);stroke:var(--magenta)" stroke-width="2.5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="41" fill="none" style="stroke:var(--magenta)" stroke-opacity=".35" stroke-dasharray="3 5"/>' +
      '<text class="n-label" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" style="font-size:14px">Enzo</text>';
    s += '</svg>';
    box.innerHTML = s;
  }

  /* ---------------------------------------------------------
     NetCockpit : captures
     --------------------------------------------------------- */
  var SHOTS = {
    overview: "La vue d'ensemble : une phrase dit si tout va bien, la route vers Internet est tracée en magenta, la topologie est en direct.",
    topology: "La topologie construite automatiquement : Internet → pare-feu → sites → switchs → serveurs → VM, avec l'état de chaque équipement.",
    switches: "Les switchs port par port : qui est branché où, état et trafic de chaque port.",
    vmware: "VMware d'un coup d'œil : hôtes, VM, datastores et alarmes, avec un vCenter ou un ESXi seul.",
    'device-ai': "La fiche d'un équipement avec le diagnostic IA en option (modèle local possible).",
    'overview-day-fr': "Le même écran en thème jour, en français."
  };
  function initNetCockpit() {
    var tabs = $$('#ncTabs button');
    var img = $('#ncShot');
    var cap = $('#ncCaption');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-shot');
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        img.classList.add('is-fading');
        var next = new Image();
        next.onload = next.onerror = function () {
          img.src = next.src;
          img.alt = 'NetCockpit : ' + b.textContent;
          cap.textContent = SHOTS[k] || '';
          img.classList.remove('is-fading');
        };
        next.src = 'img/netcockpit-' + k + '.jpg';
      });
    });
    img.addEventListener('click', function () { lightbox(img.src, img.alt); });
  }
  function lightbox(src, alt) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '">';
    lb.addEventListener('click', function () { lb.remove(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(lb);
  }

  /* ---------------------------------------------------------
     Projets
     --------------------------------------------------------- */
  var GROUPS = [
    { k: 'all', label: 'Tous' },
    { k: 'entreprise', label: 'En entreprise' },
    { k: 'bts', label: 'BTS SIO' },
    { k: 'perso', label: 'Homelab & perso' }
  ];
  var PROJECTS = [
    {
      id: 'netcockpit', c: 'netcockpit', g: ['entreprise', 'perso'], featured: true, icon: 'radar',
      tag: 'Projet phare · open source', date: '2026 · en production dans ma mission et sur mon homelab',
      title: 'NetCockpit : toute l\'infrastructure dans un seul cockpit',
      sum: "Un outil que j'ai créé : il découvre le réseau tout seul, dessine la topologie en direct, suit VMware et les switchs port par port, et regroupe toutes les alertes. Fait pour les équipes qui n'ont pas la main sur les switchs et le pare-feu.",
      img: 'img/netcockpit-topology.jpg', imgAlt: 'Topologie générée par NetCockpit',
      contexte: "Dans beaucoup d'entreprises, le réseau est géré par un prestataire : l'équipe informatique n'a pas d'accès administrateur sur les switchs ni sur le pare-feu. On se retrouve avec une liste d'adresses IP et un schéma réseau jamais à jour. J'ai voulu un outil qui croise tout ce à quoi on a accès pour reconstruire une vraie carte, en direct.",
      actions: [
        "Découverte du réseau : scan, noms DNS de l'Active Directory, NetBIOS, traceroute vers Internet",
        "Topologie hiérarchique automatique (Internet → pare-feu → sites → switchs → serveurs → VM), mise à jour toutes les 15 secondes",
        "Lecture des voisins CDP/LLDP via les ESXi et les serveurs, sans toucher aux switchs ; carte port par port avec un accès SNMP en lecture",
        "Installation et configuration automatiques de Prometheus, Loki, Alertmanager, Grafana (7 tableaux de bord) et Zabbix",
        "Environ 40 règles d'alerte prêtes à l'emploi, envoyées vers Telegram, Discord ou e-mail, sans doublons",
        "Agents pour Windows et Linux installables en une ligne, diagnostic IA en option avec un modèle local",
        "Interface en français et en anglais, thèmes jour et nuit, démo intégrée, documentation et intégration continue sur GitHub"
      ],
      tools: ['Python', 'Docker Compose', 'Prometheus', 'Grafana', 'Loki', 'Zabbix', 'SNMP', 'JavaScript'],
      result: "Une carte de l'infrastructure toujours à jour, une seule chaîne d'alertes, et un outil publié en open source que j'utilise au quotidien dans ma mission et sur mon homelab.",
      skills: ['Gérer le patrimoine informatique', 'Répondre aux incidents', 'Travailler en mode projet', 'Développer la présence en ligne'],
      links: [{ href: 'https://github.com/B2ZO0/netcockpit', label: 'Voir sur GitHub', ic: 'github' }, { href: '#netcockpit', label: 'Captures', ic: 'radar', local: true }]
    },
    {
      id: 'att-deploiement', c: 'attineos', g: ['entreprise'], icon: 'monitor', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Déploiement automatique des postes (WDS, MDT, HP BCU)',
      sum: "Un PC démarre sur le réseau et ressort prêt : Windows, pilotes, applications, domaine et réglages du BIOS.",
      contexte: "Dans une usine, un poste en panne peut bloquer un atelier. Préparer un PC à la main prenait du temps et le résultat changeait selon la personne. Le serveur de déploiement prépare tous les postes de la même façon.",
      actions: ["Démarrage des PC sur le réseau (PXE) grâce à WDS", "Installation automatique de Windows 11 avec une séquence de tâches MDT", "Pilotes rangés par modèle de PC", "Jonction automatique au domaine dans la bonne unité d'organisation", "Réglages BIOS des HP appliqués par script avec HP BCU", "Procédure écrite pour toute l'équipe"],
      tools: ['WDS', 'MDT', 'Windows 11', 'HP BCU', 'PowerShell'],
      result: "Des postes prêts beaucoup plus vite, tous configurés pareil, sans réglage BIOS à la main.",
      skills: ['Mettre à disposition des services', 'Gérer le patrimoine informatique']
    },
    {
      id: 'att-vaultwarden', c: 'attineos', g: ['entreprise'], icon: 'key', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Coffre-fort de mots de passe Vaultwarden',
      sum: "Remplacer les mots de passe notés dans des fichiers par un coffre-fort sécurisé, en HTTPS, avec des accès par personne.",
      contexte: "Les mots de passe de l'équipe étaient répartis dans plusieurs fichiers : pas sûr, et impossible de savoir qui a accès à quoi. Vaultwarden est un coffre compatible avec les applications Bitwarden, hébergé en interne.",
      actions: ["Installation dans un conteneur Docker sur un serveur Debian", "Accès en HTTPS derrière un reverse proxy", "Comptes créés sur invitation uniquement", "Mots de passe rangés par collections (réseau, serveurs, applications…)", "Double authentification activée", "Sauvegarde automatique et restauration testée"],
      tools: ['Vaultwarden', 'Docker', 'Debian', 'HTTPS'],
      result: "Des mots de passe centralisés et protégés, et un accès qu'on retire en un clic.",
      skills: ['Mettre à disposition des services']
    },
    {
      id: 'att-3cx', c: 'attineos', g: ['entreprise'], icon: 'phone', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Téléphonie IP 3CX et VLAN voix',
      sum: "Gérer le standard 3CX et faire passer la voix sur son propre VLAN pour des appels clairs.",
      contexte: "Le téléphone est très utilisé dans l'usine : production, maintenance, logistique, accueil. Les postes doivent marcher dès qu'on les branche et les appels ne doivent pas couper quand le réseau est chargé.",
      actions: ["Création et configuration des postes dans 3CX", "Groupes d'appel et files d'attente par service", "Horaires d'ouverture et renvois", "VLAN voix sur les ports des switchs (téléphone + PC sur la même prise)", "Priorité donnée à la voix (QoS)", "Sauvegardes et mises à jour du serveur"],
      tools: ['3CX', 'Téléphones IP', 'VLAN', 'QoS'],
      result: "Les téléphones prennent le bon réseau dès le branchement et les appels restent clairs.",
      skills: ['Mettre à disposition des services', 'Répondre aux incidents']
    },
    {
      id: 'att-ad', c: 'attineos', g: ['entreprise'], icon: 'users', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Organisation de l\'Active Directory et des GPO',
      sum: "Un annuaire clair, des droits donnés par groupes, et les bons réglages appliqués aux postes par GPO.",
      contexte: "Avec le temps, un annuaire devient désordonné. Le but : comprendre en quelques secondes ce qui s'applique à un poste ou à un utilisateur.",
      actions: ["Arborescence claire d'unités d'organisation (bureaux, ateliers, utilisateurs, groupes)", "Droits sur les partages donnés par groupes", "GPO pour les lecteurs réseau et les imprimantes", "GPO de sécurité, restrictions sur les postes d'atelier", "Tests sur quelques postes avant de généraliser", "Vérification avec gpresult et sauvegarde des GPO"],
      tools: ['Active Directory', 'GPO', 'Windows Server', 'PowerShell'],
      result: "Un annuaire lisible et des problèmes de GPO réglés en quelques minutes.",
      skills: ['Gérer le patrimoine informatique', 'Mettre à disposition des services']
    },
    {
      id: 'att-zebra', c: 'attineos', g: ['entreprise'], icon: 'printer', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Imprimantes thermiques Zebra et MPrint en production',
      sum: "Paramétrer et dépanner les imprimantes d'étiquettes des lignes de production.",
      contexte: "Sur les lignes, les étiquettes servent à identifier et suivre les produits : une imprimante en panne ralentit la production. Il faut des réglages identiques partout et un remplacement rapide.",
      actions: ["Adresse IP fixe et nommage clair pour chaque imprimante", "Installation des pilotes et des files d'impression", "Réglages identiques (vitesse, contraste, type d'étiquette)", "Calibrage après un changement de rouleau", "Fiche de remplacement rapide pour l'équipe"],
      tools: ['Zebra', 'MPrint', 'Impression réseau', 'Windows Server'],
      result: "Moins d'arrêts sur les lignes et des imprimantes remplacées rapidement.",
      skills: ['Répondre aux incidents', 'Gérer le patrimoine informatique']
    },
    {
      id: 'arm-postes', c: 'armatis', g: ['entreprise'], icon: 'monitor', tag: 'Armatis · alternance', date: '2024 → 2026',
      title: 'Préparation et déploiement des postes Windows 11',
      sum: "Préparer les postes des nouveaux arrivants et remplacer le matériel des conseillers.",
      contexte: "Sur un site de plusieurs centaines de personnes, il y a sans cesse des arrivées, des départs et du matériel à remplacer. Les conseillers ont besoin d'un poste prêt tout de suite.",
      actions: ["Installation et configuration de Windows 11", "Outils métiers, téléphonie et bureautique", "Jonction au domaine et vérification des GPO", "Comptes dans l'Active Directory", "Remise du poste et explications à l'utilisateur", "Suivi du matériel et du stock"],
      tools: ['Windows 11', 'Active Directory', 'GPO', 'Téléphonie IP'],
      result: "Des postes prêts à l'emploi et une bonne connaissance du parc.",
      skills: ['Mettre à disposition des services', 'Gérer le patrimoine informatique']
    },
    {
      id: 'arm-reseau', c: 'armatis', g: ['entreprise'], icon: 'cable', tag: 'Armatis · alternance', date: '2024 → 2026',
      title: 'Réseau du site : brassage, VLAN et dépannage',
      sum: "Brasser, vérifier les ports des switchs et trouver pourquoi un poste ou un téléphone n'a plus de réseau.",
      contexte: "Beaucoup d'incidents viennent du réseau : câble débranché, mauvais VLAN, prise non brassée. Il faut diagnostiquer vite pour que les conseillers reprennent leurs appels.",
      actions: ["Brassage dans la baie", "Tests de câbles et de connexion", "Vérification des ports et des VLAN", "Diagnostic avec ping, ipconfig, tracert", "Suivi avec l'équipe réseau si besoin"],
      tools: ['Switchs', 'VLAN', 'Câblage RJ45'],
      result: "Des incidents réseau réglés sur place, rapidement.",
      skills: ['Répondre aux incidents']
    },
    {
      id: 'stage-chauvin', c: 'stage', g: ['entreprise'], icon: 'shield', tag: 'Stage · Chauvin-Arnoux Group', date: 'Mars → avril 2023',
      title: 'Déploiement avec MDT, chiffrement de disques et RAID',
      sum: "Mon premier contact avec le déploiement automatique, le chiffrement des disques et les VLAN.",
      contexte: "Stage de deux mois au service informatique de Chauvin-Arnoux Group, à Reux, pendant mon Bac Pro.",
      actions: ["Chiffrement et sécurisation des disques", "Mise en route d'un RAID", "Déploiement de postes avec MDT", "Configuration de VLAN sur les switchs", "Support N1 et N2"],
      tools: ['MDT', 'Chiffrement', 'RAID', 'VLAN'],
      result: "Une première vraie expérience qui m'a donné envie de continuer dans l'infrastructure.",
      skills: ['Mettre à disposition des services']
    },
    {
      id: 'stage-ccf', c: 'stage', g: ['entreprise'], icon: 'chart', tag: 'Stage · CC Cœur Côte Fleurie', date: 'Nov. → déc. 2022',
      title: 'Installation de Zabbix pour superviser le réseau',
      sum: "Zabbix installé pour surveiller les équipements réseau de la communauté de communes.",
      contexte: "Stage de deux mois à Deauville. C'est ici que j'ai découvert la supervision, qui m'a mené à mon projet E6 puis à NetCockpit.",
      actions: ["Installation et configuration de Zabbix", "Ajout des équipements réseau", "Installation de postes", "Brassage de prises réseau"],
      tools: ['Zabbix', 'Linux', 'Réseau'],
      result: "Un outil de supervision en place, et le point de départ de mes projets de supervision.",
      skills: ['Gérer le patrimoine informatique']
    },
    {
      id: 'e6-ansible', c: 'bts', g: ['bts'], icon: 'cog', tag: 'BTS SIO · épreuve E6', date: 'BTS SIO · 2e année',
      title: 'Déployer des serveurs avec Ansible sur Proxmox',
      sum: "Une seule commande pour installer et configurer trois serveurs de jeu Minecraft en même temps, sans rien faire à la main.",
      img: 'ansible-playbook.png', imgAlt: 'Exécution du playbook Ansible',
      contexte: "Installer plusieurs serveurs à la main prend du temps et on oublie toujours une étape. Le but : décrire l'installation dans un fichier et la rejouer autant de fois qu'on veut, avec toujours le même résultat.",
      actions: ["Trois machines virtuelles Debian sur Proxmox VE", "Ansible sur une machine de contrôle, connexion SSH par clé", "Inventaire des serveurs en YAML", "Playbook : Java, utilisateur dédié, fichiers, service", "Modules apt, user, copy et systemd", "Relancer le playbook ne change rien si tout est déjà en place"],
      tools: ['Ansible', 'Proxmox VE', 'Debian', 'SSH', 'YAML'],
      result: "Les trois serveurs installés en une commande, recréables à l'identique.",
      skills: ['Mettre à disposition des services', 'Travailler en mode projet'],
      links: [{ href: 'Ansible_E6.docx', label: 'Dossier E6 (.docx)', ic: 'file', dl: true }]
    },
    {
      id: 'e6-zabbix', c: 'bts', g: ['bts'], icon: 'chart', tag: 'BTS SIO · épreuve E6', date: 'BTS SIO · né d\'un besoin chez Armatis',
      title: 'Serveur de supervision Zabbix + Grafana',
      sum: "Surveiller les serveurs (processeur, mémoire, disque, réseau) et recevoir une alerte avant que la panne ne gêne les utilisateurs.",
      img: 'grafana-dashboard.png', imgAlt: 'Tableau de bord Grafana',
      contexte: "Chez Armatis, on découvrait souvent un problème quand un utilisateur appelait. J'ai monté une supervision complète sur Debian 12 pour mon projet E6.",
      actions: ["Zabbix 7.0 sur Debian 12 avec Apache, PHP et MariaDB", "Agent Zabbix sur les serveurs", "Collecte processeur, mémoire, disque et réseau", "Alertes sur seuil ou service arrêté", "Grafana connecté à Zabbix", "Tableaux de bord lisibles d'un coup d'œil"],
      tools: ['Zabbix 7.0', 'Grafana', 'Debian 12', 'MariaDB'],
      result: "Des serveurs surveillés en permanence et des alertes avant les utilisateurs.",
      skills: ['Gérer le patrimoine informatique', 'Répondre aux incidents'],
      links: [{ href: 'Grafana-Zabbix_E6.docx', label: 'Dossier E6 (.docx)', ic: 'file', dl: true }]
    },
    {
      id: 'bts-glpi', c: 'bts', g: ['bts'], icon: 'list', tag: 'BTS SIO · atelier', date: 'BTS SIO',
      title: 'Gestion de parc et tickets avec GLPI',
      sum: "GLPI sur Debian pour l'inventaire et les tickets, avec remontée automatique des postes.",
      contexte: "En atelier, il fallait un outil de gestion de parc et d'assistance comme en entreprise.",
      actions: ["Apache, PHP et MariaDB sur Debian", "Installation de GLPI, HTTPS, comptes par défaut changés", "Agent GLPI sur les postes pour l'inventaire automatique", "Connexion à l'Active Directory", "Catégories de tickets et test d'un parcours complet"],
      tools: ['GLPI', 'Debian', 'MariaDB', 'Active Directory'],
      result: "Un inventaire à jour sans saisie et un outil de tickets prêt à l'emploi.",
      skills: ['Gérer le patrimoine informatique', 'Répondre aux incidents']
    },
    {
      id: 'bts-pfsense', c: 'bts', g: ['bts'], icon: 'shield', tag: 'BTS SIO · atelier', date: 'BTS SIO',
      title: 'Pare-feu pfSense avec VLAN, portail captif et VPN',
      sum: "Séparer le réseau en VLAN derrière pfSense, filtrer, isoler les invités et donner un accès VPN.",
      contexte: "Sur la maquette, tout le monde pouvait parler à tout le monde. Le but : séparer les usages et n'autoriser que le nécessaire.",
      actions: ["pfSense en machine virtuelle", "VLAN administration, serveurs, DMZ, postes et invités", "Règles : tout bloqué sauf l'utile", "Portail captif pour les invités", "OpenVPN pour l'accès à distance", "Test de chaque règle"],
      tools: ['pfSense', 'VLAN', 'OpenVPN', 'Portail captif'],
      result: "Un réseau segmenté, des invités isolés et un accès distant sécurisé.",
      skills: ['Mettre à disposition des services', 'Travailler en mode projet']
    },
    {
      id: 'bts-wazuh', c: 'bts', g: ['bts'], icon: 'shield', tag: 'BTS SIO · atelier', date: 'BTS SIO',
      title: 'Détection d\'intrusions avec Wazuh',
      sum: "Centraliser les journaux de sécurité des serveurs Windows et Linux, et être alerté en cas d'attaque.",
      contexte: "Sur la maquette, les journaux étaient éparpillés et personne ne les lisait. Wazuh les rassemble et met en avant ce qui est anormal.",
      actions: ["Installation de Wazuh sur Debian", "Agents sur les serveurs Windows et Linux", "Journaux de sécurité Windows et Sysmon", "Alerte quand un compte est ajouté aux administrateurs du domaine", "Blocage automatique d'une attaque par force brute SSH", "Tests en provoquant chaque détection"],
      tools: ['Wazuh', 'Debian', 'Windows Server', 'Sysmon'],
      result: "Les événements de sécurité au même endroit et des alertes vérifiées.",
      skills: ['Répondre aux incidents', 'Gérer le patrimoine informatique']
    },
    {
      id: 'bts-galera', c: 'bts', g: ['bts'], icon: 'database', tag: 'BTS SIO · atelier', date: 'BTS SIO',
      title: 'Base de données toujours disponible (MariaDB Galera)',
      sum: "Trois serveurs MariaDB qui restent identiques, pour qu'une application continue de marcher si un serveur tombe.",
      contexte: "Une seule base de données, c'est un seul point de panne. L'atelier portait sur la haute disponibilité.",
      actions: ["MariaDB et Galera sur trois serveurs Debian", "Réplication entre les trois serveurs", "Une adresse unique pour l'application (HAProxy + keepalived)", "Tests : arrêt d'un serveur, coupure réseau, redémarrage complet", "Procédure de remise en route"],
      tools: ['MariaDB', 'Galera', 'HAProxy', 'Debian'],
      result: "L'application continue de fonctionner quand un serveur s'arrête.",
      skills: ['Mettre à disposition des services', 'Travailler en mode projet']
    },
    {
      id: 'perso-lab', c: 'perso', g: ['perso'], icon: 'server', tag: 'Homelab', date: 'En continu',
      title: 'Mon homelab Proxmox',
      sum: "Un serveur Proxmox chez moi pour tester avant de faire en vrai : Active Directory, Linux, supervision, déploiement, NetCockpit.",
      contexte: "Pour progresser, il faut pouvoir casser et recommencer sans risque. Mon lab me sert à m'entraîner et à préparer chaque nouvelle version de NetCockpit.",
      actions: ["Proxmox VE sur un PC reconditionné", "VM Windows Server et Debian, domaine Active Directory de test", "Réseau découpé en VLAN derrière pfSense", "Sauvegardes avec Proxmox Backup Server", "Snapshots avant chaque test", "NetCockpit pour superviser tout le lab"],
      tools: ['Proxmox VE', 'pfSense', 'Windows Server', 'Debian', 'PBS'],
      result: "Un terrain d'entraînement complet, sans risque pour une vraie infrastructure.",
      skills: ['Organiser son développement professionnel']
    },
    {
      id: 'perso-docker', c: 'perso', g: ['perso'], icon: 'box', tag: 'Homelab', date: 'En continu',
      title: 'Services auto-hébergés sous Docker',
      sum: "Quelques services perso dans des conteneurs, derrière Nginx Proxy Manager avec des certificats HTTPS automatiques.",
      contexte: "Je voulais apprendre Docker sur des services que j'utilise vraiment, proprement : un dossier par service et un seul point d'entrée en HTTPS.",
      actions: ["Un fichier Docker Compose par service", "Nginx Proxy Manager comme seul point d'entrée", "Certificats Let's Encrypt automatiques", "Interface d'administration accessible seulement en local", "Mises à jour des images après lecture des changements"],
      tools: ['Docker', 'Docker Compose', 'Nginx Proxy Manager', "Let's Encrypt"],
      result: "Des services propres, faciles à mettre à jour et à sauvegarder.",
      skills: ['Mettre à disposition des services', 'Organiser son développement professionnel']
    },
    {
      id: 'perso-fichiers', c: 'perso', g: ['perso'], icon: 'hdd', tag: 'Homelab', date: 'En continu',
      title: 'Serveur de fichiers Windows (DFS, quotas, clichés)',
      sum: "Un serveur de fichiers comme en entreprise : partages par service, quotas, versions précédentes et droits par groupes.",
      contexte: "Pour bien comprendre les partages que je gère au travail, j'en ai monté un complet sur mon lab.",
      actions: ["Partages regroupés sous un seul chemin (DFS)", "Droits NTFS par groupes, chacun ne voit que ses dossiers", "Quotas par service avec FSRM", "Clichés instantanés pour restaurer un fichier", "Lecteurs connectés par GPO"],
      tools: ['Windows Server', 'DFS', 'FSRM', 'NTFS', 'GPO'],
      result: "Un serveur de fichiers propre et une restauration de fichier en quelques clics.",
      skills: ['Mettre à disposition des services']
    },
    {
      id: 'perso-portfolio', c: 'perso', g: ['perso'], icon: 'globe', tag: 'Projet perso · web', date: '2026',
      title: 'Ce portfolio, enzomarechal.fr',
      sum: "Le site que tu regardes : HTML, CSS et JavaScript sans framework, hébergé sur GitHub Pages avec mon nom de domaine.",
      contexte: "Je voulais un site à mon image, dans le même style que NetCockpit, qui fonctionne même sans connexion et sans dépendance externe.",
      actions: ["Pages en HTML, CSS et JavaScript, sans bibliothèque", "Thèmes jour et nuit, adapté au téléphone", "Hébergement GitHub Pages et nom de domaine personnel", "Fil de veille en direct (CERT-FR, IT-Connect)"],
      tools: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
      result: "Un portfolio rapide, lisible et facile à mettre à jour.",
      skills: ['Développer la présence en ligne'],
      links: [{ href: 'https://github.com/B2ZO0/B2ZO0.github.io', label: 'Code source', ic: 'github' }]
    },
    {
      id: 'bac-cisco', c: 'bacpro', g: ['perso'], icon: 'network', tag: 'Bac Pro SN · TP', date: '2020 → 2023',
      title: 'Maquette réseau Cisco et câblage',
      sum: "Câbler une baie, sertir des câbles RJ45, puis configurer switchs et routeur Cisco avec des VLAN.",
      contexte: "Au Bac Pro, les TP partaient du physique (câbles, baie, prises) jusqu'à la configuration des équipements.",
      actions: ["Montage et câblage d'une baie", "Sertissage RJ45 et tests de continuité", "VLAN sur des switchs Cisco", "Trunk et routage entre VLAN", "Mise en service d'une borne Wi-Fi"],
      tools: ['Cisco', 'VLAN', 'Câblage RJ45', 'Wi-Fi'],
      result: "Les bases du réseau, que j'utilise tous les jours.",
      skills: ['Mettre à disposition des services']
    }
  ];

  var state = { group: 'all', q: '' };

  function renderProjects() {
    var grid = $('#projectsGrid'), bar = $('#filters');
    bar.innerHTML = GROUPS.map(function (g, i) {
      var n = g.k === 'all' ? PROJECTS.length : PROJECTS.filter(function (p) { return p.g.indexOf(g.k) > -1; }).length;
      return '<button type="button" data-g="' + g.k + '" class="' + (i ? '' : 'is-on') + '" aria-pressed="' + (!i) + '">' + esc(g.label) + '<span>' + n + '</span></button>';
    }).join('');
    grid.innerHTML = PROJECTS.map(function (p) {
      var shot = p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<span class="proj__glyph">' + icon(p.icon) + '</span>';
      return '<article class="panel proj reveal c-' + p.c + (p.featured ? ' is-featured' : '') + '" tabindex="0" role="button" data-id="' + p.id + '" aria-label="' + esc('Ouvrir la fiche : ' + p.title) + '">' +
        '<div class="proj__shot">' + shot + '<span class="proj__tag"><span class="lamp"></span>' + esc(p.tag) + '</span></div>' +
        '<div class="proj__body"><span class="proj__date">' + esc(p.date) + '</span><h3>' + esc(p.title) + '</h3>' +
        '<p class="proj__sum">' + esc(p.sum) + '</p>' +
        '<ul class="proj__tools">' + p.tools.slice(0, p.featured ? 8 : 4).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></article>';
    }).join('');
    $$('[data-count-projects]').forEach(function (el) { el.setAttribute('data-count', PROJECTS.length); el.textContent = PROJECTS.length; });

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-g]');
      if (!b) return;
      state.group = b.getAttribute('data-g');
      $$('button', bar).forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      applyFilter();
    });
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.proj');
      if (c) openProject(c.getAttribute('data-id'), c);
    });
    grid.addEventListener('keydown', function (e) {
      var c = e.target.closest('.proj');
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProject(c.getAttribute('data-id'), c); }
    });
  }

  function applyFilter() {
    var q = norm(state.q).trim();
    var shown = 0;
    PROJECTS.forEach(function (p) {
      var card = $('.proj[data-id="' + p.id + '"]');
      var okG = state.group === 'all' || p.g.indexOf(state.group) > -1;
      var hay = norm([p.title, p.sum, p.tag, p.tools.join(' '), p.actions.join(' ')].join(' '));
      var okQ = !q || q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
      var show = okG && okQ;
      card.classList.toggle('is-hidden', !show);
      if (show) { shown++; card.classList.add('is-visible'); }
    });
    $('#projCount').textContent = shown + ' projet' + (shown > 1 ? 's' : '') + (q ? ' pour « ' + state.q.trim() + ' »' : '');
    $('#projEmpty').hidden = shown > 0;
  }

  /* ---------------------------------------------------------
     Fiche projet
     --------------------------------------------------------- */
  var modal = $('#modal'), lastFocus = null;
  function openProject(id, from) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    lastFocus = from || document.activeElement;
    var h = '<article class="c-' + p.c + '"><header class="mp__head"><span class="badge b-magenta">' + esc(p.tag) + '</span>' +
      '<h2 id="modalTitle">' + esc(p.title) + '</h2><p>' + esc(p.date) + ' · ' + esc(p.tools.join(' · ')) + '</p></header><div class="mp__body">' +
      '<section><h3><i data-i="target"></i>Le contexte</h3><p>' + esc(p.contexte) + '</p></section>' +
      '<section><h3><i data-i="list"></i>Ce que j\'ai fait</h3><ol class="mp__steps">' + p.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></section>' +
      (p.img ? '<figure class="mp__img"><img src="' + esc(p.img) + '" alt="' + esc(p.imgAlt) + '" loading="lazy"><figcaption>' + esc(p.imgAlt) + '</figcaption></figure>' : '') +
      '<section class="mp__result"><h3><i data-i="check"></i>Le résultat</h3><p>' + esc(p.result) + '</p></section>' +
      '<section><h3><i data-i="star"></i>Compétences BTS SIO mobilisées</h3><ul class="chips">' + p.skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>' +
      (p.links ? '<div class="mp__links">' + p.links.map(function (l) {
        var ext = /^https?:/.test(l.href);
        return '<a class="btn btn--sm' + (ext ? ' btn--sig' : '') + '" href="' + esc(l.href) + '"' + (l.dl ? ' download' : '') + (ext ? ' target="_blank" rel="noopener"' : '') + (l.local ? ' data-close' : '') + '><i data-i="' + l.ic + '"></i>' + esc(l.label) + '</a>';
      }).join('') + '</div>' : '') + '</div></article>';
    $('#modalContent').innerHTML = h;
    drawIcons(modal);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var box = $('.modal__box', modal);
    box.scrollTop = 0;
    box.focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });

  /* ---------------------------------------------------------
     Navigation : rail, titre de la barre, menu mobile, recherche
     --------------------------------------------------------- */
  function initNav() {
    var rail = $('#rail'), burger = $('#burger'), links = $$('#railNav a'), title = $('#topTitle');
    burger.addEventListener('click', function () {
      var open = rail.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    links.forEach(function (a) { a.addEventListener('click', function () { rail.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('click', function (e) {
      if (rail.classList.contains('is-open') && !e.target.closest('#rail') && !e.target.closest('#burger')) rail.classList.remove('is-open');
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var id = x.target.id;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
        title.textContent = x.target.getAttribute('data-title') || '';
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('section.page').forEach(function (s) { io.observe(s); });
  }

  function initSearch() {
    var input = $('#search');
    var jump = true;
    input.addEventListener('input', function () {
      state.q = input.value;
      applyFilter();
      if (jump && input.value.trim()) {
        jump = false;
        $('#projets').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }
      if (!input.value.trim()) jump = true;
    });
    document.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
      if (e.key === '/' && !typing && modal.hidden) { e.preventDefault(); input.focus(); }
      if (e.key === 'Escape') {
        if (!modal.hidden) closeModal();
        else if (document.activeElement === input) { input.value = ''; state.q = ''; applyFilter(); input.blur(); }
      }
      if (e.key === 'Tab' && !modal.hidden) {
        var f = $$('a[href], button', modal);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------------------------------------------------
     Apparition au défilement + compteurs
     --------------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-visible'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 60 + 'ms'; io.observe(el); });
  }
  function initCounters() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        io.unobserve(x.target);
        var el = x.target, end = +el.getAttribute('data-count'), t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 900);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Veille : flux RSS (avec repli si le service ne répond pas)
     --------------------------------------------------------- */
  var FEEDS = {
    cert: { url: 'https://www.cert.ssi.gouv.fr/alerte/feed/', site: 'https://www.cert.ssi.gouv.fr/alerte/', name: 'CERT-FR', lamp: 'up' },
    itc: { url: 'https://www.it-connect.fr/feed/', site: 'https://www.it-connect.fr/', name: 'IT-Connect', lamp: 'info' }
  };
  var cache = {};
  function showFeed(k) {
    var list = $('#feedList'), f = FEEDS[k];
    var fail = '<li class="feed__msg">Flux indisponible pour le moment. À lire directement sur <a href="' + f.site + '" target="_blank" rel="noopener">' + f.name + '</a>.</li>';
    function draw(items) {
      if (!items || !items.length) { list.innerHTML = fail; return; }
      list.innerHTML = items.slice(0, 6).map(function (it) {
        var d = new Date(String(it.pubDate || '').replace(' ', 'T'));
        return '<li><a href="' + esc(it.link) + '" target="_blank" rel="noopener"><span class="lamp ' + f.lamp + '"></span><strong>' + esc(it.title) + '</strong><time>' +
          (isNaN(d) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })) + '</time></a></li>';
      }).join('');
    }
    if (cache[k]) return draw(cache[k]);
    list.innerHTML = '<li class="feed__msg">Chargement…</li>';
    if (!window.fetch) { list.innerHTML = fail; return; }
    var done = false;
    setTimeout(function () { if (!done) list.innerHTML = fail; }, 8000);
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(f.url))
      .then(function (r) { return r.json(); })
      .then(function (d) { done = true; if (d && d.status === 'ok') { cache[k] = d.items; draw(d.items); } else list.innerHTML = fail; })
      .catch(function () { done = true; list.innerHTML = fail; });
  }
  function initFeeds() {
    var tabs = $$('#feedTabs button');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.toggle('is-on', x === b); });
        showFeed(b.getAttribute('data-feed'));
      });
    });
    var box = $('.feeds');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); showFeed('cert'); } }, { rootMargin: '300px' });
      io.observe(box);
    } else showFeed('cert');
  }

  /* ---------------------------------------------------------
     Contact
     --------------------------------------------------------- */
  var tt;
  function toast(m) {
    var t = $('#toast');
    t.textContent = m;
    t.classList.add('is-on');
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return Promise.resolve(ok);
  }
  function initContact() {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () { copy(b.getAttribute('data-copy')).then(function (ok) { toast(ok ? 'Copié' : 'Copie impossible'); }); });
    });
    var form = $('#contactForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('input, textarea', form).forEach(function (f) { var bad = !f.value.trim(); f.classList.toggle('is-invalid', bad); if (bad) ok = false; });
      $('#formError').textContent = ok ? '' : 'Merci de remplir tous les champs.';
      if (!ok) return;
      window.location.href = 'mailto:marechal.enzo27@gmail.com?subject=' + encodeURIComponent(form.sujet.value.trim() + ' — ' + form.nom.value.trim()) +
        '&body=' + encodeURIComponent(form.message.value.trim() + '\n\n' + form.nom.value.trim());
      toast('Ouverture de ta messagerie…');
    });
  }

  /* ---------------------------------------------------------
     Démarrage
     --------------------------------------------------------- */
  function boot() {
    renderSkills();
    renderProjects();
    drawSkillTopo();
    drawIcons(document);
    initTheme();
    initNav();
    initSearch();
    initNetCockpit();
    initReveal();
    initCounters();
    initFeeds();
    initContact();
    applyFilter();
    window.__portfolio = { projects: PROJECTS, open: openProject };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
