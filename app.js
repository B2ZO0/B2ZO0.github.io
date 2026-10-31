/* ==========================================================================
   ENZO MARECHAL — PORTFOLIO v4
   app.js — Application principale (module ES)
   --------------------------------------------------------------------------
   Architecture
   00. Contrat de données (pour data-projets.js et data-procedures-*.js)
   01. Utilitaires
   02. Données : profil, technologies, compétences
   03. Données : homelab (VLANs, équipements, liens, flux, pare-feu, matériel)
   04. Données : registre des 15 projets
   05. Données : procédure intégrée (référentiel du homelab)
   06. Store : fusion des données externes
   07. Preloader
   08. Smooth scroll (Lenis) + GSAP / ScrollTrigger + reveals
   09. Navigation, scrollspy, menu mobile, progression
   10. Spotlight, tilt, effets magnétiques
   11. Hero : Typed.js, console de supervision, compteurs
   12. Hero 3D : topologie réseau Three.js
   13. Stack 3D : galaxie de badges Three.js
   14. Mission : visualisation des ports switch, marquee
   15. Timeline du parcours & compétences
   16. Homelab : génération du SVG, flux animés, interactions, iso 3D
   17. Homelab : onglets IPAM / matrice / règles / matériel
   18. Projets : grille, filtres, modale de dossier
   19. Moteur Markdown + coloration syntaxique
   20. Wiki : index, recherche, filtres, cartes
   21. Wiki : lecteur plein écran, sommaire, scrollspy, copie
   22. Palette de commandes (Ctrl/⌘ + K)
   23. tsParticles, contact, footer
   24. Routage par hash (#wiki/<id>, #projet/<id>)
   25. Boot
   ========================================================================== */

/* ==========================================================================
   00. CONTRAT DE DONNÉES
   --------------------------------------------------------------------------
   Les fichiers de données sont chargés AVANT ce module (scripts "defer").
   S'ils sont absents, le site fonctionne avec les données intégrées.

   ── data-projets.js ──────────────────────────────────────────────────────
   window.PORTFOLIO_PROJECT_DETAILS = window.PORTFOLIO_PROJECT_DETAILS || {};
   window.PORTFOLIO_PROJECT_DETAILS['proxmox-ha'] = {
     svg: '<svg viewBox="0 0 900 420">…</svg>',   // schéma d'architecture
     kpis: [{ v: '3', l: 'nœuds' }, …],           // remplace les métriques
     content: `## Contexte …markdown…`,           // dossier complet (markdown)
     gallery: [{ src: 'grafana-dashboard.png', caption: '…' }],
     procedures: ['proc-012', 'proc-013'],        // liens vers le wiki
     duration: '6 semaines', role: 'Conception & réalisation'
   };

   ── data-procedures-N.js ────────────────────────────────────────────────
   (window.WIKI_PROCEDURES = window.WIKI_PROCEDURES || []).push({
     id: 'proc-012',                      // unique, utilisé dans l'URL #wiki/proc-012
     title: 'Déployer pfSense en CARP',
     category: 'Réseau',                  // voir WIKI_CATEGORIES
     techs: ['pfsense', 'cisco'],         // clés de TECHS (inconnues acceptées)
     level: 'Avancé',                     // Débutant | Intermédiaire | Avancé | Expert
     date: '2026-09-14',
     summary: 'Résumé court affiché sur la carte.',
     project: 'pfsense-carp',             // optionnel : lien vers un projet
     env: { OS: 'pfSense 2.7.2', Hyperviseur: 'Proxmox VE 8.2' }, // optionnel
     content: `markdown…`
   });

   Markdown supporté : # à ####, paragraphes, **gras**, *italique*, `code`,
   [lien](url), ![image](src), listes - / 1. (imbriquées), cases - [ ] / - [x],
   tableaux | a | b |, --- , [[Ctrl+K]] → <kbd>, ==surligné==,
   callouts « > [!INFO] Titre » (INFO, TIP, SUCCESS, WARN, DANGER, NOTE, SEC),
   blocs de code « ~~~bash title="fichier.sh" hl="3,5-7" » … « ~~~ »,
   blocs spéciaux : ~~~terminal (prompts colorés), ~~~ascii, ~~~svg, ~~~html.
   Langages colorés : bash, powershell, cisco, yaml, ini/conf, nginx, sql,
   json, xml/html, js, dockerfile, apache, php, python, diff, text.

   ⚠ Dans un template literal JS : échapper ` en \` et ${ en \${.
   ========================================================================== */

/* ==========================================================================
   01. UTILITAIRES
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, l = 2) => String(n).padStart(l, '0');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;
const isMobile = () => window.innerWidth < 760;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const lib = {
  get gsap() { return window.gsap; },
  get ScrollTrigger() { return window.ScrollTrigger; },
  get Lenis() { return window.Lenis; },
  get VanillaTilt() { return window.VanillaTilt; },
  get Typed() { return window.Typed; },
  get tsParticles() { return window.tsParticles; }
};

function debounce(fn, wait = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function throttle(fn, wait = 16) {
  let last = 0;
  let t;
  return (...args) => {
    const now = performance.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(t);
      t = setTimeout(() => {
        last = performance.now();
        fn(...args);
      }, remaining);
    }
  };
}

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHTML = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
const escapeAttr = escapeHTML;

const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.\-/+#_ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (s = '') =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'section';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgbString = (hex) => hexToRgb(hex).join(', ');

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plural(n, sing, plur) {
  return `${n} ${n > 1 ? plur || sing + 's' : sing}`;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* repli ci-dessous */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  ta.remove();
  return ok;
}

function toast(message, type = 'success', duration = 2400) {
  const host = $('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : 'i'}</span><span>${escapeHTML(message)}</span>`;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

function onVisible(el, cb, options = { rootMargin: '200px' }) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) {
    cb(true);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => cb(e.isIntersecting));
  }, options);
  io.observe(el);
  return io;
}

function once(el, cb, options = { rootMargin: '0px 0px -10% 0px' }) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) {
    cb();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        cb();
        io.disconnect();
      }
    });
  }, options);
  io.observe(el);
}

function svgEl(tag, attrs = {}, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v);
  });
  children.forEach((c) => c && el.appendChild(c));
  return el;
}

/* ==========================================================================
   02. DONNÉES : PROFIL, TECHNOLOGIES, COMPÉTENCES
   ========================================================================== */
const PROFILE = {
  name: 'Enzo MARECHAL',
  email: 'marechal.enzo27@gmail.com',
  phone: '+33782165772',
  city: 'Caen, Normandie',
  roles: [
    'administration systèmes &amp; réseaux',
    'déploiement MDT / WDS industrialisé',
    'Active Directory &amp; durcissement GPO',
    'virtualisation Proxmox VE en HA',
    'segmentation VLAN &amp; pfSense CARP',
    'supervision Zabbix + Grafana',
    'détection SIEM avec Wazuh',
    'automatisation Ansible &amp; PowerShell'
  ],
  timeline: [
    {
      id: 'next',
      future: true,
      color: '#8b7bff',
      type: 'Objectif',
      date: 'Prochaine rentrée',
      duration: 'Cycle de 3 ans',
      role: 'Cycle ingénieur en alternance',
      org: 'Infrastructures · Cloud · Cybersécurité',
      desc: "Poursuivre en école d'ingénieurs pour passer de l'exploitation à la conception d'architectures : haute disponibilité, cloud hybride, sécurité défensive et pilotage de projets d'infrastructure.",
      list: [
        'Architecture réseau et systèmes à grande échelle',
        'Cloud public / hybride et Infrastructure as Code',
        'Sécurité défensive, SOC et gestion des identités',
        'Gestion de projet et conduite du changement'
      ]
    },
    {
      id: 'attineos',
      current: true,
      color: '#f6a623',
      type: 'CDI',
      date: '2026 — Aujourd’hui',
      duration: 'En poste',
      role: 'Technicien Systèmes et Réseaux',
      org: 'Attineos Infrastructures · Caen — en régie sur site industriel (Verson)',
      desc: "ESN caennaise organisée en trois pôles (Applications, Cybersécurité, Infrastructures). Déployé en régie dans une usine, je prends en charge l'administration système et réseau du site de bout en bout.",
      list: [
        'Déploiement de postes MDT / WDS, BIOS automatisé HP BCU',
        'Active Directory, GPO, DNS / DHCP',
        'Gestion des mots de passe avec Vaultwarden',
        'Téléphonie VoIP 3CX',
        'Architecture de switchs, VLANs, trunks',
        'RMM, supervision et automatisation',
        'Support niveau 2 / 3 et rédaction de procédures',
        'Interlocuteur direct de la production et de la DSI client'
      ]
    },
    {
      id: 'armatis',
      color: '#34d399',
      type: 'Alternance',
      date: 'Août 2024 — Août 2026',
      duration: '2 ans',
      role: 'Technicien Support Systèmes & Réseaux',
      org: 'Armatis · Caen — BTS SIO option SISR (AFTEC Caen)',
      desc: "Centre de relation client de plusieurs centaines de collaborateurs : maintien en condition opérationnelle du parc, du réseau et de la téléphonie dans un environnement où chaque poste est en production.",
      list: [
        'Support utilisateurs N1 / N2, gestion des tickets ITSM',
        'Déploiement et préparation de postes Windows 11',
        'Comptes, groupes et GPO Active Directory',
        'Brassage, diagnostic réseau, VLANs sur switchs',
        'Téléphonie IP et outils métiers des agents',
        'Projets E6 : Ansible × Proxmox et Zabbix + Grafana'
      ]
    },
    {
      id: 'bacpro',
      color: '#22d3ee',
      type: 'Diplôme',
      date: '2020 — 2023',
      duration: 'Obtenu en 2023',
      role: 'Bac Pro Systèmes Numériques — option RISC',
      org: 'Lycée Charles Tellier · Condé-sur-Noireau',
      desc: "Réseaux Informatiques et Systèmes Communicants : les fondamentaux du câblage, de l'adressage IP, de la commutation et de l'administration système, consolidés par quatre stages en entreprise.",
      list: [
        'Câblage structuré, brassage, tests de certification',
        'Adressage IP, VLANs, routage statique',
        'Installation de serveurs Windows et Linux',
        'Maintenance matérielle et logicielle'
      ],
      sub: [
        { org: 'Chauvin Arnoux Group', when: 'Mars — Avr. 2023', text: 'MDT, chiffrement de disques, RAID, VLANs sur switchs.' },
        { org: 'CdC Cœur Côte Fleurie', when: 'Nov. — Déc. 2022', text: 'Installation de Zabbix, déploiement de postes, brassage.' },
        { org: 'Ville de Cabourg — FabLab', when: 'Mai — Juil. 2022', text: 'Programmation JS, modélisation 2D/3D, découpe laser.' },
        { org: 'LISI Medical', when: 'Janv. — Févr. 2022', text: 'Diagnostic réseau et configuration de switchs.' }
      ]
    }
  ]
};

/* Technologies : utilisées par la galaxie 3D, le marquee, les filtres du wiki */
const TECHS = {
  proxmox: {
    name: 'Proxmox VE', mono: 'PX', color: '#ff8a3d', cat: 'Virtualisation', level: 88, core: true,
    desc: "Hyperviseur de mon homelab : cluster 3 nœuds avec Ceph, haute disponibilité et sauvegardes Proxmox Backup Server.",
    uses: ['Cluster HA 3 nœuds + quorum corosync', 'Stockage distribué Ceph RBD', 'Templates cloud-init et clones liés']
  },
  zabbix: {
    name: 'Zabbix', mono: 'ZB', color: '#ef4444', cat: 'Supervision', level: 84, core: true,
    desc: "Supervision de l'ensemble de l'infra : agents actifs, SNMP sur les switchs, découverte réseau et alerting.",
    uses: ['Templates Linux / Windows / Cisco SNMP', 'Triggers avec dépendances', 'Alertes vers mail et Teams']
  },
  glpi: {
    name: 'GLPI', mono: 'GL', color: '#60a5fa', cat: 'ITSM', level: 80, core: true,
    desc: "ITSM et gestion de parc : tickets, inventaire automatique via GLPI Agent, base de connaissances.",
    uses: ['Inventaire automatique GLPI Agent', 'Catégories ITIL et SLA', 'Règles d’affectation des tickets']
  },
  cisco: {
    name: 'Cisco IOS', mono: 'CS', color: '#22d3ee', cat: 'Réseau', level: 82, core: true,
    desc: "Commutation d'entreprise : VLANs, trunks 802.1Q, EtherChannel LACP, Rapid-PVST+, sécurité de port.",
    uses: ['Trunks et VLANs natifs isolés', 'EtherChannel LACP vers pfSense', 'Port-security, DHCP snooping, BPDU guard']
  },
  pfsense: {
    name: 'pfSense', mono: 'pf', color: '#818cf8', cat: 'Sécurité réseau', level: 86, core: true,
    desc: "Pare-feu périmétrique en cluster CARP : routage inter-VLAN filtré, VPN nomades et site-à-site.",
    uses: ['CARP + pfsync + XMLRPC', 'WireGuard et OpenVPN', 'Alias, règles par interface, NAT']
  },
  debian: {
    name: 'Debian', mono: 'DB', color: '#f43f5e', cat: 'Systèmes Linux', level: 85, core: true,
    desc: "Distribution de référence pour mes serveurs : durcissement, systemd, nftables, unattended-upgrades.",
    uses: ['Durcissement SSH et sudo', 'Services systemd et journald', 'Mises à jour automatiques sécurisées']
  },
  windows: {
    name: 'Windows Server', mono: 'WS', color: '#38bdf8', cat: 'Systèmes Windows', level: 87, core: true,
    desc: "Windows Server 2022 : AD DS, DNS, DHCP, WDS, WSUS, AD CS et NPS dans un domaine à deux contrôleurs.",
    uses: ['AD DS sur 2 contrôleurs', 'DHCP en failover', 'WDS, WSUS, AD CS, NPS']
  },
  docker: {
    name: 'Docker', mono: 'DK', color: '#3b82f6', cat: 'Conteneurs', level: 78, core: true,
    desc: "Conteneurisation des services web : Vaultwarden, outils internes, stacks docker compose versionnées.",
    uses: ['docker compose versionné sous Git', 'Réseaux isolés par stack', 'Healthchecks et redémarrage auto']
  },
  ansible: {
    name: 'Ansible', mono: 'AN', color: '#f87171', cat: 'Automatisation', level: 80, core: true,
    desc: "Infrastructure as Code : rôles idempotents pour le durcissement, les agents de supervision et les déploiements.",
    uses: ['Rôles et inventaires par environnement', 'Ansible Vault pour les secrets', 'Playbooks idempotents testés']
  },
  ad: { name: 'Active Directory', mono: 'AD', color: '#a78bfa', cat: 'Identité', level: 86, desc: "Annuaire, OU, délégation, AGDLP, tiering et GPO de durcissement.", uses: ['Modèle AGDLP', 'Délégation par OU', 'GPO de sécurité'] },
  gpo: { name: 'GPO', mono: 'GP', color: '#c4b5fd', cat: 'Identité', level: 84, desc: "Stratégies de groupe de configuration et de sécurité.", uses: ['Baselines de sécurité', 'Préférences de stratégie', 'Filtrage WMI'] },
  powershell: { name: 'PowerShell', mono: 'PS', color: '#60a5fa', cat: 'Automatisation', level: 82, desc: "Scripts d'administration AD, postes et reporting.", uses: ['Création de comptes en masse', 'Audits et rapports', 'Remédiation RMM'] },
  mdt: { name: 'MDT / WDS', mono: 'MD', color: '#2dd4bf', cat: 'Déploiement', level: 88, desc: "Industrialisation du déploiement de postes Windows par PXE.", uses: ['Séquences de tâches', 'Pilotes par modèle', 'CustomSettings.ini'] },
  hpbcu: { name: 'HP BCU', mono: 'BC', color: '#5eead4', cat: 'Déploiement', level: 76, desc: "Configuration BIOS HP en ligne de commande.", uses: ['Secure Boot, TPM', 'Mot de passe BIOS', 'Ordre de boot'] },
  wazuh: { name: 'Wazuh', mono: 'WZ', color: '#34d399', cat: 'Sécurité', level: 74, desc: "SIEM / XDR open source : collecte, corrélation, FIM, détection.", uses: ['Agents Windows / Linux', 'Règles personnalisées', 'Mapping MITRE ATT&CK'] },
  grafana: { name: 'Grafana', mono: 'GF', color: '#fb923c', cat: 'Supervision', level: 78, desc: "Tableaux de bord branchés sur Zabbix.", uses: ['Plugin Zabbix', 'Dashboards par service', 'Alerting'] },
  '3cx': { name: '3CX', mono: '3C', color: '#facc15', cat: 'Téléphonie', level: 76, desc: "IPBX logiciel : trunks SIP, postes, files d'attente.", uses: ['Trunk SIP opérateur', 'Provisioning des postes', 'Files et SVI'] },
  vaultwarden: { name: 'Vaultwarden', mono: 'VW', color: '#94a3b8', cat: 'Sécurité', level: 80, desc: "Gestionnaire de mots de passe compatible Bitwarden.", uses: ['Organisations et collections', '2FA obligatoire', 'Sauvegardes chiffrées'] },
  mariadb: { name: 'MariaDB Galera', mono: 'MB', color: '#c084fc', cat: 'Bases de données', level: 72, desc: "Cluster multi-maître synchrone derrière HAProxy.", uses: ['3 nœuds synchrones', 'HAProxy + keepalived', 'Sauvegardes mariabackup'] },
  nginx: { name: 'Nginx', mono: 'NX', color: '#4ade80', cat: 'Services web', level: 78, desc: "Reverse proxy TLS en DMZ.", uses: ['TLS 1.3 + HSTS', 'En-têtes de sécurité', 'Limitation de débit'] },
  wireguard: { name: 'WireGuard', mono: 'WG', color: '#f472b6', cat: 'VPN', level: 78, desc: "VPN moderne pour l'administration à distance.", uses: ['Accès nomade', 'Site-à-site', 'Clés par appareil'] },
  openvpn: { name: 'OpenVPN', mono: 'OV', color: '#fdba74', cat: 'VPN', level: 72, desc: "VPN SSL avec authentification par certificats.", uses: ['PKI dédiée', 'Export client', 'Authentification RADIUS'] },
  bash: { name: 'Bash', mono: 'SH', color: '#a3e635', cat: 'Automatisation', level: 80, desc: "Scripting Linux.", uses: ['Scripts de sauvegarde', 'Outils de diagnostic', 'Automatisation cron/systemd'] },
  pbs: { name: 'Proxmox Backup', mono: 'PB', color: '#fdba74', cat: 'Sauvegarde', level: 78, desc: "Sauvegardes dédupliquées et chiffrées.", uses: ['Rétention GFS', 'Vérification', 'Synchronisation distante'] },
  ceph: { name: 'Ceph', mono: 'CE', color: '#f97316', cat: 'Stockage', level: 66, desc: "Stockage distribué hyperconvergé.", uses: ['Pools RBD', 'Réplication ×3', 'Supervision santé'] },
  adcs: { name: 'AD CS / PKI', mono: 'CA', color: '#e879f9', cat: 'Sécurité', level: 70, desc: "Autorité de certification d'entreprise.", uses: ['Modèles de certificats', 'Auto-enrollment', 'CRL / AIA'] },
  nps: { name: 'NPS / RADIUS', mono: 'RD', color: '#f0abfc', cat: 'Sécurité', level: 68, desc: "Authentification 802.1X des postes et du Wi-Fi.", uses: ['EAP-TLS', 'Politiques réseau', 'VLAN dynamique'] },
  rmm: { name: 'RMM', mono: 'RM', color: '#5eead4', cat: 'Exploitation', level: 78, desc: "Supervision et gestion à distance du parc.", uses: ['Scripts à distance', 'Patch management', 'Alertes proactives'] },
  linux: { name: 'Linux', mono: 'LX', color: '#fde047', cat: 'Systèmes Linux', level: 84, desc: "Administration Linux générale.", uses: ['systemd', 'Réseau', 'Durcissement'] },
  haproxy: { name: 'HAProxy', mono: 'HA', color: '#22c55e', cat: 'Services web', level: 70, desc: "Répartition de charge TCP/HTTP.", uses: ['Health checks', 'VIP keepalived', 'Stats'] },
  vlan: { name: 'VLAN / 802.1Q', mono: 'VL', color: '#38bdf8', cat: 'Réseau', level: 86, desc: "Segmentation réseau.", uses: ['Plan VLAN', 'Trunks', 'VLAN natif isolé'] }
};

const CORE_TECHS = ['proxmox', 'zabbix', 'glpi', 'cisco', 'pfsense', 'debian', 'windows', 'docker', 'ansible'];
const ORBIT_TECHS = ['ad', 'powershell', 'mdt', 'wazuh', 'grafana', '3cx', 'vaultwarden', 'mariadb', 'nginx', 'wireguard', 'pbs', 'bash'];

function techInfo(key) {
  const k = String(key || '').toLowerCase();
  if (TECHS[k]) return { key: k, ...TECHS[k] };
  const found = Object.entries(TECHS).find(([, t]) => normalize(t.name) === normalize(key));
  if (found) return { key: found[0], ...found[1] };
  return { key: k, name: key, mono: String(key).slice(0, 2).toUpperCase(), color: '#94a3b8', cat: 'Autre', level: 60, desc: '', uses: [] };
}

const SKILL_DOMAINS = [
  { name: 'Réseau & commutation', score: 84, color: '#22d3ee', items: ['VLAN 802.1Q', 'Trunk / LACP', 'STP', 'Routage', 'DHCP / DNS', 'Wi-Fi'] },
  { name: 'Systèmes Windows', score: 87, color: '#38bdf8', items: ['AD DS', 'GPO', 'WDS / MDT', 'WSUS', 'AD CS', 'NPS'] },
  { name: 'Systèmes Linux', score: 83, color: '#f43f5e', items: ['Debian', 'systemd', 'nftables', 'SSH', 'LVM', 'Bash'] },
  { name: 'Virtualisation & stockage', score: 85, color: '#ff8a3d', items: ['Proxmox VE', 'HA', 'Ceph', 'PBS', 'Hyper-V', 'Docker'] },
  { name: 'Sécurité défensive', score: 78, color: '#f472b6', items: ['pfSense', 'Wazuh', 'Durcissement', 'PKI', '802.1X', 'Vaultwarden'] },
  { name: 'Supervision & ITSM', score: 82, color: '#ef4444', items: ['Zabbix', 'Grafana', 'GLPI', 'RMM', 'SNMP', 'Syslog'] },
  { name: 'Automatisation', score: 79, color: '#a3e635', items: ['Ansible', 'PowerShell', 'Bash', 'Git', 'cloud-init', 'Cron'] },
  { name: 'Téléphonie & industriel', score: 74, color: '#facc15', items: ['3CX', 'SIP / RTP', 'QoS', 'LLDP-MED', 'Réseaux OT', 'Modbus TCP'] }
];

/* ==========================================================================
   03. DONNÉES : HOMELAB
   --------------------------------------------------------------------------
   Schéma en coordonnées viewBox 0 0 1400 900.
   Zones VLAN : 5 colonnes de 256 px, y 400 → 860.
   Routage inter-VLAN effectué par pfSense (router-on-a-stick sur LAGG).
   ========================================================================== */
const VLANS = [
  {
    id: 10, key: 'v10', short: 'MGMT', name: 'Administration / Management', net: '10.10.10.0/24', gw: '10.10.10.1',
    dhcp: 'Statique uniquement', color: '#8b7bff', mask: '255.255.255.0',
    desc: "Interfaces d'administration des hyperviseurs, du switch et des cartes iDRAC/iLO. Accessible uniquement depuis le bastion ou le VPN admin.",
    reserved: ['.1 VIP CARP', '.2 SW-CORE-01', '.11-.13 PVE', '.20 Ansible', '.30 PBS', '.50 Bastion', '.101-.103 OOB', '.252/.253 pfSense']
  },
  {
    id: 20, key: 'v20', short: 'SRV', name: 'Serveurs & Production (AD / BDD)', net: '10.10.20.0/24', gw: '10.10.20.1',
    dhcp: 'Statique uniquement', color: '#22d3ee', mask: '255.255.255.0',
    desc: "Cœur applicatif : contrôleurs de domaine, PKI, bases de données Galera, GLPI, Zabbix et Wazuh.",
    reserved: ['.1 VIP CARP', '.10-.11 DC', '.15 PKI', '.30 VIP HAProxy', '.31-.33 Galera', '.40 GLPI', '.50 Zabbix', '.60 Wazuh']
  },
  {
    id: 30, key: 'v30', short: 'DMZ', name: 'DMZ — Services web & reverse proxy', net: '10.10.30.0/24', gw: '10.10.30.1',
    dhcp: 'Statique uniquement', color: '#f472b6', mask: '255.255.255.0',
    desc: "Seule zone exposée via NAT. Le reverse proxy Nginx publie les services ; la DMZ ne peut initier aucune connexion vers le LAN.",
    reserved: ['.1 VIP CARP', '.10 Nginx RP', '.20 Vaultwarden', '.25 Relais SMTP', '.30 Web']
  },
  {
    id: 40, key: 'v40', short: 'VOIP', name: 'VoIP 3CX & IoT industriel', net: '10.10.40.0/24', gw: '10.10.40.1',
    dhcp: '10.10.40.100 → .199 (option 66 provisioning)', color: '#fbbf24', mask: '255.255.255.0',
    desc: "Postes IP et IPBX 3CX avec QoS DSCP EF, plus les équipements IoT/OT isolés derrière une passerelle.",
    reserved: ['.1 VIP CARP', '.5 AP IoT', '.10 3CX', '.100-.199 DHCP postes', '.200 Passerelle IoT', '.210 Automate']
  },
  {
    id: 50, key: 'v50', short: 'PXE', name: 'Déploiement PXE (WDS / MDT)', net: '10.10.50.0/24', gw: '10.10.50.1',
    dhcp: '10.10.50.100 → .199 (relais vers DC01/DC02)', color: '#34d399', mask: '255.255.255.0',
    desc: "Réseau de préparation des postes : boot PXE UEFI, déploiement MDT, configuration BIOS, avant bascule en production.",
    reserved: ['.1 VIP CARP', '.10 WDS / MDT', '.15 WSUS', '.100-.199 DHCP PXE']
  }
];

const VLAN_BY_ID = Object.fromEntries(VLANS.map((v) => [v.id, v]));

const ZONE_W = 256;
const ZONE_GAP = 20;
const ZONE_X0 = 20;
const ZONE_Y = 400;
const ZONE_H = 470;
const BUS_Y = 350;
const CORE = { x: 700, y: 300 };

VLANS.forEach((v, i) => {
  v.x = ZONE_X0 + i * (ZONE_W + ZONE_GAP);
  v.cx = v.x + ZONE_W / 2;
});

/* Types d'icônes disponibles : cloud, firewall, switch, server, hypervisor, db, shield,
   phone, pc, iot, ap, backup, terminal, oob, web, mail, key, chart, inventory, deploy, cert */
const NODES = [
  { id: 'internet', name: 'Internet / FAI', type: 'cloud', vlan: 'wan', x: 700, y: 52, ip: '203.0.113.10 (WAN)', role: 'Accès fibre FTTH · IP fixe', os: '—', status: 'ok',
    desc: "Lien WAN fibre avec IP publique fixe. Seuls les ports 443/TCP (reverse proxy), 51820/UDP (WireGuard), 1194/UDP (OpenVPN) et le trunk SIP sont ouverts en entrée.",
    services: [{ p: '443/tcp', n: 'NAT → NGINX-RP' }, { p: '51820/udp', n: 'WireGuard' }, { p: '1194/udp', n: 'OpenVPN' }, { p: '5060/udp', n: 'SIP trunk (IP opérateur)' }],
    techs: ['pfsense'], project: 'pfsense-carp' },

  { id: 'fw1', name: 'PFSENSE-01', type: 'firewall', vlan: 'core', x: 560, y: 172, ip: '10.10.x.252', role: 'Pare-feu CARP — MASTER', os: 'pfSense CE 2.7.2', status: 'ok', big: true,
    desc: "Nœud maître du cluster. Porte les VIP CARP .1 de chaque VLAN, le NAT, les VPN et le routage inter-VLAN filtré. Configuration synchronisée vers PFSENSE-02 par XMLRPC.",
    services: [{ p: 'CARP', n: 'VIP .1 / VLAN (advskew 0)' }, { p: 'pfsync', n: 'États → PFSENSE-02' }, { p: '51820/udp', n: 'WireGuard' }, { p: '1194/udp', n: 'OpenVPN' }, { p: '161/udp', n: 'SNMP (Zabbix)' }],
    techs: ['pfsense', 'wireguard', 'openvpn'], project: 'pfsense-carp' },

  { id: 'fw2', name: 'PFSENSE-02', type: 'firewall', vlan: 'core', x: 840, y: 172, ip: '10.10.x.253', role: 'Pare-feu CARP — BACKUP', os: 'pfSense CE 2.7.2', status: 'ok', big: true,
    desc: "Nœud de secours (advskew 100). Reprend les VIP en moins de 3 secondes en cas de perte du maître, sans coupure des sessions grâce à pfsync.",
    services: [{ p: 'CARP', n: 'VIP .1 / VLAN (advskew 100)' }, { p: 'pfsync', n: 'États ← PFSENSE-01' }],
    techs: ['pfsense'], project: 'pfsense-carp' },

  { id: 'core', name: 'SW-CORE-01', type: 'switch', vlan: 'core', x: 700, y: 300, ip: '10.10.10.2', role: 'Cœur de réseau · Cisco Catalyst', os: 'Cisco IOS 15.2', status: 'ok', big: true,
    desc: "Commutateur de cœur : trunks 802.1Q vers chaque zone, EtherChannel LACP (Po1/Po2) vers les deux pfSense, Rapid-PVST+, VLAN natif 999 inutilisé, SVI de management en VLAN 10.",
    services: [{ p: 'Po1 / Po2', n: 'LACP → pfSense' }, { p: 'Trunk', n: 'VLAN 10,20,30,40,50' }, { p: '22/tcp', n: 'SSH v2 (MGMT)' }, { p: '161/udp', n: 'SNMPv3 (Zabbix)' }],
    techs: ['cisco', 'vlan'], project: 'switching' },

  /* VLAN 10 — MGMT */
  { id: 'pve1', name: 'PVE-01', type: 'hypervisor', vlan: 10, col: 0, row: 0, ip: '10.10.10.11', role: 'Hyperviseur · nœud 1', os: 'Proxmox VE 8.2', status: 'ok',
    desc: "Nœud du cluster Proxmox. OSD Ceph sur NVMe dédié, réseau corosync séparé, VM critiques en HA.",
    services: [{ p: '8006/tcp', n: 'Web UI (MGMT)' }, { p: '5405/udp', n: 'corosync' }, { p: '6789/tcp', n: 'Ceph MON' }],
    techs: ['proxmox', 'ceph', 'debian'], project: 'proxmox-ha' },
  { id: 'pve2', name: 'PVE-02', type: 'hypervisor', vlan: 10, col: 1, row: 0, ip: '10.10.10.12', role: 'Hyperviseur · nœud 2', os: 'Proxmox VE 8.2', status: 'ok',
    desc: "Deuxième nœud du cluster ; héberge les contrôleurs de domaine (anti-affinité) et un nœud Galera.",
    services: [{ p: '8006/tcp', n: 'Web UI (MGMT)' }, { p: '5405/udp', n: 'corosync' }, { p: '6789/tcp', n: 'Ceph MON' }],
    techs: ['proxmox', 'ceph'], project: 'proxmox-ha' },
  { id: 'pve3', name: 'PVE-03', type: 'hypervisor', vlan: 10, col: 0, row: 1, ip: '10.10.10.13', role: 'Hyperviseur · nœud 3', os: 'Proxmox VE 8.2', status: 'ok',
    desc: "Troisième nœud, indispensable au quorum corosync et Ceph (réplication ×3).",
    services: [{ p: '8006/tcp', n: 'Web UI (MGMT)' }, { p: '5405/udp', n: 'corosync' }],
    techs: ['proxmox', 'ceph'], project: 'proxmox-ha' },
  { id: 'pbs', name: 'PBS-01', type: 'backup', vlan: 10, col: 1, row: 1, ip: '10.10.10.30', role: 'Proxmox Backup Server', os: 'PBS 3.2', status: 'ok',
    desc: "Sauvegardes dédupliquées et chiffrées côté client, vérification hebdomadaire, synchronisation distante chiffrée (règle 3-2-1).",
    services: [{ p: '8007/tcp', n: 'API / Web UI' }, { p: 'GFS', n: '7j · 4s · 6m' }],
    techs: ['pbs', 'proxmox'], project: 'backup' },
  { id: 'ansible', name: 'ANSIBLE-CTL', type: 'terminal', vlan: 10, col: 0, row: 2, ip: '10.10.10.20', role: 'Contrôleur Ansible', os: 'Debian 12', status: 'ok',
    desc: "Nœud de contrôle Ansible : dépôt Git des rôles, inventaires par environnement, secrets dans Ansible Vault.",
    services: [{ p: '22/tcp', n: 'SSH sortant vers les cibles' }],
    techs: ['ansible', 'debian', 'bash'], project: 'ansible' },
  { id: 'bastion', name: 'BASTION', type: 'shield', vlan: 10, col: 1, row: 2, ip: '10.10.10.50', role: 'Bastion d’administration', os: 'Debian 12', status: 'ok',
    desc: "Point d'entrée unique de l'administration : SSH par clé + TOTP, journalisation des sessions, accessible depuis le VPN admin uniquement.",
    services: [{ p: '22/tcp', n: 'SSH clé + TOTP' }, { p: 'auditd', n: 'Sessions journalisées' }],
    techs: ['debian', 'linux'], project: 'pfsense-carp' },
  { id: 'oob', name: 'iDRAC / iLO', type: 'oob', vlan: 10, col: 0, row: 3, ip: '10.10.10.101-103', role: 'Accès hors bande', os: 'IPMI / Redfish', status: 'ok',
    desc: "Consoles hors bande des serveurs physiques pour redémarrage et diagnostic matériel.",
    services: [{ p: '443/tcp', n: 'Console web' }, { p: '623/udp', n: 'IPMI (filtré)' }],
    techs: [], project: 'proxmox-ha' },

  /* VLAN 20 — SRV */
  { id: 'dc01', name: 'DC01', type: 'server', vlan: 20, col: 0, row: 0, ip: '10.10.20.10', role: 'Contrôleur de domaine · FSMO', os: 'Windows Server 2022', status: 'ok',
    desc: "Contrôleur de domaine principal (rôles FSMO), DNS intégré AD, DHCP en failover load-balance avec DC02.",
    services: [{ p: '53', n: 'DNS' }, { p: '88', n: 'Kerberos' }, { p: '389 / 636', n: 'LDAP / LDAPS' }, { p: '445', n: 'SMB (SYSVOL)' }, { p: '67/udp', n: 'DHCP failover' }],
    techs: ['windows', 'ad', 'gpo'], project: 'ad-gpo' },
  { id: 'dc02', name: 'DC02', type: 'server', vlan: 20, col: 1, row: 0, ip: '10.10.20.11', role: 'Contrôleur de domaine', os: 'Windows Server 2022', status: 'ok',
    desc: "Second contrôleur de domaine sur un hyperviseur différent (règle d'anti-affinité HA).",
    services: [{ p: '53', n: 'DNS' }, { p: '88', n: 'Kerberos' }, { p: '389 / 636', n: 'LDAP / LDAPS' }, { p: '67/udp', n: 'DHCP failover' }],
    techs: ['windows', 'ad'], project: 'ad-gpo' },
  { id: 'pki', name: 'PKI-CA', type: 'cert', vlan: 20, col: 0, row: 1, ip: '10.10.20.15', role: 'Autorité de certification', os: 'Windows Server 2022', status: 'ok',
    desc: "AC d'entreprise subordonnée (racine hors ligne). Certificats machines pour 802.1X EAP-TLS, LDAPS et RDP.",
    services: [{ p: '80/tcp', n: 'CRL / AIA' }, { p: '135 + RPC', n: 'Enrollment' }],
    techs: ['adcs', 'windows', 'nps'], project: 'pki-8021x' },
  { id: 'glpi', name: 'GLPI', type: 'inventory', vlan: 20, col: 1, row: 1, ip: '10.10.20.40', role: 'ITSM & inventaire', os: 'Debian 12 · PHP 8.2', status: 'ok',
    desc: "GLPI 10 : helpdesk, inventaire automatique via GLPI Agent, base de connaissances, authentification LDAPS sur l'AD.",
    services: [{ p: '443/tcp', n: 'Interface web' }, { p: '62354', n: 'GLPI Agent' }],
    techs: ['glpi', 'debian', 'mariadb'], project: 'glpi' },
  { id: 'zabbix', name: 'ZABBIX', type: 'chart', vlan: 20, col: 0, row: 2, ip: '10.10.20.50', role: 'Supervision + Grafana', os: 'Debian 12 · Zabbix 7.0 LTS', status: 'ok',
    desc: "Serveur Zabbix 7.0 LTS + Grafana : agents actifs, SNMPv3 sur réseau, découverte, escalades d'alertes.",
    services: [{ p: '10051/tcp', n: 'Trapper (agents actifs)' }, { p: '443/tcp', n: 'Frontend' }, { p: '3000/tcp', n: 'Grafana' }],
    techs: ['zabbix', 'grafana', 'debian'], project: 'zabbix-grafana' },
  { id: 'wazuh', name: 'WAZUH', type: 'shield', vlan: 20, col: 1, row: 2, ip: '10.10.20.60', role: 'SIEM / XDR', os: 'Wazuh 4.8 (all-in-one)', status: 'ok',
    desc: "Indexer, manager et dashboard Wazuh. Collecte des journaux Windows, Linux et pfSense, FIM, détection des vulnérabilités.",
    services: [{ p: '1514/tcp', n: 'Agents' }, { p: '1515/tcp', n: 'Enrôlement' }, { p: '514/udp', n: 'Syslog pfSense' }, { p: '443/tcp', n: 'Dashboard' }],
    techs: ['wazuh', 'debian'], project: 'wazuh' },
  { id: 'db1', name: 'GALERA-01', type: 'db', vlan: 20, col: 0, row: 3, ip: '10.10.20.31', role: 'MariaDB Galera · nœud 1', os: 'Debian 12 · MariaDB 10.11', status: 'ok',
    desc: "Nœud du cluster Galera (réplication synchrone multi-maître). Accès applicatif via la VIP HAProxy 10.10.20.30.",
    services: [{ p: '3306/tcp', n: 'MySQL' }, { p: '4567', n: 'Réplication Galera' }, { p: '4568 / 4444', n: 'IST / SST' }],
    techs: ['mariadb', 'haproxy', 'debian'], project: 'galera' },
  { id: 'db2', name: 'GALERA-02', type: 'db', vlan: 20, col: 1, row: 3, ip: '10.10.20.32', role: 'MariaDB Galera · nœud 2', os: 'Debian 12 · MariaDB 10.11', status: 'ok',
    desc: "Deuxième nœud Galera.", services: [{ p: '3306/tcp', n: 'MySQL' }, { p: '4567', n: 'Réplication Galera' }],
    techs: ['mariadb'], project: 'galera' },
  { id: 'db3', name: 'GALERA-03', type: 'db', vlan: 20, col: 0, row: 4, ip: '10.10.20.33', role: 'MariaDB Galera · nœud 3', os: 'Debian 12 · MariaDB 10.11', status: 'ok',
    desc: "Troisième nœud Galera (quorum).", services: [{ p: '3306/tcp', n: 'MySQL' }, { p: '4567', n: 'Réplication Galera' }],
    techs: ['mariadb'], project: 'galera' },
  { id: 'haproxy', name: 'HAPROXY VIP', type: 'web', vlan: 20, col: 1, row: 4, ip: '10.10.20.30', role: 'Répartiteur SQL', os: 'HAProxy 2.6 + keepalived', status: 'ok',
    desc: "VIP keepalived devant le cluster Galera, health check via clustercheck.",
    services: [{ p: '3306/tcp', n: 'Frontend SQL' }, { p: '8404/tcp', n: 'Stats' }],
    techs: ['haproxy', 'mariadb'], project: 'galera' },

  /* VLAN 30 — DMZ */
  { id: 'rp', name: 'NGINX-RP', type: 'web', vlan: 30, col: 0, row: 0, ip: '10.10.30.10', role: 'Reverse proxy TLS', os: 'Debian 12 · Nginx 1.22', status: 'ok',
    desc: "Point d'entrée HTTPS unique : TLS 1.3, HSTS, en-têtes de sécurité, limitation de débit, certificats Let's Encrypt (DNS-01).",
    services: [{ p: '443/tcp', n: 'HTTPS (NAT WAN)' }, { p: '80/tcp', n: 'Redirection 301' }],
    techs: ['nginx', 'debian'], project: 'vaultwarden' },
  { id: 'vault', name: 'VAULTWARDEN', type: 'key', vlan: 30, col: 1, row: 0, ip: '10.10.30.20', role: 'Coffre-fort de mots de passe', os: 'Docker · vaultwarden 1.31', status: 'ok',
    desc: "Conteneur Vaultwarden derrière le reverse proxy : inscriptions fermées, 2FA, admin token Argon2, sauvegardes chiffrées vers PBS.",
    services: [{ p: '8080/tcp', n: 'HTTP interne (RP uniquement)' }, { p: '3012/tcp', n: 'WebSocket' }],
    techs: ['vaultwarden', 'docker'], project: 'vaultwarden' },
  { id: 'smtp', name: 'SMTP-RELAY', type: 'mail', vlan: 30, col: 0, row: 1, ip: '10.10.30.25', role: 'Relais SMTP', os: 'Debian 12 · Postfix', status: 'ok',
    desc: "Relais Postfix authentifié pour les alertes (Zabbix, Wazuh, PBS) avec SPF/DKIM.",
    services: [{ p: '587/tcp', n: 'Submission' }],
    techs: ['debian'], project: 'zabbix-grafana' },
  { id: 'web', name: 'WEB-01', type: 'web', vlan: 30, col: 1, row: 1, ip: '10.10.30.30', role: 'Serveur web interne', os: 'Debian 12 · Docker', status: 'ok',
    desc: "Héberge les pages d'état et outils internes publiés via le reverse proxy.",
    services: [{ p: '8081/tcp', n: 'HTTP interne' }],
    techs: ['docker', 'nginx'], project: 'vaultwarden' },

  /* VLAN 40 — VOIP / IoT */
  { id: 'pbx', name: '3CX-PBX', type: 'phone', vlan: 40, col: 0, row: 0, ip: '10.10.40.10', role: 'IPBX 3CX', os: 'Debian 12 · 3CX v20', status: 'ok',
    desc: "IPBX 3CX : trunk SIP opérateur, provisioning des postes, files d'attente et SVI. Marquage DSCP EF/AF41.",
    services: [{ p: '5060-5061', n: 'SIP / SIP-TLS' }, { p: '9000-10999/udp', n: 'RTP' }, { p: '5001/tcp', n: 'Console web' }],
    techs: ['3cx', 'debian'], project: '3cx' },
  { id: 'phones', name: 'Postes IP ×12', type: 'phone', vlan: 40, col: 1, row: 0, ip: '10.10.40.100-199', role: 'Postes SIP (DHCP)', os: 'Yealink T4x', status: 'ok',
    desc: "Postes provisionnés automatiquement (option DHCP 66), VLAN voix appris par LLDP-MED.",
    services: [{ p: '5060/udp', n: 'SIP' }, { p: 'LLDP-MED', n: 'VLAN voix' }],
    techs: ['3cx'], project: '3cx' },
  { id: 'ap', name: 'AP-IOT', type: 'ap', vlan: 40, col: 0, row: 1, ip: '10.10.40.5', role: 'Point d’accès IoT', os: 'WPA3 · SSID isolé', status: 'ok',
    desc: "SSID dédié aux capteurs, isolation client activée, authentification 802.1X pour les équipements compatibles.",
    services: [{ p: 'WPA3', n: 'SSID IoT' }], techs: ['nps'], project: 'pki-8021x' },
  { id: 'iotgw', name: 'GW-IOT', type: 'iot', vlan: 40, col: 1, row: 1, ip: '10.10.40.200', role: 'Passerelle IoT / OT', os: 'Node-RED · MQTT', status: 'warn',
    desc: "Passerelle Modbus TCP → MQTT : seul équipement autorisé à dialoguer avec l'automate et à remonter des métriques vers Zabbix.",
    services: [{ p: '1883/tcp', n: 'MQTT (local)' }, { p: '502/tcp', n: 'Modbus → automate' }], techs: [], project: 'switching' },
  { id: 'plc', name: 'PLC-LIGNE-1', type: 'iot', vlan: 40, col: 0, row: 2, ip: '10.10.40.210', role: 'Automate (simulation)', os: 'Modbus TCP', status: 'ok',
    desc: "Automate simulé pour reproduire les contraintes d'un réseau industriel : aucune route vers Internet, accès uniquement depuis la passerelle.",
    services: [{ p: '502/tcp', n: 'Modbus TCP' }], techs: [], project: 'switching' },

  /* VLAN 50 — PXE */
  { id: 'wds', name: 'WDS-MDT', type: 'deploy', vlan: 50, col: 0, row: 0, ip: '10.10.50.10', role: 'Serveur de déploiement', os: 'Windows Server 2022 · MDT 8456', status: 'ok',
    desc: "WDS (boot PXE UEFI) + MDT : DeploymentShare, séquences de tâches, pilotes par modèle, HP BCU en pré-installation.",
    services: [{ p: '67/69 udp', n: 'PXE / TFTP' }, { p: '4011/udp', n: 'proxyDHCP' }, { p: '445/tcp', n: 'DeploymentShare$' }],
    techs: ['mdt', 'windows', 'hpbcu', 'powershell'], project: 'mdt-wds' },
  { id: 'wsus', name: 'WSUS', type: 'server', vlan: 50, col: 1, row: 0, ip: '10.10.50.15', role: 'Mises à jour Windows', os: 'Windows Server 2022', status: 'ok',
    desc: "Approbation des mises à jour par anneaux, utilisé pendant le déploiement et par les postes de production.",
    services: [{ p: '8530/tcp', n: 'WSUS HTTP' }, { p: '8531/tcp', n: 'WSUS HTTPS' }], techs: ['windows'], project: 'mdt-wds' },
  { id: 'pxe1', name: 'PC-PXE-01', type: 'pc', vlan: 50, col: 0, row: 1, ip: 'DHCP .1xx', role: 'Poste en déploiement', os: 'Windows 11 23H2', status: 'ok',
    desc: "Poste en cours de déploiement par séquence de tâches.", services: [{ p: 'UEFI PXE', n: 'Boot réseau' }], techs: ['mdt'], project: 'mdt-wds' },
  { id: 'pxe2', name: 'PC-PXE-02', type: 'pc', vlan: 50, col: 1, row: 1, ip: 'DHCP .1xx', role: 'Poste en déploiement', os: 'Windows 11 23H2', status: 'ok',
    desc: "Second poste en déploiement simultané (multicast WDS).", services: [{ p: 'UEFI PXE', n: 'Boot réseau' }], techs: ['mdt'], project: 'mdt-wds' }
];

/* Calcul des positions des nœuds dans les zones */
NODES.forEach((n) => {
  if (typeof n.vlan === 'number') {
    const v = VLAN_BY_ID[n.vlan];
    n.x = v.cx + (n.col === 0 ? -64 : 64);
    n.y = ZONE_Y + 92 + n.row * 76;
  }
});

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

function nodeColor(n) {
  if (n.vlan === 'wan') return '#f87171';
  if (n.vlan === 'core') return n.type === 'firewall' ? '#fb7185' : '#e2e8f0';
  return VLAN_BY_ID[n.vlan].color;
}

/* Flux réseau animés */
const FLOWS = [
  { id: 'https', name: 'HTTPS entrant', port: '443/tcp', color: '#f472b6', legs: [['internet', 'rp'], ['rp', 'vault']],
    desc: 'Internet → NAT pfSense → reverse proxy Nginx (DMZ) → Vaultwarden.' },
  { id: 'vpn', name: 'VPN admin', port: '51820/udp', color: '#e879f9', legs: [['internet', 'bastion']],
    desc: 'Administrateur nomade → WireGuard sur pfSense → bastion (VLAN 10).' },
  { id: 'ssh', name: 'Admin SSH', port: '22/tcp', color: '#8b7bff', legs: [['bastion', 'dc01'], ['bastion', 'zabbix'], ['bastion', 'rp']],
    desc: 'Toute administration part du bastion : SSH / RDP filtrés par pfSense.' },
  { id: 'voip', name: 'VoIP SIP/RTP', port: '5060 · 9000-10999', color: '#fbbf24', legs: [['phones', 'pbx'], ['pbx', 'internet']],
    desc: 'Postes → 3CX (intra-VLAN) puis trunk SIP vers l’opérateur avec QoS EF.' },
  { id: 'pxe', name: 'Boot PXE', port: '67 · 69 · 4011', color: '#34d399', legs: [['pxe1', 'wds'], ['pxe2', 'wds'], ['pxe1', 'dc01']],
    desc: 'DHCP relayé vers DC01, TFTP / proxyDHCP vers WDS, puis jonction au domaine.' },
  { id: 'monitor', name: 'Supervision', port: '10050-10051 · SNMP', color: '#22d3ee', legs: [['zabbix', 'pve1'], ['zabbix', 'rp'], ['zabbix', 'pbx'], ['zabbix', 'core'], ['zabbix', 'wds']],
    desc: 'Zabbix interroge agents et équipements SNMPv3 dans toutes les zones.' },
  { id: 'siem', name: 'Logs → SIEM', port: '1514 · 514', color: '#fb7185', legs: [['dc01', 'wazuh'], ['rp', 'wazuh'], ['fw1', 'wazuh'], ['bastion', 'wazuh']],
    desc: 'Agents Wazuh et syslog pfSense centralisés pour corrélation.' },
  { id: 'backup', name: 'Sauvegardes', port: '8007/tcp', color: '#fdba74', legs: [['pve1', 'pbs'], ['pve2', 'pbs'], ['pve3', 'pbs'], ['pbs', 'internet']],
    desc: 'Proxmox → PBS (même VLAN), puis synchronisation hors site chiffrée.' }
];

/* Matrice des flux inter-zones (source → destination) */
const FW_ZONES = [
  { key: 'wan', name: 'WAN', color: '#f87171' },
  ...VLANS.map((v) => ({ key: v.key, name: `${v.short}`, sub: `VLAN ${v.id}`, color: v.color }))
];

const FW_MATRIX = {
  wan: { wan: ['self'], v10: ['deny', 'VPN uniquement'], v20: ['deny', '—'], v30: ['limit', '443 → NGINX-RP'], v40: ['limit', 'SIP opérateur → 3CX'], v50: ['deny', '—'] },
  v10: { wan: ['limit', '80/443 mises à jour'], v10: ['self'], v20: ['allow', 'Admin complet'], v30: ['allow', 'SSH 22, 443'], v40: ['allow', 'SSH, 5001'], v50: ['allow', 'RDP, 445'] },
  v20: { wan: ['limit', '53, 123, 80/443 proxy'], v10: ['limit', 'Zabbix SNMP, 8006'], v20: ['self'], v30: ['limit', '10050, 587'], v40: ['limit', '10050, SNMP'], v50: ['limit', 'AD → WDS/WSUS'] },
  v30: { wan: ['limit', '80/443 sortant'], v10: ['deny', '—'], v20: ['limit', '1514, 10051'], v30: ['self'], v40: ['deny', '—'], v50: ['deny', '—'] },
  v40: { wan: ['limit', 'SIP / RTP 3CX'], v10: ['deny', '—'], v20: ['limit', '10051 GW-IOT'], v30: ['deny', '—'], v40: ['self'], v50: ['deny', '—'] },
  v50: { wan: ['deny', 'aucun accès'], v10: ['deny', '—'], v20: ['limit', 'AD 53/88/389/445'], v30: ['deny', '—'], v40: ['deny', '—'], v50: ['self'] }
};

/* Extrait des règles pfSense par interface */
const PF_RULES = {
  WAN: [
    ['pass', 'TCP', '*', 'WAN address', '443', 'NAT → NGINX-RP 10.10.30.10'],
    ['pass', 'UDP', '*', 'WAN address', '51820', 'WireGuard admin (clés par appareil)'],
    ['pass', 'UDP', '*', 'WAN address', '1194', 'OpenVPN (certificat + RADIUS)'],
    ['pass', 'UDP', 'SIP_PROVIDER', '3CX (NAT)', '5060, 9000-10999', 'Trunk SIP opérateur uniquement'],
    ['block', '*', 'pfB_BadIPs', '*', '*', 'Listes de réputation pfBlockerNG'],
    ['block', '*', '*', '*', '*', 'Refus par défaut (journalisé)']
  ],
  MGMT: [
    ['pass', 'TCP/UDP', 'MGMT net', 'RFC1918', '*', 'Administration de toutes les zones'],
    ['pass', 'TCP', 'MGMT net', '!RFC1918', '80, 443', 'Mises à jour (dépôts Debian / Proxmox)'],
    ['pass', 'UDP', 'MGMT net', 'NTP_SERVERS', '123', 'Synchronisation horaire'],
    ['block', '*', '*', '*', '*', 'Refus par défaut']
  ],
  SRV: [
    ['pass', 'TCP/UDP', 'DC01, DC02', '!RFC1918', '53, 123', 'Résolution DNS externe et NTP'],
    ['pass', 'TCP', 'ZABBIX', 'RFC1918', '10050, 161', 'Collecte de supervision'],
    ['pass', 'TCP', 'SRV net', 'SMTP-RELAY', '587', 'Envoi des alertes'],
    ['pass', 'TCP', 'SRV net', '!RFC1918', '80, 443', 'Mises à jour'],
    ['block', '*', 'SRV net', 'MGMT net', '*', 'Aucun accès au management'],
    ['block', '*', '*', '*', '*', 'Refus par défaut']
  ],
  DMZ: [
    ['pass', 'TCP', 'DMZ net', 'WAZUH', '1514, 1515', 'Agents SIEM'],
    ['pass', 'TCP', 'DMZ net', 'ZABBIX', '10051', 'Agents actifs Zabbix'],
    ['block', '*', 'DMZ net', 'RFC1918', '*', 'La DMZ n’initie rien vers le LAN'],
    ['pass', 'TCP', 'DMZ net', '!RFC1918', '80, 443', 'ACME + mises à jour'],
    ['block', '*', '*', '*', '*', 'Refus par défaut']
  ],
  VOIP: [
    ['pass', 'UDP', '3CX', 'SIP_PROVIDER', '5060, 9000-10999', 'Trunk SIP (QoS EF)'],
    ['pass', 'TCP', 'GW-IOT', 'ZABBIX', '10051', 'Métriques OT'],
    ['block', '*', 'IOT_DEVICES', '*', '*', 'IoT sans accès sortant'],
    ['block', '*', 'VOIP net', 'RFC1918', '*', 'Isolation du LAN'],
    ['block', '*', '*', '*', '*', 'Refus par défaut']
  ],
  PXE: [
    ['pass', 'TCP/UDP', 'PXE net', 'DC01, DC02', 'AD_PORTS', 'Jonction au domaine (53, 88, 135, 389, 445, 464, RPC)'],
    ['pass', 'TCP', 'PXE net', 'WSUS', '8530', 'Mises à jour pendant la TS'],
    ['reject', '*', 'PXE net', '!RFC1918', '*', 'Aucun accès Internet en préparation'],
    ['block', '*', '*', '*', '*', 'Refus par défaut']
  ]
};

const HARDWARE = [
  { name: 'PVE-01', ip: '10.10.10.11', model: 'Mini-PC · Intel Core i7 8C/16T', color: '#ff8a3d',
    bars: [['CPU', '16 threads', 34], ['RAM', '64 Go', 58], ['NVMe Ceph', '1 To', 41]] },
  { name: 'PVE-02', ip: '10.10.10.12', model: 'Mini-PC · Intel Core i7 8C/16T', color: '#ff8a3d',
    bars: [['CPU', '16 threads', 28], ['RAM', '64 Go', 61], ['NVMe Ceph', '1 To', 41]] },
  { name: 'PVE-03', ip: '10.10.10.13', model: 'Mini-PC · Intel Core i7 8C/16T', color: '#ff8a3d',
    bars: [['CPU', '16 threads', 22], ['RAM', '64 Go', 47], ['NVMe Ceph', '1 To', 41]] },
  { name: 'PFSENSE-01 / 02', ip: '10.10.x.252/.253', model: 'Appliances 4 × 2.5 GbE · AES-NI', color: '#818cf8',
    bars: [['CPU', '4 cœurs', 12], ['RAM', '8 Go', 31], ['États', '≈ 4 200', 18]] },
  { name: 'SW-CORE-01', ip: '10.10.10.2', model: 'Cisco Catalyst · 24 × 1 GbE + 4 SFP', color: '#22d3ee',
    bars: [['Ports actifs', '19 / 28', 68], ['CPU', 'IOS', 9], ['PoE', '370 W', 22]] },
  { name: 'PBS-01', ip: '10.10.10.30', model: 'Serveur de sauvegarde · 2 × 4 To ZFS miroir', color: '#fdba74',
    bars: [['Datastore', '4 To', 46], ['Dédup.', 'ratio 7,8', 78], ['RAM', '16 Go', 38]] }
];

const LAB_KPIS = [
  { v: '3', l: 'nœuds Proxmox' },
  { v: '38', l: 'VM & conteneurs' },
  { v: '5', l: 'VLANs isolés' },
  { v: '<3 s', l: 'bascule CARP' }
];

/* ==========================================================================
   04. DONNÉES : REGISTRE DES 15 PROJETS
   ========================================================================== */
const PROJECT_CATEGORIES = {
  Virtualisation: '#ff8a3d',
  Réseau: '#22d3ee',
  Sécurité: '#f472b6',
  Systèmes: '#38bdf8',
  Supervision: '#ef4444',
  Automatisation: '#a3e635',
  Services: '#fbbf24'
};

const PROJECTS = [
  {
    id: 'proxmox-ha', title: 'Cluster Proxmox VE haute disponibilité', cat: 'Virtualisation', feature: true, visual: 'cluster', status: 'Homelab · production',
    short: "Cluster hyperconvergé à 3 nœuds : Ceph répliqué ×3, quorum corosync sur réseau dédié, groupes HA et règles d'anti-affinité pour les services critiques.",
    context: "Un seul hyperviseur, c'est un point unique de défaillance. L'objectif était de pouvoir perdre un nœud entier sans interruption perceptible des services d'infrastructure (AD, DNS, supervision, coffre-fort).",
    metrics: [{ v: '3', l: 'nœuds' }, { v: '< 2 min', l: 'reprise HA' }, { v: '×3', l: 'réplication Ceph' }, { v: '38', l: 'VM / CT' }],
    stack: ['proxmox', 'ceph', 'debian', 'pbs'],
    highlights: ['Corosync sur lien dédié + second anneau de secours', 'Pools Ceph RBD répliqués, OSD sur NVMe', 'Groupes HA avec priorités et anti-affinité des DC', 'Tests de panne documentés : coupure secteur, réseau, disque'],
    vlans: [10, 20]
  },
  {
    id: 'pfsense-carp', title: 'Pare-feu pfSense en CARP + VPN OpenVPN / WireGuard', cat: 'Réseau', feature: false, visual: 'firewall', status: 'Homelab · production',
    short: "Deux pfSense en cluster actif / passif avec VIP CARP par VLAN, synchronisation des états, VPN nomade WireGuard et OpenVPN avec PKI dédiée.",
    context: "Le pare-feu est à la fois la passerelle de chaque VLAN et le point d'entrée Internet : il ne pouvait pas rester un point unique de défaillance.",
    metrics: [{ v: '< 3 s', l: 'bascule' }, { v: '0', l: 'session perdue' }, { v: '2', l: 'VPN' }, { v: '6', l: 'interfaces' }],
    stack: ['pfsense', 'wireguard', 'openvpn', 'cisco'],
    highlights: ['VIP CARP .1 sur chaque VLAN, advskew 0 / 100', 'pfsync sur lien dédié, XMLRPC pour la configuration', 'LAGG LACP vers le cœur de réseau', 'Règles par interface avec alias et refus par défaut'],
    vlans: [10, 20, 30, 40, 50]
  },
  {
    id: 'ad-gpo', title: 'Active Directory & durcissement par GPO', cat: 'Systèmes', feature: false, visual: 'tree', status: 'Homelab + mission',
    short: "Domaine à deux contrôleurs, structure d'OU par tiers, modèle AGDLP, LAPS, et un jeu de GPO de durcissement aligné sur les recommandations ANSSI.",
    context: "Un AD mal structuré devient vite ingérable et dangereux. Le projet reprend les bonnes pratiques d'administration en tiers et de moindre privilège.",
    metrics: [{ v: '2', l: 'DC' }, { v: '24', l: 'GPO' }, { v: '3', l: 'tiers' }, { v: '100 %', l: 'postes LAPS' }],
    stack: ['windows', 'ad', 'gpo', 'powershell'],
    highlights: ['OU par tiers (T0 / T1 / T2) et délégation fine', 'Windows LAPS, désactivation NTLMv1 / SMBv1 / LLMNR', 'Pare-feu Windows et audit avancé par GPO', 'Scripts PowerShell d’audit des comptes à privilèges'],
    vlans: [20]
  },
  {
    id: 'mdt-wds', title: 'Déploiement automatisé WDS / MDT + HP BCU', cat: 'Systèmes', feature: true, visual: 'pipeline', status: 'En mission · Verson',
    short: "Chaîne de déploiement zéro-touch : boot PXE UEFI, séquence MDT, pilotes par modèle, configuration BIOS HP scriptée, jonction au domaine et applications métier.",
    context: "Sur site industriel, préparer un poste à la main prenait une demi-journée et produisait des configurations hétérogènes. Le besoin : industrialiser.",
    metrics: [{ v: '≈ 35 min', l: 'par poste' }, { v: '0', l: 'clic' }, { v: '9', l: 'modèles HP' }, { v: '100 %', l: 'BIOS conformes' }],
    stack: ['mdt', 'windows', 'hpbcu', 'powershell'],
    highlights: ['CustomSettings.ini avec règles par modèle (Model / Make)', 'Pilotes injectés via profils de sélection', 'HP BCU : Secure Boot, TPM, mot de passe BIOS, ordre de boot', 'Journalisation centralisée des déploiements (SLShare)'],
    vlans: [50, 20]
  },
  {
    id: 'vaultwarden', title: 'Vaultwarden sous Docker derrière un reverse proxy Nginx', cat: 'Sécurité', feature: false, visual: 'proxy', status: 'Homelab + mission',
    short: "Coffre-fort de mots de passe d'équipe auto-hébergé : conteneur durci, reverse proxy TLS en DMZ, 2FA obligatoire et sauvegardes chiffrées.",
    context: "Remplacer les mots de passe partagés dans des fichiers par un coffre auditable, avec partage par collections.",
    metrics: [{ v: 'A+', l: 'note TLS' }, { v: '2FA', l: 'obligatoire' }, { v: '24 h', l: 'RPO' }, { v: '0', l: 'port direct' }],
    stack: ['vaultwarden', 'docker', 'nginx', 'debian'],
    highlights: ['TLS 1.3, HSTS preload, CSP et en-têtes de sécurité', 'Inscriptions fermées, invitations par organisation', 'Admin token haché Argon2', 'Sauvegarde SQLite + pièces jointes chiffrées (age)'],
    vlans: [30]
  },
  {
    id: '3cx', title: 'Téléphonie IP 3CX', cat: 'Services', feature: false, visual: 'phone', status: 'En mission · Verson',
    short: "IPBX 3CX avec trunk SIP opérateur, provisioning automatique des postes, files d'attente, VLAN voix dédié et QoS de bout en bout.",
    context: "En environnement industriel, la voix doit rester audible même quand le réseau est chargé : segmentation et QoS sont obligatoires.",
    metrics: [{ v: 'EF', l: 'DSCP voix' }, { v: '> 4,2', l: 'MOS moyen' }, { v: 'auto', l: 'provisioning' }, { v: '1', l: 'VLAN voix' }],
    stack: ['3cx', 'cisco', 'debian'],
    highlights: ['VLAN voix appris par LLDP-MED', 'Option DHCP 66 pour le provisioning', 'Marquage DSCP EF / AF41, files prioritaires', 'Règles pfSense limitées aux IP de l’opérateur'],
    vlans: [40]
  },
  {
    id: 'zabbix-grafana', title: 'Supervision Zabbix + dashboards Grafana', cat: 'Supervision', feature: true, visual: 'chart', status: 'Projet E6 · production', image: 'grafana-dashboard.png', doc: 'Grafana-Zabbix_E6.docx',
    short: "Supervision centralisée : Zabbix 7.0 LTS sur Debian 12, agents actifs, SNMPv3 sur le réseau, dépendances de triggers et dashboards Grafana par service.",
    context: "Né d'un besoin réel en alternance : surveiller à la main devient impossible dès que le parc grandit. L'objectif : être alerté avant l'utilisateur.",
    metrics: [{ v: '60+', l: 'hôtes' }, { v: '2 400', l: 'éléments' }, { v: '< 1 min', l: 'détection' }, { v: '12', l: 'dashboards' }],
    stack: ['zabbix', 'grafana', 'debian', 'mariadb'],
    highlights: ['Zabbix Server + frontend + MariaDB sur Debian 12', 'Templates Linux, Windows, Cisco SNMPv3, pfSense', 'Dépendances de triggers pour éviter les tempêtes d’alertes', 'Grafana connecté via le plugin Zabbix'],
    vlans: [20]
  },
  {
    id: 'wazuh', title: 'SIEM Wazuh & détection d’intrusion', cat: 'Sécurité', feature: false, visual: 'shield', status: 'Homelab',
    short: "Plateforme SIEM / XDR : collecte des journaux Windows, Linux et pfSense, FIM, détection des vulnérabilités et règles personnalisées mappées MITRE ATT&CK.",
    context: "Segmenter et filtrer ne suffit pas : il faut aussi voir. Wazuh centralise les événements pour détecter les comportements anormaux.",
    metrics: [{ v: '22', l: 'agents' }, { v: '14', l: 'règles custom' }, { v: 'ATT&CK', l: 'mapping' }, { v: '90 j', l: 'rétention' }],
    stack: ['wazuh', 'debian', 'windows', 'pfsense'],
    highlights: ['Agents Windows avec collecte Sysmon', 'Syslog pfSense décodé', 'Alertes sur ajout à Admins du domaine, brute force SSH', 'Active Response : blocage d’IP sur seuil'],
    vlans: [20]
  },
  {
    id: 'glpi', title: 'GLPI + GLPI Agent : ITSM & inventaire', cat: 'Services', feature: false, visual: 'inventory', status: 'Homelab + mission',
    short: "Helpdesk ITIL et gestion de parc : inventaire automatique par GLPI Agent, authentification LDAPS, règles d'affectation et base de connaissances.",
    context: "Un parc sans inventaire fiable, c'est des licences perdues et des incidents mal tracés. GLPI unifie tickets et actifs.",
    metrics: [{ v: '100 %', l: 'parc inventorié' }, { v: 'LDAPS', l: 'auth AD' }, { v: 'SLA', l: 'par catégorie' }, { v: '1 h', l: 'cycle agent' }],
    stack: ['glpi', 'debian', 'mariadb', 'ad'],
    highlights: ['GLPI 10 sur Debian, PHP-FPM, TLS', 'GLPI Agent déployé par GPO (MSI + paramètres)', 'Import des utilisateurs depuis l’AD en LDAPS', 'Catégories ITIL, SLA et règles métier'],
    vlans: [20]
  },
  {
    id: 'galera', title: 'Cluster MariaDB Galera + HAProxy', cat: 'Services', feature: false, visual: 'db', status: 'Homelab',
    short: "Base de données haute disponibilité : trois nœuds Galera en réplication synchrone, VIP keepalived et HAProxy avec health check applicatif.",
    context: "GLPI et Zabbix reposent sur MariaDB : la base ne devait plus être le maillon faible de l'infrastructure.",
    metrics: [{ v: '3', l: 'nœuds' }, { v: 'sync', l: 'réplication' }, { v: '0', l: 'perte de données' }, { v: '1', l: 'VIP' }],
    stack: ['mariadb', 'haproxy', 'debian'],
    highlights: ['wsrep avec SST mariabackup', 'HAProxy + clustercheck sur port 9200', 'keepalived pour la VIP 10.10.20.30', 'Procédure de redémarrage complet (bootstrap)'],
    vlans: [20]
  },
  {
    id: 'ansible', title: 'Automatisation Ansible (Infrastructure as Code)', cat: 'Automatisation', feature: false, visual: 'automation', status: 'Projet E6 · production', image: 'ansible-playbook.png', doc: 'Ansible_E6.docx', github: 'https://github.com/B2ZO0/Projet-ServeurMC-Ansible',
    short: "Rôles idempotents pour le durcissement Debian, le déploiement des agents Zabbix / Wazuh et la mise en service de serveurs applicatifs en une commande.",
    context: "Point de départ : le projet E6 de déploiement simultané de trois serveurs applicatifs sur Proxmox. Étendu ensuite à toute la base Linux du homelab.",
    metrics: [{ v: '12', l: 'rôles' }, { v: '1', l: 'commande' }, { v: '100 %', l: 'idempotent' }, { v: '3', l: 'serveurs en // (E6)' }],
    stack: ['ansible', 'debian', 'proxmox', 'bash'],
    highlights: ['Inventaires par environnement, group_vars / host_vars', 'Secrets chiffrés avec Ansible Vault', 'Rôles : base, ssh-hardening, zabbix-agent, wazuh-agent', 'Projet E6 : 3 serveurs déployés en parallèle sur Proxmox'],
    vlans: [10]
  },
  {
    id: 'switching', title: 'Architecture de switchs Cisco & segmentation', cat: 'Réseau', feature: false, visual: 'switch', status: 'Homelab + mission',
    short: "Plan VLAN complet, trunks 802.1Q, EtherChannel LACP, Rapid-PVST+, sécurité de port, DHCP snooping et isolement d'un segment OT.",
    context: "Sur un site industriel, réseau bureautique, voix et automates partagent souvent le même câblage : la segmentation est la première mesure de sécurité.",
    metrics: [{ v: '5', l: 'VLANs' }, { v: '2', l: 'LACP' }, { v: 'RPVST+', l: 'STP' }, { v: '999', l: 'VLAN natif mort' }],
    stack: ['cisco', 'vlan'],
    highlights: ['VLAN natif 999 non routé, DTP désactivé', 'BPDU guard + PortFast sur les ports d’accès', 'DHCP snooping et Dynamic ARP Inspection', 'Sauvegarde des configurations vers TFTP / Git'],
    vlans: [10, 40]
  },
  {
    id: 'backup', title: 'Sauvegarde 3-2-1 avec Proxmox Backup Server', cat: 'Virtualisation', feature: false, visual: 'backup', status: 'Homelab',
    short: "Sauvegardes incrémentales dédupliquées et chiffrées, rétention GFS, vérification automatique et copie hors site : la règle 3-2-1 appliquée.",
    context: "Une sauvegarde non testée n'est pas une sauvegarde. Le projet inclut un plan de restauration testé chaque mois.",
    metrics: [{ v: '3-2-1', l: 'règle' }, { v: '7,8×', l: 'déduplication' }, { v: '24 h', l: 'RPO' }, { v: '< 30 min', l: 'RTO VM' }],
    stack: ['pbs', 'proxmox', 'wireguard'],
    highlights: ['Chiffrement côté client (clé hors PBS)', 'Rétention 7 jours / 4 semaines / 6 mois', 'Jobs de vérification et de pruning', 'Synchronisation distante via WireGuard'],
    vlans: [10]
  },
  {
    id: 'rmm', title: 'RMM & automatisation PowerShell du parc', cat: 'Automatisation', feature: false, visual: 'rmm', status: 'En mission · Verson',
    short: "Gestion à distance du parc : scripts de remédiation, patch management, inventaire logiciel et alertes proactives sur disques, services et sauvegardes.",
    context: "Le support N2/N3 doit traiter la cause, pas le symptôme : les tâches récurrentes deviennent des scripts exécutés à distance.",
    metrics: [{ v: '40+', l: 'scripts' }, { v: '- 60 %', l: 'tâches manuelles' }, { v: 'J+7', l: 'patchs' }, { v: '24/7', l: 'alerting' }],
    stack: ['rmm', 'powershell', 'windows', 'ad'],
    highlights: ['Scripts de remédiation (spouleur, cache, profils)', 'Rapports de conformité (BitLocker, antivirus, mises à jour)', 'Création de comptes AD normalisée', 'Bibliothèque de scripts versionnée'],
    vlans: [20]
  },
  {
    id: 'pki-8021x', title: 'PKI AD CS & authentification 802.1X (NPS)', cat: 'Sécurité', feature: false, visual: 'pki', status: 'Homelab',
    short: "PKI à deux niveaux (racine hors ligne), auto-enrollment des certificats machines et contrôle d'accès réseau 802.1X EAP-TLS via NPS.",
    context: "Brancher un PC inconnu sur une prise réseau ne doit donner accès à rien. 802.1X conditionne l'accès à un certificat délivré par la PKI.",
    metrics: [{ v: '2', l: 'niveaux PKI' }, { v: 'EAP-TLS', l: 'méthode' }, { v: 'auto', l: 'enrollment' }, { v: 'VLAN', l: 'dynamique' }],
    stack: ['adcs', 'nps', 'windows', 'cisco'],
    highlights: ['Racine hors ligne, AC subordonnée d’entreprise', 'Modèles de certificats machines + GPO auto-enrollment', 'NPS : politiques réseau et attribution de VLAN', 'Switch : dot1x + MAB pour les équipements sans supplicant'],
    vlans: [20, 40]
  }
];

PROJECTS.forEach((p, i) => {
  p.num = pad(i + 1);
  p.color = PROJECT_CATEGORIES[p.cat] || '#8b7bff';
});

const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

/* Catégories du wiki */
const WIKI_CATEGORIES = {
  'Réseau': '#22d3ee',
  'Sécurité': '#f472b6',
  'Systèmes Windows': '#38bdf8',
  'Systèmes Linux': '#f43f5e',
  'Virtualisation': '#ff8a3d',
  'Supervision': '#ef4444',
  'Automatisation': '#a3e635',
  'Téléphonie': '#facc15',
  'Déploiement': '#2dd4bf',
  'Bases de données': '#c084fc',
  'Services': '#fbbf24',
  'Référentiel': '#8b7bff'
};

const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

/* ==========================================================================
   05. PROCÉDURE INTÉGRÉE — référentiel du homelab
   (sert aussi de démonstration de toutes les capacités du moteur de rendu)
   ========================================================================== */
const BUILTIN_PROCEDURES = [
  {
    id: 'proc-000',
    title: 'Référentiel du homelab : VLANs, adressage, nommage et conventions',
    category: 'Référentiel',
    techs: ['cisco', 'pfsense', 'vlan', 'proxmox'],
    level: 'Intermédiaire',
    date: '2026-10-01',
    project: 'switching',
    summary: "Document de référence partagé par toutes les procédures du wiki : plan d'adressage, VLANs, conventions de nommage, matrice de flux et configuration de base du cœur de réseau.",
    env: { 'Pare-feu': 'pfSense CE 2.7.2 (CARP)', 'Cœur réseau': 'Cisco IOS 15.2', 'Hyperviseurs': 'Proxmox VE 8.2 ×3', 'Domaine AD': 'lab.enzomarechal.fr' },
    content: `
## Contexte

Toutes les procédures de ce wiki s'appuient sur le **même environnement**, construit pour reproduire les contraintes d'un SI d'entreprise de taille moyenne avec un site industriel : segmentation stricte, haute disponibilité des services d'infrastructure, administration centralisée et traçabilité.

Ce document fixe les **conventions communes** : avant d'appliquer une procédure, c'est ici que l'on vérifie une adresse IP, un nom d'hôte ou un numéro de VLAN.

> [!INFO] Pourquoi un référentiel ?
> En production, une erreur d'adressage ou un VLAN mal tagué est la première cause d'incident après une intervention. Un référentiel unique évite que chaque procédure réinvente ses propres valeurs.

## Topologie logique

~~~ascii title="Vue d'ensemble"
                         ┌──────────────────────┐
                         │   Internet  (FTTH)   │
                         └──────────┬───────────┘
                          WAN 203.0.113.10/29
                 ┌──────────────────┴──────────────────┐
         ┌───────┴───────┐     pfsync / XMLRPC  ┌───────┴───────┐
         │  PFSENSE-01   │◄────────────────────►│  PFSENSE-02   │
         │  CARP MASTER  │                      │  CARP BACKUP  │
         └───────┬───────┘                      └───────┬───────┘
            LAGG0 (LACP)                           LAGG0 (LACP)
                 └──────────────┐      ┌───────────────┘
                          ┌─────┴──────┴─────┐
                          │    SW-CORE-01    │  Trunk 802.1Q
                          │  VLAN 10-20-30   │  VLAN natif 999
                          │      40-50       │
                          └──┬───┬───┬───┬───┘
              ┌──────────────┘   │   │   └──────────────┐
         VLAN 10           VLAN 20  VLAN 30         VLAN 40 / 50
         MGMT              SRV      DMZ             VOIP-IOT / PXE
~~~

Le **routage inter-VLAN est effectué par pfSense** (router-on-a-stick sur l'agrégat LACP) et non par le switch : chaque flux entre deux zones traverse donc une règle de pare-feu journalisée.

## Plan d'adressage

| VLAN | Nom | Réseau | Passerelle (VIP CARP) | DHCP |
|------|-----|--------|------------------------|------|
| 10 | MGMT | \`10.10.10.0/24\` | \`10.10.10.1\` | Statique |
| 20 | SRV | \`10.10.20.0/24\` | \`10.10.20.1\` | Statique |
| 30 | DMZ | \`10.10.30.0/24\` | \`10.10.30.1\` | Statique |
| 40 | VOIP-IOT | \`10.10.40.0/24\` | \`10.10.40.1\` | \`.100 → .199\` |
| 50 | PXE | \`10.10.50.0/24\` | \`10.10.50.1\` | \`.100 → .199\` (relais) |
| 999 | NATIF | — | — | VLAN natif, jamais routé |

Convention dans **chaque** VLAN :

- \`.1\` : VIP CARP (passerelle)
- \`.2 → .9\` : équipements réseau
- \`.10 → .99\` : serveurs et services
- \`.100 → .199\` : plage DHCP
- \`.252\` / \`.253\` : adresses physiques de PFSENSE-01 / PFSENSE-02

## Conventions de nommage

| Élément | Format | Exemple |
|---------|--------|---------|
| Hyperviseur | \`PVE-NN\` | \`PVE-02\` |
| Contrôleur de domaine | \`DCNN\` | \`DC01\` |
| Serveur Linux | \`ROLE-NN\` | \`GALERA-03\` |
| Groupe AD (global) | \`GG_Service_Rôle\` | \`GG_Compta_Utilisateurs\` |
| Groupe AD (domaine local) | \`DL_Ressource_Droit\` | \`DL_Partage-Compta_RW\` |
| GPO | \`[Cible]_[Portée]_[Objet]\` | \`C_Postes_Durcissement-SMB\` |

> [!TIP] Règle d'or
> Un nom doit permettre de deviner le rôle, le site et l'environnement **sans ouvrir la console**.

## Configuration de base du cœur de réseau

Création des VLANs et du trunk vers l'agrégat pfSense :

~~~cisco title="SW-CORE-01 — VLANs et EtherChannel" hl="19-24"
SW-CORE-01# configure terminal
vlan 10
 name MGMT
vlan 20
 name SRV
vlan 30
 name DMZ
vlan 40
 name VOIP-IOT
vlan 50
 name PXE
vlan 999
 name NATIF-MORT
!
interface range GigabitEthernet1/0/1 - 2
 description LAGG vers PFSENSE-01
 channel-group 1 mode active
!
interface Port-channel1
 description TRUNK PFSENSE-01
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50
 switchport nonegotiate
!
spanning-tree mode rapid-pvst
end
write memory
~~~

Vérification :

~~~terminal title="SW-CORE-01 — vérifications"
SW-CORE-01# show etherchannel summary | include Po
1      Po1(SU)         LACP      Gi1/0/1(P)  Gi1/0/2(P)
2      Po2(SU)         LACP      Gi1/0/3(P)  Gi1/0/4(P)
SW-CORE-01# show interfaces trunk | include Po1
Po1         on               802.1q         trunking      999
Po1         10,20,30,40,50
~~~

> [!WARN] VLAN natif
> Le VLAN natif 999 n'est attribué à aucun port d'accès et n'existe pas côté pfSense. Laisser le VLAN 1 en natif expose au **VLAN hopping** par double étiquetage.

## Alias pfSense communs

Les règles de pare-feu des procédures utilisent ces alias :

~~~ini title="Firewall › Aliases (extrait)"
[RFC1918]
type    = network
content = 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16

[AD_PORTS]
type    = port
content = 53 88 123 135 389 445 464 636 3268 3269 49152:65535

[SIP_PROVIDER]
type    = host
content = 198.51.100.20 198.51.100.21
~~~

## Script de contrôle rapide

Ce script, lancé depuis le bastion, vérifie que chaque passerelle répond et que la résolution DNS interne fonctionne :

~~~bash title="/opt/scripts/check-lab.sh"
#!/usr/bin/env bash
# Vérification rapide des passerelles VLAN et du DNS interne
set -euo pipefail

VLANS=(10 20 30 40 50)
DNS_SERVERS=("10.10.20.10" "10.10.20.11")
DOMAIN="lab.enzomarechal.fr"

for v in "\${VLANS[@]}"; do
  gw="10.10.\${v}.1"
  if ping -c 1 -W 1 "\$gw" > /dev/null 2>&1; then
    printf "[OK]   VLAN %-3s passerelle %s\\n" "\$v" "\$gw"
  else
    printf "[FAIL] VLAN %-3s passerelle %s injoignable\\n" "\$v" "\$gw"
  fi
done

for dns in "\${DNS_SERVERS[@]}"; do
  if dig +short @"\$dns" "dc01.\${DOMAIN}" | grep -q "10.10.20.10"; then
    echo "[OK]   DNS \$dns résout dc01.\${DOMAIN}"
  else
    echo "[FAIL] DNS \$dns ne résout pas dc01.\${DOMAIN}"
  fi
done
~~~

## Tests de validation

- [x] Chaque VLAN dispose d'une passerelle \`.1\` joignable depuis le bastion
- [x] Le VLAN natif 999 n'est routé nulle part
- [x] Une machine en DMZ ne peut pas joindre \`10.10.20.0/24\` (hors ports autorisés)
- [x] Les postes PXE n'ont aucun accès Internet
- [ ] Revue trimestrielle des alias et des règles inutilisées

> [!SUCCESS] Résultat attendu
> Toutes les lignes du script affichent **[OK]**. En cas d'échec, vérifier d'abord le trunk ([[show interfaces trunk]]), puis l'état CARP dans *Status › CARP*.
`
  }
];

/* ==========================================================================
   06. STORE — fusion des données externes
   ========================================================================== */
const Store = {
  procedures: [],
  procById: new Map(),
  details: {},

  init() {
    const external = Array.isArray(window.WIKI_PROCEDURES) ? window.WIKI_PROCEDURES : [];
    const merged = [...BUILTIN_PROCEDURES, ...external];
    const seen = new Set();
    this.procedures = [];
    merged.forEach((raw, i) => {
      if (!raw || !raw.id || seen.has(raw.id)) return;
      seen.add(raw.id);
      this.procedures.push(this.prepare(raw, i));
    });
    this.procById = new Map(this.procedures.map((p) => [p.id, p]));
    this.details = (window.PORTFOLIO_PROJECT_DETAILS && typeof window.PORTFOLIO_PROJECT_DETAILS === 'object') ? window.PORTFOLIO_PROJECT_DETAILS : {};
  },

  prepare(raw, index) {
    const content = String(raw.content || '');
    const codeMatches = content.match(/^~~~[\s\S]*?^~~~\s*$/gm) || [];
    const codeLines = codeMatches.reduce((acc, block) => acc + block.split('\n').length - 2, 0);
    const prose = content.replace(/^~~~[\s\S]*?^~~~\s*$/gm, ' ');
    const words = (prose.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
    const minutes = Math.max(1, Math.round(words / 210 + codeLines / 28));
    const headings = [];
    content.replace(/^(#{2,3})\s+(.+)$/gm, (_, h, t) => {
      headings.push({ level: h.length, text: t.replace(/[`*_]/g, '').trim() });
      return _;
    });
    const techs = (raw.techs || []).map((t) => techInfo(t));
    const category = raw.category || 'Services';
    return {
      id: raw.id,
      title: raw.title || raw.id,
      category,
      color: WIKI_CATEGORIES[category] || '#8b7bff',
      techs,
      techKeys: techs.map((t) => t.key),
      level: LEVELS.includes(raw.level) ? raw.level : 'Intermédiaire',
      date: raw.date || '',
      summary: raw.summary || '',
      project: raw.project || null,
      env: raw.env || null,
      content,
      words,
      codeBlocks: codeMatches.length,
      codeLines,
      minutes,
      headings,
      order: index,
      searchTitle: normalize(raw.title || ''),
      searchMeta: normalize([category, raw.summary, ...(raw.techs || []), ...techs.map((t) => t.name), raw.level].join(' ')),
      searchBody: normalize(content.replace(/[#>*`|~\-[\]()]/g, ' '))
    };
  },

  techCounts() {
    const counts = new Map();
    this.procedures.forEach((p) => p.techKeys.forEach((k) => counts.set(k, (counts.get(k) || 0) + 1)));
    return counts;
  },

  categories() {
    const counts = new Map();
    this.procedures.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return counts;
  },

  proceduresForTech(key) {
    return this.procedures.filter((p) => p.techKeys.includes(key));
  },

  proceduresForProject(id) {
    const d = this.details[id];
    const explicit = d && Array.isArray(d.procedures) ? d.procedures : [];
    return this.procedures.filter((p) => p.project === id || explicit.includes(p.id));
  },

  projectsForTech(key) {
    return PROJECTS.filter((p) => p.stack.includes(key));
  }
};

/* ==========================================================================
   07. PRELOADER
   ========================================================================== */
const Preloader = {
  done: false,
  callbacks: [],

  onDone(cb) {
    if (this.done) cb();
    else this.callbacks.push(cb);
  },

  finish() {
    if (this.done) return;
    this.done = true;
    const el = $('#preloader');
    if (el) el.classList.add('is-done');
    document.body.classList.remove('is-loading');
    this.callbacks.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
    this.callbacks = [];
    setTimeout(() => el && el.remove(), 900);
  },

  run() {
    const el = $('#preloader');
    const log = $('#preloaderLog');
    const bar = $('#preloaderBar');
    if (!el || !log) {
      this.finish();
      return;
    }

    let visited = false;
    try {
      visited = sessionStorage.getItem('em-visited') === '1';
      sessionStorage.setItem('em-visited', '1');
    } catch (e) {
      visited = false;
    }

    const lines = [
      ['BIOS POST ........................... ', 'ok', 'OK'],
      ['Initialisation LAGG0 (LACP) .......... ', 'ok', 'UP'],
      ['CARP vhid 10-50 ...................... ', 'ok', 'MASTER'],
      ['corosync quorum (3/3) ................ ', 'ok', 'OK'],
      ['Ceph HEALTH .......................... ', 'ok', 'HEALTH_OK'],
      ['Montage des procédures du wiki ....... ', 'hl', `${Store.procedures.length} chargée(s)`],
      ['Chargement des 15 projets ............ ', 'ok', 'OK'],
      ['Démarrage du moteur 3D ............... ', 'ok', 'READY']
    ];

    const total = visited || prefersReducedMotion ? 350 : 1500;
    const step = total / lines.length;
    let i = 0;
    const html = [];

    const tick = () => {
      if (this.done) return;
      if (i < lines.length) {
        const [label, cls, status] = lines[i];
        html.push(`<span>${escapeHTML(label)}<span class="${cls}">${escapeHTML(status)}</span></span>`);
        log.innerHTML = html.slice(-7).join('\n');
        i += 1;
        bar.style.width = `${Math.round((i / lines.length) * 100)}%`;
        setTimeout(tick, step);
      } else {
        setTimeout(() => this.finish(), 220);
      }
    };
    tick();

    const skip = () => this.finish();
    $('#preloaderSkip')?.addEventListener('click', skip);
    const keySkip = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        skip();
        window.removeEventListener('keydown', keySkip);
      }
    };
    window.addEventListener('keydown', keySkip);
    setTimeout(skip, 4000);
  }
};

/* ==========================================================================
   08. SMOOTH SCROLL + GSAP / SCROLLTRIGGER + REVEALS
   ========================================================================== */
let lenis = null;

function initSmoothScroll() {
  const { gsap, ScrollTrigger, Lenis } = lib;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!Lenis || prefersReducedMotion) return;
  try {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4
    });
    if (gsap && ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  } catch (e) {
    console.warn('[lenis] désactivé :', e);
    lenis = null;
  }
}

function scrollToTarget(target, offset = -84) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el && target !== 0) return;
  if (lenis) {
    lenis.scrollTo(el ?? 0, { offset: el ? offset : 0, duration: 1.3 });
  } else if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
}

let lockCount = 0;
function lockScroll(lock) {
  lockCount = Math.max(0, lockCount + (lock ? 1 : -1));
  const locked = lockCount > 0;
  document.body.classList.toggle('is-locked', locked);
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
}

function initAnchorLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#' || href.includes('/')) return;
    const target = $(href);
    if (!target) return;
    e.preventDefault();
    closeMobileMenu();
    scrollToTarget(href === '#hero' ? 0 : target);
    history.replaceState(null, '', href === '#hero' ? location.pathname : href);
  });
}

function initReveals() {
  const { gsap, ScrollTrigger } = lib;
  const groups = [
    '.section__head > *',
    '.bento__item',
    '.tl-item',
    '.stack__stage',
    '.stack__panel',
    '.skill',
    '.lab__toolbar',
    '.lab__flows',
    '.lab__body',
    '.lab__tabs',
    '.filters',
    '.wiki-stats',
    '.wiki-search',
    '.goal',
    '.contact__left > *',
    '.contact-link',
    '.docs__details'
  ];
  const els = $$(groups.join(','));

  if (gsap && ScrollTrigger && !prefersReducedMotion) {
    gsap.set(els, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.07,
          overwrite: true,
          clearProps: 'transform'
        })
    });
    return;
  }

  document.documentElement.classList.add('no-gsap');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.remove('no-gsap');
  els.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

function revealNewItems(items) {
  const { gsap } = lib;
  if (!items.length) return;
  if (gsap && !prefersReducedMotion) {
    gsap.fromTo(items, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.035, clearProps: 'transform' });
  }
}

function heroIntro() {
  const { gsap } = lib;
  const items = $$('.reveal-hero');
  if (!gsap || prefersReducedMotion) return;
  gsap.fromTo(
    items,
    { autoAlpha: 0, y: 30, filter: 'blur(6px)' },
    { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'filter,transform' }
  );
  gsap.fromTo('.hero__legend, .hero__hint', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.8 });
}

function initHeroScrollFx() {
  const { gsap, ScrollTrigger } = lib;
  if (!gsap || !ScrollTrigger || prefersReducedMotion) return;
  gsap.to('.hero__content', {
    yPercent: -12,
    autoAlpha: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ==========================================================================
   09. NAVIGATION
   ========================================================================== */
function closeMobileMenu() {
  const menu = $('#mobileMenu');
  const burger = $('#navBurger');
  if (!menu || !menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  burger?.setAttribute('aria-expanded', 'false');
  lockScroll(false);
}

function initNav() {
  const nav = $('#nav');
  const burger = $('#navBurger');
  const menu = $('#mobileMenu');
  const progress = $('#scrollProgress');
  const indicator = $('#navIndicator');
  const links = $$('.nav__links a');
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    const goingDown = y > lastY;
    const modalOpen = document.body.classList.contains('is-locked');
    if (!modalOpen) nav.classList.toggle('is-hidden', goingDown && y > 600 && Math.abs(y - lastY) > 2);
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
  };

  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', throttle(onScroll, 16), { passive: true });
  onScroll();

  const moveIndicator = (link) => {
    if (!indicator) return;
    if (!link) {
      indicator.style.opacity = '0';
      return;
    }
    const parent = link.parentElement.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    indicator.style.opacity = '1';
    indicator.style.width = `${r.width}px`;
    indicator.style.transform = `translateX(${r.left - parent.left}px)`;
  };

  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const visible = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
        let best = null;
        let bestRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        });
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === best));
        moveIndicator(links.find((l) => l.dataset.nav === best));
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => io.observe(s));
  }

  window.addEventListener('resize', debounce(() => moveIndicator($('.nav__links a.is-active')), 150));

  burger?.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    lockScroll(open);
  });

  $$('.mobile-menu a').forEach((a) => a.addEventListener('click', closeMobileMenu));

  $('#backToTop')?.addEventListener('click', () => scrollToTarget(0));
  $$('.kbd-mod').forEach((k) => (k.textContent = isMac ? '⌘' : 'Ctrl'));
}

/* ==========================================================================
   10. SPOTLIGHT, TILT, EFFETS MAGNÉTIQUES
   ========================================================================== */
function bindSpotlight(card) {
  if (isTouch || card.dataset.spotBound) return;
  card.dataset.spotBound = '1';
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

function bindSpotGroup(container) {
  if (isTouch || !container || container.dataset.spotGroup) return;
  container.dataset.spotGroup = '1';
  container.classList.add('spot-group');
  let raf = 0;
  let lastEvent = null;
  const update = () => {
    raf = 0;
    if (!lastEvent) return;
    $$('.card--spot', container).forEach((card) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${lastEvent.clientX - r.left}px`);
      card.style.setProperty('--my', `${lastEvent.clientY - r.top}px`);
    });
  };
  container.addEventListener('pointermove', (e) => {
    lastEvent = e;
    if (!raf) raf = requestAnimationFrame(update);
  });
}

function initSpotlights() {
  $$('.card--spot').forEach(bindSpotlight);
  ['#missionBento', '#projectsGrid', '#wikiGrid', '.contact__links', '#skillsGrid'].forEach((sel) => bindSpotGroup($(sel)));
}

function applyTilt(elements, opts = {}) {
  const VT = lib.VanillaTilt;
  if (!VT || isTouch || prefersReducedMotion || !elements.length) return;
  elements.forEach((el) => {
    if (el.vanillaTilt) return;
    VT.init(el, {
      max: Number(el.dataset.tiltMax) || opts.max || 5,
      speed: 700,
      perspective: 1400,
      glare: true,
      'max-glare': 0.07,
      scale: opts.scale || 1,
      gyroscope: false,
      reset: true
    });
  });
}

function initMagnetic() {
  if (isTouch || prefersReducedMotion) return;
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ==========================================================================
   11. HERO : TYPED, CONSOLE, COMPTEURS
   ========================================================================== */
function initTyped() {
  const target = $('#typedTarget');
  if (!target) return;
  if (lib.Typed && !prefersReducedMotion) {
    target.textContent = '';
    try {
      // eslint-disable-next-line no-new
      new lib.Typed('#typedTarget', {
        strings: PROFILE.roles,
        typeSpeed: 34,
        backSpeed: 16,
        backDelay: 1900,
        startDelay: 400,
        loop: true,
        smartBackspace: true,
        cursorChar: '▋'
      });
      return;
    } catch (e) {
      console.warn('[typed]', e);
    }
  }
  let i = 0;
  target.innerHTML = PROFILE.roles[0];
  if (prefersReducedMotion) return;
  setInterval(() => {
    i = (i + 1) % PROFILE.roles.length;
    target.innerHTML = PROFILE.roles[i];
  }, 2800);
}

const HeroConsole = {
  running: false,
  timer: 0,
  series: { cpu: [], wan: [], db: [] },

  templates: [
    ['ok', 'pve-01', () => `vzdump CT ${randInt(101, 140)} → PBS-01 OK (${rand(0.4, 3.8).toFixed(1)} Go, dédup ${rand(6, 9).toFixed(1)}×)`],
    ['info', 'pfsense', () => `CARP vhid ${pick([10, 20, 30, 40, 50])} MASTER · pfsync ${randInt(3800, 4600)} états`],
    ['ok', 'galera', () => `wsrep_cluster_size=3 · flow_control ${rand(0, 0.02).toFixed(3)}`],
    ['sec', 'wazuh', () => `Rule 5710 · sshd tentative invalide depuis 185.${randInt(1, 254)}.${randInt(1, 254)}.${randInt(1, 254)} → bloquée`],
    ['info', 'zabbix', () => `Trigger résolu : PVE-0${randInt(1, 3)} CPU > 80 % (durée ${randInt(1, 4)} min)`],
    ['ok', 'wds-mdt', () => `PC-PXE-0${randInt(1, 2)} · étape ${randInt(3, 19)}/19 · ${pick(['Apply drivers', 'Install apps', 'Join domain', 'Windows Update', 'HP BCU'])}`],
    ['warn', 'sw-core', () => `Gi1/0/${randInt(5, 24)} : err-disabled (bpduguard) → remédiation auto`],
    ['ok', 'dc01', () => `Réplication AD DC01 ↔ DC02 OK · ${randInt(0, 2)} erreur(s)`],
    ['info', '3cx', () => `Trunk SIP enregistré · ${randInt(2, 9)} appels actifs · MOS ${rand(4.2, 4.4).toFixed(2)}`],
    ['ok', 'ansible', () => `PLAY RECAP ok=${randInt(28, 64)} changed=${randInt(0, 3)} failed=0`],
    ['ok', 'ceph', () => `HEALTH_OK · ${randInt(380, 420)} PGs active+clean`],
    ['info', 'glpi', () => `Inventaire GLPI Agent : ${randInt(1, 6)} poste(s) mis à jour`]
  ],

  init() {
    this.list = $('#heroLog');
    if (!this.list) return;
    for (let i = 0; i < 30; i += 1) {
      this.series.cpu.push(rand(18, 34));
      this.series.wan.push(rand(120, 260));
      this.series.db.push(rand(30, 60));
    }
    for (let i = 0; i < 7; i += 1) this.push(true);
    this.renderSparks();
    onVisible($('#hero'), (visible) => (visible ? this.start() : this.stop()), { rootMargin: '0px' });
  },

  push(silent = false) {
    const [lvl, host, fn] = pick(this.templates);
    const d = new Date();
    const li = document.createElement('li');
    if (silent) li.style.animation = 'none';
    const label = { ok: 'OK', info: 'INFO', warn: 'WARN', sec: 'SEC' }[lvl];
    li.innerHTML = `<time>${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}</time><span class="lvl lvl--${lvl}">${label}</span><span class="msg"><b>${host}</b> ${escapeHTML(fn())}</span>`;
    this.list.appendChild(li);
    while (this.list.children.length > 9) this.list.firstElementChild.remove();
  },

  step() {
    const walk = (arr, min, max, amp) => {
      const last = arr[arr.length - 1];
      arr.push(clamp(last + rand(-amp, amp), min, max));
      if (arr.length > 30) arr.shift();
    };
    walk(this.series.cpu, 8, 72, 7);
    walk(this.series.wan, 40, 480, 45);
    walk(this.series.db, 20, 90, 9);
    const cpu = this.series.cpu[this.series.cpu.length - 1];
    const wan = this.series.wan[this.series.wan.length - 1];
    $('#mCpu').textContent = `${Math.round(cpu)}%`;
    $('#mWan').textContent = `${Math.round(wan)} Mb/s`;
    $('#mDb').textContent = '3/3 sync';
    this.renderSparks();
  },

  renderSparks() {
    const toPoints = (arr) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const range = max - min || 1;
      return arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${22 - ((v - min) / range) * 20}`).join(' ');
    };
    $('#sparkCpu')?.setAttribute('points', toPoints(this.series.cpu));
    $('#sparkWan')?.setAttribute('points', toPoints(this.series.wan));
    $('#sparkDb')?.setAttribute('points', toPoints(this.series.db));
  },

  start() {
    if (this.running || prefersReducedMotion) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.push();
      this.step();
      this.timer = setTimeout(loop, rand(1100, 2400));
    };
    this.timer = setTimeout(loop, 900);
  },

  stop() {
    this.running = false;
    clearTimeout(this.timer);
  }
};

function animateCounter(el) {
  const source = el.dataset.countSource;
  let target = parseFloat(el.dataset.count);
  let suffix = el.dataset.suffix || '';
  if (source === 'wiki') {
    target = Store.procedures.length;
    suffix = '';
  }
  const decimals = Number(el.dataset.decimals || 0);
  const format = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  if (prefersReducedMotion) {
    el.textContent = format(target);
    return;
  }
  const start = performance.now();
  const dur = 1600;
  const frame = (now) => {
    const t = clamp((now - start) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function initCounters() {
  $$('.counter').forEach((el) => once(el, () => animateCounter(el)));
}

/* ==========================================================================
   12. HERO 3D — topologie réseau Three.js
   ========================================================================== */
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

let threePromise = null;
function loadThree() {
  if (threePromise) return threePromise;
  threePromise = (async () => {
    const THREE = await import('three');
    let post = null;
    if (!isMobile()) {
      try {
        const [ec, rp, ub, op] = await Promise.all([
          import('three/addons/postprocessing/EffectComposer.js'),
          import('three/addons/postprocessing/RenderPass.js'),
          import('three/addons/postprocessing/UnrealBloomPass.js'),
          import('three/addons/postprocessing/OutputPass.js')
        ]);
        post = { EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass, UnrealBloomPass: ub.UnrealBloomPass, OutputPass: op.OutputPass };
      } catch (e) {
        console.warn('[three] post-processing indisponible :', e.message);
      }
    }
    return { THREE, post };
  })();
  return threePromise;
}

function makeGlowTexture(THREE, inner = 'rgba(255,255,255,1)', size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTextSprite(THREE, text, color = '#e2e8f0', opts = {}) {
  const fontSize = opts.fontSize || 44;
  const padX = 26;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = `600 ${fontSize}px "Geist Mono", ui-monospace, monospace`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const h = fontSize + 30;
  c.width = w;
  c.height = h;
  ctx.font = font;
  ctx.fillStyle = 'rgba(10,12,16,0.78)';
  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padX, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: opts.opacity ?? 0.95, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  const scale = opts.scale || 0.011;
  sprite.scale.set(w * scale, h * scale, 1);
  sprite.renderOrder = 10;
  return sprite;
}

const Hero3D = {
  ready: false,
  visible: true,
  pointer: { x: 0, y: 0, tx: 0, ty: 0, cx: -9999, cy: -9999 },
  hovered: null,
  packets: [],

  async init() {
    const canvas = $('#heroCanvas');
    const hero = $('#hero');
    if (!canvas || !hero || !webglAvailable()) return;
    let mods;
    try {
      mods = await loadThree();
    } catch (e) {
      console.warn('[hero3d] Three.js indisponible :', e.message);
      return;
    }
    const { THREE, post } = mods;
    this.THREE = THREE;
    this.canvas = canvas;
    this.hero = hero;

    try {
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
    } catch (e) {
      /* polices non critiques */
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile(), alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.4 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080b);
    scene.fog = new THREE.FogExp2(0x07080b, 0.021);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    camera.position.set(0, 5.5, 31);
    this.camera = camera;

    scene.add(new THREE.AmbientLight(0x8890b0, 0.55));
    const key = new THREE.PointLight(0x8b7bff, 60, 60, 1.6);
    key.position.set(0, 8, 6);
    scene.add(key);
    const fill = new THREE.PointLight(0x22d3ee, 40, 60, 1.6);
    fill.position.set(-8, -2, 8);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    this.world = world;
    const net = new THREE.Group();
    world.add(net);
    this.net = net;

    this.glowTex = makeGlowTexture(THREE);
    this.buildTopology();
    this.buildDust();
    this.buildFloor();

    if (post && !isMobile()) {
      try {
        const composer = new post.EffectComposer(renderer);
        composer.addPass(new post.RenderPass(scene, camera));
        this.bloom = new post.UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.18);
        composer.addPass(this.bloom);
        composer.addPass(new post.OutputPass());
        this.composer = composer;
      } catch (e) {
        console.warn('[hero3d] bloom désactivé :', e.message);
        this.composer = null;
      }
    }

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.resize();
    window.addEventListener('resize', debounce(() => this.resize(), 120));
    window.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
    canvas.addEventListener('pointerleave', () => this.setHover(null));
    canvas.addEventListener('click', () => {
      if (this.hovered) {
        const id = this.hovered.userData.node.id;
        Homelab.select(id);
        scrollToTarget('#homelab');
      }
    });

    onVisible(hero, (v) => {
      this.visible = v;
      if (v) this.loop();
    }, { rootMargin: '0px' });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.visible) this.loop();
    });

    hero.classList.add('has-3d');
    this.ready = true;
    this.loop();
  },

  buildTopology() {
    const THREE = this.THREE;
    const P = {
      internet: new THREE.Vector3(0, 9.6, 0),
      fw1: new THREE.Vector3(-2.9, 6.3, 0),
      fw2: new THREE.Vector3(2.9, 6.3, 0),
      core: new THREE.Vector3(0, 2.9, 0)
    };
    const hubs = {};
    VLANS.forEach((v, i) => {
      const a = (i / VLANS.length) * Math.PI * 2 + Math.PI / 2;
      hubs[v.id] = new THREE.Vector3(Math.cos(a) * 8, -1.3, Math.sin(a) * 8);
    });
    this.P = P;
    this.hubs = hubs;
    this.nodeMeshes = [];
    this.nodePos = {};
    this.floaters = [];

    const geos = {
      box: new THREE.BoxGeometry(0.62, 0.82, 0.62),
      switch: new THREE.BoxGeometry(2.6, 0.46, 1.25),
      firewall: new THREE.OctahedronGeometry(0.78, 0),
      db: new THREE.CylinderGeometry(0.34, 0.34, 0.74, 18),
      octa: new THREE.OctahedronGeometry(0.44, 0),
      dodeca: new THREE.DodecahedronGeometry(0.38, 0),
      sphere: new THREE.SphereGeometry(0.26, 18, 14),
      cloud: new THREE.IcosahedronGeometry(1.25, 1)
    };
    const geoFor = (type) => {
      if (type === 'switch') return geos.switch;
      if (type === 'firewall') return geos.firewall;
      if (type === 'cloud') return geos.cloud;
      if (type === 'db') return geos.db;
      if (type === 'shield' || type === 'key') return geos.octa;
      if (type === 'web' || type === 'mail') return geos.dodeca;
      if (['phone', 'pc', 'iot', 'ap'].includes(type)) return geos.sphere;
      return geos.box;
    };

    const addNode = (node, pos) => {
      const color = new THREE.Color(nodeColor(node));
      const geo = geoFor(node.type);
      let mesh;
      if (node.type === 'cloud') {
        mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.55 }));
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
        mesh.add(inner);
      } else {
        mesh = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ color: 0x0c0f15, emissive: color, emissiveIntensity: node.big ? 0.55 : 0.4, roughness: 0.35, metalness: 0.45 })
        );
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
        mesh.add(edges);
      }
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
      const hs = node.big ? 3.4 : node.type === 'cloud' ? 4.2 : 1.5;
      halo.scale.set(hs, hs, 1);
      mesh.add(halo);
      mesh.position.copy(pos);
      mesh.userData = { node, baseY: pos.y, phase: Math.random() * Math.PI * 2, halo, baseScale: 1, color };
      this.net.add(mesh);
      this.nodeMeshes.push(mesh);
      this.nodePos[node.id] = pos.clone();
      this.floaters.push(mesh);
      return mesh;
    };

    addNode(NODE_BY_ID.internet, P.internet);
    addNode(NODE_BY_ID.fw1, P.fw1);
    addNode(NODE_BY_ID.fw2, P.fw2);
    addNode(NODE_BY_ID.core, P.core);

    const linkPos = [];
    const linkCol = [];
    const pushLink = (a, b, colA, colB = colA) => {
      linkPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const ca = new THREE.Color(colA);
      const cb = new THREE.Color(colB);
      linkCol.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    };

    pushLink(P.internet, P.fw1, '#f87171');
    pushLink(P.internet, P.fw2, '#f87171');
    pushLink(P.fw1, P.fw2, '#fbbf24');
    pushLink(P.fw1, P.core, '#fb7185', '#8b7bff');
    pushLink(P.fw2, P.core, '#fb7185', '#8b7bff');

    this.hubRings = [];
    VLANS.forEach((v) => {
      const hub = hubs[v.id];
      pushLink(P.core, hub, '#cbd5e1', v.color);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 8, 72), new THREE.MeshBasicMaterial({ color: v.color, transparent: true, opacity: 0.9 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(hub);
      this.net.add(ring);
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.008, 4, 120), new THREE.MeshBasicMaterial({ color: v.color, transparent: true, opacity: 0.22 }));
      orbit.rotation.x = Math.PI / 2;
      orbit.position.copy(hub);
      this.net.add(orbit);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: v.color }));
      core.position.copy(hub);
      this.net.add(core);
      this.hubRings.push(ring);

      const label = makeTextSprite(THREE, `VLAN ${v.id} · ${v.short}`, v.color, { scale: 0.0105 });
      label.position.copy(hub).add(new THREE.Vector3(0, -1.15, 0));
      this.net.add(label);

      const members = NODES.filter((n) => n.vlan === v.id);
      members.forEach((n, j) => {
        const a = (j / members.length) * Math.PI * 2 + v.id * 0.13;
        const pos = new THREE.Vector3(hub.x + Math.cos(a) * 2.35, hub.y + 0.15 + Math.sin(j * 1.9) * 0.45, hub.z + Math.sin(a) * 2.35);
        addNode(n, pos);
        pushLink(hub, pos, v.color);
      });
    });

    [['INTERNET', P.internet, '#fca5a5', 1.9], ['PFSENSE-01 · MASTER', P.fw1, '#fda4af', 1.25], ['PFSENSE-02 · BACKUP', P.fw2, '#fda4af', 1.25], ['SW-CORE-01', P.core, '#e2e8f0', 0.75]].forEach(([t, p, c, off]) => {
      const s = makeTextSprite(THREE, t, c, { scale: 0.0105 });
      s.position.copy(p).add(new THREE.Vector3(0, off, 0));
      this.net.add(s);
    });

    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(linkPos, 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(linkCol, 3));
    this.links = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.net.add(this.links);

    this.buildPackets();
  },

  pathUp(id) {
    const n = NODE_BY_ID[id];
    const P = this.P;
    const pos = this.nodePos[id];
    if (id === 'internet') return [P.internet];
    if (id === 'fw1' || id === 'fw2') return [pos, P.internet];
    if (id === 'core') return [P.core, P.fw1, P.internet];
    return [pos, this.hubs[n.vlan], P.core, P.fw1, P.internet];
  },

  randomPath() {
    const leaves = NODES.filter((n) => typeof n.vlan === 'number');
    const r = Math.random();
    const a = pick(leaves);
    const P = this.P;
    let pts;
    let color = VLAN_BY_ID[a.vlan].color;
    if (r < 0.32) {
      pts = this.pathUp(a.id);
      if (Math.random() < 0.5) {
        pts = pts.slice().reverse();
        color = '#f87171';
      }
    } else if (r < 0.74) {
      let b = pick(leaves);
      let guard = 0;
      while (b.vlan === a.vlan && guard < 10) {
        b = pick(leaves);
        guard += 1;
      }
      pts = [this.nodePos[a.id], this.hubs[a.vlan], P.core, P.fw1, P.core, this.hubs[b.vlan], this.nodePos[b.id]];
    } else if (r < 0.92) {
      const same = leaves.filter((n) => n.vlan === a.vlan && n.id !== a.id);
      const b = same.length ? pick(same) : a;
      pts = [this.nodePos[a.id], this.hubs[a.vlan], this.nodePos[b.id]];
    } else {
      pts = Math.random() < 0.5 ? [P.fw1, P.fw2] : [P.fw2, P.fw1];
      color = '#fbbf24';
    }
    return { pts, color };
  },

  buildPackets() {
    const THREE = this.THREE;
    const count = isMobile() ? 55 : 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.42,
      map: this.glowTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.packetPoints = new THREE.Points(geo, mat);
    this.net.add(this.packetPoints);
    this.packets = [];
    for (let i = 0; i < count; i += 1) {
      const p = {};
      this.spawnPacket(p, i, true);
      this.packets.push(p);
    }
  },

  spawnPacket(p, i, initial = false) {
    const THREE = this.THREE;
    const { pts, color } = this.randomPath();
    const lens = [];
    let total = 0;
    for (let k = 1; k < pts.length; k += 1) {
      const l = pts[k].distanceTo(pts[k - 1]);
      lens.push(l);
      total += l;
    }
    p.pts = pts;
    p.lens = lens;
    p.total = total || 0.001;
    p.d = initial ? Math.random() * p.total : 0;
    p.speed = rand(3.2, 6.5);
    const c = new THREE.Color(color);
    const col = this.packetPoints.geometry.attributes.color;
    col.setXYZ(i, c.r, c.g, c.b);
    col.needsUpdate = true;
  },

  updatePackets(dt) {
    const pos = this.packetPoints.geometry.attributes.position;
    this.packets.forEach((p, i) => {
      p.d += p.speed * dt;
      if (p.d >= p.total) {
        this.spawnPacket(p, i);
      }
      let d = p.d;
      let k = 0;
      while (k < p.lens.length && d > p.lens[k]) {
        d -= p.lens[k];
        k += 1;
      }
      const a = p.pts[Math.min(k, p.pts.length - 1)];
      const b = p.pts[Math.min(k + 1, p.pts.length - 1)];
      const t = p.lens[k] ? d / p.lens[k] : 0;
      pos.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    });
    pos.needsUpdate = true;
  },

  buildDust() {
    const THREE = this.THREE;
    const count = isMobile() ? 500 : 1400;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = rand(14, 70);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(rand(-1, 1));
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.cos(ph) * 0.6;
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    this.dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.12, color: 0x9aa4c7, map: this.glowTex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.world.add(this.dust);
  },

  buildFloor() {
    const THREE = this.THREE;
    const grid = new THREE.PolarGridHelper(16, 20, 9, 96, 0x2a2f45, 0x1a1e2c);
    grid.position.y = -3.4;
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    grid.material.depthWrite = false;
    this.net.add(grid);
    this.floor = grid;
  },

  resize() {
    if (!this.renderer) return;
    const w = this.hero.clientWidth;
    const h = this.hero.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const wide = w > 1100;
    this.layout = { offsetX: wide ? 7.2 : 0, offsetY: wide ? 0 : 2.5, baseZ: wide ? 31 : w < 760 ? 44 : 38 };
    this.camera.position.z = this.layout.baseZ;
    this.camera.updateProjectionMatrix();
    this.world.position.x = this.layout.offsetX;
    this.world.position.y = this.layout.offsetY;
    if (this.composer) {
      this.composer.setSize(w, h);
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
    }
  },

  onPointer(e) {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    this.pointer.cx = e.clientX;
    this.pointer.cy = e.clientY;
    this.pointer.overCanvas = e.target === this.canvas;
  },

  setHover(mesh) {
    if (this.hovered === mesh) return;
    if (this.hovered) {
      this.hovered.userData.halo.material.opacity = 0.22;
    }
    this.hovered = mesh;
    const tt = $('#heroTooltip');
    if (!mesh) {
      tt?.classList.remove('is-visible');
      this.canvas.style.cursor = '';
      return;
    }
    const n = mesh.userData.node;
    mesh.userData.halo.material.opacity = 0.75;
    this.canvas.style.cursor = 'pointer';
    if (tt) {
      $('#heroTooltipName').textContent = n.name;
      $('#heroTooltipIp').textContent = n.ip;
      $('#heroTooltipRole').textContent = `${n.role} — cliquer pour ouvrir`;
      tt.style.setProperty('--tt-color', nodeColor(n));
      tt.classList.add('is-visible');
    }
  },

  pick() {
    if (!this.pointer.overCanvas || isTouch) {
      if (this.hovered) this.setHover(null);
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((this.pointer.cx - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((this.pointer.cy - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.nodeMeshes, false);
    this.setHover(hits.length ? hits[0].object : null);
    const tt = $('#heroTooltip');
    if (this.hovered && tt) {
      tt.style.transform = `translate3d(${this.pointer.cx + 18}px, ${this.pointer.cy + 18}px, 0)`;
    }
  },

  loop() {
    if (!this.ready || this.raf) return;
    const frame = () => {
      this.raf = 0;
      if (!this.visible || document.hidden) return;
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },

  render() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const p = this.pointer;
    p.x = lerp(p.x, p.tx, 0.05);
    p.y = lerp(p.y, p.ty, 0.05);

    const heroH = this.hero.offsetHeight || window.innerHeight;
    const sp = clamp(window.scrollY / heroH, 0, 1);

    if (!prefersReducedMotion) this.net.rotation.y += dt * 0.06;
    this.world.rotation.y = p.x * 0.28;
    this.world.rotation.x = 0.16 + p.y * 0.1 + sp * 0.35;
    this.camera.position.z = this.layout.baseZ + sp * 10;
    this.camera.position.y = 5.5 - sp * 3;
    this.camera.lookAt(this.layout.offsetX * 0.35, this.layout.offsetY * 0.4, 0);

    this.floaters.forEach((m) => {
      const u = m.userData;
      m.position.y = u.baseY + Math.sin(t * 1.2 + u.phase) * 0.12;
      const target = m === this.hovered ? 1.45 : 1;
      const s = lerp(m.scale.x, target, 0.15);
      m.scale.set(s, s, s);
      if (u.node.type === 'firewall' || u.node.type === 'cloud') m.rotation.y += dt * 0.4;
    });
    this.hubRings.forEach((r, i) => {
      r.rotation.z += dt * (0.4 + i * 0.05);
      const s = 1 + Math.sin(t * 2 + i) * 0.06;
      r.scale.set(s, s, s);
    });
    this.dust.rotation.y -= dt * 0.01;

    this.updatePackets(dt);
    this.pick();

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
};

/* ==========================================================================
   13. STACK 3D — galaxie de badges technologiques
   ========================================================================== */
function makeBadgeTexture(THREE, tech, small = false) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  const hex = () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 180) * (60 * i - 90);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#171b26');
  g.addColorStop(1, '#0a0c11');
  hex();
  ctx.fillStyle = g;
  ctx.fill();
  const rg = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, r);
  rg.addColorStop(0, `rgba(${rgbString(tech.color)}, 0.32)`);
  rg.addColorStop(1, `rgba(${rgbString(tech.color)}, 0)`);
  hex();
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.save();
  ctx.shadowColor = tech.color;
  ctx.shadowBlur = 18;
  hex();
  ctx.strokeStyle = tech.color;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = tech.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${small ? 78 : 70}px "Geist Mono", ui-monospace, monospace`;
  ctx.fillText(tech.mono, cx, small ? cy + 4 : cy - 14);
  if (!small) {
    ctx.fillStyle = '#d7dce6';
    let fs = 25;
    ctx.font = `600 ${fs}px "Geist", system-ui, sans-serif`;
    while (ctx.measureText(tech.name).width > r * 1.55 && fs > 14) {
      fs -= 1;
      ctx.font = `600 ${fs}px "Geist", system-ui, sans-serif`;
    }
    ctx.fillText(tech.name, cx, cy + 48);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const Stack3D = {
  ready: false,
  visible: false,
  rot: { x: 0.25, y: 0, vx: 0, vy: 0.0025 },
  drag: null,
  pointer: { x: 0, y: 0, nx: 0, ny: 0, inside: false },
  badges: [],
  hovered: null,
  current: 'proxmox',

  async init() {
    setStackPanel('proxmox');
    const canvas = $('#stackCanvas');
    const stage = $('.stack__stage');
    this.renderFallback();
    if (!canvas || !stage || !webglAvailable()) {
      $('.stack')?.classList.add('no-3d');
      return;
    }
    let mods;
    try {
      mods = await loadThree();
    } catch (e) {
      $('.stack')?.classList.add('no-3d');
      return;
    }
    const { THREE } = mods;
    this.THREE = THREE;
    this.canvas = canvas;
    this.stage = stage;

    try {
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
    } catch (e) {
      /* non bloquant */
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer = renderer;
    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 17);
    this.camera = camera;

    scene.add(new THREE.AmbientLight(0xaab0c8, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4);
    dl.position.set(4, 6, 10);
    scene.add(dl);
    const pl = new THREE.PointLight(0x8b7bff, 30, 30, 1.5);
    pl.position.set(0, 0, 4);
    scene.add(pl);

    const glow = makeGlowTexture(THREE);
    const coreGroup = new THREE.Group();
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), new THREE.MeshBasicMaterial({ color: 0x8b7bff, wireframe: true, transparent: true, opacity: 0.55 }));
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 2), new THREE.MeshStandardMaterial({ color: 0x0c0f15, emissive: 0x22d3ee, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5 }));
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x8b7bff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    coreGlow.scale.set(6, 6, 1);
    coreGroup.add(ico, inner, coreGlow);
    scene.add(coreGroup);
    this.coreGroup = coreGroup;

    const ringGeo = new THREE.TorusGeometry(5.7, 0.01, 4, 160);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x8b7bff, transparent: true, opacity: 0.25 }));
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);
    this.ring = ring;

    const make = (key, radius, small) => {
      const tech = { key, ...TECHS[key] };
      const depth = small ? 0.16 : 0.24;
      const geo = new THREE.CylinderGeometry(radius, radius, depth, 6);
      geo.rotateX(Math.PI / 2);
      const prism = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0f121a, metalness: 0.6, roughness: 0.28, emissive: new THREE.Color(tech.color), emissiveIntensity: 0.08 }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: tech.color, transparent: true, opacity: 0.85 }));
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2, radius * 2),
        new THREE.MeshBasicMaterial({ map: makeBadgeTexture(THREE, tech, small), transparent: true, alphaTest: 0.02, toneMapped: false })
      );
      face.position.z = depth / 2 + 0.005;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: tech.color, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.set(radius * 4, radius * 4, 1);
      halo.position.z = -0.1;
      const g = new THREE.Group();
      g.add(halo, prism, edges, face);
      g.userData = { key, tech, small, spin: 0, halo, prism, face };
      prism.userData.badge = g;
      face.userData.badge = g;
      scene.add(g);
      return g;
    };

    const n = CORE_TECHS.length;
    CORE_TECHS.forEach((key, i) => {
      const g = make(key, 1.05, false);
      const y = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      g.userData.base = new THREE.Vector3(Math.cos(th) * rr * 3.7, y * 3.2, Math.sin(th) * rr * 3.7);
      g.userData.orbit = false;
      this.badges.push(g);
    });
    ORBIT_TECHS.forEach((key, i) => {
      const g = make(key, 0.58, true);
      const a = (i / ORBIT_TECHS.length) * Math.PI * 2;
      g.userData.base = new THREE.Vector3(Math.cos(a) * 5.7, 0, Math.sin(a) * 5.7);
      g.userData.orbit = true;
      this.badges.push(g);
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CORE_TECHS.length * 6), 3));
    this.spokes = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x8b7bff, transparent: true, opacity: 0.18, depthWrite: false }));
    scene.add(this.spokes);

    const dustN = 300;
    const dArr = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = rand(6.2, 9);
      dArr[i * 3] = Math.cos(a) * r;
      dArr[i * 3 + 1] = rand(-0.6, 0.6);
      dArr[i * 3 + 2] = Math.sin(a) * r;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dArr, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.12, map: glow, color: 0x22d3ee, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.dust.rotation.x = Math.PI / 2.4 - Math.PI / 2;
    scene.add(this.dust);

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
    this.tmp = new THREE.Vector3();
    this.tiltQ = new THREE.Quaternion();
    this.clock = new THREE.Clock();
    this.pickables = this.badges.flatMap((b) => [b.userData.prism, b.userData.face]);

    this.bindEvents();
    this.resize();
    window.addEventListener('resize', debounce(() => this.resize(), 120));
    onVisible(stage, (v) => {
      this.visible = v;
      if (v) this.loop();
    });
    this.ready = true;
    this.loop();
  },

  renderFallback() {
    const fb = $('#stackFallback');
    if (!fb) return;
    fb.innerHTML = CORE_TECHS.concat(ORBIT_TECHS)
      .map((k) => {
        const t = TECHS[k];
        return `<button type="button" data-tech="${k}" style="--c:${t.color}"><i>${escapeHTML(t.mono)}</i>${escapeHTML(t.name)}</button>`;
      })
      .join('');
    fb.addEventListener('mouseover', (e) => {
      const b = e.target.closest('[data-tech]');
      if (b) setStackPanel(b.dataset.tech);
    });
    fb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tech]');
      if (b) Wiki.filterByTech(b.dataset.tech, true);
    });
  },

  bindEvents() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      this.drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, t: performance.now() };
      if (e.pointerType === 'mouse') c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      this.pointer.x = e.clientX - r.left;
      this.pointer.y = e.clientY - r.top;
      this.pointer.nx = (this.pointer.x / r.width) * 2 - 1;
      this.pointer.ny = (this.pointer.y / r.height) * 2 - 1;
      this.pointer.inside = true;
      if (this.drag && e.pointerType === 'mouse') {
        const dx = e.clientX - this.drag.x;
        const dy = e.clientY - this.drag.y;
        this.drag.moved += Math.abs(dx) + Math.abs(dy);
        this.rot.vy = dx * 0.0009;
        this.rot.vx = dy * 0.0006;
        this.rot.y += dx * 0.006;
        this.rot.x = clamp(this.rot.x + dy * 0.004, -0.9, 0.9);
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
      }
    });
    const end = () => {
      if (this.drag && this.drag.moved < 6 && this.hovered) {
        Wiki.filterByTech(this.hovered.userData.key, true);
      }
      this.drag = null;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', () => (this.drag = null));
    c.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
      this.setHover(null);
    });
  },

  resize() {
    if (!this.renderer) return;
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = w < 560 ? 22 : 17;
    this.camera.updateProjectionMatrix();
  },

  setHover(badge) {
    if (this.hovered === badge) return;
    this.hovered = badge;
    this.canvas.style.cursor = badge ? 'pointer' : '';
    if (badge) {
      badge.userData.spin = Math.PI * 2;
      setStackPanel(badge.userData.key);
    }
  },

  pick() {
    if (!this.pointer.inside || this.drag?.moved > 6) return;
    const r = this.canvas.getBoundingClientRect();
    this.ndc.x = (this.pointer.x / r.width) * 2 - 1;
    this.ndc.y = -(this.pointer.y / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    this.setHover(hits.length ? hits[0].object.userData.badge : null);
  },

  loop() {
    if (!this.ready || this.raf) return;
    const frame = () => {
      this.raf = 0;
      if (!this.visible || document.hidden) return;
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },

  render() {
    const THREE = this.THREE;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    if (!this.drag) {
      this.rot.vy = lerp(this.rot.vy, prefersReducedMotion ? 0 : 0.0025, 0.02);
      this.rot.vx = lerp(this.rot.vx, 0, 0.05);
      this.rot.y += this.rot.vy * (this.hovered ? 0.2 : 1) * 60 * dt;
      this.rot.x = lerp(this.rot.x, 0.25, 0.01);
    }
    this.e.set(this.rot.x, this.rot.y, 0, 'XYZ');
    this.q.setFromEuler(this.e);

    const orbitQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2.4 - Math.PI / 2, -t * 0.12, 0, 'XYZ'));
    const spokes = this.spokes.geometry.attributes.position;
    let si = 0;

    this.tiltQ.setFromEuler(new THREE.Euler(this.pointer.ny * 0.25, this.pointer.nx * 0.35, 0));

    this.badges.forEach((b) => {
      const u = b.userData;
      this.tmp.copy(u.base);
      if (u.orbit) this.tmp.applyQuaternion(orbitQ);
      else this.tmp.applyQuaternion(this.q);
      this.tmp.y += Math.sin(t * 1.3 + u.base.x) * 0.08;
      b.position.copy(this.tmp);
      b.quaternion.copy(this.camera.quaternion).multiply(this.tiltQ);
      if (u.spin > 0) {
        const step = Math.min(u.spin, dt * 9);
        u.spin -= step;
        u.prism.rotation.z = 0;
        b.rotateY(u.spin);
      }
      const active = b === this.hovered || u.key === this.current;
      const target = b === this.hovered ? 1.3 : active ? 1.12 : 1;
      const s = lerp(b.scale.x, target, 0.15);
      b.scale.set(s, s, s);
      u.halo.material.opacity = lerp(u.halo.material.opacity, active ? 0.55 : 0, 0.1);
      if (!u.orbit) {
        spokes.setXYZ(si++, 0, 0, 0);
        spokes.setXYZ(si++, b.position.x, b.position.y, b.position.z);
      }
    });
    spokes.needsUpdate = true;

    this.coreGroup.rotation.y += dt * 0.3;
    this.coreGroup.rotation.x += dt * 0.12;
    this.dust.rotation.y += dt * 0.05;
    this.pick();
    this.renderer.render(this.scene, this.camera);
  }
};

function setStackPanel(key) {
  const t = techInfo(key);
  const panel = $('#stackPanel');
  if (!panel) return;
  Stack3D.current = t.key;
  panel.style.setProperty('--stack-c', t.color);
  panel.style.setProperty('--stack-rgb', rgbString(t.color));
  $('#stackMono').textContent = t.mono;
  $('#stackName').textContent = t.name;
  $('#stackCat').textContent = t.cat;
  $('#stackDesc').textContent = t.desc || '';
  $('#stackLevelTxt').textContent = `${t.level} / 100`;
  $('#stackLevelBar').style.width = `${t.level}%`;
  $('#stackUses').innerHTML = (t.uses || []).map((u) => `<li>${escapeHTML(u)}</li>`).join('');
  $('#stackProj').textContent = Store.projectsForTech(t.key).length;
  $('#stackProc').textContent = Store.proceduresForTech(t.key).length;
  $('#stackGoWiki').dataset.tech = t.key;
}

/* ==========================================================================
   14. MISSION : PORTS SWITCH & MARQUEE
   ========================================================================== */
function initSwitchViz() {
  const host = $('#switchViz');
  if (!host) return;
  const plan = [10, 10, 20, 20, 20, 20, 40, 40, 40, 40, 40, 40, 50, 50, 50, 50, 30, 30, 0, 0, 40, 40, 'tr', 'tr'];
  const colorOf = (v) => (v === 'tr' ? '#e2e8f0' : v === 0 ? null : VLAN_BY_ID[v].color);
  host.innerHTML = `
    <div class="switch-viz__label"><span>SW-ACCESS-03 · 24 ports</span><span id="switchUp">—</span></div>
    <div class="switch-viz__ports">${plan
      .map((v, i) => {
        const c = colorOf(v);
        return `<span class="switch-viz__port${c ? ' is-up' : ''}" style="${c ? `--p:${c}` : ''}" title="Gi1/0/${i + 1}${v === 'tr' ? ' · trunk' : v ? ` · VLAN ${v}` : ' · shutdown'}"></span>`;
      })
      .join('')}</div>
    <div class="switch-viz__legend">
      ${VLANS.map((v) => `<span><i style="--c:${v.color}"></i>${v.id}</span>`).join('')}
      <span><i style="--c:#e2e8f0"></i>trunk</span>
    </div>`;
  const ports = $$('.switch-viz__port', host);
  const up = ports.filter((p) => p.classList.contains('is-up'));
  $('#switchUp').textContent = `${up.length}/24 up`;
  if (prefersReducedMotion) return;
  let running = false;
  let timer = 0;
  const tick = () => {
    up.forEach((p) => p.classList.toggle('is-blink', Math.random() < 0.3));
    timer = setTimeout(tick, 600);
  };
  onVisible(host, (v) => {
    if (v && !running) {
      running = true;
      tick();
    } else if (!v) {
      running = false;
      clearTimeout(timer);
    }
  });
}

function initMarquee() {
  const track = $('#marqueeTrack');
  if (!track) return;
  const keys = [...CORE_TECHS, ...ORBIT_TECHS, 'gpo', 'hpbcu', 'ceph', 'adcs', 'nps', 'haproxy', 'openvpn', 'rmm'];
  const html = keys
    .map((k) => {
      const t = TECHS[k];
      return `<span class="marquee__item"><i style="--c:${t.color}">${escapeHTML(t.mono)}</i>${escapeHTML(t.name)}</span>`;
    })
    .join('');
  track.innerHTML = html + html;
}

/* ==========================================================================
   15. TIMELINE & COMPÉTENCES
   ========================================================================== */
function renderTimeline() {
  const host = $('#timeline');
  if (!host) return;
  const html = PROFILE.timeline
    .map(
      (item) => `
    <article class="tl-item card card--spot${item.future ? ' tl-item--future' : ''}${item.current ? ' is-current' : ''}" style="--tl-c:${item.color};--spot-color:${rgbString(item.color)}" data-tl="${item.id}">
      <div class="card__glow" aria-hidden="true"></div>
      <span class="tl-item__dot" aria-hidden="true"></span>
      <div class="tl-item__when">
        <span class="tl-item__type">${escapeHTML(item.type)}</span>
        <span class="tl-item__date">${escapeHTML(item.date)}</span>
        <span class="tl-item__duration">${escapeHTML(item.duration)}</span>
      </div>
      <div class="tl-item__body">
        <h3 class="tl-item__role">${escapeHTML(item.role)}</h3>
        <p class="tl-item__org">${escapeHTML(item.org)}</p>
        <p class="tl-item__desc">${escapeHTML(item.desc)}</p>
        <ul class="tl-item__list">${item.list.map((l) => `<li>${escapeHTML(l)}</li>`).join('')}</ul>
        ${
          item.sub
            ? `<div class="tl-item__sub">${item.sub
                .map((s) => `<div class="tl-sub"><b>${escapeHTML(s.org)}</b><span>${escapeHTML(s.when)}</span><p>${escapeHTML(s.text)}</p></div>`)
                .join('')}</div>`
            : ''
        }
      </div>
    </article>`
    )
    .join('');
  host.insertAdjacentHTML('beforeend', html);
}

function initTimelineProgress() {
  const tl = $('#timeline');
  const bar = $('#timelineProgress');
  const items = $$('.tl-item', tl);
  if (!tl || !bar) return;
  const update = () => {
    const r = tl.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
    bar.style.transform = `scaleY(${p})`;
    items.forEach((it) => {
      const ir = it.getBoundingClientRect();
      it.classList.toggle('is-active', ir.top < vh * 0.65);
    });
  };
  if (lenis) lenis.on('scroll', update);
  else window.addEventListener('scroll', throttle(update, 32), { passive: true });
  window.addEventListener('resize', debounce(update, 150));
  update();
}

function renderSkills() {
  const host = $('#skillsGrid');
  if (!host) return;
  const C = 2 * Math.PI * 18;
  host.innerHTML = SKILL_DOMAINS.map(
    (s) => `
    <article class="skill card card--spot" style="--c:${s.color};--spot-color:${rgbString(s.color)};--off:${(C * (1 - s.score / 100)).toFixed(1)}">
      <div class="card__glow" aria-hidden="true"></div>
      <div class="skill__head">
        <div>
          <h3 class="skill__name">${escapeHTML(s.name)}</h3>
          <span class="skill__score">${s.score} / 100</span>
        </div>
        <div class="skill__ring" aria-hidden="true">
          <svg viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="18"/><circle class="fg" cx="22" cy="22" r="18"/></svg>
          <span>${s.score}</span>
        </div>
      </div>
      <div class="skill__items">${s.items.map((i) => `<span>${escapeHTML(i)}</span>`).join('')}</div>
    </article>`
  ).join('');
  $$('.skill', host).forEach((el) => once(el, () => el.classList.add('is-in')));
}

/* ==========================================================================
   16. HOMELAB — SCHÉMA SVG INTERACTIF
   ========================================================================== */
const ICONS = {
  cloud: 'M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.4 4.3 4.3 0 0 0 7 18z',
  firewall: 'M3 5h18v14H3z M3 9.7h18 M3 14.3h18 M9 5v4.7 M15 5v4.7 M6 9.7v4.6 M12 9.7v4.6 M18 9.7v4.6 M9 14.3V19 M15 14.3V19',
  switch: 'M2 8h20v8H2z M6 12h.01 M9.5 12h.01 M13 12h.01 M16.5 12h.01 M20 12h-.5',
  server: 'M4 3h16v7H4z M4 14h16v7H4z M8 6.5h.01 M8 17.5h.01 M12 6.5h5 M12 17.5h5',
  hypervisor: 'M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10',
  db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  shield: 'M12 3 4 6v6c0 5 3.4 8.4 8 9.5 4.6-1.1 8-4.5 8-9.5V6z M9 12l2 2 4-4',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  pc: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  iot: 'M7 7h10v10H7z M10 10h4v4h-4z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
  ap: 'M5 12.5a10 10 0 0 1 14 0 M8.5 16a5 5 0 0 1 7 0 M2 9a15 15 0 0 1 20 0 M12 19.5h.01',
  backup: 'M3 4h18v4H3z M5 8v12h14V8 M10 12h4',
  terminal: 'M4 4h16v16H4z M8 9l3 3-3 3 M13 15h3',
  oob: 'M12 2v6 M5 8h14v4a7 7 0 0 1-14 0z M12 19v3',
  web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  mail: 'M3 5h18v14H3z M3 7l9 6 9-6',
  key: 'M14.5 3.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M10.3 13.7 3 21 M6 18l2 2 M8.5 15.5l2 2',
  chart: 'M3 3v18h18 M7 15l4-5 4 3 5-7',
  inventory: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
  deploy: 'M12 3v12 M7 10l5 5 5-5 M4 21h16',
  cert: 'M5 3h14v13H5z M8 7h8 M8 10h6 M10 16l-1.5 5 3.5-2 3.5 2-1.5-5'
};

function iconSVG(type, size = 24) {
  const d = ICONS[type] || ICONS.server;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${d}"/></svg>`;
}

const IP_SHORT = { phones: '.100 → .199', oob: '.101 → .103', pxe1: 'DHCP .1xx', pxe2: 'DHCP .1xx', internet: '203.0.113.10', fw1: '.252 / VLAN', fw2: '.253 / VLAN' };

const Homelab = {
  selected: null,
  vlanFilter: null,
  activeFlows: new Set(['https']),
  view: { zoom: 1, px: 0, py: 0 },

  init() {
    this.scene = $('#labScene');
    this.viewport = $('#labViewport');
    if (!this.scene) return;
    this.buildSVG();
    this.renderToolbar();
    this.renderFlows();
    this.renderKpis();
    this.bindViewport();
    this.updateFlows();
  },

  /* --- Routage des chemins (pour flux et surbrillance) --- */
  chainToCore(id) {
    const n = NODE_BY_ID[id];
    if (!n) return [[CORE.x, CORE.y]];
    if (id === 'core') return [[CORE.x, CORE.y]];
    if (id === 'fw1') return [[560, 172], [560, 236], [690, 236], [690, 278], [CORE.x, CORE.y]];
    if (id === 'fw2') return [[840, 172], [840, 236], [710, 236], [710, 278], [CORE.x, CORE.y]];
    if (id === 'internet') return [[700, 52], [700, 108], [560, 108], ...this.chainToCore('fw1')];
    const v = VLAN_BY_ID[n.vlan];
    return [[n.x, n.y], [v.cx, n.y], [v.cx, ZONE_Y], [v.cx, BUS_Y], [CORE.x, BUS_Y], [CORE.x, CORE.y]];
  },

  route(aId, bId) {
    const a = NODE_BY_ID[aId];
    const b = NODE_BY_ID[bId];
    if (!a || !b) return [];
    if (typeof a.vlan === 'number' && a.vlan === b.vlan) {
      const v = VLAN_BY_ID[a.vlan];
      return [[a.x, a.y], [v.cx, a.y], [v.cx, b.y], [b.x, b.y]];
    }
    const edge = ['internet', 'fw1', 'fw2'];
    const up = this.chainToCore(aId);
    const down = this.chainToCore(bId).slice().reverse();
    let pts = up;
    if (!edge.includes(aId) && !edge.includes(bId)) {
      const fw = this.chainToCore('fw1');
      pts = pts.concat(fw.slice().reverse(), fw);
    }
    if (aId === 'internet' && (bId === 'fw1' || bId === 'fw2')) return [[700, 52], [700, 108], [bId === 'fw1' ? 560 : 840, 108], [bId === 'fw1' ? 560 : 840, 172]];
    pts = pts.concat(down);
    return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  },

  pathD(pts) {
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  },

  pathLength(pts) {
    let l = 0;
    for (let i = 1; i < pts.length; i += 1) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return l;
  },

  /* --- Construction du SVG --- */
  buildSVG() {
    const svg = svgEl('svg', { viewBox: '0 0 1400 890', class: 'topo', role: 'img', 'aria-label': "Schéma de l'architecture réseau du homelab" });
    svg.innerHTML = `
      <defs>
        <linearGradient id="gradTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8b7bff"/><stop offset=".25" stop-color="#22d3ee"/><stop offset=".5" stop-color="#f472b6"/><stop offset=".75" stop-color="#fbbf24"/><stop offset="1" stop-color="#34d399"/>
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.05)" stroke-width="2"/>
        </pattern>
      </defs>`;

    const gZones = svgEl('g', { class: 'layer-zones' });
    const gLinks = svgEl('g', { class: 'layer-links' });
    const gFlows = svgEl('g', { class: 'layer-flows' });
    const gNodes = svgEl('g', { class: 'layer-nodes' });
    const gHl = svgEl('g', { class: 'layer-hl' });
    svg.append(gZones, gLinks, gHl, gFlows, gNodes);
    this.svg = svg;
    this.gFlows = gFlows;
    this.gHl = gHl;

    /* Zones VLAN */
    VLANS.forEach((v) => {
      const g = svgEl('g', { class: 'zone', 'data-vlan': v.id, style: `--c:${v.color}` });
      g.appendChild(svgEl('rect', { class: 'zone__rect', x: v.x, y: ZONE_Y, width: ZONE_W, height: ZONE_H, rx: 16 }));
      g.appendChild(svgEl('rect', { class: 'rack-shadow', x: v.x + 6, y: ZONE_Y + 6, width: ZONE_W, height: ZONE_H, rx: 16, fill: 'url(#hatch)' }));
      g.appendChild(svgEl('rect', { class: 'zone__head', x: v.x + 8, y: ZONE_Y + 10, width: ZONE_W / 2 - 22, height: 44, rx: 9 }));
      g.appendChild(svgEl('rect', { class: 'zone__head', x: v.cx + 14, y: ZONE_Y + 10, width: ZONE_W / 2 - 22, height: 44, rx: 9 }));
      g.appendChild(svgEl('text', { class: 'zone__vid', x: v.x + 20, y: ZONE_Y + 29, text: `VLAN ${v.id}` }));
      g.appendChild(svgEl('text', { class: 'zone__title', x: v.x + 20, y: ZONE_Y + 46, text: v.short }));
      g.appendChild(svgEl('text', { class: 'zone__net', x: v.cx + 26, y: ZONE_Y + 29, text: v.net }));
      g.appendChild(svgEl('text', { class: 'zone__net', x: v.cx + 26, y: ZONE_Y + 46, text: `gw ${v.gw.split('.').pop() === '1' ? '.1 (CARP)' : v.gw}` }));
      g.appendChild(svgEl('text', { class: 'zone__net', x: v.x + 16, y: ZONE_Y + ZONE_H - 14, text: v.name.length > 34 ? v.name.slice(0, 33) + '…' : v.name }));
      g.addEventListener('click', (e) => {
        if (e.target.closest('.node')) return;
        this.setVlanFilter(this.vlanFilter === v.id ? null : v.id);
      });
      gZones.appendChild(g);
    });

    /* Liens */
    const link = (d, cls, extra = {}) => gLinks.appendChild(svgEl('path', { d, class: `link ${cls}`, ...extra }));
    link('M700,82 V108 H560 V144', 'link--wan', { 'data-vlan': 'wan' });
    link('M700,82 V108 H840 V144', 'link--wan', { 'data-vlan': 'wan' });
    link('M635,172 H765', 'link--sync', { 'data-vlan': 'core' });
    link('M560,200 V236 H690 V278', 'link--lacp', { 'data-vlan': 'core' });
    link('M840,200 V236 H710 V278', 'link--lacp', { 'data-vlan': 'core' });
    link(`M${CORE.x},322 V${BUS_Y}`, 'link--trunk', { 'data-vlan': 'core' });
    link(`M${VLANS[0].cx},${BUS_Y} H${VLANS[VLANS.length - 1].cx}`, 'link--trunk', { 'data-vlan': 'core' });

    VLANS.forEach((v) => {
      const members = NODES.filter((n) => n.vlan === v.id);
      const lastY = Math.max(...members.map((n) => n.y));
      link(`M${v.cx},${BUS_Y} V${lastY}`, 'link--vlan', { style: `--c:${v.color}`, 'data-vlan': v.id });
      members.forEach((n) => {
        const edgeX = n.col === 0 ? n.x + 58 : n.x - 58;
        link(`M${v.cx},${n.y} H${edgeX}`, 'link--vlan', { style: `--c:${v.color}`, 'data-vlan': v.id });
      });
    });

    const label = (x, y, t, anchor = 'start') => gLinks.appendChild(svgEl('text', { class: 'link__label', x, y, 'text-anchor': anchor, text: t }));
    label(612, 229, 'LAGG0 · LACP');
    label(788, 229, 'LAGG0 · LACP', 'end');
    label(700, 206, 'pfsync + XMLRPC', 'middle');
    label(712, 341, 'Trunk 802.1Q · VLAN 10,20,30,40,50 · natif 999');
    label(712, 100, 'WAN · NAT · VPN');

    /* Badge CARP */
    const carp = svgEl('g', { transform: 'translate(700,172)' });
    carp.appendChild(svgEl('rect', { class: 'carp', x: -46, y: -13, width: 92, height: 26, rx: 13 }));
    carp.appendChild(svgEl('text', { class: 'carp__text', x: 0, y: 4, 'text-anchor': 'middle', text: 'CARP VIP .1' }));
    gLinks.appendChild(carp);

    /* Bouclier de filtrage inter-VLAN */
    const shield = svgEl('g', { transform: 'translate(560,262)' });
    shield.appendChild(svgEl('rect', { class: 'fw-shield', x: -62, y: -11, width: 124, height: 22, rx: 11 }));
    shield.appendChild(svgEl('text', { class: 'fw-text', x: 0, y: 4, 'text-anchor': 'middle', text: 'Filtrage inter-VLAN' }));
    gLinks.appendChild(shield);

    /* Nœuds */
    NODES.forEach((n) => gNodes.appendChild(this.buildNode(n)));

    this.scene.innerHTML = '';
    this.scene.appendChild(svg);
  },

  buildNode(n) {
    const color = nodeColor(n);
    const big = n.big || n.vlan === 'wan';
    const w = n.id === 'core' ? 196 : big ? 152 : 116;
    const h = big ? 58 : 52;
    const g = svgEl('g', {
      class: `node${big ? ' node--big' : ''}`,
      'data-id': n.id,
      'data-vlan': n.vlan,
      transform: `translate(${n.x},${n.y})`,
      tabindex: '0',
      role: 'button',
      'aria-label': `${n.name}, ${n.role}, ${n.ip}`,
      style: `--c:${color}`
    });
    const body = svgEl('g', { class: 'node__body' });
    body.appendChild(svgEl('rect', { class: 'node__halo', x: -w / 2 - 5, y: -h / 2 - 5, width: w + 10, height: h + 10, rx: 14 }));
    if (n.type === 'cloud') {
      body.appendChild(svgEl('path', { class: 'cloud', d: 'M-58,22 h116 a26,26 0 0 0 4,-51 a36,36 0 0 0 -68,-12 a26,26 0 0 0 -52,10 a24,24 0 0 0 0,53z' }));
    } else {
      body.appendChild(svgEl('rect', { class: 'node__bg', x: -w / 2, y: -h / 2, width: w, height: h, rx: 11 }));
    }
    const icon = svgEl('g', { class: 'node__icon', transform: `translate(${-w / 2 + 9},${-12})` });
    icon.innerHTML = `<path d="${ICONS[n.type] || ICONS.server}"/>`;
    if (n.type !== 'cloud') body.appendChild(icon);

    const tx = n.type === 'cloud' ? 0 : -w / 2 + 40;
    const anchor = n.type === 'cloud' ? 'middle' : 'start';
    const avail = w - 48;
    const nameSize = big ? 13 : 10.8;
    const name = svgEl('text', { class: 'node__name', x: tx, y: n.type === 'cloud' ? -2 : -3, 'text-anchor': anchor, text: n.name });
    if (n.type !== 'cloud' && n.name.length * nameSize * 0.62 > avail) {
      name.setAttribute('textLength', String(avail));
      name.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    body.appendChild(name);
    const ipText = IP_SHORT[n.id] || n.ip;
    const ip = svgEl('text', { class: 'node__ip', x: tx, y: n.type === 'cloud' ? 13 : 13, 'text-anchor': anchor, text: ipText });
    if (n.type !== 'cloud' && ipText.length * 10 * 0.6 > avail) {
      ip.setAttribute('textLength', String(avail));
      ip.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
    body.appendChild(ip);
    if (n.type !== 'cloud') {
      body.appendChild(svgEl('circle', { class: `node__status${n.status === 'warn' ? ' node__status--warn' : ''}`, cx: w / 2 - 9, cy: -h / 2 + 9, r: 3 }));
    }
    g.appendChild(body);

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.select(n.id);
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.select(n.id);
      }
    });
    return g;
  },

  /* --- Barre d'outils --- */
  renderToolbar() {
    const host = $('#labVlanFilters');
    if (!host) return;
    host.innerHTML =
      `<button type="button" class="vlan-btn is-active" data-vlan="" style="--c:#e2e8f0"><i></i>Toutes les zones</button>` +
      VLANS.map((v) => `<button type="button" class="vlan-btn" data-vlan="${v.id}" style="--c:${v.color}"><i></i>VLAN ${v.id}<small>${v.short}</small></button>`).join('');
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.vlan-btn');
      if (!b) return;
      this.setVlanFilter(b.dataset.vlan ? Number(b.dataset.vlan) : null);
    });

    $$('.segmented__btn[data-view]').forEach((btn) =>
      btn.addEventListener('click', () => {
        $$('.segmented__btn[data-view]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-checked', String(b === btn));
        });
        this.scene.classList.toggle('is-iso', btn.dataset.view === 'iso');
      })
    );
    $('#labZoomIn')?.addEventListener('click', () => this.setZoom(this.view.zoom * 1.2));
    $('#labZoomOut')?.addEventListener('click', () => this.setZoom(this.view.zoom / 1.2));
    $('#labReset')?.addEventListener('click', () => {
      this.view = { zoom: 1, px: 0, py: 0 };
      this.applyView();
      this.setVlanFilter(null);
      this.deselect();
    });
    $('#labFullscreen')?.addEventListener('click', () => {
      const vp = $('.lab__body');
      if (document.fullscreenElement) document.exitFullscreen?.();
      else vp.requestFullscreen?.().catch(() => toast('Plein écran indisponible', 'info'));
    });
  },

  setVlanFilter(id) {
    this.vlanFilter = id;
    $$('#labVlanFilters .vlan-btn').forEach((b) => b.classList.toggle('is-active', String(id ?? '') === b.dataset.vlan));
    $$('.zone', this.svg).forEach((z) => {
      const match = id === null || Number(z.dataset.vlan) === id;
      z.classList.toggle('is-dim', !match);
      z.classList.toggle('is-active', id !== null && match);
    });
    $$('.node', this.svg).forEach((nEl) => {
      const v = nEl.dataset.vlan;
      const isZone = !Number.isNaN(Number(v));
      nEl.classList.toggle('is-dim', id !== null && isZone && Number(v) !== id);
    });
    $$('.link', this.svg).forEach((l) => {
      const v = l.dataset.vlan;
      const isZone = v && !Number.isNaN(Number(v));
      l.classList.toggle('is-dim', id !== null && isZone && Number(v) !== id);
    });
    $$('#ipamTable tbody tr').forEach((tr) => {
      tr.style.background = id !== null && Number(tr.dataset.vlan) === id ? 'rgba(255,255,255,.04)' : '';
    });
  },

  /* --- Flux animés --- */
  renderFlows() {
    const host = $('#labFlows');
    if (!host) return;
    host.innerHTML =
      `<span class="lab__flows-label">Flux</span>` +
      FLOWS.map(
        (f) =>
          `<button type="button" class="flow-btn${this.activeFlows.has(f.id) ? ' is-active' : ''}" data-flow="${f.id}" style="--c:${f.color}" title="${escapeAttr(f.desc)}" aria-pressed="${this.activeFlows.has(f.id)}">${escapeHTML(f.name)}<small>${escapeHTML(f.port)}</small></button>`
      ).join('') +
      `<button type="button" class="flow-btn" data-flow="__all" style="--c:#e2e8f0">Tous</button>` +
      `<button type="button" class="flow-btn" data-flow="__none" style="--c:#6d7486">Aucun</button>`;
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.flow-btn');
      if (!b) return;
      const id = b.dataset.flow;
      if (id === '__all') FLOWS.forEach((f) => this.activeFlows.add(f.id));
      else if (id === '__none') this.activeFlows.clear();
      else if (this.activeFlows.has(id)) this.activeFlows.delete(id);
      else this.activeFlows.add(id);
      $$('.flow-btn[data-flow]', host).forEach((btn) => {
        const on = this.activeFlows.has(btn.dataset.flow);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
      this.updateFlows();
    });
  },

  updateFlows() {
    if (!this.gFlows) return;
    this.gFlows.innerHTML = '';
    FLOWS.forEach((f) => {
      if (!this.activeFlows.has(f.id)) return;
      f.legs.forEach(([a, b], li) => {
        const pts = this.route(a, b);
        if (pts.length < 2) return;
        const id = `flow-${f.id}-${li}`;
        const d = this.pathD(pts);
        const len = this.pathLength(pts);
        const path = svgEl('path', { id, d, class: 'flow is-on', style: `--c:${f.color}` });
        this.gFlows.appendChild(path);
        if (prefersReducedMotion) return;
        const dur = Math.max(1.6, len / 230);
        for (let k = 0; k < 3; k += 1) {
          const c = svgEl('circle', { class: 'packet', r: k === 0 ? 4.5 : 3, style: `--c:${f.color}`, opacity: k === 0 ? 1 : 0.6 });
          const anim = svgEl('animateMotion', { dur: `${dur.toFixed(2)}s`, repeatCount: 'indefinite', begin: `${((dur / 3) * k).toFixed(2)}s`, rotate: 'auto' });
          const mpath = svgEl('mpath');
          mpath.setAttribute('href', `#${id}`);
          mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${id}`);
          anim.appendChild(mpath);
          c.appendChild(anim);
          this.gFlows.appendChild(c);
        }
      });
    });
  },

  /* --- Sélection d'un équipement --- */
  select(id) {
    const n = NODE_BY_ID[id];
    if (!n || !this.svg) return;
    this.selected = id;
    $$('.node', this.svg).forEach((el) => el.classList.toggle('is-selected', el.dataset.id === id));
    this.gHl.innerHTML = '';
    if (id !== 'core') {
      const pts = id === 'internet' ? this.route('internet', 'core') : this.chainToCore(id);
      this.gHl.appendChild(svgEl('path', { d: this.pathD(pts), class: 'link is-hl', style: `--c:${nodeColor(n)}` }));
    }
    this.renderDetail(n);
  },

  deselect() {
    this.selected = null;
    $$('.node', this.svg).forEach((el) => el.classList.remove('is-selected'));
    if (this.gHl) this.gHl.innerHTML = '';
    $('#labPanelDetail').hidden = true;
    $('#labPanelEmpty').hidden = false;
    $('#labPanel').classList.remove('is-open');
    $('.lab__body')?.classList.remove('has-selection');
  },

  renderDetail(n) {
    const empty = $('#labPanelEmpty');
    const detail = $('#labPanelDetail');
    const color = nodeColor(n);
    const vlan = typeof n.vlan === 'number' ? VLAN_BY_ID[n.vlan] : null;
    const project = n.project ? PROJECT_BY_ID[n.project] : null;
    const procs = Store.procedures.filter((p) => p.techKeys.some((k) => (n.techs || []).includes(k)) || (project && p.project === project.id)).slice(0, 5);
    const flows = FLOWS.filter((f) => f.legs.some((l) => l.includes(n.id)));
    detail.innerHTML = `
      <div class="nd" style="--c:${color}">
        <button type="button" class="nd__close" data-close-node>← Retour à la vue d'ensemble</button>
        <div class="nd__head">
          <span class="nd__icon">${iconSVG(n.type)}</span>
          <div>
            <h3 class="nd__title">${escapeHTML(n.name)}</h3>
            <p class="nd__role">${escapeHTML(n.role)}</p>
          </div>
        </div>
        <div class="nd__ip"><span>${escapeHTML(n.ip)}</span><button type="button" data-copy="${escapeAttr(n.ip)}">Copier</button></div>
        <dl class="nd__kv">
          <dt>Zone</dt><dd>${vlan ? `VLAN ${vlan.id} · ${vlan.short}` : n.vlan === 'wan' ? 'WAN' : 'Cœur'}</dd>
          ${vlan ? `<dt>Réseau</dt><dd>${vlan.net}</dd><dt>Passerelle</dt><dd>${vlan.gw} (VIP)</dd>` : ''}
          <dt>Système</dt><dd>${escapeHTML(n.os)}</dd>
          <dt>État</dt><dd style="color:${n.status === 'warn' ? 'var(--warn)' : 'var(--ok)'}">${n.status === 'warn' ? 'Avertissement' : 'Opérationnel'}</dd>
        </dl>
        <p class="nd__desc">${escapeHTML(n.desc)}</p>
        ${
          n.services && n.services.length
            ? `<div><p class="nd__section-title">Services &amp; ports</p><ul class="nd__ports">${n.services
                .map((s) => `<li><code>${escapeHTML(s.p)}</code><span>${escapeHTML(s.n)}</span></li>`)
                .join('')}</ul></div>`
            : ''
        }
        ${
          flows.length
            ? `<div><p class="nd__section-title">Flux impliqués</p><div class="nd__links">${flows
                .map((f) => `<button type="button" data-show-flow="${f.id}"><span>${escapeHTML(f.name)}</span><small>${escapeHTML(f.port)}</small></button>`)
                .join('')}</div></div>`
            : ''
        }
        ${
          project
            ? `<div><p class="nd__section-title">Projet associé</p><div class="nd__links"><button type="button" data-open-project="${project.id}"><span>${escapeHTML(project.title)}</span><small>${project.num}</small></button></div></div>`
            : ''
        }
        ${
          procs.length
            ? `<div><p class="nd__section-title">Procédures du wiki</p><div class="nd__links">${procs
                .map((p) => `<button type="button" data-open-proc="${p.id}"><span>${escapeHTML(p.title)}</span><small>${p.minutes} min</small></button>`)
                .join('')}</div></div>`
            : ''
        }
      </div>`;
    empty.hidden = true;
    detail.hidden = false;
    $('#labPanel').scrollTop = 0;
    $('#labPanel').classList.add('is-open');
    $('.lab__body')?.classList.add('has-selection');
  },

  renderKpis() {
    const host = $('#labMinimap');
    if (host) host.innerHTML = LAB_KPIS.map((k) => `<span><b>${escapeHTML(k.v)}</b>${escapeHTML(k.l)}</span>`).join('');
    const panel = $('#labPanel');
    panel?.addEventListener('click', async (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-close-node')) this.deselect();
      else if (t.dataset.copy) {
        if (await copyText(t.dataset.copy)) toast(`${t.dataset.copy} copié`);
      } else if (t.dataset.showFlow) {
        this.activeFlows.add(t.dataset.showFlow);
        $$('#labFlows .flow-btn').forEach((b) => b.classList.toggle('is-active', this.activeFlows.has(b.dataset.flow)));
        this.updateFlows();
      } else if (t.dataset.openProject) Projects.open(t.dataset.openProject);
      else if (t.dataset.openProc) Wiki.open(t.dataset.openProc);
    });
  },

  /* --- Pan / zoom --- */
  setZoom(z) {
    this.view.zoom = clamp(z, 0.6, 3);
    this.applyView();
  },

  applyView() {
    const s = this.scene.style;
    s.setProperty('--zoom', this.view.zoom.toFixed(3));
    s.setProperty('--px', `${this.view.px}px`);
    s.setProperty('--py', `${this.view.py}px`);
  },

  bindViewport() {
    const vp = this.viewport;
    if (!vp) return;
    let drag = null;
    const pointers = new Map();
    let pinchStart = null;

    vp.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.node')) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.view.zoom };
        drag = null;
        return;
      }
      drag = { x: e.clientX, y: e.clientY, px: this.view.px, py: this.view.py, moved: 0 };
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinchStart && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        this.scene.classList.add('no-anim');
        this.setZoom(pinchStart.zoom * (dist / pinchStart.dist));
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.moved = Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 3) {
        vp.classList.add('is-panning');
        this.scene.classList.add('no-anim');
        this.view.px = drag.px + dx;
        this.view.py = drag.py + dy;
        this.applyView();
      }
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (drag && drag.moved <= 3 && !e.target.closest('.node') && !e.target.closest('.zone') && this.selected) {
        this.deselect();
      }
      drag = null;
      vp.classList.remove('is-panning');
      this.scene.classList.remove('no-anim');
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    vp.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        this.setZoom(this.view.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      },
      { passive: false }
    );
  }
};

/* ==========================================================================
   17. HOMELAB — ONGLETS : IPAM, MATRICE, RÈGLES, MATÉRIEL
   ========================================================================== */
function renderLabTabs() {
  const ipam = $('#tabIpam');
  if (ipam) {
    ipam.innerHTML = `
      <div class="table-wrap">
        <table class="tbl" id="ipamTable">
          <thead><tr><th>VLAN</th><th>Zone</th><th>Réseau</th><th>Masque</th><th>Passerelle</th><th>DHCP</th><th>Réservations</th></tr></thead>
          <tbody>
            <tr data-vlan="wan">
              <td><span class="vlan-tag" style="--c:#f87171">WAN</span></td>
              <td>Accès Internet</td><td class="mono">203.0.113.8/29</td><td class="mono">255.255.255.248</td><td class="mono">203.0.113.9</td><td class="muted">—</td>
              <td><div class="host-list"><span>.10 VIP WAN</span><span>.11 PFSENSE-01</span><span>.12 PFSENSE-02</span></div></td>
            </tr>
            ${VLANS.map(
              (v) => `
            <tr data-vlan="${v.id}">
              <td><span class="vlan-tag" style="--c:${v.color}">${v.id} · ${v.short}</span></td>
              <td><b>${escapeHTML(v.name)}</b><br><span class="muted">${escapeHTML(v.desc)}</span></td>
              <td class="mono">${v.net}</td>
              <td class="mono">${v.mask}</td>
              <td class="mono">${v.gw}</td>
              <td>${escapeHTML(v.dhcp)}</td>
              <td><div class="host-list">${v.reserved.map((r) => `<span>${escapeHTML(r)}</span>`).join('')}</div></td>
            </tr>`
            ).join('')}
            <tr data-vlan="999">
              <td><span class="vlan-tag" style="--c:#6d7486">999 · NATIF</span></td>
              <td>VLAN natif des trunks</td><td class="muted">—</td><td class="muted">—</td><td class="muted">Non routé</td><td class="muted">—</td>
              <td><span class="muted">Aucun port d'accès, absent de pfSense</span></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  const fw = $('#tabFw');
  if (fw) {
    const cols = FW_ZONES.length;
    const cellLabel = { allow: 'AUTORISÉ', limit: 'LIMITÉ', deny: 'REFUSÉ', self: 'INTRA-ZONE' };
    let grid = `<div class="fw-matrix__corner">SOURCE ↓<br>DEST. →</div>`;
    grid += FW_ZONES.map((z) => `<div class="fw-matrix__head" style="--c:${z.color}">${escapeHTML(z.name)}<small>${escapeHTML(z.sub || 'Internet')}</small></div>`).join('');
    FW_ZONES.forEach((src) => {
      grid += `<div class="fw-matrix__head" style="--c:${src.color}">${escapeHTML(src.name)}<small>${escapeHTML(src.sub || 'Internet')}</small></div>`;
      FW_ZONES.forEach((dst) => {
        const [a, txt] = FW_MATRIX[src.key][dst.key];
        grid += `<div class="fw-matrix__cell fw-${a}" title="${escapeAttr(`${src.name} → ${dst.name} : ${cellLabel[a]}${txt ? ' · ' + txt : ''}`)}"><b>${cellLabel[a]}</b>${txt && a !== 'self' ? `<span>${escapeHTML(txt)}</span>` : ''}</div>`;
      });
    });
    fw.innerHTML = `
      <div class="table-wrap" style="padding:12px;border:none">
        <div class="fw-matrix" style="grid-template-columns:120px repeat(${cols}, minmax(100px, 1fr))">${grid}</div>
      </div>
      <div class="fw-legend">
        <span><i style="background:rgba(52,211,153,.35)"></i>Autorisé (zone d'administration)</span>
        <span><i style="background:rgba(251,191,36,.35)"></i>Limité à des ports / hôtes précis</span>
        <span><i style="background:rgba(248,113,113,.3)"></i>Refusé par défaut (journalisé)</span>
        <span>Politique : <b>deny all</b> puis ouvertures explicites, état suivi (stateful).</span>
      </div>`;
  }

  const rules = $('#tabRules');
  if (rules) {
    const ifaces = Object.keys(PF_RULES);
    const renderRules = (iface) => {
      const rows = PF_RULES[iface]
        .map(([act, proto, src, dst, port, desc], i) => {
          const sym = act === 'pass' ? '✓' : act === 'reject' ? '↩' : '✕';
          return `<tr><td class="muted mono">${i + 1}</td><td><span class="rule-action rule-action--${act}" title="${act}">${sym}</span></td><td class="mono">${escapeHTML(proto)}</td><td class="mono">${escapeHTML(src)}</td><td class="mono">${escapeHTML(dst)}</td><td class="mono">${escapeHTML(port)}</td><td>${escapeHTML(desc)}</td></tr>`;
        })
        .join('');
      $('#rulesBody').innerHTML = rows;
    };
    rules.innerHTML = `
      <div class="rules-iface" id="rulesIfaces">${ifaces
        .map((f, i) => `<button type="button" class="filter-chip${i === 0 ? ' is-active' : ''}" data-iface="${f}">${f}<small>${PF_RULES[f].length}</small></button>`)
        .join('')}</div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>#</th><th>Action</th><th>Proto</th><th>Source</th><th>Destination</th><th>Port</th><th>Description</th></tr></thead>
          <tbody id="rulesBody"></tbody>
        </table>
      </div>`;
    renderRules(ifaces[0]);
    $('#rulesIfaces').addEventListener('click', (e) => {
      const b = e.target.closest('[data-iface]');
      if (!b) return;
      $$('#rulesIfaces .filter-chip').forEach((x) => x.classList.toggle('is-active', x === b));
      renderRules(b.dataset.iface);
    });
  }

  const hw = $('#tabHw');
  if (hw) {
    hw.innerHTML = `<div class="hw-grid">${HARDWARE.map(
      (h) => `
      <div class="hw" style="--c:${h.color}">
        <div class="hw__head"><b>${escapeHTML(h.name)}</b><span>${escapeHTML(h.ip)}</span></div>
        <p class="hw__model">${escapeHTML(h.model)}</p>
        ${h.bars
          .map(
            ([l, cap, v]) => `<div class="hw__bar"><div class="hw__bar-head"><span>${escapeHTML(l)} <code>${escapeHTML(cap)}</code></span><span>${v} %</span></div><div class="hw__track"><span style="--v:${v}%"></span></div></div>`
          )
          .join('')}
      </div>`
    ).join('')}</div>`;
  }

  /* Comportement des onglets */
  const tabs = $$('.tabs__btn');
  const indicator = $('.tabs__indicator');
  const moveInd = (btn) => {
    if (!indicator || !btn) return;
    indicator.style.width = `${btn.offsetWidth}px`;
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  const activate = (btn) => {
    tabs.forEach((t) => {
      const on = t === btn;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = $(`#${t.dataset.tab}`);
      if (panel) {
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      }
    });
    moveInd(btn);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      }
    });
  });
  requestAnimationFrame(() => moveInd($('.tabs__btn.is-active')));
  window.addEventListener('resize', debounce(() => moveInd($('.tabs__btn.is-active')), 150));
}

/* ==========================================================================
   18. MODALES (gestion générique) & PROJETS
   ========================================================================== */
const Modal = {
  stack: [],

  open(el) {
    if (!el || this.stack.includes(el)) return;
    el.hidden = false;
    this.stack.push(el);
    el._lastFocus = document.activeElement;
    lockScroll(true);
    requestAnimationFrame(() => {
      el.classList.add('is-open');
      const focusable = el.querySelector('[data-autofocus]') || el.querySelector('.modal__panel') || el.querySelector('button, [href], input');
      focusable?.focus({ preventScroll: true });
    });
    if (!el._bound) {
      el._bound = true;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) this.close(el);
      });
      el.addEventListener('keydown', (e) => this.trap(e, el));
    }
  },

  close(el) {
    const target = el || this.stack[this.stack.length - 1];
    if (!target) return;
    this.stack = this.stack.filter((m) => m !== target);
    target.classList.remove('is-open');
    lockScroll(false);
    setTimeout(() => {
      if (!target.classList.contains('is-open')) target.hidden = true;
    }, 380);
    target._lastFocus?.focus?.({ preventScroll: true });
    if (target.id === 'wikiModal' || target.id === 'projectModal') {
      if (/^#(wiki|projet)\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    }
    target.dispatchEvent(new CustomEvent('modal:close'));
  },

  top() {
    return this.stack[this.stack.length - 1];
  },

  trap(e, el) {
    if (e.key !== 'Tab') return;
    const items = $$('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el).filter((x) => x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

const VISUALS = {
  cluster: { nodes: [[200, 40, 'PVE-01', 1], [110, 112, 'PVE-02', 1], [290, 112, 'PVE-03', 1], [200, 88, 'Ceph ×3']], links: [[0, 1, 1], [1, 2, 1], [2, 0, 1], [0, 3], [1, 3], [2, 3]] },
  firewall: { nodes: [[200, 28, 'WAN'], [120, 92, 'pfSense-01', 1], [280, 92, 'pfSense-02', 1], [200, 92, 'VIP'], [200, 136, 'LAN']], links: [[0, 1], [0, 2], [1, 3, 1], [2, 3, 1], [3, 4]] },
  tree: { nodes: [[200, 26, 'lab.local', 1], [90, 80, 'T0'], [200, 80, 'T1'], [310, 80, 'T2'], [60, 130, 'DC'], [120, 130, 'PAW'], [200, 130, 'SRV'], [280, 130, 'PC'], [340, 130, 'USR']], links: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [3, 7], [3, 8]] },
  pipeline: { nodes: [[40, 80, 'PXE'], [120, 80, 'WDS'], [200, 80, 'MDT', 1], [280, 80, 'BCU'], [360, 80, 'AD']], links: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]] },
  proxy: { nodes: [[60, 80, 'Internet'], [170, 80, 'pfSense'], [270, 80, 'Nginx', 1], [350, 44, 'Vault'], [350, 116, 'Web']], links: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [2, 4]] },
  phone: { nodes: [[200, 80, '3CX', 1], [80, 40, 'SIP'], [320, 40, 'Poste'], [80, 124, 'Poste'], [320, 124, 'Poste'], [200, 22, 'QoS EF']], links: [[0, 1, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
  chart: { bars: true },
  shield: { nodes: [[200, 80, 'Wazuh', 1], [70, 36, 'DC01'], [70, 124, 'pfSense'], [330, 36, 'Linux'], [330, 124, 'Nginx'], [200, 20, 'MITRE']], links: [[1, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], [0, 5]] },
  inventory: { grid: true },
  db: { nodes: [[200, 30, 'VIP HAProxy', 1], [110, 112, 'Galera-1'], [200, 112, 'Galera-2'], [290, 112, 'Galera-3']], links: [[0, 1], [0, 2], [0, 3], [1, 2, 1], [2, 3, 1]] },
  automation: { nodes: [[70, 80, 'Ansible', 1], [240, 30, 'srv-01'], [240, 80, 'srv-02'], [240, 130, 'srv-03'], [340, 80, 'OK']], links: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4], [2, 4], [3, 4]] },
  switch: { ports: true },
  backup: { nodes: [[70, 80, 'PVE ×3'], [200, 80, 'PBS', 1], [330, 40, 'Offsite'], [330, 120, 'Vérif.']], links: [[0, 1, 1], [1, 2, 1], [1, 3]] },
  rmm: { nodes: [[200, 80, 'RMM', 1], [70, 40, 'PC'], [70, 120, 'PC'], [330, 40, 'SRV'], [330, 120, 'PS1'], [200, 20, 'Alertes']], links: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4], [0, 5]] },
  pki: { nodes: [[80, 80, 'Root CA'], [200, 80, 'Sub CA', 1], [320, 40, 'Machines'], [320, 120, 'NPS'], [200, 136, '802.1X']], links: [[0, 1, 1], [1, 2, 1], [1, 3], [3, 4, 1]] }
};

function projectVisual(p, big = false) {
  const conf = VISUALS[p.visual] || VISUALS.cluster;
  const W = 400;
  const H = 160;
  let inner = '';
  if (conf.bars) {
    const vals = [32, 48, 41, 62, 55, 70, 58, 76, 64, 82, 71, 88, 79, 92];
    inner += vals.map((v, i) => `<rect x="${30 + i * 25}" y="${140 - v}" width="14" height="${v}" rx="3" class="pv-node${i === vals.length - 1 ? ' pv-node--main' : ''}"/>`).join('');
    inner += `<polyline class="pv-line pv-line--anim" points="${vals.map((v, i) => `${37 + i * 25},${132 - v}`).join(' ')}"/>`;
  } else if (conf.grid) {
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 12; x += 1) {
        const on = (x * 7 + y * 3) % 5 !== 0;
        inner += `<rect x="${44 + x * 27}" y="${30 + y * 27}" width="19" height="19" rx="4" class="pv-node${on && (x + y) % 6 === 0 ? ' pv-node--main' : ''}" opacity="${on ? 1 : 0.35}"/>`;
      }
    }
  } else if (conf.ports) {
    const cols = ['#8b7bff', '#22d3ee', '#f472b6', '#fbbf24', '#34d399'];
    inner += `<rect x="40" y="48" width="320" height="64" rx="10" class="pv-node pv-node--main"/>`;
    for (let i = 0; i < 12; i += 1) {
      for (let r = 0; r < 2; r += 1) {
        const c = cols[(i + r * 3) % 5];
        inner += `<rect x="${56 + i * 24}" y="${58 + r * 24}" width="16" height="16" rx="3" fill="${c}" opacity=".55"/>`;
      }
    }
    inner += `<text x="200" y="138" text-anchor="middle" class="pv-text">trunk 802.1Q · LACP · RPVST+</text>`;
  } else {
    conf.links.forEach(([a, b, anim]) => {
      const A = conf.nodes[a];
      const B = conf.nodes[b];
      inner += `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="pv-line${anim ? ' pv-line--anim' : ''}"/>`;
    });
    conf.nodes.forEach(([x, y, label, main]) => {
      const w = Math.max(44, label.length * 6.4 + 16);
      inner += `<g transform="translate(${x},${y})"><rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="7" class="pv-node${main ? ' pv-node--main' : ''}"/><text y="3.5" text-anchor="middle" class="pv-text">${escapeHTML(label)}</text></g>`;
    });
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"${big ? ' style="min-width:0;max-height:340px"' : ''}>${inner}</svg>`;
}

const Projects = {
  filter: 'Tous',
  current: null,

  init() {
    this.grid = $('#projectsGrid');
    if (!this.grid) return;
    this.renderFilters();
    this.renderGrid();
    $('#projectPrev')?.addEventListener('click', () => this.step(-1));
    $('#projectNext')?.addEventListener('click', () => this.step(1));
    $('#projectModal')?.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') this.step(1);
      if (e.key === 'ArrowLeft') this.step(-1);
    });
    $('#projectModalBody')?.addEventListener('click', (e) => handleContentClick(e));
  },

  visible() {
    return PROJECTS.filter((p) => this.filter === 'Tous' || p.cat === this.filter);
  },

  renderFilters() {
    const host = $('#projectFilters');
    const counts = PROJECTS.reduce((acc, p) => ((acc[p.cat] = (acc[p.cat] || 0) + 1), acc), {});
    const cats = ['Tous', ...Object.keys(PROJECT_CATEGORIES).filter((c) => counts[c])];
    host.innerHTML = cats
      .map((c) => `<button type="button" class="filter-chip${c === this.filter ? ' is-active' : ''}" data-cat="${escapeAttr(c)}">${escapeHTML(c)}<small>${c === 'Tous' ? PROJECTS.length : counts[c]}</small></button>`)
      .join('');
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      this.filter = b.dataset.cat;
      $$('.filter-chip', host).forEach((x) => x.classList.toggle('is-active', x === b));
      this.applyFilter();
    });
  },

  renderGrid() {
    this.grid.innerHTML = PROJECTS.map((p) => {
      const rgb = rgbString(p.color);
      const hasDetails = !!Store.details[p.id];
      return `
      <article class="project card card--spot${p.feature ? ' project--feature' : ''}" data-id="${p.id}" data-cat="${escapeAttr(p.cat)}" tabindex="0" role="button" aria-label="Ouvrir le dossier : ${escapeAttr(p.title)}" style="--c:${p.color};--c-rgb:${rgb}" data-tilt-max="3">
        <div class="card__glow" aria-hidden="true"></div>
        <div class="project__visual">
          <span class="project__num">P·${p.num}</span>
          <span class="project__status"><i></i>${escapeHTML(p.status)}</span>
          ${projectVisual(p)}
        </div>
        <div class="project__body">
          <p class="project__cat">${escapeHTML(p.cat)}${hasDetails ? ' · dossier complet' : ''}</p>
          <h3 class="project__title">${escapeHTML(p.title)}</h3>
          <p class="project__desc">${escapeHTML(p.short)}</p>
          <div class="project__metrics">${p.metrics
            .slice(0, p.feature ? 4 : 2)
            .map((m) => `<div class="project__metric"><b>${escapeHTML(m.v)}</b><span>${escapeHTML(m.l)}</span></div>`)
            .join('')}</div>
          <div class="project__foot">
            <div class="tags">${p.stack.slice(0, 3).map((k) => `<span>${escapeHTML(techInfo(k).name)}</span>`).join('')}</div>
            <span class="project__open" aria-hidden="true">→</span>
          </div>
        </div>
      </article>`;
    }).join('');
    $$('.project', this.grid).forEach((card) => {
      bindSpotlight(card);
      card.addEventListener('click', () => this.open(card.dataset.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open(card.dataset.id);
        }
      });
    });
    applyTilt($$('.project', this.grid), { max: 3 });
  },

  applyFilter() {
    const shown = [];
    $$('.project', this.grid).forEach((card) => {
      const on = this.filter === 'Tous' || card.dataset.cat === this.filter;
      card.classList.toggle('is-hidden', !on);
      if (on) shown.push(card);
    });
    revealNewItems(shown);
    lib.ScrollTrigger?.refresh();
  },

  step(dir) {
    const list = this.visible();
    const idx = list.findIndex((p) => p.id === this.current);
    if (idx === -1) return;
    const next = list[(idx + dir + list.length) % list.length];
    this.open(next.id, true);
  },

  open(id, keepOpen = false) {
    const p = PROJECT_BY_ID[id];
    if (!p) return;
    this.current = id;
    const d = Store.details[id] || {};
    const kpis = Array.isArray(d.kpis) && d.kpis.length ? d.kpis : p.metrics;
    const procs = Store.proceduresForProject(id);
    const relatedByTech = procs.length ? [] : Store.procedures.filter((x) => x.techKeys.some((k) => p.stack.includes(k))).slice(0, 4);
    resetCodeStore('project');
    const md = d.content ? renderMarkdown(d.content, 'project') : null;
    const arch = d.svg || projectVisual(p, true);
    const gallery = [...(p.image ? [{ src: p.image, caption: `Capture — ${p.title}` }] : []), ...(Array.isArray(d.gallery) ? d.gallery : [])];

    const body = $('#projectModalBody');
    body.style.setProperty('--c', p.color);
    body.innerHTML = `
      <header class="pd-hero">
        <div class="pd-hero__top">
          <span class="pd-hero__num">P·${p.num}</span>
          <span class="chip">${escapeHTML(p.cat)}</span>
          <span class="chip chip--live"><span class="pulse-dot pulse-dot--green"></span>${escapeHTML(p.status)}</span>
          ${d.duration ? `<span class="chip">${escapeHTML(d.duration)}</span>` : ''}
        </div>
        <h2 class="pd-hero__title" id="projectModalTitle">${escapeHTML(p.title)}</h2>
        <p class="pd-hero__sub">${escapeHTML(p.short)}</p>
        <div class="pd-kpis">${kpis.slice(0, 4).map((k) => `<div class="pd-kpi"><b>${escapeHTML(k.v)}</b><span>${escapeHTML(k.l)}</span></div>`).join('')}</div>
      </header>
      <div class="pd-layout">
        <div class="pd-main">
          <section class="pd-section">
            <h3 class="pd-section__title">Contexte &amp; besoin</h3>
            <div class="prose"><p>${escapeHTML(p.context)}</p></div>
          </section>
          <section class="pd-section">
            <h3 class="pd-section__title">Architecture</h3>
            <div class="pd-arch">${arch}</div>
          </section>
          <section class="pd-section">
            <h3 class="pd-section__title">Points techniques clés</h3>
            <ul class="pd-highlights">${p.highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join('')}</ul>
          </section>
          ${
            md
              ? `<section class="pd-section"><h3 class="pd-section__title">Dossier technique</h3><div class="prose">${md.html}</div></section>`
              : `<section class="pd-section"><div class="pd-pending"><span>◇</span><div>Le dossier technique détaillé (étapes de mise en œuvre, configurations, tests) sera chargé depuis <code>data-projets.js</code>.</div></div></section>`
          }
          ${
            gallery.length
              ? `<section class="pd-section"><h3 class="pd-section__title">Captures</h3><div class="pd-gallery">${gallery
                  .map((g) => `<figure><img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.caption || p.title)}" loading="lazy" onerror="this.closest('figure').remove()"><figcaption>${escapeHTML(g.caption || '')}</figcaption></figure>`)
                  .join('')}</div></section>`
              : ''
          }
        </div>
        <aside class="pd-side">
          <div class="pd-box">
            <p class="pd-box__title">Stack</p>
            <div class="tags">${p.stack.map((k) => {
              const t = techInfo(k);
              return `<span style="color:${t.color};border-color:${t.color}40">${escapeHTML(t.name)}</span>`;
            }).join('')}</div>
          </div>
          <div class="pd-box">
            <p class="pd-box__title">Zones réseau</p>
            <div class="tags">${(p.vlans || []).map((v) => `<span class="vlan-tag" style="--c:${VLAN_BY_ID[v].color}">VLAN ${v} · ${VLAN_BY_ID[v].short}</span>`).join('')}</div>
          </div>
          ${d.role ? `<div class="pd-box"><p class="pd-box__title">Mon rôle</p><p style="font-size:14px;color:var(--text-2)">${escapeHTML(d.role)}</p></div>` : ''}
          ${
            p.github || p.doc
              ? `<div class="pd-box"><p class="pd-box__title">Ressources</p><div class="pd-box__list">
                  ${p.github ? `<a href="${escapeAttr(p.github)}" target="_blank" rel="noopener"><span>Dépôt GitHub</span><span>↗</span></a>` : ''}
                  ${p.doc ? `<a href="${escapeAttr(p.doc)}" download><span>Dossier professionnel</span><span>⬇</span></a>` : ''}
                </div></div>`
              : ''
          }
          ${
            procs.length || relatedByTech.length
              ? `<div class="pd-box"><p class="pd-box__title">${procs.length ? 'Procédures liées' : 'Procédures sur la même stack'}</p><div class="pd-box__list">${(procs.length ? procs : relatedByTech)
                  .map((x) => `<button type="button" data-open-proc="${x.id}"><span>${escapeHTML(x.title)}</span><span>${x.minutes}′</span></button>`)
                  .join('')}</div></div>`
              : ''
          }
          <div class="pd-box">
            <p class="pd-box__title">Dans le homelab</p>
            <div class="pd-box__list"><button type="button" data-show-lab="${(p.vlans || [])[0] || ''}"><span>Voir sur le schéma réseau</span><span>→</span></button></div>
          </div>
        </aside>
      </div>`;
    $('#projectModalCrumb').textContent = p.title;
    $('#projectModalScroll').scrollTop = 0;
    if (!keepOpen || !$('#projectModal').classList.contains('is-open')) Modal.open($('#projectModal'));
    history.replaceState(null, '', `#projet/${id}`);
  }
};

/* ==========================================================================
   19. MOTEUR MARKDOWN + COLORATION SYNTAXIQUE
   ========================================================================== */
const CodeStore = { scope: '', items: [] };
function resetCodeStore(scope) {
  CodeStore.items = CodeStore.items.filter((i) => i.scope !== scope);
  CodeStore.scope = scope;
}
function storeCode(code, scope) {
  CodeStore.items.push({ scope, code });
  return CodeStore.items.length - 1;
}

const LANG_ALIASES = {
  sh: 'bash', shell: 'bash', zsh: 'bash', bash: 'bash',
  ps1: 'powershell', pwsh: 'powershell', ps: 'powershell', powershell: 'powershell', posh: 'powershell',
  ios: 'cisco', cisco: 'cisco', 'cisco-ios': 'cisco', iosxe: 'cisco',
  yml: 'yaml', yaml: 'yaml',
  ini: 'ini', conf: 'ini', cfg: 'ini', toml: 'ini', properties: 'ini', env: 'ini', systemd: 'ini',
  nginx: 'nginx', apache: 'apache', httpd: 'apache',
  sql: 'sql', mysql: 'sql', mariadb: 'sql',
  json: 'json',
  xml: 'xml', html: 'xml', xaml: 'xml',
  js: 'js', javascript: 'js', ts: 'js',
  dockerfile: 'dockerfile', docker: 'dockerfile',
  py: 'python', python: 'python',
  diff: 'diff', patch: 'diff',
  php: 'php',
  text: 'text', txt: 'text', plain: 'text', log: 'text'
};

const LANG_LABEL = { bash: 'Bash', powershell: 'PowerShell', cisco: 'Cisco IOS', yaml: 'YAML', ini: 'Config', nginx: 'Nginx', apache: 'Apache', sql: 'SQL', json: 'JSON', xml: 'XML', js: 'JavaScript', dockerfile: 'Dockerfile', python: 'Python', diff: 'Diff', php: 'PHP', text: 'Texte' };
const LANG_COLOR = { bash: '#a3e635', powershell: '#60a5fa', cisco: '#22d3ee', yaml: '#f472b6', ini: '#fbbf24', nginx: '#4ade80', apache: '#f87171', sql: '#c084fc', json: '#fb923c', xml: '#f9a8d4', js: '#fde047', dockerfile: '#3b82f6', python: '#facc15', diff: '#94a3b8', php: '#a78bfa', text: '#94a3b8' };

const kwAlt = (words) => words.flatMap((w) => [w, w[0].toUpperCase() + w.slice(1), w.toUpperCase()]).filter((v, i, a) => a.indexOf(v) === i).join('|');

const IP_RE = String.raw`\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b`;
const NUM_RE = String.raw`\b\d+(?:\.\d+)?\b`;
const DQ_RE = String.raw`"(?:[^"\\\n]|\\.)*"`;
const SQ_RE = String.raw`'[^'\n]*'`;

const HL_RULES = {
  bash: [
    ['com', String.raw`^#!.*$`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['com', String.raw`(?:^|(?<=\s))#.*$`],
    ['var', String.raw`\$\{[^}\n]+\}|\$\([^)\n]*\)|\$[A-Za-z_]\w*|\$[0-9@#?*!$-]`],
    ['kw', String.raw`\b(?:if|then|else|elif|fi|for|in|do|done|while|until|case|esac|function|return|local|export|readonly|set|unset|source|exit|break|continue|shift|trap|declare)\b`],
    ['cmd', String.raw`(?<=^\s*)(?:sudo\s+)?[a-zA-Z_][\w.+-]*(?=\s|$)`],
    ['cmd', String.raw`(?<=\|\s*)[a-zA-Z_][\w.-]*`],
    ['flag', String.raw`(?<=\s)--?[A-Za-z][\w-]*`],
    ['ip', IP_RE],
    ['path', String.raw`(?<=[\s=:"'])(?:~|\.{1,2})?(?:\/[\w.@%+-]+)+\/?`],
    ['num', NUM_RE],
    ['op', String.raw`\|\||&&|>>|2>&1|[|><;]|\\$`]
  ],
  powershell: [
    ['com', String.raw`<#[\s\S]*?#>`],
    ['str', String.raw`@"[\s\S]*?"@|@'[\s\S]*?'@`],
    ['str', String.raw`"(?:[^"\x60\n]|\x60.)*"`],
    ['str', String.raw`'(?:[^'\n]|'')*'`],
    ['com', String.raw`#.*$`],
    ['bool', String.raw`\$(?:true|false|null)\b`],
    ['var', String.raw`\$\{[^}]+\}|\$(?:env:)?[\w:]+|\$_`],
    ['type', String.raw`\[[A-Za-z][\w.]*(?:\[\])?\]`],
    ['op', String.raw`-(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|and|or|not|xor|replace|split|join|f|is|isnot|as)\b`],
    ['fn', String.raw`\b[A-Z][a-zA-Z]+-[A-Z][A-Za-z0-9]+\b`],
    ['kw', String.raw`\b(?:${kwAlt(['if', 'else', 'elseif', 'foreach', 'for', 'while', 'do', 'until', 'switch', 'function', 'param', 'return', 'try', 'catch', 'finally', 'throw', 'begin', 'process', 'end', 'break', 'continue', 'filter', 'exit'])})\b`],
    ['flag', String.raw`(?<=\s)-[A-Za-z][\w]*`],
    ['ip', IP_RE],
    ['num', NUM_RE],
    ['op', String.raw`\||=|\+=|\x60$`]
  ],
  cisco: [
    ['com', String.raw`^\s*!.*$`],
    ['str', DQ_RE],
    ['iface', String.raw`\b(?:GigabitEthernet|FastEthernet|TenGigabitEthernet|TwentyFiveGigE|Port-channel|Vlan|Loopback|Tunnel|Gi|Fa|Te|Po|Vl|Lo)\s?\d+(?:\/\d+)*(?:\s*-\s*\d+)?\b`],
    ['neg', String.raw`(?<=^\s*)no(?=\s)`],
    ['kw', String.raw`(?<=^\s*(?:no\s+)?)[a-z][\w-]*`],
    ['bool', String.raw`\b(?:trunk|access|active|passive|desirable|auto|on|rapid-pvst|permit|deny|any|host|eq|native|allowed|nonegotiate|portfast|bpduguard|enable|disable|shutdown|level|priv|secret|sha|aes|auth|priv|ssh|telnet|version|input|transport|standard|extended|dynamic|sticky|restrict|protect|violation|maximum|mac-address|trust|none)\b`],
    ['ip', IP_RE],
    ['num', NUM_RE]
  ],
  yaml: [
    ['com', String.raw`(?:^|(?<=\s))#.*$`],
    ['var', String.raw`\{\{[^}\n]+\}\}|\{%[^%\n]+%\}`],
    ['key', String.raw`(?<=^\s*(?:-\s+)?)[\w.\-/"']+(?=\s*:(?:\s|$))`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['bool', String.raw`\b(?:true|false|yes|no|null|True|False|on|off)\b`],
    ['op', String.raw`(?<=^\s*)-(?=\s)|(?<=:\s*)[|>][-+]?$|^---$`],
    ['ip', IP_RE],
    ['num', NUM_RE]
  ],
  ini: [
    ['com', String.raw`^\s*[#;].*$`],
    ['sec', String.raw`^\s*\[[^\]\n]+\]`],
    ['key', String.raw`(?<=^\s*)[\w.\-@/]+(?=\s*[=:])`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['bool', String.raw`\b(?:true|false|yes|no|on|off|True|False|enabled|disabled)\b`],
    ['var', String.raw`%[\w()]+%?|\$\{?[\w]+\}?`],
    ['ip', IP_RE],
    ['path', String.raw`(?<=[=\s])(?:[A-Za-z]:)?(?:[\\/][\w.$@ -]+)+`],
    ['num', NUM_RE]
  ],
  nginx: [
    ['com', String.raw`#.*$`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['var', String.raw`\$\w+`],
    ['kw', String.raw`(?<=^\s*)[a-z_]+(?=\s|\{|;)`],
    ['bool', String.raw`\b(?:on|off|always|default_server|http2|ssl|proxy_protocol)\b`],
    ['ip', IP_RE],
    ['path', String.raw`(?<=\s)(?:\/[\w.@%+~-]+)+\/?`],
    ['num', String.raw`\b\d+[kmsdhKMG]?\b`],
    ['punc', String.raw`[{};]`]
  ],
  apache: [
    ['com', String.raw`#.*$`],
    ['tag', String.raw`<\/?[A-Za-z]+|>`],
    ['str', DQ_RE],
    ['kw', String.raw`(?<=^\s*)[A-Z][A-Za-z]+`],
    ['var', String.raw`\$\{\w+\}|%\{[\w:]+\}`],
    ['ip', IP_RE],
    ['path', String.raw`(?<=\s)(?:\/[\w.@%+~-]+)+\/?`],
    ['num', NUM_RE]
  ],
  sql: [
    ['com', String.raw`--.*$|\/\*[\s\S]*?\*\/`],
    ['str', SQ_RE],
    ['str', DQ_RE],
    ['kw', String.raw`\b(?:${kwAlt(['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'database', 'table', 'user', 'grant', 'all', 'privileges', 'on', 'to', 'identified', 'by', 'flush', 'show', 'status', 'variables', 'like', 'drop', 'if', 'exists', 'not', 'null', 'primary', 'key', 'auto_increment', 'index', 'alter', 'and', 'or', 'as', 'join', 'left', 'inner', 'order', 'group', 'limit', 'default', 'character', 'collate', 'with', 'use', 'revoke', 'engine', 'unique', 'foreign', 'references', 'global'])})\b`],
    ['type', String.raw`\b(?:INT|VARCHAR|TEXT|DATETIME|BOOLEAN|BIGINT|utf8mb4|utf8mb4_unicode_ci|InnoDB)\b`],
    ['var', String.raw`@@?[\w.]+`],
    ['num', NUM_RE],
    ['punc', String.raw`[(),;*]`]
  ],
  json: [
    ['key', String.raw`"(?:[^"\\\n]|\\.)*"(?=\s*:)`],
    ['str', DQ_RE],
    ['bool', String.raw`\b(?:true|false|null)\b`],
    ['num', String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`],
    ['punc', String.raw`[{}[\],:]`]
  ],
  xml: [
    ['com', String.raw`<!--[\s\S]*?-->`],
    ['kw', String.raw`<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>`],
    ['tag', String.raw`<\/?[\w:.-]+|\/?>`],
    ['attr', String.raw`[\w:.-]+(?==)`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['ip', IP_RE]
  ],
  js: [
    ['com', String.raw`\/\/.*$|\/\*[\s\S]*?\*\/`],
    ['str', String.raw`\x60(?:[^\x60\\]|\\.)*\x60`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['kw', String.raw`\b(?:const|let|var|function|return|if|else|for|while|import|export|from|new|class|await|async|try|catch|finally|throw|of|in|typeof|default|switch|case|break)\b`],
    ['bool', String.raw`\b(?:true|false|null|undefined)\b`],
    ['fn', String.raw`\b[a-zA-Z_$][\w$]*(?=\()`],
    ['num', NUM_RE]
  ],
  dockerfile: [
    ['com', String.raw`^\s*#.*$`],
    ['kw', String.raw`(?<=^\s*)(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|HEALTHCHECK|SHELL|ONBUILD|STOPSIGNAL|AS)\b`],
    ['str', DQ_RE],
    ['var', String.raw`\$\{?\w+\}?`],
    ['flag', String.raw`(?<=\s)--?[A-Za-z][\w-]*`],
    ['num', NUM_RE]
  ],
  python: [
    ['com', String.raw`#.*$`],
    ['str', String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''`],
    ['str', String.raw`[fr]?"(?:[^"\\\n]|\\.)*"|[fr]?'(?:[^'\\\n]|\\.)*'`],
    ['kw', String.raw`\b(?:def|class|return|if|elif|else|for|while|in|import|from|as|with|try|except|finally|raise|lambda|pass|break|continue|and|or|not|is|global|yield)\b`],
    ['bool', String.raw`\b(?:True|False|None)\b`],
    ['fn', String.raw`\b[a-zA-Z_]\w*(?=\()`],
    ['num', NUM_RE]
  ],
  php: [
    ['com', String.raw`\/\/.*$|#.*$|\/\*[\s\S]*?\*\/`],
    ['str', DQ_RE],
    ['str', SQ_RE],
    ['tag', String.raw`<\?php|\?>`],
    ['var', String.raw`\$\w+`],
    ['kw', String.raw`\b(?:function|return|if|else|foreach|as|echo|new|class|public|private|protected|require_once|include|array|true|false|null)\b`],
    ['num', NUM_RE]
  ],
  diff: [
    ['kw', String.raw`^@@.*$`],
    ['str', String.raw`^\+.*$`],
    ['flag', String.raw`^-.*$`],
    ['com', String.raw`^(?:diff|index|---|\+\+\+).*$`]
  ],
  text: []
};

const HL_COMPILED = {};
function compileLang(lang) {
  if (HL_COMPILED[lang]) return HL_COMPILED[lang];
  const rules = HL_RULES[lang] || [];
  if (!rules.length) return (HL_COMPILED[lang] = null);
  const source = rules.map(([, re]) => `(${re})`).join('|');
  let regex;
  try {
    regex = new RegExp(source, 'gm');
  } catch (e) {
    console.warn('[hl] regex invalide pour', lang, e);
    regex = null;
  }
  HL_COMPILED[lang] = regex ? { regex, classes: rules.map(([c]) => c), groupCounts: rules.map(([, re]) => countGroups(re)) } : null;
  return HL_COMPILED[lang];
}

function countGroups(re) {
  try {
    return new RegExp(`${re}|`).exec('').length - 1;
  } catch (e) {
    return 0;
  }
}

/* Renvoie une liste de lignes HTML colorées (les jetons multi-lignes sont scindés proprement) */
function highlightLines(code, langRaw) {
  const lang = LANG_ALIASES[(langRaw || '').toLowerCase()] || 'text';
  const compiled = compileLang(lang);
  const tokens = [];
  if (!compiled) {
    tokens.push({ cls: null, text: code });
  } else {
    const { regex, classes, groupCounts } = compiled;
    regex.lastIndex = 0;
    let last = 0;
    let m;
    let guard = 0;
    while ((m = regex.exec(code)) !== null && guard < 200000) {
      guard += 1;
      if (m[0] === '') {
        regex.lastIndex += 1;
        continue;
      }
      let gi = 1;
      let cls = null;
      for (let r = 0; r < classes.length; r += 1) {
        if (m[gi] !== undefined) {
          cls = classes[r];
          break;
        }
        gi += 1 + groupCounts[r];
      }
      if (m.index > last) tokens.push({ cls: null, text: code.slice(last, m.index) });
      tokens.push({ cls, text: m[0] });
      last = m.index + m[0].length;
    }
    if (last < code.length) tokens.push({ cls: null, text: code.slice(last) });
  }
  const lines = [''];
  tokens.forEach(({ cls, text }) => {
    const parts = text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push('');
      if (!part) return;
      const esc = escapeHTML(part);
      lines[lines.length - 1] += cls ? `<span class="tk-${cls}">${esc}</span>` : esc;
    });
  });
  return { lines, lang };
}

function parseFenceAttrs(s = '') {
  const attrs = {};
  s.replace(/(\w+)\s*=\s*"([^"]*)"/g, (_, k, v) => {
    attrs[k] = v;
    return _;
  });
  if (!attrs.title) {
    const bare = s.replace(/(\w+)\s*=\s*"[^"]*"/g, '').trim();
    if (bare) attrs.title = bare;
  }
  return attrs;
}

function parseHlRanges(spec = '') {
  const set = new Set();
  spec.split(',').forEach((part) => {
    const [a, b] = part.split('-').map((x) => parseInt(x, 10));
    if (Number.isNaN(a)) return;
    for (let i = a; i <= (Number.isNaN(b) ? a : b); i += 1) set.add(i);
  });
  return set;
}

const COPY_ICON = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const WRAP_ICON = '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h15a3 3 0 0 1 0 6h-4M3 18h7"/><path d="m16 16-2 2 2 2"/></svg>';

function renderCodeBlock(code, langRaw, attrs, scope) {
  const { lines, lang } = highlightLines(code.replace(/\n$/, ''), langRaw);
  const hl = parseHlRanges(attrs.hl);
  const idx = storeCode(code.replace(/\n$/, ''), scope);
  const long = lines.length > 30;
  const label = LANG_LABEL[lang] || (langRaw || 'Texte');
  const body = lines.map((l, i) => `<span class="line${hl.has(i + 1) ? ' is-hl' : ''}">${l || ' '}</span>`).join('');
  return `
    <div class="codeblock${long ? ' is-long is-collapsed' : ''}">
      <div class="codeblock__head">
        <span class="codeblock__lang" style="--lc:${LANG_COLOR[lang] || '#94a3b8'}">${escapeHTML(label)}</span>
        <span class="codeblock__title">${escapeHTML(attrs.title || '')}</span>
        <span class="codeblock__btns">
          <button type="button" class="codeblock__btn" data-wrap aria-label="Retour à la ligne">${WRAP_ICON}</button>
          <button type="button" class="codeblock__btn" data-copy-idx="${idx}">${COPY_ICON}<span>Copier</span></button>
        </span>
      </div>
      <pre><code>${body}</code></pre>
      <button type="button" class="codeblock__expand" data-expand>Afficher les ${lines.length} lignes</button>
    </div>`;
}

const PROMPT_PATTERNS = [
  { re: /^((?:\([\w.-]+\)\s)?[\w.-]+@[\w.-]+(?::[^\s$#]*)?\s?[$#])\s?(.*)$/, kind: 'user', lang: 'bash' },
  { re: /^(PS [^>\n]*>)\s?(.*)$/, kind: 'ps', lang: 'powershell' },
  { re: /^(C:\\[^>\n]*>)\s?(.*)$/, kind: 'ps', lang: 'text' },
  { re: /^((?:mysql|MariaDB \[[^\]]*\])>)\s?(.*)$/, kind: 'user', lang: 'sql' },
  { re: /^([A-Za-z][\w-]*(?:\([\w-]+\))?[#>])\s?(.*)$/, kind: 'cisco', lang: 'cisco' },
  { re: /^([$#])\s(.*)$/, kind: 'user', lang: 'bash' }
];

function renderTerminal(code, attrs, scope) {
  const commands = [];
  const lines = code.replace(/\n$/, '').split('\n').map((raw) => {
    for (const p of PROMPT_PATTERNS) {
      const m = p.re.exec(raw);
      if (m) {
        const prompt = m[1];
        const cmd = m[2] || '';
        commands.push(cmd);
        const root = p.kind === 'user' && /#$/.test(prompt.trim());
        const cls = p.kind === 'ps' ? 'term__ps1--ps' : p.kind === 'cisco' ? 'term__ps1--cisco' : root ? 'term__ps1--root' : '';
        const hl = highlightLines(cmd, p.lang).lines.join('');
        return `<span class="term__line term__line--cmd"><span class="term__ps1 ${cls}">${escapeHTML(prompt)}</span> ${hl}</span>`;
      }
    }
    let cls = '';
    if (/^\s*(?:\[\s*(?:OK|ok|PASS|SUCCESS)\s*\]|✓|OK\b|PASS\b|SUCCESS|Active: active|.*\bstatus\s*=\s*ok\b)/i.test(raw)) cls = 'term__line--ok';
    else if (/^\s*(?:\[\s*(?:FAIL|ERROR|ERR)\s*\]|✗|ERROR|FATAL|E:|fatal:|failed=([1-9]))/i.test(raw)) cls = 'term__line--err';
    else if (/^\s*(?:\[\s*WARN(?:ING)?\s*\]|WARN|WARNING|W:)/i.test(raw)) cls = 'term__line--warn';
    else if (/^\s*(?:#|\/\/|;)/.test(raw)) cls = 'term__line--dim';
    return `<span class="term__line ${cls}">${escapeHTML(raw) || ' '}</span>`;
  });
  const idx = storeCode(commands.join('\n') || code, scope);
  return `
    <div class="term">
      <div class="term__bar">
        <span class="term__dots"><i></i><i></i><i></i></span>
        <span class="term__title">${escapeHTML(attrs.title || 'terminal')}</span>
        <button type="button" class="term__copy" data-copy-idx="${idx}">Copier les commandes</button>
      </div>
      <div class="term__body">${lines.join('')}</div>
    </div>`;
}

function renderInline(src) {
  const codes = [];
  let s = String(src).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = escapeHTML(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, url, title) => `<img src="${url}" alt="${alt}" loading="lazy"${title ? ` title="${title}"` : ''}>`);
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_, keys) => keys.split('+').map((k) => `<kbd>${k.trim()}</kbd>`).join('+'));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    if (/^#wiki\//.test(url)) return `<a href="${url}" data-proc-link="${url.slice(6)}">${text}</a>`;
    if (/^#projet\//.test(url)) return `<a href="${url}" data-project-link="${url.slice(8)}">${text}</a>`;
    const ext = /^https?:/.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/==([^=]+?)==/g, '<mark>$1</mark>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHTML(codes[Number(i)])}</code>`);
  return s;
}

const CALLOUT_META = {
  INFO: ['info', 'i', 'Information'],
  NOTE: ['note', '✎', 'Note'],
  TIP: ['tip', '★', 'Astuce'],
  SUCCESS: ['success', '✓', 'Résultat'],
  WARN: ['warn', '!', 'Attention'],
  WARNING: ['warn', '!', 'Attention'],
  DANGER: ['danger', '⚠', 'Danger'],
  SEC: ['sec', '⛨', 'Sécurité'],
  SECURITY: ['sec', '⛨', 'Sécurité']
};

function renderMarkdown(src, scope = 'wiki', opts = {}) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const toc = [];
  const used = opts.used || new Set();
  let h2 = opts.h2 || 0;
  let i = 0;

  const uniqueId = (text) => {
    let base = slugify(text);
    let id = base;
    let k = 2;
    while (used.has(id)) id = `${base}-${k++}`;
    used.add(id);
    return id;
  };

  const isFence = (l) => /^\s*(~~~|```)/.test(l);
  const isListItem = (l) => /^(\s*)([-*+]|\d+[.)])\s+/.test(l);
  const isTableSep = (l) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(l || '');
  const isBlockStart = (l, next) =>
    isFence(l) || /^#{1,4}\s/.test(l) || /^>\s?/.test(l) || isListItem(l) || /^(-{3,}|\*{3,})\s*$/.test(l) || (l.includes('|') && isTableSep(next)) || /^<(div|svg|figure|table|details|section|aside|pre|img)\b/i.test(l.trim());

  const indentOf = (s) => s.replace(/\t/g, '    ').length;

  const parseList = (start) => {
    const first = /^(\s*)([-*+]|\d+[.)])\s+/.exec(lines[start]);
    const base = indentOf(first[1]);
    const ordered = /\d/.test(first[2]);
    const items = [];
    let j = start;
    while (j < lines.length) {
      const line = lines[j];
      if (!line.trim()) {
        const nxt = lines.slice(j + 1).find((l) => l.trim());
        const nm = nxt && /^(\s*)([-*+]|\d+[.)])\s+/.exec(nxt);
        if (nm && indentOf(nm[1]) >= base) {
          j += 1;
          continue;
        }
        break;
      }
      const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (m && indentOf(m[1]) === base) {
        items.push({ text: m[3], children: '' });
        j += 1;
      } else if (m && indentOf(m[1]) > base && items.length) {
        const sub = parseList(j);
        items[items.length - 1].children += sub.html;
        j = sub.next;
      } else if (!m && indentOf(/^(\s*)/.exec(line)[1]) > base && items.length && !isFence(line)) {
        items[items.length - 1].text += ' ' + line.trim();
        j += 1;
      } else if (isFence(line) && items.length && indentOf(/^(\s*)/.exec(line)[1]) > base) {
        const fenceIndent = /^(\s*)/.exec(line)[1];
        const header = line.trim();
        const fm = /^(~~~|```)\s*([\w+-]*)\s*(.*)$/.exec(header);
        const buf = [];
        j += 1;
        while (j < lines.length && lines[j].trim() !== fm[1]) {
          buf.push(lines[j].startsWith(fenceIndent) ? lines[j].slice(fenceIndent.length) : lines[j]);
          j += 1;
        }
        j += 1;
        items[items.length - 1].children += renderFence(fm[2], fm[3], buf.join('\n'));
      } else {
        break;
      }
    }
    const isTasks = items.some((it) => /^\[( |x|X)\]\s/.test(it.text));
    const tag = ordered ? 'ol' : 'ul';
    const html = `<${tag}${isTasks ? ' class="tasks"' : ''}>${items
      .map((it) => {
        const tm = /^\[( |x|X)\]\s+(.*)$/.exec(it.text);
        if (tm) {
          return `<li class="task"><input type="checkbox"${tm[1].trim() ? ' checked' : ''} aria-label="Étape de validation"><span>${renderInline(tm[2])}</span>${it.children}</li>`;
        }
        return `<li>${renderInline(it.text)}${it.children}</li>`;
      })
      .join('')}</${tag}>`;
    return { html, next: j };
  };

  const renderFence = (langRaw, attrStr, code) => {
    const lang = (langRaw || 'text').toLowerCase();
    const attrs = parseFenceAttrs(attrStr);
    if (['terminal', 'console', 'shell-session', 'term'].includes(lang)) return renderTerminal(code, attrs, scope);
    if (['ascii', 'diagram', 'schema', 'topo'].includes(lang)) {
      return `<div class="ascii">${attrs.title ? `<p class="ascii__title">${escapeHTML(attrs.title)}</p>` : ''}<pre>${escapeHTML(code)}</pre></div>`;
    }
    if (lang === 'svg') return `<figure class="figure-svg">${code}${attrs.title ? `<figcaption>${escapeHTML(attrs.title)}</figcaption>` : ''}</figure>`;
    if (lang === 'html' && attrs.raw !== 'false') return code;
    return renderCodeBlock(code, lang, attrs, scope);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (isFence(line)) {
      const fm = /^\s*(~~~|```)\s*([\w+-]*)\s*(.*)$/.exec(line);
      const fence = fm[1];
      const buf = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== fence) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(renderFence(fm[2], fm[3], buf.join('\n')));
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const hm = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (hm) {
      const level = Math.max(2, hm[1].length);
      const text = hm[2];
      const plain = text.replace(/[`*_]/g, '');
      const id = uniqueId(plain);
      if (level === 2) {
        h2 += 1;
        toc.push({ level, text: plain, id, num: h2 });
        out.push(`<h2 id="${id}"><span class="h-num">${pad(h2)}</span>${renderInline(text)}<a class="anchor" href="#${id}" data-anchor="${id}" aria-label="Lien vers cette section">#</a></h2>`);
      } else {
        if (level === 3) toc.push({ level, text: plain, id });
        out.push(`<h${level} id="${id}">${renderInline(text)}${level === 3 ? `<a class="anchor" href="#${id}" data-anchor="${id}" aria-label="Lien vers cette section">#</a>` : ''}</h${level}>`);
      }
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      const cm = /^\[!(\w+)\]\s*(.*)$/.exec(buf[0] || '');
      if (cm && CALLOUT_META[cm[1].toUpperCase()]) {
        const [cls, icon, defTitle] = CALLOUT_META[cm[1].toUpperCase()];
        const inner = renderMarkdown(buf.slice(1).join('\n'), scope, { used, h2: 9999 }).html;
        out.push(`<div class="callout callout--${cls}" role="note"><span class="callout__icon" aria-hidden="true">${icon}</span><div class="callout__body"><span class="callout__title">${renderInline(cm[2] || defTitle)}</span>${inner}</div></div>`);
      } else {
        out.push(`<blockquote>${renderMarkdown(buf.join('\n'), scope, { used, h2: 9999 }).html}</blockquote>`);
      }
      continue;
    }

    if (line.includes('|') && isTableSep(lines[i + 1])) {
      const splitRow = (r) =>
        r
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .replace(/\\\|/g, '\u0001')
          .split('|')
          .map((c) => c.trim().replace(/\u0001/g, '|'));
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : ''));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      const al = (k) => (aligns[k] ? ` style="text-align:${aligns[k]}"` : '');
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((h, k) => `<th${al(k)}>${renderInline(h)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${head.map((_, k) => `<td${al(k)}>${renderInline(r[k] || '')}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      continue;
    }

    if (isListItem(line)) {
      const res = parseList(i);
      out.push(res.html);
      i = res.next;
      continue;
    }

    if (/^<(div|svg|figure|table|details|section|aside|pre|img)\b/i.test(line.trim())) {
      const buf = [];
      while (i < lines.length && lines[i].trim()) {
        buf.push(lines[i]);
        i += 1;
      }
      out.push(buf.join('\n'));
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i], lines[i + 1]))) {
      para.push(lines[i].trim());
      i += 1;
    }
    const text = para.join(' ');
    const onlyImg = /^!\[[^\]]*\]\([^)]+\)$/.test(text);
    out.push(onlyImg ? `<figure>${renderInline(text)}</figure>` : `<p>${renderInline(text)}</p>`);
  }

  return { html: out.join('\n'), toc };
}

/* Délégation des clics dans les contenus rendus (wiki + dossiers projets) */
async function handleContentClick(e) {
  const copyBtn = e.target.closest('[data-copy-idx]');
  if (copyBtn) {
    const item = CodeStore.items[Number(copyBtn.dataset.copyIdx)];
    if (item && (await copyText(item.code))) {
      copyBtn.classList.add('is-copied');
      const span = copyBtn.querySelector('span');
      const prev = span ? span.textContent : copyBtn.textContent;
      if (span) span.textContent = 'Copié !';
      else copyBtn.textContent = 'Copié !';
      setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        if (span) span.textContent = prev;
        else copyBtn.textContent = prev;
      }, 1600);
    } else {
      toast('Copie impossible dans ce navigateur', 'info');
    }
    return;
  }
  const wrapBtn = e.target.closest('[data-wrap]');
  if (wrapBtn) {
    wrapBtn.closest('.codeblock')?.classList.toggle('is-wrapped');
    return;
  }
  const expandBtn = e.target.closest('[data-expand]');
  if (expandBtn) {
    const block = expandBtn.closest('.codeblock');
    const collapsed = block.classList.toggle('is-collapsed');
    expandBtn.textContent = collapsed ? `Afficher les ${$$('.line', block).length} lignes` : 'Réduire';
    return;
  }
  const anchor = e.target.closest('[data-anchor]');
  if (anchor) {
    e.preventDefault();
    const target = document.getElementById(anchor.dataset.anchor);
    target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  const procLink = e.target.closest('[data-proc-link], [data-open-proc]');
  if (procLink) {
    e.preventDefault();
    Wiki.open(procLink.dataset.procLink || procLink.dataset.openProc);
    return;
  }
  const projLink = e.target.closest('[data-project-link]');
  if (projLink) {
    e.preventDefault();
    Projects.open(projLink.dataset.projectLink);
    return;
  }
  const labBtn = e.target.closest('[data-show-lab]');
  if (labBtn) {
    Modal.close($('#projectModal'));
    const v = labBtn.dataset.showLab;
    setTimeout(() => {
      scrollToTarget('#homelab');
      if (v) Homelab.setVlanFilter(Number(v));
    }, 250);
  }
}

/* ==========================================================================
   20. WIKI — INDEX, RECHERCHE, FILTRES, CARTES
   ========================================================================== */
const lightNorm = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function countOccurrences(hay, needle) {
  if (!needle) return 0;
  let n = 0;
  let pos = hay.indexOf(needle);
  while (pos !== -1 && n < 50) {
    n += 1;
    pos = hay.indexOf(needle, pos + needle.length);
  }
  return n;
}

function highlightTerms(text, terms) {
  let html = escapeHTML(text);
  if (!terms.length) return html;
  const norm = lightNorm(html);
  const ranges = [];
  terms.forEach((t) => {
    let pos = norm.indexOf(t);
    while (pos !== -1) {
      ranges.push([pos, pos + t.length]);
      pos = norm.indexOf(t, pos + t.length);
    }
  });
  if (!ranges.length) return html;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  ranges.forEach((r) => {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  });
  let out = '';
  let cursor = 0;
  merged.forEach(([a, b]) => {
    if (html.slice(a, b).includes('&') || html.slice(a, b).includes(';')) return;
    out += html.slice(cursor, a) + '<mark>' + html.slice(a, b) + '</mark>';
    cursor = b;
  });
  return out + html.slice(cursor);
}

const Wiki = {
  state: { q: '', techs: new Set(), cat: '', level: '', sort: 'relevance', layout: 'grid' },
  results: [],
  current: null,
  terms: [],

  init() {
    this.grid = $('#wikiGrid');
    if (!this.grid) return;
    this.input = $('#wikiSearch');
    this.renderStats();
    this.renderTechChips();
    this.renderCategoryOptions();
    this.bind();
    this.update(false);
  },

  plainOf(p) {
    if (!p._plain) {
      p._plain = p.content
        .replace(/^~~~[\s\S]*?^~~~\s*$/gm, ' ')
        .replace(/^>\s?\[![A-Z]+\]\s*/gm, '')
        .replace(/[#>*`|~=]/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      p._plainNorm = lightNorm(p._plain);
    }
    return p._plain;
  },

  renderStats() {
    const procs = Store.procedures;
    const techs = new Set(procs.flatMap((p) => p.techKeys));
    const minutes = procs.reduce((a, p) => a + p.minutes, 0);
    const code = procs.reduce((a, p) => a + p.codeBlocks, 0);
    const set = (id, v) => {
      const el = $(id);
      if (!el) return;
      el.dataset.count = String(v);
      el.textContent = '0';
      once(el, () => animateCounter(el));
    };
    set('#wsCount', procs.length);
    set('#wsTechs', techs.size);
    set('#wsMinutes', minutes);
    set('#wsCode', code);
  },

  renderTechChips() {
    const host = $('#wikiTechs');
    const counts = [...Store.techCounts().entries()].sort((a, b) => b[1] - a[1]);
    host.innerHTML =
      `<button type="button" class="tech-chip is-active" data-tech="" style="--c:#e2e8f0">Toutes<small>${Store.procedures.length}</small></button>` +
      counts
        .map(([k, n]) => {
          const t = techInfo(k);
          return `<button type="button" class="tech-chip" data-tech="${escapeAttr(k)}" style="--c:${t.color}" aria-pressed="false"><i></i>${escapeHTML(t.name)}<small>${n}</small></button>`;
        })
        .join('');
  },

  renderCategoryOptions() {
    const sel = $('#wikiCategory');
    const cats = [...Store.categories().entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
    sel.innerHTML = `<option value="">Toutes les catégories</option>` + cats.map(([c, n]) => `<option value="${escapeAttr(c)}">${escapeHTML(c)} (${n})</option>`).join('');
  },

  bind() {
    const deb = debounce(() => this.update(), 90);
    this.input.addEventListener('input', () => {
      this.state.q = this.input.value;
      $('#wikiClear').hidden = !this.input.value;
      deb();
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.results[0]) this.open(this.results[0].p.id);
      if (e.key === 'Escape') {
        this.input.value = '';
        this.state.q = '';
        $('#wikiClear').hidden = true;
        this.update();
      }
    });
    $('#wikiClear').addEventListener('click', () => {
      this.input.value = '';
      this.state.q = '';
      $('#wikiClear').hidden = true;
      this.input.focus();
      this.update();
    });
    $('#wikiTechs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tech]');
      if (!b) return;
      const k = b.dataset.tech;
      if (!k) this.state.techs.clear();
      else if (this.state.techs.has(k)) this.state.techs.delete(k);
      else this.state.techs.add(k);
      this.syncChips();
      this.update();
    });
    $('#wikiCategory').addEventListener('change', (e) => {
      this.state.cat = e.target.value;
      this.update();
    });
    $('#wikiLevel').addEventListener('change', (e) => {
      this.state.level = e.target.value;
      this.update();
    });
    $('#wikiSort').addEventListener('change', (e) => {
      this.state.sort = e.target.value;
      this.update();
    });
    $$('.segmented__btn[data-layout]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.layout = btn.dataset.layout;
        $$('.segmented__btn[data-layout]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-checked', String(b === btn));
        });
        this.grid.dataset.layout = this.state.layout;
      })
    );
    $('#wikiReset').addEventListener('click', () => this.reset());
    this.grid.addEventListener('click', (e) => {
      const card = e.target.closest('.wiki-card');
      if (card) this.open(card.dataset.id);
    });
    this.grid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.wiki-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.open(card.dataset.id);
      }
    });
    $('#stackGoWiki')?.addEventListener('click', (e) => this.filterByTech(e.currentTarget.dataset.tech, true));
  },

  syncChips() {
    $$('#wikiTechs .tech-chip').forEach((c) => {
      const k = c.dataset.tech;
      const on = k ? this.state.techs.has(k) : this.state.techs.size === 0;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
  },

  reset() {
    this.state = { q: '', techs: new Set(), cat: '', level: '', sort: 'relevance', layout: this.state.layout };
    this.input.value = '';
    $('#wikiClear').hidden = true;
    $('#wikiCategory').value = '';
    $('#wikiLevel').value = '';
    $('#wikiSort').value = 'relevance';
    this.syncChips();
    this.update();
  },

  filterByTech(key, scroll = false) {
    if (!key) return;
    this.state.techs = new Set([key]);
    this.state.q = '';
    if (this.input) this.input.value = '';
    $('#wikiClear').hidden = true;
    if (!$(`#wikiTechs [data-tech="${CSS.escape(key)}"]`)) {
      const t = techInfo(key);
      $('#wikiTechs').insertAdjacentHTML('beforeend', `<button type="button" class="tech-chip" data-tech="${escapeAttr(key)}" style="--c:${t.color}"><i></i>${escapeHTML(t.name)}<small>0</small></button>`);
    }
    this.syncChips();
    this.update();
    if (scroll) {
      scrollToTarget('#wiki');
      const n = this.results.length;
      toast(`${techInfo(key).name} : ${plural(n, 'procédure')}`, 'info');
    }
  },

  search() {
    const terms = lightNorm(this.state.q)
      .replace(/[^a-z0-9.\-/+#_ ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 || /\d/.test(t));
    this.terms = terms;
    let list = Store.procedures.map((p) => ({ p, score: 0, snippet: '' }));

    if (terms.length) {
      list = list.filter((r) => {
        let total = 0;
        for (const t of terms) {
          let s = 0;
          if (r.p.searchTitle.includes(t)) s += 10 + (new RegExp(`(^|\\s)${escapeReg(t)}`).test(r.p.searchTitle) ? 6 : 0);
          if (r.p.searchMeta.includes(t)) s += 4;
          s += Math.min(countOccurrences(r.p.searchBody, t), 8);
          if (!s) return false;
          total += s;
        }
        r.score = total;
        return true;
      });
      list.forEach((r) => {
        if (r.p.searchTitle.includes(terms[0]) && terms.length === 1) return;
        const plain = this.plainOf(r.p);
        const idx = r.p._plainNorm.indexOf(terms[0]);
        if (idx !== -1) {
          const start = Math.max(0, idx - 60);
          r.snippet = (start > 0 ? '…' : '') + plain.slice(start, idx + 110).trim() + '…';
        }
      });
    }

    const { techs, cat, level, sort } = this.state;
    if (techs.size) list = list.filter((r) => r.p.techKeys.some((k) => techs.has(k)));
    if (cat) list = list.filter((r) => r.p.category === cat);
    if (level) list = list.filter((r) => r.p.level === level);

    const byOrder = (a, b) => a.p.order - b.p.order;
    const sorters = {
      relevance: (a, b) => (terms.length ? b.score - a.score || byOrder(a, b) : byOrder(a, b)),
      recent: (a, b) => (b.p.date || '').localeCompare(a.p.date || '') || byOrder(a, b),
      short: (a, b) => a.p.minutes - b.p.minutes || byOrder(a, b),
      long: (a, b) => b.p.minutes - a.p.minutes || byOrder(a, b),
      alpha: (a, b) => a.p.title.localeCompare(b.p.title, 'fr')
    };
    list.sort(sorters[sort] || sorters.relevance);
    return list;
  },

  levelDots(level, color) {
    const n = LEVELS.indexOf(level) + 1;
    return `<span class="level" title="Niveau : ${escapeAttr(level)}"><span class="level__dots" style="--c:${color}">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>${escapeHTML(level)}</span>`;
  },

  update(animate = true) {
    this.results = this.search();
    const terms = this.terms;
    const { q, techs, cat, level } = this.state;
    const filtered = !!(q || techs.size || cat || level);
    $('#wikiReset').hidden = !filtered;
    const n = this.results.length;
    $('#wikiResultCount').innerHTML = filtered
      ? `<b>${n}</b> ${n > 1 ? 'procédures correspondent' : 'procédure correspond'} sur ${Store.procedures.length}`
      : `<b>${Store.procedures.length}</b> ${Store.procedures.length > 1 ? 'procédures disponibles' : 'procédure disponible'}`;
    $('#wikiEmpty').hidden = n > 0;

    this.grid.innerHTML = this.results
      .map(({ p, snippet }, i) => {
        const rgb = rgbString(p.color);
        return `
        <article class="wiki-card card card--spot" data-id="${escapeAttr(p.id)}" tabindex="0" role="button" aria-label="Lire : ${escapeAttr(p.title)}" style="--c:${p.color};--c-rgb:${rgb};animation-delay:${Math.min(i, 12) * 30}ms">
          <div class="card__glow" aria-hidden="true"></div>
          <div class="wiki-card__top">
            <span class="wiki-card__cat">${escapeHTML(p.category)}</span>
            <span class="wiki-card__id">${escapeHTML(p.id.toUpperCase())}</span>
          </div>
          <h3 class="wiki-card__title">${highlightTerms(p.title, terms)}</h3>
          ${snippet ? `<p class="wiki-card__snippet">${highlightTerms(snippet, terms)}</p>` : `<p class="wiki-card__summary">${escapeHTML(p.summary)}</p>`}
          <div class="wiki-card__techs tags">${p.techs.slice(0, 4).map((t) => `<span style="color:${t.color}">${escapeHTML(t.name)}</span>`).join('')}</div>
          <div class="wiki-card__foot">
            <span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${p.minutes} min</span>
            ${this.levelDots(p.level, p.color)}
            <span title="Blocs de code"><svg viewBox="0 0 24 24"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>${p.codeBlocks}</span>
            <span class="wiki-card__read">Lire →</span>
          </div>
        </article>`;
      })
      .join('');

    const cards = $$('.wiki-card', this.grid);
    cards.forEach(bindSpotlight);
    if (!animate) cards.forEach((c) => (c.style.animation = 'none'));
    lib.ScrollTrigger?.refresh();
  },

  /* ==========================================================================
     21. LECTEUR PLEIN ÉCRAN
     ========================================================================== */
  open(id) {
    const p = Store.procById.get(id);
    if (!p) {
      toast('Procédure introuvable', 'info');
      return;
    }
    this.current = id;
    resetCodeStore('wiki');
    const md = renderMarkdown(p.content, 'wiki');
    const list = this.navList();
    const idx = list.findIndex((x) => x.id === id);
    const prev = idx > 0 ? list[idx - 1] : null;
    const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
    const project = p.project ? PROJECT_BY_ID[p.project] : null;

    const envRows = p.env ? Object.entries(p.env) : [];
    const content = $('#readerContent');
    content.innerHTML = `
      <header class="proc-head" style="--c:${p.color}">
        <div class="proc-head__top">
          <span class="chip" style="color:${p.color};border-color:${p.color}55">${escapeHTML(p.category)}</span>
          <span class="chip">${escapeHTML(p.id.toUpperCase())}</span>
          ${project ? `<button type="button" class="chip" data-project-link="${project.id}">Projet P·${project.num} →</button>` : ''}
        </div>
        <h1 class="proc-head__title" id="wikiModalTitle">${escapeHTML(p.title)}</h1>
        <p class="proc-head__summary">${escapeHTML(p.summary)}</p>
        <div class="proc-head__meta">
          <span>⏱ <b>${p.minutes} min</b> de lecture</span>
          <span>${this.levelDots(p.level, p.color)}</span>
          <span>⌘ <b>${p.codeBlocks}</b> blocs · <b>${p.codeLines}</b> lignes de code</span>
          ${p.date ? `<span>✎ <b>${formatDate(p.date)}</b></span>` : ''}
        </div>
        <div class="proc-head__techs tags">${p.techs.map((t) => `<span style="color:${t.color};border-color:${t.color}40">${escapeHTML(t.name)}</span>`).join('')}</div>
      </header>
      ${
        envRows.length
          ? `<div class="prose"><div class="table-wrap"><table><thead><tr><th>Environnement</th><th>Version / valeur</th></tr></thead><tbody>${envRows
              .map(([k, v]) => `<tr><td>${escapeHTML(k)}</td><td><code>${escapeHTML(v)}</code></td></tr>`)
              .join('')}</tbody></table></div></div>`
          : ''
      }
      <div class="prose">${md.html}</div>
      <nav class="proc-nav" aria-label="Procédures voisines">
        <button type="button" ${prev ? `data-open-proc="${prev.id}"` : 'disabled'}><small>← Précédente</small><b>${prev ? escapeHTML(prev.title) : ''}</b></button>
        <button type="button" ${next ? `data-open-proc="${next.id}"` : 'disabled'}><small>Suivante →</small><b>${next ? escapeHTML(next.title) : ''}</b></button>
      </nav>`;

    $('#readerTocNav').innerHTML = md.toc.length
      ? md.toc.map((h) => `<a href="#${h.id}" class="lvl-${h.level}" data-toc="${h.id}">${h.num ? `${pad(h.num)}. ` : ''}${escapeHTML(h.text)}</a>`).join('')
      : '<p style="font-size:13px;color:var(--text-3)">Pas de sections.</p>';
    $('#readerTocMeta').innerHTML = `
      <div><span>Lecture</span><b>${p.minutes} min</b></div>
      <div><span>Niveau</span><b>${escapeHTML(p.level)}</b></div>
      <div><span>Mots</span><b>${p.words.toLocaleString('fr-FR')}</b></div>
      <div><span>Code</span><b>${p.codeLines} lignes</b></div>
      ${p.date ? `<div><span>Mise à jour</span><b>${formatDate(p.date)}</b></div>` : ''}`;

    $('#wikiModalCrumb').textContent = p.title;
    $('#readerPrev').disabled = !prev;
    $('#readerNext').disabled = !next;
    this.prevId = prev?.id;
    this.nextId = next?.id;

    const modal = $('#wikiModal');
    if (!modal.classList.contains('is-open')) Modal.open(modal);
    const scroller = $('#readerScroll');
    scroller.scrollTop = 0;
    this.headings = $$('.prose h2[id], .prose h3[id]', content);
    this.updateReaderProgress();
    $('#readerTocPanel').classList.remove('is-open');
    history.replaceState(null, '', `#wiki/${id}`);
  },

  navList() {
    const fromResults = this.results.map((r) => r.p);
    return fromResults.some((p) => p.id === this.current) ? fromResults : Store.procedures;
  },

  updateReaderProgress() {
    const sc = $('#readerScroll');
    if (!sc) return;
    const max = sc.scrollHeight - sc.clientHeight;
    $('#readerProgress').style.transform = `scaleX(${max > 0 ? clamp(sc.scrollTop / max, 0, 1) : 0})`;
    const top = sc.getBoundingClientRect().top;
    let active = null;
    (this.headings || []).forEach((h) => {
      if (h.getBoundingClientRect().top - top < 120) active = h.id;
    });
    if (!active && this.headings && this.headings[0]) active = this.headings[0].id;
    $$('#readerTocNav a').forEach((a) => a.classList.toggle('is-active', a.dataset.toc === active));
  },

  initReader() {
    const sc = $('#readerScroll');
    if (!sc) return;
    let raf = 0;
    sc.addEventListener(
      'scroll',
      () => {
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            this.updateReaderProgress();
          });
      },
      { passive: true }
    );
    $('#readerContent').addEventListener('click', (e) => handleContentClick(e));
    $('#readerTocNav').addEventListener('click', (e) => {
      const a = e.target.closest('[data-toc]');
      if (!a) return;
      e.preventDefault();
      const h = document.getElementById(a.dataset.toc);
      if (h) sc.scrollTo({ top: sc.scrollTop + h.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      $('#readerTocPanel').classList.remove('is-open');
    });
    $('#readerToc').addEventListener('click', () => $('#readerTocPanel').classList.toggle('is-open'));
    $('#readerPrev').addEventListener('click', () => this.prevId && this.open(this.prevId));
    $('#readerNext').addEventListener('click', () => this.nextId && this.open(this.nextId));
    $('#readerLink').addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}#wiki/${this.current}`;
      if (await copyText(url)) toast('Lien de la procédure copié');
    });
    $('#readerPrint').addEventListener('click', () => {
      document.body.classList.add('is-printing-proc');
      const done = () => {
        document.body.classList.remove('is-printing-proc');
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      setTimeout(() => window.print(), 50);
    });
    const sizes = [15, 16, 17, 18];
    let fs = 16;
    try {
      fs = Number(localStorage.getItem('em-reader-fs')) || 16;
    } catch (e) {
      fs = 16;
    }
    document.documentElement.style.setProperty('--reader-fs', `${fs}px`);
    $('#readerFont').addEventListener('click', () => {
      fs = sizes[(sizes.indexOf(fs) + 1) % sizes.length];
      document.documentElement.style.setProperty('--reader-fs', `${fs}px`);
      try {
        localStorage.setItem('em-reader-fs', String(fs));
      } catch (e) {
        /* stockage indisponible */
      }
      toast(`Taille du texte : ${fs}px`, 'info', 1200);
    });
    $('#wikiModal').addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight' && this.nextId) this.open(this.nextId);
      if (e.key === 'ArrowLeft' && this.prevId) this.open(this.prevId);
    });
  }
};

/* ==========================================================================
   22. PALETTE DE COMMANDES
   ========================================================================== */
const Cmdk = {
  items: [],
  filtered: [],
  active: 0,

  init() {
    this.el = $('#cmdk');
    this.input = $('#cmdkInput');
    this.list = $('#cmdkList');
    if (!this.el) return;
    this.build();
    $('#cmdOpen')?.addEventListener('click', () => this.open());
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.close();
      const item = e.target.closest('.cmdk__item');
      if (item) this.run(Number(item.dataset.idx));
    });
    this.list.addEventListener('mousemove', (e) => {
      const item = e.target.closest('.cmdk__item');
      if (item && Number(item.dataset.idx) !== this.active) {
        this.active = Number(item.dataset.idx);
        this.highlight(false);
      }
    });
    this.input.addEventListener('input', () => this.filter());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.active = Math.min(this.active + 1, this.filtered.length - 1);
        this.highlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.active = Math.max(this.active - 1, 0);
        this.highlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.run(this.active);
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
  },

  build() {
    const sec = (id, title, sub, icon) => ({ group: 'Sections', title, sub, icon, kind: 'section', action: () => scrollToTarget(id === '#hero' ? 0 : id) });
    this.items = [
      sec('#hero', 'Accueil', 'Hero 3D et présentation', '⌂'),
      sec('#mission', 'Mission actuelle', 'Attineos Infrastructures · usine de Verson', '01'),
      sec('#parcours', 'Parcours', 'CDI, alternance, Bac Pro', '02'),
      sec('#stack', 'Stack technique', 'Galaxie 3D des technologies', '03'),
      sec('#homelab', 'Homelab & production', 'Schéma réseau, VLANs, pare-feu', '04'),
      sec('#projets', 'Projets', '15 projets d’infrastructure', '05'),
      sec('#wiki', 'Base de connaissances', 'Procédures techniques', '06'),
      sec('#objectif', 'Objectif ingénieur', 'Cycle ingénieur en alternance', '07'),
      sec('#contact', 'Contact', 'E-mail, téléphone, réseaux', '08'),
      { group: 'Actions', title: 'Copier mon adresse e-mail', sub: PROFILE.email, icon: '@', kind: 'action', action: async () => (await copyText(PROFILE.email)) && toast('Adresse e-mail copiée') },
      { group: 'Actions', title: 'Télécharger le CV (PDF)', sub: 'CV_Enzo_MARECHAL.pdf', icon: '↓', kind: 'action', action: () => window.open('CV_Enzo_MARECHAL.pdf', '_blank') },
      { group: 'Actions', title: 'Vue 3D isométrique du homelab', sub: 'Basculer la vue du schéma réseau', icon: '◇', kind: 'action', action: () => {
        scrollToTarget('#homelab');
        $('.segmented__btn[data-view="iso"]')?.click();
      } },
      { group: 'Actions', title: 'Afficher tous les flux réseau', sub: 'Animer les 8 flux du homelab', icon: '⇄', kind: 'action', action: () => {
        scrollToTarget('#homelab');
        $('.flow-btn[data-flow="__all"]')?.click();
      } },
      { group: 'Actions', title: 'GitHub — B2ZO0', sub: 'github.com/B2ZO0', icon: 'GH', kind: 'lien', action: () => window.open('https://github.com/B2ZO0', '_blank', 'noopener') },
      { group: 'Actions', title: 'LinkedIn', sub: 'marechal-enzo', icon: 'in', kind: 'lien', action: () => window.open('https://www.linkedin.com/in/marechal-enzo-7b9ba9261/', '_blank', 'noopener') },
      ...PROJECTS.map((p) => ({ group: 'Projets', title: p.title, sub: `${p.cat} · ${p.stack.map((k) => techInfo(k).name).join(', ')}`, icon: p.num, color: p.color, kind: 'projet', action: () => Projects.open(p.id) })),
      ...Store.procedures.map((p) => ({ group: 'Procédures', title: p.title, sub: `${p.category} · ${p.minutes} min · ${p.techs.map((t) => t.name).join(', ')}`, icon: '¶', color: p.color, kind: 'wiki', action: () => Wiki.open(p.id) })),
      ...Object.keys(TECHS).map((k) => ({ group: 'Technologies', title: TECHS[k].name, sub: `Filtrer le wiki · ${TECHS[k].cat}`, icon: TECHS[k].mono, color: TECHS[k].color, kind: 'filtre', action: () => Wiki.filterByTech(k, true) })),
      ...NODES.map((n) => ({ group: 'Équipements', title: n.name, sub: `${n.ip} · ${n.role}`, icon: '▣', color: nodeColor(n), kind: 'homelab', action: () => {
        scrollToTarget('#homelab');
        setTimeout(() => Homelab.select(n.id), 500);
      } }))
    ];
    this.items.forEach((it) => (it.search = lightNorm(`${it.title} ${it.sub} ${it.group}`)));
  },

  open() {
    this.el.hidden = false;
    lockScroll(true);
    this.input.value = '';
    this.filter();
    requestAnimationFrame(() => this.input.focus());
  },

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    lockScroll(false);
  },

  toggle() {
    if (this.el.hidden) this.open();
    else this.close();
  },

  filter() {
    const q = lightNorm(this.input.value.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    let res;
    if (!terms.length) {
      res = this.items.filter((it) => ['Sections', 'Actions'].includes(it.group)).concat(this.items.filter((it) => it.group === 'Projets').slice(0, 4));
    } else {
      res = this.items
        .map((it) => {
          if (!terms.every((t) => it.search.includes(t))) return null;
          const title = lightNorm(it.title);
          let score = 0;
          terms.forEach((t) => {
            if (title.startsWith(t)) score += 10;
            else if (title.includes(t)) score += 5;
            else score += 1;
          });
          return { it, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 40)
        .map((x) => x.it);
      const order = ['Sections', 'Procédures', 'Projets', 'Équipements', 'Technologies', 'Actions'];
      res.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
    }
    this.filtered = res;
    this.active = 0;
    this.render(terms);
  },

  render(terms = []) {
    if (!this.filtered.length) {
      this.list.innerHTML = `<li class="cmdk__empty">Aucun résultat pour « ${escapeHTML(this.input.value)} »</li>`;
      return;
    }
    let lastGroup = '';
    this.list.innerHTML = this.filtered
      .map((it, i) => {
        const head = it.group !== lastGroup ? `<li class="cmdk__group" role="presentation">${escapeHTML(it.group)}</li>` : '';
        lastGroup = it.group;
        return `${head}<li class="cmdk__item${i === this.active ? ' is-active' : ''}" role="option" aria-selected="${i === this.active}" data-idx="${i}" id="cmdk-${i}">
          <span class="cmdk__item-icon" style="${it.color ? `--c:${it.color}` : ''}">${escapeHTML(String(it.icon))}</span>
          <span class="cmdk__item-body"><b>${highlightTerms(it.title, terms)}</b><small>${escapeHTML(it.sub || '')}</small></span>
          <span class="cmdk__item-kind">${escapeHTML(it.kind)}</span>
        </li>`;
      })
      .join('');
    this.input.setAttribute('aria-activedescendant', `cmdk-${this.active}`);
  },

  highlight(scroll = true) {
    $$('.cmdk__item', this.list).forEach((li) => {
      const on = Number(li.dataset.idx) === this.active;
      li.classList.toggle('is-active', on);
      li.setAttribute('aria-selected', String(on));
      if (on && scroll) li.scrollIntoView({ block: 'nearest' });
    });
    this.input.setAttribute('aria-activedescendant', `cmdk-${this.active}`);
  },

  run(i) {
    const it = this.filtered[i];
    if (!it) return;
    this.close();
    setTimeout(() => it.action(), 60);
  }
};

/* ==========================================================================
   23. PARTICULES, CONTACT, FOOTER, RACCOURCIS
   ========================================================================== */
async function initParticles() {
  const ts = lib.tsParticles;
  if (!ts || prefersReducedMotion) return;
  try {
    if (typeof window.loadSlim === 'function') await window.loadSlim(ts);
  } catch (e) {
    console.warn('[tsparticles] preset slim :', e.message);
  }
  const options = (count, colors) => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    detectRetina: true,
    pauseOnOutsideViewport: true,
    particles: {
      number: { value: isMobile() ? Math.round(count / 2) : count, density: { enable: true } },
      color: { value: colors },
      links: { enable: true, distance: 140, color: '#8b7bff', opacity: 0.16, width: 1 },
      move: { enable: true, speed: 0.55, direction: 'none', outModes: { default: 'out' } },
      opacity: { value: { min: 0.2, max: 0.6 } },
      size: { value: { min: 1, max: 2.2 } },
      shape: { type: 'circle' }
    },
    interactivity: {
      events: { onHover: { enable: !isTouch, mode: 'grab' }, resize: { enable: true } },
      modes: { grab: { distance: 170, links: { opacity: 0.45 } } }
    }
  });
  const load = async (id, count, colors) => {
    try {
      await ts.load({ id, options: options(count, colors) });
    } catch (e) {
      console.warn('[tsparticles]', id, e.message);
    }
  };
  once($('#wikiParticles'), () => load('wikiParticles', 70, ['#8b7bff', '#22d3ee']), { rootMargin: '300px' });
  once($('#contactParticles'), () => load('contactParticles', 55, ['#8b7bff', '#f472b6', '#22d3ee']), { rootMargin: '300px' });
}

function initContact() {
  const btn = $('#copyEmail');
  btn?.addEventListener('click', async () => {
    if (await copyText(btn.dataset.email)) {
      btn.classList.add('is-copied');
      $('#copyEmailState').textContent = 'Copié ✓';
      toast('Adresse e-mail copiée');
      setTimeout(() => {
        btn.classList.remove('is-copied');
        $('#copyEmailState').textContent = 'Copier';
      }, 2200);
    } else {
      window.location.href = `mailto:${btn.dataset.email}`;
    }
  });
}

function initFooter() {
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
  const up = $('#footerUptime');
  if (!up) return;
  const start = Date.now();
  const tick = () => {
    const s = Math.floor((Date.now() - start) / 1000);
    up.textContent = `session uptime ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  };
  tick();
  setInterval(tick, 1000);
}

function initGlobalKeys() {
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      Cmdk.toggle();
      return;
    }
    if (e.key === 'Escape') {
      if (!Cmdk.el.hidden) {
        Cmdk.close();
        return;
      }
      if ($('#mobileMenu')?.classList.contains('is-open')) {
        closeMobileMenu();
        return;
      }
      if (Modal.top()) {
        Modal.close();
        return;
      }
    }
    if (typing) return;
    if (e.key === '/' && !Modal.top() && Cmdk.el.hidden) {
      e.preventDefault();
      scrollToTarget('#wiki');
      setTimeout(() => $('#wikiSearch')?.focus({ preventScroll: true }), 500);
    }
  });
}

/* ==========================================================================
   24. ROUTAGE PAR HASH
   ========================================================================== */
const Router = {
  init() {
    this.handle(true);
    window.addEventListener('hashchange', () => this.handle(false));
  },

  handle(initial) {
    const h = decodeURIComponent(location.hash || '');
    let m = /^#wiki\/(.+)$/.exec(h);
    if (m) {
      if (initial) scrollToTarget('#wiki');
      Wiki.open(m[1]);
      return;
    }
    m = /^#projet\/(.+)$/.exec(h);
    if (m) {
      if (initial) scrollToTarget('#projets');
      Projects.open(m[1]);
      return;
    }
    if (initial && h.length > 1) {
      const el = document.getElementById(h.slice(1));
      if (el) setTimeout(() => scrollToTarget(el), 100);
    }
  }
};

/* ==========================================================================
   25. BOOT
   ========================================================================== */
function safe(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch((e) => console.error(`[${name}]`, e));
    return r;
  } catch (e) {
    console.error(`[${name}]`, e);
    return undefined;
  }
}

const idle = (cb, timeout = 600) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout }) : setTimeout(cb, 120));

function boot() {
  safe('store', () => Store.init());
  safe('preloader', () => Preloader.run());
  safe('smooth-scroll', initSmoothScroll);
  safe('anchors', initAnchorLinks);
  safe('marquee', initMarquee);
  safe('timeline', renderTimeline);
  safe('skills', renderSkills);
  safe('switch', initSwitchViz);
  safe('homelab', () => Homelab.init());
  safe('lab-tabs', renderLabTabs);
  safe('projects', () => Projects.init());
  safe('wiki', () => Wiki.init());
  safe('reader', () => Wiki.initReader());
  safe('cmdk', () => Cmdk.init());
  safe('nav', initNav);
  safe('spotlight', initSpotlights);
  safe('tilt', () => applyTilt($$('.tilt')));
  safe('magnetic', initMagnetic);
  safe('console', () => HeroConsole.init());
  safe('counters', initCounters);
  safe('timeline-progress', initTimelineProgress);
  safe('contact', initContact);
  safe('footer', initFooter);
  safe('keys', initGlobalKeys);

  Preloader.onDone(() => {
    safe('hero-intro', heroIntro);
    safe('typed', initTyped);
    safe('reveals', initReveals);
    safe('hero-scroll', initHeroScrollFx);
    safe('router', () => Router.init());
    safe('particles', initParticles);
  });

  idle(() => {
    safe('hero3d', () => Hero3D.init());
    safe('stack3d', () => Stack3D.init());
  });

  window.addEventListener('load', () => {
    lib.ScrollTrigger?.refresh();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => lib.ScrollTrigger?.refresh());

  window.__PORTFOLIO__ = { Store, Wiki, Projects, Homelab, Hero3D, Stack3D, renderMarkdown, highlightLines, version: '4.0.0' };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
