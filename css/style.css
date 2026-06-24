:root {
  --bg:#07090d; --card:#0f1318; --border:#1b2535;
  --accent:#00d4ff; --green:#00e87a; --orange:#ff9500; --red:#ff4d6d;
  --text:#dde8f2; --muted:#4d6a82; --grid:rgba(0,212,255,.025);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}

/* Canvas de fond animé */
#bg-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: -1;
  background: var(--bg);
}

body, a, button, input, textarea, select, .nav-item, .vcat, .proj-head, .proj-toggle {
  color:var(--text);font-family:'Syne',sans-serif;overflow-x:hidden;
  cursor:none !important;
}

.cur{width:8px;height:8px;background:var(--accent);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 0 15px var(--accent);opacity:0;transition:opacity .3s;}
.cur-ring{width:32px;height:32px;border:2px solid rgba(0,212,255,.4);border-radius:50%;position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:0;transition:opacity .3s, transform .1s;animation:pulse-ring 2s ease-in-out infinite;}
@keyframes pulse-ring{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.4}50%{transform:translate(-50%,-50%) scale(1.3);opacity:.2}}

.app{display:flex;min-height:100vh;}

.sidebar{
  position:fixed;top:0;left:0;bottom:0;
  width:240px;
  background:rgba(7,9,13,.97);
  border-right:1px solid var(--border);
  z-index:100;
  display:flex;flex-direction:column;
  padding:40px 0 30px;
  backdrop-filter:blur(20px);
}
.sidebar-logo{padding:0 28px 36px;border-bottom:1px solid var(--border);}
.sidebar-logo .initials{font-family:'Space Mono',monospace;font-size:28px;font-weight:700;color:transparent;-webkit-text-stroke:1.5px var(--accent);letter-spacing:-1px;line-height:1;}
.sidebar-logo .name{font-size:13px;font-weight:700;color:var(--text);margin-top:6px;}
.sidebar-logo .role{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:2px;margin-top:3px;}

.sidebar-nav{padding:24px 0;flex:1;}
.nav-item{display:flex;align-items:center;gap:12px;padding:13px 28px;font-size:13px;font-weight:600;letter-spacing:.5px;color:var(--muted);transition:all .2s;border-left:2px solid transparent;position:relative;}
.nav-item:hover{color:var(--text);background:rgba(0,2,255,.04);}
.nav-item.active{color:var(--accent);border-left-color:var(--accent);background:rgba(0,2,255,.06);}
.nav-item .nav-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
.nav-item .nav-num{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);margin-left:auto;}
.nav-item.active .nav-num{color:var(--accent);}

.sidebar-links{padding:20px 28px;border-top:1px solid var(--border);}
.sidebar-links a{display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);text-decoration:none;letter-spacing:1px;padding:6px 0;transition:color .2s;}
.sidebar-links a:hover{color:var(--accent);}

.main{margin-left:240px;flex:1;position:relative;z-index:1;}

.page{display:none;min-height:100vh;padding:60px 64px 80px;animation:pageIn .35s ease;}
.page.active{display:block;}
@keyframes pageIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}

.page-header{margin-bottom:56px;padding-bottom:28px;border-bottom:1px solid var(--border);display:flex;align-items:flex-end;justify-content:space-between;}
.page-header-left .page-tag{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:4px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
.page-header-left .page-tag::before{content:'';width:24px;height:1px;background:var(--accent);}
.page-header-left h1{font-size:clamp(32px,4vw,52px);font-weight:800;letter-spacing:-2px;line-height:1;}
.page-header-right{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;text-align:right;}

.rv{opacity:1;transform:none;}

/* ===================== ACCUEIL ===================== */
.hero-layout{
  display:grid;
  grid-template-columns:1fr 300px;
  gap:40px; /* Réduit pour éviter que ça ne coupe l'écran */
  align-items:start;
  margin-bottom:64px;
}
.hero-name{font-size:clamp(52px,7vw,88px);font-weight:800;letter-spacing:-3px;line-height:.92;margin-bottom:20px;}
.hero-name .ln{color:transparent;-webkit-text-stroke:1.5px var(--accent);}
.hero-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;}
.pill{padding:7px 14px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;transition:all .2s;}
.pill.hi{border-color:rgba(0,212,255,.4);color:var(--accent);background:rgba(0,212,255,.05);}
.hero-bio{font-size:15px;color:var(--muted);line-height:1.9;margin-bottom:30px;}
.hero-bio strong{color:var(--text);}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap;}
.btn{padding:11px 24px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:7px;border:none;}
.btn-p{background:var(--accent);color:var(--bg);clip-path:polygon(0 0,calc(100%-10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100%-10px));}
.btn-p:hover{background:#fff;}
.btn-o{border:1px solid var(--border);color:var(--text);background:transparent;}
.btn-o:hover{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,.05);}

/* Suppression du translateX pour ne pas casser la grille */
.hero-photo-wrap{position:relative;}
.hero-photo-frame{position:relative;}
.hero-photo{width:300px;height:390px;object-fit:cover;object-position:center 10%;display:block;transition:filter .3s;}

.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-bottom:64px;}
.stat-box{background:rgba(15,19,24,0.85);padding:24px 20px;}
.stat-val{font-family:'Space Mono',monospace;font-size:26px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:5px;}
.stat-lbl{font-size:11px;color:var(--muted);letter-spacing:.5px;line-height:1.4;}

.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:52px;}
.fc{background:rgba(15,19,24,0.85);border:1px solid var(--border);padding:22px;transition:border-color .25s;}
.fc:hover{border-color:rgba(0,212,255,.35);}
.fc-yr{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:2px;margin-bottom:7px;}
.fc-school{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:7px;}
.fc-title{font-size:14px;font-weight:700;line-height:1.35;margin-bottom:10px;}
.fc-badge{display:inline-block;padding:3px 8px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);}

.sec-title{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:4px;text-transform:uppercase;margin-bottom:20px;display:flex;align-items:center;gap:12px;}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border);}

.timeline{position:relative;padding-left:26px;}
.timeline::before{content:'';position:absolute;left:5px;top:8px;bottom:8px;width:1px;background:var(--border);}
.tl-item{position:relative;padding-bottom:32px;}
.tl-item::before{content:'';position:absolute;left:-22px;top:5px;width:8px;height:8px;border:2px solid var(--border);border-radius:50%;background:var(--bg);}
.tl-item.alt::before{border-color:var(--green);}
.tl-item.stage::before{border-color:var(--orange);}
.tl-date{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:4px;}
.tl-title{font-size:15px;font-weight:700;margin-bottom:2px;}
.tl-co{font-size:12px;font-weight:600;margin-bottom:8px;}
.tl-co.green{color:var(--green);} .tl-co.orange{color:var(--orange);}
.tl-ul{font-size:13px;color:var(--muted);line-height:1.7;}
.tl-ul li{margin-left:14px;margin-bottom:2px;}

.certif-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

/* ===================== PROJETS ===================== */
.proj-list{display:flex;flex-direction:column;gap:3px;}
.proj-card{background:rgba(15,19,24,0.85);border:1px solid var(--border);overflow:hidden;transition:border-color .25s;}
.proj-card:hover{border-color:rgba(0,212,255,.3);}
.proj-head{display:flex;align-items:center;gap:16px;padding:28px 32px;}
.proj-num-badge{font-family:'Space Mono',monospace;font-size:9px;color:var(--bg);background:var(--accent);padding:3px 8px;letter-spacing:2px;flex-shrink:0;}
.proj-head-text{flex:1;}
.proj-title{font-size:18px;font-weight:800;letter-spacing:-.5px;margin-bottom:3px;}
.proj-sub{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:2px;}
.proj-tags-inline{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto;}
.tag{padding:3px 9px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
.proj-toggle{width:34px;height:34px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:16px;transition:all .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px;}
.proj-toggle:hover,.proj-toggle.open{border-color:var(--accent);color:var(--accent);}
.proj-toggle.open{transform:rotate(45deg);}

.proj-body{max-height:0;overflow:hidden;transition:max-height .5s ease-in-out, padding .3s;border-top:0px solid var(--border);padding:0 32px;}
.proj-body.open{max-height:2500px;padding:28px 32px 36px;border-top-width:1px;}
.proj-desc{font-size:14px;color:var(--muted);line-height:1.9;margin-bottom:20px;}
.proj-desc strong{color:var(--text);}
.proj-hl{display:flex;flex-direction:column;gap:9px;margin-bottom:24px;}
.proj-hl li{display:flex;gap:10px;font-size:13px;color:var(--muted);line-height:1.6;list-style:none;}
.proj-hl li::before{content:'→';color:var(--accent);font-family:'Space Mono',monospace;font-size:10px;flex-shrink:0;margin-top:2px;}
.proj-foot{display:flex;gap:10px;padding-top:20px;border-top:1px solid var(--border);flex-wrap:wrap;}
.proj-img{width:100%; border:1px solid var(--border); border-radius:8px; margin-top:20px;}

.comp-valide {margin-top:20px; margin-bottom:20px; padding:15px; background:rgba(0,212,255,0.05); border:1px solid var(--border); border-left: 3px solid var(--accent);}
.comp-valide-title {font-family:'Space Mono', monospace; font-size:10px; color:var(--accent); margin-bottom:8px; letter-spacing: 1px; text-transform: uppercase;}
.comp-valide-list {font-size:13px; color:var(--text); margin-left:16px; line-height: 1.6;}

/* ===================== COMPETENCES ===================== */
.comp-intro-box{background:rgba(15,19,24,0.85);border:1px solid var(--border);border-left:3px solid var(--accent);padding:22px 24px;margin-bottom:40px;font-size:14px;color:var(--muted);line-height:1.85;}
.comp-intro-box strong{color:var(--text);}
.comp-block{margin-bottom:52px;}
.comp-sub{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);}
.bts-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;}
.bts-card{background:rgba(15,19,24,0.85);border:1px solid var(--border);padding:28px;}
.bts-card h3{font-size:17px;font-weight:800;margin-bottom:6px;letter-spacing:-.5px;}
.bts-card .opt{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:2px;margin-bottom:16px;}
.bts-ul{font-size:13px;color:var(--muted);line-height:1.8;}
.bts-ul li{margin-left:14px;margin-bottom:3px;}
.bts-debouches{margin-top:20px; border-top:1px solid var(--border); padding-top:16px;}
.bts-debouches .label{font-family:'Space Mono',monospace;font-size:9px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;}
.deb-tags{display:flex;flex-wrap:wrap;gap:6px;}
.deb-tag{padding:4px 10px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:.5px; background: rgba(0,212,255,0.03);}

/* ===================== ARMATIS ===================== */
.armatis-hero{display:grid;grid-template-columns:1fr 340px;gap:48px;align-items:start;margin-bottom:52px;}
.armatis-photo{width:100%;height:220px;object-fit:cover;border:1px solid var(--border);display:block;}
.armatis-photo-placeholder{width:100%;height:220px;background:rgba(15,19,24,0.85);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
.armatis-photo-placeholder .ph-icon{font-size:36px;opacity:.3;}
.armatis-photo-placeholder p{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:2px;text-align:center;}
.armatis-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(0,232,122,.08);border:1px solid rgba(0,232,122,.3);font-family:'Space Mono',monospace;font-size:10px;color:var(--green);letter-spacing:2px;margin-bottom:16px;}
.armatis-kv{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);margin-bottom:32px;}
.armatis-kv-item{background:rgba(15,19,24,0.85);padding:16px 18px;}
.armatis-kv-item .kv-label{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;}
.armatis-kv-item .kv-val{font-size:13px;font-weight:700;color:var(--text);}

.task-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:40px;}
.task-card{background:rgba(15,19,24,0.85);border:1px solid var(--border);padding:22px;transition:border-color .25s;}
.task-card:hover{border-color:rgba(0,212,255,.3);}
.task-icon{font-size:20px;margin-bottom:12px;}
.task-title{font-size:14px;font-weight:800;margin-bottom:8px;letter-spacing:-.3px;}
.task-desc{font-size:12px;color:var(--muted);line-height:1.75;}
.task-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}

.env-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-bottom:40px;}
.env-box{background:rgba(15,19,24,0.85);padding:18px 20px;}
.env-label{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px;}
.env-items{display:flex;flex-wrap:wrap;gap:5px;}
.env-item{padding:3px 9px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:9px;color:var(--accent);letter-spacing:1px;}

.quote-box{background:rgba(15,19,24,0.85);border:1px solid var(--border);border-left:3px solid var(--green);padding:22px 26px;font-size:14px;color:var(--muted);line-height:1.85;font-style:italic;}
.quote-box strong{color:var(--text);font-style:normal;}

/* ===================== VEILLE ===================== */
.veille-intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px;}
.veille-domain-card{background:rgba(15,19,24,0.85);border:1px solid var(--border);padding:28px;transition:border-color .25s;}
.veille-domain-card:hover{border-color:rgba(0,212,255,.3);}
.vd-icon{font-size:28px;margin-bottom:14px;}
.vd-title{font-size:18px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;}
.vd-subtitle{font-family:'Space Mono',monospace;font-size:9px;color:var(--accent);letter-spacing:2px;margin-bottom:14px;}
.vd-desc{font-size:13px;color:var(--muted);line-height:1.8;margin-bottom:16px;}
.vd-topics{display:flex;flex-wrap:wrap;gap:5px;}
.vd-topic{padding:4px 10px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.5px;}

.veille-why{background:rgba(15,19,24,0.85);border:1px solid var(--border);border-left:3px solid var(--orange);padding:22px 24px;margin-bottom:40px;font-size:13px;color:var(--muted);line-height:1.85;}
.veille-why strong{color:var(--text);}

.veille-controls{display:flex;gap:10px;margin-bottom:24px;align-items:center;flex-wrap:wrap;}
.veille-search{display:flex;gap:0;flex:1;min-width:200px;}
.veille-search input{flex:1;background:rgba(15,19,24,0.85);border:1px solid var(--border);border-right:0;color:var(--text);font-family:'Space Mono',monospace;font-size:11px;padding:10px 14px;outline:none;transition:border-color .2s;}
.veille-search input:focus{border-color:var(--accent);}
.veille-search input::placeholder{color:var(--muted);}
.veille-search button{padding:10px 18px;background:var(--accent);color:var(--bg);border:1px solid var(--accent);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;transition:background .2s;}
.veille-search button:hover{background:#fff;border-color:#fff;}
.veille-cats{display:flex;gap:6px;flex-wrap:wrap;}
.vcat{padding:8px 14px;border:1px solid var(--border);font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;transition:all .2s;}
.vcat.active,.vcat:hover{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,.05);}
.veille-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.vcol-title{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 1.4s infinite;flex-shrink:0;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.rss-feed{display:flex;flex-direction:column;gap:2px;}
.rss-item{background:rgba(15,19,24,0.85);border:1px solid var(--border);padding:14px 16px;transition:border-color .2s;}
.rss-item:hover{border-color:rgba(0,212,255,.3);}
.rss-item a{text-decoration:none;color:inherit;}
.rss-ttl{font-size:13px;font-weight:700;color:var(--text);line-height:1.45;margin-bottom:5px;}
.rss-meta{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;display:flex;gap:10px;}
.rss-src{color:var(--accent);}
.rss-msg{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);padding:18px;text-align:center;border:1px solid var(--border);}
.veille-ts{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);text-align:right;margin-top:8px;letter-spacing:1px;}

/* ===================== CONTACT ===================== */
.contact-grid{display:grid;grid-template-columns:1fr;gap:48px;align-items:center;max-width: 600px;margin: 0 auto;}
.c-big{font-size:clamp(36px,4.5vw,56px);font-weight:800;letter-spacing:-2px;line-height:1;margin-bottom:18px;}
.c-big span{color:var(--accent);}
.c-intro{font-size:14px;color:var(--muted);line-height:1.85;margin-bottom:28px;}
.c-links{display:flex;flex-direction:column;gap:8px;}
.c-link{display:flex;align-items:center;gap:14px;padding:14px 18px;border:1px solid var(--border);text-decoration:none;color:var(--text);transition:all .2s;background:rgba(15,19,24,0.85);}
.c-link:hover{border-color:var(--accent);background:rgba(0,212,255,.03);}
.c-icon{font-size:15px;color:var(--accent);width:20px;text-align:center;flex-shrink:0;}
.c-link-lbl{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:2px;}
.c-link-val{font-size:13px;font-weight:600;}

footer{margin-left:240px;border-top:1px solid var(--border);padding:20px 64px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;background:rgba(5,7,10,0.8);backdrop-filter:blur(10px);}
footer p{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;}
footer span{color:var(--accent);}

/* ===================== RESPONSIVE ===================== */
@media(max-width:1000px){
  body, a, button, input, textarea, select, .nav-item, .vcat, .proj-head, .proj-toggle {cursor: auto !important;}
  .cur, .cur-ring {display: none !important;}
  .sidebar {width: 100%;height: auto;position: relative;padding: 20px 0;border-right: none;border-bottom: 1px solid var(--border);}
  .sidebar-logo {padding: 0 20px 20px;text-align: center;}
  .sidebar-nav {display: flex;flex-wrap: wrap;justify-content: center;padding: 10px 0;}
  .nav-item {padding: 8px 15px;border-left: none;border-bottom: 2px solid transparent;}
  .nav-item.active {border-left-color: transparent;border-bottom-color: var(--accent);}
  .sidebar-links {display: none;}
  .main {margin-left: 0;}
  .page {padding: 30px 20px;}
  .hero-layout{
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .hero-photo-wrap {
    order: -1;
    display: flex;
    justify-content: center;
  }
  .bts-grid,.veille-cols,.form-grid,.certif-row,.veille-intro-grid,.armatis-hero,.task-grid,.env-strip {grid-template-columns: 1fr;gap: 20px;}
  .hero-name {font-size: 40px;text-align: center;}
  .hero-bio {text-align: center;}
  .hero-btns {justify-content: center;}
  /* Agrandissement de 50% sur mobile également : de 150px à 225px */
  .hero-photo {width: 225px;height: 225px;border-radius: 50%;}
  .stats-strip {grid-template-columns: 1fr 1fr;}
  footer {margin-left: 0;text-align: center;}
}
