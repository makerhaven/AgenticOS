"use client";

import React from "react";
import * as THREE from "three";

export interface GalaxyData {
  nodes: { id: string; title: string; folder: string; lastTouched: string; degree: number }[];
  edges: { source: string; target: string }[];
  noteCount: number;
  linkCount: number;
  builtAt: string;
}

/**
 * The Memory Galaxy — the Obsidian vault as a 3D star map.
 * Every note a star, every [[wikilink]] a constellation line.
 * Recent notes burn brighter and whiter. Drag to orbit, scroll to zoom,
 * click a star to open the note, double-click to pause the slow auto-flight.
 */

const FOLDER_COLORS: Record<string, number> = {
  Goals: 0xd4a574,
  Journal: 0xc4607e,
  "Business Context": 0xe6c69a,
  Decisions: 0x5ab896,
  Memory: 0xf3ebda,
  inbox: 0xc97c5e,
};

function recencyGlow(mtime: string): number {
  const days = (Date.now() - new Date(mtime).getTime()) / 86400000;
  return Math.max(0.25, Math.min(1, 1.2 - days / 14)); // fresher → brighter
}

export default function Galaxy({
  data,
  onOpen,
}: {
  data: GalaxyData;
  onOpen: (slug: string) => void;
}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const pausedRef = React.useRef(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount || data.nodes.length === 0) return;

    const width = mount.clientWidth;
    const height = 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0612);
    scene.fog = new THREE.FogExp2(0x0a0612, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 4000);
    camera.position.set(0, 40, 420);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Ambient starfield backdrop
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 2000;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xa59783, size: 1.2, transparent: true, opacity: 0.5 })
    );
    scene.add(stars);

    // Layout: deterministic pseudo-random spread, folders clustered
    const folderCenters = new Map<string, THREE.Vector3>();
    const folders = [...new Set(data.nodes.map((n) => n.folder || "root"))];
    folders.forEach((f, i) => {
      const angle = (i / folders.length) * Math.PI * 2;
      folderCenters.set(
        f,
        new THREE.Vector3(Math.cos(angle) * 140, (Math.random() - 0.5) * 80, Math.sin(angle) * 140)
      );
    });

    const positions = new Map<string, THREE.Vector3>();
    data.nodes.forEach((n, i) => {
      const c = folderCenters.get(n.folder || "root") ?? new THREE.Vector3();
      const p = new THREE.Vector3(
        c.x + (Math.random() - 0.5) * 120,
        c.y + (Math.random() - 0.5) * 120,
        c.z + (Math.random() - 0.5) * 120
      );
      positions.set(n.id, p);

      const glow = recencyGlow(n.lastTouched);
      const baseColor = new THREE.Color(FOLDER_COLORS[n.folder] ?? 0xf3ebda);
      // fresher → whiter
      const color = baseColor.clone().lerp(new THREE.Color(0xffffff), glow * 0.55);

      const geo = new THREE.SphereGeometry(1.6 + Math.min(n.degree, 8) * 0.5, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 + glow * 0.45 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(p);
      mesh.userData = { id: n.id, title: n.title };
      scene.add(mesh);

      // halo for recently touched
      if (glow > 0.7) {
        const haloGeo = new THREE.SphereGeometry(4 + Math.min(n.degree, 8), 10, 10);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08 * glow,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(p);
        scene.add(halo);
      }
    });

    // Constellation lines
    const linePositions: number[] = [];
    for (const e of data.edges) {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (!a || !b) continue;
      linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    scene.add(
      new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0xd4a574, transparent: true, opacity: 0.18 })
      )
    );

    // Orbit controls (minimal, hand-rolled)
    let theta = 0.6;
    let phi = 1.2;
    let radius = 420;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => (dragging = false);
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      theta -= (e.clientX - lastX) * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi - (e.clientY - lastY) * 0.005));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(80, Math.min(900, radius + e.deltaY * 0.5));
    };

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 2 };
    const mouse = new THREE.Vector2();

    const pick = (e: MouseEvent): THREE.Intersection | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = scene.children.filter((c) => c instanceof THREE.Mesh && c.userData.id);
      const hits = raycaster.intersectObjects(meshes, false);
      return hits[0] ?? null;
    };

    let moved = false;
    const onClick = (e: MouseEvent) => {
      if (moved) return;
      const hit = pick(e);
      if (hit) onOpen((hit.object as THREE.Mesh).userData.id);
    };
    const onHover = (e: MouseEvent) => {
      const hit = pick(e);
      setHovered(hit ? (hit.object as THREE.Mesh).userData.title : null);
      mount.style.cursor = hit ? "pointer" : "grab";
    };
    const onDbl = () => setPaused((p) => !p);

    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("mousemove", onHover);
    renderer.domElement.addEventListener("dblclick", onDbl);
    renderer.domElement.addEventListener("pointermove", () => (moved = true));
    renderer.domElement.addEventListener("pointerdown", () => (moved = false));

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!pausedRef.current) theta += 0.0009; // slow auto-flight
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("mousemove", onHover);
      renderer.domElement.removeEventListener("dblclick", onDbl);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [data, onOpen]);

  if (data.nodes.length === 0) {
    return (
      <div className="h-[560px] flex items-center justify-center rounded-2xl bg-[#0a0612] border border-line-soft">
        <div className="text-center">
          <div className="text-3xl text-gold mb-3">✦</div>
          <p className="text-cream-mute text-sm max-w-[40ch]">
            The galaxy is dark. Add notes with [[links]] to your vault and the constellations ignite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 z-10 pointer-events-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-1">
          ✦ Memory Galaxy
        </div>
        <div className="font-mono text-[11px] text-cream-dim mb-1">
          {data.noteCount} stars · {data.linkCount} links
        </div>
        <div className="text-[11px] text-cream-mute">
          drag to orbit · scroll to zoom · click a star · double-click to pause flight
          <br />
          ✦ brighter &amp; whiter = more recently touched
        </div>
      </div>
      {hovered && (
        <div className="absolute right-4 top-4 z-10 rounded-lg border border-gold/40 bg-bg-deep/90 px-3 py-1.5 font-mono text-xs text-gold pointer-events-none">
          {hovered}
        </div>
      )}
      {paused && (
        <div className="absolute bottom-4 right-4 z-10 rounded-full border border-line bg-bg-deep/90 px-3 py-1 font-mono text-[10px] text-cream-dim pointer-events-none">
          ⏸ flight paused
        </div>
      )}
      <div ref={mountRef} className="w-full overflow-hidden rounded-2xl border border-line-soft" />
    </div>
  );
}
