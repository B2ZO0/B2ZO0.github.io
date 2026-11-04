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
  var SKILLS = [
    { t: 'Systèmes Windows', ic: 'monitor', d: "Installer, configurer et dépanner les postes et les serveurs Windows.", l: ['Windows 10 et 11', 'Windows Server', 'Active Directory : comptes, groupes, droits', 'GPO : mise en place et dépannage', 'DNS et DHCP', 'PowerShell (scripts simples)'] },
    { t: 'Déploiement & parc', ic: 'hdd', d: "Préparer les postes en série et tenir le parc à jour.", l: ['Serveur MDT et boot réseau (WDS)', 'Pilotes par modèle de PC', 'Réglages BIOS HP avec HP BCU', 'Migrations de logiciels', 'Inventaire avec GLPI', 'Outil RMM'] },
    { t: 'Réseau', ic: 'network', d: "Câbler, brasser, configurer les switchs et séparer le réseau.", l: ['Câblage et brassage en baie', 'Configuration de switchs', 'VLAN', 'Routage', 'Wi-Fi', 'Pare-feu pfSense et VPN'] },
    { t: 'Maintenance & support', ic: 'tool', d: "Faire en sorte que les utilisateurs puissent travailler.", l: ['Support utilisateurs N1 à N3', 'Diagnostic et remplacement de matériel', 'Arrivées et départs (comptes, postes, téléphone 3CX)', 'Gestion des tickets', 'Rédaction de procédures'] },
    { t: 'Sécurité', ic: 'shield', d: "Réduire les risques au quotidien, sans compliquer la vie des utilisateurs.", l: ['Gestionnaire de mots de passe (Vaultwarden)', 'GPO de sécurité', 'Droits au plus juste', 'Sauvegardes et restauration', 'Veille CERT-FR', 'Root-Me'] },
    { t: 'Linux, virtualisation & supervision', ic: 'server', d: "Monter des serveurs et des VM, et les surveiller.", l: ['Debian', 'Proxmox VE', 'Docker', 'Zabbix et Grafana', 'Ansible (bases)', 'VMware ESXi et Hyper-V (notions)'] }
  ];
  function renderSkills() {
    var box = $('#skills');
    box.innerHTML = SKILLS.map(function (s) {
      return '<article class="panel skill reveal"><div class="skill__head"><i data-i="' + s.ic + '"></i><h3>' + esc(s.t) + '</h3></div>' +
        '<p>' + esc(s.d) + '</p><ul class="skill__list">' + s.l.map(function (x) {
          return '<li><span class="lamp up"></span>' + esc(x) + '</li>';
        }).join('') + '</ul></article>';
    }).join('');
  }

  /* ---------------------------------------------------------
     Bulles de compétences
     --------------------------------------------------------- */
  var BUBBLES = [
    ['Active Directory', 3, 'violet'], ['GPO', 3, 'magenta'], ['Déploiement MDT', 3, 'violet'], ['Maintenance', 3, 'up'],
    ['Réseau & VLAN', 3, 'info'], ['Support N1-N3', 2, 'up'], ['Windows Server', 2, 'violet'], ['Vaultwarden', 2, 'magenta'],
    ['Migrations', 2, 'up'], ['Câblage & baies', 2, 'info'], ['Matériel', 1, 'up'], ['PowerShell', 1, 'violet'],
    ['Proxmox', 1, 'info'], ['Debian', 1, 'info'], ['Zabbix', 1, 'magenta'], ['Sauvegardes', 1, 'up']
  ];
  function drawSkillTopo() {
    var box = $('#skillTopo');
    if (!box) return;
    box.innerHTML = '<div class="bubbles">' + BUBBLES.map(function (b, i) {
      return '<span class="bubble bubble--' + b[1] + ' bubble--' + b[2] + '" style="animation-delay:-' + (i * 0.7).toFixed(1) + 's">' + esc(b[0]) + '</span>';
    }).join('') + '</div>';
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
  var BLOCKS = [
    { k: 'phare', title: 'À la une', sub: 'Mon projet perso open source' },
    { k: 'entreprise', title: 'En entreprise', sub: 'Ma mission chez Attineos et mes stages' },
    { k: 'bts', title: 'BTS SIO option SISR', sub: 'AFTEC Caen · 2024 → 2026' },
    { k: 'bacpro', title: 'Bac Pro Systèmes Numériques option C (RISC)', sub: 'Lycée Charles Tellier · 2020 → 2023' },
    { k: 'perso', title: 'Projets perso & homelab', sub: 'Ce que je construis chez moi' }
  ];
  var GROUPS = [
    { k: 'all', label: 'Tous' },
    { k: 'entreprise', label: 'Entreprise' },
    { k: 'bts', label: 'BTS SIO' },
    { k: 'bacpro', label: 'Bac Pro SN' },
    { k: 'perso', label: 'Perso & homelab' }
  ];
  var B1 = {
    patrimoine: 'Gérer le patrimoine informatique', incidents: 'Répondre aux incidents', service: 'Mettre à disposition des services',
    projet: 'Travailler en mode projet', web: 'Développer la présence en ligne', dev: 'Organiser son développement professionnel'
  };
  var BAC = {
    install: 'Installer et câbler un réseau', config: 'Configurer les équipements', recette: 'Tester et faire la recette',
    depannage: 'Diagnostiquer et dépanner', doc: 'Documenter et présenter son travail'
  };

  var PROJECTS = [
    /* ===================== PROJET PHARE ===================== */
    {
      id: 'netcockpit', block: 'phare', g: ['perso', 'entreprise'], featured: true, c: 'netcockpit', icon: 'radar',
      tag: 'Projet perso · open source', date: '2026 · homelab et mission',
      title: 'NetCockpit : un tableau de bord de supervision du réseau',
      sum: "Un tableau de bord de supervision : il découvre les équipements du réseau, affiche une carte en direct et regroupe les alertes. Je l'utilise sur mon homelab et dans ma mission.",
      img: 'img/netcockpit-topology.jpg', imgAlt: 'Carte du réseau affichée par NetCockpit (données de démonstration)',
      contexte: "Dans beaucoup d'entreprises, le réseau est géré par un prestataire et l'équipe informatique n'a pas accès aux switchs. Résultat : pas de schéma à jour et peu de visibilité. Je voulais un outil qui rassemble ce à quoi on a accès. J'ai assemblé des outils open source reconnus, puis je l'ai testé sur mon homelab avant de l'utiliser en mission.",
      actions: [
        "Définir le besoin à partir de ce que je vis en mission",
        "Choisir les briques : Prometheus, Grafana, Loki, Zabbix, Alertmanager, le tout sous Docker",
        "Développer l'interface et les scripts d'installation, avec des outils d'assistance au code",
        "Tester sur mon homelab Proxmox, puis sur le réseau de ma mission",
        "Vérifier que la carte du réseau et les alertes correspondent à la réalité",
        "Rédiger la documentation et publier le projet sur GitHub"
      ],
      tools: ['Docker Compose', 'Prometheus', 'Grafana', 'Zabbix', 'Loki', 'SNMP', 'Python'],
      result: "Un outil qui me donne une vue d'ensemble du réseau et des alertes au même endroit. Surtout, j'ai beaucoup appris sur la supervision en le testant.",
      skills: [B1.patrimoine, B1.incidents, B1.projet, B1.dev],
      links: [{ href: 'https://github.com/B2ZO0/netcockpit', label: 'Voir sur GitHub', ic: 'github' }, { href: '#netcockpit', label: 'Captures', ic: 'radar', local: true }]
    },

    /* ===================== ENTREPRISE ===================== */
    {
      id: 'att-deploiement', block: 'entreprise', g: ['entreprise'], c: 'attineos', icon: 'monitor', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Déploiement d\'un serveur MDT pour automatiser l\'installation du parc',
      sum: "Un PC démarre sur le réseau et Windows s'installe tout seul, avec les bons pilotes, les logiciels et les réglages du BIOS.",
      contexte: "Dans une usine, un poste en panne peut bloquer un atelier, et il y a régulièrement des postes à installer ou à remplacer. Préparer un PC à la main prenait du temps et le résultat changeait selon la personne qui le faisait.",
      actions: [
        "Installation des outils Microsoft gratuits (Windows ADK et WinPE) puis de MDT sur un serveur Windows",
        "Création du partage de déploiement et import de Windows 11",
        "Classement des pilotes par modèle de PC, pour que chaque poste reçoive les siens",
        "Écriture d'une séquence de tâches : installation de Windows, pilotes, logiciels, jonction au domaine",
        "Démarrage des PC sur le réseau grâce au rôle WDS (boot PXE)",
        "Réglages du BIOS des PC HP appliqués automatiquement avec l'outil HP BCU",
        "Fichiers de réglages pour ne poser qu'une question au lancement : le nom du poste",
        "Tests sur plusieurs modèles puis rédaction d'une procédure pour l'équipe"
      ],
      tools: ['MDT', 'WDS', 'Windows 11', 'HP BCU', 'Windows Server'],
      result: "Les postes sont installés de la même façon à chaque fois, beaucoup plus vite, et n'importe qui dans l'équipe peut lancer un déploiement.",
      skills: [B1.service, B1.patrimoine]
    },
    {
      id: 'att-vaultwarden', block: 'entreprise', g: ['entreprise'], c: 'attineos', icon: 'key', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Vaultwarden : faire la guerre aux post-it',
      sum: "Mettre en place un gestionnaire de mots de passe sur le réseau pour que les utilisateurs arrêtent de noter leurs mots de passe sur des post-it.",
      contexte: "Comme dans beaucoup d'entreprises, on trouvait des mots de passe sur des post-it collés aux écrans, dans des carnets ou des fichiers Excel. C'est un vrai risque de sécurité. L'idée : donner aux utilisateurs un outil simple pour ranger leurs mots de passe, et les inciter à l'utiliser.",
      actions: [
        "Choix de Vaultwarden, compatible avec les applications Bitwarden (extension navigateur, téléphone)",
        "Installation sur un serveur Linux dans un conteneur Docker",
        "Accès en HTTPS sur le réseau interne",
        "Comptes créés sur invitation, avec double authentification",
        "Coffres partagés par service pour les mots de passe communs",
        "Sauvegarde automatique et test de restauration",
        "Petit guide utilisateur et accompagnement des premiers utilisateurs"
      ],
      tools: ['Vaultwarden', 'Bitwarden', 'Docker', 'Linux', 'HTTPS'],
      result: "Les utilisateurs ont un vrai outil pour leurs mots de passe, et les post-it disparaissent petit à petit des écrans.",
      skills: [B1.service, B1.incidents]
    },
    {
      id: 'att-gpo', block: 'entreprise', g: ['entreprise'], c: 'attineos', icon: 'users', tag: 'Attineos · mission en usine', date: 'Depuis 2026',
      title: 'Mise en place de GPO sur le parc',
      sum: "Créer et appliquer des stratégies de groupe pour configurer les postes automatiquement et les sécuriser.",
      contexte: "Aujourd'hui, une partie de mon travail est de mettre en place des GPO. Plutôt que de régler chaque poste à la main, on définit une règle une fois et elle s'applique à tous les postes concernés.",
      actions: [
        "Recueil du besoin avec l'équipe (lecteurs réseau, imprimantes, sécurité)",
        "Création des GPO, une par usage, avec un nom clair",
        "Ciblage par groupe pour que chacun ait les bons lecteurs et les bonnes imprimantes",
        "Réglages de sécurité : verrouillage de l'écran, restrictions sur les postes d'atelier",
        "Tests sur quelques postes avant de généraliser",
        "Vérification avec gpresult et sauvegarde des GPO"
      ],
      tools: ['GPO', 'Active Directory', 'Windows Server'],
      result: "Les postes reçoivent automatiquement les bons réglages, et un nouveau poste est prêt dès qu'il rejoint le domaine.",
      skills: [B1.service, B1.patrimoine]
    },
    {
      id: 'stage-chauvin', block: 'entreprise', g: ['entreprise'], c: 'stage', icon: 'shield', tag: 'Stage · Chauvin-Arnoux Group', date: 'Mars → avril 2023',
      title: 'Déploiement avec MDT, chiffrement de disques et RAID',
      sum: "Mon premier contact avec le déploiement automatique, le chiffrement des disques et les VLAN.",
      contexte: "Stage de deux mois au service informatique de Chauvin-Arnoux Group, à Reux, pendant ma terminale de Bac Pro.",
      actions: ["Chiffrement et sécurisation des disques", "Mise en route d'un RAID", "Déploiement de postes avec MDT", "Configuration de VLAN sur les switchs", "Support N1 et N2"],
      tools: ['MDT', 'Chiffrement', 'RAID', 'VLAN'],
      result: "Une première vraie expérience qui m'a donné envie de continuer dans l'infrastructure.",
      skills: [BAC.config, BAC.depannage]
    },
    {
      id: 'stage-ccf', block: 'entreprise', g: ['entreprise'], c: 'stage', icon: 'chart', tag: 'Stage · CC Cœur Côte Fleurie', date: 'Nov. → déc. 2022',
      title: 'Installation de Zabbix pour superviser le réseau',
      sum: "Zabbix installé pour surveiller les équipements réseau de la communauté de communes.",
      contexte: "Stage de deux mois à Deauville. C'est ici que j'ai découvert la supervision, qui m'a mené à mon projet de BTS présenté au jury, puis à NetCockpit.",
      actions: ["Installation et configuration de Zabbix", "Ajout des équipements réseau", "Installation de postes", "Brassage de prises réseau"],
      tools: ['Zabbix', 'Linux', 'Réseau'],
      result: "Un outil de supervision en place, et le point de départ de mes projets de supervision.",
      skills: [BAC.config, BAC.install]
    },

    /* ===================== BTS SIO SISR ===================== */
    {
      id: 'e6-ansible', block: 'bts', g: ['bts'], c: 'bts', icon: 'cog', tag: 'BTS SIO · projet présenté au jury (E6)', date: '2e année · 2025-2026',
      title: 'Déployer des serveurs avec Ansible sur Proxmox',
      sum: "Une seule commande pour installer et configurer trois serveurs de jeu Minecraft en même temps, sans rien faire à la main.",
      img: 'ansible-playbook.png', imgAlt: 'Exécution du playbook Ansible',
      contexte: "Installer plusieurs serveurs à la main prend du temps et on oublie toujours une étape. Le but : décrire l'installation dans un fichier et la rejouer autant de fois qu'on veut, avec toujours le même résultat.",
      actions: ["Trois machines virtuelles Debian sur Proxmox VE", "Ansible sur une machine de contrôle, connexion SSH par clé", "Inventaire des serveurs en YAML", "Playbook : Java, utilisateur dédié, fichiers, service", "Modules apt, user, copy et systemd", "Relancer le playbook ne change rien si tout est déjà en place"],
      tools: ['Ansible', 'Proxmox VE', 'Debian', 'SSH', 'YAML'],
      result: "Les trois serveurs installés en une commande, recréables à l'identique.",
      skills: [B1.service, B1.projet],
      links: [{ href: 'Ansible_E6.docx', label: 'Dossier présenté au jury (.docx)', ic: 'file', dl: true }]
    },
    {
      id: 'e6-zabbix', block: 'bts', g: ['bts'], c: 'bts', icon: 'chart', tag: 'BTS SIO · projet présenté au jury (E6)', date: '2e année · né d\'un besoin chez Armatis',
      title: 'Serveur de supervision Zabbix + Grafana',
      sum: "Surveiller les serveurs (processeur, mémoire, disque, réseau) et recevoir une alerte avant que la panne ne gêne les utilisateurs.",
      img: 'grafana-dashboard.png', imgAlt: 'Tableau de bord Grafana',
      contexte: "Chez Armatis, on découvrait souvent un problème quand un utilisateur appelait. J'ai monté une supervision complète sur Debian 12 pour mon projet E6.",
      actions: ["Zabbix 7.0 sur Debian 12 avec Apache, PHP et MariaDB", "Agent Zabbix sur les serveurs", "Collecte processeur, mémoire, disque et réseau", "Alertes sur seuil ou service arrêté", "Grafana connecté à Zabbix", "Tableaux de bord lisibles d'un coup d'œil"],
      tools: ['Zabbix 7.0', 'Grafana', 'Debian 12', 'MariaDB'],
      result: "Des serveurs surveillés en permanence et des alertes avant les utilisateurs.",
      skills: [B1.patrimoine, B1.incidents],
      links: [{ href: 'Grafana-Zabbix_E6.docx', label: 'Dossier présenté au jury (.docx)', ic: 'file', dl: true }]
    },
    {
      id: 'bts-ad', block: 'bts', g: ['bts'], c: 'bts', icon: 'users', tag: 'BTS SIO · atelier', date: '1re année · 2024-2025',
      title: 'Infrastructure Windows d\'une PME : AD, DNS, DHCP et GPO',
      sum: "Monter de zéro le réseau Windows d'une PME fictive : domaine, services réseau, comptes et stratégies de groupe.",
      contexte: "Premier gros atelier du BTS : une PME de 40 personnes réparties en services, avec un cahier des charges à respecter (nommage, droits, partages).",
      actions: ["Installation de deux Windows Server en machines virtuelles", "Création du domaine Active Directory et du DNS", "DHCP avec réservations pour les imprimantes", "Unités d'organisation et groupes par service", "Création des comptes à partir d'un fichier CSV en PowerShell", "GPO : fond d'écran, lecteurs réseau, mot de passe, verrouillage"],
      tools: ['Windows Server 2022', 'Active Directory', 'DNS', 'DHCP', 'GPO', 'PowerShell'],
      result: "Un domaine complet et documenté, prêt à accueillir les postes clients.",
      skills: [B1.service, B1.patrimoine]
    },
    {
      id: 'bts-glpi', block: 'bts', g: ['bts'], c: 'bts', icon: 'list', tag: 'BTS SIO · atelier', date: '1re année · 2024-2025',
      title: 'Gestion de parc et tickets avec GLPI',
      sum: "GLPI sur Debian pour l'inventaire et les tickets, avec remontée automatique des postes.",
      contexte: "En atelier, il fallait un outil de gestion de parc et d'assistance comme en entreprise.",
      actions: ["Apache, PHP et MariaDB sur Debian", "Installation de GLPI, HTTPS, comptes par défaut changés", "Agent GLPI sur les postes pour l'inventaire automatique", "Connexion à l'Active Directory", "Catégories de tickets et test d'un parcours complet"],
      tools: ['GLPI', 'Debian', 'MariaDB', 'Active Directory'],
      result: "Un inventaire à jour sans saisie et un outil de tickets prêt à l'emploi.",
      skills: [B1.patrimoine, B1.incidents]
    },
    {
      id: 'bts-pfsense', block: 'bts', g: ['bts'], c: 'bts', icon: 'shield', tag: 'BTS SIO · atelier', date: '1re année · 2024-2025',
      title: 'Pare-feu pfSense avec VLAN, portail captif et VPN',
      sum: "Séparer le réseau en VLAN derrière pfSense, filtrer, isoler les invités et donner un accès VPN.",
      contexte: "Sur la maquette, tout le monde pouvait parler à tout le monde. Le but : séparer les usages et n'autoriser que le nécessaire.",
      actions: ["pfSense en machine virtuelle", "VLAN administration, serveurs, DMZ, postes et invités", "Règles : tout bloqué sauf l'utile", "Portail captif pour les invités", "OpenVPN pour l'accès à distance", "Test de chaque règle"],
      tools: ['pfSense', 'VLAN', 'OpenVPN', 'Portail captif'],
      result: "Un réseau segmenté, des invités isolés et un accès distant sécurisé.",
      skills: [B1.service, B1.projet]
    },
    {
      id: 'bts-ipsec', block: 'bts', g: ['bts'], c: 'bts', icon: 'route', tag: 'BTS SIO · atelier', date: '2e année · 2025-2026',
      title: 'Relier deux sites avec un VPN IPsec',
      sum: "Faire communiquer le siège et une agence comme s'ils étaient sur le même réseau, à travers Internet et en chiffré.",
      contexte: "La PME de l'atelier ouvre une agence : les salariés de l'agence doivent accéder aux serveurs du siège (AD, fichiers, GLPI).",
      actions: ["Un pfSense sur chaque site", "Tunnel IPsec entre les deux (phases 1 et 2)", "Règles de filtrage sur le tunnel", "DNS de l'agence redirigé vers le contrôleur de domaine du siège", "Tests : ouverture de session, partages, coupure et reprise du tunnel"],
      tools: ['pfSense', 'IPsec', 'Routage', 'Active Directory'],
      result: "L'agence travaille sur les serveurs du siège de façon transparente et sécurisée.",
      skills: [B1.service, B1.incidents]
    },
    {
      id: 'bts-redondance', block: 'bts', g: ['bts'], c: 'bts', icon: 'network', tag: 'BTS SIO · atelier', date: '2e année · 2025-2026',
      title: 'Réseau redondant : agrégation de liens et passerelle de secours',
      sum: "Faire en sorte que la coupure d'un câble ou d'un équipement ne coupe pas le réseau.",
      contexte: "Sur la maquette Cisco, un seul câble ou un seul routeur en panne suffisait à tout arrêter. Le but était de supprimer ces points uniques.",
      actions: ["Deux switchs de cœur reliés par deux câbles agrégés (LACP)", "Spanning-tree réglé pour éviter les boucles", "Passerelle de secours avec HSRP entre deux routeurs", "Tests en débranchant les câbles et en éteignant un routeur", "Mesure du temps de coupure"],
      tools: ['Cisco', 'LACP', 'Spanning-tree', 'HSRP', 'VLAN'],
      result: "Un réseau qui continue de fonctionner quand un lien ou un routeur tombe.",
      skills: [B1.service, B1.incidents]
    },
    {
      id: 'bts-sauvegarde', block: 'bts', g: ['bts'], c: 'bts', icon: 'hdd', tag: 'BTS SIO · atelier', date: '2e année · 2025-2026',
      title: 'Sauvegardes et plan de reprise d\'activité',
      sum: "Mettre en place la règle 3-2-1 et prouver qu'on sait tout remettre en route après une panne.",
      contexte: "Une sauvegarde qu'on n'a jamais testée ne vaut rien. L'atelier demandait une stratégie complète et un test de restauration chronométré.",
      actions: ["Sauvegardes des VM avec Proxmox Backup Server", "Sauvegarde des postes et des fichiers sur un NAS", "Copie hors site d'une partie des sauvegardes", "Planification et rétention (jours, semaines, mois)", "Test de restauration complète d'un serveur", "Rédaction du plan de reprise d'activité"],
      tools: ['Proxmox Backup Server', 'NAS', 'Règle 3-2-1', 'PRA'],
      result: "Des sauvegardes vérifiées et un serveur restauré en suivant la procédure.",
      skills: [B1.patrimoine, B1.incidents]
    },
    {
      id: 'bts-wazuh', block: 'bts', g: ['bts'], c: 'bts', icon: 'shield', tag: 'BTS SIO · atelier', date: '2e année · 2025-2026',
      title: 'Détection d\'intrusions avec Wazuh',
      sum: "Centraliser les journaux de sécurité des serveurs Windows et Linux, et être alerté en cas d'attaque.",
      contexte: "Sur la maquette, les journaux étaient éparpillés et personne ne les lisait. Wazuh les rassemble et met en avant ce qui est anormal.",
      actions: ["Installation de Wazuh sur Debian", "Agents sur les serveurs Windows et Linux", "Journaux de sécurité Windows et Sysmon", "Alerte quand un compte est ajouté aux administrateurs du domaine", "Blocage automatique d'une attaque par force brute SSH", "Tests en provoquant chaque détection"],
      tools: ['Wazuh', 'Debian', 'Windows Server', 'Sysmon'],
      result: "Les événements de sécurité au même endroit et des alertes vérifiées.",
      skills: [B1.incidents, B1.patrimoine]
    },
    {
      id: 'bts-galera', block: 'bts', g: ['bts'], c: 'bts', icon: 'database', tag: 'BTS SIO · atelier', date: '2e année · 2025-2026',
      title: 'Base de données toujours disponible (MariaDB Galera)',
      sum: "Trois serveurs MariaDB qui restent identiques, pour qu'une application continue de marcher si un serveur tombe.",
      contexte: "Une seule base de données, c'est un seul point de panne. L'atelier portait sur la haute disponibilité.",
      actions: ["MariaDB et Galera sur trois serveurs Debian", "Réplication entre les trois serveurs", "Une adresse unique pour l'application (HAProxy)", "Tests : arrêt d'un serveur, coupure réseau, redémarrage complet", "Procédure de remise en route"],
      tools: ['MariaDB', 'Galera', 'HAProxy', 'Debian'],
      result: "L'application continue de fonctionner quand un serveur s'arrête.",
      skills: [B1.service, B1.projet]
    },
    {
      id: 'bts-web', block: 'bts', g: ['bts'], c: 'bts', icon: 'globe', tag: 'BTS SIO · atelier', date: '1re année · 2024-2025',
      title: 'Serveur web sécurisé en DMZ',
      sum: "Publier le site de la PME sur Internet sans mettre en danger le réseau interne.",
      contexte: "Le site vitrine de la PME devait être accessible depuis Internet. Il fallait l'isoler dans une DMZ et le protéger correctement.",
      actions: ["Serveur Debian avec Nginx dans la DMZ", "Certificat HTTPS et redirection du HTTP", "Redirection de port sur pfSense, aucun accès de la DMZ vers le LAN", "Utilisateur dédié, droits minimum sur les fichiers du site", "Fail2ban et mises à jour automatiques de sécurité"],
      tools: ['Debian', 'Nginx', 'HTTPS', 'pfSense', 'Fail2ban'],
      result: "Un site en ligne, en HTTPS, isolé du réseau interne.",
      skills: [B1.web, B1.service]
    },

    /* ===================== BAC PRO SN option C (RISC) ===================== */
    {
      id: 'bac-chef-oeuvre', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'star', tag: 'Bac Pro SN · chef-d\'œuvre', date: 'Première et terminale · 2021-2023',
      title: 'Chef-d\'œuvre : le réseau complet d\'une petite entreprise',
      sum: "Le projet de groupe sur deux ans : concevoir, câbler, configurer et présenter le réseau d'une entreprise fictive.",
      contexte: "Le chef-d'œuvre est le grand projet du Bac Pro. Avec mon groupe, on a imaginé une petite entreprise de 15 personnes et on a construit son réseau de A à Z, puis on l'a présenté devant un jury.",
      actions: ["Recueil du besoin et choix du matériel avec un budget", "Plan du réseau et plan d'adressage IP", "Câblage de la baie et des prises", "Configuration du switch, du routeur et de la borne Wi-Fi", "Serveur de fichiers et imprimante partagée", "Dossier technique et présentation orale"],
      tools: ['Cisco', 'Câblage', 'Wi-Fi', 'Windows Server', 'Gestion de projet'],
      result: "Un réseau qui fonctionne de bout en bout, présenté et défendu devant le jury.",
      skills: [BAC.install, BAC.config, BAC.recette, BAC.doc]
    },
    {
      id: 'bac-baie', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'cable', tag: 'Bac Pro SN · TP', date: 'Seconde · 2020-2021',
      title: 'Câblage d\'une baie de brassage et recette',
      sum: "Monter une baie, poser et sertir les câbles, puis tester chaque lien avant la mise en service.",
      contexte: "Premier gros TP de câblage : équiper une salle de six postes, de la baie jusqu'aux prises murales.",
      actions: ["Montage de la baie : panneau de brassage, switch, passe-câbles", "Pose des câbles et raccordement des prises RJ45", "Sertissage selon la norme T568B", "Tests de continuité avec un testeur de câbles", "Étiquetage et cahier de recette"],
      tools: ['Baie 19 pouces', 'RJ45', 'Testeur de câbles', 'Norme T568B'],
      result: "Six prises fonctionnelles, étiquetées et validées par le cahier de recette.",
      skills: [BAC.install, BAC.recette, BAC.doc]
    },
    {
      id: 'bac-cisco', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'network', tag: 'Bac Pro SN · TP', date: 'Première · 2021-2022',
      title: 'Maquette Cisco : VLAN et routage',
      sum: "Configurer des switchs et un routeur Cisco pour séparer le réseau en VLAN et les faire communiquer.",
      contexte: "TP sur une maquette de trois switchs et un routeur : séparer l'administration, les élèves et les serveurs.",
      actions: ["Configuration de base : nom, mots de passe, accès console", "Création des VLAN et affectation des ports", "Liaison entre switchs en trunk", "Routage entre les VLAN sur le routeur", "Sauvegarde des configurations et tests de ping"],
      tools: ['Cisco IOS', 'VLAN', 'Trunk', 'Routage'],
      result: "Trois réseaux séparés qui communiquent seulement par le routeur.",
      skills: [BAC.config, BAC.recette]
    },
    {
      id: 'bac-video', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'monitor', tag: 'Bac Pro SN · TP', date: 'Première · 2021-2022',
      title: 'Vidéosurveillance IP avec caméras PoE',
      sum: "Installer des caméras IP alimentées par le câble réseau et un enregistreur, sur un réseau séparé.",
      contexte: "Projet de mise en service d'un système de vidéosurveillance pour l'entrée d'un bâtiment fictif.",
      actions: ["Choix et pose de trois caméras IP", "Alimentation par le switch PoE", "VLAN dédié aux caméras", "Configuration de l'enregistreur (NVR) et des plages d'enregistrement", "Accès à distance en lecture seule et test de relecture"],
      tools: ['Caméras IP', 'PoE', 'NVR', 'VLAN'],
      result: "Les trois caméras enregistrent et sont consultables, isolées du reste du réseau.",
      skills: [BAC.install, BAC.config, BAC.recette]
    },
    {
      id: 'bac-wifi', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'radar', tag: 'Bac Pro SN · TP', date: 'Terminale · 2022-2023',
      title: 'Wi-Fi avec un réseau personnel et un réseau invités',
      sum: "Mettre en service une borne Wi-Fi avec deux réseaux séparés : un pour le personnel, un pour les visiteurs.",
      contexte: "Les visiteurs devaient avoir Internet sans jamais voir les ordinateurs du personnel.",
      actions: ["Installation et alimentation de la borne", "Deux réseaux Wi-Fi (SSID), chacun sur son VLAN", "Sécurité WPA2 pour le personnel", "Isolation du réseau invités", "Mesures de couverture dans les salles"],
      tools: ['Borne Wi-Fi', 'WPA2', 'VLAN', 'PoE'],
      result: "Deux Wi-Fi qui fonctionnent, et des invités isolés du réseau interne.",
      skills: [BAC.config, BAC.recette]
    },
    {
      id: 'bac-toip', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'phone', tag: 'Bac Pro SN · TP', date: 'Terminale · 2022-2023',
      title: 'Téléphonie IP avec Asterisk',
      sum: "Installer un petit standard téléphonique sur Linux et faire sonner des téléphones IP.",
      contexte: "Découverte de la téléphonie sur IP : remplacer un vieux standard par une solution logicielle.",
      actions: ["Installation d'Asterisk sur Debian", "Création des comptes pour chaque poste", "Configuration des téléphones IP et d'un logiciel sur PC", "Appels entre postes et messagerie vocale", "Analyse des échanges avec Wireshark"],
      tools: ['Asterisk', 'Debian', 'SIP', 'Wireshark'],
      result: "Des appels entre postes et une messagerie vocale qui fonctionnent.",
      skills: [BAC.install, BAC.config]
    },
    {
      id: 'bac-serveur', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'server', tag: 'Bac Pro SN · TP', date: 'Terminale · 2022-2023',
      title: 'Premier serveur : domaine, DHCP et partage de fichiers',
      sum: "Installer un Windows Server pour une salle de TP : comptes, adresses IP automatiques et dossiers partagés.",
      contexte: "Ma première installation de serveur : une salle de 12 postes qui devait se connecter avec des comptes élèves.",
      actions: ["Installation de Windows Server", "Domaine Active Directory et comptes élèves", "Serveur DHCP pour les adresses IP", "Dossier partagé par classe avec des droits", "Jonction des postes au domaine"],
      tools: ['Windows Server', 'Active Directory', 'DHCP', 'Partages'],
      result: "Les élèves se connectent avec leur compte et retrouvent leurs fichiers sur tous les postes.",
      skills: [BAC.install, BAC.config]
    },
    {
      id: 'bac-maintenance', block: 'bacpro', g: ['bacpro'], c: 'bacpro', icon: 'tool', tag: 'Bac Pro SN · atelier', date: 'Seconde → terminale · 2020-2023',
      title: 'Atelier maintenance : diagnostic et réparation de PC',
      sum: "Démonter, diagnostiquer et réparer des ordinateurs, puis réinstaller le système.",
      contexte: "Tout au long du Bac Pro, on remettait en état des PC donnés au lycée pour les réutiliser.",
      actions: ["Diagnostic des pannes (alimentation, mémoire, disque)", "Remplacement de composants", "Passage des disques durs vers des SSD", "Installation de Windows et des pilotes", "Fiche d'intervention pour chaque PC"],
      tools: ['Matériel PC', 'SSD', 'Windows', 'Fiches d\'intervention'],
      result: "Des PC remis en service et les bons réflexes de diagnostic.",
      skills: [BAC.depannage, BAC.doc]
    },

    /* ===================== PERSO & HOMELAB ===================== */
    {
      id: 'perso-lab', block: 'perso', g: ['perso'], c: 'perso', icon: 'server', tag: 'Homelab', date: 'En continu',
      title: 'Mon homelab Proxmox',
      sum: "Un serveur Proxmox chez moi pour tester avant de faire en vrai : Active Directory, Linux, supervision, déploiement, NetCockpit.",
      contexte: "Pour progresser, il faut pouvoir casser et recommencer sans risque. Mon lab me sert à m'entraîner et à préparer chaque nouvelle version de NetCockpit.",
      actions: ["Proxmox VE sur un PC reconditionné", "VM Windows Server et Debian, domaine Active Directory de test", "Réseau découpé en VLAN derrière pfSense", "Sauvegardes avec Proxmox Backup Server", "Snapshots avant chaque test", "NetCockpit pour superviser tout le lab"],
      tools: ['Proxmox VE', 'pfSense', 'Windows Server', 'Debian', 'PBS'],
      result: "Un terrain d'entraînement complet, sans risque pour une vraie infrastructure.",
      skills: [B1.dev]
    },
    {
      id: 'perso-docker', block: 'perso', g: ['perso'], c: 'perso', icon: 'box', tag: 'Homelab', date: 'En continu',
      title: 'Services auto-hébergés sous Docker',
      sum: "Quelques services perso dans des conteneurs, derrière Nginx Proxy Manager avec des certificats HTTPS automatiques.",
      contexte: "Je voulais apprendre Docker sur des services que j'utilise vraiment, proprement : un dossier par service et un seul point d'entrée en HTTPS.",
      actions: ["Un fichier Docker Compose par service", "Nginx Proxy Manager comme seul point d'entrée", "Certificats Let's Encrypt automatiques", "Interface d'administration accessible seulement en local", "Mises à jour des images après lecture des changements"],
      tools: ['Docker', 'Docker Compose', 'Nginx Proxy Manager', "Let's Encrypt"],
      result: "Des services propres, faciles à mettre à jour et à sauvegarder.",
      skills: [B1.service, B1.dev]
    },
    {
      id: 'perso-pihole', block: 'perso', g: ['perso'], c: 'perso', icon: 'shield', tag: 'Homelab', date: 'En continu',
      title: 'Filtrage DNS de la maison avec Pi-hole',
      sum: "Bloquer les publicités et les sites malveillants pour tous les appareils de la maison, sans rien installer dessus.",
      contexte: "Un bon moyen de comprendre le DNS en pratique, avec un vrai bénéfice au quotidien.",
      actions: ["Pi-hole dans un conteneur LXC", "Unbound pour résoudre les noms sans passer par un fournisseur", "Distribution du DNS par le DHCP", "Listes de blocage et liste blanche", "Statistiques et journal des requêtes"],
      tools: ['Pi-hole', 'Unbound', 'DNS', 'LXC'],
      result: "Moins de publicités et de traqueurs sur tout le réseau, et une bonne maîtrise du DNS.",
      skills: [B1.dev]
    },
    {
      id: 'perso-wireguard', block: 'perso', g: ['perso'], c: 'perso', icon: 'lock', tag: 'Homelab', date: 'En continu',
      title: 'Accès à distance au lab avec WireGuard',
      sum: "Me connecter à mon homelab depuis l'extérieur, en toute sécurité, sans ouvrir les interfaces d'administration sur Internet.",
      contexte: "Je voulais administrer mon lab depuis mon téléphone ou un autre PC, sans exposer Proxmox ou pfSense.",
      actions: ["Serveur WireGuard sur pfSense", "Une clé par appareil, révocable individuellement", "Accès limité au réseau d'administration", "Configuration par QR code sur le téléphone", "Tests de connexion en 4G"],
      tools: ['WireGuard', 'pfSense', 'VPN'],
      result: "Un accès distant simple et sécurisé, et aucun service d'administration exposé.",
      skills: [B1.service, B1.dev]
    },
    {
      id: 'perso-fichiers', block: 'perso', g: ['perso'], c: 'perso', icon: 'folder', tag: 'Homelab', date: 'En continu',
      title: 'Serveur de fichiers Windows (DFS, quotas, clichés)',
      sum: "Un serveur de fichiers comme en entreprise : partages par service, quotas, versions précédentes et droits par groupes.",
      contexte: "Pour bien comprendre les partages que je gère au travail, j'en ai monté un complet sur mon lab.",
      actions: ["Partages regroupés sous un seul chemin (DFS)", "Droits NTFS par groupes, chacun ne voit que ses dossiers", "Quotas par service avec FSRM", "Clichés instantanés pour restaurer un fichier", "Lecteurs connectés par GPO"],
      tools: ['Windows Server', 'DFS', 'FSRM', 'NTFS', 'GPO'],
      result: "Un serveur de fichiers propre et une restauration de fichier en quelques clics.",
      skills: [B1.service]
    },
    {
      id: 'perso-powershell', block: 'perso', g: ['perso'], c: 'perso', icon: 'terminal', tag: 'Projet perso · scripts', date: 'En continu',
      title: 'Boîte à outils PowerShell',
      sum: "Des petits scripts qui me font gagner du temps : création de comptes, inventaire des postes, nettoyage.",
      contexte: "Dès qu'une tâche revient souvent, j'essaie de l'automatiser. J'ai regroupé mes scripts pour les réutiliser et les améliorer.",
      actions: ["Création de comptes AD à partir d'un fichier CSV", "Inventaire des postes (modèle, numéro de série, espace disque) vers un CSV", "Liste des comptes inactifs à désactiver", "Nettoyage des fichiers temporaires", "Mode simulation avant chaque action"],
      tools: ['PowerShell', 'Active Directory', 'CSV'],
      result: "Des tâches de plusieurs minutes faites en quelques secondes, sans erreur de saisie.",
      skills: [B1.patrimoine, B1.dev]
    },
    {
      id: 'perso-rootme', block: 'perso', g: ['perso'], c: 'perso', icon: 'target', tag: 'Projet perso · sécurité', date: 'En continu',
      title: 'Challenges de sécurité sur Root-Me',
      sum: "M'entraîner à la cybersécurité de façon légale : réseau, web, systèmes, analyse de captures.",
      contexte: "Pour bien protéger un système, il faut comprendre comment on l'attaque. Root-Me propose des challenges encadrés pour apprendre.",
      actions: ["Challenges réseau : analyse de trames, protocoles", "Challenges web : failles courantes", "Challenges système : droits, services mal configurés", "Notes sur chaque technique apprise"],
      tools: ['Root-Me', 'Wireshark', 'Linux', 'Burp Suite'],
      result: "De meilleurs réflexes pour repérer une mauvaise configuration au travail.",
      skills: [B1.dev],
      links: [{ href: 'https://www.root-me.org/B2ZO', label: 'Mon profil Root-Me', ic: 'external' }]
    },
    {
      id: 'perso-portfolio', block: 'perso', g: ['perso'], c: 'perso', icon: 'globe', tag: 'Projet perso · web', date: '2026',
      title: 'Ce portfolio, enzomarechal.fr',
      sum: "Le site que tu regardes : HTML, CSS et JavaScript, hébergé sur GitHub Pages avec mon nom de domaine.",
      contexte: "Je voulais un site à mon image, dans le même style que NetCockpit, pour présenter mon parcours, mes formations et mes projets.",
      actions: ["Pages en HTML, CSS et JavaScript, sans bibliothèque", "Thèmes jour et nuit, adapté au téléphone", "Hébergement GitHub Pages et nom de domaine personnel", "Fil de veille en direct (CERT-FR, IT-Connect)"],
      tools: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
      result: "Un portfolio rapide, lisible et facile à mettre à jour.",
      skills: [B1.web],
      links: [{ href: 'https://github.com/B2ZO0/B2ZO0.github.io', label: 'Code source', ic: 'github' }]
    }
  ];

  /* Détails complémentaires de chaque projet : objectif, difficultés rencontrées, ce que j'en retiens */
  var DETAILS = {
    'netcockpit': {
      obj: "Avoir une vue claire du réseau et des alertes au même endroit, même sans accès administrateur aux switchs.",
      diff: [["Les appareils éteints le soir (portables) remontaient comme « en panne » et noyaient les vraies alertes.", "Faire la différence entre « absent » (en gris) et « en panne » (en rouge), réservé aux serveurs et équipements importants."], ["La première version consommait trop de ressources sur une petite machine virtuelle.", "Réglage de la fréquence de collecte et de la durée de conservation des données."]],
      learn: "Comment Prometheus, Grafana et Zabbix fonctionnent ensemble, et l'importance de tester sur un lab avant de déployer."
    },
    'att-deploiement': {
      obj: "Installer un poste complet sans intervention, de la même façon à chaque fois.",
      diff: [["Sur les modèles récents, la carte réseau n'était pas reconnue au démarrage et le déploiement s'arrêtait.", "Ajout des pilotes réseau HP dans l'image de démarrage (WinPE), puis régénération de l'image."], ["La jonction au domaine échouait en fin d'installation.", "Lecture des journaux MDT : le chemin de l'unité d'organisation était mal écrit. Correction et nouveau test."]],
      learn: "Lire les journaux avant de chercher ailleurs, et tester chaque modèle de PC avant de dire que c'est prêt."
    },
    'att-vaultwarden': {
      obj: "Que chaque utilisateur ait un endroit sûr pour ses mots de passe, et que les post-it disparaissent.",
      diff: [["Certains utilisateurs trouvaient l'outil compliqué au début.", "Un guide d'une page avec des captures, et une démonstration de quelques minutes à chaque nouvel utilisateur."], ["Les modifications ne se synchronisaient pas tout de suite entre le PC et le téléphone.", "Réglage du serveur web qui fait l'intermédiaire pour laisser passer la synchronisation en direct."]],
      learn: "Un outil de sécurité ne sert à rien si les utilisateurs ne l'adoptent pas : il faut expliquer et accompagner."
    },
    'att-gpo': {
      obj: "Configurer automatiquement les postes et améliorer leur sécurité, sans passer sur chaque PC.",
      diff: [["Un lecteur réseau n'apparaissait pas pour un utilisateur qu'on venait d'ajouter au groupe.", "Les droits sont lus à l'ouverture de session : il fallait se déconnecter et se reconnecter."], ["Sur les postes partagés de l'atelier, certains réglages ne s'appliquaient pas.", "Utilisation du traitement en boucle (loopback) pour appliquer les réglages selon le poste et non selon l'utilisateur."]],
      learn: "Toujours tester une GPO sur quelques postes avant de la déployer, et garder une sauvegarde pour revenir en arrière."
    },
    'stage-chauvin': {
      obj: "Découvrir le travail d'un service informatique en entreprise et participer aux tâches courantes.",
      diff: [["Comprendre le fonctionnement du RAID avant de le mettre en place.", "Explications du tuteur et tests sur un poste de démonstration avant la vraie machine."]],
      learn: "L'importance de protéger les données (chiffrement, RAID) et mes premiers pas dans le déploiement automatique."
    },
    'stage-ccf': {
      obj: "Mettre en place un outil pour surveiller les équipements réseau de la collectivité.",
      diff: [["Certains équipements ne remontaient aucune information.", "Activation et réglage de SNMP sur les équipements, avec l'aide de mon tuteur."]],
      learn: "La supervision évite de découvrir les pannes par les utilisateurs. C'est devenu un sujet qui me plaît."
    },
    'e6-ansible': {
      obj: "Montrer qu'on peut installer plusieurs serveurs identiques avec une seule commande.",
      diff: [["La connexion SSH aux nouvelles machines demandait un mot de passe à chaque fois.", "Création d'une clé SSH dédiée et copie sur chaque serveur."], ["Le serveur Minecraft s'arrêtait quand je fermais la session.", "Création d'un service systemd pour qu'il démarre et tourne tout seul."]],
      learn: "Décrire une installation dans un fichier évite les oublis, et on peut la rejouer autant de fois qu'on veut."
    },
    'e6-zabbix': {
      obj: "Être prévenu d'une panne avant les utilisateurs et voir l'état des serveurs d'un coup d'œil.",
      diff: [["Message « Zabbix server is not running » après l'installation.", "Le mot de passe de la base de données ne correspondait pas dans le fichier de configuration."], ["Les serveurs Windows n'envoyaient pas de données.", "Le nom de la machine dans l'agent devait être exactement le même que dans Zabbix."]],
      learn: "Installer une base de données, lire les journaux d'un service Linux, et présenter un projet complet devant un jury."
    },
    'bts-ad': {
      obj: "Livrer un domaine Windows complet et documenté qui respecte le cahier des charges de la PME.",
      diff: [["Les postes clients ne trouvaient pas le domaine.", "Le DNS des postes pointait vers la box : correction dans le DHCP pour donner le contrôleur de domaine comme DNS."], ["Des erreurs dans le fichier CSV bloquaient la création des comptes.", "Ajout de vérifications dans le script et d'un mode test avant la création."]],
      learn: "Le DNS est au cœur de l'Active Directory, et un script fait gagner beaucoup de temps quand il y a beaucoup de comptes."
    },
    'bts-glpi': {
      obj: "Avoir un inventaire à jour sans saisie manuelle et un outil de tickets pour le support.",
      diff: [["GLPI affichait un avertissement de sécurité sur la configuration du serveur web.", "Le site devait pointer sur le dossier « public » de GLPI et non sur la racine."], ["La connexion à l'Active Directory ne fonctionnait pas.", "Vérification du compte de service et du chemin de recherche, puis test de connexion depuis GLPI."]],
      learn: "Suivre les recommandations de sécurité de l'éditeur dès l'installation, pas après."
    },
    'bts-pfsense': {
      obj: "Séparer les usages du réseau et n'autoriser que les échanges nécessaires.",
      diff: [["Une règle d'autorisation ne marchait pas alors qu'elle semblait juste.", "pfSense lit les règles dans l'ordre : elle était placée sous une règle de blocage."], ["Les invités pouvaient ouvrir la page d'administration de pfSense.", "Ajout d'une règle qui bloque l'accès au pare-feu depuis le réseau invités."]],
      learn: "Écrire la liste des échanges autorisés avant de créer les règles, puis tester chaque ligne."
    },
    'bts-ipsec': {
      obj: "Permettre à l'agence d'utiliser les serveurs du siège en toute sécurité.",
      diff: [["Le tunnel ne montait pas.", "Les paramètres de chiffrement n'étaient pas identiques des deux côtés : alignement des deux configurations."], ["L'ouverture de session était lente à l'agence.", "Le DNS de l'agence ne pointait pas vers le contrôleur de domaine du siège."]],
      learn: "Un VPN entre deux sites doit avoir exactement les mêmes réglages des deux côtés, et le DNS compte autant que le tunnel."
    },
    'bts-redondance': {
      obj: "Supprimer les points uniques de panne du réseau de la maquette.",
      diff: [["L'ajout du deuxième câble entre les switchs créait une boucle.", "Configuration de l'agrégation de liens pour que les deux câbles soient vus comme un seul."]],
      learn: "Le spanning-tree protège des boucles, et la redondance se teste en débranchant vraiment les câbles."
    },
    'bts-sauvegarde': {
      obj: "Avoir des sauvegardes fiables et savoir remettre un serveur en route après une panne.",
      diff: [["La première restauration a pris beaucoup plus de temps que prévu.", "Procédure réécrite étape par étape et nouveau test chronométré."]],
      learn: "Une sauvegarde n'est fiable que si on a déjà testé la restauration."
    },
    'bts-wazuh': {
      obj: "Rassembler les journaux de sécurité et être alerté en cas de comportement anormal.",
      diff: [["Le serveur Wazuh s'arrêtait seul faute de mémoire.", "Augmentation de la mémoire de la machine virtuelle et réglage de la mémoire allouée."], ["Beaucoup trop d'alertes peu utiles au début.", "Tri sur une semaine et relèvement du niveau des alertes envoyées par e-mail."]],
      learn: "Un SIEM demande du réglage : sans tri, les vraies alertes sont noyées."
    },
    'bts-galera': {
      obj: "Qu'une application continue de fonctionner quand un serveur de base de données s'arrête.",
      diff: [["Après l'arrêt des trois serveurs, le cluster ne redémarrait plus.", "Redémarrage depuis le serveur qui avait les données les plus récentes, en suivant la procédure officielle."]],
      learn: "La haute disponibilité se prépare : il faut savoir quoi faire quand tout s'arrête."
    },
    'bts-web': {
      obj: "Publier le site de la PME sans exposer le réseau interne.",
      diff: [["Le navigateur affichait une alerte de sécurité.", "Installation correcte du certificat et redirection automatique vers HTTPS."]],
      learn: "Isoler ce qui est exposé à Internet dans une DMZ, et ne donner que les droits nécessaires."
    },
    'bac-chef-oeuvre': {
      obj: "Concevoir et construire en groupe le réseau d'une entreprise, puis le présenter devant un jury.",
      diff: [["Le budget ne permettait pas tout le matériel prévu au départ.", "Comparaison des offres et choix d'un matériel plus simple qui répondait au besoin."], ["Répartir le travail dans le groupe.", "Un planning partagé et un point chaque semaine."]],
      learn: "Travailler en équipe sur un vrai projet, du besoin jusqu'à la présentation orale."
    },
    'bac-baie': {
      obj: "Équiper une salle de six postes, de la baie jusqu'aux prises.",
      diff: [["Un câble ne passait pas le test de continuité.", "Une paire était inversée au sertissage : nouveau sertissage et nouveau test."]],
      learn: "La rigueur dans le câblage et l'étiquetage évite des heures de recherche plus tard."
    },
    'bac-cisco': {
      obj: "Séparer le réseau en plusieurs parties et les faire communiquer par le routeur.",
      diff: [["Les postes d'un VLAN ne joignaient pas ceux d'un autre.", "Le lien entre le switch et le routeur n'était pas configuré en trunk."]],
      learn: "Les bases des VLAN et du routage, que j'utilise encore au travail."
    },
    'bac-video': {
      obj: "Filmer et enregistrer l'entrée d'un bâtiment, sur un réseau séparé.",
      diff: [["Une caméra ne s'allumait pas.", "Le port du switch n'était pas activé en PoE."]],
      learn: "Le PoE simplifie l'installation, et les caméras doivent être isolées du reste du réseau."
    },
    'bac-wifi': {
      obj: "Donner Internet aux visiteurs sans accès aux ordinateurs du personnel.",
      diff: [["Le réseau invités voyait les autres appareils.", "Activation de l'isolation des clients et VLAN dédié."]],
      learn: "Un réseau invités doit toujours être séparé du réseau interne."
    },
    'bac-toip': {
      obj: "Comprendre le fonctionnement de la téléphonie sur IP.",
      diff: [["Les appels passaient mais sans le son dans un sens.", "Ouverture des bons ports sur le pare-feu de la maquette."]],
      learn: "Comment un appel passe sur le réseau, et l'utilité de Wireshark pour comprendre un problème."
    },
    'bac-serveur': {
      obj: "Permettre aux élèves de se connecter avec leur compte sur tous les postes de la salle.",
      diff: [["Un poste n'arrivait pas à rejoindre le domaine.", "Son DNS ne pointait pas vers le serveur : correction et nouvelle tentative."]],
      learn: "Ma première installation d'un serveur et d'un domaine, la base de tout ce que je fais aujourd'hui."
    },
    'bac-maintenance': {
      obj: "Remettre en service des PC donnés au lycée.",
      diff: [["Des pannes difficiles à identifier (redémarrages aléatoires).", "Test des composants un par un : mémoire, puis alimentation."]],
      learn: "Une méthode de diagnostic : du plus simple au plus compliqué, une pièce à la fois."
    },
    'perso-lab': {
      obj: "Avoir un endroit pour m'entraîner et tester sans risque.",
      diff: [["Le PC manquait de mémoire avec beaucoup de VM allumées.", "Ajout de mémoire et utilisation de conteneurs LXC pour les petits services."]],
      learn: "Tester chez soi avant de toucher à une vraie infrastructure."
    },
    'perso-docker': {
      obj: "Apprendre Docker avec des services que j'utilise vraiment.",
      diff: [["Un service restait accessible sans passer par le proxy.", "Suppression de la publication directe du port : tout passe par Nginx Proxy Manager."]],
      learn: "Organiser ses conteneurs proprement et ne rien exposer sans raison."
    },
    'perso-pihole': {
      obj: "Filtrer les publicités et les sites dangereux pour tous les appareils de la maison.",
      diff: [["Un site utile était bloqué par erreur.", "Ajout à la liste blanche."]],
      learn: "Le fonctionnement du DNS au quotidien."
    },
    'perso-wireguard': {
      obj: "Administrer mon lab depuis l'extérieur sans rien exposer.",
      diff: [["Le téléphone était connecté mais n'accédait à rien.", "Il manquait la règle de pare-feu qui autorise le VPN vers le réseau d'administration."]],
      learn: "Un VPN bien réglé est plus sûr que d'ouvrir des ports sur Internet."
    },
    'perso-fichiers': {
      obj: "Reproduire chez moi un serveur de fichiers comme en entreprise.",
      diff: [["Des utilisateurs voyaient des dossiers qu'ils ne pouvaient pas ouvrir.", "Activation de l'option qui masque les dossiers sans droit d'accès."]],
      learn: "Les droits par groupes et les versions précédentes, que je retrouve au travail."
    },
    'perso-powershell': {
      obj: "Gagner du temps sur les tâches qui reviennent souvent.",
      diff: [["Peur de faire une erreur sur beaucoup de comptes d'un coup.", "Un mode simulation qui montre ce qui va être fait avant de le faire."]],
      learn: "Automatiser oui, mais toujours tester avant."
    },
    'perso-rootme': {
      obj: "Comprendre les attaques pour mieux protéger les systèmes.",
      diff: [["Des challenges bloquants pendant longtemps.", "Reprendre la théorie, chercher dans la documentation, et y revenir plus tard."]],
      learn: "La persévérance, et de bons réflexes pour repérer une mauvaise configuration."
    },
    'perso-portfolio': {
      obj: "Présenter clairement mon parcours, mon travail et mes projets.",
      diff: [["Trouver le bon ton : ni trop technique, ni exagéré.", "Relire chaque texte et ne garder que ce que je sais expliquer."]],
      learn: "Présenter son travail simplement est un vrai exercice."
    }
  };
  PROJECTS.forEach(function (p) {
    var d = DETAILS[p.id];
    if (d) { p.obj = d.obj; p.diff = d.diff; p.learn = d.learn; }
  });

  var state = { group: 'all', q: '' };

  function cardHTML(p) {
    var shot = p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<span class="proj__glyph">' + icon(p.icon) + '</span>';
    return '<article class="panel proj reveal c-' + p.c + (p.featured ? ' is-featured' : '') + '" tabindex="0" role="button" data-id="' + p.id + '" aria-label="' + esc('Ouvrir la fiche : ' + p.title) + '">' +
      '<div class="proj__shot">' + shot + '<span class="proj__tag"><span class="lamp"></span>' + esc(p.tag) + '</span></div>' +
      '<div class="proj__body"><span class="proj__date">' + esc(p.date) + '</span><h3>' + esc(p.title) + '</h3>' +
      '<p class="proj__sum">' + esc(p.sum) + '</p>' +
      '<ul class="proj__tools">' + p.tools.slice(0, p.featured ? 8 : 4).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></article>';
  }

  function renderProjects() {
    var wrap = $('#projectsGrid'), bar = $('#filters');
    bar.innerHTML = GROUPS.map(function (g, i) {
      var n = g.k === 'all' ? PROJECTS.length : PROJECTS.filter(function (p) { return p.g.indexOf(g.k) > -1; }).length;
      return '<button type="button" data-g="' + g.k + '" class="' + (i ? '' : 'is-on') + '" aria-pressed="' + (!i) + '">' + esc(g.label) + '<span>' + n + '</span></button>';
    }).join('');
    wrap.innerHTML = BLOCKS.map(function (b) {
      var list = PROJECTS.filter(function (p) { return p.block === b.k; });
      return '<div class="pblock" data-block="' + b.k + '">' +
        '<h3 class="pblock__title"><span class="lamp ' + (b.k === 'phare' ? 'up pulse' : 'violet') + '"></span>' + esc(b.title) +
        '<small>' + esc(b.sub) + '</small><span class="pblock__count">' + list.length + '</span></h3>' +
        '<div class="grid grid--3">' + list.map(cardHTML).join('') + '</div></div>';
    }).join('');
    $$('[data-count-projects]').forEach(function (el) { el.setAttribute('data-count', PROJECTS.length); el.textContent = PROJECTS.length; });

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-g]');
      if (!b) return;
      state.group = b.getAttribute('data-g');
      $$('button', bar).forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      applyFilter();
    });
    wrap.addEventListener('click', function (e) {
      var c = e.target.closest('.proj');
      if (c) openProject(c.getAttribute('data-id'), c);
    });
    wrap.addEventListener('keydown', function (e) {
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
    $$('.pblock').forEach(function (b) {
      var n = $$('.proj:not(.is-hidden)', b).length;
      b.hidden = n === 0;
      $('.pblock__count', b).textContent = n;
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
      (p.obj ? '<section><h3><i data-i="radar"></i>L\'objectif</h3><p>' + esc(p.obj) + '</p></section>' : '') +
      '<section><h3><i data-i="list"></i>Ce que j\'ai fait</h3><ol class="mp__steps">' + p.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></section>' +
      (p.img ? '<figure class="mp__img"><img src="' + esc(p.img) + '" alt="' + esc(p.imgAlt) + '" loading="lazy"><figcaption>' + esc(p.imgAlt) + '</figcaption></figure>' : '') +
      (p.diff && p.diff.length ? '<section><h3><i data-i="tool"></i>Difficultés rencontrées</h3><div class="mp__diff">' + p.diff.map(function (x) {
        return '<div><p><strong>Problème :</strong> ' + esc(x[0]) + '</p><p><strong>Solution :</strong> ' + esc(x[1]) + '</p></div>';
      }).join('') + '</div></section>' : '') +
      '<section class="mp__result"><h3><i data-i="check"></i>Le résultat</h3><p>' + esc(p.result) + '</p></section>' +
      (p.learn ? '<section><h3><i data-i="school"></i>Ce que j\'en retiens</h3><p>' + esc(p.learn) + '</p></section>' : '') +
      '<section><h3><i data-i="star"></i>Compétences mobilisées</h3><ul class="chips">' + p.skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>' +
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

  /* ---------------------------------------------------------
     Petites animations : progression, halo, titre tapé
     --------------------------------------------------------- */
  function initAnimations() {
    var bar = $('#progress');
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (reduce) return;

    if (window.matchMedia('(hover: hover)').matches) {
      document.addEventListener('pointermove', function (e) {
        var p = e.target.closest && e.target.closest('.panel');
        if (!p) return;
        var r = p.getBoundingClientRect();
        p.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        p.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    }

    var role = $('#typeRole');
    if (role) {
      var text = role.getAttribute('data-text'), i = 0;
      role.textContent = '';
      role.classList.add('is-typing');
      setTimeout(function step() {
        role.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 45);
        else setTimeout(function () { role.classList.remove('is-typing'); }, 1600);
      }, 400);
    }
  }

  function initFilterLinks() {
    $$('[data-filter]').forEach(function (a) {
      a.addEventListener('click', function () {
        var b = $('#filters button[data-g="' + a.getAttribute('data-filter') + '"]');
        if (b) b.click();
      });
    });
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
    initFilterLinks();
    initAnimations();
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
