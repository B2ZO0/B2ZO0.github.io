/* ==========================================================================
   ENZO MARECHAL — PORTFOLIO v4
   data-procedures-2.js — Base de connaissances, lot 2 : WINDOWS SERVER & IDENTITÉ
   --------------------------------------------------------------------------
   proc-011  Premier contrôleur de domaine en PowerShell
   proc-012  Second contrôleur de domaine et contrôle de la réplication
   proc-013  DHCP en failover sur Windows Server + relais pfSense
   proc-014  Structure d'OU, groupes AGDLP et délégation
   proc-015  Windows LAPS
   proc-016  GPO de durcissement réseau (LLMNR, NetBIOS, SMB, NTLM, LDAP)
   proc-017  Modèle d'administration en tiers et Protected Users
   proc-018  PKI : autorité racine hors ligne
   proc-019  PKI : autorité émettrice et auto-enrollment
   proc-020  802.1X EAP-TLS avec NPS

   Plan complet des 50 procédures : voir l'en-tête de data-procedures-1.js.
   Écriture : tag md`…`, \` pour un accent grave, \${ pour « ${ ».
   ========================================================================== */
(function () {
  'use strict';

  const md = (s, ...v) => String.raw(s, ...v).replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
  const LIST = (window.WIKI_PROCEDURES = window.WIKI_PROCEDURES || []);

  /* ========================================================================
     PROC-011 — PREMIER CONTRÔLEUR DE DOMAINE
     ======================================================================== */
  LIST.push({
    id: 'proc-011',
    title: 'Installer le premier contrôleur de domaine en PowerShell',
    category: 'Systèmes Windows',
    techs: ['windows', 'ad', 'powershell'],
    level: 'Intermédiaire',
    date: '2026-01-17',
    project: 'ad-gpo',
    summary: "Créer une forêt Active Directory propre et reproductible : choix du nom de domaine, préparation du serveur, promotion en PowerShell, DNS (redirecteurs, zones inverses, nettoyage), heure du PDC, corbeille AD, sites et sous-réseaux.",
    env: { 'Système': 'Windows Server 2022 Standard', 'Serveur': 'DC01 · 10.10.20.10 (VLAN 20)', 'Domaine': 'lab.enzomarechal.fr / LAB', 'Niveau fonctionnel': 'Windows Server 2016' },
    content: md`
## Contexte

L'Active Directory est le cœur de l'identité de l'entreprise : comptes, groupes, stratégies, DNS interne, authentification Kerberos. Une forêt mal créée (nom de domaine en \`.local\`, DNS mal configuré, heure dérivante) traîne ses défauts pendant des années, car **renommer une forêt est une opération lourde et risquée**.

Cette procédure crée la forêt en PowerShell : chaque choix est documenté et l'opération est rejouable à l'identique dans un environnement de test.

## Choix structurants

| Décision | Choix | Pourquoi |
|----------|-------|----------|
| Nom DNS | \`lab.enzomarechal.fr\` | Sous-domaine d'un domaine **possédé** : pas de conflit avec Internet, certificats publics possibles |
| Nom NetBIOS | \`LAB\` | Court, sans tiret ni point |
| Niveau fonctionnel | Windows Server 2016 (\`WinThreshold\`) | Niveau le plus élevé disponible ; requis pour le chiffrement des mots de passe LAPS |
| DNS | Intégré à l'AD | Réplication multi-maître, mises à jour dynamiques sécurisées |
| Emplacement | VM sur Proxmox, groupe HA dédié | Anti-affinité avec DC02 ([projet Proxmox](#projet/proxmox-ha)) |

> [!DANGER] Pas de .local
> \`.local\` est réservé au multicast DNS (mDNS, Bonjour) : conflits avec les Mac et les imprimantes, et aucun certificat public possible. Un domaine inventé comme \`entreprise.lan\` peut un jour être attribué à quelqu'un d'autre. Utilisez un sous-domaine d'un domaine que vous possédez.

## Prérequis

- [ ] VM Windows Server 2022 : 2 vCPU, 4 Go de RAM, disque de 60 Go
- [ ] Adresse IP fixe réservée dans le plan d'adressage (\`10.10.20.10\`)
- [ ] Règles pfSense : VLAN SRV → Internet en 53/123 pour le DC
- [ ] Mot de passe DSRM généré et stocké dans Vaultwarden
- [ ] Mises à jour Windows appliquées

## Mise en œuvre

### Étape 1 — Préparer le serveur

~~~powershell title="DC01 — avant la promotion"
# Nom de la machine (redémarrage nécessaire)
Rename-Computer -NewName 'DC01' -Restart

# Après redémarrage : adresse IP fixe
$nic = Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object -First 1
New-NetIPAddress -InterfaceIndex $nic.ifIndex -IPAddress 10.10.20.10 -PrefixLength 24 -DefaultGateway 10.10.20.1
Set-DnsClientServerAddress -InterfaceIndex $nic.ifIndex -ServerAddresses 127.0.0.1

# Fuseau horaire et nom de la carte
Set-TimeZone -Id 'Romance Standard Time'
Rename-NetAdapter -Name $nic.Name -NewName 'LAN-SRV'
~~~

> [!INFO] Faut-il désactiver IPv6 ?
> Non. Microsoft teste Windows avec IPv6 activé ; le désactiver sur un contrôleur de domaine provoque des comportements inattendus (notamment sur les services qui écoutent sur \`::1\`). On le laisse actif, même s'il n'est pas routé.

### Étape 2 — Installer le rôle et valider les prérequis

~~~powershell title="Rôle AD DS"
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Import-Module ADDSDeployment

$params = @{
    DomainName                    = 'lab.enzomarechal.fr'
    DomainNetbiosName             = 'LAB'
    ForestMode                    = 'WinThreshold'
    DomainMode                    = 'WinThreshold'
    InstallDns                    = $true
    DatabasePath                  = 'C:\Windows\NTDS'
    LogPath                       = 'C:\Windows\NTDS'
    SysvolPath                    = 'C:\Windows\SYSVOL'
    SafeModeAdministratorPassword = (Read-Host -AsSecureString 'Mot de passe DSRM')
}

# Simulation : signale tout problème sans rien modifier
Test-ADDSForestInstallation @params
~~~

La technique du **splatting** (\`@params\`) permet de réutiliser exactement les mêmes paramètres pour le test et pour l'installation.

### Étape 3 — Promotion

~~~powershell title="Création de la forêt"
Install-ADDSForest @params -NoRebootOnCompletion:$false -Force
~~~

Le serveur redémarre automatiquement. La première ouverture de session se fait avec \`LAB\Administrateur\` (même mot de passe que l'administrateur local d'origine).

### Étape 4 — Configuration DNS

~~~powershell title="Redirecteurs, zones inverses, nettoyage"
# Redirecteur vers le résolveur pfSense (VIP du VLAN SRV), sans indications de racine
Set-DnsServerForwarder -IPAddress 10.10.20.1 -UseRootHint $false

# Une zone inverse par VLAN, répliquée dans toute la forêt
'10.10.10.0/24', '10.10.20.0/24', '10.10.30.0/24', '10.10.40.0/24', '10.10.50.0/24', '10.10.60.0/24' |
    ForEach-Object { Add-DnsServerPrimaryZone -NetworkId $_ -ReplicationScope Forest -DynamicUpdate Secure }

# Nettoyage des enregistrements obsolètes (vieillissement à 7 + 7 jours)
Set-DnsServerScavenging -ScavengingState $true -ScavengingInterval 7.00:00:00 -ApplyOnAllZones
Set-DnsServerZoneAging -Name 'lab.enzomarechal.fr' -Aging $true -RefreshInterval 7.00:00:00 -NoRefreshInterval 7.00:00:00
~~~

> [!TIP] Pourquoi le nettoyage DNS ?
> Sans vieillissement, les enregistrements des postes renommés ou réinstallés restent indéfiniment : un nom résout alors vers une adresse réattribuée à une autre machine, source de diagnostics très trompeurs.

### Étape 5 — Heure du domaine

Kerberos refuse toute authentification si l'écart d'horloge dépasse **5 minutes**. Dans un domaine, seul le contrôleur qui porte le rôle **émulateur PDC** se synchronise sur une source externe ; tous les autres membres se synchronisent sur la hiérarchie du domaine.

~~~powershell title="Source de temps du PDC"
w32tm /config /manualpeerlist:"10.10.20.1,0x8" /syncfromflags:manual /reliable:yes /update
Restart-Service w32time
w32tm /resync /force
~~~

> [!WARN] Contrôleur virtualisé
> Désactivez la synchronisation de l'heure par l'hyperviseur (agent invité) sur les DC : l'hyperviseur et NTP se « battent » pour régler l'horloge, ce qui crée des sauts de temps.

### Étape 6 — Corbeille AD, site et sous-réseaux

~~~powershell title="Fonctions de la forêt"
# Corbeille Active Directory : restauration d'un objet supprimé avec tous ses attributs (irréversible)
Enable-ADOptionalFeature -Identity 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target 'lab.enzomarechal.fr' -Confirm:$false

# Site nommé et sous-réseaux déclarés
Get-ADReplicationSite -Identity 'Default-First-Site-Name' | Rename-ADObject -NewName 'SITE-LAB'
'10.10.10.0/24', '10.10.20.0/24', '10.10.30.0/24', '10.10.40.0/24', '10.10.50.0/24', '10.10.60.0/24' |
    ForEach-Object { New-ADReplicationSubnet -Name $_ -Site 'SITE-LAB' }
~~~

Déclarer les sous-réseaux permet à chaque poste de trouver le contrôleur de domaine de **son** site. Sans cela, les journaux des DC se remplissent d'avertissements « client hors site » (événement NETLOGON 5807).

## Validation

~~~terminal title="DC01 — contrôles après promotion"
PS C:\> Get-ADDomain | Select-Object DNSRoot, NetBIOSName, DomainMode, PDCEmulator
DNSRoot             NetBIOSName DomainMode        PDCEmulator
-------             ----------- ----------        -----------
lab.enzomarechal.fr LAB         Windows2016Domain DC01.lab.enzomarechal.fr
PS C:\> nslookup -type=SRV _ldap._tcp.dc._msdcs.lab.enzomarechal.fr
Serveur :   localhost
Address:  127.0.0.1

_ldap._tcp.dc._msdcs.lab.enzomarechal.fr  SRV service location:
          priority       = 0
          weight         = 100
          port           = 389
          svr hostname   = dc01.lab.enzomarechal.fr
PS C:\> dcdiag /q
PS C:\> w32tm /query /status | Select-String "Source|Strate"
Strate : 4 (référence secondaire - synchronisée par (S)NTP)
Source : 10.10.20.1,0x8
~~~

\`dcdiag /q\` n'affiche **que les erreurs** : une sortie vide est le résultat attendu.

- [ ] Les enregistrements SRV du domaine sont présents
- [ ] La résolution externe fonctionne (\`Resolve-DnsName www.debian.org\`)
- [ ] L'heure est synchronisée sur pfSense
- [ ] La corbeille AD est activée (\`Get-ADOptionalFeature 'Recycle Bin Feature'\`)

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| \`Test-ADDSForestInstallation\` : avertissement de délégation DNS | La zone parente n'existe pas sur un DNS Windows | Normal pour un sous-domaine d'une zone publique : ignorer |
| Résolution externe impossible | Redirecteur injoignable (règle pfSense) | \`Test-NetConnection 10.10.20.1 -Port 53\` |
| \`dcdiag\` : erreur *Advertising* | Service Netlogon non démarré ou SYSVOL non partagé | Attendre la fin de la réplication initiale, \`net share\` |
| Événements 5807 | Sous-réseaux non déclarés | Étape 6 |

## Pour aller plus loin

- Ajouter le second contrôleur : [proc-012](#wiki/proc-012)
- Structurer l'annuaire : [proc-014](#wiki/proc-014)
- Le projet : [Active Directory & durcissement GPO](#projet/ad-gpo)
`
  });

  /* ========================================================================
     PROC-012 — SECOND DC ET RÉPLICATION
     ======================================================================== */
  LIST.push({
    id: 'proc-012',
    title: 'Ajouter un second contrôleur de domaine et contrôler la réplication',
    category: 'Systèmes Windows',
    techs: ['windows', 'ad', 'powershell'],
    level: 'Intermédiaire',
    date: '2026-01-24',
    project: 'ad-gpo',
    summary: "Promotion de DC02, ordre des serveurs DNS, contrôle de la réplication AD et SYSVOL, placement des rôles FSMO, tests de panne et règles d'exploitation (jamais de restauration de snapshot d'un DC).",
    env: { 'Système': 'Windows Server 2022', 'Serveur': 'DC02 · 10.10.20.11', 'Source de réplication': 'DC01' },
    content: md`
## Contexte

Un domaine avec un seul contrôleur est un domaine **sans filet** : sa panne bloque les ouvertures de session, la résolution DNS interne, l'application des GPO et toute application qui s'authentifie sur l'AD. Le second contrôleur apporte la redondance, à condition que la réplication soit **saine et surveillée**.

## Architecture

~~~ascii title="Deux contrôleurs, deux hyperviseurs"
       PVE-01                                  PVE-02
  ┌──────────────────┐                    ┌──────────────────┐
  │ DC01 10.10.20.10 │ ◄── réplication ──►│ DC02 10.10.20.11 │
  │ FSMO (5 rôles)   │   AD + SYSVOL      │ Catalogue global │
  │ Catalogue global │   (DFSR)           │ DNS              │
  │ DNS · PDC → NTP  │                    │ NPS (RADIUS)     │
  └──────────────────┘                    └──────────────────┘
      DNS client : 10.10.20.11, 127.0.0.1     DNS client : 10.10.20.10, 127.0.0.1
~~~

> [!TIP] Ordre des serveurs DNS sur un DC
> Chaque DC interroge **d'abord son partenaire**, puis lui-même (\`127.0.0.1\`) en second. Un DC qui ne pointe que sur lui-même peut, après un redémarrage, attendre son propre service DNS qui attend lui-même… la réplication : on parle d'« îlot DNS ».

## Prérequis

- [ ] DC01 opérationnel ([proc-011](#wiki/proc-011)), \`dcdiag /q\` sans erreur
- [ ] VM DC02 sur un **autre hyperviseur** que DC01
- [ ] Compte membre de *Admins du domaine* pour la promotion
- [ ] Ports AD ouverts entre les deux DC (même VLAN : aucun filtrage)

## Mise en œuvre

### Étape 1 — Préparer et joindre DC02

~~~powershell title="DC02"
Rename-Computer -NewName 'DC02' -Restart

$nic = Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object -First 1
New-NetIPAddress -InterfaceIndex $nic.ifIndex -IPAddress 10.10.20.11 -PrefixLength 24 -DefaultGateway 10.10.20.1
Set-DnsClientServerAddress -InterfaceIndex $nic.ifIndex -ServerAddresses 10.10.20.10
Set-TimeZone -Id 'Romance Standard Time'

Add-Computer -DomainName 'lab.enzomarechal.fr' -Credential (Get-Credential 'LAB\adm-t0-enzo') -Restart
~~~

### Étape 2 — Promotion

~~~powershell title="DC02 — promotion en contrôleur supplémentaire"
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools

$params = @{
    DomainName                    = 'lab.enzomarechal.fr'
    SiteName                      = 'SITE-LAB'
    ReplicationSourceDC           = 'DC01.lab.enzomarechal.fr'
    InstallDns                    = $true
    NoGlobalCatalog               = $false
    Credential                    = (Get-Credential 'LAB\adm-t0-enzo')
    SafeModeAdministratorPassword = (Read-Host -AsSecureString 'Mot de passe DSRM de DC02')
}
Test-ADDSDomainControllerInstallation @params
Install-ADDSDomainController @params -Force
~~~

### Étape 3 — Ordre DNS des deux contrôleurs

~~~powershell title="Après le redémarrage de DC02"
# Sur DC02
Set-DnsClientServerAddress -InterfaceAlias 'LAN-SRV' -ServerAddresses 10.10.20.10, 127.0.0.1
# Sur DC01
Set-DnsClientServerAddress -InterfaceAlias 'LAN-SRV' -ServerAddresses 10.10.20.11, 127.0.0.1
~~~

Le redirecteur DNS de DC02 est configuré comme sur DC01 (\`Set-DnsServerForwarder -IPAddress 10.10.20.1\`), et les étendues DHCP distribuent désormais **les deux** DC ([proc-013](#wiki/proc-013)).

### Étape 4 — Rôles FSMO

Les cinq rôles d'opérations restent sur DC01, ce qui simplifie l'exploitation dans un domaine à deux contrôleurs :

~~~terminal title="Placement des rôles"
PS C:\> netdom query fsmo
Contrôleur schéma               DC01.lab.enzomarechal.fr
Maître d'attribution de noms    DC01.lab.enzomarechal.fr
Contrôleur domaine principal    DC01.lab.enzomarechal.fr
Gestionnaire du pool RID        DC01.lab.enzomarechal.fr
Maître d'infrastructure         DC01.lab.enzomarechal.fr
La commande s'est terminée correctement.
~~~

En cas de perte **définitive** de DC01, les rôles sont **saisis** sur DC02 (\`Move-ADDirectoryServerOperationMasterRole -Identity DC02 -OperationMasterRole 0,1,2,3,4 -Force\`), puis les métadonnées de DC01 sont nettoyées. Un DC dont les rôles ont été saisis ne doit **jamais** être rallumé.

## Validation

~~~terminal title="Santé de la réplication"
PS C:\> repadmin /replsummary
Replication Summary Start Time: 2026-01-24 15:02:11

Beginning data collection for replication summary, this may take awhile:
  .....

Source DSA          largest delta    fails/total %%   error
 DC01                      08m:12s    0 /   5    0
 DC02                      07m:55s    0 /   5    0

Destination DSA     largest delta    fails/total %%   error
 DC01                      07m:55s    0 /   5    0
 DC02                      08m:12s    0 /   5    0
PS C:\> dcdiag /s:DC02 /test:Replications /test:DFSREvent /test:SysVolCheck /q
PS C:\> Get-SmbShare -CimSession DC02 | Where-Object Name -in 'SYSVOL','NETLOGON'
Name     ScopeName Path                                  Description
----     --------- ----                                  -----------
NETLOGON *         C:\Windows\SYSVOL\sysvol\lab.enzomarechal.fr\SCRIPTS Logon server share
SYSVOL   *         C:\Windows\SYSVOL\sysvol             Logon server share
~~~

### Test fonctionnel de réplication

~~~powershell title="Créer sur DC01, lire sur DC02"
New-ADUser -Name 'test-replication' -Server DC01 -Path 'OU=DESACTIVES,DC=lab,DC=enzomarechal,DC=fr'
repadmin /syncall DC01 /AdeP
Get-ADUser 'test-replication' -Server DC02 | Select-Object Name, DistinguishedName
Remove-ADUser 'test-replication' -Server DC01 -Confirm:$false
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Objet créé sur DC01 | Visible sur DC02 | Immédiat après \`/syncall\`, 15 s sinon (intra-site) |
| T2 | Fichier ajouté dans \`NETLOGON\` sur DC01 | Présent sur DC02 | OK (DFSR) |
| T3 | **DC01 éteint** : ouverture de session d'un utilisateur | Session ouverte | OK via DC02 |
| T4 | DC01 éteint : résolution DNS interne | OK | DC02 répond |
| T5 | DC01 éteint : modification d'un mot de passe | OK (le PDC sera mis à jour au retour) | OK |

## Règles d'exploitation

> [!DANGER] Ne jamais restaurer un snapshot d'un contrôleur de domaine
> Revenir à un snapshot fait « reculer » le compteur de mises à jour (USN) du DC : ses partenaires considèrent qu'ils ont déjà reçu ces modifications et ne répliquent plus. C'est le **USN rollback**, qui corrompt silencieusement l'annuaire. Un DC se restaure par une **sauvegarde état système** (restauration non autoritaire), ou se reconstruit simplement en le repromouvant.

- Les DC sont exclus des snapshots manuels dans Proxmox ; ils sont sauvegardés par PBS en mode *snapshot* avec l'agent invité (VSS), ce qui déclenche une restauration propre (*VM-GenerationID*).
- La réplication est supervisée par Zabbix (événements 1311, 1988, 2042 et sortie de \`repadmin\`).
- Un compte de test est modifié chaque nuit par une tâche planifiée : sa date de modification sur chaque DC prouve que la réplication fonctionne de bout en bout.

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Erreur 1722 (serveur RPC indisponible) | Pare-feu, DNS ou DC éteint | \`Test-NetConnection DC01 -Port 135\`, résolution du nom |
| Erreur 8606 / objets persistants | DC resté hors ligne au-delà de la durée de vie des objets supprimés (180 jours) | Rétrograder et repromouvoir le DC |
| SYSVOL non partagé sur DC02 | Réplication initiale DFSR non terminée | Journal *DFS Replication*, événement 4604 attendu |
| Événement 2042 | Pas de réplication depuis trop longtemps | Ne pas forcer : analyser avec \`repadmin /showrepl\` |

## Pour aller plus loin

- DHCP redondé sur les deux DC : [proc-013](#wiki/proc-013)
- Le premier contrôleur : [proc-011](#wiki/proc-011)
`
  });

  /* ========================================================================
     PROC-013 — DHCP FAILOVER + RELAIS PFSENSE
     ======================================================================== */
  LIST.push({
    id: 'proc-013',
    title: 'DHCP en failover sur Windows Server avec relais pfSense',
    category: 'Systèmes Windows',
    techs: ['windows', 'pfsense', 'powershell'],
    level: 'Intermédiaire',
    date: '2026-02-07',
    project: 'ad-gpo',
    summary: "Centraliser le DHCP de tous les VLAN sur deux contrôleurs en répartition de charge, avec relais sur le pare-feu : autorisation dans l'AD, étendues et options, mises à jour DNS sécurisées, réplication du failover et test de panne.",
    env: { 'Serveurs DHCP': 'DC01 + DC02 (Windows Server 2022)', 'Relais': 'pfSense CE 2.7.2 (cluster CARP)', 'Étendues': 'VLAN 40, 50, 60' },
    content: md`
## Contexte

Le DHCP est invisible tant qu'il fonctionne… et paralysant dès qu'il tombe : au renouvellement de leur bail, les postes perdent leur adresse. La solution retenue :

- **deux** serveurs DHCP (DC01 et DC02) qui partagent chaque étendue en **répartition de charge 50/50** ;
- le pare-feu, qui sépare les VLAN, **relaie** les requêtes vers ces deux serveurs ;
- les baux sont **inscrits dans le DNS** de façon sécurisée.

> [!INFO] Pourquoi ne pas utiliser le DHCP de pfSense ?
> pfSense peut servir le DHCP, mais il ne peut pas être à la fois serveur et relais. Centraliser sur Windows permet en plus la mise à jour DNS sécurisée, la journalisation des baux dans les journaux Windows et une administration unique pour tous les VLAN.

## Fonctionnement du relais

~~~ascii title="Requête DHCP d'un poste du VLAN 60"
 Poste VLAN 60                  pfSense (relais)                     DC01 / DC02
 ─────────────                  ────────────────                     ───────────
 DHCPDISCOVER (broadcast) ───►  reçu sur lagg0.60
                                giaddr = 10.10.60.252  ─── unicast ───► étendue
                                                                        choisie
                                                                        grâce au
                                                         ◄── OFFER ──── giaddr
 ◄────────── DHCPOFFER ─────────
~~~

Le champ **giaddr** (adresse de l'agent relais) indique au serveur de quel sous-réseau provient la requête : c'est ce qui lui permet de choisir la bonne étendue.

## Prérequis

- [ ] DC01 et DC02 opérationnels ([proc-012](#wiki/proc-012))
- [ ] Serveur DHCP de pfSense **désactivé** sur toutes les interfaces
- [ ] Compte de service \`svc-dhcp-dns\` (utilisateur standard, mot de passe long qui n'expire pas, géré dans Vaultwarden)

## Mise en œuvre

### Étape 1 — Installer et autoriser le rôle (sur les deux DC)

~~~powershell title="DC01 puis DC02"
Install-WindowsFeature -Name DHCP -IncludeManagementTools

# Groupes locaux « Administrateurs DHCP » et « Utilisateurs DHCP »
Add-DhcpServerSecurityGroup
Restart-Service DHCPServer

# Autorisation dans l'AD : un serveur non autorisé ne distribue aucune adresse
Add-DhcpServerInDC -DnsName "$env:COMPUTERNAME.lab.enzomarechal.fr" -IPAddress (Get-NetIPAddress -InterfaceAlias 'LAN-SRV' -AddressFamily IPv4).IPAddress

# Indique au Gestionnaire de serveur que la configuration post-installation est faite
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\ServerManager\Roles\12' -Name ConfigurationState -Value 2
~~~

### Étape 2 — Mises à jour DNS sécurisées (sur les deux DC)

~~~powershell title="Inscription DNS par un compte dédié"
Set-DhcpServerDnsCredential -Credential (Get-Credential 'LAB\svc-dhcp-dns') -ComputerName $env:COMPUTERNAME
Set-DhcpServerv4DnsSetting -ComputerName $env:COMPUTERNAME -DynamicUpdates Always -DeleteDnsRROnLeaseExpiry $true -UpdateDnsRRForOlderClients $true
~~~

> [!SEC] Pourquoi un compte dédié ?
> Sans identifiants, le service DHCP d'un contrôleur de domaine inscrit les enregistrements avec le **compte ordinateur du DC**, ce qui lui donne des droits sur ces enregistrements. Un compte dédié, sans privilège, évite qu'un enregistrement DNS appartienne à un contrôleur de domaine.

### Étape 3 — Étendues et options (sur DC01 uniquement)

~~~powershell title="Options communes au serveur"
Set-DhcpServerv4OptionValue -DnsServer 10.10.20.10, 10.10.20.11 -DnsDomain 'lab.enzomarechal.fr'
# NetBIOS désactivé pour les clients Windows (option 001 de la classe Microsoft)
Set-DhcpServerv4OptionValue -VendorClass 'Microsoft Windows Options' -OptionId 1 -Value 2
~~~

~~~powershell title="Création des étendues"
$scopes = @(
    @{ Name = 'VLAN40-VOIP-IOT';    Net = '10.10.40.0'; Start = '10.10.40.100'; End = '10.10.40.199'; Lease = '8.00:00:00' },
    @{ Name = 'VLAN50-PXE';         Net = '10.10.50.0'; Start = '10.10.50.100'; End = '10.10.50.199'; Lease = '0.04:00:00' },
    @{ Name = 'VLAN60-BUREAUTIQUE'; Net = '10.10.60.0'; Start = '10.10.60.100'; End = '10.10.60.250'; Lease = '1.00:00:00' }
)

foreach ($s in $scopes) {
    Add-DhcpServerv4Scope -Name $s.Name -StartRange $s.Start -EndRange $s.End \`
        -SubnetMask 255.255.255.0 -LeaseDuration ([TimeSpan]::Parse($s.Lease)) -State Active
    $router = $s.Net -replace '\.0$', '.1'
    Set-DhcpServerv4OptionValue -ScopeId $s.Net -Router $router
    Write-Host "[+] $($s.Name) : $($s.Start) → $($s.End), passerelle $router" -ForegroundColor Green
}

# Provisioning des téléphones IP (VLAN 40) : option 66
Set-DhcpServerv4OptionValue -ScopeId 10.10.40.0 -OptionId 66 -Value 'https://10.10.40.10:5001/provisioning/k7f2q9xw'
~~~

| Étendue | Durée du bail | Justification |
|---------|---------------|---------------|
| VLAN 40 (voix / IoT) | 8 jours | Équipements fixes |
| VLAN 50 (PXE) | **4 heures** | Postes de passage : libère vite les adresses |
| VLAN 60 (bureautique) | 1 jour | Compromis mobilité / stabilité |

### Étape 4 — Relation de basculement

~~~powershell title="DC01 — failover en répartition de charge"
Add-DhcpServerv4Failover -ComputerName DC01 -Name 'FO-DC01-DC02' \`
    -PartnerServer 'DC02.lab.enzomarechal.fr' \`
    -ScopeId 10.10.40.0, 10.10.50.0, 10.10.60.0 \`
    -LoadBalancePercent 50 \`
    -MaxClientLeadTime 01:00:00 \`
    -AutoStateTransition $true -StateSwitchInterval 01:00:00 \`
    -SharedSecret (Read-Host 'Secret partagé du failover')
~~~

| Paramètre | Rôle |
|-----------|------|
| \`LoadBalancePercent 50\` | Chaque serveur répond à la moitié des clients (selon un hachage de la MAC) |
| \`MaxClientLeadTime\` | Durée pendant laquelle un serveur seul peut prolonger les baux de son partenaire |
| \`AutoStateTransition\` | Bascule automatique en mode « partenaire arrêté » après \`StateSwitchInterval\` |

> [!WARN] Les modifications ne se répliquent pas seules
> Le failover réplique les **baux**, pas la **configuration**. Après toute modification d'option ou de réservation sur DC01 : \`Invoke-DhcpServerv4FailoverReplication -ComputerName DC01 -Name FO-DC01-DC02 -Force\`.

### Étape 5 — Relais sur pfSense

*Services › DHCP Relay* :

| Champ | Valeur |
|-------|--------|
| Enable | Coché |
| Downstream Interfaces | VOIP, PXE, BUREAUTIQUE |
| CARP Status VIP | VIP du VLAN SRV (si l'option est proposée par votre version : le relais ne tourne que sur le maître) |
| Append circuit ID and agent ID | **Décoché** |
| Upstream Servers | \`10.10.20.10\`, \`10.10.20.11\` |

Le relais envoie la requête **aux deux** serveurs ; chacun décide s'il répond selon la répartition 50/50.

## Validation

~~~terminal title="DC01 — état du failover et des étendues"
PS C:\> Get-DhcpServerv4Failover | Select-Object Name, PartnerServer, Mode, LoadBalancePercent, State
Name          PartnerServer             Mode         LoadBalancePercent State
----          -------------             ----         ------------------ -----
FO-DC01-DC02  DC02.lab.enzomarechal.fr  LoadBalance                  50 Normal
PS C:\> Get-DhcpServerv4ScopeStatistics | Format-Table ScopeId, Free, InUse, PercentageInUse
ScopeId    Free InUse PercentageInUse
-------    ---- ----- ---------------
10.10.40.0   86    14              14
10.10.50.0   98     2               2
10.10.60.0  134    17           11,26
~~~

~~~terminal title="Poste du VLAN 60"
PS C:\> ipconfig /renew > $null; Get-NetIPConfiguration | Select-Object IPv4Address, IPv4DefaultGateway, DNSServer
IPv4Address    : {10.10.60.123}
IPv4DefaultGateway : {10.10.60.1}
DNSServer      : {10.10.20.10, 10.10.20.11}
PS C:\> Resolve-DnsName PC-5CG3301XYZ.lab.enzomarechal.fr | Select-Object Name, IPAddress
Name                               IPAddress
----                               ---------
PC-5CG3301XYZ.lab.enzomarechal.fr  10.10.60.123
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Nouveau poste dans le VLAN 60 | Adresse, passerelle \`.1\`, DNS | OK |
| T2 | Enregistrement DNS du poste | Créé automatiquement | OK |
| T3 | \`Stop-Service DHCPServer\` sur DC01 | Les clients obtiennent un bail de DC02 | OK, DC02 en *CommunicationInterrupted* |
| T4 | Retour de DC01 | Retour en état *Normal* | Resynchronisation automatique |
| T5 | Bascule CARP du pare-feu | Le relais continue | OK |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Aucune adresse dans un VLAN | Relais non activé sur l'interface, ou serveur DHCP pfSense encore actif | *Services › DHCP Relay*, *Services › DHCP Server* |
| Adresses d'une mauvaise étendue | giaddr incorrect (interface physique d'un autre VLAN) | Capture \`tcpdump -ni lagg0.20 port 67\` sur pfSense |
| Requêtes reçues mais ignorées | Serveur non autorisé dans l'AD | \`Get-DhcpServerInDC\` |
| Configuration différente sur DC02 | Réplication du failover non lancée | \`Invoke-DhcpServerv4FailoverReplication\` |
| Port coupé lors d'un boot PXE | DHCP snooping trop strict | Augmenter \`limit rate\` ([proc-004](#wiki/proc-004)) |

## Pour aller plus loin

- La protection contre les serveurs DHCP pirates : [proc-004](#wiki/proc-004)
- Le pare-feu en haute disponibilité : [proc-006](#wiki/proc-006)
`
  });

  /* ========================================================================
     PROC-014 — STRUCTURE D'OU, AGDLP ET DÉLÉGATION
     ======================================================================== */
  LIST.push({
    id: 'proc-014',
    title: "Structure d'OU, groupes AGDLP et délégation du support en PowerShell",
    category: 'Systèmes Windows',
    techs: ['ad', 'powershell', 'windows'],
    level: 'Intermédiaire',
    date: '2026-02-21',
    project: 'ad-gpo',
    summary: "Industrialiser la gestion de l'annuaire : création d'utilisateurs depuis un fichier CSV avec identifiants normalisés, imbrication de groupes AGDLP, délégation de la réinitialisation des mots de passe au support et audit des ACL qui ne respectent pas le modèle.",
    env: { 'Domaine': 'lab.enzomarechal.fr', 'Outils': 'Module ActiveDirectory, dsacls', 'Exécution': 'Serveur d’administration (RSAT)' },
    content: md`
## Contexte

Créer les comptes à la main dans la console *Utilisateurs et ordinateurs* produit des identifiants incohérents (\`jdupont\`, \`j.dupont\`, \`dupont.j\`), des comptes rangés au mauvais endroit et des droits donnés directement aux utilisateurs. Six mois plus tard, plus personne ne sait **pourquoi** un utilisateur a accès à un partage.

Cette procédure complète la structure d'OU décrite dans le [projet AD](#projet/ad-gpo) par trois outils : un import CSV normalisé, le modèle AGDLP appliqué aux partages, et une délégation précise des droits du support.

## Rappel du modèle AGDLP

~~~ascii title="Du compte à la permission"
  Comptes (A)           Groupes globaux (G)        Groupes domaine local (DL)     Permission (P)
  ───────────           ───────────────────        ──────────────────────────     ──────────────
  m.durand  ───┐
  l.martin  ───┼──►  GG_Compta_Utilisateurs ───┐
  p.bernard ───┘                               ├──►  DL_Partage-Compta_RW  ───►  Modification
  a.petit   ─────►  GG_Direction           ───┘                                \\SRV-FIC\Compta
                    GG_Direction           ──────►  DL_Partage-Compta_RO  ───►  Lecture
~~~

| Règle | Pourquoi |
|-------|----------|
| Jamais un utilisateur directement dans une ACL | L'accès doit se lire dans les groupes, pas dans des ACL dispersées |
| Groupes **globaux** = qui (métier) | Reflètent l'organigramme |
| Groupes **domaine local** = quoi (ressource + droit) | Un groupe par ressource et par niveau de droit |
| Seuls les DL apparaissent dans les ACL | Ajouter un service = ajouter un GG dans un DL, sans toucher aux ACL |

## Prérequis

- [ ] Arborescence d'OU créée (\`UTILISATEURS\`, \`GROUPES\`… — voir le projet)
- [ ] Console RSAT sur un serveur d'administration (pas sur un poste utilisateur)
- [ ] Certificat de chiffrement de documents pour l'administrateur (pour protéger les mots de passe initiaux)

## Mise en œuvre

### Étape 1 — Fichier source

~~~text title="C:\Admin\Arrivees\2026-02-arrivees.csv"
Prenom;Nom;Service;Fonction;Ticket
Mélanie;Durand;Compta;Comptable;GLPI-1842
Léo;Martin;Compta;Assistant comptable;GLPI-1843
Jean-Philippe;Le Bihan;Production;Chef d'équipe;GLPI-1844
Élodie;Martin;Support;Technicienne N1;GLPI-1845
~~~

### Étape 2 — Script d'import normalisé

~~~powershell title="C:\Admin\Scripts\Import-LabUsers.ps1"
#Requires -Modules ActiveDirectory
<#
.SYNOPSIS
    Crée les comptes d'un fichier CSV avec des identifiants normalisés (p.nom),
    les place dans l'OU de leur service et les ajoute au groupe global du service.
    Les mots de passe initiaux sont chiffrés (CMS) pour le seul administrateur.
#>
param(
    [Parameter(Mandatory)][string]$CsvPath,
    [string]$Domain     = 'lab.enzomarechal.fr',
    [string]$BaseDN     = 'DC=lab,DC=enzomarechal,DC=fr',
    [string]$CmsTo      = 'CN=enzo-admin',
    [switch]$WhatIf
)

Add-Type -AssemblyName System.Web

function ConvertTo-AsciiLower([string]$s) {
    $n = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{Mn}', ''
    return ($n -replace '[^a-zA-Z]', '').ToLower()
}

function Get-UniqueSam([string]$prenom, [string]$nom) {
    $base = '{0}.{1}' -f (ConvertTo-AsciiLower $prenom).Substring(0, 1), (ConvertTo-AsciiLower $nom)
    $base = $base.Substring(0, [Math]::Min(18, $base.Length))
    $sam = $base; $i = 2
    while (Get-ADUser -Filter "SamAccountName -eq '$sam'" -ErrorAction SilentlyContinue) {
        $sam = "$base$i"; $i++
    }
    return $sam
}

$groupes = @{
    Compta     = 'GG_Compta_Utilisateurs'
    Production = 'GG_Production_Utilisateurs'
    Support    = 'GG_Support_T2'
    Direction  = 'GG_Direction'
}

$rapport = foreach ($u in (Import-Csv -Path $CsvPath -Delimiter ';' -Encoding UTF8)) {
    $sam = Get-UniqueSam $u.Prenom $u.Nom
    $ou  = "OU=$($u.Service),OU=UTILISATEURS,$BaseDN"
    $pwd = [System.Web.Security.Membership]::GeneratePassword(20, 4)

    $params = @{
        Name                  = "$($u.Prenom) $($u.Nom)"
        DisplayName           = "$($u.Prenom) $($u.Nom.ToUpper())"
        GivenName             = $u.Prenom
        Surname               = $u.Nom
        SamAccountName        = $sam
        UserPrincipalName     = "$sam@$Domain"
        Title                 = $u.Fonction
        Department            = $u.Service
        Path                  = $ou
        AccountPassword       = (ConvertTo-SecureString $pwd -AsPlainText -Force)
        ChangePasswordAtLogon = $true
        Enabled               = $true
        Description           = "Créé le $(Get-Date -Format 'yyyy-MM-dd') · $($u.Ticket)"
        WhatIf                = $WhatIf
    }
    New-ADUser @params
    if (-not $WhatIf -and $groupes.ContainsKey($u.Service)) {
        Add-ADGroupMember -Identity $groupes[$u.Service] -Members $sam
    }
    [pscustomobject]@{ Compte = $sam; Nom = $params.DisplayName; Service = $u.Service; Ticket = $u.Ticket; MotDePasse = $pwd }
}

$rapport | Select-Object Compte, Nom, Service, Ticket | Format-Table -AutoSize
if (-not $WhatIf) {
    $sortie = "C:\Admin\Arrivees\mdp-$(Get-Date -Format 'yyyyMMdd-HHmm').cms"
    $rapport | ConvertTo-Csv -NoTypeInformation -Delimiter ';' | Out-String |
        Protect-CmsMessage -To $CmsTo -OutFile $sortie
    Write-Host "Mots de passe initiaux chiffrés dans $sortie" -ForegroundColor Yellow
}
~~~

Points de conception :

- **\`-WhatIf\`** : une exécution à blanc affiche ce qui serait créé, sans rien modifier.
- **Collisions** : deux « Léo Martin » donnent \`l.martin\` puis \`l.martin2\`.
- **Accents et espaces** supprimés de l'identifiant (\`Jean-Philippe Le Bihan\` → \`j.lebihan\`), mais conservés dans le nom affiché.
- Les mots de passe initiaux ne sont **jamais** écrits en clair : ils sont chiffrés avec \`Protect-CmsMessage\` pour le certificat de l'administrateur, puis transmis individuellement par un lien Vaultwarden *Send*.

~~~terminal title="Exécution à blanc puis réelle"
PS C:\Admin\Scripts> .\Import-LabUsers.ps1 -CsvPath ..\Arrivees\2026-02-arrivees.csv -WhatIf
WhatIf : Opération « New » en cours sur la cible « CN=Mélanie Durand,OU=Compta,OU=UTILISATEURS,DC=lab,DC=enzomarechal,DC=fr ».
WhatIf : Opération « New » en cours sur la cible « CN=Léo Martin,OU=Compta,OU=UTILISATEURS,DC=lab,DC=enzomarechal,DC=fr ».
PS C:\Admin\Scripts> .\Import-LabUsers.ps1 -CsvPath ..\Arrivees\2026-02-arrivees.csv
Compte      Nom                       Service    Ticket
------      ---                       -------    ------
m.durand    Mélanie DURAND            Compta     GLPI-1842
l.martin    Léo MARTIN                Compta     GLPI-1843
j.lebihan   Jean-Philippe LE BIHAN    Production GLPI-1844
e.martin    Élodie MARTIN             Support    GLPI-1845
Mots de passe initiaux chiffrés dans C:\Admin\Arrivees\mdp-20260221-1012.cms
~~~

### Étape 3 — Appliquer AGDLP à un partage

~~~powershell title="Partage Compta : groupes DL et ACL NTFS"
$gg = 'OU=Globaux,OU=GROUPES,DC=lab,DC=enzomarechal,DC=fr'
$dl = 'OU=Domaine-Local,OU=GROUPES,DC=lab,DC=enzomarechal,DC=fr'

New-ADGroup -Name 'DL_Partage-Compta_RW' -GroupScope DomainLocal -GroupCategory Security -Path $dl -Description 'Modification sur \\SRV-FIC\Compta'
New-ADGroup -Name 'DL_Partage-Compta_RO' -GroupScope DomainLocal -GroupCategory Security -Path $dl -Description 'Lecture sur \\SRV-FIC\Compta'
Add-ADGroupMember 'DL_Partage-Compta_RW' -Members 'GG_Compta_Utilisateurs'
Add-ADGroupMember 'DL_Partage-Compta_RO' -Members 'GG_Direction'

# ACL NTFS : héritage coupé, seuls les administrateurs, SYSTEM et les groupes DL
$path = 'D:\Partages\Compta'
icacls $path /inheritance:r
icacls $path /grant 'SYSTEM:(OI)(CI)F' 'BUILTIN\Administrateurs:(OI)(CI)F'
icacls $path /grant 'LAB\DL_Partage-Compta_RW:(OI)(CI)M' 'LAB\DL_Partage-Compta_RO:(OI)(CI)RX'

# Partage SMB : droits larges côté partage, la sécurité réelle est portée par NTFS
New-SmbShare -Name 'Compta' -Path $path -FullAccess 'LAB\DL_Partage-Compta_RW' -ReadAccess 'LAB\DL_Partage-Compta_RO' -FolderEnumerationMode AccessBased
~~~

\`FolderEnumerationMode AccessBased\` (énumération basée sur l'accès) masque les dossiers auxquels l'utilisateur n'a pas accès : il ne voit que ce qu'il peut ouvrir.

### Étape 4 — Déléguer au support la réinitialisation des mots de passe

Le support N1/N2 doit pouvoir réinitialiser un mot de passe et déverrouiller un compte, **sans** pouvoir modifier les groupes ni créer de comptes :

~~~powershell title="Délégation fine sur l'OU UTILISATEURS"
$ou = 'OU=UTILISATEURS,DC=lab,DC=enzomarechal,DC=fr'
dsacls $ou /I:S /G 'LAB\GG_Support_T2:CA;Reset Password;user'
dsacls $ou /I:S /G 'LAB\GG_Support_T2:RPWP;pwdLastSet;user'
dsacls $ou /I:S /G 'LAB\GG_Support_T2:RPWP;lockoutTime;user'
~~~

| Droit | Effet |
|-------|-------|
| \`CA;Reset Password\` | Droit étendu de **réinitialisation** (sans connaître l'ancien mot de passe) |
| \`RPWP;pwdLastSet\` | Cocher « l'utilisateur doit changer son mot de passe » |
| \`RPWP;lockoutTime\` | Déverrouiller un compte |

> [!WARN] Jamais sur les comptes d'administration
> La délégation porte sur \`OU=UTILISATEURS\` uniquement. Les comptes \`adm-t*\` sont dans \`OU=_ADMIN\` : le support ne peut pas réinitialiser le mot de passe d'un administrateur, ce qui empêcherait une élévation de privilèges ([proc-017](#wiki/proc-017)).

### Étape 5 — Audit des ACL hors modèle

~~~powershell title="Trouver les ACL qui ne respectent pas AGDLP"
$autorises = '^(NT AUTHORITY\\SYSTEM|BUILTIN\\Administrateurs|CREATEUR PROPRIETAIRE|LAB\\DL_.+)$'
Get-ChildItem 'D:\Partages' -Directory -Recurse -Depth 2 | ForEach-Object {
    $dossier = $_.FullName
    (Get-Acl $dossier).Access |
        Where-Object { -not $_.IsInherited -and $_.IdentityReference.Value -notmatch $autorises } |
        ForEach-Object {
            [pscustomobject]@{ Dossier = $dossier; Identite = $_.IdentityReference; Droits = $_.FileSystemRights }
        }
} | Export-Csv 'C:\Admin\Audit\acl-hors-modele.csv' -NoTypeInformation -Encoding UTF8 -Delimiter ';'
~~~

Toute ligne de ce rapport est une exception à justifier ou à corriger : un utilisateur nommé, le groupe *Tout le monde*, un groupe global posé directement sur un dossier.

## Validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Import du CSV en \`-WhatIf\` | Aucune création | OK |
| T2 | Import réel | 4 comptes dans les bonnes OU et groupes | OK |
| T3 | \`e.martin\` (support) réinitialise le mot de passe de \`m.durand\` | Autorisé | OK |
| T4 | \`e.martin\` ajoute \`m.durand\` à un groupe | Refusé | « Accès refusé » |
| T5 | \`e.martin\` réinitialise le mot de passe de \`adm-t1-enzo\` | Refusé | « Accès refusé » |
| T6 | \`l.martin\` ouvre \`\\SRV-FIC\Compta\` | Modification possible | OK |
| T7 | Un utilisateur de Production liste les partages | Ne voit pas *Compta* | Masqué (ABE) |

~~~terminal title="Vérification de l'imbrication des groupes"
PS C:\> Get-ADGroupMember 'DL_Partage-Compta_RW' -Recursive | Select-Object SamAccountName
SamAccountName
--------------
m.durand
l.martin
~~~

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Accès refusé juste après l'ajout au groupe | Le jeton Kerberos de l'utilisateur ne contient pas encore le groupe | Fermer et rouvrir la session (ou \`klist purge\`) |
| \`Add-ADGroupMember\` : étendue incompatible | Ajout d'un DL dans un GG | Respecter le sens : GG → DL |
| Délégation sans effet | Héritage \`/I:S\` absent ou mauvaise classe d'objet | \`dsacls $ou\` pour afficher les ACE |
| Accents corrompus dans les comptes | CSV enregistré en ANSI | Enregistrer le CSV en UTF-8 |

## Pour aller plus loin

- Mots de passe des administrateurs locaux : [proc-015 — Windows LAPS](#wiki/proc-015)
- Séparation des comptes d'administration : [proc-017](#wiki/proc-017)
`
  });

  /* ========================================================================
     PROC-015 — WINDOWS LAPS
     ======================================================================== */
  LIST.push({
    id: 'proc-015',
    title: 'Déployer Windows LAPS : mots de passe administrateur locaux uniques',
    category: 'Sécurité',
    techs: ['ad', 'gpo', 'windows', 'powershell'],
    level: 'Intermédiaire',
    date: '2026-03-07',
    project: 'ad-gpo',
    summary: "Supprimer le mot de passe administrateur local identique sur tout le parc : extension du schéma, droits par OU, GPO de configuration (longueur, rotation, chiffrement, actions après usage), consultation par le support et sauvegarde du mot de passe DSRM des contrôleurs.",
    env: { 'Prérequis système': 'Windows 10/11 et Server 2019+ avec mises à jour d’avril 2023', 'Niveau fonctionnel': '2016 (pour le chiffrement)', 'Cible': 'OU POSTES et SERVEURS' },
    content: md`
## Contexte

Les postes déployés à partir d'une même image partagent souvent le **même mot de passe administrateur local**. Un attaquant qui le récupère sur une seule machine (dans un script, une sauvegarde, une mémoire) peut se connecter à **toutes** les autres : c'est le mouvement latéral le plus simple qui soit (*pass-the-hash*).

**Windows LAPS**, intégré à Windows depuis avril 2023, génère un mot de passe **aléatoire et unique** par machine, le change automatiquement et le stocke dans l'AD, lisible uniquement par les personnes autorisées.

## Fonctionnement

~~~ascii title="Cycle de vie du mot de passe"
  Poste PC-BUR-014                       Active Directory                   Support N2
  ────────────────                       ────────────────                   ──────────
  1. GPO : longueur 20, rotation 30 j
  2. génère un mot de passe aléatoire
  3. l'écrit (chiffré) sur son objet ──►  msLAPS-EncryptedPassword
     ordinateur                            msLAPS-PasswordExpirationTime
                                                       ▲
                                                       │ lecture autorisée
                                                       └──────────────────── Get-LapsADPassword
  4. après usage du compte : nouveau mot de passe + fermeture de session (post-authentification)
~~~

## Prérequis

- [ ] Postes et serveurs à jour (Windows LAPS intégré depuis la mise à jour cumulative d'avril 2023)
- [ ] Niveau fonctionnel du domaine **2016** pour le chiffrement des mots de passe
- [ ] Compte membre de *Administrateurs du schéma* pour l'étape 1 (une seule fois)
- [ ] Ancien LAPS (« legacy », extension CSE) désinstallé, ou mode d'émulation assumé

## Mise en œuvre

### Étape 1 — Étendre le schéma

~~~powershell title="Sur un DC, avec un compte Administrateurs du schéma"
Update-LapsADSchema -Verbose
~~~

Cela ajoute à la classe *ordinateur* les attributs \`msLAPS-Password\`, \`msLAPS-EncryptedPassword\`, \`msLAPS-PasswordExpirationTime\` et leurs équivalents pour le mot de passe DSRM.

### Étape 2 — Droits

~~~powershell title="Autoriser les machines à écrire leur mot de passe, le support à le lire"
$postes   = 'OU=POSTES,DC=lab,DC=enzomarechal,DC=fr'
$serveurs = 'OU=SERVEURS,DC=lab,DC=enzomarechal,DC=fr'

Set-LapsADComputerSelfPermission -Identity $postes
Set-LapsADComputerSelfPermission -Identity $serveurs

# Lecture : support tier 2 pour les postes, administrateurs tier 1 pour les serveurs
Set-LapsADReadPasswordPermission  -Identity $postes   -AllowedPrincipals 'LAB\GG_Support_T2'
Set-LapsADResetPasswordPermission -Identity $postes   -AllowedPrincipals 'LAB\GG_Support_T2'
Set-LapsADReadPasswordPermission  -Identity $serveurs -AllowedPrincipals 'LAB\GG_Admins_T1'
Set-LapsADResetPasswordPermission -Identity $serveurs -AllowedPrincipals 'LAB\GG_Admins_T1'

# Contrôle : qui peut lire les mots de passe sur ces OU ?
Find-LapsADExtendedRights -Identity $postes
~~~

> [!SEC] Droits étendus « Tous les droits étendus »
> Un groupe disposant de *Tous les droits étendus* ou du *Contrôle total* sur l'OU peut aussi lire les mots de passe. \`Find-LapsADExtendedRights\` liste ces groupes : la liste doit se limiter aux groupes prévus et aux administrateurs du domaine.

### Étape 3 — GPO de configuration

GPO \`C_Postes_LAPS\` liée à l'OU POSTES (et une GPO équivalente pour SERVEURS). Chemin : *Configuration ordinateur › Stratégies › Modèles d'administration › Système › LAPS*.

| Paramètre | Valeur | Pourquoi |
|-----------|--------|----------|
| Configurer le répertoire de sauvegarde des mots de passe | **Active Directory** | — |
| Paramètres de mot de passe | Complexité : majuscules + minuscules + chiffres + caractères spéciaux · Longueur : **20** · Âge : **30 jours** | — |
| Activer le chiffrement du mot de passe | Activé | Le mot de passe n'est pas lisible en clair dans l'AD, même par un administrateur qui n'est pas autorisé |
| Configurer les déchiffreurs de mots de passe autorisés | \`LAB\GG_Support_T2\` | — |
| Ne pas autoriser un délai d'expiration supérieur à celui défini | Activé | Empêche de repousser indéfiniment la rotation |
| Actions post-authentification | **Réinitialiser le mot de passe et fermer la session**, délai de grâce 8 h | Un mot de passe consulté et utilisé ne reste pas valide |

Par défaut, LAPS gère le compte administrateur **intégré** (RID 500), quel que soit son nom (« Administrateur » sur un système français). Pour gérer un compte personnalisé, renseigner *Nom du compte administrateur à gérer* et créer ce compte par préférence de stratégie de groupe.

### Étape 4 — Mot de passe DSRM des contrôleurs de domaine

GPO liée à l'OU *Domain Controllers* : *Activer la sauvegarde du mot de passe pour les comptes DSRM* = **Activé**. Le mot de passe de restauration des services d'annuaire, rarement changé et souvent oublié, est alors lui aussi géré, renouvelé et sauvegardé (chiffré) dans l'AD.

### Étape 5 — Forcer l'application sur un poste de test

~~~terminal title="PC-BUR-014"
PS C:\> gpupdate /force
La mise à jour de la stratégie d'ordinateur s'est terminée sans erreur.
PS C:\> Invoke-LapsPolicyProcessing
PS C:\> Get-WinEvent -LogName 'Microsoft-Windows-LAPS/Operational' -MaxEvents 3 | Format-Table TimeCreated, Id, Message -Wrap
TimeCreated          Id    Message
-----------          --    -------
07/03/2026 10:14:02  10004 Le traitement de la stratégie LAPS a réussi.
07/03/2026 10:14:02  10018 LAPS a correctement mis à jour Active Directory avec le nouveau mot de passe.
07/03/2026 10:14:01  10003 Démarrage du traitement de la stratégie LAPS.
~~~

## Utilisation par le support

~~~terminal title="Consultation et rotation anticipée"
PS C:\> Get-LapsADPassword -Identity PC-BUR-014 -AsPlainText
ComputerName        : PC-BUR-014
DistinguishedName   : CN=PC-BUR-014,OU=Bureautique,OU=POSTES,DC=lab,DC=enzomarechal,DC=fr
Account             : Administrateur
Password            : 7hQ!vR2#mZ9@pL4&wK8s
PasswordUpdateTime  : 07/03/2026 10:14:02
ExpirationTimestamp : 06/04/2026 10:14:02
Source              : EncryptedPassword
DecryptionStatus    : Success
AuthorizedDecryptor : LAB\GG_Support_T2
PS C:\> Set-LapsADPasswordExpirationTime -Identity PC-BUR-014
~~~

La dernière commande force un **nouveau** mot de passe au prochain cycle de traitement du poste : utile après une intervention où le mot de passe a été communiqué à un tiers.

## Validation

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Mot de passe de PC-BUR-014 et PC-BUR-015 | Différents | OK |
| T2 | Lecture par un utilisateur standard | Refus | \`DecryptionStatus : Unauthorized\` |
| T3 | Lecture par \`GG_Support_T2\` | Mot de passe affiché | OK |
| T4 | Ouverture de session avec le compte puis attente de 8 h | Session fermée, mot de passe changé | OK |
| T5 | Poste hors réseau pendant 45 jours | Rotation à la reconnexion | OK |
| T6 | Couverture du parc | 100 % des postes avec un mot de passe LAPS | Rapport ci-dessous |

~~~powershell title="Rapport de couverture"
Get-ADComputer -SearchBase 'OU=POSTES,DC=lab,DC=enzomarechal,DC=fr' -Filter * -Properties 'msLAPS-PasswordExpirationTime', OperatingSystem |
    Select-Object Name, OperatingSystem,
        @{ n = 'LAPS'; e = { if ($_.'msLAPS-PasswordExpirationTime') { 'OK' } else { 'ABSENT' } } } |
    Sort-Object LAPS | Format-Table -AutoSize
~~~

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Événement « accès refusé » à l'écriture | \`Set-LapsADComputerSelfPermission\` non appliqué sur l'OU du poste | Appliquer sur l'OU (héritage vers les sous-OU) |
| Aucun événement LAPS | Système non à jour | Installer la mise à jour cumulative |
| \`DecryptionStatus : Unauthorized\` pour le support | Groupe absent des déchiffreurs autorisés | Paramètre GPO « déchiffreurs autorisés » |
| Conflit avec l'ancien LAPS | Extension CSE legacy encore installée | Désinstaller l'ancien agent, ou configurer le mode d'émulation |

## Procédure d'intervention pour le support

1. Ouvrir le ticket GLPI de l'intervention (la consultation du mot de passe y est justifiée).
2. Lire le mot de passe : \`Get-LapsADPassword -Identity <poste> -AsPlainText\` (ou onglet *LAPS* de la console AD).
3. Intervenir sur le poste avec le compte \`.\Administrateur\`.
4. En fin d'intervention, **ne rien faire** : le mot de passe est changé automatiquement et la session fermée après le délai de grâce.
5. Si le mot de passe a été communiqué à un tiers (prestataire, éditeur) : \`Set-LapsADPasswordExpirationTime -Identity <poste>\` pour forcer une rotation immédiate.

> [!TIP] Traçabilité des consultations
> L'audit de l'accès aux objets du service d'annuaire (événement **4662** sur les DC, attribut \`msLAPS-EncryptedPassword\`) permet de savoir **qui** a lu le mot de passe de **quel** poste. Ces événements sont remontés dans Wazuh.

## Retour arrière

Délier la GPO : le mot de passe local reste celui de la dernière rotation (il ne revient pas à l'ancien mot de passe commun). Il reste lisible dans l'AD tant que les attributs ne sont pas effacés.

## Pour aller plus loin

- Durcissement réseau complémentaire : [proc-016](#wiki/proc-016)
- Isolation des comptes d'administration : [proc-017](#wiki/proc-017)
`
  });

  /* ========================================================================
     PROC-016 — GPO DE DURCISSEMENT RÉSEAU
     ======================================================================== */
  LIST.push({
    id: 'proc-016',
    title: 'GPO de durcissement réseau : LLMNR, NetBIOS, SMB, NTLM et LDAP',
    category: 'Sécurité',
    techs: ['gpo', 'ad', 'windows'],
    level: 'Avancé',
    date: '2026-03-21',
    project: 'ad-gpo',
    summary: "Neutraliser les vecteurs d'attaque réseau les plus exploités dans un domaine Windows (empoisonnement LLMNR/NBT-NS, relais NTLM, SMBv1, LDAP non signé) avec une démarche audit → pilote → généralisation pour ne rien casser.",
    env: { 'Domaine': 'lab.enzomarechal.fr (niveau 2016)', 'GPO': 'C_Tous_Durcissement-Reseau, C_DC_Durcissement', 'Outil de test': 'Responder (mode analyse, homelab)' },
    content: md`
## Contexte

Lors d'un test d'intrusion interne, les premières minutes suffisent souvent à récupérer des empreintes de mots de passe sans exploiter la moindre faille logicielle, uniquement grâce à des protocoles **activés par défaut** :

| Protocole | Comportement par défaut | Exploitation |
|-----------|-------------------------|--------------|
| **LLMNR / NBT-NS / mDNS** | Si le DNS ne connaît pas un nom, Windows le demande à tout le réseau local | L'attaquant répond « c'est moi » et reçoit l'authentification NTLM du poste |
| **NTLM** sans signature | Une authentification peut être relayée vers un autre serveur | *Relais NTLM* : l'attaquant s'authentifie à la place de la victime |
| **SMBv1** | Protocole de 1990, sans protections modernes | WannaCry, EternalBlue |
| **LDAP** sans signature | Les liaisons LDAP peuvent être interceptées et relayées | Modification de l'annuaire avec les droits de la victime |

## Démarche en trois temps

> [!WARN] Ne jamais tout appliquer d'un coup
> Chacune de ces mesures peut casser une application ancienne (copieur, logiciel métier, NAS). La démarche est toujours : **auditer** → appliquer sur une OU **pilote** → **généraliser**.

| Phase | Durée | Action |
|-------|-------|--------|
| 1. Audit | 2 à 3 semaines | Activer la journalisation (NTLM, LDAP non signé, SMBv1) sans rien bloquer |
| 2. Pilote | 1 semaine | GPO liée à une OU de postes pilotes (service informatique) |
| 3. Généralisation | — | Liaison aux OU POSTES et SERVEURS, exceptions documentées |

## Prérequis

- [ ] Modèles d'administration **MS Security Guide** importés dans le magasin central (Security Compliance Toolkit)
- [ ] OU pilote créée : \`OU=Pilote,OU=POSTES\`
- [ ] Wazuh opérationnel pour collecter les journaux d'audit

## Mise en œuvre

### Étape 1 — Magasin central des modèles d'administration

~~~powershell title="Copier les ADMX dans le magasin central (une fois)"
$central = '\\lab.enzomarechal.fr\SYSVOL\lab.enzomarechal.fr\Policies\PolicyDefinitions'
New-Item -ItemType Directory -Path $central -Force | Out-Null
Copy-Item 'C:\Windows\PolicyDefinitions\*' $central -Recurse -Force
# Modèles du Security Compliance Toolkit
Copy-Item 'C:\Sources\SCT\Templates\SecGuide.admx' $central
Copy-Item 'C:\Sources\SCT\Templates\fr-FR\SecGuide.adml' "$central\fr-FR"
~~~

### Étape 2 — Phase d'audit

| Mesure auditée | Paramètre | Où lire le résultat |
|----------------|-----------|---------------------|
| Usage de NTLM | *Sécurité réseau : restreindre NTLM : auditer le trafic NTLM entrant* = Activer l'audit pour tous les comptes | Journal *Microsoft › Windows › NTLM › Operational* |
| LDAP non signé | Clé \`HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics\16 LDAP Interface Events\` = \`2\` sur les DC | Événement **2889** (client et compte concernés) |
| SMBv1 | \`Set-SmbServerConfiguration -AuditSmb1Access $true\` | Journal *SMBServer › Audit*, événement 3000 |

~~~powershell title="Synthèse des clients LDAP non signés (après 2 semaines)"
Get-WinEvent -ComputerName DC01 -FilterHashtable @{ LogName = 'Directory Service'; Id = 2889 } |
    ForEach-Object { ([xml]$_.ToXml()).Event.EventData.Data[0] } |
    Group-Object | Sort-Object Count -Descending | Select-Object Count, Name
~~~

### Étape 3 — GPO « C_Tous_Durcissement-Reseau »

*Configuration ordinateur › Stratégies* :

| Chemin | Paramètre | Valeur |
|--------|-----------|--------|
| Modèles d'administration › Réseau › Client DNS | Désactiver la résolution de noms multidiffusion | **Activé** (LLMNR désactivé) |
| Modèles d'administration › MS Security Guide | Configure SMB v1 server | **Désactivé** |
| Modèles d'administration › MS Security Guide | Configure SMB v1 client driver | **Disable driver** |
| Paramètres de sécurité › Options de sécurité | Client réseau Microsoft : communications signées numériquement (toujours) | **Activé** |
| Paramètres de sécurité › Options de sécurité | Serveur réseau Microsoft : communications signées numériquement (toujours) | **Activé** |
| Paramètres de sécurité › Options de sécurité | Sécurité réseau : niveau d'authentification LAN Manager | **Envoyer uniquement des réponses NTLMv2. Refuser LM et NTLM** |
| Paramètres de sécurité › Options de sécurité | Accès réseau : ne pas autoriser l'énumération anonyme des comptes et partages SAM | **Activé** |
| Paramètres de sécurité › Options de sécurité | Sécurité réseau : ne pas stocker de valeurs de hachage de niveau LAN Manager | **Activé** |

Désactivation de **mDNS** par préférence de registre (*Préférences › Paramètres Windows › Registre*) :

~~~ini title="Préférence de registre (mDNS)"
Action  = Mettre à jour
Ruche   = HKEY_LOCAL_MACHINE
Clé     = SYSTEM\CurrentControlSet\Services\Dnscache\Parameters
Valeur  = EnableMDNS
Type    = REG_DWORD
Données = 0
~~~

### Étape 4 — NetBIOS sur TCP/IP

NetBIOS ne se désactive pas par une simple GPO. Deux mécanismes complémentaires :

- **Postes en DHCP** : option 001 de la classe *Microsoft Windows Options* = \`2\` ([proc-013](#wiki/proc-013)).
- **Adresses fixes** (serveurs) : script de démarrage.

~~~powershell title="\\lab.enzomarechal.fr\NETLOGON\Scripts\Disable-NetBIOS.ps1"
# 2 = désactiver NetBIOS sur TCP/IP pour chaque carte IP active
Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter 'IPEnabled = True' |
    ForEach-Object {
        $r = Invoke-CimMethod -InputObject $_ -MethodName SetTcpipNetbios -Arguments @{ TcpipNetbiosOptions = [uint32]2 }
        if ($r.ReturnValue -ne 0) {
            Write-EventLog -LogName Application -Source 'WSH' -EventId 4 -EntryType Warning \`
                -Message "NetBIOS : échec sur $($_.Description) (code $($r.ReturnValue))"
        }
    }
~~~

### Étape 5 — WPAD

Un poste qui cherche automatiquement un proxy demande le nom \`wpad\`. Si personne ne répond par DNS, l'attaquant peut répondre à sa place. La **liste de blocage globale** du DNS Windows contient \`wpad\` par défaut : on vérifie qu'elle est bien active.

~~~terminal title="DC01"
PS C:\> Get-DnsServerGlobalQueryBlockList
Enable : True
List   : {wpad, isatap}
~~~

### Étape 6 — GPO « C_DC_Durcissement » (contrôleurs de domaine)

| Paramètre | Valeur |
|-----------|--------|
| Contrôleur de domaine : conditions requises pour la signature de serveur LDAP | **Exiger la signature** |
| Contrôleur de domaine : exigences de jeton de liaison de canal du serveur LDAP | **Toujours** |
| Services système › Spouleur d'impression | **Désactivé** (aucune impression depuis un DC ; neutralise PrintNightmare et la coercition d'authentification) |

## Validation

~~~terminal title="Poste pilote — vérifications"
PS C:\> gpresult /r /scope computer | Select-String "C_Tous_Durcissement"
        C_Tous_Durcissement-Reseau
PS C:\> Get-ItemPropertyValue 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' -Name EnableMulticast
0
PS C:\> Get-SmbClientConfiguration | Select-Object RequireSecuritySignature
RequireSecuritySignature
------------------------
                    True
PS C:\> Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol | Select-Object State
State
-----
Disabled
~~~

Test d'attaque **dans le homelab uniquement**, avec Responder en mode analyse (il écoute sans répondre) pendant une heure de travail normal sur le VLAN des postes :

~~~terminal title="Machine de test (VLAN 60) — avant et après la GPO"
root@kali:~# responder -I eth0 -A
[Analyze mode: LLMNR] Request by 10.10.60.123 for srv-fichiers, ignoring
[Analyze mode: NBT-NS] Request by 10.10.60.131 for IMPRIMANTE-RDC, ignoring
[Analyze mode: MDNS] Request by 10.10.60.123 for srv-fichiers.local, ignoring
root@kali:~# responder -I eth0 -A
[+] Listening for events...
~~~

Avant la GPO, les postes diffusent leurs requêtes de noms à tout le réseau ; après, plus **aucune** requête n'est observée en une heure.

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Requêtes LLMNR / NBT-NS / mDNS observées en 1 h | 0 | 0 |
| T2 | Connexion SMB non signée vers un serveur | Refusée | OK |
| T3 | Liaison LDAP simple non signée vers DC01 (\`ldp.exe\`) | Refusée | « Strong authentication required » |
| T4 | Applications métier du pilote | Fonctionnelles | 1 exception (copieur), documentée |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Le copieur ne scanne plus vers le partage | Pas de support de la signature SMB / de SMB2 | Mise à jour du micrologiciel, ou serveur de numérisation dédié en exception documentée |
| Application qui ne s'authentifie plus | Utilisation de NTLMv1 | Journal NTLM (phase d'audit), mise à jour de l'application |
| Outil de supervision LDAP en échec | Liaison simple sur le port 389 | Passer en LDAPS (636) avec le certificat du DC ([proc-019](#wiki/proc-019)) |
| Paramètre non appliqué | ADMX absent du magasin central | Étape 1 |

## Retour arrière

Délier la GPO de l'OU (sans la supprimer) puis \`gpupdate /force\` sur les postes. Les paramètres de sécurité sont retirés à la prochaine application des stratégies.

## Pour aller plus loin

- Protection des comptes d'administration : [proc-017](#wiki/proc-017)
- Le projet : [Active Directory & durcissement GPO](#projet/ad-gpo)
`
  });

  /* ========================================================================
     PROC-017 — MODÈLE EN TIERS ET PROTECTED USERS
     ======================================================================== */
  LIST.push({
    id: 'proc-017',
    title: "Modèle d'administration en tiers et groupe Protected Users",
    category: 'Sécurité',
    techs: ['ad', 'gpo', 'powershell', 'windows'],
    level: 'Expert',
    date: '2026-04-25',
    project: 'ad-gpo',
    summary: "Empêcher qu'un poste compromis donne les clés du domaine : comptes d'administration séparés par niveau, interdiction d'ouverture de session croisée par GPO, Protected Users, comptes non délégables, nettoyage d'adminCount et pistes vers les silos d'authentification.",
    env: { 'Domaine': 'lab.enzomarechal.fr (niveau 2016)', 'Postes d’administration': 'PAW dédiés (OU _ADMIN/PAW)', 'Prérequis': 'proc-014, proc-015' },
    content: md`
## Contexte

Le scénario d'attaque le plus courant contre un Active Directory n'exploite aucune faille : un administrateur du domaine ouvre une session sur un poste utilisateur compromis pour dépanner. Ses identifiants restent en mémoire (ticket Kerberos, empreinte NTLM) et l'attaquant les récupère. **Un seul dépannage suffit à perdre tout le domaine.**

Le modèle en **tiers** découpe l'environnement en niveaux de confiance et interdit qu'un compte d'un niveau élevé s'expose sur un niveau inférieur.

## Les trois niveaux

~~~ascii title="Règle : on ne descend jamais"
  ┌────────────────────────────────────────────────────────────┐
  │ TIER 0 — Contrôle du domaine                               │
  │ DC01, DC02, PKI-CA, PAW tier 0 · comptes adm-t0-*          │
  └──────────────────────────────┬─────────────────────────────┘
                 ✕ adm-t0 ne se connecte jamais plus bas
  ┌──────────────────────────────▼─────────────────────────────┐
  │ TIER 1 — Serveurs et applications                          │
  │ GLPI, ZABBIX, WSUS, WDS-MDT… · comptes adm-t1-*            │
  └──────────────────────────────┬─────────────────────────────┘
                 ✕ adm-t1 ne se connecte jamais sur un poste
  ┌──────────────────────────────▼─────────────────────────────┐
  │ TIER 2 — Postes de travail et utilisateurs                 │
  │ PC-*, imprimantes · comptes adm-t2-* (support)             │
  └────────────────────────────────────────────────────────────┘
~~~

Chaque administrateur dispose donc de **plusieurs comptes** : \`enzo\` (messagerie, navigation, jamais administrateur), \`adm-t2-enzo\` (support des postes), \`adm-t1-enzo\` (serveurs), \`adm-t0-enzo\` (domaine, utilisé uniquement depuis un PAW).

## Prérequis

- [ ] Arborescence \`OU=_ADMIN\` avec \`Comptes-T0/T1/T2\`, \`Groupes-Admin\`, \`PAW\`
- [ ] LAPS déployé ([proc-015](#wiki/proc-015)) : le support n'utilise plus de compte du domaine pour les tâches locales
- [ ] Au moins un poste d'administration dédié (PAW) pour le tier 0
- [ ] Compte de secours (*break glass*) documenté et testé

## Mise en œuvre

### Étape 1 — Groupes et comptes

~~~powershell title="Création des groupes et des comptes d'administration"
$ouGroupes = 'OU=Groupes-Admin,OU=_ADMIN,DC=lab,DC=enzomarechal,DC=fr'
foreach ($t in 0, 1, 2) {
    New-ADGroup -Name "GG_Admins_T$t" -GroupScope Global -GroupCategory Security -Path $ouGroupes \`
        -Description "Administrateurs du tier $t"
}

function New-AdminAccount([string]$Prenom, [string]$Login, [int]$Tier) {
    $sam = "adm-t$Tier-$Login"
    New-ADUser -Name $sam -SamAccountName $sam -UserPrincipalName "$sam@lab.enzomarechal.fr" \`
        -DisplayName "$Prenom (admin tier $Tier)" \`
        -Path "OU=Comptes-T$Tier,OU=_ADMIN,DC=lab,DC=enzomarechal,DC=fr" \`
        -AccountPassword (Read-Host -AsSecureString "Mot de passe de $sam") -Enabled $true \`
        -AccountNotDelegated $true -Description "Compte d'administration tier $Tier"
    Add-ADGroupMember -Identity "GG_Admins_T$Tier" -Members $sam
}

New-AdminAccount -Prenom 'Enzo' -Login 'enzo' -Tier 0
New-AdminAccount -Prenom 'Enzo' -Login 'enzo' -Tier 1
New-AdminAccount -Prenom 'Enzo' -Login 'enzo' -Tier 2

# Les droits du tier 0 passent par les groupes intégrés, via le groupe du tier
Add-ADGroupMember -Identity 'Admins du domaine' -Members 'GG_Admins_T0'
~~~

\`-AccountNotDelegated $true\` coche « *Le compte est sensible et ne peut pas être délégué* » : aucun serveur configuré en délégation Kerberos ne pourra se faire passer pour ce compte.

### Étape 2 — Protected Users pour le tier 0

~~~powershell title="Ajout des comptes tier 0 au groupe Protected Users"
Get-ADUser -SearchBase 'OU=Comptes-T0,OU=_ADMIN,DC=lab,DC=enzomarechal,DC=fr' -Filter * |
    ForEach-Object { Add-ADGroupMember -Identity 'Protected Users' -Members $_ }
~~~

| Protection | Effet |
|------------|-------|
| Pas d'authentification NTLM | Impossible de relayer ou de « passer » l'empreinte du compte |
| Kerberos en AES uniquement | Plus de RC4, plus d'attaque par empreinte NTLM sur Kerberos |
| Pas de mise en cache des identifiants | Aucune trace exploitable après déconnexion |
| Pas de délégation | Même effet que *AccountNotDelegated* |
| TGT de 4 heures, non renouvelable | Un ticket volé expire rapidement |

> [!DANGER] Jamais de compte de service dans Protected Users
> Un compte de service qui dépend de NTLM ou de la délégation cesse immédiatement de fonctionner. Ne jamais y placer non plus le compte de secours : il doit pouvoir ouvrir une session même si Kerberos est indisponible.

### Étape 3 — Interdire l'ouverture de session croisée

Une GPO par cible, dans *Configuration ordinateur › Stratégies › Paramètres Windows › Paramètres de sécurité › Stratégies locales › Attribution des droits utilisateur* :

| GPO | Liée à | « Interdire l'ouverture d'une session locale » et « … par les services Bureau à distance » | « Interdire l'accès à cet ordinateur à partir du réseau » |
|-----|--------|------------------------------------------------|-------------------------------------------|
| \`C_T2_Isolation\` | OU POSTES | \`GG_Admins_T0\`, \`GG_Admins_T1\` | \`GG_Admins_T0\` |
| \`C_T1_Isolation\` | OU SERVEURS | \`GG_Admins_T0\`, \`GG_Admins_T2\` | \`GG_Admins_T2\` |
| \`C_T0_Isolation\` | OU Domain Controllers, PKI | \`GG_Admins_T1\`, \`GG_Admins_T2\` | \`GG_Admins_T1\`, \`GG_Admins_T2\` |

Et pour les PAW, l'inverse : seuls \`GG_Admins_T0\` peuvent y ouvrir une session.

> [!INFO] Pourquoi interdire aussi le tier 0 sur les serveurs ?
> Un serveur applicatif (tier 1) compromis exposerait les identifiants d'un administrateur du domaine qui s'y connecte. Le tier 0 n'administre les serveurs qu'**à distance**, par des outils qui n'exposent pas d'identifiants réutilisables (PowerShell à distance avec Kerberos, consoles MMC).

### Étape 4 — Nettoyer adminCount

Les comptes ayant été membres d'un groupe privilégié gardent l'attribut \`adminCount = 1\` et des ACL figées (mécanisme *AdminSDHolder*), même après leur retrait du groupe :

~~~powershell title="Comptes marqués adminCount mais plus privilégiés"
$privileges = 'Admins du domaine', 'Administrateurs de l’entreprise', 'Administrateurs du schéma', 'Administrateurs',
              'Opérateurs de compte', 'Opérateurs de serveur', 'Opérateurs de sauvegarde', 'Opérateurs d’impression'
$membres = $privileges | ForEach-Object { Get-ADGroupMember $_ -Recursive -ErrorAction SilentlyContinue } |
           Select-Object -ExpandProperty SamAccountName -Unique

Get-ADUser -Filter 'adminCount -eq 1' -Properties adminCount |
    Where-Object { $_.SamAccountName -notin $membres -and $_.SamAccountName -ne 'krbtgt' } |
    Select-Object SamAccountName, DistinguishedName
~~~

Pour chaque compte listé : remettre \`adminCount\` à 0 et réactiver l'héritage des permissions sur l'objet (onglet *Sécurité › Avancé*).

### Étape 5 — Vider les groupes privilégiés intégrés

| Groupe | État cible |
|--------|-----------|
| Administrateurs de l'entreprise | Vide (ajout temporaire uniquement pour une opération de forêt) |
| Administrateurs du schéma | Vide (ajout temporaire pour une extension de schéma) |
| Admins du domaine | \`GG_Admins_T0\` + compte de secours |
| Opérateurs de compte / serveur / sauvegarde / impression | Vides |

## Validation

~~~terminal title="PC-BUR-014 — tentative d'ouverture de session d'un compte tier 0"
PS C:\> runas /user:LAB\adm-t0-enzo cmd
Entrez le mot de passe de LAB\adm-t0-enzo :
Tentative de lancement de cmd en tant qu'utilisateur "LAB\adm-t0-enzo"...
RUNAS ERREUR : impossible d'exécuter - cmd
1385 : Échec d'ouverture de session : l'utilisateur ne dispose pas du type d'ouverture de session demandé sur cet ordinateur.
~~~

~~~terminal title="PAW-T0-01 — ticket Kerberos d'un membre de Protected Users"
PS C:\> klist | Select-String "Client|Server|Type|Heure"
#0>	Client : adm-t0-enzo @ LAB.ENZOMARECHAL.FR
	Serveur : krbtgt/LAB.ENZOMARECHAL.FR @ LAB.ENZOMARECHAL.FR
	Type de chiffrement KerbTicket : AES-256-CTS-HMAC-SHA1-96
	Heure de démarrage : 4/25/2026 9:02:11 (local)
	Heure de fin :   4/25/2026 13:02:11 (local)
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | \`adm-t0-enzo\` sur un poste (local et RDP) | Refus | Erreur 1385 |
| T2 | \`adm-t1-enzo\` sur un poste | Refus | Erreur 1385 |
| T3 | \`adm-t2-enzo\` sur un serveur | Refus | Erreur 1385 |
| T4 | \`adm-t0-enzo\` : accès SMB par adresse IP (force NTLM) | Refus | Échec d'authentification (pas de NTLM) |
| T5 | Ticket Kerberos du tier 0 | AES-256, 4 h | OK |
| T6 | Compte de secours sur DC01 en console | Session ouverte | OK |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Un administrateur ne peut plus rien faire | Il utilisait un seul compte pour tout | Accompagnement : quel compte pour quelle tâche, tableau affiché au service |
| Outil d'administration en échec avec un compte Protected Users | L'outil utilise NTLM ou la délégation (CredSSP) | Utiliser Kerberos (nom DNS, pas l'adresse IP) ou un compte tier 1 dédié |
| Compte encore protégé après retrait d'un groupe | \`adminCount\` resté à 1 | Étape 4 |

## Pour aller plus loin

Les **silos de stratégies d'authentification** restreignent techniquement les machines depuis lesquelles un compte peut s'authentifier (par exemple, \`adm-t0-enzo\` uniquement depuis les PAW), au niveau du KDC lui-même :

~~~powershell title="Esquisse d'un silo tier 0 (nécessite la prise en charge des revendications par le KDC)"
New-ADAuthenticationPolicy -Name 'AP-T0' -UserTGTLifetimeMins 240 -Enforce -ProtectedFromAccidentalDeletion $true
New-ADAuthenticationPolicySilo -Name 'SILO-T0' -UserAuthenticationPolicy 'AP-T0' \`
    -ComputerAuthenticationPolicy 'AP-T0' -ServiceAuthenticationPolicy 'AP-T0' -Enforce
Grant-ADAuthenticationPolicySiloAccess -Identity 'SILO-T0' -Account 'adm-t0-enzo'
Set-ADUser 'adm-t0-enzo' -AuthenticationPolicySilo 'SILO-T0'
~~~

- Gestion des mots de passe locaux : [proc-015](#wiki/proc-015)
- Détection des ajouts aux groupes privilégiés : règles Wazuh (proc-050, lot 5)
`
  });

  /* ========================================================================
     PROC-018 — PKI : AUTORITÉ RACINE HORS LIGNE
     ======================================================================== */
  LIST.push({
    id: 'proc-018',
    title: 'PKI : installer une autorité de certification racine hors ligne',
    category: 'Sécurité',
    techs: ['adcs', 'windows', 'powershell'],
    level: 'Expert',
    date: '2026-05-09',
    project: 'pki-8021x',
    summary: "Racine de confiance de l'entreprise : VM isolée hors domaine et sans réseau, CAPolicy.inf, installation, durées et points de distribution, sauvegarde de la clé, publication dans l'AD et cycle de vie (renouvellement semestriel de la CRL).",
    env: { 'Serveur': 'ROOTCA (VM sans carte réseau, groupe de travail)', 'Système': 'Windows Server 2022', 'CA': 'LAB-ROOT-CA · RSA 4096 · 20 ans' },
    content: md`
## Contexte

Une PKI d'entreprise délivre les certificats des serveurs (HTTPS interne, LDAPS), des postes (802.1X, VPN) et parfois des utilisateurs. Toute la confiance repose sur la **clé privée de l'autorité racine** : si elle est compromise, il faut réémettre tous les certificats de l'entreprise.

D'où une architecture à **deux niveaux** : la racine, éteinte et isolée, ne signe qu'une seule chose — l'autorité émettrice — et n'est rallumée que deux fois par an.

## Architecture

~~~ascii title="Hiérarchie à deux niveaux"
   ┌──────────────────────────────┐
   │  LAB-ROOT-CA (ROOTCA)         │  hors ligne · hors domaine · sans réseau
   │  RSA 4096 · SHA-256 · 20 ans  │  CRL publiée tous les 6 mois
   └──────────────┬───────────────┘
                  │ signe (transfert par clé USB)
   ┌──────────────▼───────────────┐
   │  LAB-ISSUING-CA (PKI-CA)      │  en ligne · membre du domaine · 10 ans
   │  10.10.20.15                  │  → proc-019
   └──────────────┬───────────────┘
                  │ délivre
     certificats serveurs, machines (802.1X), VPN…
~~~

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| Validité de la racine | 20 ans | Renouveler une racine impose de redéployer la confiance partout |
| Validité des certificats qu'elle signe | 10 ans | La racine ne signe que l'AC émettrice |
| Période de la CRL | 26 semaines (+ 2 semaines de chevauchement) | Rallumage semestriel seulement |
| Points de distribution | HTTP uniquement | La racine ne connaît pas l'AD ; HTTP est lisible par tous, y compris hors domaine |

## Prérequis

- [ ] VM Windows Server 2022 **sans carte réseau** (ou carte retirée après l'installation des mises à jour)
- [ ] Machine en **groupe de travail** (jamais jointe au domaine)
- [ ] Disque chiffré par BitLocker, mot de passe stocké hors ligne
- [ ] Clé USB dédiée aux transferts, formatée
- [ ] Nom DNS \`pki.lab.enzomarechal.fr\` prévu pour la publication HTTP (alias vers PKI-CA)

## Mise en œuvre

### Étape 1 — Fichier CAPolicy.inf

Ce fichier est lu **pendant** l'installation : il doit exister avant d'installer le rôle.

~~~ini title="C:\Windows\CAPolicy.inf"
[Version]
Signature="$Windows NT$"

[Certsrv_Server]
RenewalKeyLength=4096
RenewalValidityPeriod=Years
RenewalValidityPeriodUnits=20
CRLPeriod=Weeks
CRLPeriodUnits=26
CRLDeltaPeriodUnits=0
LoadDefaultTemplates=0
AlternateSignatureAlgorithm=0

[BasicConstraintsExtension]
PathLength=1
Critical=Yes
~~~

\`PathLength=1\` limite la profondeur de la hiérarchie : la racine peut signer une AC subordonnée, mais celle-ci ne pourra pas en signer une autre.

### Étape 2 — Installation du rôle

~~~powershell title="ROOTCA"
Install-WindowsFeature -Name ADCS-Cert-Authority -IncludeManagementTools

Install-AdcsCertificationAuthority -CAType StandaloneRootCA \`
    -CACommonName 'LAB-ROOT-CA' \`
    -CADistinguishedNameSuffix 'O=Lab Enzo Marechal,C=FR' \`
    -KeyLength 4096 -HashAlgorithmName SHA256 \`
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' \`
    -ValidityPeriod Years -ValidityPeriodUnits 20 -Force
~~~

### Étape 3 — Paramètres de l'autorité

~~~powershell title="Durées, points de distribution, audit"
# Les certificats signés par la racine (l'AC émettrice) sont valables 10 ans
certutil -setreg CA\ValidityPeriodUnits 10
certutil -setreg CA\ValidityPeriod "Years"

# CRL : 26 semaines + 2 semaines de chevauchement
certutil -setreg CA\CRLPeriodUnits 26
certutil -setreg CA\CRLPeriod "Weeks"
certutil -setreg CA\CRLOverlapUnits 2
certutil -setreg CA\CRLOverlapPeriod "Weeks"

# Lien avec l'AD (pour la publication ultérieure)
certutil -setreg CA\DSConfigDN "CN=Configuration,DC=lab,DC=enzomarechal,DC=fr"
certutil -setreg CA\DSDomainDN "DC=lab,DC=enzomarechal,DC=fr"

# Points de distribution (CDP) et accès aux informations de l'autorité (AIA) : fichier local + HTTP
certutil -setreg CA\CRLPublicationURLs "1:C:\Windows\system32\CertSrv\CertEnroll\%3%8%9.crl\n2:http://pki.lab.enzomarechal.fr/CertEnroll/%3%8%9.crl"
certutil -setreg CA\CACertPublicationURLs "1:C:\Windows\system32\CertSrv\CertEnroll\%1_%3%4.crt\n2:http://pki.lab.enzomarechal.fr/CertEnroll/%1_%3%4.crt"

# Journalisation de toutes les opérations de l'autorité
certutil -setreg CA\AuditFilter 127
auditpol /set /subcategory:"Services de certification" /success:enable /failure:enable

Restart-Service certsvc
certutil -crl
~~~

| Variable | Signification |
|----------|--------------|
| \`%1\` | Nom DNS du serveur |
| \`%3\` | Nom de l'autorité (\`LAB-ROOT-CA\`) |
| \`%4\` | Suffixe de renouvellement du certificat |
| \`%8\` | Suffixe de renouvellement de la CRL |
| \`%9\` | Suffixe « + » des CRL delta |
| Préfixe \`1:\` | Publier à cet emplacement |
| Préfixe \`2:\` | Inclure dans l'extension des certificats émis |

> [!DANGER] Une URL mal saisie est définitive
> Les URL CDP et AIA sont **inscrites dans le certificat de l'AC émettrice**. Une faute de frappe découverte après la signature impose de réémettre ce certificat. Vérifiez avec \`certutil -getreg CA\CRLPublicationURLs\` avant l'étape suivante de [proc-019](#wiki/proc-019).

### Étape 4 — Sauvegarde de l'autorité

~~~powershell title="Sauvegarde de la clé et de la base (support externe)"
Backup-CARoleService -Path 'E:\Sauvegarde-ROOTCA' -Password (Read-Host -AsSecureString 'Mot de passe du PFX')
reg export 'HKLM\SYSTEM\CurrentControlSet\Services\CertSvc\Configuration' 'E:\Sauvegarde-ROOTCA\certsvc-config.reg'
Copy-Item 'C:\Windows\CAPolicy.inf' 'E:\Sauvegarde-ROOTCA\'
~~~

Deux copies de cette sauvegarde, sur deux supports, dans deux lieux différents (coffre). Sans elle, la perte de la VM signifie la perte de la racine.

### Étape 5 — Exporter le certificat et la CRL

~~~terminal title="Fichiers à transférer vers le domaine (clé USB)"
PS C:\> Get-ChildItem C:\Windows\System32\CertSrv\CertEnroll
    Répertoire : C:\Windows\System32\CertSrv\CertEnroll
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        09/05/2026     10:42           1364 ROOTCA_LAB-ROOT-CA.crt
-a----        09/05/2026     10:43            762 LAB-ROOT-CA.crl
PS C:\> Copy-Item C:\Windows\System32\CertSrv\CertEnroll\* F:\Transfert\
~~~

### Étape 6 — Publication dans le domaine

Depuis un serveur membre du domaine, avec un compte tier 0 :

~~~powershell title="Publication de la racine et de sa CRL dans l'AD"
certutil -dspublish -f 'F:\Transfert\ROOTCA_LAB-ROOT-CA.crt' RootCA
certutil -dspublish -f 'F:\Transfert\LAB-ROOT-CA.crl' ROOTCA
# Rafraîchissement de la confiance sur un poste de test
gpupdate /force
certutil -pulse
~~~

Tous les ordinateurs du domaine ajoutent alors automatiquement \`LAB-ROOT-CA\` à leurs **autorités de certification racines de confiance**. La CRL est aussi copiée dans le répertoire HTTP \`CertEnroll\` de PKI-CA ([proc-019](#wiki/proc-019)).

### Étape 7 — Éteindre la racine

Une fois l'AC émettrice signée ([proc-019](#wiki/proc-019)), la VM est éteinte. Elle n'est rallumée que pour :

| Opération | Fréquence |
|-----------|-----------|
| Publier une nouvelle CRL | Tous les ~5 mois (avant expiration, grâce au chevauchement) |
| Révoquer l'AC émettrice | En cas de compromission |
| Renouveler l'AC émettrice | Tous les ~8 ans |

Le renouvellement de la CRL est inscrit au calendrier de l'équipe et suivi par un **ticket GLPI récurrent**. Zabbix surveille la date d'expiration de la CRL publiée en HTTP et alerte 30 jours avant.

## Validation

~~~terminal title="Contrôle du certificat racine"
PS C:\> certutil -dump F:\Transfert\ROOTCA_LAB-ROOT-CA.crt | Select-String "Émetteur|Objet|NotAfter|Contraintes|Longueur|Path|Signature"
Émetteur:
    CN=LAB-ROOT-CA, O=Lab Enzo Marechal, C=FR
 NotAfter: 09/05/2046 10:32
Objet:
    CN=LAB-ROOT-CA, O=Lab Enzo Marechal, C=FR
Longueur de la clé publique : 4096 bits
Algorithme de signature :
    1.2.840.113549.1.1.11 sha256RSA
2.5.29.19: Indicateurs = 1(Critique), Longueur = 8
    Contraintes de base
        Type d'objet=Autorité de certification
        Restriction de longueur du chemin d'accès=1
~~~

- [ ] Clé RSA 4096, signature SHA-256, validité 20 ans
- [ ] Contrainte de longueur de chemin = 1, extension critique
- [ ] Certificat présent dans les racines de confiance d'un poste du domaine
- [ ] Sauvegarde vérifiée (restauration testée sur une VM jetable)
- [ ] VM éteinte, sans carte réseau

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| CAPolicy.inf ignoré | Fichier créé après l'installation ou mal nommé (\`.inf.txt\`) | Désinstaller le rôle, corriger, réinstaller |
| La racine n'apparaît pas sur les postes | Publication AD absente ou réplication en cours | \`certutil -viewstore "ldap:///CN=Certification Authorities,CN=Public Key Services,CN=Services,CN=Configuration,DC=lab,DC=enzomarechal,DC=fr"\` |
| « Serveur de révocation hors connexion » sur toute la chaîne | CRL racine expirée | Rallumer ROOTCA, \`certutil -crl\`, republier |

## Pour aller plus loin

- L'autorité émettrice et l'auto-enrollment : [proc-019](#wiki/proc-019)
- Le projet : [PKI AD CS & 802.1X](#projet/pki-8021x)
`
  });

  /* ========================================================================
     PROC-019 — PKI : AUTORITÉ ÉMETTRICE ET AUTO-ENROLLMENT
     ======================================================================== */
  LIST.push({
    id: 'proc-019',
    title: "PKI : autorité émettrice d'entreprise, publication et auto-enrollment",
    category: 'Sécurité',
    techs: ['adcs', 'windows', 'gpo', 'powershell'],
    level: 'Expert',
    date: '2026-05-23',
    project: 'pki-8021x',
    summary: "Installer l'autorité émettrice intégrée à l'AD, la faire signer par la racine hors ligne, publier CRL et certificats en LDAP et HTTP, créer les modèles (serveurs web, machines, NPS) et distribuer automatiquement les certificats par GPO.",
    env: { 'Serveur': 'PKI-CA · 10.10.20.15 (membre du domaine)', 'CA': 'LAB-ISSUING-CA · Enterprise Subordinate', 'Publication': 'LDAP + http://pki.lab.enzomarechal.fr' },
    content: md`
## Contexte

La racine ([proc-018](#wiki/proc-018)) est éteinte. Le travail quotidien est confié à une **autorité émettrice d'entreprise**, intégrée à l'Active Directory, qui :

- délivre automatiquement les certificats aux machines et aux serveurs selon des **modèles** ;
- publie ses listes de révocation (CRL) toutes les semaines, et des CRL **delta** tous les jours ;
- est vérifiable par n'importe quel client grâce aux points de distribution LDAP et HTTP.

## Prérequis

- [ ] Racine \`LAB-ROOT-CA\` installée et publiée dans l'AD ([proc-018](#wiki/proc-018))
- [ ] Serveur PKI-CA membre du domaine, tier 0 (même niveau de protection qu'un DC)
- [ ] Enregistrement DNS : \`pki.lab.enzomarechal.fr\` → CNAME vers \`PKI-CA.lab.enzomarechal.fr\`
- [ ] Compte membre d'*Administrateurs de l'entreprise* (le temps de l'installation uniquement)

## Mise en œuvre

### Étape 1 — Publier la racine sur le serveur web AVANT d'installer l'AC

> [!WARN] Le piège de l'installation
> Au moment d'installer son propre certificat, l'AC émettrice vérifie la **révocation** de toute la chaîne. Si la CRL de la racine n'est pas joignable à l'URL HTTP inscrite dans le certificat, l'installation échoue avec « *Le serveur de révocation est hors connexion* ». Le site HTTP doit donc exister **avant**.

~~~powershell title="PKI-CA — IIS et répertoire de publication"
Install-WindowsFeature Web-Server -IncludeManagementTools
New-Item -ItemType Directory -Path 'C:\Windows\System32\CertSrv\CertEnroll' -Force | Out-Null
Copy-Item 'F:\Transfert\ROOTCA_LAB-ROOT-CA.crt', 'F:\Transfert\LAB-ROOT-CA.crl' 'C:\Windows\System32\CertSrv\CertEnroll\'

New-WebVirtualDirectory -Site 'Default Web Site' -Name 'CertEnroll' -PhysicalPath 'C:\Windows\System32\CertSrv\CertEnroll'
# Autorise le « + » des noms de CRL delta
Set-WebConfigurationProperty -PSPath 'IIS:\Sites\Default Web Site\CertEnroll' \`
    -Filter /system.webServer/security/requestFiltering -Name allowDoubleEscaping -Value $true

Invoke-WebRequest 'http://pki.lab.enzomarechal.fr/CertEnroll/LAB-ROOT-CA.crl' -UseBasicParsing | Select-Object StatusCode
~~~

### Étape 2 — CAPolicy.inf et installation

~~~ini title="C:\Windows\CAPolicy.inf (PKI-CA)"
[Version]
Signature="$Windows NT$"

[Certsrv_Server]
RenewalKeyLength=4096
RenewalValidityPeriod=Years
RenewalValidityPeriodUnits=10
LoadDefaultTemplates=0
AlternateSignatureAlgorithm=0
~~~

\`LoadDefaultTemplates=0\` : aucun modèle n'est publié automatiquement. On publie uniquement ceux dont on a besoin (étape 6).

~~~powershell title="Installation et génération de la requête"
Install-WindowsFeature ADCS-Cert-Authority -IncludeManagementTools
Install-AdcsCertificationAuthority -CAType EnterpriseSubordinateCA \`
    -CACommonName 'LAB-ISSUING-CA' \`
    -CADistinguishedNameSuffix 'O=Lab Enzo Marechal,C=FR' \`
    -KeyLength 4096 -HashAlgorithmName SHA256 \`
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' \`
    -OutputCertRequestFile 'C:\PKI\LAB-ISSUING-CA.req' -Force
~~~

### Étape 3 — Signature par la racine

La requête est copiée sur la clé USB, la VM ROOTCA est allumée :

~~~terminal title="ROOTCA — signature de la requête"
PS C:\> certreq -submit F:\Transfert\LAB-ISSUING-CA.req
Autorité de certification active : ROOTCA\LAB-ROOT-CA
RequestId: 2
RequestId: "2"
Certificat en attente d'émission : Pris en charge
PS C:\> certutil -resubmit 2
Le certificat a été émis.
CertUtil: -resubmit La commande s'est terminée correctement.
PS C:\> certreq -retrieve 2 F:\Transfert\LAB-ISSUING-CA.crt
Certificat récupéré (Émis) Émis
~~~

Une AC racine **autonome** place les requêtes en attente : c'est l'administrateur qui décide explicitement d'émettre (\`-resubmit\`).

### Étape 4 — Installation du certificat

~~~powershell title="PKI-CA"
certutil -installcert 'F:\Transfert\LAB-ISSUING-CA.crt'
Start-Service certsvc
~~~

### Étape 5 — Points de distribution et durées

~~~powershell title="CDP et AIA : fichier, LDAP et HTTP"
certutil -setreg CA\CRLPublicationURLs "65:C:\Windows\system32\CertSrv\CertEnroll\%3%8%9.crl\n79:ldap:///CN=%7%8,CN=%2,CN=CDP,CN=Public Key Services,CN=Services,%6%10\n6:http://pki.lab.enzomarechal.fr/CertEnroll/%3%8%9.crl"
certutil -setreg CA\CACertPublicationURLs "1:C:\Windows\system32\CertSrv\CertEnroll\%1_%3%4.crt\n3:ldap:///CN=%7,CN=AIA,CN=Public Key Services,CN=Services,%6%11\n2:http://pki.lab.enzomarechal.fr/CertEnroll/%1_%3%4.crt"

# CRL hebdomadaire, CRL delta quotidienne
certutil -setreg CA\CRLPeriodUnits 1
certutil -setreg CA\CRLPeriod "Weeks"
certutil -setreg CA\CRLDeltaPeriodUnits 1
certutil -setreg CA\CRLDeltaPeriod "Days"

# Durée maximale des certificats émis (le modèle peut la réduire)
certutil -setreg CA\ValidityPeriodUnits 2
certutil -setreg CA\ValidityPeriod "Years"
certutil -setreg CA\AuditFilter 127

Restart-Service certsvc
certutil -crl
~~~

| Indicateur | Valeur | Calcul |
|------------|--------|--------|
| \`65\` (fichier) | 1 + 64 | Publier la CRL + publier les CRL delta |
| \`79\` (LDAP) | 1 + 2 + 4 + 8 + 64 | Publier, inclure dans les certificats, dans les CRL, dans toutes les CRL, publier les delta |
| \`6\` (HTTP) | 2 + 4 | Inclure dans les certificats et dans les CRL (la publication est faite par le fichier local) |

### Étape 6 — Modèles de certificats

Dans la console *Modèles de certificats* (\`certtmpl.msc\`), dupliquer puis publier :

| Nouveau modèle | Base | Paramètres clés | Inscription |
|----------------|------|-----------------|-------------|
| \`LAB-Machine-8021X\` | Authentification de station de travail | RSA 2048, 1 an, sujet = nom DNS | *Ordinateurs du domaine* : Lire, Inscrire, **Inscription automatique** |
| \`LAB-Serveur-Web\` | Serveur Web | RSA 2048, 1 an, sujet fourni dans la demande | \`GG_Admins_T1\` : Lire, Inscrire |
| \`LAB-NPS\` | Serveur RAS et IAS | RSA 2048, 2 ans | *Serveurs RAS et IAS* : Lire, Inscrire, Inscription automatique |
| \`LAB-Controleur-Domaine\` | Authentification Kerberos | Remplace les anciens modèles de DC | *Contrôleurs de domaine* : Inscription automatique |

~~~powershell title="Publication des modèles sur l'AC"
'LAB-Machine-8021X', 'LAB-Serveur-Web', 'LAB-NPS', 'LAB-Controleur-Domaine' |
    ForEach-Object { Add-CATemplate -Name $_ -Force }
Get-CATemplate | Format-Table Name, Oid
~~~

> [!SEC] « Sujet fourni dans la demande »
> Un modèle où le demandeur choisit librement le nom **et** qui permet l'authentification client autorise n'importe qui à demander un certificat au nom d'un administrateur (vulnérabilité de type *ESC1*). Ce paramètre est réservé au modèle serveur web, dont l'inscription est limitée aux administrateurs tier 1 et sans usage *authentification client*.

### Étape 7 — Inscription automatique par GPO

GPO \`C_Tous_PKI-AutoEnrollment\` liée à la racine du domaine : *Configuration ordinateur › Stratégies › Paramètres Windows › Paramètres de sécurité › Stratégies de clé publique* › **Client des services de certificats - Inscription automatique** :

| Option | Valeur |
|--------|--------|
| Modèle de configuration | **Activé** |
| Renouveler les certificats expirés, mettre à jour les certificats en attente et supprimer les certificats révoqués | Coché |
| Mettre à jour les certificats qui utilisent les modèles de certificats | Coché |

## Validation

~~~terminal title="Poste du domaine — inscription immédiate"
PS C:\> gpupdate /force; certutil -pulse
CertUtil: -pulse La commande s'est terminée correctement.
PS C:\> Get-ChildItem Cert:\LocalMachine\My | Select-Object Subject, Issuer, NotAfter
Subject                                Issuer                                         NotAfter
-------                                ------                                         --------
CN=PC-5CG3301XYZ.lab.enzomarechal.fr   CN=LAB-ISSUING-CA, O=Lab Enzo Marechal, C=FR   23/05/2027 11:04:12
PS C:\> $c = Get-ChildItem Cert:\LocalMachine\My | Select-Object -First 1
PS C:\> Export-Certificate -Cert $c -FilePath C:\Temp\poste.cer | Out-Null
PS C:\> certutil -verify -urlfetch C:\Temp\poste.cer | Select-Object -Last 1
CertUtil: -verify La commande s'est terminée correctement.
~~~

La console **PKI d'entreprise** (\`pkiview.msc\`) offre une vue synthétique : chaque emplacement (AIA, CDP, CDP delta) de chaque niveau doit être **OK**.

~~~html
<div class="screen">
  <div class="screen__bar">pkiview.msc — PKI d'entreprise</div>
  <div class="screen__body">
    <table>
      <thead><tr><th>Nom</th><th>État</th><th>Expiration</th><th>Emplacement</th></tr></thead>
      <tbody>
        <tr><td>LAB-ROOT-CA · Certificat d'AC</td><td style="color:#34d399">OK</td><td>09/05/2046</td><td>—</td></tr>
        <tr><td>LAB-ROOT-CA · Emplacement CDP #1</td><td style="color:#34d399">OK</td><td>07/11/2026</td><td>http://pki.lab.enzomarechal.fr/CertEnroll/LAB-ROOT-CA.crl</td></tr>
        <tr><td>LAB-ISSUING-CA · Certificat d'AC</td><td style="color:#34d399">OK</td><td>23/05/2036</td><td>—</td></tr>
        <tr><td>LAB-ISSUING-CA · Emplacement AIA #1</td><td style="color:#34d399">OK</td><td>09/05/2046</td><td>ldap:///CN=LAB-ISSUING-CA,CN=AIA,…</td></tr>
        <tr><td>LAB-ISSUING-CA · Emplacement CDP #1</td><td style="color:#34d399">OK</td><td>30/05/2026</td><td>ldap:///CN=LAB-ISSUING-CA,CN=PKI-CA,CN=CDP,…</td></tr>
        <tr><td>LAB-ISSUING-CA · Emplacement CDP #2</td><td style="color:#34d399">OK</td><td>30/05/2026</td><td>http://pki.lab.enzomarechal.fr/CertEnroll/LAB-ISSUING-CA.crl</td></tr>
        <tr><td>LAB-ISSUING-CA · Emplacement DeltaCRL #2</td><td style="color:#34d399">OK</td><td>24/05/2026</td><td>http://pki.lab.enzomarechal.fr/CertEnroll/LAB-ISSUING-CA+.crl</td></tr>
      </tbody>
    </table>
  </div>
</div>
~~~

| # | Test | Attendu | Obtenu |
|---|------|---------|--------|
| T1 | Nouveau poste joint au domaine | Certificat \`LAB-Machine-8021X\` en < 8 h (ou \`certutil -pulse\`) | Immédiat avec \`-pulse\` |
| T2 | \`certutil -verify -urlfetch\` | Chaîne valide, révocation vérifiée | OK |
| T3 | Révocation d'un certificat de test + nouvelle CRL delta | Certificat refusé | OK après \`certutil -crl delta\` |
| T4 | Demande de certificat web par un utilisateur standard | Refusée | Accès refusé au modèle |
| T5 | GLPI en HTTPS avec un certificat \`LAB-Serveur-Web\` | Aucun avertissement navigateur | OK |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| \`certutil -installcert\` : serveur de révocation hors connexion | CRL racine non publiée en HTTP | Étape 1 |
| CRL delta introuvable (HTTP 404) | Double échappement refusé par IIS | \`allowDoubleEscaping\` |
| Aucun certificat automatique | Permission *Inscription automatique* absente sur le modèle, ou modèle non publié | \`certtmpl.msc\`, \`Get-CATemplate\` |
| Événement 13 *CertificateServicesClient-AutoEnrollment* | Modèle refusé par l'AC | Journal de l'AC, demandes refusées dans \`certsrv.msc\` |

## Pour aller plus loin

- Utiliser ces certificats pour l'authentification réseau : [proc-020](#wiki/proc-020)
- La racine hors ligne : [proc-018](#wiki/proc-018)
`
  });

  /* ========================================================================
     PROC-020 — 802.1X EAP-TLS AVEC NPS
     ======================================================================== */
  LIST.push({
    id: 'proc-020',
    title: '802.1X filaire en EAP-TLS avec NPS et attribution dynamique de VLAN',
    category: 'Sécurité',
    techs: ['nps', 'adcs', 'cisco', 'gpo'],
    level: 'Expert',
    date: '2026-06-13',
    project: 'pki-8021x',
    summary: "Contrôle d'accès réseau sur les prises filaires : NPS et son certificat, clients RADIUS, stratégies EAP-TLS et MAB, GPO de réseau câblé, configuration des switchs Cisco en mode surveillance puis en mode bloquant, lecture des codes de raison NPS.",
    env: { 'RADIUS': 'NPS sur DC02 (10.10.20.11)', 'Switchs': 'SW-ACCESS-01/02 · IOS 15.2', 'PKI': 'LAB-ISSUING-CA (proc-019)', 'Postes': 'Windows 11, certificat LAB-Machine-8021X' },
    content: md`
## Contexte

Les mesures de niveau 2 ([proc-003](#wiki/proc-003), [proc-004](#wiki/proc-004)) limitent les dégâts d'un équipement indésirable, mais ne l'empêchent pas d'**accéder** au réseau. 802.1X conditionne l'ouverture du port à une authentification :

- les postes du domaine présentent leur **certificat machine** (EAP-TLS) → VLAN bureautique ;
- les téléphones, qui ne savent pas faire de 802.1X, sont reconnus par leur adresse MAC (**MAB**) → domaine voix uniquement ;
- tout le reste n'a **aucun accès**.

## Les acteurs

~~~ascii title="Supplicant · Authenticator · Authentication server"
  Poste Windows (supplicant)      SW-ACCESS-01 (authenticator)       NPS sur DC02 (serveur)
  service dot3svc                 dot1x + mab                        RADIUS 1812/1813
        │ ── EAPOL-Start ──────────► │                                     │
        │ ◄── EAP-Request/Identity ─ │                                     │
        │ ── host/PC-…  ───────────► │ ── Access-Request (EAP) ──────────► │
        │ ◄══════ échange TLS (certificats client et serveur) ═════════════►│
        │                            │ ◄── Access-Accept + VLAN 60 ─────── │
        │ ◄──── port autorisé ────── │                                     │
~~~

## Prérequis

- [ ] PKI opérationnelle, certificats machines distribués ([proc-019](#wiki/proc-019))
- [ ] Modèle \`LAB-NPS\` publié (certificat serveur de NPS)
- [ ] Switchs avec SVI de management et accès RADIUS vers DC02 (règle pfSense MGMT → DC02 UDP 1812-1813)
- [ ] Inventaire des équipements sans supplicant (téléphones, imprimantes) et de leurs préfixes MAC

## Mise en œuvre — NPS

### Étape 1 — Installation et enregistrement

~~~powershell title="DC02"
Install-WindowsFeature NPAS -IncludeManagementTools
netsh nps add registeredserver domain=lab.enzomarechal.fr server=DC02

# DC02 devient membre de « Serveurs RAS et IAS » → reçoit automatiquement le certificat LAB-NPS
certutil -pulse
Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Issuer -like '*LAB-ISSUING-CA*' } | Select-Object Subject, NotAfter

# Journalisation des décisions NPS dans le journal Sécurité
auditpol /set /subcategory:"Serveur NPS" /success:enable /failure:enable
~~~

### Étape 2 — Clients RADIUS

~~~powershell title="Déclaration des switchs (secret différent par équipement)"
New-NpsRadiusClient -Name 'SW-ACCESS-01' -Address 10.10.10.3 -SharedSecret (Read-Host 'Secret SW-ACCESS-01')
New-NpsRadiusClient -Name 'SW-ACCESS-02' -Address 10.10.10.4 -SharedSecret (Read-Host 'Secret SW-ACCESS-02')
~~~

### Étape 3 — Stratégie EAP-TLS des postes

Console NPS › *Stratégies réseau › Nouvelle* :

| Onglet | Paramètre | Valeur |
|--------|-----------|--------|
| Conditions | Groupes d'ordinateurs | \`LAB\Ordinateurs du domaine\` |
| | Type de port NAS | Ethernet |
| Contraintes | Méthodes d'authentification | **Microsoft : carte à puce ou autre certificat** → certificat \`LAB-NPS\` de DC02 ; aucune autre méthode cochée |
| Paramètres | Attributs RADIUS standard | \`Tunnel-Type\` = Virtual LANs (VLAN) · \`Tunnel-Medium-Type\` = 802 · \`Tunnel-Pvt-Group-ID\` = \`60\` |

### Étape 4 — Stratégie MAB des téléphones

| Onglet | Paramètre | Valeur |
|--------|-----------|--------|
| Conditions | Calling-Station-ID | \`^805EC0.*\` (préfixe constructeur des postes, format sans séparateur) |
| | Type de port NAS | Ethernet |
| Contraintes | Méthodes d'authentification | Authentification non chiffrée (PAP) uniquement |
| Paramètres | Spécifique au fournisseur (Cisco) | \`cisco-av-pair\` = \`device-traffic-class=voice\` |

> [!WARN] MAB n'est pas une authentification forte
> Une adresse MAC s'usurpe en une commande. Cette stratégie n'accorde que le **domaine voix**, lui-même isolé par pfSense ([proc-007](#wiki/proc-007)) : un usurpateur obtient au mieux l'accès au VLAN 40, sans route vers les serveurs.

Ordre des stratégies : 1. EAP-TLS postes, 2. MAB téléphones, 3. stratégies par défaut **désactivées** (refus).

## Mise en œuvre — Postes Windows

### Étape 5 — GPO « C_Postes_8021X »

| Chemin | Paramètre | Valeur |
|--------|-----------|--------|
| Paramètres Windows › Paramètres de sécurité › Services système | Configuration automatique de réseau câblé (dot3svc) | **Automatique** |
| Paramètres Windows › Paramètres de sécurité › Stratégies de réseau câblé (IEEE 802.3) | Nouvelle stratégie › Sécurité | Utiliser l'authentification IEEE 802.1X : **Activé** |
| | Méthode | Microsoft : carte à puce ou autre certificat |
| | Propriétés | Utiliser un certificat sur cet ordinateur · **Vérifier l'identité du serveur** : \`DC02.lab.enzomarechal.fr\`, autorité \`LAB-ROOT-CA\` |
| | Mode d'authentification | Authentification ordinateur |

La vérification du serveur empêche un faux point d'accès / faux switch de capter l'authentification du poste.

## Mise en œuvre — Switchs

### Étape 6 — AAA et RADIUS

~~~cisco title="SW-ACCESS-01"
aaa new-model
aaa authentication dot1x default group radius
aaa authorization network default group radius
aaa accounting dot1x default start-stop group radius
!
radius server NPS-DC02
 address ipv4 10.10.20.11 auth-port 1812 acct-port 1813
 key <secret SW-ACCESS-01>
!
ip radius source-interface Vlan10
radius-server dead-criteria time 5 tries 3
radius-server deadtime 10
dot1x system-auth-control
~~~

> [!DANGER] aaa new-model et l'accès au switch
> \`aaa new-model\` modifie aussi l'authentification des lignes VTY et console. Sans \`aaa authentication login default local\`, vous risquez de perdre l'accès SSH. Programmez un \`reload in 10\` avant ([proc-001](#wiki/proc-001)).

### Étape 7 — Phase 1 : mode surveillance

Pendant deux semaines, les ports authentifient **sans rien bloquer** (\`authentication open\`) : on observe qui réussit et qui échoue.

~~~cisco title="Ports utilisateurs — mode surveillance" hl="11"
interface range GigabitEthernet1/0/1 - 20
 switchport mode access
 switchport access vlan 60
 switchport voice vlan 40
 authentication host-mode multi-domain
 authentication order dot1x mab
 authentication priority dot1x mab
 authentication port-control auto
 authentication periodic
 authentication timer reauthenticate server
 authentication open
 mab
 dot1x pae authenticator
 dot1x timeout tx-period 10
~~~

~~~powershell title="Synthèse des refus NPS de la période de surveillance"
Get-WinEvent -ComputerName DC02 -FilterHashtable @{ LogName = 'Security'; Id = 6273 } |
    ForEach-Object {
        $x = [xml]$_.ToXml()
        $d = @{}; $x.Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
        [pscustomobject]@{ Equipement = $d['CallingStationID']; Compte = $d['SubjectUserName']; Raison = $d['Reason'] }
    } | Group-Object Equipement, Raison | Sort-Object Count -Descending | Select-Object Count, Name
~~~

### Étape 8 — Phase 2 : mode bloquant

Une fois tous les équipements légitimes identifiés et traités :

~~~cisco title="Passage en mode bloquant"
interface range GigabitEthernet1/0/1 - 20
 no authentication open
 authentication event server dead action authorize vlan 60
 authentication event server alive action reinitialize
~~~

Si NPS devient injoignable, les ports restent ouverts (VLAN 60) : la **continuité de service** prime sur le contrôle d'accès pendant une panne du serveur RADIUS.

## Validation

~~~terminal title="SW-ACCESS-01"
SW-ACCESS-01# show authentication sessions
Interface    MAC Address    Method   Domain   Status Fg  Session ID
Gi1/0/5      3c52.8201.a4f7 dot1x    DATA     Auth       0A0A0A030000002A1F3C7B21
Gi1/0/5      805e.c03a.1102 mab      VOICE    Auth       0A0A0A030000002B1F3C7C02
Gi1/0/9      6c4b.90ff.0001 mab      UNKNOWN  Unauth     0A0A0A030000002C1F3C8A11
SW-ACCESS-01# show authentication sessions interface gi1/0/5 details | include User-Name|Vlan Group|Status
            User-Name:  host/PC-5CG3301XYZ.lab.enzomarechal.fr
               Status:  Authorized
           Vlan Group:  Vlan: 60
~~~

| # | Scénario | Attendu | Obtenu |
|---|----------|---------|--------|
| T1 | Poste du domaine | dot1x OK, VLAN 60 | OK en ≈ 2 s, événement 6272 |
| T2 | Téléphone derrière le poste | MAB, domaine voix | OK |
| T3 | Portable personnel | Port non autorisé | \`Unauth\`, aucune adresse IP |
| T4 | Certificat du poste révoqué | Refus | 6273 après publication de la CRL delta |
| T5 | NPS arrêté | Postes autorisés (VLAN 60) | OK (\`server dead action\`) |
| T6 | Usurpation de la MAC d'un téléphone par un PC | Domaine voix seulement | Aucun accès aux serveurs |

## Lire les codes de raison NPS (événement 6273)

| Code | Signification | Piste |
|------|--------------|-------|
| 16 | Identifiants incorrects | Certificat client invalide ou expiré |
| 22 | Le type EAP ne peut pas être traité | Méthode non cochée dans la stratégie, ou certificat NPS absent |
| 23 | Erreur lors du traitement EAP | Certificat non approuvé, révocation injoignable |
| 48 | Aucune stratégie réseau ne correspond | Condition de groupe ou de type de port non satisfaite |
| 49 | Aucune stratégie de demande de connexion ne correspond | Stratégie de demande de connexion désactivée |
| 65 | Autorisation d'accès réseau refusée sur le compte | Onglet *Appel entrant* du compte : « contrôler l'accès via la stratégie réseau » |
| 66 | Méthode d'authentification non autorisée par la stratégie | Ex. : MAB (PAP) arrivé sur la stratégie EAP-TLS |

## Dépannage

| Symptôme | Cause | Correction |
|----------|-------|-----------|
| Aucun échange EAP | Service dot3svc arrêté sur le poste | GPO, étape 5 |
| Le switch ne reçoit pas de réponse | Mauvais secret, adresse source non déclarée | \`ip radius source-interface Vlan10\`, client RADIUS NPS |
| Raison 23 sur tous les postes | Le poste ne fait pas confiance au certificat de NPS, ou CRL injoignable | Vérifier la racine et \`pkiview.msc\` |
| Postes neufs bloqués | Pas encore de certificat | Déploiement dans le VLAN 50 (sans 802.1X), certificat obtenu pendant MDT |

## Pour aller plus loin

- Le même NPS authentifie aussi les utilisateurs VPN : [proc-009](#wiki/proc-009)
- Le projet : [PKI AD CS & 802.1X](#projet/pki-8021x)
`
  });
})();
