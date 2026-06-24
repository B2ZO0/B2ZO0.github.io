/* ============================================================
   CORE 3D — Noyau cristallin "Forge Numérique"
   Octaèdre flottant avec 4 facettes gravées :
   Ansible / Minecraft / Zabbix / Grafana
   ============================================================ */

(function () {
  'use strict';

  const stageEl = document.getElementById('core3d-stage');
  if (!stageEl || typeof THREE === 'undefined') return;

  const W = stageEl.clientWidth || 420;
  const H = stageEl.clientHeight || 420;

  // ----------------------------------------------------------
  // Scène, caméra, rendu
  // ----------------------------------------------------------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stageEl.appendChild(renderer.domElement);

  // ----------------------------------------------------------
  // Lumières — ambiance "premium cyber"
  // ----------------------------------------------------------
  scene.add(new THREE.AmbientLight(0x223344, 0.9));

  const keyLight = new THREE.PointLight(0x00d4ff, 14, 30);
  keyLight.position.set(4, 4, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xff9500, 8, 30);
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x00e87a, 5, 30);
  fillLight.position.set(-3, 4, 3);
  scene.add(fillLight);

  // ----------------------------------------------------------
  // Génération des textures de facettes (canvas -> texture)
  // Style gravure cyan sur fond sombre, cohérent avec le thème
  // ----------------------------------------------------------
  const TEX_SIZE = 512;

  function makeFaceCanvas(drawFn, accent) {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE; c.height = TEX_SIZE;
    const ctx = c.getContext('2d');

    // Fond
    const grad = ctx.createLinearGradient(0, 0, TEX_SIZE, TEX_SIZE);
    grad.addColorStop(0, '#0f1318');
    grad.addColorStop(1, '#07090d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    // Grille fine
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TEX_SIZE; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, TEX_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(TEX_SIZE, i); ctx.stroke();
    }

    // Bordure
    ctx.strokeStyle = 'rgba(0,212,255,0.25)';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, TEX_SIZE - 16, TEX_SIZE - 16);

    // Glow ambiant coloré
    const glow = ctx.createRadialGradient(
      TEX_SIZE / 2, TEX_SIZE / 2, 0,
      TEX_SIZE / 2, TEX_SIZE / 2, TEX_SIZE / 1.4
    );
    glow.addColorStop(0, accent + '33');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    // Dessin spécifique
    drawFn(ctx);

    return c;
  }

  // --- Ansible : losanges concentriques + roue ---
  function drawAnsible(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 5;
    [150, 110, 70].forEach((r, i) => {
      ctx.globalAlpha = 0.85 - i * 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // Triangles type "spokes"
    ctx.fillStyle = '#ee0000';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -150);
      ctx.lineTo(14, -110);
      ctx.lineTo(-14, -110);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4d6d';
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#dde8f2';
    ctx.font = '700 28px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ANSIBLE', cx, TEX_SIZE - 50);
    ctx.font = '400 14px "Space Mono", monospace';
    ctx.fillStyle = '#4d6a82';
    ctx.fillText('IaC · AUTOMATION', cx, TEX_SIZE - 26);
  }

  // --- Minecraft : bloc isométrique + grain ---
  function drawMinecraft(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2 - 10;
    const s = 110;
    ctx.save();
    ctx.translate(cx, cy);

    // Top
    ctx.fillStyle = '#7fb84a';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.87, -s * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 0.87, -s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Left
    ctx.fillStyle = '#5d8c3f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.87, -s * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.87, s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Right
    ctx.fillStyle = '#3e5e29';
    ctx.beginPath();
    ctx.moveTo(s * 0.87, -s * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(s * 0.87, s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Grain pixelisé sur chaque face
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    for (let i = 0; i < 60; i++) {
      const rx = (Math.random() - 0.5) * s * 1.8;
      const ry = (Math.random() - 0.5) * s * 1.8;
      if (Math.abs(rx) + Math.abs(ry) * 1.7 < s * 1.6) {
        ctx.fillRect(rx, ry, 6, 6);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.fillStyle = '#dde8f2';
    ctx.font = '700 28px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MINECRAFT', TEX_SIZE / 2, TEX_SIZE - 50);
    ctx.font = '400 14px "Space Mono", monospace';
    ctx.fillStyle = '#4d6a82';
    ctx.fillText('SERVER CLUSTER × 3', TEX_SIZE / 2, TEX_SIZE - 26);
  }

  // --- Zabbix : losange "alerte" + courbe de supervision ---
  function drawZabbix(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2 - 10;
    ctx.save();
    ctx.translate(cx, cy);

    // Losange principal
    ctx.fillStyle = '#d40000';
    ctx.beginPath();
    ctx.moveTo(0, -120);
    ctx.lineTo(95, 0);
    ctx.lineTo(0, 120);
    ctx.lineTo(-95, 0);
    ctx.closePath();
    ctx.fill();

    // Losange intérieur sombre
    ctx.fillStyle = '#1a0505';
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(62, 0);
    ctx.lineTo(0, 78);
    ctx.lineTo(-62, 0);
    ctx.closePath();
    ctx.fill();

    // Courbe de monitoring
    ctx.strokeStyle = '#00e87a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-50, 20);
    ctx.lineTo(-25, 20);
    ctx.lineTo(-10, -35);
    ctx.lineTo(10, 25);
    ctx.lineTo(30, -15);
    ctx.lineTo(50, 10);
    ctx.stroke();

    ctx.fillStyle = '#00e87a';
    [[-50,20],[-25,20],[-10,-35],[10,25],[30,-15],[50,10]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore();

    ctx.fillStyle = '#dde8f2';
    ctx.font = '700 28px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ZABBIX', cx, TEX_SIZE - 50);
    ctx.font = '400 14px "Space Mono", monospace';
    ctx.fillStyle = '#4d6a82';
    ctx.fillText('MONITORING · ALERTES', cx, TEX_SIZE - 26);
  }

  // --- Grafana : panneau de dashboards + barres ---
  function drawGrafana(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2 - 10;
    ctx.save();
    ctx.translate(cx, cy);

    // Forme "flamme/panneau" stylisée
    const grad = ctx.createLinearGradient(0, -120, 0, 120);
    grad.addColorStop(0, '#ffcb05');
    grad.addColorStop(1, '#f46800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -125);
    ctx.bezierCurveTo(70, -90, 95, -20, 80, 40);
    ctx.bezierCurveTo(65, 100, 10, 130, 0, 125);
    ctx.bezierCurveTo(-10, 130, -65, 100, -80, 40);
    ctx.bezierCurveTo(-95, -20, -70, -90, 0, -125);
    ctx.closePath();
    ctx.fill();

    // Grille intérieure type dashboard
    ctx.fillStyle = 'rgba(15,19,24,0.85)';
    ctx.fillRect(-55, -55, 110, 110);

    // Barres de graphique
    const bars = [0.4, 0.7, 0.5, 0.95, 0.65, 0.8];
    const bw = 110 / bars.length;
    bars.forEach((v, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#00d4ff' : '#ff9500';
      const h = v * 100;
      ctx.fillRect(-55 + i * bw + 4, 55 - h, bw - 8, h);
    });

    ctx.restore();

    ctx.fillStyle = '#dde8f2';
    ctx.font = '700 28px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GRAFANA', cx, TEX_SIZE - 50);
    ctx.font = '400 14px "Space Mono", monospace';
    ctx.fillStyle = '#4d6a82';
    ctx.fillText('DASHBOARDS · API ZABBIX', cx, TEX_SIZE - 26);
  }

  // --- Face neutre "logo" perso (EM) ---
  function drawSignature(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2;
    ctx.fillStyle = 'transparent';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.font = '800 110px "Syne", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.strokeText('EM', 0, -10);
    ctx.font = '400 16px "Space Mono", monospace';
    ctx.fillStyle = '#4d6a82';
    ctx.fillText('SISR · BTS SIO', 0, 60);
    ctx.fillText('AFTEC CAEN 2024—2026', 0, 84);
    ctx.restore();
  }

  // --- Face neutre "réseau" (générique pour les facettes restantes) ---
  function drawNetwork(ctx) {
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    const nodes = [
      [0, -90], [-100, -10], [100, -10], [-60, 90], [60, 90], [0, 20]
    ];
    ctx.strokeStyle = 'rgba(0,212,255,0.45)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i][0], nodes[i][1]);
        ctx.lineTo(nodes[j][0], nodes[j][1]);
        ctx.stroke();
      }
    }
    nodes.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x, y, i === 5 ? 14 : 9, 0, Math.PI * 2);
      ctx.fillStyle = i === 5 ? '#00d4ff' : '#dde8f2';
      ctx.fill();
    });
    ctx.restore();
  }

  function textureFrom(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  const texAnsible   = textureFrom(makeFaceCanvas(drawAnsible, '#ff4d6d'));
  const texMinecraft = textureFrom(makeFaceCanvas(drawMinecraft, '#00e87a'));
  const texZabbix    = textureFrom(makeFaceCanvas(drawZabbix, '#d40000'));
  const texGrafana   = textureFrom(makeFaceCanvas(drawGrafana, '#ff9500'));
  const texSignature = textureFrom(makeFaceCanvas(drawSignature, '#00d4ff'));
  const texNetwork   = textureFrom(makeFaceCanvas(drawNetwork, '#00d4ff'));

  // ----------------------------------------------------------
  // Géométrie — Octaèdre tronqué (cuboctaèdre simplifié)
  // On utilise un BoxGeometry pour avoir 6 faces propres,
  // adoucies par bevel via segments + matériau type "verre"
  // ----------------------------------------------------------
  const geo = new THREE.BoxGeometry(3.6, 3.6, 3.6, 1, 1, 1);

  const materials = [
    new THREE.MeshStandardMaterial({ map: texAnsible,   metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ map: texZabbix,    metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ map: texMinecraft, metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ map: texGrafana,   metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ map: texSignature, metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ map: texNetwork,   metalness: 0.35, roughness: 0.4, emissive: 0x112233, emissiveIntensity: 0.4 }),
  ];

  const core = new THREE.Mesh(geo, materials);
  core.rotation.set(0.5, 0.8, 0);
  scene.add(core);

  // Cadre filaire externe (effet "facetté cristal")
  const edges = new THREE.EdgesGeometry(geo);
  const wire = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35 })
  );
  wire.scale.setScalar(1.015);
  core.add(wire);

  // Halo sphérique externe (verre)
  const haloGeo = new THREE.IcosahedronGeometry(3.0, 1);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);

  // Particules orbitales
  const particleCount = 60;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 3.4 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00d4ff, size: 0.045, transparent: true, opacity: 0.55,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ----------------------------------------------------------
  // Interaction souris — parallax doux
  // ----------------------------------------------------------
  let targetX = 0, targetY = 0;
  let mouseX = 0, mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ----------------------------------------------------------
  // Boucle d'animation
  // ----------------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    core.rotation.x = 0.5 + Math.sin(t * 0.25) * 0.08 + mouseY * 0.25;
    core.rotation.y = t * 0.18 + mouseX * 0.35;
    core.position.y = Math.sin(t * 0.6) * 0.18;

    halo.rotation.y = -t * 0.05;
    halo.rotation.x = t * 0.03;

    particles.rotation.y = t * 0.03;
    particles.rotation.x = t * 0.015;

    keyLight.position.x = Math.sin(t * 0.4) * 5 + 2;
    keyLight.position.z = Math.cos(t * 0.4) * 5 + 3;

    renderer.render(scene, camera);
  }
  animate();

  // ----------------------------------------------------------
  // Resize responsive
  // ----------------------------------------------------------
  function onResize() {
    const w = stageEl.clientWidth || 420;
    const h = stageEl.clientHeight || 420;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Apparition douce une fois prêt
  requestAnimationFrame(() => {
    stageEl.classList.add('ready');
  });

})();
