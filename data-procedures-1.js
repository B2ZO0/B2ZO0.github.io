/* ==========================================================================
   ENZO MARECHAL — PORTFOLIO v4
   data-procedures-1.js — Base de connaissances, lot 1 : RÉSEAU & PARE-FEU
   --------------------------------------------------------------------------
   PLAN GLOBAL DES 50 PROCÉDURES (identifiants réservés)

   Lot 1 · data-procedures-1.js — Réseau & pare-feu
     proc-001  VLANs et trunks 802.1Q sur Cisco IOS
     proc-002  EtherChannel LACP entre Cisco et pfSense
     proc-003  Sécuriser les ports d'accès Cisco
     proc-004  DHCP snooping et Dynamic ARP Inspection
     proc-005  Installer pfSense et ses interfaces VLAN
     proc-006  Haute disponibilité pfSense : CARP, pfsync, XMLRPC
     proc-007  Politique de filtrage inter-VLAN par alias
     proc-008  VPN d'administration WireGuard sur pfSense
     proc-009  OpenVPN avec PKI dédiée et authentification RADIUS
     proc-010  SNMPv3, syslog et NTP sur les équipements réseau

   Lot 2 · data-procedures-2.js — Windows Server & identité
     proc-011  Premier contrôleur de domaine en PowerShell
     proc-012  Second contrôleur de domaine et contrôle de la réplication
     proc-013  DHCP en failover sur Windows Server + relais pfSense
     proc-014  Structure d'OU et groupes AGDLP en PowerShell
     proc-015  Windows LAPS
     proc-016  GPO de durcissement réseau (LLMNR, NetBIOS, SMB)
     proc-017  Modèle d'administration en tiers et Protected Users
     proc-018  PKI : autorité racine hors ligne
     proc-019  PKI : autorité émettrice et auto-enrollment
     proc-020  802.1X EAP-TLS avec NPS

   Lot 3 · data-procedures-3.js — Postes, déploiement & téléphonie
     proc-021  Installer WDS + MDT
     proc-022  Bootstrap.ini et CustomSettings.ini zero-touch
     proc-023  Gestion des pilotes par modèle dans MDT
     proc-024  Configuration BIOS HP avec HP BCU
     proc-025  WSUS et anneaux de déploiement
     proc-026  BitLocker par GPO avec sauvegarde dans l'AD
     proc-027  Déployer GLPI Agent par GPO
     proc-028  Installer 3CX sur Debian 12
     proc-029  VLAN voix, LLDP-MED et QoS
     proc-030  Bibliothèque de scripts RMM PowerShell

   Lot 4 · data-procedures-4.js — Virtualisation & Linux
     proc-031  Cluster Proxmox VE à 3 nœuds
     proc-032  Stockage Ceph hyperconvergé
     proc-033  Haute disponibilité Proxmox
     proc-034  Proxmox Backup Server et chiffrement
     proc-035  Synchronisation hors site PBS
     proc-036  Modèle de VM cloud-init Debian 12
     proc-037  Durcissement d'un serveur Debian 12
     proc-038  Préparer un contrôleur Ansible
     proc-039  Rôles Ansible et Ansible Vault
     proc-040  Docker et Vaultwarden

   Lot 5 · data-procedures-5.js — Services, supervision & détection
     proc-041  Reverse proxy Nginx durci
     proc-042  Certificats Let's Encrypt en DNS-01
     proc-043  Cluster MariaDB Galera
     proc-044  HAProxy + keepalived devant Galera
     proc-045  GLPI 10 installation sécurisée
     proc-046  Zabbix 7.0 LTS
     proc-047  Agents Zabbix 2 en PSK et enregistrement automatique
     proc-048  Grafana et plugin Zabbix
     proc-049  Wazuh : installation et agents
     proc-050  Wazuh : règles personnalisées et réponse active

   Écriture : tag md`…` (antislashs conservés), \` pour un accent grave,
   \${ pour « ${ ». Liens internes : [texte](#wiki/proc-00X), [texte](#projet/<id>).
   ========================================================================== */
(function () {
  'use strict';

  const md = (s, ...v) => String.raw(s, ...v).replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
  const LIST = (window.WIKI_PROCEDURES = window.WIKI_PROCEDURES || []);

  /* ========================================================================
     PROC-001 — VLANs ET TRUNKS 802.1Q SUR CISCO IOS
     ======================================================================== */
  LIST.push({
    id: 'proc-001',
    title: 'Créer les VLANs et les trunks 802.1Q sur Cisco IOS',
    category: 'Réseau',
    techs: ['cisco', 'vlan'],
    level: 'Intermédiaire',
    date: '2026-03-14',
    project: 'switching',
    summary: "Mettre en place un plan VLAN complet sur un cœur et deux switchs d'accès : VTP transparent, VLAN natif isolé, trunks élagués, ports d'accès et SVI de management. Avec la technique du « reload in » pour ne jamais se couper l'accès.",
    env: { 'Équipements': 'Cisco Catalyst (IOS 15.2)', 'Accès': 'Console + SSH depuis le VLAN 10', 'Référentiel': 'proc-000' },
    content: md`
## Contexte

Un site de taille moyenne dispose d'un switch de cœur et de deux switchs d'accès (bureautique et atelier). Historiquement, tout le monde est dans le **VLAN 1** : postes, téléphones, serveurs et automates partagent le même domaine de diffusion. Une seule boucle ou un seul serveur DHCP pirate suffit à paralyser l'ensemble.

Cette procédure segmente le réseau selon le plan défini dans le [référentiel du homelab](#wiki/proc-000). Le routage entre VLAN est assuré par pfSense (voir [proc-005](#wiki/proc-005)) : les switchs restent en **niveau 2**.

## Topologie cible

~~~ascii title="Cœur et accès"
                        PFSENSE (CARP) — routage inter-VLAN
                                  │  Po1 / Po2 (LACP, trunk)
                         ┌────────┴────────┐
                         │   SW-CORE-01    │  SVI Vlan10 = 10.10.10.2
                         └───┬─────────┬───┘
               Po10 (trunk)  │         │  Po20 (trunk)
           VLAN 10,40,60     │         │  VLAN 10,40
                 ┌───────────┴──┐   ┌──┴───────────┐
                 │ SW-ACCESS-01 │   │ SW-ACCESS-02 │
                 │ bureautique  │   │ atelier (OT) │
                 │ .3           │   │ .4           │
                 └──────────────┘   └──────────────┘
           ports : VLAN 60 + voix 40    ports : VLAN 40
~~~

| VLAN | Nom | SW-CORE-01 | SW-ACCESS-01 | SW-ACCESS-02 |
|------|-----|:----------:|:------------:|:------------:|
| 10 | MGMT | ✓ | ✓ (SVI) | ✓ (SVI) |
| 20 | SRV | ✓ | — | — |
| 30 | DMZ | ✓ | — | — |
| 40 | VOIP-IOT | ✓ | ✓ | ✓ |
| 50 | PXE | ✓ | — | — |
| 60 | BUREAUTIQUE | ✓ | ✓ | — |
| 998 | PARKING | ✓ | ✓ | ✓ |
| 999 | NATIF-MORT | ✓ | ✓ | ✓ |

## Prérequis

- [ ] Accès console à chaque switch (en cas de perte de l'accès SSH)
- [ ] Plan VLAN validé et documenté
- [ ] Sauvegarde de la configuration actuelle
- [ ] Fenêtre d'intervention communiquée (les ports changeront de VLAN)
- [ ] Serveur DHCP prêt pour les nouveaux sous-réseaux (relais pfSense)

> [!DANGER] Intervention à distance
> Modifier un trunk ou le VLAN de management **en SSH** peut couper définitivement l'accès au switch. Utilisez toujours la technique du rechargement programmé décrite à l'étape 1.

## Mise en œuvre

### Étape 1 — Sauvegarder et programmer un filet de sécurité

~~~terminal title="SW-ACCESS-01 — avant toute modification"
SW-ACCESS-01# copy running-config tftp://10.10.10.20/configs/SW-ACCESS-01-avant-vlan.cfg
Address or name of remote host [10.10.10.20]?
Destination filename [configs/SW-ACCESS-01-avant-vlan.cfg]?
!!
6842 bytes copied in 0.412 secs (16607 bytes/sec)
SW-ACCESS-01# reload in 10
Reload scheduled in 10 minutes by enzo on vty0 (10.10.10.50)
Proceed with reload? [confirm]
~~~

La configuration **sauvegardée** (\`startup-config\`) n'est pas modifiée tant que vous ne faites pas \`write memory\`. Si une erreur vous coupe l'accès, le switch redémarre seul dans 10 minutes avec l'ancienne configuration. Une fois le résultat validé : \`reload cancel\`.

### Étape 2 — Passer VTP en mode transparent

~~~cisco title="Sur chaque switch"
vtp mode transparent
vtp domain LAB
~~~

> [!WARN] Pourquoi pas VTP serveur / client ?
> Un switch de récupération ajouté au réseau avec un numéro de révision VTP plus élevé **remplace la base VLAN de tous les switchs** du domaine. En mode transparent, chaque switch gère ses propres VLAN : plus de risque d'effacement global.

### Étape 3 — Créer les VLAN

~~~cisco title="SW-CORE-01 — base VLAN complète"
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
vlan 60
 name BUREAUTIQUE
vlan 998
 name PARKING
vlan 999
 name NATIF-MORT
~~~

Sur les switchs d'accès, ne créez **que** les VLAN nécessaires (10, 40, 60, 998, 999 pour SW-ACCESS-01). Un VLAN absent d'un switch ne peut pas y être utilisé par erreur.

### Étape 4 — Interface de management

~~~cisco title="SW-ACCESS-01 — SVI dans le VLAN 10"
interface Vlan10
 description MANAGEMENT
 ip address 10.10.10.3 255.255.255.0
 no shutdown
!
ip default-gateway 10.10.10.1
!
interface Vlan1
 no ip address
 shutdown
~~~

Un switch de niveau 2 utilise \`ip default-gateway\` (et non une route par défaut) pour répondre aux connexions d'administration venant d'autres réseaux.

### Étape 5 — Configurer les trunks

~~~cisco title="SW-ACCESS-01 — uplink vers le cœur" hl="5-7"
interface Port-channel1
 description TRUNK vers SW-CORE-01
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport nonegotiate
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,60
~~~

| Commande | Rôle |
|----------|------|
| \`switchport mode trunk\` | Trunk forcé, sans dépendre de la négociation |
| \`switchport nonegotiate\` | Désactive DTP : un poste ne peut pas négocier un trunk |
| \`native vlan 999\` | Les trames non étiquetées tombent dans un VLAN vide |
| \`allowed vlan 10,40,60\` | Élagage : seuls les VLAN utiles traversent le lien |

> [!DANGER] Le piège de « allowed vlan »
> \`switchport trunk allowed vlan 70\` **remplace** toute la liste : le trunk ne transporte plus que le VLAN 70 et tous les utilisateurs sont coupés. Pour ajouter un VLAN, utilisez toujours \`switchport trunk allowed vlan add 70\`.

Le VLAN natif doit être **identique des deux côtés** du trunk (\`999\` sur SW-CORE-01 également).

### Étape 6 — Ports d'accès

~~~cisco title="SW-ACCESS-01 — ports utilisateurs et ports inutilisés"
interface range GigabitEthernet1/0/1 - 20
 description ACCES-UTILISATEUR
 switchport mode access
 switchport access vlan 60
 switchport voice vlan 40
 switchport nonegotiate
 spanning-tree portfast
!
interface range GigabitEthernet1/0/21 - 24
 description NON-UTILISE
 switchport mode access
 switchport access vlan 998
 shutdown
~~~

La sécurisation complète de ces ports (port-security, BPDU guard, storm-control) fait l'objet de [proc-003](#wiki/proc-003).

### Étape 7 — Valider puis enregistrer

~~~terminal title="Une fois les tests validés"
SW-ACCESS-01# reload cancel
***
*** --- SHUTDOWN ABORTED ---
***
SW-ACCESS-01# write memory
Building configuration...
[OK]
~~~

## Validation

~~~terminal title="SW-ACCESS-01 — contrôles"
SW-ACCESS-01# show vlan brief
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active
10   MGMT                             active
40   VOIP-IOT                         active    Gi1/0/1, Gi1/0/2, Gi1/0/3, Gi1/0/4
60   BUREAUTIQUE                      active    Gi1/0/1, Gi1/0/2, Gi1/0/3, Gi1/0/4
998  PARKING                          active    Gi1/0/21, Gi1/0/22, Gi1/0/23, Gi1/0/24
999  NATIF-MORT                       active
SW-ACCESS-01# show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Po1         on               802.1q         trunking      999

Port        Vlans allowed on trunk
Po1         10,40,60

Port        Vlans allowed and active in management domain
Po1         10,40,60

Port        Vlans in spanning tree forwarding state and not pruned
Po1         10,40,60
SW-ACCESS-01# ping 10.10.10.1 source vlan 10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.10.10.1, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
~~~

- [ ] Chaque port utilisateur est dans le bon VLAN (\`show interfaces Gi1/0/5 switchport\`)
- [ ] Un poste branché obtient une adresse en \`10.10.60.x\`
- [ ] Le switch est joignable en SSH depuis le bastion (\`10.10.10.50\`)
- [ ] Aucun port actif dans le VLAN 1
- [ ] Configuration enregistrée et sauvegardée sur le serveur TFTP

## Dépannage

| Symptôme | Cause probable | Vérification / correction |
|----------|----------------|---------------------------|
| \`%CDP-4-NATIVE_VLAN_MISMATCH\` dans les logs | VLAN natif différent des deux côtés | Aligner \`native vlan 999\` sur les deux extrémités |
| Le trunk ne monte pas | Un côté en \`access\`, l'autre en \`trunk\` avec DTP désactivé | \`show interfaces Po1 switchport\` : forcer \`mode trunk\` des deux côtés |
| Un VLAN ne passe pas | Absent de la liste \`allowed\` ou non créé sur le switch | \`show interfaces trunk\` → section *allowed and active* |
| Postes sans adresse IP | Relais DHCP absent pour le nouveau VLAN | Vérifier l'interface VLAN et le relais sur pfSense |
| Switch injoignable après modification | SVI dans le mauvais VLAN ou passerelle absente | Attendre le \`reload in\`, ou intervenir en console |

## Retour arrière

Si le \`reload in\` n'a pas été annulé, le retour est automatique. Sinon :

~~~cisco title="Restauration de la configuration sauvegardée"
copy tftp://10.10.10.20/configs/SW-ACCESS-01-avant-vlan.cfg startup-config
reload
~~~

## Pour aller plus loin

- Agrégation des liaisons montantes : [proc-002 — EtherChannel LACP](#wiki/proc-002)
- Sécurité des ports : [proc-003](#wiki/proc-003) et [proc-004](#wiki/proc-004)
- Le projet complet : [Architecture de switchs Cisco](#projet/switching)
`
  });

  /* ========================================================================
     PROC-002 — ETHERCHANNEL LACP CISCO ↔ PFSENSE
     ======================================================================== */
  LIST.push({
    id: 'proc-002',
    title: 'EtherChannel LACP entre un switch Cisco et pfSense',
    category: 'Réseau',
    techs: ['cisco', 'pfsense', 'vlan'],
    level: 'Intermédiaire',
    date: '2026-03-21',
    project: 'pfsense-carp',
    summary: "Agréger deux liens gigabit entre le cœur de réseau et chaque pare-feu avec LACP : redondance de lien et répartition de charge, VLAN transportés sur l'agrégat, ordre d'intervention pour ne pas perdre l'accès.",
    env: { 'Switch': 'Cisco Catalyst IOS 15.2', 'Pare-feu': 'pfSense CE 2.7.2', 'Ports': 'igc1 + igc2 ↔ Gi1/0/1-2' },
    content: md`
## Contexte

Le lien entre le cœur de réseau et le pare-feu transporte **tout le trafic inter-VLAN et Internet**. Un seul câble constitue donc un point unique de défaillance, et sa bande passante limite tous les échanges entre zones.

Un agrégat **LACP** (IEEE 802.3ad) regroupe plusieurs liens physiques en un lien logique :

- si un câble ou un port tombe, le trafic continue sur les autres liens, sans coupure ;
- les flux sont répartis entre les liens (par flux, pas par paquet).

## Topologie

~~~ascii title="Agrégat entre PFSENSE-01 et SW-CORE-01"
   PFSENSE-01                                  SW-CORE-01
 ┌────────────┐   igc1 ──────────── Gi1/0/1  ┌────────────┐
 │   lagg0    │                              │  Po1       │
 │  (LACP)    │   igc2 ──────────── Gi1/0/2  │  (LACP)    │
 └─────┬──────┘                              └─────┬──────┘
       │ lagg0.10 / .20 / .30 / .40 / .50          │ trunk 10,20,30,40,50
       └──────────── un seul lien logique ─────────┘
~~~

## Prérequis

- [ ] Deux ports libres de même vitesse sur chaque équipement
- [ ] Accès **console** au pare-feu (l'interface LAN va changer)
- [ ] VLAN déjà créés sur le switch ([proc-001](#wiki/proc-001))
- [ ] Sauvegarde de la configuration pfSense (*Diagnostics › Backup & Restore*)

> [!INFO] LACP actif / passif / statique
> En mode \`active\`, l'équipement envoie des trames LACP ; en mode \`passive\`, il se contente de répondre. Il faut au moins un côté actif. Le mode \`on\` (agrégat **statique**, sans LACP) est à proscrire : si un câble est mal branché, aucun protocole ne le détecte et des boucles ou pertes de trafic apparaissent.

## Mise en œuvre

### Ordre d'intervention

Pour ne pas perdre l'accès au pare-feu pendant la bascule :

1. Préparer l'agrégat côté switch avec les ports **désactivés**.
2. Créer le LAGG et les VLAN sur pfSense **depuis la console**.
3. Activer les ports du switch.
4. Vérifier, puis réassigner les interfaces sur le LAGG.

### Étape 1 — Côté switch

~~~cisco title="SW-CORE-01" hl="3,9-14"
interface range GigabitEthernet1/0/1 - 2
 description PFSENSE-01 lagg0
 shutdown
 channel-group 1 mode active
 channel-protocol lacp
 spanning-tree portfast trunk
!
interface Port-channel1
 description TRUNK PFSENSE-01
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport nonegotiate
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50
!
port-channel load-balance src-dst-ip
~~~

\`src-dst-ip\` répartit les flux selon le couple d'adresses source / destination. Avec \`src-mac\` (valeur par défaut sur certains modèles), tout le trafic venant du pare-feu passerait sur un seul lien puisqu'il n'a qu'une adresse MAC.

> [!TIP] Configurer le Port-channel, pas les membres
> Une fois \`channel-group\` appliqué, toute la configuration de niveau 2 (mode trunk, VLAN autorisés) se fait sur l'interface **Port-channel**. IOS la propage aux membres. Des membres configurés différemment sont **suspendus** (\`(s)\` dans \`show etherchannel summary\`).

### Étape 2 — Côté pfSense

*Interfaces › Assignments › LAGGs › Add* :

| Champ | Valeur |
|-------|--------|
| Parent Interfaces | \`igc1\`, \`igc2\` |
| LAGG Protocol | \`LACP\` |
| Fast timeout | Coché (détection de panne en 3 s au lieu de 90 s) |
| Hash Algorithm | Layer 2, 3 and 4 |
| Description | Agrégat vers SW-CORE-01 |

Puis *Interfaces › Assignments › VLANs › Add* pour chaque VLAN (parent \`lagg0\`, tag 10, 20, 30, 40, 50). Le fichier de configuration résultant :

~~~xml title="/conf/config.xml (extrait)"
<laggs>
  <lagg>
    <members>igc1,igc2</members>
    <descr><![CDATA[Agregat vers SW-CORE-01]]></descr>
    <laggif>lagg0</laggif>
    <proto>lacp</proto>
    <lacp_fast></lacp_fast>
    <lagghash>l2,l3,l4</lagghash>
  </lagg>
</laggs>
<vlans>
  <vlan>
    <if>lagg0</if>
    <tag>10</tag>
    <pcp></pcp>
    <descr><![CDATA[MGMT]]></descr>
    <vlanif>lagg0.10</vlanif>
  </vlan>
  <vlan>
    <if>lagg0</if>
    <tag>20</tag>
    <pcp></pcp>
    <descr><![CDATA[SRV]]></descr>
    <vlanif>lagg0.20</vlanif>
  </vlan>
</vlans>
~~~

### Étape 3 — Activation des ports du switch

~~~cisco title="SW-CORE-01"
interface range GigabitEthernet1/0/1 - 2
 no shutdown
~~~

### Étape 4 — Réassignation des interfaces pfSense

Depuis la console pfSense (option \`1) Assign Interfaces\`), ou dans l'interface web : affecter \`lagg0.10\` à MGMT, \`lagg0.20\` à SRV, etc. Voir [proc-005](#wiki/proc-005) pour l'adressage complet.

Pour le second pare-feu, répéter avec \`Gi1/0/3-4\` et \`Port-channel2\`.

## Validation

~~~terminal title="SW-CORE-01"
SW-CORE-01# show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use      f - failed to allocate aggregator

Number of channel-groups in use: 2
Number of aggregators:           2

Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)         LACP      Gi1/0/1(P)  Gi1/0/2(P)
2      Po2(SU)         LACP      Gi1/0/3(P)  Gi1/0/4(P)
SW-CORE-01# show lacp 1 neighbor
Channel group 1 neighbors
Partner's information:
                  LACP port                        Admin  Oper   Port    Port
Port      Flags   Priority  Dev ID          Age    key    Key    Number  State
Gi1/0/1   FA      32768     00e0.672a.1102   1s    0x0    0x1E2  0x2     0x3F
Gi1/0/2   FA      32768     00e0.672a.1102   1s    0x0    0x1E2  0x3     0x3F
~~~

~~~terminal title="pfSense — Diagnostics › Command Prompt"
[2.7.2-RELEASE][admin@pfsense-01]/root: ifconfig lagg0
lagg0: flags=1008843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST,LOWER_UP> metric 0 mtu 1500
	ether 00:e0:67:2a:11:02
	laggproto lacp lagghash l2,l3,l4
	laggport: igc1 flags=1c<ACTIVE,COLLECTING,DISTRIBUTING>
	laggport: igc2 flags=1c<ACTIVE,COLLECTING,DISTRIBUTING>
	groups: lagg
	media: Ethernet autoselect
	status: active
~~~

Les drapeaux **ACTIVE, COLLECTING, DISTRIBUTING** indiquent qu'un port participe pleinement à l'agrégat.

### Test de redondance

Lancer un \`ping -t 10.10.20.1\` depuis un poste, puis débrancher \`igc1\` :

| Test | Attendu | Obtenu |
|------|---------|--------|
| Débranchement d'un câble | 0 à 1 paquet perdu | 0 perdu (fast timeout) |
| Rebranchement | Retour dans l'agrégat | \`Gi1/0/1(P)\` en 3 s |
| Copie de fichier 2 flux en parallèle | Répartition sur les 2 liens | Compteurs des deux ports incrémentés |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Ports en \`(I)\` stand-alone | Pas de LACP reçu en face | Vérifier le protocole LACP côté pfSense, câblage |
| Ports en \`(s)\` suspended | Configuration différente entre membres | \`default interface\` puis réappliquer \`channel-group\` |
| \`(D)\` down sur Po1 | Aucun membre actif | Ports en \`shutdown\` ou câbles débranchés |
| Un seul lien utilisé | Algorithme de hachage inadapté | \`port-channel load-balance src-dst-ip\` |
| Perte d'accès à pfSense pendant la bascule | Interfaces non réassignées sur le LAGG | Réassigner depuis la console (option 1) |

> [!WARN] La répartition n'est pas par paquet
> Un **seul** flux (une copie de fichier) ne dépassera jamais le débit d'un lien : LACP répartit les flux, pas les paquets d'un même flux. Deux liens de 1 Gb/s ne font pas un lien de 2 Gb/s pour une seule session.

## Retour arrière

1. Sur pfSense, réaffecter les interfaces à l'ancien port physique (console, option 1).
2. Sur le switch : \`no interface Port-channel1\` puis \`default interface range Gi1/0/1 - 2\`.
3. Restaurer la configuration pfSense sauvegardée si nécessaire.

## Pour aller plus loin

- Haute disponibilité des pare-feu : [proc-006](#wiki/proc-006)
- Projet associé : [pfSense en CARP](#projet/pfsense-carp)
`
  });

  /* ========================================================================
     PROC-003 — SÉCURISER LES PORTS D'ACCÈS CISCO
     ======================================================================== */
  LIST.push({
    id: 'proc-003',
    title: "Sécuriser les ports d'accès Cisco : port-security, BPDU Guard, storm-control",
    category: 'Sécurité',
    techs: ['cisco', 'vlan'],
    level: 'Intermédiaire',
    date: '2026-03-28',
    project: 'switching',
    summary: "Empêcher les boucles, les switchs non autorisés et les tempêtes de broadcast sur les prises utilisateurs : macro de configuration réutilisable, modes de violation, réactivation automatique et alertes.",
    env: { 'Équipements': 'Cisco Catalyst IOS 15.2', 'Périmètre': 'Ports utilisateurs et OT', 'Prérequis': 'proc-001' },
    content: md`
## Contexte

Les prises réseau des bureaux et des ateliers sont accessibles à tous. Trois incidents réels motivent cette procédure :

1. Un utilisateur branche les deux extrémités d'un câble dans deux prises : **boucle**, tempête de broadcast, tout le VLAN tombe.
2. Un mini-switch est ajouté sous un bureau pour connecter « juste une imprimante » : équipements non maîtrisés, risque de boucle.
3. Un équipement d'atelier est remplacé par un portable personnel branché sur la même prise.

## Mesures et menaces couvertes

| Mesure | Menace | Effet |
|--------|--------|-------|
| **PortFast** | — | Le port passe immédiatement en *forwarding* (pas d'attente de 30 s pour le DHCP) |
| **BPDU Guard** | Boucle, switch non autorisé | Le port se coupe dès qu'il reçoit une trame Spanning Tree |
| **Port-security** | Mini-switch, usurpation | Limite le nombre d'adresses MAC par port |
| **Storm-control** | Tempête de broadcast | Écarte le trafic au-delà d'un seuil |
| **Errdisable recovery** | Coupures durables | Réactive le port automatiquement après un délai |

## Prérequis

- [ ] VLAN en place ([proc-001](#wiki/proc-001))
- [ ] Inventaire des ports : utilisateurs, téléphones, OT, imprimantes, uplinks
- [ ] Serveur syslog / supervision pour recevoir les alertes ([proc-010](#wiki/proc-010))

## Mise en œuvre

### Étape 1 — Paramètres globaux

~~~cisco title="Sur chaque switch d'accès"
spanning-tree mode rapid-pvst
spanning-tree portfast bpduguard default
!
errdisable recovery cause bpduguard
errdisable recovery cause psecure-violation
errdisable recovery cause storm-control
errdisable recovery interval 600
~~~

\`spanning-tree portfast bpduguard default\` active BPDU Guard sur **tous** les ports en PortFast : un oubli sur une interface ne crée pas de faille.

### Étape 2 — Créer une macro réutilisable

Les macros garantissent une configuration identique sur tous les ports d'un même type :

~~~cisco title="Macro des ports utilisateurs (PC + téléphone)"
macro name ACCES-UTILISATEUR
 switchport mode access
 switchport access vlan $DATA
 switchport voice vlan $VOIX
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 3
 switchport port-security violation restrict
 switchport port-security aging time 60
 switchport port-security aging type inactivity
 storm-control broadcast level 5.00
 storm-control multicast level 10.00
 storm-control action trap
 spanning-tree portfast
 spanning-tree bpduguard enable
@
~~~

~~~cisco title="Macro des ports d'équipements industriels (un seul équipement figé)"
macro name ACCES-OT
 switchport mode access
 switchport access vlan $DATA
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 1
 switchport port-security mac-address sticky
 switchport port-security violation shutdown
 storm-control broadcast level 2.00
 storm-control action shutdown
 spanning-tree portfast
 spanning-tree bpduguard enable
@
~~~

### Étape 3 — Appliquer les macros

~~~terminal title="SW-ACCESS-01 et SW-ACCESS-02"
SW-ACCESS-01(config)# interface range GigabitEthernet1/0/1 - 20
SW-ACCESS-01(config-if-range)# macro apply ACCES-UTILISATEUR $DATA 60 $VOIX 40
SW-ACCESS-01(config-if-range)# end
SW-ACCESS-02(config)# interface range GigabitEthernet1/0/1 - 8
SW-ACCESS-02(config-if-range)# macro apply ACCES-OT $DATA 40
SW-ACCESS-02(config-if-range)# end
SW-ACCESS-02# write memory
~~~

Chaque interface mémorise la macro appliquée (\`macro description\`), ce qui permet d'auditer rapidement le type de chaque port.

### Étape 4 — Choisir le mode de violation

| Mode | Trafic illicite | Port | Journalisation | Usage |
|------|-----------------|------|----------------|-------|
| \`protect\` | Ignoré | Reste actif | **Non** | À éviter (invisible) |
| \`restrict\` | Ignoré | Reste actif | Oui (syslog + compteur) | Ports utilisateurs |
| \`shutdown\` | — | **err-disabled** | Oui | Ports OT et sensibles |

Sur les ports utilisateurs, \`restrict\` évite de couper un poste légitime tout en signalant l'anomalie. Sur les ports d'atelier, \`shutdown\` est préférable : un équipement inconnu à la place d'un automate doit être bloqué immédiatement.

### Étape 5 — Ports qui ne doivent PAS recevoir ces mesures

> [!DANGER] Jamais de PortFast / BPDU Guard sur un uplink
> Appliquer BPDU Guard sur un port relié à un autre switch le coupe instantanément : le switch voisin envoie des BPDU en permanence. Les uplinks et Port-channel sont configurés séparément ([proc-001](#wiki/proc-001)) et protégés par \`spanning-tree guard root\` côté cœur.

## Validation

~~~terminal title="Contrôles après application"
SW-ACCESS-01# show port-security
Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action
                (Count)       (Count)          (Count)
---------------------------------------------------------------------------
    Gi1/0/1              3            2                  0         Restrict
    Gi1/0/2              3            2                  0         Restrict
    Gi1/0/5              3            3                  4         Restrict
---------------------------------------------------------------------------
Total Addresses in System (excluding one mac per port)     : 14
Max Addresses limit in System (excluding one mac per port) : 4096
SW-ACCESS-01# show port-security interface gi1/0/5
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 60 mins
Aging Type                 : Inactivity
Maximum MAC Addresses      : 3
Total MAC Addresses        : 3
Last Source Address:Vlan   : 6c4b.90a1.22ef:60
Security Violation Count   : 4
SW-ACCESS-01# show spanning-tree interface gi1/0/5 portfast
VLAN0060            enabled
~~~

### Scénarios de test

| # | Action | Attendu | Contrôle |
|---|--------|---------|----------|
| T1 | Câble branché entre Gi1/0/7 et Gi1/0/8 | Les deux ports en err-disabled | \`show interfaces status err-disabled\` |
| T2 | Mini-switch + 4 postes sur Gi1/0/5 | 3 MAC acceptées, violations comptées | \`show port-security interface gi1/0/5\` |
| T3 | Remplacement de l'automate sur SW-ACCESS-02 | Port coupé | Log \`%PORT_SECURITY-2-PSECURE_VIOLATION\` |
| T4 | \`ping -b\` en boucle depuis un poste | Broadcast limité à 5 % | Trap \`storm-control\` |
| T5 | Attente de 10 min après T1 | Ports réactivés automatiquement | \`show errdisable recovery\` |

~~~terminal title="Après le test T1"
SW-ACCESS-01# show interfaces status err-disabled
Port      Name               Status       Reason               Err-disabled Vlans
Gi1/0/7   ACCES-UTILISATEUR  err-disabled bpduguard
Gi1/0/8   ACCES-UTILISATEUR  err-disabled bpduguard
SW-ACCESS-01# show errdisable recovery | include bpduguard|Timer interval|Gi1
bpduguard                    Enabled
Timer interval: 600 seconds
Gi1/0/7          bpduguard              412
Gi1/0/8          bpduguard              412
~~~

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Poste + téléphone coupés au démarrage | \`maximum\` trop faible (MAC transitoire du téléphone) | Passer à 3 |
| Port OT en err-disabled après remplacement légitime | MAC *sticky* enregistrée | \`clear port-security sticky interface Gi1/0/3\` puis \`shutdown\` / \`no shutdown\` |
| Port qui retombe toutes les 10 min | Boucle toujours présente | Retrouver le câble fautif ; la réactivation automatique n'est pas une solution |
| Imprimante instable | Storm-control trop strict (découverte par broadcast) | Monter le seuil à 10 % sur ce port |

> [!TIP] Réactiver un port immédiatement
> Inutile d'attendre la réactivation automatique : \`shutdown\` puis \`no shutdown\` sur l'interface, **après** avoir supprimé la cause.

## Retour arrière

\`default interface range Gi1/0/1 - 20\` remet les ports à leur état d'usine ; réappliquer ensuite la configuration VLAN de [proc-001](#wiki/proc-001).

## Pour aller plus loin

- Protection contre les serveurs DHCP pirates et l'ARP spoofing : [proc-004](#wiki/proc-004)
- Authentification des équipements par 802.1X : procédure proc-020 (lot 2)
`
  });

  /* ========================================================================
     PROC-004 — DHCP SNOOPING ET DYNAMIC ARP INSPECTION
     ======================================================================== */
  LIST.push({
    id: 'proc-004',
    title: 'DHCP snooping et Dynamic ARP Inspection sur Cisco',
    category: 'Sécurité',
    techs: ['cisco', 'vlan'],
    level: 'Avancé',
    date: '2026-04-04',
    project: 'switching',
    summary: "Bloquer les serveurs DHCP pirates et l'empoisonnement ARP (attaque de l'homme du milieu) au niveau du switch d'accès : ports de confiance, option 82, persistance de la base, exceptions pour les équipements à IP fixe et tests d'attaque.",
    env: { 'Équipements': 'Cisco Catalyst IOS 15.2', 'DHCP': 'DC01 / DC02 via relais pfSense', 'VLAN protégés': '40, 60' },
    content: md`
## Contexte

Deux attaques de niveau 2 sont triviales à mener depuis n'importe quelle prise réseau :

| Attaque | Principe | Conséquence |
|---------|----------|-------------|
| **DHCP pirate** | Un équipement répond aux requêtes DHCP plus vite que le vrai serveur | Les postes reçoivent une fausse passerelle ou un faux DNS : tout leur trafic passe par l'attaquant |
| **ARP spoofing** | L'attaquant annonce « je suis la passerelle » avec des réponses ARP falsifiées | Interception du trafic (homme du milieu), vol d'identifiants |

Le cas le plus fréquent n'est d'ailleurs pas malveillant : une **box Internet ou un routeur Wi-Fi** branché par un utilisateur distribue ses propres adresses et coupe tout un étage.

## Principe

~~~ascii title="Confiance par port"
                 Serveur DHCP légitime (DC01/DC02 via relais pfSense)
                                   │
                         ┌─────────┴─────────┐
                         │  Po1  « TRUST »   │   ← seules les réponses DHCP
                         │   SW-ACCESS-01    │     reçues ici sont acceptées
                         └──┬──────┬──────┬──┘
              « UNTRUST »   │      │      │
                         Poste  Poste  Box pirate ✕  ← DHCPOFFER détruit
~~~

1. **DHCP snooping** : les messages *serveur* DHCP (OFFER, ACK) ne sont acceptés que sur les ports de confiance. Le switch construit une **table de liaison** : port ↔ MAC ↔ IP ↔ VLAN.
2. **Dynamic ARP Inspection (DAI)** : chaque réponse ARP reçue sur un port non fiable est comparée à cette table. Une correspondance MAC / IP inconnue est rejetée.

## Prérequis

- [ ] VLAN et trunks opérationnels ([proc-001](#wiki/proc-001))
- [ ] Inventaire des équipements à **IP statique** dans les VLAN protégés (imprimantes, automates)
- [ ] Fenêtre d'intervention : une erreur de port de confiance coupe le DHCP de tout le VLAN

## Mise en œuvre

### Étape 1 — Déclarer les ports de confiance AVANT d'activer

~~~cisco title="SW-ACCESS-01 — uplink de confiance"
interface Port-channel1
 description TRUNK vers SW-CORE-01
 ip dhcp snooping trust
 ip arp inspection trust
~~~

> [!WARN] L'ordre compte
> Activer le snooping avant d'avoir déclaré l'uplink comme fiable bloque **toutes** les réponses DHCP du VLAN : plus aucun poste n'obtient d'adresse au renouvellement de son bail.

### Étape 2 — Activer le DHCP snooping

~~~cisco title="SW-ACCESS-01"
ip dhcp snooping vlan 40,60
no ip dhcp snooping information option
ip dhcp snooping database flash:dhcp-snooping.db
ip dhcp snooping database write-delay 60
ip dhcp snooping
!
interface range GigabitEthernet1/0/1 - 20
 ip dhcp snooping limit rate 15
~~~

| Commande | Pourquoi |
|----------|----------|
| \`no ip dhcp snooping information option\` | Par défaut, le switch insère l'option 82 avec une adresse de relais \`0.0.0.0\`. De nombreux serveurs (dont Windows Server) **rejettent** ces requêtes |
| \`database flash:\` | Sans persistance, la table est vide après un redémarrage du switch et DAI bloque les postes jusqu'au renouvellement de leur bail |
| \`limit rate 15\` | Un poste qui envoie plus de 15 messages DHCP par seconde (attaque par épuisement) voit son port coupé |

### Étape 3 — Exceptions pour les adresses fixes

Les équipements à IP statique ne passent pas par le DHCP : ils sont absents de la table et DAI bloquerait leurs réponses ARP. On les déclare dans une ACL ARP :

~~~cisco title="Équipements à IP fixe du VLAN 40"
arp access-list ARP-STATIQUES-V40
 permit ip host 10.10.40.10  mac host 5254.00a1.0010
 permit ip host 10.10.40.200 mac host 5254.00a1.0200
 permit ip host 10.10.40.210 mac host 0080.f4c2.19a7
!
ip arp inspection filter ARP-STATIQUES-V40 vlan 40
~~~

### Étape 4 — Activer l'inspection ARP

~~~cisco title="SW-ACCESS-01"
ip arp inspection vlan 40,60
ip arp inspection validate src-mac dst-mac ip
ip arp inspection log-buffer entries 64
!
interface range GigabitEthernet1/0/1 - 20
 ip arp inspection limit rate 30
~~~

\`validate src-mac dst-mac ip\` ajoute des contrôles de cohérence : l'adresse MAC de l'en-tête Ethernet doit correspondre à celle annoncée dans le paquet ARP, et les adresses IP invalides (\`0.0.0.0\`, broadcast) sont rejetées.

## Validation

~~~terminal title="État et table de liaison"
SW-ACCESS-01# show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
40,60
DHCP snooping is operational on following VLANs:
40,60
Insertion of option 82 is disabled
Interface                  Trusted    Allow option    Rate limit (pps)
-----------------------    -------    ------------    ----------------
Port-channel1              yes        yes             unlimited
GigabitEthernet1/0/1       no         no              15
GigabitEthernet1/0/2       no         no              15
SW-ACCESS-01# show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  --------------------
6C:4B:90:A1:22:EF   10.10.60.123     690412      dhcp-snooping   60    GigabitEthernet1/0/5
80:5E:C0:3A:11:02   10.10.40.112     690398      dhcp-snooping   40    GigabitEthernet1/0/5
Total number of bindings: 2
~~~

### Tests d'attaque (laboratoire uniquement)

> [!SEC] Cadre légal
> Ces tests sont réalisés **exclusivement** dans mon homelab, sur mes équipements. Les mêmes outils utilisés sur un réseau sans autorisation constituent une infraction.

~~~terminal title="Portable de test sur Gi1/0/7 — serveur DHCP pirate"
root@kali:~# dnsmasq --no-daemon --interface=eth0 --dhcp-range=192.168.66.10,192.168.66.50,12h --dhcp-option=3,192.168.66.1
dnsmasq: started, version 2.89 cachesize 150
dnsmasq-dhcp: DHCP, IP range 192.168.66.10 -- 192.168.66.50, lease time 12h
dnsmasq-dhcp: DHCPDISCOVER(eth0) 6c:4b:90:a1:22:ef
dnsmasq-dhcp: DHCPOFFER(eth0) 192.168.66.23 6c:4b:90:a1:22:ef
~~~

L'offre est émise… mais n'atteint jamais le poste :

~~~terminal title="SW-ACCESS-01 — statistiques"
SW-ACCESS-01# show ip dhcp snooping statistics
 Packets Forwarded                                     = 1842
 Packets Dropped                                       = 37
 Packets Dropped From untrusted ports                  = 37
~~~

~~~terminal title="Tentative d'ARP spoofing"
root@kali:~# arpspoof -i eth0 -t 10.10.60.123 10.10.60.1
6c:4b:90:ff:00:01 6c:4b:90:a1:22:ef 0806 42: arp reply 10.10.60.1 is-at 6c:4b:90:ff:00:01
SW-ACCESS-01# show ip arp inspection statistics vlan 60
 Vlan      Forwarded        Dropped     DHCP Drops      ACL Drops
 ----      ---------        -------     ----------      ---------
   60           1204            118            118              0
~~~

~~~text title="Journal syslog reçu par Wazuh"
%SW_DAI-4-DHCP_SNOOPING_DENY: 1 Invalid ARPs (Res) on Gi1/0/7, vlan 60.([6c4b.90ff.0001/10.10.60.1/6c4b.90a1.22ef/10.10.60.123/14:22:07 CET Sat Apr 4 2026])
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Serveur DHCP pirate | Aucun client servi | 37 offres détruites |
| T2 | ARP spoofing de la passerelle | Réponses rejetées | 118 ARP rejetés, alerte syslog |
| T3 | Automate à IP fixe | Fonctionne normalement | OK grâce à l'ACL ARP |
| T4 | Redémarrage du switch | Postes toujours autorisés | OK (base en flash) |
| T5 | 200 requêtes DHCP/s (épuisement) | Port coupé | \`err-disabled (dhcp-rate-limit)\` |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Plus aucun poste n'obtient d'adresse | Uplink non déclaré \`trust\` | \`ip dhcp snooping trust\` sur le Port-channel |
| Requêtes reçues mais ignorées par Windows Server | Option 82 avec giaddr 0.0.0.0 | \`no ip dhcp snooping information option\` |
| Imprimante ou automate injoignable | IP statique absente de la table | Ajouter une entrée à l'ACL ARP |
| Postes bloqués après redémarrage | Base non persistante | \`ip dhcp snooping database flash:…\` |
| Port coupé lors d'un démarrage PXE | Rafale de requêtes DHCP | Augmenter \`limit rate\` sur les ports PXE |

## Retour arrière

~~~cisco title="Désactivation rapide"
no ip arp inspection vlan 40,60
no ip dhcp snooping
~~~

## Pour aller plus loin

- **IP Source Guard** (\`ip verify source\`) : filtre aussi les paquets IP dont l'adresse source n'est pas dans la table
- Authentification forte des équipements : 802.1X (proc-020, lot 2)
- Ports d'accès : [proc-003](#wiki/proc-003)
`
  });

  /* ========================================================================
     PROC-005 — INSTALLER PFSENSE ET SES INTERFACES VLAN
     ======================================================================== */
  LIST.push({
    id: 'proc-005',
    title: 'Installer pfSense et configurer les interfaces VLAN (router-on-a-stick)',
    category: 'Réseau',
    techs: ['pfsense', 'vlan'],
    level: 'Intermédiaire',
    date: '2026-02-20',
    project: 'pfsense-carp',
    summary: "Installation de pfSense CE sur appliance, affectation des interfaces depuis la console, création des sous-interfaces VLAN sur l'agrégat, adressage, durcissement de l'administration et sauvegarde de la configuration.",
    env: { 'Matériel': 'Appliance 4 × 2.5 GbE, AES-NI', 'Version': 'pfSense CE 2.7.2', 'Support': 'Clé USB (memstick)' },
    content: md`
## Contexte

pfSense joue ici trois rôles : **passerelle** de chaque VLAN, **pare-feu** entre les zones et **accès Internet** (NAT, VPN). Dans une architecture *router-on-a-stick*, un seul lien physique (ou agrégat) transporte tous les VLAN étiquetés jusqu'au pare-feu, qui crée une sous-interface par VLAN.

## Topologie et adressage

~~~ascii title="Interfaces de PFSENSE-01"
   igc0  ── WAN ─────────── 203.0.113.11/29  (VIP CARP .10, voir proc-006)
   igc1 ┐
   igc2 ┴─ lagg0 (LACP) ─┬─ lagg0.10  MGMT   10.10.10.252/24
                         ├─ lagg0.20  SRV    10.10.20.252/24
                         ├─ lagg0.30  DMZ    10.10.30.252/24
                         ├─ lagg0.40  VOIP   10.10.40.252/24
                         └─ lagg0.50  PXE    10.10.50.252/24
   igc3  ── SYNC ────────── 172.16.0.1/30   (câble direct vers PFSENSE-02)
~~~

Les adresses \`.252\` / \`.253\` sont les adresses **physiques** des deux pare-feu ; la passerelle utilisée par les clients est la VIP CARP \`.1\` ([proc-006](#wiki/proc-006)).

## Prérequis

- [ ] Image *pfSense CE 2.7.2 memstick* vérifiée (somme SHA-256 contrôlée)
- [ ] Clé USB, câble console (ou écran + clavier)
- [ ] Agrégat LACP prêt côté switch ([proc-002](#wiki/proc-002))
- [ ] Bloc d'adresses publiques /29 fourni par l'opérateur

~~~terminal title="Vérification de l'image avant écriture"
enzo@laptop:~/iso$ sha256sum -c pfSense-CE-memstick-2.7.2-RELEASE-amd64.img.gz.sha256
pfSense-CE-memstick-2.7.2-RELEASE-amd64.img.gz: OK
enzo@laptop:~/iso$ gunzip pfSense-CE-memstick-2.7.2-RELEASE-amd64.img.gz
enzo@laptop:~/iso$ sudo dd if=pfSense-CE-memstick-2.7.2-RELEASE-amd64.img of=/dev/sdb bs=4M status=progress conv=fsync
~~~

## Mise en œuvre

### Étape 1 — Installation

Démarrer sur la clé, accepter la licence, choisir **Install**, disposition clavier *fr*, système de fichiers **ZFS** (en miroir si deux disques), puis redémarrer en retirant la clé.

> [!TIP] ZFS plutôt qu'UFS
> ZFS résiste mieux aux coupures de courant (pas de vérification de système de fichiers interminable au redémarrage) et permet de revenir à un *boot environment* précédent si une mise à jour échoue.

### Étape 2 — Affectation initiale depuis la console

Au premier démarrage, pfSense demande l'affectation des interfaces. On répond **non** à la question des VLAN (ils seront créés sur le LAGG depuis l'interface web), on affecte \`igc0\` en WAN et temporairement \`igc3\` en LAN pour accéder à l'interface web.

~~~text title="Console après affectation"
*** Welcome to pfSense 2.7.2-RELEASE (amd64) on pfsense-01 ***

 WAN (wan)       -> igc0       -> v4: 203.0.113.11/29
 LAN (lan)       -> igc3       -> v4: 192.168.1.1/24

 0) Logout (SSH only)                  9) pfTop
 1) Assign Interfaces                 10) Filter Logs
 2) Set interface(s) IP address       11) Restart webConfigurator
 3) Reset webConfigurator password    12) PHP shell + pfSense tools
 4) Reset to factory defaults         13) Update from console
 5) Reboot system                     14) Enable Secure Shell (sshd)
 6) Halt system                       15) Restore recent configuration
 7) Ping host                         16) Restart PHP-FPM
 8) Shell

Enter an option:
~~~

### Étape 3 — Assistant de configuration

Depuis un portable branché sur \`igc3\` (\`https://192.168.1.1\`) :

| Écran | Valeur |
|-------|--------|
| Hostname / Domain | \`pfsense-01\` / \`lab.enzomarechal.fr\` |
| DNS | Laisser vide : le résolveur Unbound interrogera directement les serveurs racine |
| Time server | \`fr.pool.ntp.org\`, fuseau *Europe/Paris* |
| WAN | Statique \`203.0.113.11/29\`, passerelle \`203.0.113.9\` |
| Block RFC1918 / bogons on WAN | Cochés |
| Admin password | Mot de passe de 24 caractères stocké dans Vaultwarden |

### Étape 4 — Agrégat et VLAN

Créer \`lagg0\` (LACP sur \`igc1\` + \`igc2\`) puis les VLAN 10 à 50 sur \`lagg0\`, comme décrit dans [proc-002](#wiki/proc-002).

### Étape 5 — Affecter et adresser les interfaces

*Interfaces › Assignments* : ajouter chaque VLAN, puis pour chacune :

| Interface | Nom | IPv4 | Remarque |
|-----------|-----|------|----------|
| \`lagg0.10\` | MGMT | \`10.10.10.252/24\` | Seule interface d'administration |
| \`lagg0.20\` | SRV | \`10.10.20.252/24\` | — |
| \`lagg0.30\` | DMZ | \`10.10.30.252/24\` | — |
| \`lagg0.40\` | VOIP | \`10.10.40.252/24\` | — |
| \`lagg0.50\` | PXE | \`10.10.50.252/24\` | — |
| \`igc3\` | SYNC | \`172.16.0.1/30\` | Réaffectée après la bascule de l'administration sur MGMT |

> [!WARN] Une interface sans règle bloque tout
> Une interface nouvellement créée (autre que LAN) n'a **aucune règle** : tout le trafic entrant est bloqué par défaut. C'est voulu ; les règles sont construites dans [proc-007](#wiki/proc-007).

### Étape 6 — Durcir l'administration

*System › Advanced › Admin Access* :

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| Protocol | HTTPS | Jamais d'administration en clair |
| SSL/TLS Certificate | Certificat émis par la PKI interne | Plus d'avertissement navigateur, pas de certificat auto-signé |
| TCP port | 8443 | Libère le 443 et réduit le bruit des scans internes |
| Anti-lockout | **Désactivé** une fois la règle MGMT créée | La règle anti-lockout autorise l'administration depuis tout le LAN |
| Secure Shell | Activé, **clé publique uniquement** | — |
| Login Protection | 5 tentatives, blocage 1 h | Freine le brute force |

Dans *System › User Manager* : création d'un compte nominatif \`enzo\` membre de \`admins\` ; le compte \`admin\` est conservé comme compte de secours, avec un mot de passe stocké dans le coffre.

Règle sur l'interface **MGMT** (à créer **avant** de désactiver l'anti-lockout) :

~~~ini title="Firewall › Rules › MGMT"
Action      = Pass
Protocol    = TCP
Source      = MGMT net
Destination = This Firewall
Port        = 8443, 22
Description = Administration de pfSense depuis le VLAN MGMT uniquement
~~~

### Étape 7 — Services de base

- **DNS Resolver** (Unbound) : écoute sur toutes les interfaces internes, *DNSSEC* activé, transfert conditionnel du domaine \`lab.enzomarechal.fr\` vers DC01 / DC02.
- **NTP** : serveur NTP pour tous les VLAN (les switchs, hyperviseurs et DC s'y synchronisent).
- **Relais DHCP** vers DC01 / DC02 pour les VLAN 40 et 50 (le DHCP est centralisé sur Windows Server).

~~~ini title="Services › DNS Resolver › Domain Overrides"
Domain          = lab.enzomarechal.fr
Lookup Server   = 10.10.20.10, 10.10.20.11
Description     = Domaine Active Directory
~~~

### Étape 8 — Sauvegarde de la configuration

*Diagnostics › Backup & Restore* : export de \`config.xml\` **chiffré** (case *Encrypt this configuration file*). La configuration complète d'un pfSense tient dans ce seul fichier : il contient les clés VPN et les mots de passe, il doit donc toujours être chiffré.

## Validation

~~~terminal title="Shell pfSense"
[2.7.2-RELEASE][admin@pfsense-01]/root: ifconfig -l
igc0 igc1 igc2 igc3 enc0 lo0 pflog0 pfsync0 lagg0 lagg0.10 lagg0.20 lagg0.30 lagg0.40 lagg0.50
[2.7.2-RELEASE][admin@pfsense-01]/root: ping -c 2 -S 10.10.10.252 10.10.10.2
PING 10.10.10.2 (10.10.10.2) from 10.10.10.252: 56 data bytes
64 bytes from 10.10.10.2: icmp_seq=0 ttl=255 time=0.612 ms
64 bytes from 10.10.10.2: icmp_seq=1 ttl=255 time=0.540 ms
[2.7.2-RELEASE][admin@pfsense-01]/root: sockstat -4l | grep -E "nginx|sshd"
root     nginx      51122 5  tcp4   10.10.10.252:8443     *:*
root     sshd       33410 3  tcp4   10.10.10.252:22       *:*
~~~

- [ ] Chaque interface VLAN répond au ping depuis le switch de cœur
- [ ] L'interface web n'est accessible que depuis le VLAN 10 (test depuis le VLAN 60 : refusé)
- [ ] Résolution DNS interne et externe fonctionnelle
- [ ] Sauvegarde chiffrée stockée hors du pare-feu

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Interface VLAN « no carrier » | LAGG non monté | Voir [proc-002](#wiki/proc-002) |
| Plus d'accès web après désactivation de l'anti-lockout | Règle MGMT absente ou mal placée | Console, option \`8) Shell\` puis \`pfctl -d\` (désactive temporairement le filtrage), corriger, \`pfctl -e\` |
| Pas de résolution DNS | Unbound n'écoute pas sur l'interface | *DNS Resolver › Network Interfaces* |
| Horloge décalée | NTP bloqué en sortie | Autoriser UDP 123 sortant depuis *This Firewall* |

## Retour arrière

*Diagnostics › Backup & Restore › Restore* avec le fichier chiffré, ou en console l'option \`15) Restore recent configuration\` qui propose les dernières versions automatiquement conservées.

## Pour aller plus loin

- Second pare-feu en haute disponibilité : [proc-006](#wiki/proc-006)
- Politique de filtrage : [proc-007](#wiki/proc-007)
`
  });

  /* ========================================================================
     PROC-006 — HAUTE DISPONIBILITÉ CARP / PFSYNC / XMLRPC
     ======================================================================== */
  LIST.push({
    id: 'proc-006',
    title: 'Haute disponibilité pfSense : CARP, pfsync et XMLRPC',
    category: 'Réseau',
    techs: ['pfsense'],
    level: 'Avancé',
    date: '2026-04-11',
    project: 'pfsense-carp',
    summary: "Monter un cluster de deux pfSense actif / passif : adresses virtuelles CARP par VLAN, synchronisation des états et de la configuration, NAT sur la VIP, tests de bascule et procédure de mise à jour sans coupure.",
    env: { 'Pare-feu': '2 × pfSense CE 2.7.2 identiques', 'Lien de synchro': 'igc3 ↔ igc3 (câble direct)', 'WAN': '203.0.113.8/29' },
    content: md`
## Contexte

Un pare-feu unique est un point unique de défaillance pour **tout** le site : sans lui, plus de passerelle entre VLAN ni d'accès Internet. Cette procédure ajoute un second pare-feu qui reprend automatiquement le service en quelques secondes, sans rompre les connexions en cours.

## Fonctionnement

~~~ascii title="Cluster actif / passif"
                       VIP WAN 203.0.113.10 (vhid 1)
           .11 ┌──────────────┐          ┌──────────────┐ .12
       ────────┤  PFSENSE-01  │  pfsync  │  PFSENSE-02  ├────────
               │   MASTER     │◄────────►│   BACKUP     │
               │  advskew 0   │  XMLRPC  │  advskew 100 │
           .252└──────┬───────┘   igc3   └───────┬──────┘.253
                      └───────── VIP .1 ─────────┘
                       (une VIP par VLAN, vhid = n° de VLAN)
~~~

| Brique | Rôle |
|--------|------|
| **CARP** | Le maître répond aux requêtes ARP pour chaque VIP et émet des annonces toutes les secondes. Sans annonce pendant ~3 s, le secondaire devient maître |
| **pfsync** | Recopie en continu la table des états (connexions en cours) |
| **XMLRPC** | Pousse la configuration du maître vers le secondaire (règles, NAT, VPN, utilisateurs…) |

## Prérequis

- [ ] Deux pfSense **identiques** : même version, mêmes noms d'interfaces (\`igc0\`, \`lagg0.10\`…)
- [ ] PFSENSE-02 installé et adressé comme PFSENSE-01 avec les adresses \`.253\` ([proc-005](#wiki/proc-005))
- [ ] Interface SYNC dédiée en câble direct (\`172.16.0.1/30\` ↔ \`172.16.0.2/30\`)
- [ ] **Trois** adresses publiques sur le WAN (deux physiques + une VIP)
- [ ] Switchs laissant passer le multicast CARP (protocole IP 112)

## Mise en œuvre

### Étape 1 — Règle sur l'interface SYNC (les deux pare-feu)

~~~ini title="Firewall › Rules › SYNC — sur PFSENSE-01 et PFSENSE-02"
Action      = Pass
Protocol    = any
Source      = SYNC net
Destination = any
Description = pfsync + XMLRPC (lien dédié, câble direct)
~~~

Le lien étant un câble direct entre les deux pare-feu, une règle large est acceptable et évite les erreurs (pfsync utilise son propre protocole IP 240).

### Étape 2 — Synchronisation des états (les deux pare-feu)

*System › High Avail. Sync* :

| Champ | PFSENSE-01 | PFSENSE-02 |
|-------|-----------|-----------|
| Synchronize states | ✓ | ✓ |
| Synchronize Interface | SYNC | SYNC |
| pfsync Synchronize Peer IP | \`172.16.0.2\` | \`172.16.0.1\` |

### Étape 3 — Synchronisation de la configuration (maître uniquement)

Sur PFSENSE-01 uniquement :

| Champ | Valeur |
|-------|--------|
| Synchronize Config to IP | \`172.16.0.2\` |
| Remote System Username | \`admin\` |
| Remote System Password | mot de passe d'administration de PFSENSE-02 |
| Éléments à synchroniser | Toggle All, puis décocher ce qui doit rester local si besoin |

> [!DANGER] XMLRPC dans un seul sens
> Ne **jamais** configurer XMLRPC sur le secondaire. Sinon, une modification faite par erreur sur PFSENSE-02 écraserait la configuration de production du maître.

### Étape 4 — Créer les adresses virtuelles

*Firewall › Virtual IPs › Add* sur PFSENSE-01 :

| Interface | Adresse | VHID | Advbase | Advskew |
|-----------|---------|------|---------|---------|
| WAN | \`203.0.113.10/29\` | 1 | 1 | 0 |
| MGMT | \`10.10.10.1/24\` | 10 | 1 | 0 |
| SRV | \`10.10.20.1/24\` | 20 | 1 | 0 |
| DMZ | \`10.10.30.1/24\` | 30 | 1 | 0 |
| VOIP | \`10.10.40.1/24\` | 40 | 1 | 0 |
| PXE | \`10.10.50.1/24\` | 50 | 1 | 0 |

À la sauvegarde, XMLRPC crée automatiquement ces VIP sur PFSENSE-02 avec **advskew 100** (priorité plus faible). Extrait de la configuration :

~~~xml title="/conf/config.xml — virtualip (PFSENSE-01)"
<virtualip>
  <vip>
    <mode>carp</mode>
    <interface>opt1</interface>
    <uniqid>6630f1c2a1b47</uniqid>
    <vhid>10</vhid>
    <advskew>0</advskew>
    <advbase>1</advbase>
    <password>**********</password>
    <descr><![CDATA[VIP MGMT]]></descr>
    <type>single</type>
    <subnet_bits>24</subnet_bits>
    <subnet>10.10.10.1</subnet>
  </vip>
</virtualip>
~~~

Le **VHID** doit être unique par domaine de diffusion. Réutiliser le numéro de VLAN comme VHID évite les collisions et rend les journaux lisibles.

### Étape 5 — NAT sortant sur la VIP

*Firewall › NAT › Outbound* en mode **Hybrid**, règle en tête :

~~~ini title="Règle de NAT sortant"
Interface   = WAN
Source      = 10.10.0.0/16
Translation = 203.0.113.10 (VIP CARP WAN)
Description = Tous les VLAN sortent par la VIP
~~~

Sans cette règle, les connexions sortent avec l'adresse physique du maître (\`.11\`) : après une bascule, les réponses reviennent vers un pare-feu qui n'est plus maître et les sessions sont perdues.

### Étape 6 — Services pointant sur les VIP

| Service | Paramètre à modifier |
|---------|----------------------|
| Relais DHCP | Les étendues Windows distribuent la passerelle **\`.1\`** |
| DNS Resolver | Les clients utilisent la VIP \`.1\` comme résolveur |
| Port forwards | Destination = VIP WAN |
| WireGuard / OpenVPN | Connexion des clients sur la VIP WAN ([proc-008](#wiki/proc-008), [proc-009](#wiki/proc-009)) |

## Validation

~~~terminal title="PFSENSE-01 — état CARP"
[2.7.2-RELEASE][admin@pfsense-01]/root: ifconfig | grep "carp:"
	carp: MASTER vhid 1 advbase 1 advskew 0
	carp: MASTER vhid 10 advbase 1 advskew 0
	carp: MASTER vhid 20 advbase 1 advskew 0
	carp: MASTER vhid 30 advbase 1 advskew 0
	carp: MASTER vhid 40 advbase 1 advskew 0
	carp: MASTER vhid 50 advbase 1 advskew 0
[2.7.2-RELEASE][admin@pfsense-01]/root: pfctl -ss | wc -l
    4187
~~~

~~~terminal title="PFSENSE-02 — même nombre d'états grâce à pfsync"
[2.7.2-RELEASE][admin@pfsense-02]/root: ifconfig | grep "carp:" | sort | uniq -c
   6 	carp: BACKUP vhid 1 advbase 1 advskew 100
[2.7.2-RELEASE][admin@pfsense-02]/root: pfctl -ss | wc -l
    4183
~~~

### Scénarios de bascule

| # | Action | Attendu | Mesure |
|---|--------|---------|--------|
| T1 | *Status › CARP › Enter Persistent CARP Maintenance Mode* sur le maître | PFSENSE-02 devient MASTER | 1 ping perdu sur un \`ping -i 0.2\` |
| T2 | Débranchement électrique du maître pendant un transfert SCP | Transfert non interrompu | OK (état repris par pfsync) |
| T3 | Débranchement du câble SYNC seul | Aucun impact sur le trafic | OK, alerte « pfsync » dans les journaux |
| T4 | Débranchement d'un lien du LAGG du maître | Pas de bascule (LAGG redondant) | OK |
| T5 | Retour du maître | Reprise du rôle MASTER | Préemption automatique |

> [!INFO] Bascule par interface
> CARP gère chaque VIP indépendamment, mais pfSense active la **préemption** : si une seule interface du maître tombe, il se rétrograde sur **toutes** les VIP. On évite ainsi un état incohérent où le WAN serait sur un pare-feu et le LAN sur l'autre.

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Les deux pare-feu sont MASTER | Annonces CARP non reçues (IGMP snooping, VHID ou mot de passe différents) | Capturer \`tcpdump -ni lagg0.10 proto 112\` des deux côtés |
| Connexions coupées à la bascule | pfsync inactif | *Status › Filter Reload*, vérifier la règle SYNC |
| Configuration non répliquée | Mauvais identifiants XMLRPC | *Status › System Logs* : erreurs « XMLRPC sync » |
| Bascule en boucle (*flapping*) | Lien instable ou démotion CARP | \`sysctl net.inet.carp.demotion\` (doit valoir 0) |
| Sessions perdues après bascule | NAT sortant sur l'adresse physique | Règle de NAT sur la VIP (étape 5) |

## Procédure de mise à jour sans coupure

1. Sauvegarder la configuration des deux pare-feu.
2. Mettre à jour **PFSENSE-02** (secondaire) et vérifier qu'il redémarre en BACKUP.
3. Sur PFSENSE-01 : *Enter Persistent CARP Maintenance Mode* → PFSENSE-02 devient maître.
4. Vérifier le trafic (navigation, VPN, téléphonie) pendant quelques minutes.
5. Mettre à jour **PFSENSE-01**, puis *Leave Persistent CARP Maintenance Mode*.
6. Contrôler l'état CARP et le nombre d'états sur les deux nœuds.

## Pour aller plus loin

- Règles de filtrage synchronisées : [proc-007](#wiki/proc-007)
- Le projet complet : [pfSense CARP + VPN](#projet/pfsense-carp)
`
  });

  /* ========================================================================
     PROC-007 — POLITIQUE DE FILTRAGE INTER-VLAN PAR ALIAS
     ======================================================================== */
  LIST.push({
    id: 'proc-007',
    title: 'Construire une politique de filtrage inter-VLAN avec des alias pfSense',
    category: 'Sécurité',
    techs: ['pfsense', 'vlan'],
    level: 'Avancé',
    date: '2026-04-18',
    project: 'pfsense-carp',
    summary: "De la matrice de flux aux règles : alias réutilisables, modèle de règles identique sur chaque interface, refus par défaut journalisé, et script de non-régression qui rejoue la matrice après chaque modification.",
    env: { 'Pare-feu': 'pfSense CE 2.7.2 (cluster CARP)', 'Zones': 'MGMT, SRV, DMZ, VOIP, PXE', 'Journalisation': 'syslog → Wazuh' },
    content: md`
## Contexte

Segmenter le réseau en VLAN ne sert à rien si le pare-feu laisse tout passer entre eux. À l'inverse, des règles écrites au fil de l'eau (« on ouvre pour que ça marche ») deviennent illisibles en quelques mois : plus personne ne sait pourquoi une règle existe ni si on peut la supprimer.

La méthode présentée part d'un **document** (la matrice de flux), le traduit en **alias** puis en **règles** suivant un modèle identique sur chaque interface, et se termine par un **test automatisé**.

## Comment pfSense évalue les règles

~~~svg title="Évaluation d'un paquet entrant sur une interface"
<svg viewBox="0 0 820 230" xmlns="http://www.w3.org/2000/svg" font-family="Geist, system-ui, sans-serif">
  <defs><marker id="p7a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#cbd5e1"/></marker></defs>
  <rect x="10" y="85" width="140" height="56" rx="10" fill="#0f1218" stroke="#f472b6"/>
  <text x="80" y="110" text-anchor="middle" fill="#eef1f6" font-size="13" font-weight="600">Paquet entrant</text>
  <text x="80" y="127" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="Geist Mono, monospace">sur lagg0.30 (DMZ)</text>
  <line x1="150" y1="113" x2="200" y2="113" stroke="#cbd5e1" stroke-width="1.6" marker-end="url(#p7a)"/>
  <rect x="200" y="70" width="170" height="86" rx="10" fill="#0f1218" stroke="#fbbf24"/>
  <text x="285" y="96" text-anchor="middle" fill="#eef1f6" font-size="13" font-weight="600">État existant ?</text>
  <text x="285" y="116" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="Geist Mono, monospace">table des états</text>
  <text x="285" y="134" text-anchor="middle" fill="#34d399" font-size="10" font-family="Geist Mono, monospace">oui → autorisé</text>
  <line x1="370" y1="113" x2="420" y2="113" stroke="#cbd5e1" stroke-width="1.6" marker-end="url(#p7a)"/>
  <text x="395" y="105" text-anchor="middle" fill="#94a3b8" font-size="10">non</text>
  <rect x="420" y="40" width="210" height="146" rx="10" fill="#0f1218" stroke="#22d3ee"/>
  <text x="525" y="64" text-anchor="middle" fill="#eef1f6" font-size="13" font-weight="600">Règles de l'interface</text>
  <text x="438" y="88" fill="#cbd5e1" font-size="10.5" font-family="Geist Mono, monospace">1. règle n°1</text>
  <text x="438" y="106" fill="#cbd5e1" font-size="10.5" font-family="Geist Mono, monospace">2. règle n°2</text>
  <text x="438" y="124" fill="#cbd5e1" font-size="10.5" font-family="Geist Mono, monospace">…  première qui</text>
  <text x="438" y="142" fill="#cbd5e1" font-size="10.5" font-family="Geist Mono, monospace">    correspond gagne</text>
  <text x="438" y="168" fill="#f87171" font-size="10.5" font-family="Geist Mono, monospace">∅  refus implicite</text>
  <line x1="630" y1="90" x2="680" y2="70" stroke="#34d399" stroke-width="1.6" marker-end="url(#p7a)"/>
  <line x1="630" y1="140" x2="680" y2="160" stroke="#f87171" stroke-width="1.6" marker-end="url(#p7a)"/>
  <rect x="680" y="45" width="130" height="46" rx="10" fill="#0f1218" stroke="#34d399"/>
  <text x="745" y="73" text-anchor="middle" fill="#34d399" font-size="12" font-weight="600">PASS + état</text>
  <rect x="680" y="138" width="130" height="46" rx="10" fill="#0f1218" stroke="#f87171"/>
  <text x="745" y="166" text-anchor="middle" fill="#f87171" font-size="12" font-weight="600">BLOCK + log</text>
</svg>
~~~

Trois règles d'or en découlent :

1. Les règles s'appliquent **à l'entrée** de l'interface par laquelle le paquet arrive : un flux DMZ → SRV se filtre sur l'onglet **DMZ**.
2. La **première** règle correspondante s'applique, les suivantes sont ignorées : les refus spécifiques doivent être placés **avant** les autorisations larges.
3. pfSense est **stateful** : il suffit d'autoriser l'aller, le retour est automatiquement accepté.

## Prérequis

- [ ] Interfaces VLAN configurées ([proc-005](#wiki/proc-005))
- [ ] Matrice de flux validée (voir l'onglet *Matrice de flux pare-feu* du homelab)
- [ ] Inventaire des serveurs et de leurs ports
- [ ] Une machine de test dans chaque zone

## Mise en œuvre

### Étape 1 — Créer les alias

*Firewall › Aliases*. Un alias regroupe des hôtes, réseaux ou ports sous un nom parlant ; modifier l'alias met à jour toutes les règles qui l'utilisent.

| Alias | Type | Contenu | Utilisé par |
|-------|------|---------|-------------|
| \`RFC1918\` | Network | \`10.0.0.0/8\`, \`172.16.0.0/12\`, \`192.168.0.0/16\` | Toutes les zones (blocage latéral) |
| \`DC\` | Host | \`10.10.20.10\`, \`10.10.20.11\` | SRV, PXE, VOIP |
| \`AD_PORTS\` | Port | \`53 88 123 135 389 445 464 636 3268 3269 49152:65535\` | PXE → DC |
| \`ZABBIX\` | Host | \`10.10.20.50\` | Toutes les zones |
| \`WAZUH\` | Host | \`10.10.20.60\` | Toutes les zones |
| \`WAZUH_PORTS\` | Port | \`1514 1515\` | Agents |
| \`WEB_PORTS\` | Port | \`80 443\` | Mises à jour |
| \`ADMIN_PORTS\` | Port | \`22 443 3389 8006 8443\` | MGMT → tout |
| \`SIP_PROVIDER\` | Host | \`198.51.100.20\`, \`198.51.100.21\` | WAN → 3CX |

> [!TIP] Nommer pour lire
> Une règle « DMZ → \`WAZUH\` : \`WAZUH_PORTS\` » se lit sans connaître une seule adresse IP. C'est aussi ce qui rend l'audit possible par quelqu'un d'autre que son auteur.

### Étape 2 — Appliquer le même modèle sur chaque interface

| Bloc | Contenu | Exemple (DMZ) |
|------|---------|---------------|
| 1. Supervision et sécurité | Agents de supervision, SIEM, NTP, DNS | DMZ → \`WAZUH\` : \`WAZUH_PORTS\` ; DMZ → \`ZABBIX\` : 10051 |
| 2. Flux métier explicites | Les flux de la matrice, un par règle, avec description | DMZ → \`DC\` : *aucun* |
| 3. Blocage latéral | \`block\` vers \`RFC1918\` **journalisé** | DMZ → \`RFC1918\` : refus |
| 4. Internet | Uniquement ce qui est nécessaire | DMZ → \`!RFC1918\` : \`WEB_PORTS\` |
| 5. Refus final | \`block\` *any* journalisé | — |

Les **séparateurs** de pfSense matérialisent ces blocs dans l'interface : la lecture de n'importe quel onglet devient immédiate.

### Étape 3 — Exemple complet : interface DMZ

~~~ini title="Firewall › Rules › DMZ (ordre exact)"
# --- Supervision et sécurité ---
Pass   TCP      DMZ net  →  WAZUH          WAZUH_PORTS   Agents Wazuh
Pass   TCP      DMZ net  →  ZABBIX         10051         Agents Zabbix actifs
Pass   TCP/UDP  DMZ net  →  DMZ address    53            Résolveur DNS local
Pass   UDP      DMZ net  →  DMZ address    123           NTP
# --- Flux métier ---
Pass   TCP      SMTP-RELAY → ! RFC1918     587           Envoi des alertes
# --- Blocage latéral (journalisé) ---
Block  any      DMZ net  →  RFC1918        *             La DMZ n'initie rien vers le LAN
# --- Internet ---
Pass   TCP      DMZ net  →  ! RFC1918      WEB_PORTS     ACME + mises à jour
# --- Refus final (journalisé) ---
Block  any      *        →  *              *             Refus par défaut
~~~

La règle de blocage latéral est placée **avant** l'accès Internet : sans elle, la règle « destination différente de RFC1918 » est sûre, mais une future règle trop large ajoutée plus bas ne pourrait pas ouvrir l'accès au LAN par erreur.

### Étape 4 — Vérifier les règles telles que pf les applique

~~~terminal title="Shell pfSense — règles chargées pour l'interface DMZ"
[2.7.2-RELEASE][admin@pfsense-01]/root: pfctl -sr | grep "lagg0.30"
pass in quick on lagg0.30 inet proto tcp from 10.10.30.0/24 to 10.10.20.60 port = 1514 flags S/SA keep state label "USER_RULE: Agents Wazuh"
pass in quick on lagg0.30 inet proto tcp from 10.10.30.0/24 to 10.10.20.60 port = 1515 flags S/SA keep state label "USER_RULE: Agents Wazuh"
pass in quick on lagg0.30 inet proto tcp from 10.10.30.0/24 to 10.10.20.50 port = 10051 flags S/SA keep state label "USER_RULE: Agents Zabbix actifs"
block drop in log quick on lagg0.30 inet from 10.10.30.0/24 to <RFC1918> label "USER_RULE: La DMZ n'initie rien vers le LAN"
pass in quick on lagg0.30 inet proto tcp from 10.10.30.0/24 to ! <RFC1918> port = http flags S/SA keep state label "USER_RULE: ACME + mises à jour"
pass in quick on lagg0.30 inet proto tcp from 10.10.30.0/24 to ! <RFC1918> port = https flags S/SA keep state label "USER_RULE: ACME + mises à jour"
~~~

### Étape 5 — Script de non-régression

La matrice attendue est décrite dans un fichier texte versionné :

~~~text title="/opt/fwtest/matrice.csv"
# source;destination;port;proto;attendu;description
DMZ;10.10.20.60;1514;tcp;OUVERT;Agent Wazuh
DMZ;10.10.20.50;10051;tcp;OUVERT;Agent Zabbix
DMZ;10.10.20.10;445;tcp;FERME;SMB vers DC01
DMZ;10.10.20.10;389;tcp;FERME;LDAP vers DC01
DMZ;10.10.10.11;8006;tcp;FERME;Interface Proxmox
DMZ;1.1.1.1;443;tcp;OUVERT;HTTPS Internet
MGMT;10.10.10.11;8006;tcp;OUVERT;Interface Proxmox
MGMT;10.10.20.10;3389;tcp;OUVERT;RDP DC01
PXE;10.10.20.10;389;tcp;OUVERT;LDAP pour la jonction
PXE;1.1.1.1;443;tcp;FERME;Pas d'Internet en préparation
~~~

~~~bash title="/opt/fwtest/check-matrix.sh"
#!/usr/bin/env bash
# Rejoue la matrice de flux attendue depuis la zone où le script est lancé.
# Usage : ./check-matrix.sh <ZONE>     ex. : ./check-matrix.sh DMZ
set -uo pipefail

ZONE="$1"
MATRIX="$(dirname "$0")/matrice.csv"
OK=0
KO=0

while IFS=';' read -r src dst port proto attendu desc; do
  [[ -z "$src" || "$src" == \#* || "$src" != "$ZONE" ]] && continue
  if [[ "$proto" == "udp" ]]; then
    nc -zu -w 2 "$dst" "$port" >/dev/null 2>&1 && res="OUVERT" || res="FERME"
  else
    nc -z -w 2 "$dst" "$port" >/dev/null 2>&1 && res="OUVERT" || res="FERME"
  fi
  if [[ "$res" == "$attendu" ]]; then
    printf "[OK]   %-30s %-15s %6s/%-3s %s\n" "$desc" "$dst" "$port" "$proto" "$res"
    OK=$((OK + 1))
  else
    printf "[FAIL] %-30s %-15s %6s/%-3s obtenu=%s attendu=%s\n" "$desc" "$dst" "$port" "$proto" "$res" "$attendu"
    KO=$((KO + 1))
  fi
done < "$MATRIX"

echo "-----"
echo "$OK conforme(s), $KO écart(s)"
[[ "$KO" -eq 0 ]]
~~~

> [!WARN] Limite des tests UDP
> Un test \`nc -zu\` ne peut pas distinguer « filtré » de « ouvert sans réponse » : UDP n'a pas de poignée de main. Pour les flux UDP critiques (DNS, NTP, SIP), on teste plutôt le service lui-même (\`dig\`, \`ntpdate -q\`).

## Validation

~~~terminal title="WEB-01 (DMZ) — exécution après une modification de règle"
enzo@web-01:/opt/fwtest$ ./check-matrix.sh DMZ
[OK]   Agent Wazuh                    10.10.20.60       1514/tcp OUVERT
[OK]   Agent Zabbix                   10.10.20.50      10051/tcp OUVERT
[OK]   SMB vers DC01                  10.10.20.10        445/tcp FERME
[OK]   LDAP vers DC01                 10.10.20.10        389/tcp FERME
[OK]   Interface Proxmox              10.10.10.11       8006/tcp FERME
[OK]   HTTPS Internet                 1.1.1.1            443/tcp OUVERT
-----
6 conforme(s), 0 écart(s)
~~~

Les tentatives bloquées apparaissent dans *Status › System Logs › Firewall* et sont envoyées à Wazuh, qui alerte si une machine de la DMZ multiplie les refus vers le LAN (indice de compromission).

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Règle sans effet | Placée sur l'interface de **destination** | La déplacer sur l'interface **d'entrée** du flux |
| Flux toujours ouvert après une règle de blocage | Un état existant reste valide | *Diagnostics › States › Reset States* ou \`pfctl -k 10.10.30.30\` |
| Flux bloqué alors qu'une règle l'autorise | Un \`block\` placé plus haut correspond d'abord | Vérifier l'ordre avec \`pfctl -sr\` |
| Connexion qui s'établit puis se fige | Routage asymétrique (retour par un autre chemin) | Vérifier les passerelles des serveurs (VIP \`.1\`) |
| Alias vide dans \`pfctl -sr\` | Nom d'hôte non résolu dans un alias | Utiliser des adresses IP ou vérifier le DNS du pare-feu |

## Retour arrière

Chaque modification de règle crée une révision dans *Diagnostics › Backup & Restore › Config History* : un clic permet de comparer (*diff*) et de revenir à la version précédente.

## Pour aller plus loin

- Les règles sont synchronisées sur le second pare-feu : [proc-006](#wiki/proc-006)
- Accès d'administration à distance : [proc-008](#wiki/proc-008)
`
  });

  /* ========================================================================
     PROC-008 — VPN D'ADMINISTRATION WIREGUARD
     ======================================================================== */
  LIST.push({
    id: 'proc-008',
    title: "VPN d'administration WireGuard sur pfSense",
    category: 'Sécurité',
    techs: ['wireguard', 'pfsense'],
    level: 'Intermédiaire',
    date: '2026-05-02',
    project: 'pfsense-carp',
    summary: "Accès d'administration nomade par WireGuard : clés par appareil, tunnel en écoute sur la VIP CARP, règles limitant l'accès au bastion et aux interfaces d'administration, client Linux, Windows et mobile, révocation.",
    env: { 'Pare-feu': 'pfSense CE 2.7.2 + paquet WireGuard', 'Réseau tunnel': '10.99.0.0/24', 'Port': 'UDP 51820 sur la VIP WAN' },
    content: md`
## Contexte

L'administrateur doit pouvoir intervenir à distance (astreinte, télétravail) sans exposer **aucune** interface d'administration sur Internet. WireGuard offre :

- une cryptographie moderne et figée (Curve25519, ChaCha20-Poly1305) : pas de suite de chiffrement à mal configurer ;
- une authentification par **paire de clés par appareil** : un téléphone perdu se révoque individuellement ;
- un port UDP **silencieux** : sans clé valide, le pare-feu ne répond rien, le service est invisible aux scanners.

## Topologie

~~~ascii title="Accès nomade"
  Portable / smartphone                           PFSENSE (CARP)
  10.99.0.10 / .11          UDP 51820             VIP 203.0.113.10
  ┌───────────────┐  ════════ tunnel ═══════►  ┌────────────────┐
  │ wg-lab        │                            │ tun_wg0        │
  └───────────────┘                            │ 10.99.0.1/24   │
                                               └───────┬────────┘
                         règles WG_ADMIN               │
           ┌───────────────────────────────────────────┼─────────────────┐
           ▼                                           ▼                 ▼
    BASTION 10.10.10.50 (SSH)            Interfaces web MGMT      DNS DC01 / DC02
~~~

## Prérequis

- [ ] Cluster pfSense opérationnel ([proc-006](#wiki/proc-006))
- [ ] Enregistrement DNS public \`vpn.enzomarechal.fr\` → \`203.0.113.10\`
- [ ] Client WireGuard installé sur chaque appareil
- [ ] Inventaire des appareils autorisés (un pair par appareil, jamais de clé partagée)

## Mise en œuvre

### Étape 1 — Installer le paquet

*System › Package Manager › Available Packages* : **WireGuard**. Puis *VPN › WireGuard › Settings* : *Enable WireGuard*.

### Étape 2 — Créer le tunnel

*VPN › WireGuard › Tunnels › Add Tunnel* :

| Champ | Valeur |
|-------|--------|
| Description | Accès administration nomade |
| Listen Port | \`51820\` |
| Interface Keys | *Generate* (la clé privée ne quitte jamais le pare-feu) |
| Interface Addresses | laissé vide (porté par l'interface assignée, étape 4) |

### Étape 3 — Générer les clés de chaque appareil

Sur l'appareil lui-même, pour que la clé privée n'existe qu'à un seul endroit :

~~~terminal title="Portable Linux"
enzo@laptop:~$ umask 077
enzo@laptop:~$ wg genkey | tee laptop-enzo.key | wg pubkey > laptop-enzo.pub
enzo@laptop:~$ cat laptop-enzo.pub
Hk9pQ1mXv3sA0yLr7bN2tE8cW5zU4fG6hJ9kL1mN0pQ=
~~~

### Étape 4 — Déclarer les pairs

*VPN › WireGuard › Peers › Add Peer* :

| Champ | laptop-enzo | smartphone-enzo |
|-------|-------------|-----------------|
| Tunnel | \`tun_wg0\` | \`tun_wg0\` |
| Description | Portable d'astreinte | Smartphone |
| Public Key | clé publique de l'appareil | clé publique de l'appareil |
| Allowed IPs | \`10.99.0.10/32\` | \`10.99.0.11/32\` |
| Keep Alive | vide (le client l'envoie) | vide |

Côté pare-feu, \`Allowed IPs\` est la **seule** adresse que l'appareil a le droit d'utiliser dans le tunnel : un pair ne peut pas usurper l'adresse d'un autre.

### Étape 5 — Assigner l'interface

*Interfaces › Assignments* : ajouter \`tun_wg0\`, la nommer **WG_ADMIN**, l'activer et lui donner l'adresse \`10.99.0.1/24\`. Une interface assignée permet d'écrire des règles spécifiques et d'utiliser le tunnel dans les alias.

### Étape 6 — Règles de pare-feu

~~~ini title="Firewall › Rules › WAN"
Pass  UDP  any  →  203.0.113.10 (VIP WAN)  51820  WireGuard administration
~~~

~~~ini title="Firewall › Rules › WG_ADMIN (ordre exact)"
Pass   TCP      WG_ADMIN net → 10.10.10.50     22            SSH vers le bastion
Pass   TCP      WG_ADMIN net → MGMT net        443, 8006, 8443  Interfaces web d'administration
Pass   TCP/UDP  WG_ADMIN net → DC              53            Résolution DNS interne
Block  any      WG_ADMIN net → *               *             Tout le reste (journalisé)
~~~

Le VPN ne donne donc **pas** un accès réseau complet : il ouvre le bastion et les consoles d'administration, rien d'autre. Toute administration de serveur passe par le bastion, où les sessions sont tracées.

### Étape 7 — Particularité du cluster CARP

> [!WARN] Réponses avec la mauvaise adresse source
> WireGuard écoute sur toutes les adresses du pare-feu. Sans précaution, ses réponses partent avec l'adresse **physique** du maître (\`.11\`) au lieu de la VIP (\`.10\`) : le client, qui attend des paquets de la VIP, les rejette et le tunnel ne monte jamais.

Correction par une règle de NAT sortant en tête de liste :

~~~ini title="Firewall › NAT › Outbound (mode hybride)"
Interface     = WAN
Protocol      = UDP
Source        = This Firewall (self), port 51820
Destination   = any
Translation   = 203.0.113.10 (VIP WAN)
Static Port   = coché
Description   = WireGuard : répondre depuis la VIP CARP
~~~

### Étape 8 — Configuration des clients

~~~ini title="/etc/wireguard/wg-lab.conf (portable Linux)"
[Interface]
PrivateKey = <contenu de laptop-enzo.key>
Address    = 10.99.0.10/32
DNS        = 10.10.20.10, 10.10.20.11, lab.enzomarechal.fr

[Peer]
PublicKey           = <clé publique du tunnel tun_wg0>
Endpoint            = vpn.enzomarechal.fr:51820
AllowedIPs          = 10.10.10.0/24, 10.10.20.10/32, 10.10.20.11/32
PersistentKeepalive = 25
~~~

\`AllowedIPs\` côté client définit ce qui passe **dans** le tunnel (*split tunneling*) : la navigation Internet de l'appareil ne transite pas par le site.

~~~terminal title="Activation et génération du QR code pour le smartphone"
enzo@laptop:~$ sudo wg-quick up wg-lab
[#] ip link add wg-lab type wireguard
[#] wg setconf wg-lab /dev/fd/63
[#] ip -4 address add 10.99.0.10/32 dev wg-lab
[#] ip link set mtu 1420 up dev wg-lab
[#] resolvconf -a wg-lab -m 0 -x
[#] ip -4 route add 10.10.20.11/32 dev wg-lab
[#] ip -4 route add 10.10.20.10/32 dev wg-lab
[#] ip -4 route add 10.10.10.0/24 dev wg-lab
enzo@laptop:~$ qrencode -t ansiutf8 < smartphone-enzo.conf
~~~

Le QR code est scanné directement par l'application mobile, puis le fichier \`smartphone-enzo.conf\` est **supprimé** du portable.

## Validation

~~~terminal title="Client"
enzo@laptop:~$ sudo wg show
interface: wg-lab
  public key: Hk9pQ1mXv3sA0yLr7bN2tE8cW5zU4fG6hJ9kL1mN0pQ=
  private key: (hidden)
  listening port: 40612

peer: 3sQ1rT5uV7wX9yZ1aB3cD5eF7gH9iJ1kL3mN5oP7qR=
  endpoint: 203.0.113.10:51820
  allowed ips: 10.10.10.0/24, 10.10.20.10/32, 10.10.20.11/32
  latest handshake: 14 seconds ago
  transfer: 18.42 KiB received, 9.87 KiB sent
  persistent keepalive: every 25 seconds
enzo@laptop:~$ ssh enzo@10.10.10.50 hostname
bastion
enzo@laptop:~$ nc -zv -w 2 10.10.20.40 443
nc: connect to 10.10.20.40 port 443 (tcp) timed out: Operation now in progress
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Connexion depuis la 4G | Handshake < 1 s | OK |
| T2 | SSH vers le bastion | Autorisé | OK |
| T3 | Accès direct à GLPI (10.10.20.40) | Refusé | Timeout, refus journalisé |
| T4 | Scan UDP du port 51820 sans clé | Aucune réponse | Port vu « open\|filtered », indiscernable |
| T5 | Bascule CARP pendant une session SSH | Session conservée | Nouveau handshake en 4 s, SSH maintenu |
| T6 | Suppression du pair « smartphone » | Accès refusé immédiatement | OK |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| \`latest handshake\` absent | UDP 51820 bloqué ou mauvais endpoint | Règle WAN, DNS public, *Status › WireGuard* |
| Handshake OK mais aucun trafic | Pas de règle sur WG_ADMIN, ou \`AllowedIPs\` incomplet | Ajouter la règle, vérifier les deux \`AllowedIPs\` |
| Tunnel instable derrière une box 4G | Expiration NAT du réseau mobile | \`PersistentKeepalive = 25\` |
| Gros transferts qui se figent | MTU (encapsulation) | Forcer \`MTU = 1380\` dans \`[Interface]\` du client |
| Aucun handshake uniquement en cluster | Réponses depuis l'IP physique | Règle de NAT sortant de l'étape 7 |

## Révocation et rotation

- Appareil perdu : supprimer le pair dans *VPN › WireGuard › Peers* → accès coupé immédiatement, sans impact sur les autres.
- Rotation annuelle des clés des appareils, consignée dans un ticket GLPI.
- La liste des pairs est revue chaque trimestre : un pair sans handshake depuis 90 jours est supprimé.

## Pour aller plus loin

- Accès VPN avec authentification Active Directory : [proc-009 — OpenVPN + RADIUS](#wiki/proc-009)
- Le projet : [pfSense CARP + VPN](#projet/pfsense-carp)
`
  });

  /* ========================================================================
     PROC-009 — OPENVPN AVEC PKI DÉDIÉE ET RADIUS
     ======================================================================== */
  LIST.push({
    id: 'proc-009',
    title: 'OpenVPN sur pfSense avec PKI dédiée et authentification RADIUS (NPS)',
    category: 'Sécurité',
    techs: ['openvpn', 'pfsense', 'nps', 'ad'],
    level: 'Avancé',
    date: '2026-05-16',
    project: 'pfsense-carp',
    summary: "VPN d'accès distant à double facteur : certificat client émis par une autorité dédiée au VPN et mot de passe Active Directory vérifié par NPS. Chiffrement AES-256-GCM, tls-crypt, révocation par CRL et export des profils clients.",
    env: { 'Pare-feu': 'pfSense CE 2.7.2 + openvpn-client-export', 'RADIUS': 'NPS sur DC02 (10.10.20.11)', 'Réseau tunnel': '10.98.0.0/24 · UDP 1194' },
    content: md`
## Contexte

WireGuard ([proc-008](#wiki/proc-008)) couvre l'administration depuis des appareils maîtrisés. Pour des accès plus larges (techniciens, prestataires ponctuels), il faut :

- rattacher l'authentification à l'**Active Directory** : un compte désactivé ne doit plus pouvoir se connecter ;
- exiger **deux facteurs** : un certificat installé sur le poste (ce que je possède) et le mot de passe AD (ce que je sais) ;
- pouvoir **révoquer** un accès sans toucher aux autres.

## Architecture

~~~ascii title="Chaîne d'authentification"
  Client OpenVPN                    PFSENSE (CARP)                     DC02
  ┌──────────────┐  UDP 1194   ┌──────────────────────┐  RADIUS   ┌──────────────┐
  │ cert enzo    │────────────►│ 1. vérifie le        │──1812────►│ NPS          │
  │ + mdp AD     │  tls-crypt  │    certificat (CA VPN)│          │ 2. vérifie le │
  └──────────────┘             │ 3. CN == identifiant │◄─Accept───│    mdp + groupe│
                               └──────────────────────┘           │ GG_VPN_Admins │
                                                                  └──────────────┘
~~~

| Contrôle | Où | Ce qui est vérifié |
|----------|----|--------------------|
| tls-crypt | pfSense | Les paquets sont signés et chiffrés par une clé partagée **avant** même la négociation TLS : un scanner ne reçoit aucune réponse |
| Certificat client | pfSense | Émis par \`VPN-CA\`, non révoqué |
| Correspondance stricte | pfSense | Le CN du certificat est égal à l'identifiant saisi |
| Mot de passe + groupe | NPS / AD | Compte actif, membre de \`GG_VPN_Admins\` |

## Prérequis

- [ ] Cluster pfSense ([proc-006](#wiki/proc-006)) et domaine AD opérationnels
- [ ] Rôle NPS installé sur DC02
- [ ] Groupe \`GG_VPN_Admins\` créé dans l'AD
- [ ] Paquet **openvpn-client-export** installé sur pfSense

## Mise en œuvre

### Étape 1 — Autorité de certification dédiée au VPN

*System › Cert. Manager › CAs › Add* :

| Champ | Valeur |
|-------|--------|
| Descriptive name | \`VPN-CA\` |
| Method | Create an internal Certificate Authority |
| Key type / length | RSA 4096 |
| Digest | SHA256 |
| Lifetime | 3650 jours |
| Common Name | \`LAB-VPN-CA\` |

> [!INFO] Pourquoi une CA séparée de la PKI d'entreprise ?
> Le serveur OpenVPN accepte **tout** certificat signé par la CA qu'on lui indique. Utiliser la PKI d'entreprise reviendrait à accepter les certificats de tous les postes et serveurs du domaine. Une CA dédiée limite la confiance aux seuls certificats VPN.

Puis *Certificates › Add* : certificat **serveur** \`vpn.enzomarechal.fr\` (type *Server Certificate*, signé par \`VPN-CA\`, SAN = \`vpn.enzomarechal.fr\`).

### Étape 2 — Déclarer pfSense dans NPS

Les requêtes RADIUS partent de l'adresse de l'interface du pare-feu dans le VLAN SRV : il faut déclarer les **deux** adresses physiques.

~~~powershell title="DC02 — clients RADIUS"
$secret = Read-Host -AsSecureString 'Secret partagé RADIUS (32 caractères)'
$plain  = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret))
New-NpsRadiusClient -Name 'PFSENSE-01' -Address 10.10.20.252 -SharedSecret $plain
New-NpsRadiusClient -Name 'PFSENSE-02' -Address 10.10.20.253 -SharedSecret $plain
Get-NpsRadiusClient | Format-Table Name, Address, Enabled
~~~

Stratégie réseau dans la console NPS (*Stratégies réseau › Nouvelle*) :

| Paramètre | Valeur |
|-----------|--------|
| Nom | \`VPN-OpenVPN-Admins\` |
| Conditions | Groupes Windows = \`LAB\GG_VPN_Admins\` ; Nom convivial du client = \`PFSENSE-*\` |
| Autorisation | Accès accordé |
| Méthodes d'authentification | MS-CHAP v2 uniquement |
| Contraintes | Délai d'inactivité 30 min |

### Étape 3 — Serveur RADIUS dans pfSense

*System › User Manager › Authentication Servers › Add* :

| Champ | Valeur |
|-------|--------|
| Descriptive name | \`NPS-DC02\` |
| Type | RADIUS |
| Protocol | MS-CHAPv2 |
| Hostname | \`10.10.20.11\` |
| Shared Secret | secret défini à l'étape 2 |
| Services offered | Authentication |
| Authentication port | 1812 |
| Authentication Timeout | 5 |

Test immédiat : *Diagnostics › Authentication*, serveur \`NPS-DC02\`, compte AD de test → *User enzo authenticated successfully*.

### Étape 4 — Serveur OpenVPN

*VPN › OpenVPN › Servers › Add* :

| Section | Champ | Valeur |
|---------|-------|--------|
| Général | Server mode | Remote Access (SSL/TLS + User Auth) |
| | Backend for authentication | \`NPS-DC02\` |
| | Protocol / Interface | UDP on IPv4 only / **VIP WAN 203.0.113.10** |
| | Local port | 1194 |
| Crypto | TLS Configuration | Use a TLS Key, mode **TLS Encryption and Authentication** (tls-crypt) |
| | Peer Certificate Authority | \`VPN-CA\` |
| | Peer Certificate Revocation list | \`VPN-CRL\` (étape 6) |
| | Server certificate | \`vpn.enzomarechal.fr\` |
| | DH Parameter Length | ECDH Only |
| | Data Encryption Algorithms | AES-256-GCM, AES-128-GCM, CHACHA20-POLY1305 |
| | Fallback Data Encryption | AES-256-GCM |
| | Auth digest | SHA256 |
| | Certificate Depth | One (Client+Server) |
| | Strict User-CN Matching | **Coché** |
| Tunnel | IPv4 Tunnel Network | \`10.98.0.0/24\` |
| | Redirect IPv4 Gateway | Non (seuls les réseaux internes passent dans le tunnel) |
| | IPv4 Local network(s) | \`10.10.10.0/24, 10.10.20.0/24\` |
| | Concurrent connections | 20 |
| Client | DNS Default Domain | \`lab.enzomarechal.fr\` |
| | DNS Servers | \`10.10.20.10\`, \`10.10.20.11\` |
| Avancé | Custom options | \`reneg-sec 3600; tls-version-min 1.2\` |

### Étape 5 — Certificats utilisateurs

Pour chaque utilisateur : *Cert. Manager › Certificates › Add*, type **User Certificate**, CA \`VPN-CA\`, **Common Name = identifiant AD** (\`enzo\`), durée 365 jours. Grâce à *Strict User-CN Matching*, le certificat d'Enzo ne peut pas être utilisé avec l'identifiant d'un autre compte.

### Étape 6 — Liste de révocation

*Cert. Manager › Certificate Revocation › Add* pour \`VPN-CA\` : création de \`VPN-CRL\`, puis sélection de cette CRL dans le serveur OpenVPN (étape 4). Révoquer un utilisateur = ajouter son certificat à la CRL ; la prise en compte est immédiate.

### Étape 7 — Règles de pare-feu

~~~ini title="Firewall › Rules"
# WAN
Pass  UDP  any  →  203.0.113.10 (VIP WAN)  1194  OpenVPN
# OpenVPN (onglet de l'interface virtuelle)
Pass  TCP      10.98.0.0/24 → 10.10.10.50   22                     Bastion
Pass  TCP      10.98.0.0/24 → GLPI          443                    Outil de tickets
Pass  TCP/UDP  10.98.0.0/24 → DC            53                     DNS
Block any      10.98.0.0/24 → *             *                      Le reste (journalisé)
~~~

### Étape 8 — Export des profils clients

*VPN › OpenVPN › Client Export* : hôte \`vpn.enzomarechal.fr\`, profil par utilisateur (fichier \`.ovpn\` ou installeur Windows). Contenu d'un profil :

~~~ini title="enzo-pfsense-udp-1194.ovpn (extrait, clés masquées)"
dev tun
persist-tun
persist-key
data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
data-ciphers-fallback AES-256-GCM
auth SHA256
tls-client
client
resolv-retry infinite
remote vpn.enzomarechal.fr 1194 udp4
nobind
verify-x509-name "vpn.enzomarechal.fr" name
auth-user-pass
remote-cert-tls server
explicit-exit-notify
<ca>
-----BEGIN CERTIFICATE-----
(certificat de LAB-VPN-CA)
-----END CERTIFICATE-----
</ca>
<cert>
(certificat de l'utilisateur enzo)
</cert>
<key>
(clé privée de l'utilisateur enzo)
</key>
<tls-crypt>
(clé statique tls-crypt)
</tls-crypt>
~~~

> [!SEC] Transmission du profil
> Le fichier contient la **clé privée** de l'utilisateur. Il est transmis par un lien Vaultwarden *Send* à usage unique et expirant, jamais par e-mail.

## Validation

~~~text title="Status › System Logs › OpenVPN (connexion réussie)"
openvpn[52114]: 198.51.100.77:51544 VERIFY OK: depth=1, CN=LAB-VPN-CA
openvpn[52114]: 198.51.100.77:51544 VERIFY OK: depth=0, CN=enzo
openvpn[52114]: user 'enzo' authenticated
openvpn[52114]: enzo/198.51.100.77:51544 MULTI_sva: pool returned IPv4=10.98.0.2
openvpn[52114]: enzo/198.51.100.77:51544 Data Channel: cipher 'AES-256-GCM'
~~~

Côté NPS, l'événement **6272** (*Le serveur NPS a accordé l'accès à un utilisateur*) apparaît dans le journal *Sécurité* de DC02.

| # | Scénario | Attendu | Obtenu |
|---|----------|---------|--------|
| T1 | Certificat valide + bon mot de passe | Connecté | OK, adresse 10.98.0.2 |
| T2 | Certificat valide + mauvais mot de passe | Refus | \`AUTH_FAILED\`, NPS 6273 |
| T3 | Compte AD désactivé | Refus | \`AUTH_FAILED\` |
| T4 | Certificat d'enzo + identifiant d'un autre compte | Refus | Refus (*Strict User-CN Matching*) |
| T5 | Certificat révoqué | Refus avant le mot de passe | \`VERIFY ERROR: certificate revoked\` |
| T6 | Scan du port 1194 sans clé tls-crypt | Aucune réponse | Paquets ignorés |
| T7 | Accès à DC01 en RDP depuis le VPN | Refusé | Bloqué, journalisé |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| \`TLS Error: TLS key negotiation failed\` | Clé tls-crypt différente, port bloqué | Réexporter le profil, vérifier la règle WAN |
| \`AUTH_FAILED\` alors que le mot de passe est bon | Stratégie NPS non satisfaite ou mauvais secret | Journal *Sécurité* de DC02 : événement 6273 et son code de raison |
| Timeout RADIUS | Requête émise depuis une adresse non déclarée | Déclarer \`.252\` **et** \`.253\` dans NPS |
| Connecté mais aucun accès | Règle manquante sur l'onglet OpenVPN, ou réseau absent de *Local networks* | Ajouter la règle / le réseau |
| Noms internes non résolus | DNS non poussé ou bloqué | *DNS Servers* du serveur + règle DNS |

## Retour arrière

Désactiver le serveur (*Disable this server*) coupe toutes les sessions sans supprimer la configuration ; la CA et les certificats restent disponibles pour une réactivation.

## Pour aller plus loin

- La PKI d'entreprise et l'authentification 802.1X utilisent le même NPS : proc-018 à proc-020 (lot 2)
- Accès par appareil de confiance : [proc-008 — WireGuard](#wiki/proc-008)
`
  });

  /* ========================================================================
     PROC-010 — SNMPv3, SYSLOG ET NTP SUR LES ÉQUIPEMENTS RÉSEAU
     ======================================================================== */
  LIST.push({
    id: 'proc-010',
    title: 'SNMPv3, syslog et NTP sur les équipements réseau',
    category: 'Supervision',
    techs: ['cisco', 'pfsense', 'zabbix', 'wazuh'],
    level: 'Intermédiaire',
    date: '2026-06-06',
    project: 'zabbix-grafana',
    summary: "Rendre les switchs et pare-feu observables : horloge synchronisée, journaux centralisés vers le SIEM, SNMPv3 authPriv restreint au serveur de supervision, traps et intégration dans Zabbix.",
    env: { 'Équipements': 'Cisco IOS 15.2, pfSense CE 2.7.2', 'Supervision': 'Zabbix 7.0 (10.10.20.50)', 'SIEM': 'Wazuh 4.8 (10.10.20.60)' },
    content: md`
## Contexte

Un équipement réseau qui tombe en panne sans prévenir, des journaux restés dans sa mémoire et effacés au redémarrage, des horodatages faux de plusieurs minutes : sans ces trois briques, toute investigation est impossible.

| Brique | Rôle | Sans elle |
|--------|------|-----------|
| **NTP** | Horloge commune à tous les équipements | Impossible de corréler les événements entre switch, pare-feu et serveurs |
| **Syslog** | Journaux envoyés vers le SIEM | Journaux perdus au redémarrage, aucune alerte |
| **SNMPv3** | Métriques (débit, erreurs, état des ports) et alertes (traps) | Panne découverte par les utilisateurs |

> [!SEC] Pourquoi pas SNMPv2c ?
> SNMPv2c s'authentifie avec une « communauté » transmise **en clair** (souvent \`public\`). Quiconque capture le trafic peut lire la configuration de l'équipement, et parfois la modifier. SNMPv3 *authPriv* authentifie (SHA) et chiffre (AES) chaque requête.

## Architecture

~~~ascii title="Flux de supervision"
  SW-CORE-01 (10.10.10.2)  ┐                      ┌── ZABBIX 10.10.20.50
  SW-ACCESS-01 (.3)        ├── SNMPv3 161/udp ◄───┤   (interrogations)
  SW-ACCESS-02 (.4)        │── traps 162/udp ────►┤
  PFSENSE-01 (.252)        │                      │
  PFSENSE-02 (.253)        ┘── syslog 514/udp ───►└── WAZUH 10.10.20.60
            ▲
            └──── NTP 123/udp ◄── VIP pfSense 10.10.10.1 ◄── pool.ntp.org
~~~

## Prérequis

- [ ] Règles pfSense : ZABBIX → équipements en UDP 161, équipements → ZABBIX en UDP 162, équipements → WAZUH en UDP 514
- [ ] Secrets SNMPv3 générés (deux phrases de 20 caractères minimum) et stockés dans Vaultwarden
- [ ] Serveurs Zabbix et Wazuh opérationnels

## Mise en œuvre — Cisco

### Étape 1 — Heure et horodatage

~~~cisco title="Sur chaque switch"
clock timezone CET 1 0
clock summer-time CEST recurring last Sun Mar 2:00 last Sun Oct 3:00
ntp server 10.10.10.1 prefer
ntp source Vlan10
!
service timestamps debug datetime msec localtime show-timezone
service timestamps log datetime msec localtime show-timezone
~~~

### Étape 2 — Journaux

~~~cisco title="Journalisation locale et distante"
logging buffered 64000 informational
logging source-interface Vlan10
logging host 10.10.20.60 transport udp port 514
logging trap informational
logging origin-id hostname
~~~

\`logging buffered\` conserve aussi les journaux en mémoire (\`show logging\`) : utile si le SIEM est injoignable pendant l'incident. \`origin-id hostname\` préfixe chaque message du nom du switch, plus lisible que son adresse.

### Étape 3 — SNMPv3

~~~cisco title="SNMPv3 authPriv, en lecture seule, restreint à Zabbix" hl="4-6"
ip access-list standard ACL-SNMP
 permit host 10.10.20.50
 deny any log
snmp-server view VUE-ZABBIX iso included
snmp-server group GRP-ZABBIX v3 priv read VUE-ZABBIX access ACL-SNMP
snmp-server user zabbix GRP-ZABBIX v3 auth sha <phrase-auth> priv aes 128 <phrase-priv>
snmp-server location Baie-Homelab
snmp-server contact enzo@lab.enzomarechal.fr
snmp-server ifindex persist
!
snmp-server enable traps snmp linkdown linkup coldstart warmstart
snmp-server enable traps port-security
snmp-server enable traps errdisable
snmp-server enable traps storm-control
snmp-server host 10.10.20.50 version 3 priv zabbix
~~~

| Commande | Pourquoi |
|----------|----------|
| \`group … v3 priv\` | Impose l'authentification **et** le chiffrement |
| \`read\` sans \`write\` | Aucune modification possible par SNMP |
| \`access ACL-SNMP\` | Seul le serveur Zabbix peut interroger |
| \`ifindex persist\` | Les index d'interfaces ne changent pas au redémarrage : l'historique Zabbix reste cohérent |

> [!INFO] L'utilisateur n'apparaît pas dans la configuration
> Pour des raisons de sécurité, \`snmp-server user\` n'est **pas** affiché dans \`show running-config\`. Il se vérifie avec \`show snmp user\`. Pensez-y lors des sauvegardes : il faudra le recréer après une restauration.

## Mise en œuvre — pfSense

### Étape 4 — Syslog distant

*Status › System Logs › Settings* :

| Champ | Valeur |
|-------|--------|
| Enable Remote Logging | Coché |
| Source Address | SRV (l'interface la plus proche du SIEM) |
| Remote log servers | \`10.10.20.60:514\` |
| Remote Syslog Contents | System Events, Firewall Events, VPN Events, Gateway Monitor Events |

Côté Wazuh, les adresses sources doivent être autorisées (\`allowed-ips\` dans \`ossec.conf\`) : \`10.10.20.252\`, \`10.10.20.253\` pour les pare-feu, \`10.10.10.2-4\` pour les switchs.

### Étape 5 — SNMPv3 avec NET-SNMP

Le service SNMP intégré à pfSense ne gère que v1 / v2c. Installer le paquet **NET-SNMP** puis :

1. *Services › SNMP* (service intégré) : **désactivé**, pour libérer le port 161.
2. *Services › SNMP (NET-SNMP) › General* : activé, écoute sur l'interface **SRV** uniquement.
3. *Users* : utilisateur \`zabbix\`, authentification **SHA**, chiffrement **AES**, accès **lecture seule**.
4. *Host Information* : nom, emplacement, contact.

> [!WARN] Superviser les adresses physiques, pas la VIP
> Chaque pare-feu est supervisé par son adresse **physique** (\`.252\`, \`.253\`). Superviser la VIP ferait apparaître alternativement les métriques de l'un ou de l'autre selon le maître CARP, et masquerait la panne du secondaire.

## Intégration dans Zabbix

### Étape 6 — Macros et hôtes

Les secrets sont définis **une seule fois** en macros secrètes sur le groupe d'hôtes *Réseau* :

| Macro | Type | Valeur |
|-------|------|--------|
| \`{$SNMPV3_SECNAME}\` | Texte | \`zabbix\` |
| \`{$SNMPV3_AUTHPASS}\` | **Secret** | phrase d'authentification |
| \`{$SNMPV3_PRIVPASS}\` | **Secret** | phrase de chiffrement |

Interface SNMP de chaque hôte : version **SNMPv3**, niveau *authPriv*, protocole d'authentification *SHA1*, protocole de confidentialité *AES128*, champs renseignés avec les macros ci-dessus.

| Hôte | Adresse | Modèle |
|------|---------|--------|
| SW-CORE-01 | 10.10.10.2 | Cisco IOS by SNMP |
| SW-ACCESS-01 / 02 | 10.10.10.3 / .4 | Cisco IOS by SNMP |
| PFSENSE-01 / 02 | 10.10.20.252 / .253 | PFSense by SNMP |

## Validation

~~~terminal title="SW-CORE-01"
SW-CORE-01# show ntp status
Clock is synchronized, stratum 3, reference is 10.10.10.1
nominal freq is 286.1023 Hz, actual freq is 286.1012 Hz, precision is 2**21
reference time is E9B1C2F4.3A5E1B20 (14:22:12.227 CET Sat Jun 6 2026)
clock offset is 0.4213 msec, root delay is 18.31 msec
SW-CORE-01# show snmp user
User name: zabbix
Engine ID: 800000090300A0F849D2C181
storage-type: nonvolatile        active access-list: ACL-SNMP
Authentication Protocol: SHA
Privacy Protocol: AES128
Group-name: GRP-ZABBIX
~~~

~~~terminal title="Serveur Zabbix — interrogation SNMPv3"
root@zabbix:~# snmpwalk -v3 -l authPriv -u zabbix -a SHA -A '<phrase-auth>' -x AES -X '<phrase-priv>' 10.10.10.2 IF-MIB::ifDescr | head -4
IF-MIB::ifDescr.1 = STRING: Vlan1
IF-MIB::ifDescr.10 = STRING: Vlan10
IF-MIB::ifDescr.10101 = STRING: GigabitEthernet1/0/1
IF-MIB::ifDescr.10102 = STRING: GigabitEthernet1/0/2
root@zabbix:~# snmpget -v2c -c public 10.10.10.2 SNMPv2-MIB::sysName.0
Timeout: No Response from 10.10.10.2.
~~~

La seconde commande prouve que l'accès SNMPv2c avec la communauté \`public\` est bien **fermé**.

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Débranchement d'un poste sur Gi1/0/5 | Trap linkDown reçu, journal dans Wazuh | OK en 2 s |
| T2 | Interrogation SNMP depuis le bastion | Refusée | Timeout + \`%SEC-6-IPACCESSLOGS\` |
| T3 | Comparaison des heures switch / pfSense / DC | Écart < 1 s | 0,4 ms |
| T4 | Données dans Zabbix | Débit, erreurs, état des ports | *Latest data* alimenté |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| \`authorizationError\` / \`unknownUserName\` | Utilisateur absent (effacé lors d'une restauration) | Recréer l'utilisateur SNMPv3 |
| \`decryption error\` | Protocole de chiffrement différent (AES vs DES) | Aligner Zabbix et l'équipement |
| Échecs après redémarrage d'un switch | Engine ID modifié, cache côté serveur | Redémarrer le poller ou attendre l'expiration du cache |
| Aucun journal dans Wazuh | Adresse source non autorisée | Ajouter l'adresse dans \`allowed-ips\` |
| Horodatages décalés d'une heure | Fuseau ou heure d'été absents | \`clock timezone\` + \`clock summer-time\` |

## Pour aller plus loin

- Installation de Zabbix : proc-046 (lot 5) — Règles Wazuh : proc-050 (lot 5)
- Le projet : [Supervision Zabbix + Grafana](#projet/zabbix-grafana)
`
  });
})();
