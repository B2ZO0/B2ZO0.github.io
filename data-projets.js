/* ==========================================================================
   ENZO MARECHAL — PORTFOLIO v4
   data-projets.js — Dossiers techniques des 15 projets (étape 2)
   --------------------------------------------------------------------------
   Chaque entrée enrichit le registre PROJECTS d'app.js (même identifiant) :
     svg       → schéma d'architecture affiché dans la modale
     content   → dossier technique complet (markdown du moteur du wiki)
     duration  → durée du projet
     role      → mon rôle
     kpis      → (optionnel) remplace les métriques du registre

   Convention d'écriture du markdown :
   le tag md`…` conserve les antislashs tels quels (chemins Windows, \n…).
   Dans le texte, écrire \` pour un accent grave et \${ pour « ${ ».

   Les éléments issus de la mission en régie sont anonymisés : seuls les
   principes techniques sont décrits, reproduits et validés dans le homelab.
   ========================================================================== */
(function () {
  'use strict';

  const md = (s, ...v) => String.raw(s, ...v).replace(/\\`/g, '`').replace(/\\\$\{/g, '${');

  const DETAILS = (window.PORTFOLIO_PROJECT_DETAILS = window.PORTFOLIO_PROJECT_DETAILS || {});

  /* ------------------------------------------------------------------------
     Palette commune (identique au homelab)
     ------------------------------------------------------------------------ */
  const C = {
    v10: '#8b7bff',
    v20: '#22d3ee',
    v30: '#f472b6',
    v40: '#fbbf24',
    v50: '#34d399',
    wan: '#f87171',
    fw: '#fb7185',
    sw: '#e2e8f0',
    pve: '#ff8a3d',
    ceph: '#f97316',
    ok: '#34d399',
    lime: '#a3e635',
    blue: '#60a5fa',
    sky: '#38bdf8',
    pink: '#e879f9',
    violet: '#c084fc',
    grey: '#94a3b8',
    dim: '#6d7486'
  };

  const FONT = 'Geist, Inter, system-ui, sans-serif';
  const MONO = 'Geist Mono, ui-monospace, Menlo, monospace';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------------------
     Kit de dessin SVG (un kit par schéma → identifiants uniques)
     ------------------------------------------------------------------------ */
  function kit(id) {
    const arrow = `url(#ar-${id})`;
    const k = {
      open(w, h, title) {
        return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}" font-family="${FONT}">
<defs>
<marker id="ar-${id}" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#cbd5e1"/></marker>
<filter id="gl-${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="dots-${id}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.05)"/></pattern>
</defs>
<rect x="0" y="0" width="${w}" height="${h}" fill="url(#dots-${id})"/>
<text x="18" y="26" font-family="${MONO}" font-size="11" fill="#6d7486" letter-spacing="1.6">${esc(title.toUpperCase())}</text>`;
      },
      close() {
        return '</svg>';
      },
      zone(x, y, w, h, label, c, sub = '') {
        return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c}" fill-opacity="0.045" stroke="${c}" stroke-opacity="0.5" stroke-dasharray="5 5"/>
<text x="${x + 12}" y="${y + 19}" font-family="${MONO}" font-size="10.5" font-weight="600" fill="${c}">${esc(label)}</text>${
          sub ? `<text x="${x + w - 12}" y="${y + 19}" text-anchor="end" font-family="${MONO}" font-size="10" fill="#6d7486">${esc(sub)}</text>` : ''
        }</g>`;
      },
      node(x, y, w, h, title, sub, c, o = {}) {
        const subs = Array.isArray(sub) ? sub : sub ? [sub] : [];
        const n = subs.length + 1;
        const startY = y + h / 2 - ((n - 1) * 13) / 2 + 4;
        const fill = o.main ? c : '#0f1218';
        const op = o.main ? 0.16 : 1;
        let t = `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" fill-opacity="${op}" stroke="${c}" stroke-width="${o.main ? 1.8 : 1.2}"${o.main ? ` filter="url(#gl-${id})"` : ''}/>`;
        t += `<rect x="${x}" y="${y + 10}" width="3" height="${Math.max(6, h - 20)}" rx="1.5" fill="${c}"/>`;
        if (o.dot) t += `<circle cx="${x + w - 10}" cy="${y + 10}" r="3" fill="${o.dot}"/>`;
        t += `<text x="${x + 14}" y="${startY}" font-size="12.5" font-weight="600" fill="#eef1f6">${esc(title)}</text>`;
        subs.forEach((s, i) => {
          t += `<text x="${x + 14}" y="${startY + 14 + i * 13}" font-family="${MONO}" font-size="10" fill="#94a3b8">${esc(s)}</text>`;
        });
        return t + '</g>';
      },
      link(pts, c, o = {}) {
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
        let t = `<path d="${d}" fill="none" stroke="${c}" stroke-width="${o.w || 1.6}" stroke-linejoin="round" stroke-linecap="round" opacity="${o.op || 0.9}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="${arrow}"` : ''}${o.both ? ` marker-start="${arrow}"` : ''}>`;
        if (o.flow) t += `<animate attributeName="stroke-dashoffset" from="0" to="-24" dur="${o.flow}s" repeatCount="indefinite"/>`;
        t += '</path>';
        if (o.label) t += k.label(o.label[0], o.label[1], o.label[2], o.lc || '#94a3b8', o.anchor || 'middle');
        return t;
      },
      label(x, y, txt, c = '#94a3b8', anchor = 'middle', size = 10) {
        return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="${size}" fill="${c}" paint-order="stroke" stroke="#08090d" stroke-width="4" stroke-linejoin="round">${esc(txt)}</text>`;
      },
      pill(cx, cy, txt, c) {
        const w = txt.length * 6.3 + 20;
        return `<g><rect x="${cx - w / 2}" y="${cy - 11}" width="${w}" height="22" rx="11" fill="${c}" fill-opacity="0.13" stroke="${c}" stroke-opacity="0.7"/><text x="${cx}" y="${cy + 3.6}" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="600" fill="${c}">${esc(txt)}</text></g>`;
      },
      box(x, y, w, h, title, lines, c) {
        let t = `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#0b0d12" stroke="${c}" stroke-opacity="0.45"/>`;
        t += `<text x="${x + 12}" y="${y + 20}" font-family="${MONO}" font-size="10" font-weight="600" fill="${c}" letter-spacing="0.8">${esc(title.toUpperCase())}</text>`;
        lines.forEach((l, i) => {
          t += `<text x="${x + 12}" y="${y + 40 + i * 15}" font-family="${MONO}" font-size="10.5" fill="#cbd5e1">${esc(l)}</text>`;
        });
        return t + '</g>';
      },
      legend(x, y, items) {
        let cx = x;
        let t = '';
        items.forEach(([c, txt, dash]) => {
          t += `<line x1="${cx}" y1="${y}" x2="${cx + 22}" y2="${y}" stroke="${c}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
          t += `<text x="${cx + 28}" y="${y + 3.5}" font-family="${MONO}" font-size="10" fill="#94a3b8">${esc(txt)}</text>`;
          cx += 40 + txt.length * 6.2;
        });
        return t;
      },
      cyl(cx, y, w, h, title, sub, c) {
        const rx = w / 2;
        const ry = 7;
        return `<g><path d="M${cx - rx},${y + ry} L${cx - rx},${y + h - ry} A${rx},${ry} 0 0 0 ${cx + rx},${y + h - ry} L${cx + rx},${y + ry}" fill="#0f1218" stroke="${c}" stroke-width="1.2"/><ellipse cx="${cx}" cy="${y + ry}" rx="${rx}" ry="${ry}" fill="#151924" stroke="${c}" stroke-width="1.2"/>
<text x="${cx}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="12" font-weight="600" fill="#eef1f6">${esc(title)}</text>${
          sub ? `<text x="${cx}" y="${y + h / 2 + 18}" text-anchor="middle" font-family="${MONO}" font-size="9.5" fill="#94a3b8">${esc(sub)}</text>` : ''
        }</g>`;
      }
    };
    return k;
  }

  /* ========================================================================
     P·01 — CLUSTER PROXMOX VE HAUTE DISPONIBILITÉ
     ======================================================================== */
  DETAILS['proxmox-ha'] = {
    duration: '6 semaines',
    role: 'Conception, déploiement, tests de panne et documentation',
    svg: (() => {
      const k = kit('pve');
      let s = k.open(980, 470, 'Cluster Proxmox VE · 3 nœuds hyperconvergés');
      s += k.zone(20, 44, 690, 130, 'VLAN 10 · MGMT · 10.10.10.0/24', C.v10, 'vmbr0 VLAN-aware · trunk 10-50');
      [['PVE-01', '10.10.10.11', 40], ['PVE-02', '10.10.10.12', 270], ['PVE-03', '10.10.10.13', 500]].forEach(([n, ip, x]) => {
        s += k.node(x, 82, 190, 70, n, [ip, 'i7 8C/16T · 64 Go'], C.pve, { main: true, dot: C.ok });
      });
      const buses = [
        [208, C.v40, 'corosync link0 · 10.10.11.0/24 · lien dédié non routé', ''],
        [236, C.v10, 'corosync link1 · secours via MGMT', '6 4'],
        [264, C.ceph, 'Ceph public + cluster · 10.10.12.0/24 · 2.5 GbE', '']
      ];
      buses.forEach(([y, c, t, dash]) => {
        s += k.link([[40, y], [690, y]], c, { w: 2, dash: dash || undefined });
        s += k.label(690, y - 6, t, c, 'end', 9.5);
      });
      [135, 365, 595].forEach((x) => {
        buses.forEach(([y, c]) => {
          s += k.link([[x, 152], [x, y]], c, { w: 1.2, op: 0.55 });
          s += `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}"/>`;
        });
      });
      [['osd.0', 'NVMe 1 To', 40], ['osd.1', 'NVMe 1 To', 270], ['osd.2', 'NVMe 1 To', 500]].forEach(([o, d, x]) => {
        s += k.cyl(x + 95, 296, 120, 54, o, d, C.ceph);
        s += k.link([[x + 95, 264], [x + 95, 296]], C.ceph, { w: 1.2, op: 0.6 });
      });
      s += k.zone(20, 370, 690, 84, 'POOL RBD vm-pool · size 3 · min_size 2', C.ceph, 'CRUSH failure-domain = host');
      s += k.label(365, 420, '1 copie de chaque bloc par nœud → perte d’un nœud entier sans perte de données', '#cbd5e1', 'middle', 10.5);
      s += k.label(365, 440, 'Ceph MON ×3 · MGR actif/standby · quorum Paxos', '#94a3b8', 'middle', 9.5);
      s += k.box(740, 44, 222, 214, 'Groupes HA', ['grp-dc01   pve1:2 pve2:1', 'grp-dc02   pve2:2 pve3:1', 'grp-infra  pve1 pve2 pve3', '', 'vm:101 DC01      started', 'vm:102 DC02      started', 'vm:110 ZABBIX    started', 'vm:120 VAULTWD   started', 'ct:130 NGINX-RP  started', 'max_relocate 1 · restart 1'], C.v20);
      s += k.box(740, 274, 222, 112, 'Fencing', ['watchdog : softdog', 'self-fence si perte quorum', 'reprise : ~ 120 s', 'migration live < 3 s'], C.fw);
      s += k.node(740, 400, 222, 54, 'PBS-01', '10.10.10.30 · vzdump nocturne', C.v10);
      s += k.legend(40, 462, [[C.v40, 'cluster'], [C.ceph, 'stockage'], [C.v10, 'admin', '6 4']]);
      return s + k.close();
    })(),
    content: md`
## Objectifs mesurables

Le cluster devait répondre à quatre exigences, définies **avant** de choisir la technologie :

| Exigence | Cible | Mesure retenue |
|----------|-------|----------------|
| Tolérance de panne | Perte d'un nœud complet sans perte de données | Coupure secteur d'un nœud en charge |
| Reprise des services critiques | < 3 minutes | Chronométrage ping + ouverture de session AD |
| Maintenance sans interruption | Mise à jour d'un nœud sans arrêt des VM | Migration à chaud avant redémarrage |
| Pas de stockage partagé externe | Aucun NAS / SAN | Stockage hyperconvergé |

> [!INFO] Pourquoi trois nœuds et pas deux ?
> Corosync repose sur un **quorum** (majorité absolue). Avec deux nœuds, la perte de l'un laisse 1 vote sur 2 : pas de majorité, le cluster se bloque. Un troisième nœud (ou un QDevice) est indispensable. Ceph impose la même règle pour ses moniteurs.

## Architecture retenue

Chaque hyperviseur dispose de **quatre interfaces** réparties sur trois réseaux physiques séparés :

| Réseau | Sous-réseau | Rôle | Pourquoi séparé |
|--------|-------------|------|-----------------|
| \`vmbr0\` | trunk VLAN 10-50 | Trafic des VM + management (VLAN 10) | — |
| \`corosync link0\` | \`10.10.11.0/24\` | Battements de cœur du cluster | Corosync exige une latence < 5 ms stable |
| \`corosync link1\` | via VLAN 10 | Lien de secours de corosync | Redondance si le switch dédié tombe |
| \`ceph\` | \`10.10.12.0/24\` | Réplication des blocs Ceph | Un rebalancing Ceph sature un lien 1 GbE |

Les réseaux \`10.10.11.0/24\` et \`10.10.12.0/24\` ne sont **pas routés** : ils n'existent ni sur pfSense ni sur le cœur de réseau, ce qui les rend inaccessibles depuis les autres zones.

## Choix techniques

| Sujet | Option retenue | Alternative écartée | Justification |
|-------|----------------|---------------------|---------------|
| Hyperviseur | Proxmox VE 8.2 | VMware ESXi / vSphere | Fin des licences gratuites ESXi, HA et Ceph intégrés sans surcoût |
| Stockage | Ceph RBD hyperconvergé | ZFS + réplication | La réplication ZFS est asynchrone (perte des dernières minutes), Ceph est synchrone |
| Réplication | \`size 3 / min_size 2\` | \`size 2 / min_size 1\` | \`min_size 1\` accepte des écritures sur une seule copie : risque de corruption |
| Fencing | watchdog (softdog) | IPMI | Suffisant en homelab, aucune dépendance matérielle |
| Sauvegarde | Proxmox Backup Server | vzdump vers partage NFS | Déduplication, chiffrement, vérification intégrés |

## Mise en œuvre

### 1. Réseau des nœuds

Configuration réseau identique sur les trois nœuds (seules les adresses changent) :

~~~ini title="/etc/network/interfaces — PVE-01"
auto lo
iface lo inet loopback

# Port trunk vers SW-CORE-01 (VLAN 10 à 50)
iface enp1s0 inet manual

auto vmbr0
iface vmbr0 inet manual
    bridge-ports enp1s0
    bridge-stp off
    bridge-fd 0
    bridge-vlan-aware yes
    bridge-vids 10 20 30 40 50

# Interface de management dans le VLAN 10
auto vmbr0.10
iface vmbr0.10 inet static
    address 10.10.10.11/24
    gateway 10.10.10.1

# Corosync link0 — switch dédié, non routé
auto enp2s0
iface enp2s0 inet static
    address 10.10.11.11/24
    mtu 1500

# Ceph — 2.5 GbE, jumbo frames
auto enp3s0
iface enp3s0 inet static
    address 10.10.12.11/24
    mtu 9000
~~~

> [!WARN] MTU 9000
> Les jumbo frames doivent être activées **de bout en bout** (cartes et switch). Un seul maillon à 1500 provoque des pertes silencieuses et des OSD qui « flappent ». Test systématique : \`ping -M do -s 8972 10.10.12.12\`.

### 2. Création du cluster

~~~terminal title="PVE-01 puis PVE-02 / PVE-03"
root@pve1:~# pvecm create lab-cluster --link0 10.10.11.11 --link1 10.10.10.11
Corosync Cluster Engine Authentication key generator.
Writing corosync key to /etc/corosync/authkey.
Writing corosync config to /etc/pve/corosync.conf
Restart corosync and cluster filesystem
root@pve2:~# pvecm add 10.10.10.11 --link0 10.10.11.12 --link1 10.10.10.12
Please enter superuser (root) password for '10.10.10.11': ********
Establishing API connection with host '10.10.10.11'
Login succeeded.
Request addition of this node
Join request OK, finishing setup locally
successfully added node 'pve2' to cluster.
~~~

Extrait de la configuration générée, avec les deux liens :

~~~ini title="/etc/pve/corosync.conf (extrait)"
nodelist {
  node {
    name: pve1
    nodeid: 1
    quorum_votes: 1
    ring0_addr: 10.10.11.11
    ring1_addr: 10.10.10.11
  }
  node {
    name: pve2
    nodeid: 2
    quorum_votes: 1
    ring0_addr: 10.10.11.12
    ring1_addr: 10.10.10.12
  }
  node {
    name: pve3
    nodeid: 3
    quorum_votes: 1
    ring0_addr: 10.10.11.13
    ring1_addr: 10.10.10.13
  }
}

totem {
  cluster_name: lab-cluster
  config_version: 3
  interface {
    linknumber: 0
    knet_link_priority: 20
  }
  interface {
    linknumber: 1
    knet_link_priority: 10
  }
  ip_version: ipv4-6
  link_mode: passive
  secauth: on
  version: 2
}
~~~

\`link_mode: passive\` avec des priorités : le lien dédié est utilisé en priorité, le VLAN 10 ne sert qu'en secours.

### 3. Stockage Ceph

~~~bash title="Déploiement Ceph (depuis PVE-01, puis mon/mgr/osd sur chaque nœud)"
# Installation des paquets Ceph Reef (dépôt sans abonnement)
pveceph install --repository no-subscription

# Initialisation : réseau public et réseau de cluster
pveceph init --network 10.10.12.0/24 --cluster-network 10.10.12.0/24

# Un moniteur et un manager par nœud (à exécuter sur pve1, pve2, pve3)
pveceph mon create
pveceph mgr create

# Un OSD par nœud sur le NVMe dédié (disque vierge)
ceph-volume lvm zap /dev/nvme1n1 --destroy
pveceph osd create /dev/nvme1n1

# Pool répliqué 3 fois, écritures refusées sous 2 copies
pveceph pool create vm-pool --size 3 --min_size 2 --pg_autoscale_mode on --add_storages
~~~

~~~terminal title="État de santé Ceph"
root@pve1:~# ceph -s
  cluster:
    id:     4f1c2d9a-7b3e-4c51-9a0e-2d6b8e1f3a77
    health: HEALTH_OK

  services:
    mon: 3 daemons, quorum pve1,pve2,pve3 (age 6d)
    mgr: pve1(active, since 6d), standbys: pve2, pve3
    osd: 3 osds: 3 up (since 6d), 3 in (since 6d)

  data:
    pools:   2 pools, 33 pgs
    objects: 58.42k objects, 226 GiB
    usage:   681 GiB used, 2.1 TiB / 2.7 TiB avail
    pgs:     33 active+clean
~~~

### 4. Haute disponibilité

Proxmox VE 8.2 ne dispose pas encore de règles d'anti-affinité natives. Je les ai **émulées avec des groupes HA à priorités** : DC01 préfère \`pve1\`, DC02 préfère \`pve2\`. Les deux contrôleurs de domaine ne se retrouvent jamais sur le même nœud en fonctionnement normal.

~~~bash title="Configuration HA"
# Groupes avec priorités (plus le nombre est élevé, plus le nœud est préféré)
ha-manager groupadd grp-dc01  --nodes "pve1:2,pve2:1,pve3:0"
ha-manager groupadd grp-dc02  --nodes "pve2:2,pve3:1,pve1:0"
ha-manager groupadd grp-infra --nodes "pve1,pve2,pve3"

# Ressources HA
ha-manager add vm:101 --group grp-dc01  --state started --max_restart 1 --max_relocate 1
ha-manager add vm:102 --group grp-dc02  --state started --max_restart 1 --max_relocate 1
ha-manager add vm:110 --group grp-infra --state started
ha-manager add vm:120 --group grp-infra --state started
ha-manager add ct:130 --group grp-infra --state started
~~~

### 5. Sécurisation de l'hyperviseur

- Interface web \`8006\` accessible **uniquement depuis le VLAN 10** (règle pfSense + pare-feu Proxmox au niveau datacenter).
- Authentification à deux facteurs TOTP sur les comptes \`@pam\` et \`@pve\`.
- Compte \`root@pam\` réservé à la maintenance ; un compte nominatif \`enzo@pve\` avec le rôle \`PVEAdmin\` pour l'exploitation.
- Jeton d'API dédié à PBS et à Ansible, avec privilèges minimaux.

~~~bash title="Pare-feu Proxmox au niveau du datacenter"
cat > /etc/pve/firewall/cluster.fw <<'EOF'
[OPTIONS]
enable: 1
policy_in: DROP

[IPSET admin]
10.10.10.0/24 # VLAN MGMT
10.99.0.0/24  # VPN WireGuard admin

[RULES]
IN ACCEPT -source +admin -p tcp -dport 8006 -log nolog # Web UI
IN ACCEPT -source +admin -p tcp -dport 22   -log nolog # SSH
IN ACCEPT -source 10.10.20.50 -p tcp -dport 10050      # Agent Zabbix
IN ACCEPT -p icmp
EOF
pve-firewall restart && pve-firewall status
~~~

## Tests de validation

| # | Scénario | Résultat attendu | Résultat obtenu |
|---|----------|------------------|-----------------|
| T1 | Migration à chaud de DC01 vers pve2 | Aucune perte de ping | 0 paquet perdu, bascule 2,1 s |
| T2 | Arrêt propre de pve1 (maintenance) | VM migrées automatiquement | OK avec \`shutdown_policy=migrate\` |
| T3 | **Coupure secteur** de pve1 | Redémarrage des VM HA ailleurs | Services de retour en 1 min 52 s |
| T4 | Débranchement du lien corosync dédié | Bascule sur link1, quorum conservé | Quorum maintenu, aucune VM impactée |
| T5 | Retrait à chaud du NVMe OSD de pve3 | \`HEALTH_WARN\` puis reconstruction | Données servies, recovery automatique |
| T6 | Restauration d'une VM depuis PBS | VM identique fonctionnelle | Restauration en 11 min (80 Go) |

~~~terminal title="Pendant le test T3 (pve1 coupé)"
root@pve2:~# pvecm status | grep -E "Nodes|Quorate|Expected"
Nodes:            2
Quorate:          Yes
Expected votes:   3
root@pve2:~# ha-manager status
quorum OK
master pve2 (active, Sat Oct 12 14:21:07 2026)
lrm pve1 (old timestamp - dead?, Sat Oct 12 14:18:55 2026)
lrm pve2 (active, Sat Oct 12 14:21:05 2026)
lrm pve3 (active, Sat Oct 12 14:21:06 2026)
service vm:101 (pve2, started)
service vm:102 (pve2, started)
service vm:110 (pve3, started)
~~~

> [!SUCCESS] Bilan
> Tous les critères sont atteints. Le temps de reprise (≈ 2 min) correspond au délai de fencing par watchdog (60 s) plus le démarrage de Windows Server.

## Difficultés rencontrées

**1. Nœud « fencé » sans raison apparente.** Lors d'une sauvegarde lourde, \`pve3\` redémarrait. La cause : corosync et la sauvegarde partageaient la même carte, la latence dépassait le token timeout. **Solution :** lien corosync physiquement dédié, sauvegarde sur le VLAN 10 seulement.

**2. \`HEALTH_WARN: clock skew detected\`.** Les moniteurs Ceph tolèrent 50 ms de décalage. **Solution :** chrony sur les trois nœuds, synchronisés sur pfSense, lui-même synchronisé sur des serveurs NTP publics.

**3. Pool Ceph plein à 85 %.** Ceph bloque les écritures à 95 % et passe en alerte à 85 %. Avec trois copies, la capacité utile n'est que d'un tiers du brut. **Solution :** alertes Zabbix dès 70 %, nettoyage des templates et snapshots orphelins.

## Compétences mobilisées

- Conception d'une architecture haute disponibilité et calcul de quorum
- Réseau : séparation des flux, VLAN-aware bridge, MTU
- Stockage distribué : réplication, domaines de défaillance CRUSH
- Méthodologie : définition des critères d'acceptation **avant** la réalisation, tests de panne destructifs
- Documentation d'exploitation (procédures de maintenance, de reprise et de remplacement d'un nœud)

## Évolutions prévues

- [ ] Passer en Proxmox VE 9 pour bénéficier des règles d'affinité HA natives
- [ ] Ajouter un QDevice externe pour supporter la perte simultanée de deux nœuds en mode dégradé
- [ ] SDN Proxmox (zones VXLAN) pour expérimenter la micro-segmentation
`
  };

  /* ========================================================================
     P·02 — PFSENSE CARP + VPN
     ======================================================================== */
  DETAILS['pfsense-carp'] = {
    duration: '4 semaines',
    role: 'Conception de la politique de filtrage, mise en cluster, VPN',
    svg: (() => {
      const k = kit('carp');
      let s = k.open(980, 480, 'Cluster pfSense CARP · VPN nomades');
      s += k.node(400, 46, 180, 52, 'Internet · FAI', 'WAN 203.0.113.8/29', C.wan, { main: true });
      s += k.link([[490, 98], [490, 124]], C.wan, { w: 2 });
      s += k.node(380, 124, 220, 38, 'Switch WAN (VLAN 900)', '', C.dim);
      s += k.link([[430, 162], [300, 162], [300, 196]], C.wan, { w: 2, label: [365, 154, '.11'] });
      s += k.link([[550, 162], [680, 162], [680, 196]], C.wan, { w: 2, label: [615, 154, '.12'] });
      s += k.pill(490, 186, 'VIP WAN .10 · vhid 1', C.v40);
      s += k.node(190, 196, 220, 78, 'PFSENSE-01', ['MASTER · advskew 0', 'SYNC 172.16.0.1/30'], C.fw, { main: true, dot: C.ok });
      s += k.node(570, 196, 220, 78, 'PFSENSE-02', ['BACKUP · advskew 100', 'SYNC 172.16.0.2/30'], C.fw, { main: true, dot: C.v40 });
      s += k.link([[410, 236], [570, 236]], C.v40, { w: 2, dash: '5 4', flow: 1, both: true, arrow: true, label: [490, 228, 'pfsync + XMLRPC'] });
      s += k.label(490, 252, 'câble direct', C.dim, 'middle', 9);
      s += k.link([[300, 274], [300, 320], [470, 320], [470, 346]], C.v10, { w: 2.2 });
      s += k.link([[680, 274], [680, 320], [510, 320], [510, 346]], C.v10, { w: 2.2 });
      s += k.label(300, 300, 'LAGG0 · LACP (2 × 1 GbE)', C.v10, 'middle', 9.5);
      s += k.label(680, 300, 'LAGG0 · LACP (2 × 1 GbE)', C.v10, 'middle', 9.5);
      s += k.node(390, 346, 200, 50, 'SW-CORE-01', 'Po1 / Po2 · trunk 10-50', C.sw);
      const vl = [['VLAN 10', C.v10, 'vhid 10'], ['VLAN 20', C.v20, 'vhid 20'], ['VLAN 30', C.v30, 'vhid 30'], ['VLAN 40', C.v40, 'vhid 40'], ['VLAN 50', C.v50, 'vhid 50']];
      vl.forEach(([n, c, v], i) => {
        const x = 230 + i * 110;
        s += k.link([[490, 396], [490, 414], [x, 414], [x, 428]], c, { w: 1.4 });
        s += k.pill(x, 440, `${n} · .1`, c);
        s += k.label(x, 466, v, C.dim, 'middle', 9);
      });
      s += k.box(20, 44, 200, 128, 'Nomade WireGuard', ['wg0 10.99.0.0/24', 'UDP 51820 → VIP WAN', 'clé par appareil', 'AllowedIPs = 10.10.10.0/24', 'keepalive 25 s'], C.pink);
      s += k.link([[220, 108], [400, 72]], C.pink, { w: 1.8, dash: '6 5', flow: 1.2, arrow: true });
      s += k.box(760, 44, 200, 128, 'OpenVPN SSL', ['tun 10.98.0.0/24', 'UDP 1194 · AES-256-GCM', 'certificat + RADIUS (NPS)', 'CRL vérifiée', 'push route 10.10.20.0/24'], C.v40);
      s += k.link([[760, 108], [580, 72]], C.v40, { w: 1.8, dash: '6 5', flow: 1.2, arrow: true });
      s += k.box(20, 300, 200, 112, 'Services HA', ['Relais DHCP → DC01 / DC02', 'DNS Resolver (Unbound)', 'NTP pour tout le LAN', 'Outbound NAT → VIP WAN'], C.ok);
      s += k.box(760, 300, 200, 112, 'Journalisation', ['syslog → WAZUH 514/udp', 'SNMPv3 → ZABBIX', 'pfBlockerNG (réputation)', 'alertes CARP par mail'], C.v20);
      return s + k.close();
    })(),
    content: md`
## Objectifs

- Supprimer le **point unique de défaillance** que représente un pare-feu seul : il est à la fois la passerelle de chaque VLAN et l'accès Internet.
- Appliquer une politique **« tout est refusé sauf ce qui est explicitement autorisé »** entre les zones.
- Offrir un accès d'administration à distance sécurisé, sans exposer aucune interface d'administration sur Internet.

## Principe de fonctionnement de CARP

CARP (*Common Address Redundancy Protocol*) partage une **adresse IP virtuelle** (VIP) entre plusieurs pare-feu. Le maître répond aux requêtes ARP pour cette VIP et envoie des annonces toutes les secondes ; si le secondaire ne reçoit plus d'annonces pendant ~3 s, il prend le rôle de maître.

Trois mécanismes complémentaires sont nécessaires :

| Mécanisme | Rôle | Sans lui… |
|-----------|------|-----------|
| **CARP** | Bascule des adresses VIP | Les postes perdent leur passerelle |
| **pfsync** | Réplication de la table d'états | Toutes les connexions TCP en cours sont coupées |
| **XMLRPC** | Synchronisation de la configuration | Les deux pare-feu divergent au fil des modifications |

> [!INFO] Pourquoi un /29 sur le WAN ?
> CARP sur le WAN nécessite **trois adresses publiques** : une par pare-feu (.11, .12) et la VIP partagée (.10). C'est le point le plus souvent oublié lors du chiffrage d'un projet de pare-feu redondé.

## Plan d'adressage du cluster

| Interface | PFSENSE-01 | PFSENSE-02 | VIP CARP | VHID |
|-----------|-----------|-----------|----------|------|
| WAN | \`203.0.113.11\` | \`203.0.113.12\` | \`203.0.113.10\` | 1 |
| MGMT (lagg0.10) | \`10.10.10.252\` | \`10.10.10.253\` | \`10.10.10.1\` | 10 |
| SRV (lagg0.20) | \`10.10.20.252\` | \`10.10.20.253\` | \`10.10.20.1\` | 20 |
| DMZ (lagg0.30) | \`10.10.30.252\` | \`10.10.30.253\` | \`10.10.30.1\` | 30 |
| VOIP (lagg0.40) | \`10.10.40.252\` | \`10.10.40.253\` | \`10.10.40.1\` | 40 |
| PXE (lagg0.50) | \`10.10.50.252\` | \`10.10.50.253\` | \`10.10.50.1\` | 50 |
| SYNC (igc3) | \`172.16.0.1/30\` | \`172.16.0.2/30\` | — | — |

Convention : le VHID reprend le numéro de VLAN, ce qui rend les journaux immédiatement lisibles.

## Mise en œuvre

### 1. Agrégat LACP et interfaces VLAN

Dans *Interfaces › Assignments › LAGGs* : \`lagg0\` en protocole **LACP** sur \`igc1\` + \`igc2\`. Puis *VLANs* : une sous-interface par VLAN sur \`lagg0\`. Côté switch :

~~~cisco title="SW-CORE-01 — agrégats vers les deux pare-feu"
interface range GigabitEthernet1/0/1 - 2
 description PFSENSE-01 lagg0
 channel-group 1 mode active
interface range GigabitEthernet1/0/3 - 4
 description PFSENSE-02 lagg0
 channel-group 2 mode active
!
interface Port-channel1
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50
interface Port-channel2
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50
~~~

### 2. Synchronisation (sur PFSENSE-01 uniquement)

*System › High Avail. Sync* :

~~~ini title="Paramètres de synchronisation"
[State Synchronization]
Synchronize states        = coché
Synchronize interface     = SYNC
pfsync Synchronize Peer IP = 172.16.0.2

[Configuration Synchronization (XMLRPC)]
Synchronize Config to IP  = 172.16.0.2
Remote System Username    = admin-sync
Remote System Password    = ******** (compte dédié, privilèges XMLRPC uniquement)
Toggle All                = Users, Certificates, Firewall rules, Aliases, NAT,
                            DHCP, Virtual IPs, OpenVPN, DNS Resolver, WireGuard
~~~

> [!DANGER] Sens de synchronisation
> XMLRPC se configure **uniquement sur le maître**. L'activer aussi sur le secondaire crée une boucle où le secondaire peut écraser la configuration de production.

### 3. Adresses virtuelles CARP

*Firewall › Virtual IPs* sur PFSENSE-01 : une VIP par interface, mot de passe CARP unique, \`advskew 0\`. Après synchronisation, PFSENSE-02 reçoit automatiquement les mêmes VIP avec \`advskew 100\`.

### 4. NAT sortant et DHCP

Le NAT sortant doit utiliser la **VIP WAN**. Sinon, après une bascule, les réponses reviennent vers l'IP du pare-feu tombé :

~~~ini title="Firewall › NAT › Outbound (mode hybride)"
Interface   Source            Translation        Description
WAN         10.10.0.0/16      203.0.113.10 (VIP) NAT de tous les VLAN via la VIP CARP
WAN         10.99.0.0/24      203.0.113.10 (VIP) Clients WireGuard (accès Internet désactivé côté client)
~~~

Le DHCP des VLAN 40 et 50 est servi par **DC01 et DC02 en failover** (répartition de charge 50/50). pfSense assure uniquement le **relais** (*Services › DHCP Relay*) vers \`10.10.20.10\` et \`10.10.20.11\`, et chaque étendue distribue la VIP \`.1\` comme passerelle.

> [!WARN] Relais ou serveur, pas les deux
> Sur pfSense, le relais DHCP ne peut pas être activé si le serveur DHCP intégré l'est sur une interface. Centraliser le DHCP sur Windows Server a réglé le problème et permis de journaliser les baux dans l'AD.

### 5. Politique de filtrage

Organisation des règles, appliquée sur chaque interface :

1. Règles **anti-usurpation** et blocage des listes de réputation (pfBlockerNG)
2. Autorisations **explicites** par alias (hôtes, réseaux, ports)
3. Blocage de \`RFC1918\` pour interdire tout accès latéral non prévu
4. Autorisation Internet limitée (80/443) si la zone en a besoin
5. Refus final **journalisé** (envoyé vers Wazuh)

Les alias (\`AD_PORTS\`, \`RFC1918\`, \`SIP_PROVIDER\`, \`ZBX_TARGETS\`…) rendent les règles lisibles et évitent les adresses en dur.

### 6. VPN d'administration WireGuard

~~~ini title="VPN › WireGuard › Tunnel tun_wg0 (extrait)"
[Interface]
Address    = 10.99.0.1/24
ListenPort = 51820
# Écoute sur la VIP CARP WAN : le tunnel survit à la bascule
PrivateKey = <générée par pfSense>

[Peer]  # laptop-enzo
PublicKey  = 3sQ1...=
AllowedIPs = 10.99.0.10/32

[Peer]  # smartphone-enzo
PublicKey  = Hk9p...=
AllowedIPs = 10.99.0.11/32
~~~

~~~ini title="Configuration du client (laptop-enzo)"
[Interface]
PrivateKey = <clé privée du poste>
Address    = 10.99.0.10/32
DNS        = 10.10.20.10

[Peer]
PublicKey           = <clé publique de tun_wg0>
Endpoint            = vpn.enzomarechal.fr:51820
AllowedIPs          = 10.10.10.0/24, 10.10.20.0/24
PersistentKeepalive = 25
~~~

Le tunnel ne donne accès qu'au VLAN MGMT et SRV, et une règle sur l'interface WireGuard limite encore les flux au **bastion** (SSH) et aux interfaces web d'administration.

### 7. OpenVPN avec double authentification

OpenVPN est conservé pour les postes qui ne peuvent pas installer WireGuard : certificat client émis par une **CA dédiée au VPN** et authentification RADIUS vers NPS (compte AD membre de \`GG_VPN_Admins\`). Les deux facteurs sont donc « ce que je possède » (certificat) et « ce que je sais » (mot de passe AD).

## Tests de validation

~~~terminal title="Shell pfSense — état CARP avant le test"
[2.7.2-RELEASE][admin@pfsense-01]/root: ifconfig | grep -E "carp:|vhid"
	carp: MASTER vhid 1 advbase 1 advskew 0
	carp: MASTER vhid 10 advbase 1 advskew 0
	carp: MASTER vhid 20 advbase 1 advskew 0
	carp: MASTER vhid 30 advbase 1 advskew 0
	carp: MASTER vhid 40 advbase 1 advskew 0
	carp: MASTER vhid 50 advbase 1 advskew 0
~~~

| # | Scénario | Résultat attendu | Résultat obtenu |
|---|----------|------------------|-----------------|
| T1 | *Enter Persistent CARP Maintenance Mode* sur le maître | Bascule propre | 1 ping perdu sur 600 |
| T2 | Débranchement électrique du maître pendant un \`scp\` de 4 Go | Le transfert continue | Transfert terminé sans erreur (pfsync) |
| T3 | Appel 3CX en cours pendant la bascule | Appel maintenu | Micro-coupure < 1 s, appel conservé |
| T4 | Retour du maître | Reprise du rôle MASTER | Préemption après 30 s de stabilité |
| T5 | Connexion WireGuard pendant la bascule | Tunnel rétabli seul | Handshake renouvelé en 4 s |
| T6 | Depuis la DMZ : \`nc -zv 10.10.20.10 445\` | Refusé et journalisé | Bloqué, alerte visible dans Wazuh |

> [!TIP] Test de non-régression
> Après chaque modification de règle, un script lancé depuis le bastion rejoue une série de \`nc -zv\` vers des ports autorisés et interdits, et compare le résultat à une matrice attendue. Une règle trop permissive est détectée immédiatement.

## Difficultés rencontrées

**1. CARP en « split-brain » (deux maîtres).** Les annonces CARP sont du multicast (protocole 112). Le DHCP snooping et l'IGMP snooping du switch les filtraient sur un VLAN. **Solution :** \`no ip igmp snooping vlan 40\` puis réactivation avec un querier configuré.

**2. Asymétrie de routage après bascule.** Le serveur 3CX avait une route statique vers l'IP physique \`.252\`. **Solution :** règle stricte, toutes les routes et passerelles pointent vers les **VIP**, jamais vers les adresses physiques.

**3. Mises à jour du cluster.** Mettre à jour le maître en premier provoque deux bascules. **Procédure retenue :** mise à jour du secondaire, vérification, maintenance CARP du maître, mise à jour du maître, sortie de maintenance.

## Compétences mobilisées

- Haute disponibilité réseau : CARP, VRRP (même logique), synchronisation d'états
- Conception d'une politique de filtrage inter-zones et rédaction d'une matrice de flux
- VPN : WireGuard (cryptographie moderne, clés par appareil) et OpenVPN (PKI, RADIUS)
- Agrégation de liens LACP de bout en bout
- Procédures de changement et de mise à jour sans interruption

## Évolutions prévues

- [ ] IDS/IPS Suricata en mode *inline* sur le WAN et la DMZ
- [ ] Authentification des administrateurs pfSense via RADIUS + TOTP
- [ ] Export de la configuration chiffrée vers Git à chaque modification
`
  };

  /* ========================================================================
     P·03 — ACTIVE DIRECTORY & DURCISSEMENT GPO
     ======================================================================== */
  DETAILS['ad-gpo'] = {
    duration: '5 semaines',
    role: 'Conception du modèle d’administration, GPO, scripts d’audit',
    svg: (() => {
      const k = kit('ad');
      let s = k.open(980, 480, 'Domaine lab.enzomarechal.fr · modèle en tiers');
      s += k.node(360, 46, 260, 56, 'lab.enzomarechal.fr', 'Niveau fonctionnel 2016 · Corbeille AD', C.violet, { main: true });
      s += k.node(150, 54, 170, 44, 'DC01', '10.10.20.10 · FSMO', C.v20, { dot: C.ok });
      s += k.node(660, 54, 170, 44, 'DC02', '10.10.20.11', C.v20, { dot: C.ok });
      s += k.link([[320, 76], [360, 76]], C.v20, { w: 1.4 });
      s += k.link([[620, 76], [660, 76]], C.v20, { w: 1.4 });
      s += k.link([[235, 98], [235, 118], [745, 118], [745, 98]], C.v20, { dash: '4 4', flow: 1.4, label: [490, 132, 'réplication AD multi-maître · DFSR SYSVOL'] });
      const tiers = [
        [40, 'TIER 0', 'Contrôle du domaine', C.fw, ['DC, PKI, comptes adm-t0', 'PAW d’administration', 'Admins du domaine (vide)', 'Protected Users']],
        [360, 'TIER 1', 'Serveurs & applications', C.v40, ['Serveurs membres', 'comptes adm-t1', 'GG_Srv_Admins', 'LAPS serveurs']],
        [680, 'TIER 2', 'Postes & utilisateurs', C.v50, ['Postes de travail', 'comptes adm-t2 (support)', 'Utilisateurs standards', 'LAPS postes']]
      ];
      tiers.forEach(([x, t, sub, c, lines]) => {
        s += k.zone(x, 156, 260, 170, t, c, sub);
        lines.forEach((l, i) => {
          s += `<text x="${x + 16}" y="${196 + i * 22}" font-family="${MONO}" font-size="11" fill="#cbd5e1">› ${esc(l)}</text>`;
        });
        s += k.link([[490, 102], [490, 140], [x + 130, 140], [x + 130, 156]], c, { w: 1.4, op: 0.7 });
      });
      s += k.label(490, 344, '✕ un compte d’un tier ne peut jamais ouvrir de session sur un tier inférieur (GPO « Interdire l’ouverture de session »)', C.fw, 'middle', 10);
      s += k.box(40, 362, 290, 104, 'GPO ordinateurs', ['C_Tous_Durcissement-Reseau', 'C_Postes_LAPS', 'C_Postes_BitLocker', 'C_Serveurs_Audit-Avance'], C.v20);
      s += k.box(345, 362, 290, 104, 'GPO sécurité du domaine', ['Default Domain Policy (mdp)', 'PSO comptes à privilèges', 'C_DC_Durcissement', 'C_Tier-Isolation'], C.fw);
      s += k.box(650, 362, 290, 104, 'GPO utilisateurs', ['U_Tous_Lecteurs-Reseau', 'U_Tous_Imprimantes', 'U_Restrictions-Panneau', 'U_Fond-ecran-entreprise'], C.v50);
      return s + k.close();
    })(),
    content: md`
## Objectifs

- Construire un annuaire **lisible et maintenable** : on doit savoir où créer un objet sans réfléchir.
- Appliquer le **moindre privilège** : plus personne n'utilise un compte « Admins du domaine » au quotidien.
- Neutraliser les techniques d'attaque AD les plus courantes (vol d'identifiants, mouvement latéral, relais NTLM).
- Tout rendre **reproductible** en PowerShell.

## Structure des unités d'organisation

~~~ascii title="Arborescence des OU"
lab.enzomarechal.fr
├── _ADMIN                          (Tier 0 — délégation restreinte)
│   ├── Comptes-T0                  adm-t0-*  (membres de Protected Users)
│   ├── Comptes-T1                  adm-t1-*
│   ├── Comptes-T2                  adm-t2-*
│   ├── Groupes-Admin
│   └── PAW                         postes d'administration dédiés
├── SERVEURS                        (Tier 1)
│   ├── Infrastructure              GLPI, ZABBIX, WAZUH...
│   ├── Applications
│   └── Deploiement                 WDS-MDT, WSUS
├── POSTES                          (Tier 2)
│   ├── Bureautique
│   ├── Atelier                     postes de production (GPO spécifiques)
│   └── Portables                   BitLocker + VPN
├── UTILISATEURS
│   ├── Direction
│   ├── Production
│   ├── Support
│   └── Comptes-Services            gMSA et comptes de service
├── GROUPES
│   ├── Globaux                     GG_*
│   └── Domaine-Local               DL_*
└── DESACTIVES                      comptes et ordinateurs en attente de suppression
~~~

> [!TIP] Pourquoi séparer les ordinateurs par type ?
> Une GPO se lie à une OU. Placer postes et serveurs dans la même OU obligerait à filtrer chaque GPO par groupe de sécurité : c'est la première source d'erreurs de stratégies de groupe.

## Modèle de droits AGDLP

**A**ccounts → **G**lobal groups → **D**omain **L**ocal groups → **P**ermissions.

| Étape | Objet | Exemple | Contient |
|-------|-------|---------|----------|
| A | Compte utilisateur | \`m.durand\` | — |
| G | Groupe global « métier » | \`GG_Compta_Utilisateurs\` | Les comptes du service |
| DL | Groupe domaine local « ressource » | \`DL_Partage-Compta_RW\` | Les groupes globaux autorisés |
| P | Permission NTFS / partage | Modification sur \`\\SRV-FIC\Compta\` | Le groupe DL uniquement |

L'avantage : quand un service demande l'accès à un partage, on ajoute **un groupe global dans un groupe domaine local**, sans jamais toucher aux ACL NTFS.

## Création de la structure en PowerShell

~~~powershell title="New-LabADStructure.ps1"
#Requires -Modules ActiveDirectory
<#
.SYNOPSIS
    Crée l'arborescence d'OU, les groupes AGDLP de base et protège les OU contre la suppression.
#>
param(
    [string]$DomainDN = (Get-ADDomain).DistinguishedName
)

$tree = @(
    '_ADMIN', '_ADMIN/Comptes-T0', '_ADMIN/Comptes-T1', '_ADMIN/Comptes-T2', '_ADMIN/Groupes-Admin', '_ADMIN/PAW',
    'SERVEURS', 'SERVEURS/Infrastructure', 'SERVEURS/Applications', 'SERVEURS/Deploiement',
    'POSTES', 'POSTES/Bureautique', 'POSTES/Atelier', 'POSTES/Portables',
    'UTILISATEURS', 'UTILISATEURS/Direction', 'UTILISATEURS/Production', 'UTILISATEURS/Support', 'UTILISATEURS/Comptes-Services',
    'GROUPES', 'GROUPES/Globaux', 'GROUPES/Domaine-Local',
    'DESACTIVES'
)

foreach ($item in $tree) {
    $parts  = $item -split '/'
    $name   = $parts[-1]
    $parent = $DomainDN
    if ($parts.Count -gt 1) {
        $parentPath = $parts[0..($parts.Count - 2)]
        [array]::Reverse($parentPath)
        $parent = (($parentPath | ForEach-Object { "OU=$_" }) -join ',') + ",$DomainDN"
    }
    $dn = "OU=$name,$parent"
    if (-not (Get-ADOrganizationalUnit -Filter "DistinguishedName -eq '$dn'" -ErrorAction SilentlyContinue)) {
        New-ADOrganizationalUnit -Name $name -Path $parent -ProtectedFromAccidentalDeletion $true
        Write-Host "[+] OU créée : $dn" -ForegroundColor Green
    } else {
        Write-Host "[=] OU existante : $dn" -ForegroundColor DarkGray
    }
}

# Groupes AGDLP d'exemple
$gg = "OU=Globaux,OU=GROUPES,$DomainDN"
$dl = "OU=Domaine-Local,OU=GROUPES,$DomainDN"
New-ADGroup -Name 'GG_Compta_Utilisateurs' -GroupScope Global      -GroupCategory Security -Path $gg
New-ADGroup -Name 'DL_Partage-Compta_RW'   -GroupScope DomainLocal -GroupCategory Security -Path $dl
Add-ADGroupMember -Identity 'DL_Partage-Compta_RW' -Members 'GG_Compta_Utilisateurs'
~~~

Le script est **idempotent** : il peut être relancé sans erreur ni doublon.

## Jeu de GPO de durcissement

| GPO | Cible | Paramètres clés | Menace traitée |
|-----|-------|-----------------|----------------|
| \`C_Tous_Durcissement-Reseau\` | Tous les ordinateurs | LLMNR et NetBIOS désactivés, SMBv1 retiré, signature SMB exigée | Empoisonnement LLMNR / relais NTLM |
| \`C_Postes_LAPS\` | POSTES, SERVEURS | Windows LAPS, mot de passe 20 caractères, rotation 30 j, sauvegarde AD | Mot de passe admin local identique partout |
| \`C_Tier-Isolation\` | Chaque tier | *Interdire l'ouverture de session* aux comptes des autres tiers | Vol d'identifiants privilégiés |
| \`C_Serveurs_Audit-Avance\` | SERVEURS, DC | Audit des ouvertures de session, gestion des comptes, Kerberos | Détection (Wazuh) |
| \`C_Postes_BitLocker\` | Portables | TPM + PIN, sauvegarde de la clé dans AD | Vol de matériel |
| \`C_Tous_Pare-feu\` | Tous | Pare-feu Windows actif, RDP limité au VLAN MGMT | Mouvement latéral |
| \`C_DC_Durcissement\` | DC | Spooler désactivé, LDAP signing + channel binding | PrintNightmare, relais LDAP |

### Windows LAPS

~~~powershell title="Activation de Windows LAPS (intégré depuis avril 2023)"
# Extension du schéma (une seule fois, compte Admins du schéma)
Update-LapsADSchema -Verbose

# Les ordinateurs des OU POSTES et SERVEURS peuvent écrire leur propre mot de passe
Set-LapsADComputerSelfPermission -Identity 'OU=POSTES,DC=lab,DC=enzomarechal,DC=fr'
Set-LapsADComputerSelfPermission -Identity 'OU=SERVEURS,DC=lab,DC=enzomarechal,DC=fr'

# Seul le groupe support tier 2 peut lire les mots de passe des postes
Set-LapsADReadPasswordPermission -Identity 'OU=POSTES,DC=lab,DC=enzomarechal,DC=fr' \`
    -AllowedPrincipals 'LAB\GG_Support_T2'

# Vérification sur un poste
Get-LapsADPassword -Identity 'PC-BUR-014' -AsPlainText
~~~

### Isolation des tiers

Dans \`C_Tier-Isolation\` liée à l'OU **POSTES** : *Configuration ordinateur › Stratégies › Paramètres Windows › Paramètres de sécurité › Stratégies locales › Attribution des droits utilisateur* :

- *Interdire l'ouverture d'une session locale* → \`GG_Admins_T0\`, \`GG_Admins_T1\`
- *Interdire l'ouverture de session par les services Bureau à distance* → \`GG_Admins_T0\`, \`GG_Admins_T1\`
- *Interdire l'accès à cet ordinateur à partir du réseau* → \`GG_Admins_T0\`

Un administrateur du domaine qui tente d'ouvrir une session sur un poste reçoit un refus : son empreinte NTLM ou son ticket Kerberos ne peut donc jamais être volé sur un poste compromis.

> [!SEC] Groupe Protected Users
> Les comptes \`adm-t0-*\` sont membres de **Protected Users** : pas de NTLM, pas de délégation, pas de mise en cache des identifiants, tickets Kerberos de 4 h. C'est l'un des gains de sécurité les plus forts pour un coût quasi nul.

### Désactivation de LLMNR et NetBIOS

- LLMNR : *Modèles d'administration › Réseau › Client DNS › Désactiver la résolution de noms multidiffusion* = **Activé**
- NetBIOS : option DHCP 001 \`0x2\` (désactivé) sur les étendues, et script de démarrage pour les adresses statiques :

~~~powershell title="Disable-NetBIOS.ps1 (script de démarrage GPO)"
Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter 'IPEnabled = True' |
    ForEach-Object {
        # 2 = désactiver NetBIOS sur TCP/IP
        Invoke-CimMethod -InputObject $_ -MethodName SetTcpipNetbios -Arguments @{ TcpipNetbiosOptions = 2 } | Out-Null
    }
~~~

## Script d'audit des comptes à privilèges

~~~powershell title="Get-PrivilegedAudit.ps1 — exécuté chaque lundi, rapport envoyé par mail"
$groups = 'Admins du domaine', 'Administrateurs de l’entreprise', 'Administrateurs du schéma',
          'Administrateurs', 'Opérateurs de compte', 'Opérateurs de sauvegarde', 'Propriétaires créateurs de la stratégie de groupe'

$report = foreach ($g in $groups) {
    Get-ADGroupMember -Identity $g -Recursive -ErrorAction SilentlyContinue |
        Where-Object objectClass -eq 'user' |
        ForEach-Object {
            $u = Get-ADUser $_ -Properties LastLogonDate, PasswordLastSet, PasswordNeverExpires, Enabled, MemberOf
            [pscustomobject]@{
                Groupe              = $g
                Compte              = $u.SamAccountName
                Actif               = $u.Enabled
                DerniereConnexion   = $u.LastLogonDate
                MdpModifie          = $u.PasswordLastSet
                MdpNExpireJamais    = $u.PasswordNeverExpires
                ProtectedUsers      = [bool]($u.MemberOf -match 'Protected Users')
            }
        }
}

$alertes = $report | Where-Object { $_.MdpNExpireJamais -or -not $_.ProtectedUsers -or $_.DerniereConnexion -lt (Get-Date).AddDays(-90) }
$report  | Export-Csv "C:\Audit\privileges_$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation -Encoding UTF8
if ($alertes) {
    Send-MailMessage -SmtpServer 10.10.30.25 -From 'audit-ad@lab.enzomarechal.fr' -To 'enzo@lab.enzomarechal.fr' \`
        -Subject "[AD] $($alertes.Count) anomalie(s) sur les comptes à privilèges" \`
        -Body ($alertes | Format-Table -AutoSize | Out-String) -Encoding UTF8
}
~~~

## Tests de validation

~~~terminal title="Poste PC-BUR-014 — vérification des GPO appliquées"
PS C:\> gpresult /r /scope computer | Select-String "GPO|Stratégies"
    Objets Stratégie de groupe appliqués
        C_Tous_Durcissement-Reseau
        C_Postes_LAPS
        C_Tier-Isolation
        C_Tous_Pare-feu
        Default Domain Policy
PS C:\> Get-SmbServerConfiguration | Select EnableSMB1Protocol, RequireSecuritySignature
EnableSMB1Protocol RequireSecuritySignature
------------------ ------------------------
             False                     True
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | \`adm-t0-enzo\` ouvre une session sur un poste | Refus | « La méthode d'ouverture de session n'est pas autorisée » |
| T2 | Responder sur le VLAN postes pendant 1 h | Aucune requête LLMNR / NBT-NS capturée | 0 hash capturé |
| T3 | Lecture du mot de passe LAPS par un utilisateur standard | Refus | Attribut vide |
| T4 | Mot de passe admin local de deux postes | Différents | 100 % uniques |
| T5 | Audit PingCastle | Pas de point critique | Score de risque divisé par 4 par rapport à l'état initial |
| T6 | Ajout d'un compte à *Admins du domaine* | Alerte immédiate | Alerte Wazuh niveau 12 + mail |

## Difficultés rencontrées

**1. Applications métier cassées par la signature SMB.** Un vieux copieur scannant vers un partage ne supportait pas la signature. **Solution :** exception ciblée sur un serveur de scan dédié, documentée dans le registre des écarts de sécurité, plutôt que de désactiver la mesure pour tout le domaine.

**2. Restriction NTLM.** Bloquer NTLM directement aurait cassé des applications. **Démarche :** mode **audit** d'abord (*Restreindre NTLM : auditer le trafic NTLM entrant*), analyse des journaux 8001-8004 pendant trois semaines, puis blocage progressif.

## Compétences mobilisées

- Conception d'annuaire et délégation fine des droits
- Sécurité AD : modèle en tiers, Protected Users, LAPS, durcissement réseau
- Gestion du changement : audit avant blocage, registre des exceptions
- Automatisation et audit en PowerShell

## Évolutions prévues

- [ ] Comptes de service gérés (gMSA) pour toutes les tâches planifiées
- [ ] Authentication Policies / Silos pour verrouiller les comptes tier 0 sur les PAW
- [ ] Audit périodique automatisé avec PingCastle et suivi du score dans Grafana
`
  };

  /* ========================================================================
     P·04 — DÉPLOIEMENT AUTOMATISÉ WDS / MDT + HP BCU
     ======================================================================== */
  DETAILS['mdt-wds'] = {
    duration: 'Industrialisé sur 2 mois, amélioré en continu',
    role: 'Conception de la chaîne, scripts, documentation N1',
    svg: (() => {
      const k = kit('mdt');
      let s = k.open(980, 470, 'Chaîne de déploiement zero-touch');
      s += k.zone(20, 44, 300, 200, 'VLAN 50 · PXE · 10.10.50.0/24', C.v50, 'préparation');
      s += k.node(40, 76, 260, 56, 'Poste HP neuf', ['UEFI · boot réseau IPv4', 'DHCP .100 → .199'], C.grey);
      s += k.node(40, 160, 260, 62, 'WDS-MDT · 10.10.50.10', ['TFTP / proxyDHCP 4011', 'LiteTouchPE_x64.wim'], C.v50, { main: true });
      s += k.link([[170, 132], [170, 160]], C.v50, { w: 1.8, arrow: true, flow: 1, dash: '5 4', label: [236, 150, 'PXE · TFTP'] });
      s += k.zone(360, 44, 260, 200, 'VLAN 20 · SRV', C.v20);
      s += k.node(380, 76, 220, 52, 'DC01 / DC02', 'DHCP failover · DNS', C.v20);
      s += k.node(380, 160, 220, 62, 'Active Directory', ['OU=POSTES', 'svc-mdt-join (délégué)'], C.violet);
      s += k.link([[300, 104], [380, 104]], C.v50, { w: 1.6, arrow: true, label: [340, 96, 'relais'] });
      s += k.link([[300, 196], [380, 196]], C.violet, { w: 1.6, dash: '4 4', arrow: true, label: [340, 188, 'join'] });
      s += k.box(660, 44, 300, 200, 'DeploymentShare$', ['Operating Systems  W11 23H2 Ent', 'Out-of-Box Drivers', '  Windows 11 x64\\HP\\<modèle>', 'Applications       14 paquets', 'Scripts            HP BCU, LAPS', 'Task Sequences     W11-PROD', 'Logs$              SLShare', 'Monitoring         :9800'], C.v50);
      s += k.link([[300, 186], [330, 186], [330, 266], [810, 266], [810, 244]], C.v50, { w: 1.2, op: 0.6 });
      const steps = [
        ['1', 'Validation', 'modèle, AC, réseau'],
        ['2', 'HP BCU', 'Secure Boot, TPM'],
        ['3', 'Partition', 'UEFI GPT'],
        ['4', 'Install OS', 'image WIM'],
        ['5', 'Pilotes', 'profil par modèle'],
        ['6', 'Domaine', 'OU cible'],
        ['7', 'Apps', '14 paquets'],
        ['8', 'WSUS', 'cumulatives'],
        ['9', 'Finalisation', 'GLPI, BitLocker']
      ];
      s += k.label(490, 300, 'SÉQUENCE DE TÂCHES W11-PROD · ≈ 35 MIN · 0 INTERVENTION', C.v50, 'middle', 10.5);
      steps.forEach(([n, t, sub], i) => {
        const x = 24 + i * 106;
        s += `<g><rect x="${x}" y="318" width="96" height="74" rx="10" fill="#0f1218" stroke="${C.v50}" stroke-opacity="${0.35 + i * 0.07}"/><text x="${x + 10}" y="338" font-family="${MONO}" font-size="10" fill="${C.v50}">0${n}</text><text x="${x + 10}" y="358" font-size="12" font-weight="600" fill="#eef1f6">${esc(t)}</text><text x="${x + 10}" y="376" font-family="${MONO}" font-size="9.5" fill="#94a3b8">${esc(sub)}</text></g>`;
        if (i < steps.length - 1) s += k.link([[x + 96, 355], [x + 106, 355]], C.v50, { w: 1.4, arrow: true });
      });
      s += k.node(24, 412, 300, 44, 'WSUS · 10.10.50.15', 'mises à jour pendant la TS', C.v50);
      s += k.node(340, 412, 300, 44, 'Bascule en production', 'brassage vers VLAN métier', C.ok);
      s += k.node(656, 412, 300, 44, 'Ticket GLPI clôturé', 'inventaire remonté par l’agent', C.blue);
      return s + k.close();
    })(),
    content: md`
## Contexte

> [!NOTE] Confidentialité
> Ce projet est issu de ma mission en régie sur un site industriel. Les noms, adresses et volumes réels du client ne sont pas publiés : l'architecture décrite ici a été **reproduite à l'identique dans mon homelab** (VLAN 50) pour pouvoir la documenter et la tester librement.

Avant le projet, préparer un poste prenait **une demi-journée** : installation depuis une clé USB, pilotes téléchargés à la main, BIOS configuré poste par poste, logiciels installés un par un. Résultat : des configurations hétérogènes, des oublis (BitLocker, agent d'inventaire) et un temps technicien considérable lors des renouvellements de parc.

**Objectif :** un poste branché sur le réseau de préparation doit ressortir **prêt à l'emploi, conforme et inventorié**, sans aucune intervention entre le démarrage PXE et l'écran de connexion.

## Architecture

| Composant | Hôte | Rôle |
|-----------|------|------|
| WDS | \`WDS-MDT\` (10.10.50.10) | Boot PXE UEFI, distribution de l'image WinPE |
| MDT 8456 + ADK 11 | \`WDS-MDT\` | Séquences de tâches, pilotes, applications, règles |
| DHCP | DC01 / DC02 (relais pfSense) | Adressage du VLAN 50 |
| WSUS | \`WSUS\` (10.10.50.15) | Mises à jour pendant le déploiement |
| Active Directory | DC01 / DC02 | Jonction au domaine dans l'OU cible |
| HP BCU | Script MDT | Configuration du BIOS avant installation |

> [!INFO] Pourquoi un VLAN dédié au déploiement ?
> Le boot PXE s'appuie sur des diffusions (broadcast) et des protocoles non chiffrés (TFTP). Isoler ces flux dans un VLAN sans accès Internet évite qu'un poste de production redémarre par erreur sur le réseau, et limite l'exposition des identifiants du compte de jonction.

## DHCP et PXE en environnement routé

Le serveur DHCP et le serveur WDS ne sont pas sur le même sous-réseau. Deux approches existent :

| Approche | Principe | Verdict |
|----------|----------|---------|
| Options DHCP 66 / 67 | Le DHCP indique le serveur et le fichier de boot | Écartée : un seul fichier pour BIOS **et** UEFI, comportement aléatoire selon les firmwares |
| **WDS dans le VLAN + relais DHCP** | Le poste reçoit son IP via le relais, WDS répond lui-même au broadcast PXE | **Retenue** : WDS choisit automatiquement \`wdsmgfw.efi\` ou \`pxeboot.n12\` selon l'architecture |

Le serveur WDS étant **dans** le VLAN 50, il entend directement les requêtes PXE : aucune option DHCP n'est nécessaire.

## Mise en œuvre

### 1. Installation des rôles

~~~powershell title="WDS-MDT — préparation du serveur"
# Rôle WDS
Install-WindowsFeature -Name WDS -IncludeManagementTools

# Initialisation de WDS (dossier RemoteInstall sur un volume de données)
wdsutil /Initialize-Server /RemInst:"D:\RemoteInstall"
wdsutil /Set-Server /AnswerClients:All
wdsutil /Set-Server /Transport /EnableTftpVariableWindowExtension:Yes

# ADK 11 + module WinPE puis MDT 8456 (installation silencieuse)
Start-Process -Wait 'D:\Sources\adksetup.exe' -ArgumentList '/quiet /features OptionId.DeploymentTools'
Start-Process -Wait 'D:\Sources\adkwinpesetup.exe' -ArgumentList '/quiet /features OptionId.WindowsPreinstallationEnvironment'
Start-Process -Wait msiexec.exe -ArgumentList '/i D:\Sources\MicrosoftDeploymentToolkit_x64.msi /qn'

# Partage de déploiement en lecture seule pour le compte utilisé par WinPE
New-SmbShare -Name 'DeploymentShare$' -Path 'D:\DeploymentShare' -ReadAccess 'LAB\svc-mdt-ro' -FullAccess 'LAB\GG_Admins_T1'
New-SmbShare -Name 'Logs$' -Path 'D:\Logs' -ChangeAccess 'LAB\svc-mdt-ro'
~~~

### 2. Comptes de service à privilèges minimaux

| Compte | Usage | Droits |
|--------|-------|--------|
| \`svc-mdt-ro\` | Connexion de WinPE au partage | Lecture sur \`DeploymentShare$\`, écriture sur \`Logs$\` |
| \`svc-mdt-join\` | Jonction au domaine | **Délégation** : créer / supprimer des objets ordinateur dans \`OU=POSTES\` uniquement |

~~~powershell title="Délégation de la jonction au domaine sur une seule OU"
$ou = 'OU=POSTES,DC=lab,DC=enzomarechal,DC=fr'
dsacls $ou /I:T /G 'LAB\svc-mdt-join:CCDC;computer'
dsacls $ou /I:S /G 'LAB\svc-mdt-join:RPWP;;computer' 'LAB\svc-mdt-join:CA;Reset Password;computer'
dsacls $ou /I:S /G 'LAB\svc-mdt-join:WS;Validated write to DNS host name;computer'
dsacls $ou /I:S /G 'LAB\svc-mdt-join:WS;Validated write to service principal name;computer'
~~~

> [!SEC] Identifiants dans l'image de boot
> Les identifiants de \`Bootstrap.ini\` sont lisibles dans l'image WinPE. D'où un compte **lecture seule**, un mot de passe long et aléatoire, et un VLAN 50 inaccessible depuis le reste du réseau.

### 3. Fichiers de règles

~~~ini title="Bootstrap.ini"
[Settings]
Priority=Default

[Default]
DeployRoot=\\WDS-MDT\DeploymentShare$
UserDomain=LAB
UserID=svc-mdt-ro
UserPassword=**********
KeyboardLocalePE=040c:0000040c
SkipBDDWelcome=YES
~~~

~~~ini title="CustomSettings.ini" hl="2,24,25,36-42"
[Settings]
Priority=Model, Default
Properties=MyCustomProperty

[Default]
_SMSTSORGNAME=Déploiement poste · %OSDComputerName%
OSInstall=YES
TaskSequenceID=W11-PROD
SkipTaskSequence=YES
SkipBDDWelcome=YES
SkipComputerName=YES
OSDComputerName=#Left("PC-%SerialNumber%",15)#
SkipDomainMembership=YES
JoinDomain=lab.enzomarechal.fr
DomainAdmin=svc-mdt-join
DomainAdminDomain=LAB
DomainAdminPassword=**********
MachineObjectOU=OU=Bureautique,OU=POSTES,DC=lab,DC=enzomarechal,DC=fr
SkipLocaleSelection=YES
UILanguage=fr-FR
UserLocale=fr-FR
KeyboardLocale=040c:0000040c
SkipTimeZone=YES
TimeZoneName=Romance Standard Time
DriverSelectionProfile=Nothing
DriverGroup001=Windows 11 x64\%Make%\%Model%
SkipApplications=YES
SkipUserData=YES
SkipBitLocker=YES
SkipCapture=YES
SkipProductKey=YES
SkipAdminPassword=YES
SkipSummary=YES
SkipFinalSummary=NO
FinishAction=REBOOT
WSUSServer=http://10.10.50.15:8530
SLShare=\\WDS-MDT\Logs$
SLShareDynamicLogging=\\WDS-MDT\Logs$\%OSDComputerName%
EventService=http://WDS-MDT:9800
HideShell=YES
ApplyGPOPack=NO
DoNotCreateExtraPartition=YES
WindowsUpdate=YES

[HP EliteBook 840 G10 Notebook PC]
MachineObjectOU=OU=Portables,OU=POSTES,DC=lab,DC=enzomarechal,DC=fr

[HP Elite Mini 800 G9 Desktop PC]
MachineObjectOU=OU=Atelier,OU=POSTES,DC=lab,DC=enzomarechal,DC=fr
~~~

Points clés :

- \`DriverSelectionProfile=Nothing\` **désactive** l'injection automatique de tous les pilotes ; \`DriverGroup001\` n'injecte que ceux du dossier correspondant **exactement** au modèle détecté.
- Le nom de poste est dérivé du **numéro de série** : unique, stable et retrouvable dans GLPI.
- Une section par modèle place automatiquement les portables et les postes d'atelier dans la bonne OU, donc sous les bonnes GPO.

### 4. Organisation des pilotes

~~~ascii title="Out-of-Box Drivers (le nom des dossiers = valeur WMI exacte)"
Out-of-Box Drivers
└── Windows 11 x64
    └── HP
        ├── HP EliteBook 840 G10 Notebook PC     ← (Get-CimInstance Win32_ComputerSystem).Model
        ├── HP EliteBook 840 G9 Notebook PC
        ├── HP Elite Mini 800 G9 Desktop PC
        ├── HP ProDesk 400 G7 Small Form Factor PC
        └── ...
~~~

Les packs de pilotes proviennent du **HP Driver Pack** officiel de chaque modèle, importés tels quels : jamais de pilote récupéré sur un site tiers.

### 5. Configuration BIOS avec HP BCU

Le BIOS est configuré **avant** l'installation de Windows, depuis WinPE :

~~~ini title="Scripts\HPBCU\W11-Standard.REPSET"
BIOSConfig 1.0
;
; Configuration BIOS standard des postes HP — déploiement Windows 11
;
Configure Legacy Support and Secure Boot
	*Legacy Support Disable and Secure Boot Enable
	Legacy Support Enable and Secure Boot Disable
TPM Device
	*Available
	Hidden
TPM State
	*Enable
	Disable
TPM Activation Policy
	F1 to Boot
	Allow user to reject
	*No prompts
Virtualization Technology (VTx)
	*Enable
	Disable
Network (PXE) Boot
	*Enable
	Disable
Fast Boot
	Enable
	*Disable
~~~

~~~powershell title="Scripts\HPBCU\Invoke-HPBCU.ps1 — étape de la séquence de tâches"
<#
    Applique la configuration BIOS standard sur les postes HP.
    - Si aucun mot de passe BIOS n'est défini : le définit.
    - Sinon : applique la configuration avec le mot de passe existant.
#>
$ErrorActionPreference = 'Stop'
$tsenv   = New-Object -ComObject Microsoft.SMS.TSEnvironment
$logDir  = $tsenv.Value('LogPath')
$bcu     = Join-Path $PSScriptRoot 'BiosConfigUtility64.exe'
$config  = Join-Path $PSScriptRoot 'W11-Standard.REPSET'
$pwdFile = Join-Path $PSScriptRoot 'bios-pwd.bin'   # généré avec HPQPswd64.exe, chiffré

$make = (Get-CimInstance Win32_ComputerSystem).Manufacturer
if ($make -notmatch 'HP|Hewlett') {
    Write-Output "Constructeur $make : étape ignorée."
    exit 0
}

$setupPwd = Get-CimInstance -Namespace root\HP\InstrumentedBIOS -ClassName HP_BIOSPassword |
            Where-Object Name -eq 'Setup Password'

if ($setupPwd.IsSet -eq 0) {
    Write-Output 'Aucun mot de passe BIOS : définition puis application.'
    & $bcu /nspwdfile:"$pwdFile" /log:"$logDir\hpbcu-setpwd.log"
}

& $bcu /set:"$config" /cpwdfile:"$pwdFile" /log:"$logDir\hpbcu-config.log"
$code = $LASTEXITCODE
Write-Output "Code de retour HP BCU : $code"

# 0 = succès ; tout autre code est remonté dans les journaux MDT et bloque la séquence
if ($code -ne 0) { exit $code }
exit 0
~~~

> [!TIP] TPM Activation Policy = No prompts
> Sans ce paramètre, l'activation du TPM ou de Secure Boot déclenche au redémarrage un écran demandant d'appuyer sur F1 : la séquence s'arrête et attend un technicien. C'était la dernière intervention manuelle restante.

### 6. Séquence de tâches W11-PROD

| Phase | Étape | Détail |
|-------|-------|--------|
| Validation | Contrôle du modèle | Refus si le modèle n'a pas de dossier de pilotes (évite un poste sans réseau) |
| Validation | Alimentation | Portables : arrêt si non branchés sur secteur |
| Pré-installation | **HP BCU** | \`Invoke-HPBCU.ps1\` puis redémarrage |
| Pré-installation | Partitionnement | UEFI / GPT, partition de récupération en fin de disque |
| Installation | Image | Windows 11 Entreprise 23H2 (WIM de référence) |
| Installation | Pilotes | \`DriverGroup001\` = modèle exact |
| Post-installation | Domaine | Jonction dans l'OU de la section modèle |
| Applications | 14 paquets | Navigateur, suite bureautique, client VPN, agent RMM, GLPI Agent… |
| Mises à jour | Windows Update | Via WSUS, 2 passes |
| Finalisation | BitLocker | Activation TPM, clé sauvegardée dans AD |
| Finalisation | Nettoyage | Suppression des journaux locaux et du compte de déploiement |

### 7. Supervision des déploiements

Le **Monitoring MDT** (\`EventService\`, port 9800) affiche en temps réel l'étape de chaque poste dans la console Deployment Workbench. Les journaux complets (\`BDD.log\`, \`SMSTS.log\`) remontent automatiquement dans \`\\WDS-MDT\Logs$\<nom du poste>\` grâce à \`SLShareDynamicLogging\`.

## Tests de validation

~~~terminal title="Poste déployé — vérifications post-déploiement"
PS C:\> (Get-CimInstance Win32_ComputerSystem) | Select Name, Domain, Model
Name            Domain                 Model
----            ------                 -----
PC-5CG3301XYZ   lab.enzomarechal.fr    HP EliteBook 840 G10 Notebook PC
PS C:\> Confirm-SecureBootUEFI
True
PS C:\> Get-Tpm | Select TpmPresent, TpmReady
TpmPresent TpmReady
---------- --------
      True     True
PS C:\> Get-BitLockerVolume C: | Select VolumeStatus, ProtectionStatus
VolumeStatus     ProtectionStatus
------------     ----------------
FullyEncrypted                 On
PS C:\> Get-PnpDevice -Status ERROR
PS C:\>
~~~

- [x] Aucun périphérique en erreur (\`Get-PnpDevice -Status ERROR\` vide)
- [x] Poste dans la bonne OU et GPO appliquées
- [x] Secure Boot et TPM actifs, BitLocker chiffré, clé dans l'AD
- [x] Agent GLPI : poste visible dans l'inventaire moins de 10 min après la fin
- [x] Journaux du déploiement présents dans \`Logs$\`

## Résultats

| Indicateur | Avant | Après |
|------------|-------|-------|
| Temps technicien par poste | ≈ 4 h | **≈ 10 min** (déballage + brassage) |
| Durée totale | demi-journée | ≈ 35 min sans surveillance |
| Postes en parallèle | 1 à 2 | limité par le nombre de prises du VLAN 50 |
| BIOS conformes | variable | **100 %** |
| Oubli d'agent / de chiffrement | fréquent | **aucun** (étapes bloquantes) |

## Difficultés rencontrées

**1. Pilotes réseau absents de WinPE.** Les modèles récents avaient des cartes Intel I219 non reconnues par WinPE : le poste démarrait en PXE puis perdait le réseau. **Solution :** profil de sélection \`WinPE x64\` contenant uniquement les pilotes réseau et stockage, injecté dans l'image de boot, puis régénération et remplacement de l'image dans WDS.

**2. TFTP très lent sur certains sites.** **Solution :** activation de l'extension de fenêtre variable TFTP (\`EnableTftpVariableWindowExtension\`), téléchargement de l'image WinPE divisé par quatre.

**3. Noms de modèles HP variables.** Un même modèle remonte parfois avec un suffixe différent selon la révision du BIOS. **Solution :** l'étape de validation journalise la valeur WMI exacte et bloque la séquence avec un message clair ; le technicien ajoute un dossier de pilotes, sans deviner.

## Compétences mobilisées

- Déploiement Windows à grande échelle (WDS, MDT, ADK, WinPE)
- Réseau : PXE, DHCP en environnement routé, isolement d'un VLAN technique
- Scripting PowerShell en contexte de séquence de tâches (COM TSEnvironment, codes de retour)
- Gestion BIOS constructeur (HP BCU, WMI HP)
- Délégation AD au moindre privilège
- Rédaction d'une procédure N1 : un technicien junior déploie un poste sans connaître MDT

## Évolutions prévues

- [ ] Migration progressive vers **Windows Autopilot** + Intune pour les portables nomades
- [ ] Mise à jour automatisée de l'image de référence chaque mois (séquence de capture)
- [ ] Remontée de l'état des déploiements dans Grafana via les journaux MDT
`
  };

  /* ========================================================================
     P·05 — VAULTWARDEN + REVERSE PROXY NGINX
     ======================================================================== */
  DETAILS['vaultwarden'] = {
    duration: '2 semaines',
    role: 'Déploiement, durcissement, sauvegarde et accompagnement des utilisateurs',
    svg: (() => {
      const k = kit('vw');
      let s = k.open(980, 450, 'Vaultwarden · publication sécurisée en DMZ');
      s += k.node(30, 70, 170, 58, 'Clients Bitwarden', ['web · extension', 'mobile · desktop'], C.grey);
      s += k.node(250, 70, 170, 58, 'PFSENSE (CARP)', ['NAT 443 → .30.10', 'pfBlockerNG'], C.fw, { main: true });
      s += k.link([[200, 99], [250, 99]], C.pink, { w: 2, arrow: true, flow: 1, dash: '6 4', label: [225, 90, '443'] });
      s += k.zone(460, 44, 500, 250, 'VLAN 30 · DMZ · 10.10.30.0/24', C.v30, 'aucune connexion initiée vers le LAN');
      s += k.node(480, 76, 210, 72, 'NGINX-RP · 10.10.30.10', ['TLS 1.3 · HSTS · CSP', 'rate-limit /identity', '/admin → VLAN 10 seul'], C.v30, { main: true });
      s += k.link([[420, 99], [480, 99]], C.pink, { w: 2, arrow: true, flow: 1, dash: '6 4' });
      s += k.node(730, 76, 210, 72, 'VAULTWARDEN · .30.20', ['Docker · 1.31', ':8080 (RP uniquement)', 'SQLite · Argon2'], C.v30);
      s += k.link([[690, 112], [730, 112]], C.v30, { w: 1.8, arrow: true, label: [710, 104, 'HTTP'] });
      s += k.box(730, 168, 210, 110, 'Conteneur durci', ['SIGNUPS_ALLOWED=false', 'utilisateur non-root', 'volume ./data seul', 'nftables : 8080 ← .10'], C.v30);
      s += k.node(480, 176, 210, 50, 'SMTP-RELAY · .30.25', 'invitations · 2FA mail', C.v30);
      s += k.link([[835, 148], [835, 158], [585, 158], [585, 176]], C.v30, { w: 1.2, op: 0.6, dash: '4 4' });
      s += k.node(480, 240, 210, 40, 'certbot DNS-01', 'renouvellement auto', C.ok);
      s += k.zone(20, 320, 420, 116, 'VLAN 10 · MGMT', C.v10);
      s += k.node(40, 352, 180, 62, 'PBS-01', ['sauvegarde chiffrée', 'age · rétention 30 j'], C.v10);
      s += k.node(240, 352, 180, 62, 'BASTION', ['accès /admin', 'via VPN WireGuard'], C.v10);
      s += k.link([[835, 278], [835, 300], [130, 300], [130, 352]], C.v10, { w: 1.4, dash: '5 4', arrow: true, label: [480, 292, 'sauvegarde chiffrée nocturne (tirée par PBS)'] });
      s += k.zone(460, 320, 500, 116, 'VLAN 20 · SRV', C.v20);
      s += k.node(480, 352, 210, 62, 'WAZUH', ['journaux Nginx + VW', 'alerte brute force'], C.v20);
      s += k.node(730, 352, 210, 62, 'ZABBIX', ['certificat < 15 j', 'healthcheck HTTP'], C.v20);
      return s + k.close();
    })(),
    content: md`
## Contexte et objectifs

Constat de départ, rencontré en entreprise comme dans beaucoup de PME : des mots de passe partagés dans des fichiers Excel, des post-it et des messageries. Aucune traçabilité, aucune révocation possible au départ d'un collaborateur.

**Objectifs :**

- Un coffre-fort d'équipe **auto-hébergé** (les secrets ne quittent pas l'infrastructure).
- Compatible avec les clients **Bitwarden officiels** (navigateur, mobile, poste de travail).
- Partage par **collections** avec des droits par équipe.
- Exposition Internet maîtrisée : **aucun port** du conteneur directement accessible.

## Choix techniques

| Critère | Vaultwarden | Bitwarden officiel (self-hosted) |
|---------|-------------|----------------------------------|
| Ressources | ≈ 50 Mo de RAM, 1 conteneur | ≈ 2 Go, une dizaine de conteneurs + MSSQL |
| Organisations / collections | Oui | Oui (selon licence) |
| Clients officiels | Compatibles | Natifs |
| Audit de sécurité | Communautaire | Audits tiers publiés |

> [!WARN] Point de vigilance assumé
> Vaultwarden est une réimplémentation communautaire. Ce choix est compensé par une surface d'exposition réduite (reverse proxy, DMZ, rate-limiting), un suivi des versions et un chiffrement de bout en bout qui reste assuré **côté client** : le serveur ne voit jamais les secrets en clair.

## Mise en œuvre

### 1. Préparation de l'hôte

~~~bash title="VAULTWARDEN (10.10.30.20) — Debian 12"
# Docker depuis le dépôt officiel
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin sqlite3 age zstd

# Arborescence
install -d -m 0750 /opt/vaultwarden/data
~~~

### 2. Conteneur

~~~yaml title="/opt/vaultwarden/docker-compose.yml"
services:
  vaultwarden:
    image: vaultwarden/server:1.31.0
    container_name: vaultwarden
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/data
    ports:
      # Publié uniquement sur l'IP de la DMZ, filtré par nftables
      - "10.10.30.20:8080:80"
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
~~~

~~~ini title="/opt/vaultwarden/.env (chmod 600)"
DOMAIN=https://vault.enzomarechal.fr
SIGNUPS_ALLOWED=false
INVITATIONS_ALLOWED=true
INVITATION_ORG_NAME=Lab Enzo Marechal
SHOW_PASSWORD_HINT=false
PASSWORD_ITERATIONS=600000
ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$<sel>$<hash>'
SMTP_HOST=10.10.30.25
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_FROM=vault@enzomarechal.fr
SMTP_USERNAME=vault@enzomarechal.fr
SMTP_PASSWORD=**********
IP_HEADER=X-Real-IP
LOG_FILE=/data/vaultwarden.log
LOG_LEVEL=warn
EXTENDED_LOGGING=true
LOGIN_RATELIMIT_SECONDS=60
LOGIN_RATELIMIT_MAX_BURST=5
ADMIN_RATELIMIT_SECONDS=300
ADMIN_RATELIMIT_MAX_BURST=3
~~~

Le jeton d'administration n'est jamais stocké en clair : il est **haché en Argon2** par Vaultwarden lui-même.

~~~terminal title="Génération du hash du jeton d'administration"
root@vaultwarden:/opt/vaultwarden# docker compose run --rm vaultwarden /vaultwarden hash
Generate an Argon2id PHC string using the 'bitwarden' preset:

Password:
Confirm Password:

ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$Wk1...$Yq9...'
~~~

### 3. Pare-feu de l'hôte

Seul le reverse proxy peut joindre le port 8080, même au sein de la DMZ :

~~~bash title="/etc/nftables.conf (extrait)"
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    ip saddr 10.10.10.50 tcp dport 22 accept comment "SSH depuis le bastion"
    ip saddr 10.10.30.10 tcp dport 8080 accept comment "Reverse proxy uniquement"
    ip saddr 10.10.20.50 tcp dport 10050 accept comment "Agent Zabbix"
    icmp type echo-request limit rate 5/second accept
  }
}
~~~

> [!WARN] Docker et le pare-feu
> Docker insère ses propres règles et peut **contourner** le pare-feu de l'hôte pour les ports publiés. Publier le port sur une IP précise (\`10.10.30.20:8080\`) et vérifier avec un scan depuis une autre machine de la DMZ est indispensable.

### 4. Reverse proxy Nginx

~~~nginx title="/etc/nginx/sites-available/vault.enzomarechal.fr"
limit_req_zone $binary_remote_addr zone=vw_login:10m rate=10r/m;

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      "";
}

upstream vaultwarden {
    server 10.10.30.20:8080;
    keepalive 2;
}

server {
    listen 80;
    server_name vault.enzomarechal.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vault.enzomarechal.fr;

    ssl_certificate     /etc/letsencrypt/live/vault.enzomarechal.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.enzomarechal.fr/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling        on;
    ssl_stapling_verify on;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "same-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    client_max_body_size 525M;

    # Limitation des tentatives de connexion
    location = /identity/connect/token {
        limit_req zone=vw_login burst=5 nodelay;
        proxy_pass http://vaultwarden;
        include /etc/nginx/snippets/vw-proxy.conf;
    }

    # Interface d'administration : réseau d'administration uniquement
    location /admin {
        allow 10.10.10.0/24;
        allow 10.99.0.0/24;
        deny  all;
        proxy_pass http://vaultwarden;
        include /etc/nginx/snippets/vw-proxy.conf;
    }

    location / {
        proxy_pass http://vaultwarden;
        include /etc/nginx/snippets/vw-proxy.conf;
    }
}
~~~

~~~nginx title="/etc/nginx/snippets/vw-proxy.conf"
proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        $connection_upgrade;
~~~

Depuis la version 1.29, les WebSockets (synchronisation en temps réel entre les clients) passent par le **port principal** : l'ancien port 3012 n'est plus nécessaire.

Le certificat est obtenu en **DNS-01** : aucun port 80 n'a besoin d'être ouvert pour le renouvellement, et le certificat peut être émis avant même la publication du service.

### 5. Sauvegarde chiffrée

~~~bash title="/usr/local/sbin/vw-backup.sh (timer systemd quotidien, 02:30)"
#!/usr/bin/env bash
# Sauvegarde cohérente de Vaultwarden, compressée et chiffrée avec age
set -euo pipefail

DATA=/opt/vaultwarden/data
DEST=/srv/backup/vaultwarden
STAMP=$(date +%F_%H%M)
RECIPIENT="age1qz7l0...x8k2"          # clé publique ; la clé privée est hors ligne
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$DEST"

# Copie à chaud cohérente de la base SQLite (API de sauvegarde, pas un simple cp)
sqlite3 "$DATA/db.sqlite3" ".backup '$TMP/vw-db-backup.sqlite3'"
sqlite3 "$TMP/vw-db-backup.sqlite3" "PRAGMA integrity_check;" | grep -qx ok

# Archive : base + pièces jointes + clés RSA + configuration
tar -C "$TMP" -cf "$TMP/vw.tar" vw-db-backup.sqlite3
tar -C "$DATA" --exclude='db.sqlite3*' --exclude='icon_cache' -rf "$TMP/vw.tar" .

zstd -q -19 "$TMP/vw.tar" -o "$TMP/vw.tar.zst"
age -r "$RECIPIENT" -o "$DEST/vw_$STAMP.tar.zst.age" "$TMP/vw.tar.zst"

# Rétention locale : 30 jours (PBS conserve l'historique long)
find "$DEST" -name 'vw_*.tar.zst.age' -mtime +30 -delete
logger -t vw-backup "Sauvegarde OK : vw_$STAMP.tar.zst.age"
~~~

> [!SEC] Pourquoi chiffrer une base déjà chiffrée ?
> Les coffres sont chiffrés côté client, mais la base contient aussi des **métadonnées** (adresses e-mail, noms d'organisations, dates). Le chiffrement \`age\` protège l'ensemble si une sauvegarde est exposée.

## Tests de validation

~~~terminal title="Depuis un poste du VLAN 10"
enzo@bastion:~$ curl -sI https://vault.enzomarechal.fr | grep -iE "^HTTP|strict|x-frame"
HTTP/2 200
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: SAMEORIGIN
enzo@bastion:~$ curl -s -o /dev/null -w "%{http_code}\n" https://vault.enzomarechal.fr/admin
200
enzo@web-01:~$ curl -s -o /dev/null -w "%{http_code}\n" https://vault.enzomarechal.fr/admin
403
enzo@web-01:~$ nc -zv -w 2 10.10.30.20 8080
nc: connect to 10.10.30.20 port 8080 (tcp) failed: Connection timed out
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Analyse TLS externe | Note A+ | A+ (TLS 1.2/1.3 uniquement, HSTS preload) |
| T2 | 20 tentatives de connexion erronées | Blocage après le burst | HTTP 429 à la 6ᵉ, alerte Wazuh |
| T3 | Accès \`/admin\` depuis la DMZ | 403 | 403 |
| T4 | Accès direct au port 8080 depuis la DMZ | Refusé | Timeout (nftables) |
| T5 | Inscription libre | Refusée | « Registration not allowed » |
| T6 | **Restauration complète** sur une VM vierge | Coffres et pièces jointes intacts | Restauré en 9 min, connexion OK |

## Difficultés rencontrées

**1. Le jeton Argon2 cassait le conteneur.** Placé dans la section \`environment:\` du fichier compose, le hash contenant des \`$\` était interprété comme des variables. **Solution :** déplacer la valeur dans \`.env\` entre apostrophes (ou doubler chaque \`$\` dans le compose).

**2. Adresses IP des clients invisibles.** Les journaux montraient toujours l'IP du reverse proxy, rendant le blocage par IP inopérant. **Solution :** \`IP_HEADER=X-Real-IP\` côté Vaultwarden et en-tête positionné par Nginx.

**3. Adoption.** Un outil de sécurité inutilisé ne protège rien. J'ai rédigé un guide utilisateur d'une page (installation de l'extension, import depuis le navigateur, activation 2FA) et migré les secrets de l'équipe en séance accompagnée.

## Compétences mobilisées

- Conteneurisation et durcissement Docker (read-only, no-new-privileges, exposition minimale)
- Publication sécurisée en DMZ : reverse proxy, TLS, en-têtes de sécurité, rate-limiting
- Gestion des certificats ACME en DNS-01
- Sauvegarde cohérente d'une base SQLite et chiffrement asymétrique
- Conduite du changement auprès des utilisateurs

## Évolutions prévues

- [ ] Authentification SSO (OpenID Connect) dès stabilisation de la fonctionnalité
- [ ] Fail2ban branché sur \`vaultwarden.log\` en complément du rate-limiting Nginx
- [ ] Test de restauration automatisé chaque mois sur une VM éphémère
`
  };

  /* ========================================================================
     P·06 — TÉLÉPHONIE IP 3CX
     ======================================================================== */
  DETAILS['3cx'] = {
    duration: '3 semaines (homelab) · exploitation en mission',
    role: 'Intégration réseau (VLAN voix, QoS), pare-feu, provisioning',
    svg: (() => {
      const k = kit('cx');
      let s = k.open(980, 450, 'Téléphonie 3CX · VLAN voix et QoS de bout en bout');
      s += k.node(40, 64, 190, 58, 'Opérateur SIP', ['trunk 198.51.100.20-21', 'G.711a / G.729'], C.wan, { main: true });
      s += k.node(300, 64, 210, 58, 'PFSENSE (CARP)', ['NAT statique 5060/9000+', 'source = SIP_PROVIDER'], C.fw, { main: true });
      s += k.link([[230, 93], [300, 93]], C.v40, { w: 2, both: true, arrow: true, flow: 1, dash: '6 4', label: [265, 84, 'SIP/RTP'] });
      s += k.zone(560, 44, 400, 250, 'VLAN 40 · VOIP-IOT · 10.10.40.0/24', C.v40, 'DSCP EF / CS3');
      s += k.node(580, 76, 170, 70, '3CX-PBX', ['10.10.40.10 · v20', 'SIP 5060 · RTP 9000+', 'console :5001'], C.v40, { main: true });
      s += k.link([[510, 93], [580, 93]], C.v40, { w: 2, both: true, arrow: true });
      s += k.box(770, 76, 170, 132, 'Plan de numérotation', ['1xx   postes', '800   accueil (SVI)', '801   file support', '802   file atelier', '*0    messagerie'], C.v40);
      s += k.node(300, 180, 210, 70, 'SW-ACCESS', ['LLDP-MED voice vlan 40', 'mls qos trust dscp', 'PoE 802.3af'], C.sw);
      s += k.link([[405, 122], [405, 180]], C.v40, { w: 1.8, label: [470, 155, 'trunk · priority-queue'] });
      [['Poste 101', 70], ['Poste 102', 160], ['Poste 103', 250]].forEach(([n, y], i) => {
        s += k.node(40, 170 + i * 66, 190, 50, n, 'Yealink · DHCP opt. 66', C.v40);
        s += k.link([[230, 195 + i * 66], [300, 215]], C.v40, { w: 1.2, op: 0.7 });
      });
      s += k.link([[665, 146], [665, 230], [510, 230]], C.v40, { w: 1.4, dash: '4 4', label: [600, 222, 'provisioning HTTPS'] });
      s += k.box(560, 310, 400, 126, 'Qualité de service (bout en bout)', ['Postes        : marquage DSCP EF (RTP), CS3 (SIP)', 'Accès         : confiance DSCP sur ports voix', 'Uplinks       : file prioritaire (expedite)', 'pfSense       : limiteur + file prioritaire WAN', 'Cible         : gigue < 30 ms · perte < 1 % · MOS > 4'], C.ok);
      s += k.box(40, 380, 470, 56, 'Sécurité', ['Port-forward limité à SIP_PROVIDER · mots de passe SIP 24 car.'], C.fw);
      return s + k.close();
    })(),
    content: md`
## Contexte

> [!NOTE] Mission et homelab
> J'exploite au quotidien une téléphonie 3CX en mission (ajout de postes, files d'attente, diagnostic de qualité d'appel). Pour maîtriser **toute la chaîne** — réseau, pare-feu, QoS — j'ai reproduit une installation complète dans le VLAN 40 de mon homelab. Les éléments du client ne sont pas publiés.

Sur un site industriel, la téléphonie partage l'infrastructure avec des postes bureautiques, des transferts de fichiers volumineux et des équipements de production. Sans précaution, une sauvegarde nocturne ou une mise à jour Windows suffit à hacher les conversations.

**Objectifs :**

- Isoler la voix dans un **VLAN dédié** appris automatiquement par les postes.
- Garantir la qualité par une **QoS de bout en bout** (poste → switch → pare-feu → opérateur).
- Exposer le trunk SIP sans transformer le PBX en cible de fraude téléphonique.
- **Provisionner** les postes automatiquement : un poste branché est configuré sans intervention.

## Notions clés

| Protocole | Port | Rôle |
|-----------|------|------|
| SIP | 5060 UDP/TCP, 5061 TLS | Signalisation : établir, modifier, terminer un appel |
| RTP | 9000-10999 UDP (3CX) | Transport de la voix elle-même |
| LLDP-MED | — (niveau 2) | Le switch annonce au poste son VLAN voix et sa priorité |
| DSCP EF (46) | — | Marquage « Expedited Forwarding » des paquets voix |

> [!INFO] Pourquoi la voix est-elle si sensible ?
> Un fichier retardé de 200 ms n'est pas un problème. Un paquet de voix retardé de 200 ms est **inutilisable** : il arrive après le moment où il aurait dû être joué. La voix supporte mal la gigue (variation de délai) et la perte : d'où la priorité absolue dans les files d'attente.

## Mise en œuvre

### 1. Installation du PBX

Installation de 3CX v20 sur Debian 12 depuis le dépôt officiel de l'éditeur, en suivant sa documentation :

~~~bash title="3CX-PBX (10.10.40.10)"
# Dépôt 3CX (clé de signature + source APT)
wget -O- https://repo.3cx.com/key.pub | gpg --dearmor > /usr/share/keyrings/3cx-archive-keyring.gpg
echo "deb [arch=amd64 by-hash=yes signed-by=/usr/share/keyrings/3cx-archive-keyring.gpg] http://repo.3cx.com/3cx bookworm main" \
  > /etc/apt/sources.list.d/3cxpbx.list
apt update
apt install -y net-tools dphys-swapfile 3cxpbx
# L'assistant web de configuration démarre ensuite sur http://10.10.40.10:5015
~~~

### 2. Pare-feu pfSense

| Règle | Protocole | Source | Destination | Port |
|-------|-----------|--------|-------------|------|
| Port-forward SIP | UDP | \`SIP_PROVIDER\` | 3CX | 5060 |
| Port-forward RTP | UDP | \`SIP_PROVIDER\` | 3CX | 9000-10999 |
| Port-forward tunnel 3CX | TCP/UDP | \`GEO_FR\` | 3CX | 5090 |
| Console web | TCP | \`MGMT net\`, VPN | 3CX | 5001 |
| Blocage | * | * | 3CX | * |

**NAT sortant en port statique** pour l'hôte 3CX : sans cette option, pfSense réécrit le port source des paquets SIP et l'opérateur ne retrouve plus la session, ce qui provoque des appels sans audio dans un sens.

~~~ini title="Firewall › NAT › Outbound — règle placée en tête"
Interface   = WAN
Source      = 10.10.40.10/32
Destination = any
Translation = 203.0.113.10 (VIP CARP)
Static Port = coché
Description = 3CX — conserver les ports source (SIP/RTP)
~~~

> [!SEC] Fraude téléphonique
> Un PBX exposé reçoit des tentatives d'enregistrement en quelques minutes. Mesures appliquées : port-forward limité aux IP de l'opérateur, mots de passe d'extension de 24 caractères générés par 3CX, appels internationaux bloqués par défaut, blacklist automatique des IP en échec d'authentification.

### 3. Switch : VLAN voix, LLDP-MED et QoS

~~~cisco title="SW-ACCESS — ports des postes téléphoniques" hl="5,6,12-14"
mls qos
lldp run
!
network-policy profile 10
 voice vlan 40 cos 5
 voice-signaling vlan 40 cos 3
!
interface range GigabitEthernet1/0/5 - 20
 description POSTE-TELEPHONE
 switchport mode access
 switchport access vlan 60
 switchport voice vlan 40
 network-policy 10
 mls qos trust dscp
 spanning-tree portfast
 spanning-tree bpduguard enable
 power inline auto
!
interface GigabitEthernet1/0/48
 description UPLINK vers SW-CORE-01
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50,60
 mls qos trust dscp
 priority-queue out
~~~

Dans cet exemple, le VLAN 60 représente le VLAN bureautique du site : le PC branché derrière le téléphone reste dans son VLAN de données, tandis que le téléphone apprend le VLAN 40 par LLDP-MED.

### 4. Provisioning automatique

Les étendues DHCP du VLAN 40 (sur DC01/DC02) distribuent l'**option 66** avec l'URL de provisioning générée par 3CX :

~~~powershell title="DC01 — option 66 sur l'étendue du VLAN 40"
Set-DhcpServerv4OptionValue -ScopeId 10.10.40.0 -OptionId 66 \`
    -Value 'https://10.10.40.10:5001/provisioning/k7f2q9xw'
Set-DhcpServerv4OptionValue -ScopeId 10.10.40.0 -Router 10.10.40.1 -DnsServer 10.10.20.10, 10.10.20.11
~~~

Le poste démarre, récupère son VLAN (LLDP-MED), son adresse (DHCP), télécharge sa configuration (option 66) puis s'enregistre. Dans 3CX, il suffit d'associer l'adresse MAC du poste à l'extension.

## Tests de validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Branchement d'un poste neuf | VLAN 40, provisioning, enregistrement | Opérationnel en ≈ 2 min |
| T2 | Appel interne pendant un \`iperf3\` saturant l'uplink | Voix intacte | Aucune dégradation audible, MOS 4,3 |
| T3 | Même test **sans** \`priority-queue out\` | Dégradation | Voix hachée, perte RTP 6 % |
| T4 | Appel sortant + entrant via le trunk | Audio bidirectionnel | OK (NAT statique) |
| T5 | Bascule CARP pendant un appel | Appel conservé | Micro-coupure < 1 s |
| T6 | Enregistrement SIP depuis une IP inconnue | Refusé | Paquets bloqués par pfSense |

~~~terminal title="SW-ACCESS — vérifications"
SW-ACCESS# show lldp neighbors detail | include Device ID|Network Policy|VLAN
Device ID: SIP-T46U
  Network Policy(Voice): VLAN 40, tagged, Layer-2 priority: 5, DSCP: 46
SW-ACCESS# show mls qos interface gigabitEthernet1/0/5
GigabitEthernet1/0/5
trust state: trust dscp
trust mode: trust dscp
~~~

L'analyse fine se fait dans Wireshark (*Téléphonie › RTP › Analyse de flux*) : gigue, perte et délai pour chaque sens de l'appel.

> [!TIP] Méthode de diagnostic d'un appel de mauvaise qualité
> 1) Le problème touche-t-il un poste, un site ou tous les appels externes ? 2) Capturer **des deux côtés** du pare-feu. 3) Comparer la gigue en LAN et en sortie WAN : si le LAN est propre, le problème est sur le lien Internet ou chez l'opérateur.

## Difficultés rencontrées

**1. Audio dans un seul sens.** Symptôme classique d'un problème de NAT : l'opérateur envoyait le RTP vers un port réécrit. **Solution :** NAT sortant en port statique et adresse IP publique déclarée dans 3CX.

**2. Postes dans le mauvais VLAN.** Certains postes ignoraient LLDP-MED après une réinitialisation d'usine. **Solution :** désactivation de la détection CDP sur ces modèles et forçage de LLDP dans le modèle de provisioning.

## Compétences mobilisées

- Protocoles VoIP : SIP, RTP, codecs, NAT traversal
- QoS de bout en bout : marquage DSCP, confiance, files prioritaires
- Réseau : VLAN voix, LLDP-MED, PoE
- Sécurisation d'un service exposé (prévention de la fraude)
- Diagnostic méthodique avec Wireshark

## Évolutions prévues

- [ ] SIP-TLS + SRTP de bout en bout pour chiffrer signalisation et voix
- [ ] Supervision de la qualité d'appel (MOS, gigue) dans Zabbix
- [ ] Second trunk SIP chez un autre opérateur pour la redondance
`
  };

  /* ========================================================================
     P·07 — SUPERVISION ZABBIX + GRAFANA
     ======================================================================== */
  DETAILS['zabbix-grafana'] = {
    duration: '5 semaines (projet E6) + extension continue',
    role: 'Conception et réalisation complètes — épreuve E6 du BTS SIO',
    svg: (() => {
      const k = kit('zbx');
      let s = k.open(980, 470, 'Supervision centralisée · Zabbix 7.0 LTS + Grafana');
      s += k.zone(320, 44, 340, 200, 'ZABBIX · 10.10.20.50 · Debian 12', C.v20);
      s += k.node(340, 76, 140, 60, 'Zabbix Server', ['7.0 LTS', 'trapper :10051'], '#ef4444', { main: true });
      s += k.node(500, 76, 140, 60, 'Frontend', ['Apache2 + PHP 8.2', 'API JSON-RPC'], '#ef4444');
      s += k.cyl(410, 156, 140, 66, 'MariaDB', 'base zabbix (locale)', C.violet);
      s += k.node(500, 162, 140, 60, 'Grafana OSS', [':3000 · plugin', 'Zabbix app'], C.pve);
      s += k.link([[410, 136], [410, 156]], C.violet, { w: 1.4 });
      s += k.link([[570, 136], [570, 162]], C.pve, { w: 1.4, label: [612, 152, 'API'] });
      s += k.zone(20, 44, 270, 410, 'SOURCES', C.dim);
      const src = [
        ['Agents 2 Linux', 'actifs · PSK · :10051', C.lime],
        ['Agents 2 Windows', 'MSI par GPO · PSK', C.sky],
        ['Proxmox VE ×3', 'API HTTP + agent', C.pve],
        ['SW-CORE / ACCESS', 'SNMPv3 auth+priv', C.v20],
        ['pfSense ×2', 'SNMPv3 (net-snmp)', C.fw],
        ['Services web', 'scénarios HTTP + TLS', C.v30],
        ['GW-IOT (OT)', 'trapper · Zabbix sender', C.v40]
      ];
      src.forEach(([n, sub, c], i) => {
        const y = 72 + i * 54;
        s += k.node(36, y, 238, 44, n, sub, c);
        s += k.link([[274, y + 22], [300, y + 22], [300, 106], [340, 106]], c, { w: 1.2, op: 0.55, dash: '4 4', flow: 1.6 });
      });
      s += k.zone(690, 44, 270, 200, 'ALERTING', C.ok);
      s += k.node(706, 76, 238, 44, 'E-mail', 'SMTP-RELAY 10.10.30.25', C.v30);
      s += k.node(706, 130, 238, 44, 'Microsoft Teams', 'webhook · escalade 15 min', C.blue);
      s += k.node(706, 184, 238, 44, 'Ticket GLPI', 'escalade 30 min · API', C.blue);
      s += k.link([[480, 106], [496, 106]], '#ef4444', { w: 1 });
      s += k.link([[640, 92], [690, 92], [706, 98]], C.ok, { w: 1.6, arrow: true });
      s += k.box(320, 266, 640, 188, 'Logique de détection', [
        'Découverte réseau + autoregistration (HostMetadata) → templates liés automatiquement',
        'Dépendances : « PVE-01 injoignable » dépend de « SW-CORE-01 injoignable »',
        '  → une panne de switch = 1 alerte, pas 25',
        'Seuils dynamiques : CPU > 85 % pendant 10 min (pas de pic isolé)',
        'Prévisions : timeleft() sur les disques → alerte 7 jours avant saturation',
        'Maintenance planifiée : aucune alerte pendant les fenêtres de mise à jour',
        'Certificats TLS : alerte à J-15, critique à J-5'
      ], C.v20);
      return s + k.close();
    })(),
    content: md`
## Contexte

Ce projet est né d'un **besoin réel rencontré en alternance chez Armatis** : sur un site de plusieurs centaines de postes, les incidents étaient découverts par les utilisateurs. Un disque plein ou un service arrêté n'était détecté qu'au moment où il bloquait le travail.

Le projet a été présenté à l'**épreuve E6 du BTS SIO**, puis étendu dans mon homelab à l'ensemble de l'infrastructure (hyperviseurs, réseau, pare-feu, services web, équipement OT).

**Objectifs :**

- Être alerté **avant** l'utilisateur.
- Une alerte = **une action** : pas de tempête d'alertes inutiles qui finissent ignorées.
- Des tableaux de bord lisibles par un non-technicien (Grafana).

## Architecture

| Composant | Choix | Justification |
|-----------|-------|---------------|
| Serveur | Zabbix 7.0 **LTS** | 5 ans de support, adapté à la production |
| Base | MariaDB locale | Zabbix écrit énormément : une base dédiée évite d'impacter les autres applications |
| Frontend | Apache2 + PHP 8.2 | Configuration du dossier E6, paquet officiel \`zabbix-apache-conf\` |
| Agents | **Agent 2** en mode **actif** | L'agent pousse ses données : aucun port à ouvrir vers les postes |
| Réseau | SNMPv3 *authPriv* | SNMPv2c transmet la communauté en clair |
| Tableaux de bord | Grafana OSS + plugin Zabbix | Visualisations plus riches, partage par lien |

> [!INFO] Agent actif ou passif ?
> En mode **passif**, le serveur interroge l'agent (port 10050 ouvert sur chaque hôte). En mode **actif**, l'agent récupère sa liste de contrôles puis envoie ses résultats au serveur (port 10051 sur le serveur uniquement). Le mode actif simplifie le pare-feu et passe le NAT.

## Mise en œuvre

### 1. Installation du serveur

~~~bash title="ZABBIX (10.10.20.50) — Debian 12"
# Dépôt officiel Zabbix 7.0 LTS
wget https://repo.zabbix.com/zabbix/7.0/debian/pool/main/z/zabbix-release/zabbix-release_latest_7.0+debian12_all.deb
dpkg -i zabbix-release_latest_7.0+debian12_all.deb
apt update

# Serveur, frontend Apache, scripts SQL, agent 2, base MariaDB
apt install -y zabbix-server-mysql zabbix-frontend-php zabbix-apache-conf \
               zabbix-sql-scripts zabbix-agent2 mariadb-server

mysql_secure_installation
~~~

~~~sql title="Création de la base"
CREATE DATABASE zabbix CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER 'zabbix'@'localhost' IDENTIFIED BY '**********';
GRANT ALL PRIVILEGES ON zabbix.* TO 'zabbix'@'localhost';
SET GLOBAL log_bin_trust_function_creators = 1;
-- import du schéma (voir ci-dessous) puis :
SET GLOBAL log_bin_trust_function_creators = 0;
~~~

~~~bash title="Import du schéma et démarrage"
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | \
  mysql --default-character-set=utf8mb4 -uzabbix -p zabbix

sed -i 's/^# DBPassword=.*/DBPassword=**********/' /etc/zabbix/zabbix_server.conf
systemctl enable --now zabbix-server zabbix-agent2 apache2
~~~

### 2. Dimensionnement du serveur

~~~ini title="/etc/zabbix/zabbix_server.conf (paramètres modifiés)"
DBName=zabbix
DBUser=zabbix
DBPassword=**********
StartPollers=10
StartPollersUnreachable=3
StartTrappers=10
StartPingers=5
StartHTTPPollers=3
CacheSize=256M
HistoryCacheSize=64M
ValueCacheSize=128M
Timeout=10
LogSlowQueries=3000
~~~

Le tableau de bord *Zabbix server health* permet de vérifier que les processus ne dépassent pas 75 % d'occupation : au-delà, on augmente le nombre de processus concernés.

### 3. Agents avec chiffrement PSK

~~~ini title="/etc/zabbix/zabbix_agent2.conf (Linux)"
Server=10.10.20.50
ServerActive=10.10.20.50
Hostname=glpi
HostMetadata=linux debian srv
TLSConnect=psk
TLSAccept=psk
TLSPSKIdentity=PSK-GLPI
TLSPSKFile=/etc/zabbix/zabbix_agent2.psk
~~~

~~~bash title="Génération de la clé PSK"
openssl rand -hex 32 > /etc/zabbix/zabbix_agent2.psk
chown zabbix:zabbix /etc/zabbix/zabbix_agent2.psk && chmod 600 /etc/zabbix/zabbix_agent2.psk
~~~

Côté Windows, l'agent est déployé par **GPO** (script de démarrage) :

~~~powershell title="Install-ZabbixAgent2.ps1 (script de démarrage)"
$msi = '\\lab.enzomarechal.fr\NETLOGON\Zabbix\zabbix_agent2-7.0-windows-amd64-openssl.msi'
if (-not (Get-Service 'Zabbix Agent 2' -ErrorAction SilentlyContinue)) {
    $args = @(
        '/i', $msi, '/qn', '/norestart',
        'SERVER=10.10.20.50', 'SERVERACTIVE=10.10.20.50',
        "HOSTNAME=$env:COMPUTERNAME", 'HOSTMETADATA=windows'
    )
    Start-Process msiexec.exe -ArgumentList $args -Wait
}
~~~

### 4. Enregistrement automatique

*Alertes › Actions › Actions d'enregistrement automatique* :

| Condition | Opérations |
|-----------|-----------|
| Métadonnées contient \`linux\` | Ajouter au groupe *Linux servers*, lier *Linux by Zabbix agent active* |
| Métadonnées contient \`windows\` | Ajouter au groupe *Windows*, lier *Windows by Zabbix agent active* |
| Métadonnées contient \`srv\` | Ajouter au groupe *Serveurs* (escalade plus rapide) |

Un nouveau serveur installé par Ansible apparaît donc dans Zabbix, correctement classé et supervisé, **sans aucune action manuelle**.

### 5. SNMPv3 sur les équipements réseau

~~~cisco title="SW-CORE-01 — SNMPv3 authPriv restreint au serveur Zabbix"
access-list 10 permit host 10.10.20.50
access-list 10 deny any log
!
snmp-server view ZBX-VIEW iso included
snmp-server group ZBX-GRP v3 priv read ZBX-VIEW access 10
snmp-server user zabbix ZBX-GRP v3 auth sha ********** priv aes 128 **********
snmp-server location Baie-Homelab
snmp-server contact enzo@lab.enzomarechal.fr
~~~

Pour pfSense, le démon SNMP intégré ne gère que v1/v2c : j'ai installé le paquet **NET-SNMP** pour bénéficier de SNMPv3.

~~~terminal title="Test depuis le serveur Zabbix"
root@zabbix:~# snmpget -v3 -l authPriv -u zabbix -a SHA -A ********** -x AES -X ********** 10.10.10.2 SNMPv2-MIB::sysName.0
SNMPv2-MIB::sysName.0 = STRING: SW-CORE-01
root@zabbix:~# zabbix_get -s 10.10.20.40 -k agent.version --tls-connect=psk --tls-psk-identity=PSK-GLPI --tls-psk-file=/etc/zabbix/glpi.psk
7.0.4
~~~

### 6. Éviter la tempête d'alertes

Trois mécanismes, sans lesquels la supervision devient du bruit :

1. **Dépendances de déclencheurs** — si le switch de cœur tombe, les 25 hôtes derrière deviennent injoignables : seule l'alerte du switch est envoyée.
2. **Durée minimale** — \`min(/host/system.cpu.util,10m)>85\` plutôt que \`last()>85\` : un pic d'une seconde n'est pas un incident.
3. **Prévision** — \`timeleft(/host/vfs.fs.size[/,pused],1h,100)<7d\` alerte une semaine avant qu'un disque soit plein, au lieu d'alerter quand il l'est déjà.

### 7. Escalades

| Étape | Délai | Action |
|-------|-------|--------|
| 1 | Immédiat | E-mail à l'équipe (via SMTP-RELAY) |
| 2 | 15 min sans acquittement | Message Microsoft Teams |
| 3 | 30 min sans acquittement | Création d'un ticket GLPI via l'API |
| Retour à la normale | — | Message de résolution sur les mêmes canaux |

### 8. Grafana

~~~bash title="Installation de Grafana OSS et du plugin Zabbix"
mkdir -p /etc/apt/keyrings
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor > /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" \
  > /etc/apt/sources.list.d/grafana.list
apt update && apt install -y grafana
grafana-cli plugins install alexanderzobnin-zabbix-app
systemctl enable --now grafana-server
~~~

La source de données est déclarée **par fichier** (versionnable), avec un jeton d'API Zabbix en lecture seule :

~~~yaml title="/etc/grafana/provisioning/datasources/zabbix.yaml"
apiVersion: 1
datasources:
  - name: Zabbix
    type: alexanderzobnin-zabbix-datasource
    access: proxy
    url: http://127.0.0.1/zabbix/api_jsonrpc.php
    isDefault: true
    jsonData:
      authType: token
      trends: true
      trendsFrom: 7d
      trendsRange: 4d
      cacheTTL: 1h
    secureJsonData:
      apiToken: "**********"
~~~

Tableaux de bord réalisés : vue d'ensemble de l'infrastructure, cluster Proxmox, réseau (débit des ports, erreurs), services web (temps de réponse, certificats), pare-feu (états, débit WAN).

## Tests de validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Arrêt du service \`nginx\` sur NGINX-RP | Alerte < 1 min | 42 s |
| T2 | Remplissage d'un disque à 92 % | Alerte *Haute* | OK, résolution automatique après nettoyage |
| T3 | Coupure de SW-ACCESS | **1 seule** alerte | 1 alerte (dépendances) au lieu de 9 |
| T4 | Alerte non acquittée | Teams à 15 min, ticket GLPI à 30 min | Ticket créé dans la bonne catégorie |
| T5 | Fenêtre de maintenance | Aucune notification | Aucune notification |
| T6 | Nouvel hôte installé par Ansible | Apparition automatique | Classé et supervisé en 2 min |

## Résultats

- Plus de 60 hôtes et équipements supervisés, environ 2 400 éléments collectés.
- Détection moyenne inférieure à une minute.
- Les incidents de saturation disque sont désormais traités **avant** l'impact utilisateur grâce aux prévisions.

## Difficultés rencontrées

**1. Base de données qui grossit sans fin.** L'historique brut de 2 400 éléments toutes les minutes représente vite plusieurs dizaines de Go. **Solution :** historique conservé 14 jours, **tendances** (agrégats horaires) conservées 1 an, et intervalles de collecte adaptés (1 min pour le CPU, 1 h pour le numéro de série).

**2. Faux positifs sur les postes portables.** Un portable éteint le soir générait une alerte « injoignable ». **Solution :** les postes de travail ne déclenchent pas d'alerte de disponibilité, seulement des alertes de conformité (antivirus, espace disque) à leur prochaine connexion.

## Compétences mobilisées

- Installation et dimensionnement d'une plateforme de supervision
- Protocoles de supervision : agent actif/passif, SNMPv3, scénarios HTTP
- Conception d'alertes utiles : dépendances, hystérésis, prévisions, escalades
- Sécurisation (PSK, SNMPv3 *authPriv*, jetons d'API en lecture seule)
- Restitution des données pour un public non technique (Grafana)

## Évolutions prévues

- [ ] Proxy Zabbix pour superviser un site distant à travers le VPN
- [ ] Partitionnement de la base (TimescaleDB) pour supporter plus d'historique
- [ ] Intégration bidirectionnelle avec GLPI (fermeture du ticket à la résolution)
`
  };

  /* ========================================================================
     P·08 — SIEM WAZUH
     ======================================================================== */
  DETAILS['wazuh'] = {
    duration: '4 semaines',
    role: 'Déploiement, intégration des sources, règles de détection',
    svg: (() => {
      const k = kit('wz');
      let s = k.open(980, 460, 'SIEM Wazuh · collecte, corrélation, réponse');
      s += k.zone(20, 44, 270, 400, 'SOURCES', C.dim);
      const src = [
        ['DC01 / DC02', 'Security + Sysmon', C.v20],
        ['Serveurs Linux', 'auth.log · auditd · FIM', C.lime],
        ['NGINX-RP', 'access / error logs', C.v30],
        ['VAULTWARDEN', 'échecs de connexion', C.v30],
        ['BASTION', 'sessions SSH', C.v10],
        ['PFSENSE ×2', 'syslog filterlog 514/udp', C.fw]
      ];
      src.forEach(([n, sub, c], i) => {
        const y = 72 + i * 60;
        s += k.node(36, y, 238, 46, n, sub, c);
        s += k.link([[274, y + 23], [320, y + 23], [320, 200], [350, 200]], c, { w: 1.3, op: 0.6, dash: '5 4', flow: 1.4 });
      });
      s += k.zone(340, 44, 330, 290, 'WAZUH · 10.10.20.60 · 4.8 all-in-one', C.ok);
      s += k.node(360, 80, 290, 64, 'Manager', ['analysisd : décodeurs + règles', 'agents 1514/tcp · enrôlement 1515'], C.ok, { main: true });
      s += k.node(360, 162, 290, 54, 'Indexer (OpenSearch)', 'index wazuh-alerts-* · 90 j', C.v20);
      s += k.node(360, 234, 290, 54, 'Dashboard', 'https :443 · RBAC', C.blue);
      s += k.link([[505, 144], [505, 162]], C.ok, { w: 1.4, arrow: true });
      s += k.link([[505, 216], [505, 234]], C.v20, { w: 1.4, arrow: true });
      s += k.box(340, 350, 330, 94, 'Modules activés', ['FIM temps réel (syscheck)', 'Détection de vulnérabilités', 'SCA (benchmarks CIS)'], C.ok);
      s += k.box(700, 44, 260, 180, 'Règles personnalisées', ['100100 ajout groupe privilégié', '100110 RDP hors horaires', '100120 GPO modifiée', '100130 DMZ → LAN refusé ×20', '100140 /admin Vaultwarden', 'mapping MITRE ATT&CK'], C.fw);
      s += k.box(700, 244, 260, 110, 'Réponse active', ['firewall-drop 10 min', 'sur brute force SSH', 'liste blanche : VLAN 10'], C.v40);
      s += k.node(700, 372, 260, 72, 'Notifications', ['niveau ≥ 10 → mail', 'niveau ≥ 12 → Teams', 'rapport hebdomadaire'], C.blue);
      s += k.link([[650, 112], [700, 112]], C.fw, { w: 1.4, arrow: true });
      s += k.link([[650, 120], [680, 120], [680, 298], [700, 298]], C.v40, { w: 1.4, arrow: true });
      return s + k.close();
    })(),
    content: md`
## Contexte

Segmenter et filtrer réduit la surface d'attaque, mais ne dit rien de ce qui se passe **à l'intérieur**. Sans centralisation des journaux, un compte ajouté aux Admins du domaine à 3 h du matin passe inaperçu.

**Objectifs :**

- Centraliser les journaux Windows, Linux, pare-feu et applicatifs.
- Détecter les comportements suspects avec des règles **contextualisées** (pas seulement celles par défaut).
- Réagir automatiquement aux attaques évidentes (brute force).
- Mesurer la conformité des serveurs (benchmarks CIS).

## Pourquoi Wazuh

| Critère | Wazuh | Stack ELK seule | Graylog |
|---------|-------|-----------------|---------|
| Règles de détection fournies | Plusieurs milliers, mappées MITRE | À écrire | Limitées |
| Agents (FIM, inventaire, vulnérabilités) | Oui | Beats, sans corrélation | Non |
| Réponse active | Oui | Non | Non |
| Coût | Open source | Open source | Open source (fonctions limitées) |

## Mise en œuvre

### 1. Installation tout-en-un

~~~bash title="WAZUH (10.10.20.60) — Debian 12, 4 vCPU / 8 Go"
curl -sO https://packages.wazuh.com/4.8/wazuh-install.sh
bash ./wazuh-install.sh -a
# Le mot de passe initial de l'utilisateur admin est affiché en fin d'installation
# et stocké dans wazuh-install-files.tar : à déplacer dans Vaultwarden puis supprimer.
~~~

> [!WARN] Mémoire
> L'indexer (OpenSearch) réserve la moitié de la RAM pour la JVM. En dessous de 8 Go, le service s'arrête de façon aléatoire. Le heap est fixé dans \`/etc/wazuh-indexer/jvm.options\` (\`-Xms4g -Xmx4g\`).

### 2. Déploiement des agents

~~~powershell title="Windows — installation silencieuse (script de démarrage GPO)"
$msi = '\\lab.enzomarechal.fr\NETLOGON\Wazuh\wazuh-agent-4.8.0-1.msi'
if (-not (Get-Service WazuhSvc -ErrorAction SilentlyContinue)) {
    Start-Process msiexec.exe -Wait -ArgumentList "/i ""$msi"" /q WAZUH_MANAGER=10.10.20.60 WAZUH_REGISTRATION_SERVER=10.10.20.60 WAZUH_AGENT_GROUP=windows"
    Start-Service WazuhSvc
}
~~~

~~~bash title="Linux — via le rôle Ansible wazuh-agent (extrait de la tâche)"
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --dearmor -o /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" \
  > /etc/apt/sources.list.d/wazuh.list
apt update
WAZUH_MANAGER="10.10.20.60" WAZUH_AGENT_GROUP="linux" apt install -y wazuh-agent
systemctl enable --now wazuh-agent
~~~

### 3. Sysmon sur les serveurs Windows

Les journaux Windows natifs ne tracent pas les créations de processus avec leur ligne de commande et leur hash. **Sysmon** comble ce manque :

~~~powershell title="Installation de Sysmon avec une configuration communautaire éprouvée"
& '\\lab.enzomarechal.fr\NETLOGON\Sysmon\Sysmon64.exe' -accepteula -i '\\lab.enzomarechal.fr\NETLOGON\Sysmon\sysmonconfig.xml'
~~~

La collecte est activée pour tout le groupe d'agents \`windows\` depuis le manager :

~~~xml title="/var/ossec/etc/shared/windows/agent.conf"
<agent_config>
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
  <localfile>
    <location>Microsoft-Windows-PowerShell/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
  <syscheck>
    <directories realtime="yes">C:\Windows\System32\drivers\etc</directories>
    <directories realtime="yes">C:\Windows\SYSVOL\domain\Policies</directories>
  </syscheck>
</agent_config>
~~~

### 4. Journaux pfSense par syslog

~~~xml title="/var/ossec/etc/ossec.conf (bloc ajouté)"
<remote>
  <connection>syslog</connection>
  <port>514</port>
  <protocol>udp</protocol>
  <allowed-ips>10.10.20.252</allowed-ips>
  <allowed-ips>10.10.20.253</allowed-ips>
  <local_ip>10.10.20.60</local_ip>
</remote>
~~~

Côté pfSense (*Status › System Logs › Settings*) : envoi distant vers \`10.10.20.60:514\`, contenu *Firewall Events* et *System Events*. Wazuh embarque les décodeurs \`pf\` : chaque paquet bloqué devient un événement exploitable.

### 5. Règles personnalisées

~~~xml title="/var/ossec/etc/rules/local_rules.xml"
<group name="local,windows,ad_privilege,">

  <!-- Ajout d'un membre à un groupe à privilèges du domaine -->
  <rule id="100100" level="12">
    <decoded_as>windows_eventchannel</decoded_as>
    <field name="win.system.eventID">^4728$|^4732$|^4756$</field>
    <field name="win.eventdata.targetUserName" type="pcre2">(?i)^(Admins du domaine|Domain Admins|Administrateurs de l.entreprise|Enterprise Admins|Administrateurs du schéma|Schema Admins)$</field>
    <description>AD : $(win.eventdata.memberName) ajouté au groupe privilégié $(win.eventdata.targetUserName) par $(win.eventdata.subjectUserName)</description>
    <mitre>
      <id>T1098</id>
    </mitre>
  </rule>

  <!-- Modification d'un objet GPO (audit du service d'annuaire) -->
  <rule id="100120" level="10">
    <decoded_as>windows_eventchannel</decoded_as>
    <field name="win.system.eventID">^5136$</field>
    <field name="win.eventdata.objectClass">^groupPolicyContainer$</field>
    <description>AD : stratégie de groupe modifiée par $(win.eventdata.subjectUserName)</description>
    <mitre>
      <id>T1484.001</id>
    </mitre>
  </rule>

</group>

<group name="local,pfsense,lateral,">

  <!-- 20 refus DMZ → LAN en 2 minutes depuis la même source : machine compromise probable -->
  <rule id="100130" level="12" frequency="20" timeframe="120">
    <if_matched_group>pfsense</if_matched_group>
    <srcip>10.10.30.0/24</srcip>
    <dstip>10.10.0.0/16</dstip>
    <same_srcip />
    <description>pfSense : multiples connexions refusées de la DMZ vers le LAN depuis $(srcip)</description>
    <mitre>
      <id>T1046</id>
    </mitre>
  </rule>

</group>
~~~

~~~terminal title="Validation de la syntaxe et test d'une règle"
root@wazuh:~# /var/ossec/bin/wazuh-logtest
Type one log per line
**Phase 3: Completed filtering (rules).
	id: '100100'
	level: '12'
	description: 'AD : jdupont ajouté au groupe privilégié Admins du domaine par adm-t0-enzo'
	groups: '["local", "windows", "ad_privilege"]'
	mitre.id: '["T1098"]'
**Alert to be generated.
~~~

### 6. Réponse active

~~~xml title="ossec.conf — blocage automatique des brute force SSH"
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>5712</rules_id>
  <timeout>600</timeout>
</active-response>
~~~

> [!DANGER] Réponse active et liste blanche
> Un blocage automatique mal maîtrisé peut **couper l'administrateur lui-même**. Le VLAN 10 et le réseau VPN sont déclarés en \`<white_list>\` dans la configuration globale du manager.

## Tests de validation

| # | Scénario simulé | Règle attendue | Résultat |
|---|-----------------|----------------|----------|
| T1 | 15 tentatives SSH avec un mot de passe invalide sur le bastion | 5710 puis 5712 + blocage | IP bloquée 10 min |
| T2 | \`Add-ADGroupMember 'Admins du domaine' jdupont\` | 100100 (niveau 12) | Alerte + mail en 8 s |
| T3 | Modification d'une GPO | 100120 | OK, auteur identifié |
| T4 | Scan \`nmap\` depuis WEB-01 (DMZ) vers 10.10.20.0/24 | 100130 | Alerte, source identifiée |
| T5 | Modification de \`hosts\` sur DC01 | FIM 550 | Alerte avec diff |
| T6 | Serveur non mis à jour | Vulnérabilités CVE | Liste des CVE par sévérité |

## Résultats

- 22 agents, plus de 2 millions d'événements par jour, environ 40 alertes réellement utiles par semaine après réglage.
- Score SCA (CIS Debian 12) des serveurs Linux passé de 48 % à 81 % grâce au rôle Ansible de durcissement.
- Rapport hebdomadaire automatique des alertes de niveau ≥ 10.

## Difficultés rencontrées

**1. Volume d'alertes initial ingérable.** Les premiers jours : des centaines d'alertes de niveau 3 à 5 (événements Windows bénins). **Démarche :** seuil de notification à 10, analyse des 20 règles les plus bruyantes, et règles de niveau 0 ciblées pour les faux positifs identifiés (par exemple les comptes de service qui s'authentifient en boucle).

**2. Les journaux pfSense n'étaient pas décodés.** Les messages arrivaient avec une adresse source inattendue (l'interface du VLAN 20, pas celle du VLAN 10). **Solution :** déclarer les deux adresses physiques du VLAN 20 dans \`allowed-ips\`.

## Compétences mobilisées

- Architecture d'un SIEM et cycle de vie des journaux
- Écriture et test de règles de détection, mapping MITRE ATT&CK
- Durcissement guidé par des benchmarks (SCA / CIS)
- Démarche d'investigation : reproduire l'attaque en laboratoire pour valider la détection

## Évolutions prévues

- [ ] Intégration de Suricata (IDS) sur pfSense comme source supplémentaire
- [ ] Enrichissement par flux de réputation (MISP / AbuseIPDB)
- [ ] Création automatique d'un ticket GLPI pour toute alerte de niveau ≥ 12
`
  };

  /* ========================================================================
     P·09 — GLPI + GLPI AGENT
     ======================================================================== */
  DETAILS['glpi'] = {
    duration: '3 semaines',
    role: 'Installation, intégration AD, inventaire, paramétrage ITIL',
    svg: (() => {
      const k = kit('glpi');
      let s = k.open(980, 450, 'GLPI 10 · ITSM et inventaire automatique');
      s += k.zone(20, 44, 250, 390, 'PARC', C.dim);
      [['Postes Windows', 'GLPI Agent · GPO', C.sky], ['Serveurs Linux', 'glpi-agent · Ansible', C.lime], ['Imprimantes / switchs', 'découverte réseau SNMP', C.v20], ['Utilisateurs', 'portail · mail', C.blue]].forEach(([n, sub, c], i) => {
        const y = 72 + i * 88;
        s += k.node(36, y, 218, 56, n, sub, c);
        s += k.link([[254, y + 28], [300, y + 28], [300, 160], [330, 160]], c, { w: 1.3, op: 0.6, dash: '5 4', flow: 1.5 });
      });
      s += k.zone(320, 44, 340, 250, 'GLPI · 10.10.20.40 · Debian 12', C.blue);
      s += k.node(340, 80, 300, 64, 'Nginx + PHP 8.2-FPM', ['racine = /var/www/glpi/public', 'TLS · cookies secure/httponly'], C.blue, { main: true });
      s += k.node(340, 160, 145, 56, 'Inventaire', 'natif GLPI 10', C.blue);
      s += k.node(495, 160, 145, 56, 'Helpdesk', 'ITIL · SLA', C.blue);
      s += k.box(340, 228, 300, 54, 'Données hors racine web', ['/etc/glpi · /var/lib/glpi · /var/log/glpi'], C.ok);
      s += k.cyl(490, 336, 170, 70, 'VIP 10.10.20.30', 'HAProxy → Galera ×3', C.violet);
      s += k.link([[490, 294], [490, 336]], C.violet, { w: 1.6, arrow: true, label: [545, 320, '3306'] });
      s += k.node(700, 72, 260, 58, 'DC01 / DC02', ['LDAPS 636 · svc-glpi-ldap', 'synchro utilisateurs'], C.v20);
      s += k.link([[660, 100], [700, 100]], C.v20, { w: 1.6, both: true, arrow: true });
      s += k.node(700, 152, 260, 58, 'Collecteur e-mail', ['support@ → ticket', 'IMAP TLS'], C.v30);
      s += k.link([[660, 180], [700, 180]], C.v30, { w: 1.4, arrow: true, both: true });
      s += k.node(700, 232, 260, 58, 'ZABBIX', ['escalade → ticket API', 'catégorie Incident'], '#ef4444');
      s += k.link([[700, 260], [660, 240]], '#ef4444', { w: 1.4, arrow: true });
      s += k.box(700, 312, 260, 122, 'Paramétrage ITIL', ['Catégories (12)', 'SLA : P1 1 h · P2 4 h · P3 2 j', 'Règles d’affectation', 'Base de connaissances', 'Gabarits de tickets'], C.blue);
      return s + k.close();
    })(),
    content: md`
## Contexte

Un service informatique sans outil de suivi travaille de mémoire : demandes perdues, pas de priorisation, pas d'historique, et un inventaire qui n'est jamais à jour. GLPI répond aux deux besoins avec un seul outil : **gestion des tickets** (ITIL) et **gestion de parc** reliée aux tickets.

**Objectifs :**

- Un point d'entrée unique pour les demandes (portail, e-mail, création par la supervision).
- Un inventaire **automatique** et fiable de 100 % du parc.
- Des SLA mesurables par priorité.
- Une installation conforme aux recommandations de sécurité de l'éditeur.

## Installation sécurisée

### 1. Paquets et téléchargement

~~~bash title="GLPI (10.10.20.40) — Debian 12"
apt install -y nginx php8.2-fpm php8.2-mysql php8.2-curl php8.2-gd php8.2-intl \
               php8.2-ldap php8.2-xml php8.2-mbstring php8.2-zip php8.2-bz2 php8.2-bcmath

cd /tmp
wget https://github.com/glpi-project/glpi/releases/download/10.0.16/glpi-10.0.16.tgz
tar -xzf glpi-10.0.16.tgz -C /var/www/
~~~

### 2. Données en dehors de la racine web

Par défaut, configuration, fichiers joints et journaux sont **dans** le dossier web. Je les ai déplacés conformément à la documentation de GLPI :

~~~bash title="Séparation des répertoires"
mkdir -p /etc/glpi /var/lib/glpi /var/log/glpi
mv /var/www/glpi/config/* /etc/glpi/
mv /var/www/glpi/files/*  /var/lib/glpi/
chown -R www-data:www-data /etc/glpi /var/lib/glpi /var/log/glpi
chown -R root:root /var/www/glpi && chmod -R go-w /var/www/glpi
~~~

~~~php title="/var/www/glpi/inc/downstream.php"
<?php
define('GLPI_CONFIG_DIR', '/etc/glpi/');
if (file_exists(GLPI_CONFIG_DIR . '/local_define.php')) {
    require_once GLPI_CONFIG_DIR . '/local_define.php';
}
~~~

~~~php title="/etc/glpi/local_define.php"
<?php
define('GLPI_VAR_DIR', '/var/lib/glpi');
define('GLPI_LOG_DIR', '/var/log/glpi');
~~~

Le code de l'application appartient à \`root\` et n'est pas modifiable par le serveur web : une faille applicative ne permet pas de réécrire GLPI.

### 3. Nginx : seul le dossier public est servi

~~~nginx title="/etc/nginx/sites-available/glpi"
server {
    listen 443 ssl http2;
    server_name glpi.lab.enzomarechal.fr;

    ssl_certificate     /etc/ssl/lab/glpi.crt;    # émis par la PKI interne
    ssl_certificate_key /etc/ssl/lab/glpi.key;

    root /var/www/glpi/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
~~~

~~~ini title="/etc/php/8.2/fpm/conf.d/99-glpi.ini"
session.cookie_httponly = On
session.cookie_secure   = On
session.cookie_samesite = Lax
memory_limit            = 256M
upload_max_filesize     = 20M
post_max_size           = 20M
max_execution_time      = 60
~~~

### 4. Base de données sur le cluster Galera

~~~sql title="Sur le cluster Galera (une seule fois)"
CREATE DATABASE glpi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'glpi'@'10.10.20.40' IDENTIFIED BY '**********';
GRANT ALL PRIVILEGES ON glpi.* TO 'glpi'@'10.10.20.40';
GRANT SELECT ON mysql.time_zone_name TO 'glpi'@'10.10.20.40';
~~~

~~~terminal title="Installation en ligne de commande"
root@glpi:/var/www/glpi# sudo -u www-data php bin/console db:install --db-host=10.10.20.30 --db-name=glpi --db-user=glpi --db-password='**********' --default-language=fr_FR
Creating the database...
Loading default schema...
Installation done.
root@glpi:/var/www/glpi# sudo -u www-data php bin/console database:enable_timezones
Timezones usage has been enabled.
root@glpi:/var/www/glpi# rm -f install/install.php
~~~

Après installation : changement des mots de passe des comptes par défaut (\`glpi\`, \`tech\`, \`normal\`, \`post-only\`) et désactivation de ceux qui ne servent pas.

### 5. Tâches automatiques en mode CLI

~~~bash title="/etc/cron.d/glpi"
* * * * * www-data /usr/bin/php /var/www/glpi/front/cron.php &>/dev/null
~~~

## Intégration Active Directory

*Configuration › Authentification › Annuaires LDAP* :

| Paramètre | Valeur |
|-----------|--------|
| Serveur | \`ldaps://dc01.lab.enzomarechal.fr\` (réplica : DC02) |
| Port | 636 |
| BaseDN | \`OU=UTILISATEURS,DC=lab,DC=enzomarechal,DC=fr\` |
| Compte de liaison | \`svc-glpi-ldap\` (lecture seule, mot de passe 32 caractères) |
| Champ de l'identifiant | \`samaccountname\` |
| Filtre de connexion | voir ci-dessous |

~~~text title="Filtre LDAP : utilisateurs actifs uniquement"
(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))
~~~

La règle \`1.2.840.113556.1.4.803\` est un **ET binaire** sur \`userAccountControl\` : le bit 2 correspond à un compte désactivé. Un collaborateur parti, dont le compte AD est désactivé, ne peut donc plus se connecter à GLPI.

Des **règles d'affectation des habilitations** attribuent automatiquement le profil : membres de \`GG_Support_T2\` → profil *Technicien*, autres utilisateurs → *Self-Service*.

## Inventaire automatique

GLPI 10 intègre nativement le protocole d'inventaire : le plugin FusionInventory n'est plus nécessaire. L'agent **GLPI Agent** est déployé par GPO :

~~~powershell title="Script de démarrage — installation de GLPI Agent"
$msi = '\\lab.enzomarechal.fr\NETLOGON\GLPI\GLPI-Agent-1.7.3-x64.msi'
# OU du poste lue par ADSI (aucun module RSAT nécessaire sur le poste)
$dn  = ([adsisearcher]"(&(objectCategory=computer)(cn=$env:COMPUTERNAME))").FindOne().Properties.distinguishedname
$tag = "$dn" -replace '^CN=[^,]+,OU=([^,]+).*', '$1'
if (-not (Get-Service glpi-agent -ErrorAction SilentlyContinue)) {
    Start-Process msiexec.exe -Wait -ArgumentList @(
        '/i', $msi, '/quiet',
        'SERVER=https://glpi.lab.enzomarechal.fr/',
        'RUNNOW=1', 'EXECMODE=1', 'ADD_FIREWALL_EXCEPTION=1',
        "TAG=$tag"
    )
}
~~~

Le \`TAG\` reprend l'OU du poste (Bureautique, Atelier, Portables) : une règle d'import l'utilise pour classer automatiquement l'ordinateur dans la bonne **entité** et le bon **lieu**.

Côté Linux, le rôle Ansible installe \`glpi-agent\` et dépose \`/etc/glpi-agent/conf.d/server.cfg\` (\`server = https://glpi.lab.enzomarechal.fr/\`).

## Paramétrage ITIL

| Priorité | Exemple | Prise en charge | Résolution |
|----------|---------|-----------------|------------|
| P1 — Critique | Ligne de production arrêtée | 15 min | 1 h |
| P2 — Haute | Service indisponible pour une équipe | 1 h | 4 h |
| P3 — Normale | Poste lent, imprimante | 4 h | 2 jours ouvrés |
| P4 — Basse | Demande d'installation | 1 jour | 5 jours ouvrés |

Règles métier configurées :

- Catégorie **Téléphonie** → groupe *Réseau & Télécom*
- Ticket créé par **Zabbix** → type *Incident*, priorité selon la sévérité de l'alerte
- Mot « urgent » dans l'objet → **pas** de changement de priorité automatique (évite les abus), mais notification du responsable

## Tests de validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Connexion avec un compte AD actif | Accès, profil Self-Service | OK |
| T2 | Connexion avec un compte AD désactivé | Refus | Refus (filtre LDAP) |
| T3 | Nouveau poste déployé par MDT | Inventorié automatiquement | Visible en < 10 min, bonne entité |
| T4 | Accès direct à \`/files/\` ou \`/config/\` | Introuvable | 404 (hors racine web) |
| T5 | Mail envoyé à support@ | Ticket créé, accusé de réception | OK |
| T6 | Alerte Zabbix non acquittée 30 min | Ticket P2 créé | OK |

## Difficultés rencontrées

**1. Doublons d'ordinateurs après redéploiement.** Un poste redéployé apparaissait deux fois. **Solution :** règles d'import et de liaison basées sur le **numéro de série** en priorité (et non sur le nom), cohérent avec la nomenclature \`PC-<numéro de série>\` du déploiement MDT.

**2. Fuseaux horaires des SLA.** Les délais étaient faussés d'une heure. **Solution :** activation des fuseaux horaires (\`database:enable_timezones\`) et droit \`SELECT\` sur \`mysql.time_zone_name\`.

## Compétences mobilisées

- Installation d'une application web PHP selon les recommandations de sécurité de l'éditeur
- Intégration LDAPS et filtres LDAP avancés
- Gestion de parc : inventaire automatique, règles d'import, entités
- Processus ITIL : catégories, priorités, SLA, escalades

## Évolutions prévues

- [ ] Catalogue de services (formulaires de demande) pour les arrivées / départs
- [ ] Authentification SSO (SAML / OIDC)
- [ ] Gestion des licences logicielles et alertes d'expiration
`
  };

  /* ========================================================================
     P·10 — CLUSTER MARIADB GALERA + HAPROXY
     ======================================================================== */
  DETAILS['galera'] = {
    duration: '3 semaines',
    role: 'Conception, déploiement, procédures de reprise',
    svg: (() => {
      const k = kit('gal');
      let s = k.open(980, 450, 'MariaDB Galera · réplication synchrone multi-maître');
      s += k.node(330, 50, 320, 52, 'Applications', 'GLPI · outils internes → 10.10.20.30:3306', C.blue);
      s += k.link([[490, 102], [490, 132]], C.violet, { w: 2, arrow: true, flow: 1, dash: '6 4' });
      s += k.pill(490, 146, 'VIP 10.10.20.30 · keepalived VRRP vrid 51', C.violet);
      s += k.node(170, 176, 260, 66, 'HAProxy #1 (MASTER)', ['sur GALERA-01 · prio 110', 'check HTTP :9200'], C.violet, { main: true });
      s += k.node(550, 176, 260, 66, 'HAProxy #2 (BACKUP)', ['sur GALERA-02 · prio 100', 'reprend la VIP en 3 s'], C.violet);
      s += k.link([[430, 209], [550, 209]], C.violet, { w: 1.4, dash: '4 4', label: [490, 201, 'VRRP'] });
      s += k.link([[300, 242], [300, 270], [490, 270]], C.v20, { w: 1.4, op: 0.6 });
      s += k.link([[680, 242], [680, 270], [490, 270]], C.v20, { w: 1.4, op: 0.6 });
      const dbs = [['GALERA-01', '10.10.20.31', 'écritures (actif)', C.ok], ['GALERA-02', '10.10.20.32', 'backup', C.grey], ['GALERA-03', '10.10.20.33', 'backup', C.grey]];
      dbs.forEach(([n, ip, role, c], i) => {
        const x = 150 + i * 240;
        s += k.link([[490, 270], [x + 95, 270], [x + 95, 298]], i === 0 ? C.ok : C.grey, { w: i === 0 ? 2 : 1.2, dash: i === 0 ? undefined : '4 4' });
        s += k.cyl(x + 95, 298, 190, 78, n, `${ip} · ${role}`, C.violet);
      });
      s += k.link([[340, 386], [390, 386]], C.v20, { w: 1.6, both: true, arrow: true });
      s += k.link([[580, 386], [630, 386]], C.v20, { w: 1.6, both: true, arrow: true });
      s += k.link([[245, 376], [245, 410], [725, 410], [725, 376]], C.v20, { w: 1.4, dash: '4 4', both: true, arrow: true, label: [485, 426, 'wsrep · certification synchrone · 4567/tcp · IST 4568 · SST 4444'] });
      s += k.box(20, 44, 140, 120, 'Quorum', ['3 nœuds', '2 requis', 'pas de', 'split-brain'], C.ok);
      s += k.box(820, 44, 140, 120, 'Sauvegarde', ['mariabackup', 'sur GALERA-03', 'desync ON', 'puis → PBS'], C.v10);
      return s + k.close();
    })(),
    content: md`
## Contexte

GLPI et plusieurs outils internes reposent sur MariaDB. Avec une seule instance, toute maintenance ou panne du serveur de base de données rend **tous** ces services indisponibles.

**Objectifs :**

- Aucune perte de données validée (RPO = 0).
- Bascule automatique et transparente pour les applications (une seule adresse de connexion).
- Maintenance d'un nœud sans interruption.

## Galera en bref

Galera réplique chaque transaction **de façon synchrone** au moment du \`COMMIT\` : la transaction est certifiée par tous les nœuds avant d'être validée. Contrairement à la réplication asynchrone classique (primaire / réplique), aucune transaction validée ne peut être perdue lors d'une bascule.

| Critère | Réplication asynchrone | Galera |
|---------|------------------------|--------|
| Perte possible lors d'une bascule | Oui (retard de la réplique) | **Non** |
| Bascule | Manuelle ou outil externe | Immédiate (tous les nœuds sont à jour) |
| Écritures | Primaire uniquement | Tous les nœuds (mais déconseillé, voir plus bas) |
| Latence d'écriture | Faible | Augmentée par la certification |
| Nombre de nœuds | 2 suffisent | **3 minimum** (quorum) |

> [!INFO] Pourquoi Zabbix n'est pas sur Galera
> Zabbix écrit en continu de gros volumes et utilise des tables sans clé primaire dans certaines versions : ce profil est défavorable à Galera. La base Zabbix reste donc locale, sauvegardée par PBS. **Chaque application doit être évaluée** avant de la placer sur un cluster.

## Mise en œuvre

### 1. Installation sur les trois nœuds

~~~bash title="GALERA-01, 02 et 03"
apt install -y mariadb-server mariadb-backup galera-4 rsync socat
systemctl stop mariadb
~~~

### 2. Configuration de Galera

~~~ini title="/etc/mysql/mariadb.conf.d/60-galera.cnf (GALERA-01)"
[mysqld]
binlog_format                  = ROW
default_storage_engine         = InnoDB
innodb_autoinc_lock_mode       = 2
innodb_flush_log_at_trx_commit = 2
bind-address                   = 0.0.0.0

[galera]
wsrep_on                 = ON
wsrep_provider           = /usr/lib/galera/libgalera_smm.so
wsrep_cluster_name       = "lab-galera"
wsrep_cluster_address    = "gcomm://10.10.20.31,10.10.20.32,10.10.20.33"
wsrep_node_name          = "galera-01"
wsrep_node_address       = "10.10.20.31"
wsrep_sst_method         = mariabackup
wsrep_sst_auth           = "sst:**********"
wsrep_provider_options   = "gcache.size=1G"
wsrep_slave_threads      = 4
~~~

Seules \`wsrep_node_name\` et \`wsrep_node_address\` changent d'un nœud à l'autre.

> [!TIP] innodb_flush_log_at_trx_commit = 2
> Sur un nœud isolé, cette valeur risque de perdre la dernière seconde de transactions en cas de coupure. Avec Galera, la donnée est **déjà sur les autres nœuds** au moment du commit : on peut se permettre ce gain de performance.

### 3. Démarrage du cluster

~~~terminal title="Amorçage puis ajout des nœuds"
root@galera-01:~# galera_new_cluster
root@galera-01:~# mysql -e "CREATE USER 'sst'@'localhost' IDENTIFIED BY '**********'; GRANT RELOAD, PROCESS, LOCK TABLES, BINLOG MONITOR ON *.* TO 'sst'@'localhost';"
root@galera-02:~# systemctl start mariadb
root@galera-03:~# systemctl start mariadb
root@galera-01:~# mysql -e "SHOW STATUS WHERE Variable_name IN ('wsrep_cluster_size','wsrep_cluster_status','wsrep_local_state_comment','wsrep_ready');"
+---------------------------+---------+
| Variable_name             | Value   |
+---------------------------+---------+
| wsrep_cluster_size        | 3       |
| wsrep_cluster_status      | Primary |
| wsrep_local_state_comment | Synced  |
| wsrep_ready               | ON      |
+---------------------------+---------+
~~~

### 4. Contrôle de santé pour HAProxy

Un simple test TCP sur le port 3306 ne suffit pas : un nœud peut répondre alors qu'il est en cours de synchronisation (*Donor*, *Joining*) et servir des données incomplètes. Chaque nœud expose donc un contrôle **HTTP** basé sur l'état Galera :

~~~bash title="/usr/local/bin/galera-check"
#!/usr/bin/env bash
# Répond 200 si le nœud est Synced (état 4), 503 sinon
STATE=$(mysql --defaults-file=/etc/mysql/check.cnf -Nse "SHOW STATUS LIKE 'wsrep_local_state'" 2>/dev/null | awk '{print $2}')
if [ "$STATE" = "4" ]; then
  printf 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 7\r\n\r\nSynced\n'
else
  printf 'HTTP/1.1 503 Service Unavailable\r\nContent-Type: text/plain\r\nContent-Length: 11\r\n\r\nNot synced\n'
fi
~~~

~~~ini title="/etc/systemd/system/galera-check.socket"
[Unit]
Description=Contrôle de santé Galera pour HAProxy

[Socket]
ListenStream=9200
Accept=yes

[Install]
WantedBy=sockets.target
~~~

~~~ini title="/etc/systemd/system/galera-check@.service"
[Unit]
Description=Contrôle de santé Galera (instance)

[Service]
ExecStart=/usr/local/bin/galera-check
StandardInput=socket
User=mysql
~~~

### 5. HAProxy : un seul nœud en écriture

~~~ini title="/etc/haproxy/haproxy.cfg (extrait)"
listen galera
    bind 10.10.20.30:3306
    mode tcp
    option tcpka
    option httpchk
    http-check expect status 200
    timeout client  8h
    timeout server  8h
    default-server inter 2s fall 3 rise 2 on-marked-down shutdown-sessions
    server galera-01 10.10.20.31:3306 check port 9200
    server galera-02 10.10.20.32:3306 check port 9200 backup
    server galera-03 10.10.20.33:3306 check port 9200 backup

listen stats
    bind 10.10.20.31:8404
    mode http
    stats enable
    stats uri /stats
    stats auth admin:**********
~~~

> [!WARN] Écrire sur tous les nœuds ?
> Galera l'autorise, mais deux transactions modifiant la même ligne sur deux nœuds différents provoquent un **conflit de certification** : l'une est annulée (*deadlock*). GLPI n'est pas conçu pour réessayer. Toutes les connexions vont donc vers un seul nœud ; les deux autres sont en \`backup\`.

\`on-marked-down shutdown-sessions\` coupe immédiatement les connexions vers un nœud déclaré en panne : l'application se reconnecte aussitôt au nœud suivant au lieu d'attendre un timeout.

### 6. Adresse virtuelle avec keepalived

~~~ini title="/etc/keepalived/keepalived.conf (GALERA-01)"
vrrp_script chk_haproxy {
    script "/usr/bin/killall -0 haproxy"
    interval 2
    weight -20
}

vrrp_instance VI_SQL {
    state MASTER
    interface ens18
    virtual_router_id 51
    priority 110
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass **********
    }
    virtual_ipaddress {
        10.10.20.30/24
    }
    track_script {
        chk_haproxy
    }
}
~~~

HAProxy doit pouvoir écouter sur la VIP même quand le nœud ne la porte pas : \`net.ipv4.ip_nonlocal_bind = 1\` dans \`/etc/sysctl.d/99-haproxy.conf\`.

> [!DANGER] Collision VRRP / CARP
> VRRP et CARP utilisent tous deux le protocole IP 112 et des adresses MAC virtuelles \`00:00:5e:00:01:XX\` où XX est l'identifiant. Le VLAN 20 porte déjà le **VHID 20** de pfSense : un \`virtual_router_id 20\` aurait provoqué une collision de MAC. D'où l'identifiant **51**.

## Tests de validation

| # | Scénario | Attendu | Obtenu |
|---|----------|---------|--------|
| T1 | Insertion sur GALERA-01, lecture sur 02 et 03 | Donnée visible immédiatement | OK |
| T2 | \`systemctl stop mariadb\` sur GALERA-01 en pleine écriture | Bascule vers GALERA-02 | GLPI reconnecté en ≈ 4 s |
| T3 | Arrêt de HAProxy sur GALERA-01 | VIP déplacée sur GALERA-02 | 3 s |
| T4 | Retour de GALERA-01 | IST (rattrapage incrémental) | Synced en 12 s |
| T5 | Coupure réseau de GALERA-03 | Cluster à 2, toujours *Primary* | OK, GALERA-03 se met en *non-Primary* |
| T6 | **Arrêt complet des 3 nœuds** | Redémarrage sans perte | Procédure ci-dessous validée |

### Procédure de redémarrage après arrêt complet

~~~terminal title="Identifier le nœud le plus à jour"
root@galera-01:~# cat /var/lib/mysql/grastate.dat
# GALERA saved state
version: 2.1
uuid:    8d4f1a2e-3c7b-11ef-9a1d-1f2e3d4c5b6a
seqno:   18342
safe_to_bootstrap: 0
root@galera-02:~# grep -E "seqno|safe" /var/lib/mysql/grastate.dat
seqno:   18347
safe_to_bootstrap: 1
root@galera-02:~# galera_new_cluster
root@galera-01:~# systemctl start mariadb
root@galera-03:~# systemctl start mariadb
~~~

On amorce **toujours** le nœud avec le \`seqno\` le plus élevé (ou \`safe_to_bootstrap: 1\`). Amorcer un autre nœud ferait perdre les transactions les plus récentes. Si les \`seqno\` valent \`-1\` (arrêt brutal), \`galera_recovery\` permet de retrouver la position réelle.

## Difficultés rencontrées

**1. SST interminable puis en échec.** Le premier ajout de nœud échouait : le pare-feu de l'hôte bloquait le port 4444 utilisé par mariabackup. **Solution :** ouverture explicite de 4567, 4568 et 4444 entre les trois nœuds uniquement.

**2. Sauvegarde qui ralentissait tout le cluster.** \`mariabackup\` sur un nœud actif déclenchait le *flow control* : le cluster entier attend le nœud le plus lent. **Solution :** sauvegarde sur GALERA-03 (jamais en écriture), précédée de \`SET GLOBAL wsrep_desync = ON\` et suivie de son retour à \`OFF\`.

## Compétences mobilisées

- Bases de données haute disponibilité : réplication synchrone, quorum, certification
- Répartition de charge TCP et contrôles de santé applicatifs
- VRRP et gestion des adresses virtuelles
- Rédaction de procédures de reprise testées

## Évolutions prévues

- [ ] Remplacer HAProxy par MaxScale ou ProxySQL pour séparer lectures et écritures
- [ ] Chiffrement TLS de la réplication Galera
- [ ] Supervision du *flow control* et de la taille de la file de réception dans Zabbix
`
  };

  /* ========================================================================
     P·11 — AUTOMATISATION ANSIBLE
     ======================================================================== */
  DETAILS['ansible'] = {
    duration: '4 semaines (projet E6) + extension au homelab',
    role: 'Conception et réalisation complètes — épreuve E6 du BTS SIO',
    svg: (() => {
      const k = kit('ans');
      let s = k.open(980, 450, 'Infrastructure as Code · Ansible');
      s += k.node(30, 70, 200, 62, 'Dépôt Git', ['infra-ansible', 'revue avant fusion'], C.grey);
      s += k.link([[230, 101], [290, 101]], C.lime, { w: 1.8, arrow: true, label: [260, 92, 'git pull'] });
      s += k.zone(280, 44, 330, 390, 'ANSIBLE-CTL · 10.10.10.20', C.lime);
      s += k.node(300, 76, 290, 60, 'ansible-core 2.16', ['ansible.cfg · forks 10', 'clé SSH ed25519 dédiée'], C.lime, { main: true });
      s += k.box(300, 152, 140, 132, 'Inventaires', ['production/', 'homelab/', 'group_vars/', 'host_vars/'], C.lime);
      s += k.box(450, 152, 140, 132, 'Rôles (12)', ['base', 'ssh_hardening', 'zabbix_agent', 'wazuh_agent', 'glpi_agent', 'minecraft (E6)'], C.lime);
      s += k.box(300, 298, 290, 120, 'Secrets', ['Ansible Vault (AES-256)', 'mot de passe du vault', '  → Vaultwarden', 'jamais en clair dans Git'], C.fw);
      s += k.zone(650, 44, 310, 180, 'CIBLES SSH (VLAN 10 / 20 / 30)', C.v20);
      [['Serveurs Debian', 'base + durcissement + agents'], ['Serveurs applicatifs', 'GLPI, Galera, Nginx'], ['Équipements', 'pfSense / Cisco (lecture)']].forEach(([n, sub], i) => {
        s += k.node(666, 76 + i * 46, 278, 38, n, sub, C.v20);
      });
      s += k.link([[590, 106], [650, 106]], C.v20, { w: 1.8, arrow: true, flow: 1, dash: '6 4', label: [620, 97, 'SSH'] });
      s += k.zone(650, 244, 310, 190, 'PROJET E6 · PROXMOX VE', C.pve);
      [['mc-01', '25565'], ['mc-02', '25566'], ['mc-03', '25567']].forEach(([n, p], i) => {
        s += k.node(666 + i * 98, 300, 86, 58, n, `:${p}`, C.pve, { main: true });
      });
      s += k.label(805, 384, 'déployés en parallèle · 1 commande', '#cbd5e1', 'middle', 10);
      s += k.label(805, 404, 'Java 17 · utilisateur système · tmux · systemd', '#94a3b8', 'middle', 9.5);
      s += k.link([[590, 360], [650, 360]], C.pve, { w: 1.8, arrow: true, flow: 1, dash: '6 4' });
      s += k.node(30, 160, 200, 62, 'Contrôles qualité', ['ansible-lint · yamllint', '--check --diff'], C.ok);
      s += k.node(30, 240, 200, 62, 'Idempotence', ['2ᵉ exécution', 'changed = 0'], C.ok);
      return s + k.close();
    })(),
    content: md`
## Contexte

L'administration manuelle d'un serveur, commande après commande, produit des machines **uniques et non reproductibles** : personne ne sait exactement ce qui a été modifié, et reconstruire un serveur après sinistre prend des heures.

Le projet a démarré par l'**épreuve E6 du BTS SIO** : déployer simultanément **trois serveurs applicatifs** (serveurs de jeu Minecraft, choisis comme charge applicative concrète et mesurable) sur Proxmox VE, sans aucune intervention manuelle. Il a ensuite été étendu à toute la base Linux du homelab.

**Objectifs :**

- Une **seule commande** pour amener un serveur vierge à son état cible.
- **Idempotence** : relancer le playbook ne modifie rien si tout est déjà conforme.
- Aucun secret en clair dans le dépôt.
- Du code relu et testé comme du logiciel.

## Pourquoi Ansible

| Critère | Ansible | Scripts Bash | Puppet / Chef |
|---------|---------|--------------|---------------|
| Agent sur les cibles | **Aucun** (SSH) | Aucun | Oui |
| Idempotence | Native (modules) | À coder soi-même | Native |
| Courbe d'apprentissage | YAML lisible | Faible mais fragile | Langage dédié |
| Écosystème | Collections Proxmox, Cisco, Windows | — | Large |

## Organisation du dépôt

~~~ascii title="infra-ansible/"
infra-ansible/
├── ansible.cfg
├── requirements.yml                 collections (community.general, ansible.posix)
├── inventories/
│   ├── homelab/
│   │   ├── hosts.yml
│   │   ├── group_vars/
│   │   │   ├── all/
│   │   │   │   ├── main.yml
│   │   │   │   └── vault.yml        chiffré (ansible-vault)
│   │   │   ├── debian.yml
│   │   │   └── minecraft.yml
│   │   └── host_vars/
│   └── e6/
│       └── hosts.yml
├── roles/
│   ├── base/                        paquets, NTP, locale, unattended-upgrades
│   ├── ssh_hardening/
│   ├── zabbix_agent/
│   ├── wazuh_agent/
│   ├── glpi_agent/
│   └── minecraft/                   projet E6
├── playbooks/
│   ├── site.yml
│   ├── e6-minecraft.yml
│   └── proxmox-provision.yml
└── .ansible-lint
~~~

## Configuration

~~~ini title="ansible.cfg"
[defaults]
inventory          = inventories/homelab/hosts.yml
roles_path         = roles
forks              = 10
host_key_checking  = True
retry_files_enabled = False
stdout_callback    = yaml
interpreter_python = auto_silent
vault_password_file = ~/.ansible/vault-pass.sh

[ssh_connection]
pipelining         = True
ssh_args           = -o ControlMaster=auto -o ControlPersist=60s
~~~

\`vault-pass.sh\` récupère le mot de passe du vault dans Vaultwarden via la CLI \`bw\` : il n'est stocké nulle part sur le disque.

~~~yaml title="inventories/homelab/hosts.yml (extrait)"
all:
  vars:
    ansible_user: ansible
    ansible_ssh_private_key_file: ~/.ssh/id_ed25519_ansible
  children:
    debian:
      children:
        srv:
          hosts:
            glpi:      { ansible_host: 10.10.20.40 }
            zabbix:    { ansible_host: 10.10.20.50 }
            wazuh:     { ansible_host: 10.10.20.60 }
            galera-01: { ansible_host: 10.10.20.31 }
            galera-02: { ansible_host: 10.10.20.32 }
            galera-03: { ansible_host: 10.10.20.33 }
        dmz:
          hosts:
            nginx-rp:    { ansible_host: 10.10.30.10 }
            vaultwarden: { ansible_host: 10.10.30.20 }
        mgmt:
          hosts:
            bastion: { ansible_host: 10.10.10.50 }
~~~

## Rôle de durcissement SSH

~~~yaml title="roles/ssh_hardening/tasks/main.yml"
---
- name: Déployer la configuration SSH durcie
  ansible.builtin.template:
    src: sshd_config.j2
    dest: /etc/ssh/sshd_config.d/10-hardening.conf
    owner: root
    group: root
    mode: "0600"
    validate: /usr/sbin/sshd -t -f %s
  notify: Redémarrer sshd

- name: Restreindre l'accès SSH au groupe ssh-users
  ansible.builtin.group:
    name: ssh-users
    state: present

- name: Ajouter le compte d'automatisation au groupe ssh-users
  ansible.builtin.user:
    name: ansible
    groups: ssh-users
    append: true

- name: Supprimer les clés hôtes DSA et ECDSA
  ansible.builtin.file:
    path: "{{ item }}"
    state: absent
  loop:
    - /etc/ssh/ssh_host_dsa_key
    - /etc/ssh/ssh_host_dsa_key.pub
    - /etc/ssh/ssh_host_ecdsa_key
    - /etc/ssh/ssh_host_ecdsa_key.pub
  notify: Redémarrer sshd
~~~

~~~text title="roles/ssh_hardening/templates/sshd_config.j2"
# {{ ansible_managed }}
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowGroups ssh-users
MaxAuthTries 3
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowAgentForwarding no
KexAlgorithms sntrup761x25519-sha512@openssh.com,curve25519-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
{% if ssh_allowed_from is defined %}
# Accès restreint par réseau source
Match Address {{ ssh_allowed_from | join(',') }}
    PasswordAuthentication no
{% endif %}
~~~

Le paramètre \`validate\` est essentiel : si la configuration générée est invalide, \`sshd -t\` échoue et **le fichier n'est pas déployé**. Sans lui, une faute de frappe pourrait couper l'accès SSH à tout le parc.

## Projet E6 : trois serveurs applicatifs en parallèle

### Provisionnement des VM sur Proxmox

~~~yaml title="playbooks/proxmox-provision.yml"
---
- name: Créer les VM à partir du modèle cloud-init Debian 12
  hosts: localhost
  gather_facts: false
  vars:
    pve_api: &pve_api
      api_host: 10.10.10.11
      api_user: ansible@pve
      api_token_id: provision
      api_token_secret: "{{ vault_pve_token_secret }}"
  tasks:
    - name: Cloner le modèle pour chaque serveur
      community.general.proxmox_kvm:
        <<: *pve_api
        node: pve1
        clone: tpl-debian12-cloudinit
        name: "{{ item.name }}"
        newid: "{{ item.vmid }}"
        full: true
        storage: vm-pool
        timeout: 300
      loop: "{{ e6_servers }}"

    - name: Configurer l'adresse IP et la clé SSH (cloud-init)
      community.general.proxmox_kvm:
        <<: *pve_api
        node: pve1
        name: "{{ item.name }}"
        ipconfig:
          ipconfig0: "ip={{ item.ip }}/24,gw=10.10.20.1"
        sshkeys: "{{ lookup('file', '~/.ssh/id_ed25519_ansible.pub') }}"
        update: true
      loop: "{{ e6_servers }}"

    - name: Démarrer les VM
      community.general.proxmox_kvm:
        <<: *pve_api
        node: pve1
        name: "{{ item.name }}"
        state: started
      loop: "{{ e6_servers }}"
~~~

### Rôle applicatif

~~~yaml title="roles/minecraft/tasks/main.yml"
---
- name: Installer Java 17 et tmux
  ansible.builtin.apt:
    name: [openjdk-17-jre-headless, tmux]
    state: present
    update_cache: true
    cache_valid_time: 3600

- name: Créer l'utilisateur système dédié
  ansible.builtin.user:
    name: minecraft
    system: true
    home: /opt/minecraft
    shell: /usr/sbin/nologin
    create_home: true

- name: Télécharger le serveur (somme de contrôle vérifiée)
  ansible.builtin.get_url:
    url: "{{ minecraft_jar_url }}"
    dest: /opt/minecraft/server.jar
    checksum: "sha1:{{ minecraft_jar_sha1 }}"
    owner: minecraft
    group: minecraft
    mode: "0644"
  notify: Redémarrer minecraft

- name: Accepter le CLUF
  ansible.builtin.copy:
    dest: /opt/minecraft/eula.txt
    content: "eula=true\n"
    owner: minecraft
    group: minecraft
    mode: "0644"

- name: Déployer server.properties (port propre à chaque hôte)
  ansible.builtin.template:
    src: server.properties.j2
    dest: /opt/minecraft/server.properties
    owner: minecraft
    group: minecraft
    mode: "0644"
  notify: Redémarrer minecraft

- name: Déployer l'unité systemd
  ansible.builtin.template:
    src: minecraft.service.j2
    dest: /etc/systemd/system/minecraft.service
    mode: "0644"
  notify: Redémarrer minecraft

- name: Activer et démarrer le service
  ansible.builtin.systemd:
    name: minecraft
    enabled: true
    state: started
    daemon_reload: true
~~~

~~~ini title="roles/minecraft/templates/minecraft.service.j2"
# {{ ansible_managed }}
[Unit]
Description=Serveur applicatif {{ inventory_hostname }}
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=minecraft
WorkingDirectory=/opt/minecraft
ExecStart=/usr/bin/tmux new-session -d -s minecraft '/usr/bin/java -Xms{{ mc_heap_min }} -Xmx{{ mc_heap_max }} -jar server.jar nogui'
ExecStop=/usr/bin/tmux send-keys -t minecraft "stop" Enter
TimeoutStopSec=60
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
~~~

La session **tmux** permet à un administrateur de se rattacher à la console du serveur (\`sudo -u minecraft tmux attach -t minecraft\`) sans interrompre le service, tandis que systemd garantit le démarrage automatique et le redémarrage en cas d'échec.

## Exécution et idempotence

~~~terminal title="Première exécution puis seconde exécution"
enzo@ansible-ctl:~/infra-ansible$ ansible-playbook -i inventories/e6 playbooks/e6-minecraft.yml
PLAY RECAP *********************************************************************
mc-01   : ok=14   changed=11   unreachable=0    failed=0    skipped=0
mc-02   : ok=14   changed=11   unreachable=0    failed=0    skipped=0
mc-03   : ok=14   changed=11   unreachable=0    failed=0    skipped=0
enzo@ansible-ctl:~/infra-ansible$ ansible-playbook -i inventories/e6 playbooks/e6-minecraft.yml
PLAY RECAP *********************************************************************
mc-01   : ok=14   changed=0    unreachable=0    failed=0    skipped=0
mc-02   : ok=14   changed=0    unreachable=0    failed=0    skipped=0
mc-03   : ok=14   changed=0    unreachable=0    failed=0    skipped=0
~~~

\`changed=0\` à la seconde exécution : c'est la **preuve d'idempotence**. Le playbook peut être relancé à tout moment pour corriger une dérive de configuration.

## Gestion des secrets

~~~terminal title="Chiffrement d'une variable"
enzo@ansible-ctl:~/infra-ansible$ ansible-vault encrypt_string --name 'vault_pve_token_secret' '**********'
vault_pve_token_secret: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          6132386536653033376662353763316263393735353334626162353836363162...
Encryption successful
~~~

Convention : toute variable secrète est préfixée \`vault_\` et n'est jamais utilisée directement dans un rôle. Une variable claire y fait référence (\`pve_token_secret: "{{ vault_pve_token_secret }}"\`), ce qui permet de savoir où elle est définie d'un simple \`grep\`.

## Tests de validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Déploiement des 3 serveurs E6 sur des VM vierges | Services accessibles | OK en ≈ 6 min |
| T2 | Seconde exécution | \`changed=0\` | \`changed=0\` sur les 3 hôtes |
| T3 | Modification manuelle de \`sshd_config\` puis exécution | Dérive corrigée | Fichier restauré, \`changed=1\` |
| T4 | \`ansible-lint\` | Aucune erreur | 0 erreur, profil *production* |
| T5 | \`--check --diff\` avant chaque mise en production | Aperçu exact des changements | OK |
| T6 | Serveur détruit puis recréé | Identique | Reconstruit en 4 min |

## Difficultés rencontrées

**1. Handlers non déclenchés en cas d'échec.** Si une tâche échouait après une modification, le handler de redémarrage n'était jamais exécuté et le service tournait avec l'ancienne configuration. **Solution :** \`force_handlers = True\` pour les rôles critiques, ou \`meta: flush_handlers\` aux étapes clés.

**2. Clés d'hôte SSH changées après recréation des VM.** \`host_key_checking\` bloquait la connexion. **Solution :** suppression de l'ancienne clé de \`known_hosts\` dans le playbook de provisionnement plutôt que de désactiver la vérification (qui ouvrirait la porte à une attaque de l'homme du milieu).

## Compétences mobilisées

- Infrastructure as Code : inventaires, rôles, templates Jinja2, handlers
- Automatisation de l'hyperviseur via son API (jetons à privilèges limités)
- Gestion sécurisée des secrets
- Qualité logicielle appliquée à l'infra : Git, lint, revue, tests d'idempotence
- Gestion de services Linux (systemd, utilisateurs système, durcissement)

## Évolutions prévues

- [ ] Pipeline CI (lint + Molecule) à chaque *merge request*
- [ ] Terraform pour le provisionnement des VM, Ansible pour leur configuration
- [ ] Rôles Windows (WinRM) pour les serveurs membres du domaine
`
  };

  /* ========================================================================
     P·12 — ARCHITECTURE DE SWITCHS CISCO
     ======================================================================== */
  DETAILS['switching'] = {
    duration: '3 semaines (homelab) · appliqué en mission',
    role: 'Conception du plan VLAN, configurations, sécurité de niveau 2',
    svg: (() => {
      const k = kit('sw');
      let s = k.open(980, 460, 'Commutation · cœur et accès sécurisés');
      s += k.node(260, 50, 200, 50, 'PFSENSE-01', 'lagg0 · LACP', C.fw);
      s += k.node(520, 50, 200, 50, 'PFSENSE-02', 'lagg0 · LACP', C.fw);
      s += k.link([[330, 100], [330, 130], [470, 130], [470, 160]], C.v10, { w: 2.4, label: [400, 124, 'Po1'] });
      s += k.link([[650, 100], [650, 130], [510, 130], [510, 160]], C.v10, { w: 2.4, label: [580, 124, 'Po2'] });
      s += k.node(340, 160, 300, 70, 'SW-CORE-01', ['racine STP (priorité 4096)', 'VLAN 10-50 · natif 999'], C.sw, { main: true });
      s += k.pill(490, 250, 'Rapid-PVST+ · trunks 802.1Q', C.v20);
      s += k.link([[400, 230], [400, 270], [200, 270], [200, 300]], C.v20, { w: 2.2, label: [300, 264, 'Po10 · 2 × 1 GbE'] });
      s += k.link([[580, 230], [580, 270], [780, 270], [780, 300]], C.v40, { w: 2.2, label: [680, 264, 'Po20 · 2 × 1 GbE'] });
      s += k.node(80, 300, 240, 64, 'SW-ACCESS-01 · bureautique', ['accès VLAN 60 · voix 40', '802.1X + MAB'], C.sw);
      s += k.node(660, 300, 240, 64, 'SW-ACCESS-02 · atelier (OT)', ['VLAN 40 OT isolé', 'ports figés (sticky MAC)'], C.sw);
      s += k.box(20, 384, 300, 66, 'Protection des ports d’accès', ['PortFast + BPDU Guard · port-security', 'storm-control · DHCP snooping · DAI'], C.ok);
      s += k.box(340, 384, 300, 66, 'Ports de liaison (uplinks)', ['trust DHCP snooping / ARP', 'root guard vers l’accès'], C.v20);
      s += k.box(660, 384, 300, 66, 'Exploitation', ['archive config → TFTP + Git', 'SNMPv3 · syslog · NTP'], C.v10);
      s += k.box(20, 50, 210, 96, 'Plan VLAN', ['10 MGMT    20 SRV', '30 DMZ     40 VOIP-IOT', '50 PXE     60 BUREAUTIQUE', '999 natif (aucun port)'], C.v20);
      s += k.box(750, 50, 210, 96, 'Règles d’or', ['pas de VLAN 1', 'DTP désactivé', 'ports inutilisés : shut', 'VLAN parking 998'], C.fw);
      return s + k.close();
    })(),
    content: md`
## Contexte

Sur un site industriel, le réseau bureautique, la téléphonie, les équipements de production et parfois les accès invités partagent la même infrastructure physique. La **segmentation de niveau 2** est la première ligne de défense, et une couche 2 mal configurée est aussi la première cause de pannes réseau (boucles, serveur DHCP pirate, tempêtes de broadcast).

> [!NOTE] Mission et homelab
> Les principes ci-dessous sont ceux que j'applique en mission ; les configurations publiées sont celles de mon homelab (Cisco Catalyst, IOS 15.2). Les plans d'adressage du client ne sont pas publiés.

**Objectifs :**

- Une architecture lisible : cœur, accès, liaisons agrégées.
- Aucun port d'accès capable de provoquer une boucle ou d'usurper un service.
- Des configurations **standardisées** et sauvegardées automatiquement.

## Plan VLAN

| VLAN | Nom | Usage | Routage |
|------|-----|-------|---------|
| 10 | MGMT | Administration des équipements | pfSense |
| 20 | SRV | Serveurs | pfSense |
| 30 | DMZ | Services exposés | pfSense |
| 40 | VOIP-IOT | Téléphonie et équipements OT | pfSense |
| 50 | PXE | Déploiement de postes | pfSense |
| 60 | BUREAUTIQUE | Postes utilisateurs (banc de test 802.1X, hors schéma principal) | pfSense |
| 998 | PARKING | Ports inutilisés (shutdown) | Aucun |
| 999 | NATIF-MORT | VLAN natif des trunks | Aucun |

## Configuration de base commune

~~~cisco title="Socle commun à tous les switchs"
hostname SW-ACCESS-01
no ip http server
no ip http secure-server
no ip domain-lookup
ip domain-name lab.enzomarechal.fr
service password-encryption
service timestamps log datetime msec localtime show-timezone
enable algorithm-type scrypt secret **********
username admin privilege 15 algorithm-type scrypt secret **********
!
crypto key generate rsa modulus 2048
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
!
access-list 11 remark Administration depuis le VLAN 10 et le VPN uniquement
access-list 11 permit 10.10.10.0 0.0.0.255
access-list 11 permit 10.99.0.0 0.0.0.255
access-list 11 deny any log
!
line vty 0 15
 access-class 11 in
 transport input ssh
 login local
 exec-timeout 10 0
line con 0
 login local
 exec-timeout 10 0
!
clock timezone CET 1 0
clock summer-time CEST recurring last Sun Mar 2:00 last Sun Oct 3:00
ntp server 10.10.10.1
logging host 10.10.20.60
logging trap informational
!
vtp mode transparent
spanning-tree mode rapid-pvst
spanning-tree extend system-id
errdisable recovery cause bpduguard
errdisable recovery cause psecure-violation
errdisable recovery interval 600
~~~

> [!INFO] VTP en mode transparent
> En mode serveur/client, un switch ajouté avec un numéro de révision VTP plus élevé peut **effacer tous les VLAN** du domaine. Le mode transparent supprime ce risque : chaque switch gère ses VLAN localement.

## Spanning Tree maîtrisé

~~~cisco title="SW-CORE-01 — le cœur est toujours la racine"
spanning-tree vlan 10,20,30,40,50,60 priority 4096
!
interface range Port-channel10 , Port-channel20
 spanning-tree guard root
~~~

Le **root guard** sur les liaisons vers l'accès empêche un switch d'accès (ou un switch personnel branché par un utilisateur) de devenir racine et de rerouter tout le trafic.

## Liaisons agrégées vers l'accès

~~~cisco title="SW-CORE-01 — Po10 vers SW-ACCESS-01"
interface range GigabitEthernet1/0/21 - 22
 description UPLINK SW-ACCESS-01
 channel-group 10 mode active
!
interface Port-channel10
 description TRUNK SW-ACCESS-01
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport nonegotiate
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,60
~~~

Seuls les VLAN réellement nécessaires sont autorisés sur chaque trunk (**pruning manuel**) : SW-ACCESS-01 ne voit jamais le VLAN serveurs ni la DMZ.

## Ports d'accès sécurisés

~~~cisco title="SW-ACCESS-01 — modèle de port utilisateur" hl="8-11,13-15"
interface range GigabitEthernet1/0/1 - 20
 description ACCES-UTILISATEUR
 switchport mode access
 switchport access vlan 60
 switchport voice vlan 40
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 3
 switchport port-security violation restrict
 switchport port-security aging time 60
 switchport port-security aging type inactivity
 storm-control broadcast level 5.00
 storm-control multicast level 10.00
 spanning-tree portfast
 spanning-tree bpduguard enable
 ip dhcp snooping limit rate 15
!
interface range GigabitEthernet1/0/21 - 24
 description NON-UTILISE
 switchport mode access
 switchport access vlan 998
 shutdown
~~~

| Mécanisme | Protège contre |
|-----------|----------------|
| \`switchport nonegotiate\` | Négociation DTP d'un trunk par un poste (VLAN hopping) |
| \`port-security maximum 3\` | Switch non autorisé branché derrière une prise (poste + téléphone + marge) |
| \`bpduguard\` | Boucle créée en branchant les deux extrémités d'un câble |
| \`storm-control\` | Tempête de broadcast saturant le VLAN |
| \`dhcp snooping limit rate\` | Épuisement du pool DHCP |
| VLAN 998 + \`shutdown\` | Branchement opportuniste sur une prise libre |

## DHCP snooping et inspection ARP

~~~cisco title="SW-ACCESS-01 — protection contre les serveurs DHCP pirates et l'ARP spoofing"
ip dhcp snooping vlan 40,60
no ip dhcp snooping information option
ip dhcp snooping database flash:dhcp-snooping.db
ip dhcp snooping
ip arp inspection vlan 40,60
ip arp inspection validate src-mac dst-mac ip
!
interface Port-channel1
 description UPLINK vers SW-CORE-01
 ip dhcp snooping trust
 ip arp inspection trust
~~~

Seul le port de liaison est « de confiance » : une offre DHCP arrivant sur un port utilisateur (une box branchée par erreur, un poste compromis) est **détruite**. L'inspection ARP s'appuie sur la table construite par le snooping pour rejeter les réponses ARP falsifiées.

> [!WARN] Équipements en adressage fixe
> Les équipements à IP statique n'apparaissent pas dans la table du DHCP snooping : DAI les bloquerait. Il faut les déclarer via une ACL ARP (\`arp access-list\`) ou les placer dans un VLAN non inspecté. C'est le cas des automates de l'atelier.

## Segment OT (atelier)

Sur SW-ACCESS-02, les ports des équipements de production sont **figés** :

~~~cisco title="SW-ACCESS-02 — port d'un automate"
interface GigabitEthernet1/0/3
 description PLC-LIGNE-1
 switchport mode access
 switchport access vlan 40
 switchport port-security
 switchport port-security maximum 1
 switchport port-security mac-address sticky
 switchport port-security violation shutdown
 spanning-tree portfast
 spanning-tree bpduguard enable
~~~

Avec \`sticky\`, l'adresse MAC apprise est inscrite dans la configuration : si l'automate est remplacé par un autre équipement, le port passe en *err-disabled* et une alerte remonte dans Zabbix et Wazuh.

## Sauvegarde automatique des configurations

~~~cisco title="Archivage à chaque write memory"
archive
 path tftp://10.10.10.20/configs/$h-
 write-memory
 time-period 1440
~~~

Sur \`ANSIBLE-CTL\`, un timer systemd versionne les fichiers reçus dans Git : chaque modification de configuration est **historisée et comparable** (\`git diff\`).

## Tests de validation

~~~terminal title="SW-ACCESS-01 — vérifications"
SW-ACCESS-01# show spanning-tree vlan 60 | include Root ID|Priority|This bridge
Root ID    Priority    4156
             This bridge is the root
SW-ACCESS-01# show port-security interface gi1/0/5 | include Status|Maximum|Violation
Port Status                : Secure-up
Maximum MAC Addresses      : 3
Violation Mode             : Restrict
SW-ACCESS-01# show ip dhcp snooping binding | count 10.10.
Number of lines which match regexp = 17
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Câble branché en boucle sur deux ports | Port coupé immédiatement | \`err-disabled (bpduguard)\`, réactivé après 10 min |
| T2 | Serveur DHCP (dnsmasq) sur un portable | Aucun client servi | Offres détruites, compteur incrémenté |
| T3 | \`arpspoof\` depuis un poste | Paquets rejetés | Logs \`%SW_DAI-4-DHCP_SNOOPING_DENY\` |
| T4 | Mini-switch avec 5 postes derrière une prise | Limité à 3 MAC | Violation journalisée |
| T5 | Négociation de trunk (yersinia DTP) | Refus | Aucun trunk monté |
| T6 | Coupure d'un lien de Po10 | Aucune interruption | Trafic sur le lien restant, 0 perte |

## Difficultés rencontrées

**1. Téléphones en *err-disabled* après une coupure électrique.** Au redémarrage, le téléphone et le PC se présentaient simultanément avec une MAC de plus que prévu pendant la phase LLDP. **Solution :** \`maximum 3\` au lieu de 2 et mode \`restrict\` (journalise sans couper) sur les ports utilisateurs ; \`shutdown\` réservé aux ports OT.

**2. Base DHCP snooping perdue au redémarrage.** Après un reboot du switch, les postes à bail long étaient bloqués par DAI. **Solution :** persistance de la base (\`ip dhcp snooping database flash:\`).

## Compétences mobilisées

- Conception d'une architecture LAN et d'un plan VLAN
- Spanning Tree (Rapid-PVST+), EtherChannel LACP
- Sécurité de niveau 2 : port-security, BPDU guard, DHCP snooping, DAI, storm-control
- Spécificités des réseaux industriels (OT)
- Gestion de configuration et traçabilité

## Évolutions prévues

- [ ] Authentification 802.1X généralisée (voir le projet PKI / NPS)
- [ ] Configuration générée depuis des modèles Ansible (\`cisco.ios\`)
- [ ] Routage inter-VLAN sur le cœur pour les flux internes à fort débit, pfSense conservé pour le filtrage des zones sensibles
`
  };

  /* ========================================================================
     P·13 — SAUVEGARDE 3-2-1 AVEC PROXMOX BACKUP SERVER
     ======================================================================== */
  DETAILS['backup'] = {
    duration: '2 semaines + tests de restauration mensuels',
    role: 'Conception de la stratégie, déploiement, plan de reprise',
    svg: (() => {
      const k = kit('pbs');
      let s = k.open(980, 450, 'Stratégie 3-2-1 · Proxmox Backup Server');
      s += k.zone(20, 44, 270, 250, 'COPIE 1 · PRODUCTION', C.pve, 'Ceph ×3');
      [['PVE-01', 76], ['PVE-02', 140], ['PVE-03', 204]].forEach(([n, y]) => {
        s += k.node(40, y, 230, 50, n, 'vzdump snapshot · chiffré client', C.pve);
        s += k.link([[270, y + 25], [330, y + 25], [330, 160], [360, 160]], C.pve, { w: 1.3, op: 0.6, dash: '5 4', flow: 1.3 });
      });
      s += k.zone(350, 44, 300, 250, 'COPIE 2 · PBS-01 · 10.10.10.30', C.v10, 'ZFS miroir');
      s += k.node(370, 76, 260, 64, 'Datastore store1', ['déduplication par blocs', 'ratio ≈ 7,8'], C.v10, { main: true });
      s += k.box(370, 154, 125, 124, 'Rétention', ['7 quotidiennes', '4 hebdo', '6 mensuelles'], C.v10);
      s += k.box(505, 154, 125, 124, 'Tâches', ['prune 03:00', 'verify sam.', 'GC dim.'], C.v10);
      s += k.zone(690, 44, 270, 250, 'COPIE 3 · HORS SITE', C.ok, 'autre lieu');
      s += k.node(710, 76, 230, 64, 'PBS-OFFSITE', ['synchronisation en pull', 'via WireGuard site-à-site'], C.ok, { main: true });
      s += k.node(710, 160, 230, 50, 'Lecture seule côté lab', 'compte sync@pbs limité', C.ok);
      s += k.node(710, 226, 230, 50, 'Disque USB trimestriel', 'déconnecté (air gap)', C.grey);
      s += k.link([[630, 108], [710, 108]], C.ok, { w: 2, arrow: true, flow: 1.2, dash: '6 4', label: [670, 99, 'pull 05:00'] });
      s += k.box(20, 314, 300, 122, 'Règle 3-2-1', ['3 copies des données', '2 supports différents (SSD / HDD)', '1 copie hors site', '+ 1 copie hors ligne (USB)'], C.v40);
      s += k.box(340, 314, 300, 122, 'Chiffrement', ['AES-256-GCM côté client', 'clé hors de PBS', 'clé papier dans un coffre', 'PBS ne voit que du chiffré'], C.fw);
      s += k.box(660, 314, 300, 122, 'Objectifs', ['RPO : 24 h', 'RTO VM critique : < 30 min', 'test mensuel de restauration', 'journal des tests dans GLPI'], C.v20);
      return s + k.close();
    })(),
    content: md`
## Contexte

Un cluster haute disponibilité protège contre la **panne matérielle**, pas contre la **perte de données** : une suppression accidentelle, un rançongiciel ou une corruption logique sont répliqués instantanément sur les trois nœuds Ceph. Seule une sauvegarde indépendante, historisée et testée protège contre ces scénarios.

**Objectifs :**

| Indicateur | Cible |
|------------|-------|
| RPO (perte de données maximale) | 24 h |
| RTO d'une VM critique | < 30 min |
| Copies | Règle 3-2-1 respectée |
| Protection rançongiciel | Copie hors site non modifiable depuis le lab + copie hors ligne |
| Preuve | Test de restauration mensuel documenté |

## Pourquoi Proxmox Backup Server

| Fonction | vzdump vers NFS | **PBS** |
|----------|-----------------|---------|
| Incrémental | Non (sauvegarde complète à chaque fois) | Oui (dirty bitmaps) |
| Déduplication | Non | Par blocs, entre toutes les VM |
| Chiffrement côté client | Non | Oui (AES-256-GCM) |
| Vérification d'intégrité | Non | Tâches planifiées |
| Restauration de fichiers isolés | Non | Oui, depuis l'interface |
| Synchronisation distante | Manuelle | Native |

## Mise en œuvre

### 1. Stockage du serveur PBS

~~~bash title="PBS-01 (10.10.10.30) — datastore sur ZFS en miroir"
zpool create -o ashift=12 backup mirror /dev/disk/by-id/ata-WDC_WD40EFPX-1 /dev/disk/by-id/ata-WDC_WD40EFPX-2
zfs set atime=off backup
zfs set compression=off backup         # PBS compresse déjà en zstd
zfs create backup/store1
proxmox-backup-manager datastore create store1 /backup/store1
proxmox-backup-manager datastore update store1 --gc-schedule 'sun 04:00'
~~~

Les disques sont désignés par leur identifiant (\`/dev/disk/by-id/\`) et non par \`/dev/sdX\`, dont l'ordre peut changer au redémarrage.

### 2. Comptes et droits minimaux

~~~bash title="Jeton dédié à Proxmox VE, sans droit de suppression"
proxmox-backup-manager user create backup@pbs --comment "Sauvegardes du cluster PVE"
proxmox-backup-manager user generate-token backup@pbs pve
proxmox-backup-manager acl update /datastore/store1 DatastoreBackup --auth-id 'backup@pbs!pve'
~~~

> [!SEC] Protection contre le rançongiciel
> Le rôle \`DatastoreBackup\` permet de **créer** des sauvegardes mais pas de **supprimer** les anciennes : un attaquant qui compromettrait un hyperviseur ne pourrait pas effacer l'historique. Seules les tâches de *prune* internes à PBS suppriment des sauvegardes.

### 3. Ajout du stockage dans le cluster avec chiffrement

~~~bash title="Sur PVE-01 (configuration partagée par tout le cluster)"
pvesm add pbs pbs-01 \
  --server 10.10.10.30 \
  --datastore store1 \
  --username 'backup@pbs!pve' \
  --password '**********' \
  --fingerprint 'a3:7f:...:9c' \
  --encryption-key autogen

# Clé générée dans /etc/pve/priv/storage/pbs-01.enc → version papier à conserver hors ligne
proxmox-backup-client key paperkey /etc/pve/priv/storage/pbs-01.enc --output-format text
~~~

> [!DANGER] Sans la clé, aucune restauration
> Si le cluster est perdu **et** que la clé n'a pas été sauvegardée ailleurs, les sauvegardes sont définitivement illisibles. La clé est imprimée (QR code) et conservée dans un coffre physique, ainsi que dans Vaultwarden.

### 4. Planification

| Tâche | Où | Planification | Détail |
|-------|----|---------------|--------|
| Sauvegarde de toutes les VM / CT | Cluster PVE | Tous les jours 01:00 | Mode *snapshot*, notification en cas d'échec |
| Sauvegarde de \`/etc/pve\` et \`/etc\` des nœuds | PVE (client PBS) | Tous les jours 01:30 | Archive \`pxar\` |
| Prune | PBS | Tous les jours 03:00 | 7 j / 4 s / 6 m |
| Vérification | PBS | Samedi 03:00 | Re-vérifie les sauvegardes de plus de 30 jours |
| Garbage collection | PBS | Dimanche 04:00 | Libère les blocs orphelins |
| Synchronisation hors site | PBS-OFFSITE | Tous les jours 05:00 | Mode *pull* |

~~~bash title="Tâches de maintenance du datastore"
proxmox-backup-manager prune-job create daily-prune --store store1 --schedule '03:00' \
  --keep-daily 7 --keep-weekly 4 --keep-monthly 6

proxmox-backup-manager verify-job create weekly-verify --store store1 --schedule 'sat 03:00' \
  --ignore-verified true --outdated-after 30
~~~

~~~bash title="Sauvegarde de la configuration des hyperviseurs"
export PBS_REPOSITORY='backup@pbs!pve@10.10.10.30:store1'
export PBS_PASSWORD='**********'
proxmox-backup-client backup pve-etc.pxar:/etc/pve etc.pxar:/etc \
  --keyfile /etc/pve/priv/storage/pbs-01.enc --backup-id "$(hostname)-config"
~~~

### 5. Copie hors site en mode pull

Le serveur distant **tire** les sauvegardes. Le lab n'a aucun identifiant lui permettant d'écrire ou de supprimer sur le site distant : même un lab entièrement compromis ne peut pas détruire la copie hors site.

~~~bash title="PBS-OFFSITE — déclaration de la source et tâche de synchronisation"
proxmox-backup-manager remote create pbs-lab \
  --host 10.10.10.30 --auth-id 'sync@pbs!offsite' --password '**********' \
  --fingerprint 'a3:7f:...:9c'

proxmox-backup-manager sync-job create pull-lab \
  --store offsite --remote pbs-lab --remote-store store1 \
  --schedule '05:00' --remove-vanished false
~~~

\`--remove-vanished false\` : une sauvegarde supprimée sur PBS-01 **reste** sur le site distant.

## Tests de restauration

> [!INFO] Une sauvegarde non testée n'est pas une sauvegarde
> Chaque mois, une VM tirée au sort est restaurée sur un identifiant libre, démarrée dans un VLAN isolé et vérifiée fonctionnellement. Le résultat et le temps mesuré sont consignés dans un ticket GLPI.

~~~terminal title="Restauration de DC01 sur un nouvel identifiant (test)"
root@pve2:~# pvesm list pbs-01 --vmid 101 | tail -2
pbs-01:backup/vm/101/2026-10-11T23:00:04Z  pbs-vm  64.0G
pbs-01:backup/vm/101/2026-10-12T23:00:03Z  pbs-vm  64.0G
root@pve2:~# qmrestore pbs-01:backup/vm/101/2026-10-12T23:00:03Z 901 --storage vm-pool --unique 1
restore-scsi0: transferred 64.0 GiB of 64.0 GiB (100.00%) in 6m 41s
restore image complete (bytes=68719476736, duration=401.32s, speed=163.30MB/s)
rescan volumes...
TASK OK
~~~

| Date | VM restaurée | Taille | Durée | Vérification | Résultat |
|------|--------------|--------|-------|--------------|----------|
| Juillet | GLPI | 40 Go | 4 min 50 | Connexion web + ticket de test | ✓ |
| Août | DC01 | 64 Go | 6 min 41 | Ouverture de session, \`dcdiag\` en réseau isolé | ✓ |
| Septembre | VAULTWARDEN | 20 Go | 2 min 30 | Connexion, lecture d'un secret | ✓ |
| Octobre | Restauration d'un **fichier** de GLPI | 1 fichier | 40 s | Contenu identique (hash) | ✓ |
| Annuel | Reconstruction d'un nœud PVE complet | — | 48 min | Réintégration au cluster depuis \`/etc/pve\` sauvegardé | ✓ |

> [!WARN] Contrôleur de domaine restauré
> Un DC restauré ne doit **jamais** être connecté au réseau de production en même temps que l'original (conflit d'USN et de réplication). Le test se fait dans un VLAN isolé, puis la VM de test est détruite.

## Résultats

- Ratio de déduplication de **7,8** : 38 VM et conteneurs avec 6 mois d'historique tiennent sur 1,9 To.
- RPO de 24 h tenu, RTO mesuré de 2 à 7 minutes par VM (bien en dessous de l'objectif de 30 minutes).
- Procédure de reprise d'activité rédigée et testée : ordre de redémarrage (pfSense → DC → bases → applications).

## Difficultés rencontrées

**1. Sauvegardes très lentes la première semaine.** Le premier passage est complet ; les suivants s'appuient sur les *dirty bitmaps*, qui sont **perdus à chaque arrêt de la VM**. **Solution :** planifier les arrêts de maintenance juste avant la sauvegarde nocturne plutôt qu'après.

**2. Datastore rempli plus vite que prévu.** La GC ne libère l'espace qu'après un délai de sécurité de 24 h. **Solution :** alerte Zabbix à 70 % et dimensionnement basé sur l'occupation réelle mesurée pendant un mois.

## Compétences mobilisées

- Stratégie de sauvegarde (3-2-1, RPO / RTO) et plan de reprise d'activité
- Proxmox Backup Server, ZFS, chiffrement côté client
- Protection contre les rançongiciels : droits minimaux, architecture *pull*, copie hors ligne
- Méthodologie de test de restauration et traçabilité

## Évolutions prévues

- [ ] Sauvegarde sur bande LTO ou stockage objet S3 avec verrouillage (*object lock*)
- [ ] Test de restauration automatisé (restauration + démarrage + test HTTP) chaque semaine
- [ ] Sauvegarde des postes nomades avec \`proxmox-backup-client\`
`
  };

  /* ========================================================================
     P·14 — RMM & AUTOMATISATION POWERSHELL
     ======================================================================== */
  DETAILS['rmm'] = {
    duration: 'En continu depuis le début de la mission',
    role: 'Bibliothèque de scripts, politiques de supervision et de correctifs',
    svg: (() => {
      const k = kit('rmm');
      let s = k.open(980, 450, 'RMM · supervision et remédiation à distance');
      s += k.node(370, 50, 240, 64, 'Console RMM', ['politiques · alertes', 'exécution de scripts'], C.lime, { main: true });
      s += k.node(40, 50, 240, 64, 'Bibliothèque de scripts', ['dépôt Git · revue', 'versionnée et signée'], C.grey);
      s += k.link([[280, 82], [370, 82]], C.lime, { w: 1.8, arrow: true, label: [325, 74, 'publication'] });
      s += k.node(700, 50, 240, 64, 'GLPI', ['ticket auto si échec', 'de remédiation'], C.blue);
      s += k.link([[610, 82], [700, 82]], C.blue, { w: 1.8, arrow: true, label: [655, 74, 'API'] });
      s += k.zone(20, 150, 940, 150, 'AGENTS (postes et serveurs du site)', C.sky);
      [['Postes bureautiques', 'contrôles / 15 min'], ['Postes atelier', 'fenêtres d’arrêt prod'], ['Portables', 'via VPN / Internet'], ['Serveurs', 'contrôles / 5 min']].forEach(([n, sub], i) => {
        const x = 40 + i * 232;
        s += k.node(x, 190, 210, 56, n, sub, C.sky);
        s += k.link([[x + 105, 190], [x + 105, 170], [490, 170], [490, 114]], C.lime, { w: 1.2, op: 0.5, dash: '4 4', flow: 1.6 });
      });
      s += k.label(490, 278, 'agent sortant HTTPS uniquement · aucun port entrant sur les postes', '#cbd5e1', 'middle', 10);
      s += k.box(20, 320, 300, 116, 'Contrôles', ['espace disque < 10 %', 'services critiques arrêtés', 'BitLocker / antivirus', 'redémarrage en attente > 7 j'], C.ok);
      s += k.box(340, 320, 300, 116, 'Remédiations automatiques', ['spouleur d’impression', 'nettoyage disque', 'redémarrage de service', 'cache Teams / Office'], C.lime);
      s += k.box(660, 320, 300, 116, 'Correctifs', ['anneau pilote J+0', 'anneau large J+7', 'atelier : arrêts planifiés', 'rapport de conformité'], C.v40);
      return s + k.close();
    })(),
    content: md`
## Contexte

> [!NOTE] Mission en régie
> Ce projet décrit ma pratique quotidienne en mission. L'outil RMM du client et ses données ne sont pas nommés ; les scripts présentés ont été réécrits et testés dans mon homelab.

En support N2/N3, le même incident revient sans cesse : spouleur d'impression bloqué, disque plein, cache applicatif corrompu. Le traiter à la main, poste par poste, consomme un temps considérable et ne traite que le symptôme.

**Objectifs :**

- Détecter les problèmes **avant** l'appel de l'utilisateur.
- Corriger automatiquement ce qui est connu et sans risque.
- Mesurer la conformité du parc (chiffrement, antivirus, correctifs).
- Ne jamais perturber la **production** (postes d'atelier).

## Principes d'une bibliothèque de scripts fiable

| Principe | Mise en pratique |
|----------|------------------|
| Un script = une action | Pas de « script couteau suisse » difficile à tester |
| Codes de retour normalisés | \`0\` OK, \`1\` alerte, \`2\` erreur : la console RMM s'en sert pour déclencher les alertes |
| Journalisation systématique | Chaque exécution écrit dans \`C:\ProgramData\RMM\Logs\` |
| Idempotence | Relancer un script ne doit rien casser |
| Mode simulation | Paramètre \`-WhatIf\` pour toute action destructive |
| Versionnage et revue | Dépôt Git, aucune modification directe dans la console |

### Fonction de journalisation commune

~~~powershell title="Common\Write-RmmLog.ps1"
function Write-RmmLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR')][string]$Level = 'INFO',
        [string]$Script = $MyInvocation.PSCommandPath
    )
    $dir = 'C:\ProgramData\RMM\Logs'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $name = [IO.Path]::GetFileNameWithoutExtension($Script)
    $line = '{0:yyyy-MM-dd HH:mm:ss} [{1}] {2}' -f (Get-Date), $Level, $Message
    Add-Content -Path (Join-Path $dir "$name.log") -Value $line -Encoding UTF8
    Write-Output $line
}
~~~

## Exemples de scripts

### Contrôle de l'espace disque

~~~powershell title="Checks\Test-DiskSpace.ps1"
<#
.SYNOPSIS
    Alerte si un volume local passe sous un seuil d'espace libre.
.OUTPUTS
    Code 0 = OK, 1 = alerte, 2 = erreur.
#>
param(
    [int]$WarnPercent = 10,
    [int]$MinFreeGB   = 5
)
. "$PSScriptRoot\..\Common\Write-RmmLog.ps1"

try {
    $alert = $false
    Get-CimInstance Win32_LogicalDisk -Filter 'DriveType = 3' | ForEach-Object {
        $freeGB  = [math]::Round($_.FreeSpace / 1GB, 1)
        $percent = [math]::Round(($_.FreeSpace / $_.Size) * 100, 1)
        if ($percent -lt $WarnPercent -or $freeGB -lt $MinFreeGB) {
            Write-RmmLog -Level WARN -Message "$($_.DeviceID) : $freeGB Go libres ($percent %)"
            $alert = $true
        } else {
            Write-RmmLog -Message "$($_.DeviceID) : $freeGB Go libres ($percent %)"
        }
    }
    if ($alert) { exit 1 } else { exit 0 }
}
catch {
    Write-RmmLog -Level ERROR -Message $_.Exception.Message
    exit 2
}
~~~

### Remédiation du spouleur d'impression

~~~powershell title="Remediation\Repair-PrintSpooler.ps1"
[CmdletBinding(SupportsShouldProcess)]
param()
. "$PSScriptRoot\..\Common\Write-RmmLog.ps1"

$queue = Join-Path $env:SystemRoot 'System32\spool\PRINTERS'
$jobs  = Get-ChildItem $queue -File -ErrorAction SilentlyContinue
Write-RmmLog -Message "Travaux en file : $($jobs.Count)"

if ($PSCmdlet.ShouldProcess('Spooler', 'Arrêt, purge de la file et redémarrage')) {
    Stop-Service Spooler -Force
    $jobs | Remove-Item -Force -ErrorAction SilentlyContinue
    Start-Service Spooler
    Start-Sleep -Seconds 3
    $status = (Get-Service Spooler).Status
    Write-RmmLog -Message "Spouleur : $status"
    if ($status -ne 'Running') { exit 2 }
}
exit 0
~~~

### Rapport de conformité

~~~powershell title="Reports\Get-ComplianceStatus.ps1 — résultat stocké dans des champs personnalisés RMM"
$bitlocker = Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction SilentlyContinue
$defender  = Get-MpComputerStatus -ErrorAction SilentlyContinue
$lastPatch = Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1
$uptime    = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
$pending   = Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired'

$result = [ordered]@{
    BitLocker        = if ($bitlocker) { "$($bitlocker.ProtectionStatus)" } else { 'Absent' }
    AntivirusActif   = [bool]$defender.RealTimeProtectionEnabled
    SignaturesAgeJ   = $defender.AntivirusSignatureAge
    DernierCorrectif = '{0:yyyy-MM-dd}' -f $lastPatch.InstalledOn
    UptimeJours      = [math]::Floor($uptime.TotalDays)
    RedemarrageAttendu = $pending
}
$result | ConvertTo-Json -Compress

$nonConforme = ($result.BitLocker -ne 'On') -or (-not $result.AntivirusActif) -or ($result.SignaturesAgeJ -gt 3) -or ($result.UptimeJours -gt 30)
if ($nonConforme) { exit 1 } else { exit 0 }
~~~

### Création normalisée d'un compte

~~~powershell title="AD\New-StandardUser.ps1 (exécuté depuis un serveur d'administration, pas depuis le RMM)"
param(
    [Parameter(Mandatory)][string]$Prenom,
    [Parameter(Mandatory)][string]$Nom,
    [Parameter(Mandatory)][ValidateSet('Production', 'Support', 'Direction')][string]$Service,
    [Parameter(Mandatory)][string]$Ticket
)
Import-Module ActiveDirectory

$norm = { param($s) ($s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{Mn}', '' -replace '[^a-zA-Z-]', '').ToLower() }
$sam  = '{0}.{1}' -f (& $norm $Prenom).Substring(0, 1), (& $norm $Nom)
if (Get-ADUser -Filter "SamAccountName -eq '$sam'") { throw "Le compte $sam existe déjà." }

$pwd = -join ((48..57) + (65..90) + (97..122) + 33, 35, 37, 64 | Get-Random -Count 20 | ForEach-Object { [char]$_ })

New-ADUser -Name "$Prenom $Nom" -GivenName $Prenom -Surname $Nom -SamAccountName $sam \`
    -UserPrincipalName "$sam@lab.enzomarechal.fr" -Department $Service \`
    -Path "OU=$Service,OU=UTILISATEURS,DC=lab,DC=enzomarechal,DC=fr" \`
    -AccountPassword (ConvertTo-SecureString $pwd -AsPlainText -Force) \`
    -ChangePasswordAtLogon $true -Enabled $true \`
    -Description "Créé via ticket $Ticket le $(Get-Date -Format 'yyyy-MM-dd')"

Add-ADGroupMember -Identity "GG_$($Service)_Utilisateurs" -Members $sam
Write-Output "Compte $sam créé (ticket $Ticket). Mot de passe initial à transmettre via Vaultwarden (Send)."
~~~

Le mot de passe initial est transmis par un **lien Vaultwarden Send** à usage unique et expirant, jamais par e-mail ou par téléphone.

## Politique de correctifs

| Anneau | Périmètre | Déploiement | Critère de passage |
|--------|-----------|-------------|--------------------|
| Pilote | Postes du service informatique | J+0 (Patch Tuesday) | Aucun incident pendant 5 jours |
| Large | Postes bureautiques | J+7 | — |
| Atelier | Postes de production | Lors des **arrêts planifiés** uniquement | Validation du responsable de production |
| Serveurs | Serveurs membres | Fenêtre mensuelle, après sauvegarde | Contrôle des services après redémarrage |

> [!WARN] Postes de production
> Un redémarrage imprévu d'un poste qui pilote une machine peut arrêter une ligne. Les postes d'atelier sont dans un groupe RMM dédié **sans aucun redémarrage automatique** ; les correctifs y sont installés lors des arrêts de production planifiés avec les équipes du site.

## Résultats

- Une quarantaine de scripts en production, tous versionnés et relus.
- Environ 60 % de tâches manuelles récurrentes en moins sur le support N2.
- Incidents « disque plein » et « impression bloquée » traités avant l'appel dans la majorité des cas.
- Tableau de conformité du parc disponible à tout moment (chiffrement, antivirus, correctifs).

## Difficultés rencontrées

**1. Script exécuté dans le mauvais contexte.** Un script de nettoyage du profil utilisateur s'exécutait en tant que \`SYSTEM\` et ne trouvait pas le bon dossier. **Solution :** distinguer explicitement les scripts « contexte système » et « contexte utilisateur », et tester les deux cas dans le homelab avant publication.

**2. Encodage des caractères accentués.** Les journaux et noms de comptes contenaient des caractères corrompus. **Solution :** fichiers enregistrés en UTF-8 avec BOM pour Windows PowerShell 5.1, et normalisation Unicode pour la génération des identifiants.

## Compétences mobilisées

- PowerShell avancé : paramètres, \`ShouldProcess\`, gestion d'erreurs, codes de retour
- Exploitation proactive d'un parc et gestion des correctifs
- Contraintes d'un environnement industriel
- Bonnes pratiques de développement appliquées aux scripts (Git, revue, tests)

## Évolutions prévues

- [ ] Tests automatisés des scripts avec Pester
- [ ] Signature de code des scripts par la PKI interne et politique d'exécution \`AllSigned\`
- [ ] Remontée des indicateurs de conformité dans Grafana
`
  };

  /* ========================================================================
     P·15 — PKI AD CS & 802.1X
     ======================================================================== */
  DETAILS['pki-8021x'] = {
    duration: '4 semaines',
    role: 'Conception de la PKI, NPS, configuration des switchs, GPO',
    svg: (() => {
      const k = kit('pki');
      let s = k.open(980, 470, 'PKI à deux niveaux · contrôle d’accès réseau 802.1X');
      s += k.zone(20, 44, 300, 230, 'PKI', C.pink);
      s += k.node(40, 76, 260, 56, 'LAB-ROOT-CA', ['hors ligne · hors domaine', 'RSA 4096 · 20 ans'], C.pink, { main: true });
      s += k.link([[170, 132], [170, 156]], C.pink, { w: 1.8, arrow: true, label: [228, 148, 'signe'] });
      s += k.node(40, 156, 260, 56, 'LAB-ISSUING-CA', ['PKI-CA 10.10.20.15', 'entreprise · 10 ans'], C.pink);
      s += k.node(40, 222, 260, 40, 'CRL / AIA HTTP', 'pki.lab.enzomarechal.fr', C.ok);
      s += k.node(370, 60, 240, 60, 'GPO auto-enrollment', ['modèle LAB-Machine-8021X', 'renouvellement auto'], C.violet);
      s += k.link([[300, 184], [340, 184], [340, 90], [370, 90]], C.pink, { w: 1.4, arrow: true });
      s += k.node(370, 150, 240, 66, 'Poste du domaine', ['certificat machine', 'service dot3svc (filaire)'], C.sky);
      s += k.link([[490, 120], [490, 150]], C.violet, { w: 1.4, arrow: true });
      s += k.node(370, 268, 240, 66, 'SW-ACCESS-01', ['authenticator', 'dot1x → mab'], C.sw, { main: true });
      s += k.link([[490, 216], [490, 268]], C.sky, { w: 2, both: true, arrow: true, label: [550, 246, 'EAPOL'] });
      s += k.node(700, 268, 260, 66, 'NPS · DC02 10.10.20.11', ['RADIUS 1812 / 1813', 'EAP-TLS'], C.v20, { main: true });
      s += k.link([[610, 301], [700, 301]], C.v20, { w: 2, both: true, arrow: true, flow: 1.2, dash: '6 4', label: [655, 292, 'RADIUS'] });
      s += k.node(700, 160, 260, 56, 'Active Directory', 'Ordinateurs du domaine', C.violet);
      s += k.link([[830, 268], [830, 216]], C.violet, { w: 1.4, both: true, arrow: true });
      s += k.box(700, 44, 260, 100, 'Réponse RADIUS', ['Access-Accept', 'Tunnel-Type = VLAN (13)', 'Tunnel-Medium = 802 (6)', 'Tunnel-Pvt-Group-ID = 60'], C.ok);
      const out = [['Certificat valide', 'VLAN 60 bureautique', C.ok], ['Téléphone (MAB)', 'domaine voix VLAN 40', C.v40], ['Poste inconnu', 'port non autorisé', C.fw]];
      out.forEach(([n, sub, c], i) => {
        const x = 40 + i * 310;
        s += k.node(x, 380, 280, 54, n, sub, c);
        s += k.link([[490, 334], [490, 356], [x + 140, 356], [x + 140, 380]], c, { w: 1.4, arrow: true });
      });
      return s + k.close();
    })(),
    content: md`
## Contexte

Dans la plupart des entreprises, **n'importe quel appareil branché sur une prise réseau** obtient une adresse IP et voit le réseau interne. C'est le point d'entrée le plus simple pour un intrus physique (prestataire, visiteur, prise dans une salle de réunion).

Le standard **802.1X** conditionne l'ouverture du port à une authentification. Avec la méthode **EAP-TLS**, l'authentification repose sur un **certificat machine** délivré par la PKI de l'entreprise : pas de mot de passe à voler, et seuls les postes du domaine sont acceptés.

**Objectifs :**

- Construire une PKI d'entreprise correcte (racine hors ligne, publication des listes de révocation).
- Délivrer automatiquement un certificat à chaque poste du domaine.
- Refuser l'accès à tout équipement non autorisé, tout en gérant les téléphones et imprimantes qui ne supportent pas 802.1X.

## Architecture de la PKI

| Niveau | Nom | Statut | Durée | Rôle |
|--------|-----|--------|-------|------|
| Racine | \`LAB-ROOT-CA\` | **Hors ligne**, hors domaine | 20 ans | Signe uniquement l'AC émettrice ; allumée deux fois par an pour publier sa CRL |
| Émettrice | \`LAB-ISSUING-CA\` | En ligne, intégrée à l'AD | 10 ans | Délivre les certificats machines, serveurs (LDAPS, web) |

> [!INFO] Pourquoi une racine hors ligne ?
> Si la clé privée de la racine est compromise, **toute** la confiance de l'entreprise s'effondre : il faut réémettre tous les certificats. En la gardant éteinte, sans réseau, on réduit ce risque à presque rien. Si l'AC émettrice est compromise, on la révoque depuis la racine et on en crée une nouvelle.

## Mise en œuvre de la PKI

### 1. Autorité racine (VM hors domaine, sans carte réseau)

~~~ini title="C:\Windows\CAPolicy.inf (racine)"
[Version]
Signature="$Windows NT$"

[Certsrv_Server]
RenewalKeyLength=4096
RenewalValidityPeriod=Years
RenewalValidityPeriodUnits=20
CRLPeriod=Months
CRLPeriodUnits=6
CRLDeltaPeriodUnits=0
LoadDefaultTemplates=0
AlternateSignatureAlgorithm=0
~~~

~~~powershell title="Installation de l'AC racine autonome"
Install-WindowsFeature ADCS-Cert-Authority -IncludeManagementTools
Install-AdcsCertificationAuthority -CAType StandaloneRootCA \`
    -CACommonName 'LAB-ROOT-CA' \`
    -KeyLength 4096 -HashAlgorithmName SHA256 \`
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' \`
    -ValidityPeriod Years -ValidityPeriodUnits 20 -Force

# Points de distribution : uniquement HTTP (la racine ne connaît pas l'AD)
certutil -setreg CA\CRLPublicationURLs "1:C:\Windows\system32\CertSrv\CertEnroll\%3%8%9.crl\n2:http://pki.lab.enzomarechal.fr/CertEnroll/%3%8%9.crl"
certutil -setreg CA\CACertPublicationURLs "1:C:\Windows\system32\CertSrv\CertEnroll\%1_%3%4.crt\n2:http://pki.lab.enzomarechal.fr/CertEnroll/%1_%3%4.crt"
certutil -setreg CA\ValidityPeriod "Years"
certutil -setreg CA\ValidityPeriodUnits 10
certutil -setreg CA\DSConfigDN "CN=Configuration,DC=lab,DC=enzomarechal,DC=fr"
Restart-Service certsvc
certutil -crl
~~~

### 2. Publication de la racine dans l'AD

~~~powershell title="Depuis un serveur du domaine (fichiers copiés depuis la racine)"
certutil -dspublish -f 'LAB-ROOT-CA.crt' RootCA
certutil -dspublish -f 'LAB-ROOT-CA.crl' LAB-ROOT-CA
~~~

Tous les postes du domaine font alors confiance à la racine, sans aucune action de leur part.

### 3. Autorité émettrice

~~~powershell title="PKI-CA (10.10.20.15) — AC subordonnée d'entreprise"
Install-WindowsFeature ADCS-Cert-Authority, ADCS-Web-Enrollment, Web-Server -IncludeManagementTools
Install-AdcsCertificationAuthority -CAType EnterpriseSubordinateCA \`
    -CACommonName 'LAB-ISSUING-CA' \`
    -KeyLength 4096 -HashAlgorithmName SHA256 \`
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' \`
    -OutputCertRequestFile 'C:\PKI\LAB-ISSUING-CA.req' -Force

# La requête est signée sur la racine (transfert par clé USB), puis :
certutil -installcert 'C:\PKI\LAB-ISSUING-CA.crt'
Start-Service certsvc

# Publication HTTP des CRL (avec CRL delta, d'où le double échappement du « + »)
New-WebVirtualDirectory -Site 'Default Web Site' -Name 'CertEnroll' -PhysicalPath 'C:\Windows\system32\CertSrv\CertEnroll'
Set-WebConfigurationProperty -PSPath 'IIS:\Sites\Default Web Site\CertEnroll' \`
    -Filter /system.webServer/security/requestFiltering -Name allowDoubleEscaping -Value $true
~~~

### 4. Modèle de certificat et auto-enrollment

1. Dupliquer le modèle **Authentification de station de travail** → \`LAB-Machine-8021X\`.
2. Onglet *Sécurité* : **Ordinateurs du domaine** → *Lecture*, *Inscrire*, *Inscription automatique*.
3. Onglet *Nom du sujet* : construit à partir de l'AD, **nom DNS**.
4. Clé RSA 2048, validité 1 an, renouvellement 6 semaines avant expiration.

~~~powershell title="Publication du modèle sur l'AC émettrice"
Add-CATemplate -Name 'LAB-Machine-8021X' -Force
~~~

GPO \`C_Postes_PKI-8021X\` liée à l'OU POSTES :

| Paramètre | Valeur |
|-----------|--------|
| *Stratégies de clé publique › Client des services de certificats – Inscription automatique* | Activé, renouvellement et mise à jour cochés |
| *Services système › Configuration automatique de réseau câblé (dot3svc)* | Automatique |
| *Stratégies de réseau câblé (IEEE 802.3)* | Authentification 802.1X activée, méthode **Carte à puce ou autre certificat**, mode **authentification ordinateur** |

## Serveur NPS (RADIUS)

NPS est installé sur DC02 et enregistré dans l'AD (droit de lire les propriétés de numérotation des comptes) :

~~~powershell title="DC02 — installation de NPS et déclaration des switchs"
Install-WindowsFeature NPAS -IncludeManagementTools
netsh nps add registeredserver domain=lab.enzomarechal.fr server=DC02

New-NpsRadiusClient -Name 'SW-ACCESS-01' -Address 10.10.10.3 -SharedSecret '**********'
New-NpsRadiusClient -Name 'SW-ACCESS-02' -Address 10.10.10.4 -SharedSecret '**********'
~~~

Stratégies réseau (évaluées dans l'ordre) :

| # | Stratégie | Conditions | Authentification | Attributs renvoyés |
|---|-----------|-----------|------------------|--------------------|
| 1 | **8021X-Postes-Domaine** | Groupe *Ordinateurs du domaine* + type de port *Ethernet* | EAP-TLS (certificat) | Tunnel-Type = VLAN, Tunnel-Medium-Type = 802, Tunnel-Pvt-Group-ID = **60** |
| 2 | **MAB-Telephones** | Calling-Station-ID correspondant à l'OUI du fabricant des postes + type de port *Ethernet* | MAB (PAP, compte dédié) | \`cisco-av-pair = device-traffic-class=voice\` |
| 3 | Refus par défaut | — | — | Access-Reject |

> [!WARN] Limite assumée du MAB
> Une adresse MAC s'usurpe facilement : le MAB n'est **pas** une authentification forte. Il est réservé aux téléphones, qui n'obtiennent que le **domaine voix** (VLAN 40), lui-même isolé du reste du réseau par pfSense. Un attaquant usurpant la MAC d'un téléphone n'atteint rien d'utile.

## Configuration des switchs

~~~cisco title="SW-ACCESS-01 — AAA et RADIUS"
aaa new-model
aaa authentication dot1x default group radius
aaa authorization network default group radius
aaa accounting dot1x default start-stop group radius
!
radius server NPS-DC02
 address ipv4 10.10.20.11 auth-port 1812 acct-port 1813
 key **********
!
ip radius source-interface Vlan10
radius-server dead-criteria time 5 tries 3
radius-server deadtime 10
dot1x system-auth-control
~~~

~~~cisco title="SW-ACCESS-01 — port utilisateur avec 802.1X puis MAB" hl="6-12"
interface GigabitEthernet1/0/5
 description ACCES-UTILISATEUR-8021X
 switchport mode access
 switchport access vlan 60
 switchport voice vlan 40
 authentication host-mode multi-domain
 authentication order dot1x mab
 authentication priority dot1x mab
 authentication port-control auto
 authentication periodic
 authentication timer reauthenticate server
 authentication event server dead action authorize vlan 60
 mab
 dot1x pae authenticator
 dot1x timeout tx-period 10
 spanning-tree portfast
 spanning-tree bpduguard enable
~~~

| Commande | Rôle |
|----------|------|
| \`host-mode multi-domain\` | Un équipement dans le domaine **données** (PC) et un dans le domaine **voix** (téléphone) |
| \`order dot1x mab\` | Tente 802.1X d'abord ; si aucune réponse EAP, bascule sur le MAB |
| \`event server dead … vlan 60\` | Si NPS est injoignable, les postes ne sont **pas** bloqués (continuité de service) |
| \`timeout tx-period 10\` | Bascule plus rapide vers le MAB pour les équipements sans supplicant |

## Tests de validation

~~~terminal title="SW-ACCESS-01 — session authentifiée"
SW-ACCESS-01# show authentication sessions interface gi1/0/5 details
            Interface:  GigabitEthernet1/0/5
          MAC Address:  3c52.8201.a4f7
           IP Address:  10.10.60.123
            User-Name:  host/PC-5CG3301XYZ.lab.enzomarechal.fr
               Status:  Authorized
               Domain:  DATA
       Oper host mode:  multi-domain
     Oper control dir:  both
      Session timeout:  N/A
    Common Session ID:  0A0A0A030000002A1F3C7B21
      Acct Session ID:  0x0000001C
               Handle:  0x6B000016
Runnable methods list:
       Method   State
       dot1x    Authc Success
       mab      Not run
~~~

| # | Scénario | Attendu | Obtenu |
|---|----------|---------|--------|
| T1 | Poste du domaine avec certificat | VLAN 60, accès normal | Autorisé en ≈ 2 s (événement NPS 6272) |
| T2 | Portable personnel | Aucun accès | Port non autorisé (événement 6273, raison 66) |
| T3 | Téléphone IP | Domaine voix VLAN 40 | Autorisé par MAB |
| T4 | Certificat du poste **révoqué** | Refus | Refus après publication de la CRL |
| T5 | NPS arrêté | Postes toujours connectés | Autorisation de secours VLAN 60 |
| T6 | Renouvellement automatique du certificat | Aucune action | Nouveau certificat 6 semaines avant expiration |

## Difficultés rencontrées

**1. « Le serveur de révocation est hors connexion ».** Les premiers tests EAP-TLS échouaient : NPS ne parvenait pas à télécharger la CRL de la racine car le site IIS refusait les noms de fichiers contenant un « + » (CRL delta). **Solution :** \`allowDoubleEscaping\` sur le répertoire virtuel, puis \`certutil -url\` pour valider chaque point de distribution.

**2. Postes neufs bloqués avant d'avoir leur certificat.** Un poste fraîchement déployé n'a pas encore de certificat lors de son premier démarrage. **Solution :** le déploiement se fait dans le VLAN 50 (sans 802.1X) ; le certificat est obtenu pendant la séquence MDT, avant que le poste ne rejoigne un port 802.1X.

## Compétences mobilisées

- PKI d'entreprise : hiérarchie, CRL / AIA, modèles, auto-enrollment
- Authentification réseau : RADIUS, EAP-TLS, MAB, attribution dynamique de VLAN
- Configuration AAA sur équipements Cisco
- Analyse des journaux NPS et diagnostic méthodique d'une chaîne d'authentification

## Évolutions prévues

- [ ] Étendre 802.1X au Wi-Fi d'entreprise (WPA3-Enterprise, même PKI)
- [ ] Répondeur OCSP pour une révocation quasi immédiate
- [ ] Certificats utilisateurs sur carte à puce / clé FIDO pour les comptes tier 0
`
  };
})();
