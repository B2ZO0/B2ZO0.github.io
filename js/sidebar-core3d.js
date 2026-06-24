/* ============================================================
   SIDEBAR CORE — Mini cristal tournant
   Petit octaèdre filaire animé sous le logo, en écho
   discret au noyau principal du hero.
   ============================================================ */

(function () {
  'use strict';

  const stageEl = document.getElementById('sidebar-core3d');
  if (!stageEl || typeof THREE === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = stageEl.clientWidth || 180;
  const H = stageEl.clientHeight || 130;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stageEl.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x223344, 1));
  const pl = new THREE.PointLight(0x00d4ff, 10, 20);
  pl.position.set(3, 3, 4);
  scene.add(pl);

  // Octaèdre filaire facetté
  const geo = new THREE.OctahedronGeometry(1.4, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0f1318,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0x00343f,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const wire = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.7 })
  );
  wire.scale.setScalar(1.01);
  mesh.add(wire);

  // Anneau orbital
  const ringGeo = new THREE.TorusGeometry(2.1, 0.01, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReduced) {
      mesh.rotation.x = t * 0.25;
      mesh.rotation.y = t * 0.35;
      ring.rotation.z = t * 0.15;
      mesh.position.y = Math.sin(t * 0.8) * 0.08;
    }

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = stageEl.clientWidth || 180;
    const h = stageEl.clientHeight || 130;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  requestAnimationFrame(() => stageEl.classList.add('ready'));

})();
