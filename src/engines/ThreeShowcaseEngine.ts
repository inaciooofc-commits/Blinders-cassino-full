export class ThreeShowcaseEngine {
  private host: HTMLElement;
  private cleanup: (() => void) | null = null;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  async mount() {
    await this.destroy();

    const THREE = await import('three');
    const width = Math.max(320, this.host.clientWidth);
    const height = Math.max(260, this.host.clientHeight || 360);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05020a, 5, 18);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.4, 7.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    this.host.innerHTML = '';
    this.host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffd7a0, 1.2);
    scene.add(ambient);

    const redLight = new THREE.PointLight(0xff4500, 3, 12);
    redLight.position.set(-3.5, 3.5, 2);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x29a9ff, 2.2, 10);
    blueLight.position.set(3.5, 2.8, 2.8);
    scene.add(blueLight);

    const tableMat = new THREE.MeshStandardMaterial({ color: 0x120812, metalness: 0.65, roughness: 0.28 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.18 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, emissive: 0x3b0000, metalness: 0.45, roughness: 0.35 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0c3455, emissive: 0x062a44, metalness: 0.65, roughness: 0.22 });

    const table = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 3.15, 0.35, 96), tableMat);
    table.position.y = -0.45;
    scene.add(table);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.045, 12, 120), goldMat);
    trim.position.y = -0.24;
    trim.rotation.x = Math.PI / 2;
    scene.add(trim);

    const roulette = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.14, 96), redMat);
    roulette.position.set(-1.05, -0.16, 0.22);
    scene.add(roulette);

    const rouletteTrim = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.035, 10, 96), goldMat);
    rouletteTrim.position.set(-1.05, -0.07, 0.22);
    rouletteTrim.rotation.x = Math.PI / 2;
    scene.add(rouletteTrim);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), blueMat);
    crystal.position.set(1.08, 0.52, -0.18);
    scene.add(crystal);

    const chips = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.055, 32), i % 2 ? redMat : goldMat);
      chip.position.set(0.7 + (i % 4) * 0.12, -0.12 + i * 0.055, 0.74 + Math.floor(i / 4) * 0.16);
      chips.add(chip);
    }
    scene.add(chips);

    const cards = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.02, 0.76),
        new THREE.MeshStandardMaterial({ color: 0xf5efe2, metalness: 0.05, roughness: 0.45 })
      );
      card.position.set(-0.18 + i * 0.24, -0.16 + i * 0.015, 0.95 + i * 0.035);
      card.rotation.y = -0.24 + i * 0.08;
      cards.add(card);
    }
    scene.add(cards);

    const seal = new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.018, 120, 12), goldMat);
    seal.position.set(0, 1.22, -0.78);
    scene.add(seal);

    const resize = () => {
      const w = Math.max(320, this.host.clientWidth);
      const h = Math.max(260, this.host.clientHeight || 360);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', resize, { passive: true });

    let raf = 0;
    const loop = () => {
      const t = performance.now() / 1000;
      roulette.rotation.y += 0.03;
      rouletteTrim.rotation.z += 0.03;
      crystal.rotation.x += 0.012;
      crystal.rotation.y += 0.017;
      crystal.position.y = 0.54 + Math.sin(t * 1.6) * 0.12;
      seal.rotation.x += 0.006;
      seal.rotation.y += 0.01;
      chips.rotation.y = Math.sin(t) * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    this.cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse(obj => {
        const mesh = obj as any;
        if (mesh.geometry) mesh.geometry.dispose?.();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m: any) => m.dispose?.());
          else mesh.material.dispose?.();
        }
      });
      this.host.innerHTML = '';
    };
  }

  async destroy() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}
