"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assetByKey } from "@/lib/experience/assets";

const PACK_HEIGHT = 2.4;
const TEAR_Y = 0.9;
const CARD_WIDTH = 1.3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const CARD_RADIUS = 0.05;
const FACE_WIDTH = 1200;
const FACE_HEIGHT = 1800;

let packPromise: Promise<THREE.Group> | null = null;

export function preloadPack() {
  if (packPromise) return packPromise;
  packPromise = new GLTFLoader()
    .loadAsync(assetByKey.packB.src)
    .then((gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      model.position.sub(bounds.getCenter(new THREE.Vector3()));
      const wrapper = new THREE.Group();
      wrapper.add(model);
      wrapper.scale.setScalar(PACK_HEIGHT / bounds.getSize(new THREE.Vector3()).y);
      return wrapper;
    });
  packPromise.catch(() => {
    packPromise = null;
  });
  return packPromise;
}

type CardLine = {
  text: string;
  font: string;
  size: number;
  y: number;
  tracking: string;
};

function spotsLabel(spots: number) {
  return `${spots} ${spots === 1 ? "spot" : "spots"} assigned`;
}

export function cardMessage(spots: number) {
  return spots > 0
    ? `Congratulations, ${spotsLabel(spots)}`
    : "Ouch, no spots assigned yet";
}

// Bakes the result text into the empty bottom panel of the card artwork.
async function drawCardFace(spots: number) {
  const image = new Image();
  image.src =
    spots > 0
      ? "/assets/waitlist/card-spots.webp"
      : "/assets/waitlist/card-empty.webp";
  await Promise.all([
    image.decode(),
    document.fonts.load('400 80px "Audiowide"'),
    document.fonts.load('700 60px "Rajdhani"'),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = FACE_WIDTH;
  canvas.height = FACE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(image, 0, 0, FACE_WIDTH, FACE_HEIGHT);

  const lines: CardLine[] =
    spots > 0
      ? [
          { text: "CONGRATULATIONS", font: "700 {size}px Rajdhani", size: 56, y: 1480, tracking: "10px" },
          { text: spotsLabel(spots).toUpperCase(), font: "400 {size}px Audiowide", size: 84, y: 1568, tracking: "0px" },
        ]
      : [
          { text: "OUCH", font: "400 {size}px Audiowide", size: 100, y: 1488, tracking: "6px" },
          { text: "NO SPOTS ASSIGNED YET", font: "700 {size}px Rajdhani", size: 58, y: 1584, tracking: "6px" },
        ];

  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const line of lines) {
    context.letterSpacing = line.tracking;
    context.font = line.font.replace("{size}", String(line.size));
    const fitted = Math.min(line.size, (line.size * 740) / context.measureText(line.text).width);
    context.font = line.font.replace("{size}", String(fitted));

    const half = context.measureText(line.text).width / 2;
    const fill = context.createLinearGradient(600 - half, 0, 600 + half, 0);
    if (spots > 0) {
      fill.addColorStop(0, "#d9c6ff");
      fill.addColorStop(0.5, "#c4f5e8");
      fill.addColorStop(1, "#f3cdf0");
    } else {
      fill.addColorStop(0, "#9ea3ab");
      fill.addColorStop(0.5, "#eef0f3");
      fill.addColorStop(1, "#9ea3ab");
    }

    // Debossed look: dark lip above, light lip below, then the face.
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillText(line.text, 600, line.y - 2);
    context.fillStyle = "rgba(255, 255, 255, 0.22)";
    context.fillText(line.text, 600, line.y + 3);
    context.fillStyle = fill;
    context.fillText(line.text, 600, line.y);
  }

  return canvas;
}

function createCard(face: THREE.Texture, hasSpots: boolean) {
  const w = CARD_WIDTH / 2;
  const h = CARD_HEIGHT / 2;
  const r = CARD_RADIUS;
  const shape = new THREE.Shape()
    .moveTo(-w + r, -h)
    .lineTo(w - r, -h)
    .absarc(w - r, -h + r, r, -Math.PI / 2, 0, false)
    .lineTo(w, h - r)
    .absarc(w - r, h - r, r, 0, Math.PI / 2, false)
    .lineTo(-w + r, h)
    .absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false)
    .lineTo(-w, -h + r)
    .absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: false,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.007);
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, position.getX(i) / CARD_WIDTH + 0.5, position.getY(i) / CARD_HEIGHT + 0.5);
  }

  const faceMaterial = new THREE.MeshPhysicalMaterial(
    hasSpots
      ? {
          map: face,
          metalness: 0.15,
          roughness: 0.35,
          clearcoat: 0.8,
          clearcoatRoughness: 0.15,
          iridescence: 0.4,
          iridescenceIOR: 1.35,
          iridescenceThicknessRange: [180, 560],
        }
      : {
          map: face,
          metalness: 0.4,
          roughness: 0.62,
          clearcoat: 0.25,
          clearcoatRoughness: 0.5,
        },
  );
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: hasSpots ? 0xd8d4f0 : 0x2b2e34,
    metalness: 0.9,
    roughness: 0.28,
  });

  return new THREE.Mesh(geometry, [faceMaterial, edgeMaterial]);
}

// Clone of the pack clipped by a plane, so the top strip can tear away.
function clippedPiece(source: THREE.Object3D, plane: THREE.Plane) {
  const piece = source.clone(true);
  const materials: THREE.Material[] = [];
  const clip = (material: THREE.Material) => {
    const copy = material.clone();
    copy.clippingPlanes = [plane];
    copy.side = THREE.DoubleSide;
    copy.transparent = true;
    materials.push(copy);
    return copy;
  };
  piece.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = Array.isArray(child.material)
      ? child.material.map(clip)
      : clip(child.material);
  });
  return { piece, materials };
}

function setOpacity(materials: THREE.Material[], opacity: number) {
  for (const material of materials) material.opacity = opacity;
}

type PackRevealProps = {
  spots: number;
  onRevealed: () => void;
};

export function PackReveal({ spots, onRevealed }: PackRevealProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onRevealedRef = useRef(onRevealed);
  const [staticFace, setStaticFace] = useState<string | null>(null);
  onRevealedRef.current = onRevealed;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanupScene = () => {};

    const showStatic = async () => {
      try {
        const face = await drawCardFace(spots);
        if (!disposed) setStaticFace(face.toDataURL("image/webp", 0.9));
      } finally {
        if (!disposed) onRevealedRef.current();
      }
    };

    const run = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await showStatic();
        return;
      }

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        await showStatic();
        return;
      }

      const [pack, face] = await Promise.all([preloadPack(), drawCardFace(spots)]).catch(
        () => [null, null] as const,
      );
      if (disposed) {
        renderer.dispose();
        return;
      }
      if (!pack || !face) {
        renderer.dispose();
        await showStatic();
        return;
      }

      const hasSpots = spots > 0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.localClippingEnabled = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = environment;
      scene.environmentIntensity = 0.35;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      const hemisphere = new THREE.HemisphereLight(0xbcc9ff, 0x12051f, 0.7);
      const key = new THREE.DirectionalLight(0xe6f6ff, 1.8);
      key.position.set(2.5, 3.5, 5);
      const glint = new THREE.PointLight(hasSpots ? 0xe9dcff : 0xb8c4d6, 4, 9, 2);
      glint.position.set(1.4, 1.2, 4);
      scene.add(hemisphere, key, glint);

      const faceTexture = new THREE.CanvasTexture(face);
      faceTexture.colorSpace = THREE.SRGBColorSpace;
      faceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const packGroup = new THREE.Group();
      const bottomPlane = new THREE.Plane();
      const topPlane = new THREE.Plane();
      const bottom = clippedPiece(pack, bottomPlane);
      const top = clippedPiece(pack, topPlane);
      const topHolder = new THREE.Group();
      topHolder.position.y = TEAR_Y;
      top.piece.position.y = -TEAR_Y;
      topHolder.add(top.piece);

      const card = createCard(faceTexture, hasSpots);
      card.position.y = -0.17;
      packGroup.add(bottom.piece, topHolder, card);
      scene.add(packGroup);

      const localBottomPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), TEAR_Y);
      const localTopPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const fade = { pack: 1, top: 1 };

      // Narrow screens: bring the card close enough to fill the width.
      const stageBounds = host.getBoundingClientRect();
      const stageAspect = stageBounds.width / Math.max(stageBounds.height, 1);
      const cameraZ = 8 * Math.max(1, 0.62 / stageAspect);
      const cardDistance =
        stageAspect < 0.8
          ? Math.max(3.9, CARD_WIDTH / (0.92 * 0.536 * stageAspect))
          : 5.6;
      const cardFinalZ = cameraZ - cardDistance;

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = 8 * Math.max(1, 0.62 / camera.aspect);
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const pointer = new THREE.Vector2();
      const onPointerMove = (event: PointerEvent) => {
        const bounds = host.getBoundingClientRect();
        pointer.set(
          THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
          THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
        );
      };
      window.addEventListener("pointermove", onPointerMove);

      let revealed = false;
      const timeline = gsap.timeline({
        onComplete: () => {
          revealed = true;
          onRevealedRef.current();
        },
      });
      timeline
        .from(packGroup.position, { y: -0.5, duration: 0.6, ease: "power3.out" }, 0)
        .from(packGroup.scale, { x: 0.86, y: 0.86, z: 0.86, duration: 0.6, ease: "back.out(1.7)" }, 0)
        .to(packGroup.rotation, { z: 0.03, duration: 0.05, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0.6)
        .to(topHolder.position, { x: 0.75, y: TEAR_Y + 0.5, z: 0.25, duration: 0.7, ease: "power2.out" }, 1.05)
        .to(topHolder.rotation, { z: -0.7, x: 0.35, duration: 0.7, ease: "power2.out" }, 1.05)
        .to(fade, { top: 0, duration: 0.45, ease: "power1.in" }, 1.3)
        .to(card.position, { y: 1, duration: 0.85, ease: "power2.out" }, 1.15)
        .call(() => {
          scene.attach(card);
        }, undefined, 2)
        .to(packGroup.position, { y: -4.2, duration: 0.9, ease: "power2.in" }, 2)
        .to(fade, { pack: 0, duration: 0.6, ease: "power1.in" }, 2.2)
        .to(card.position, { y: 0, z: cardFinalZ, duration: 1, ease: "power3.inOut" }, 2.05)
        .to(card.rotation, { x: -0.2, y: 0.28, duration: 0.5, ease: "sine.out" }, 2.05)
        .to(card.rotation, { x: 0, y: 0, duration: 0.8, ease: "back.out(2)" }, 2.55);
      if (hasSpots) {
        timeline.fromTo(glint, { intensity: 4 }, { intensity: 24, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }, 2.75);
      }

      const clock = new THREE.Clock();
      let frame = 0;
      const render = () => {
        frame = requestAnimationFrame(render);
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;

        setOpacity(top.materials, fade.top);
        setOpacity(bottom.materials, fade.pack);
        packGroup.visible = fade.pack > 0;
        topHolder.visible = fade.top > 0;
        packGroup.updateMatrixWorld();
        bottomPlane.copy(localBottomPlane).applyMatrix4(packGroup.matrixWorld);
        topPlane.copy(localTopPlane).applyMatrix4(topHolder.matrixWorld);

        if (revealed) {
          const ease = 1 - Math.exp(-6 * delta);
          card.rotation.x += (pointer.y * 0.22 - card.rotation.x) * ease;
          card.rotation.y += (pointer.x * 0.3 - card.rotation.y) * ease;
          card.position.y = Math.sin(elapsed * 1.2) * 0.025;
          glint.position.x += (1.4 + pointer.x * 2 - glint.position.x) * ease;
          glint.position.y += (1.2 - pointer.y * 2 - glint.position.y) * ease;
        }

        renderer.render(scene, camera);
      };
      render();

      cleanupScene = () => {
        cancelAnimationFrame(frame);
        timeline.kill();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        for (const material of [...top.materials, ...bottom.materials]) material.dispose();
        card.geometry.dispose();
        for (const material of card.material as THREE.Material[]) material.dispose();
        faceTexture.dispose();
        environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    void run();
    return () => {
      disposed = true;
      cleanupScene();
    };
  }, [spots]);

  return (
    <div
      ref={hostRef}
      className="pack-reveal"
      role="img"
      aria-label={`Mutable Soldiers card: ${cardMessage(spots)}`}
    >
      {staticFace ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pack-reveal__static" src={staticFace} alt="" />
      ) : null}
    </div>
  );
}
