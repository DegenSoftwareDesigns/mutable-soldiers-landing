"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assetByKey } from "@/lib/experience/assets";
import {
  experienceTuning,
  packMotion,
  rangeProgress,
  smoothstep,
} from "@/lib/experience/config";

export type PackSceneReady = {
  usingFallbacks: boolean;
  errors: string[];
};

type PackSceneCanvasProps = {
  progressRef: React.MutableRefObject<number>;
  debug?: boolean;
  onReady: (result: PackSceneReady) => void;
};

type PackObject = {
  transform: THREE.Group;
  content: THREE.Group;
  emissiveMaterials: Array<
    THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshPhongMaterial
  >;
};

const violet = new THREE.Color(0x8b2cff);
const cyan = new THREE.Color(0x18e8dd);

function createFallbackPack(color: THREE.Color): PackObject {
  const transform = new THREE.Group();
  const content = new THREE.Group();
  transform.add(content);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: color.clone().multiplyScalar(0.42),
    emissive: color,
    emissiveIntensity: 0.75,
    metalness: 0.5,
    roughness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xeefaff,
    emissive: color,
    emissiveIntensity: 1.2,
    metalness: 0.7,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.35, 0.18), bodyMaterial);
  body.castShadow = true;
  content.add(body);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.035, 16, 72),
    trimMaterial,
  );
  ring.position.z = 0.12;
  content.add(ring);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.018, 12, 64),
    trimMaterial,
  );
  innerRing.position.z = 0.13;
  content.add(innerRing);

  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.1), trimMaterial);
  notch.position.set(0, 1.02, 0.13);
  content.add(notch);

  return { transform, content, emissiveMaterials: [bodyMaterial, trimMaterial] };
}

function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of childMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

function cloneMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = false;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
  });
}

function collectEmissiveMaterials(root: THREE.Object3D, accent: THREE.Color) {
  const result: PackObject["emissiveMaterials"] = [];
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial ||
        material instanceof THREE.MeshPhongMaterial
      ) {
        if (material.emissive.getHex() === 0) {
          material.emissive.copy(accent).multiplyScalar(0.08);
        }
        result.push(material);
      }
    }
  });
  return result;
}

async function loadPack(url: string, fallbackColor: THREE.Color) {
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(url);
    const transform = new THREE.Group();
    const content = gltf.scene;
    cloneMaterials(content);

    const bounds = new THREE.Box3().setFromObject(content);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    content.position.sub(center);
    content.scale.setScalar(2.45 / maxDimension);
    transform.add(content);

    return {
      pack: {
        transform,
        content,
        emissiveMaterials: collectEmissiveMaterials(content, fallbackColor),
      } satisfies PackObject,
      fallback: false,
      error: null,
    };
  } catch (error) {
    return {
      pack: createFallbackPack(fallbackColor),
      fallback: true,
      error: error instanceof Error ? error.message : `Unable to load ${url}`,
    };
  }
}

function setOpacity(pack: PackObject, opacity: number) {
  pack.content.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.96;
    }
  });
}

function setEmissive(pack: PackObject, intensity: number) {
  for (const material of pack.emissiveMaterials) {
    material.emissiveIntensity = intensity;
  }
}

function lerp(a: number, b: number, t: number) {
  return THREE.MathUtils.lerp(a, b, smoothstep(t));
}

function updatePackState(
  packA: PackObject,
  packB: PackObject,
  progress: number,
  elapsed: number,
) {
  const reposition = rangeProgress(progress, packMotion.ranges.reposition);
  const fusion = rangeProgress(progress, packMotion.ranges.fusion);
  const zoom = rangeProgress(progress, packMotion.ranges.zoom);
  const finalReveal = rangeProgress(progress, packMotion.ranges.finalReveal);
  const pulseEnvelope =
    smoothstep(rangeProgress(progress, packMotion.ranges.pulseIn)) *
    (1 - smoothstep(rangeProgress(progress, packMotion.ranges.pulseOut)));

  if (progress >= packMotion.ranges.finalReveal[0]) {
    packA.transform.position.set(packMotion.spread.greenX, packMotion.final.greenY, 0);
    packB.transform.position.set(
      packMotion.spread.purpleX,
      packMotion.final.purpleY,
      packMotion.final.purpleZ,
    );
    const finalScale = lerp(
      packMotion.final.scaleFrom,
      packMotion.final.scaleTo,
      finalReveal,
    );
    packA.transform.scale.setScalar(finalScale);
    packB.transform.scale.setScalar(finalScale);
    packA.transform.rotation.set(
      packMotion.final.greenRotation[0],
      packMotion.final.greenRotation[1] +
        Math.sin(elapsed * packMotion.final.greenHoverSpeed) *
          packMotion.final.hoverAmplitude,
      packMotion.final.greenRotation[2],
    );
    packB.transform.rotation.set(
      packMotion.final.purpleRotation[0],
      packMotion.final.purpleRotation[1] +
        Math.sin(elapsed * packMotion.final.purpleHoverSpeed + 1) *
          packMotion.final.hoverAmplitude,
      packMotion.final.purpleRotation[2],
    );
    setOpacity(packA, finalReveal);
    setOpacity(packB, finalReveal);
    setEmissive(packA, packMotion.final.emissiveIntensity);
    setEmissive(packB, packMotion.final.emissiveIntensity);
    return;
  }

  if (progress >= 0.5) {
    setOpacity(packA, 0);
    setOpacity(packB, 0);
    return;
  }

  const heroAX = packMotion.hero.greenX;
  const heroBX = packMotion.hero.purpleX;
  const spreadAX = packMotion.spread.greenX;
  const spreadBX = packMotion.spread.purpleX;
  const baseAX = lerp(heroAX, spreadAX, reposition);
  const baseBX = lerp(heroBX, spreadBX, reposition);
  const aX = lerp(baseAX, 0, fusion);
  const bX = lerp(baseBX, 0, fusion);
  const earlyScale = lerp(
    packMotion.hero.scale,
    packMotion.spread.scale,
    reposition,
  );
  const fusedScale = lerp(earlyScale, packMotion.fusion.scale, fusion);
  const zoomScale = lerp(fusedScale, packMotion.fusion.zoomScale, zoom);

  packA.transform.position.set(
    aX,
    lerp(packMotion.presentation.greenY, 0, fusion),
    lerp(0, packMotion.fusion.zoomZ, zoom),
  );
  packB.transform.position.set(
    bX,
    lerp(packMotion.presentation.purpleY, 0, fusion),
    0,
  );
  packA.transform.scale.setScalar(zoomScale);
  packB.transform.scale.setScalar(
    lerp(earlyScale, packMotion.fusion.scale, fusion),
  );
  packA.transform.rotation.set(
    packMotion.presentation.greenRotation[0],
    lerp(packMotion.presentation.greenRotation[1], 0, fusion) +
      Math.sin(elapsed * packMotion.presentation.greenHoverSpeed) *
        packMotion.presentation.hoverAmplitude *
        (1 - fusion),
    lerp(packMotion.presentation.greenRotation[2], 0, fusion),
  );
  packB.transform.rotation.set(
    packMotion.presentation.purpleRotation[0],
    lerp(packMotion.presentation.purpleRotation[1], 0, fusion) +
      Math.sin(elapsed * packMotion.presentation.purpleHoverSpeed + 1.2) *
        packMotion.presentation.hoverAmplitude *
        (1 - fusion),
    lerp(packMotion.presentation.purpleRotation[2], 0, fusion),
  );

  const pulse =
    0.5 + 0.5 * Math.sin(elapsed * packMotion.glow.pulseSpeed);
  const glowRamp = rangeProgress(progress, packMotion.ranges.fusion);
  const intensity =
    packMotion.glow.base +
    pulseEnvelope * pulse * packMotion.glow.pulseAmplitude +
    glowRamp * packMotion.glow.fusionGain;
  setEmissive(packA, intensity);
  setEmissive(packB, intensity);
  setOpacity(
    packA,
    1 - smoothstep(rangeProgress(progress, packMotion.ranges.webglFade)),
  );
  setOpacity(
    packB,
    1 - smoothstep(rangeProgress(progress, packMotion.ranges.purpleMergeFade)),
  );
}

export function PackSceneCanvas({
  progressRef,
  debug = false,
  onReady,
}: PackSceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let packA: PackObject | null = null;
    let packB: PackObject | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      experienceTuning.camera.fov,
      1,
      experienceTuning.camera.near,
      experienceTuning.camera.far,
    );
    camera.position.set(0, 0, experienceTuning.camera.designZ);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = experienceTuning.lighting.exposure;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, experienceTuning.maxDpr));
    host.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(
      0xbcc9ff,
      0x12051f,
      experienceTuning.lighting.hemisphereIntensity,
    );
    const key = new THREE.DirectionalLight(
      0xd8f7ff,
      experienceTuning.lighting.keyIntensity,
    );
    key.position.set(3.5, 4.5, 6);
    const fill = new THREE.DirectionalLight(
      0x824dff,
      experienceTuning.lighting.fillIntensity,
    );
    fill.position.set(-4, 1.5, 4);
    const rim = new THREE.PointLight(
      0x16f4e8,
      experienceTuning.lighting.rimIntensity,
      18,
      2,
    );
    rim.position.set(2.5, -1.8, 2.2);
    scene.add(hemisphere, key, fill, rim);

    if (debug) scene.add(new THREE.AxesHelper(2));

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, experienceTuning.maxDpr),
      );
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const clock = new THREE.Clock();
    let previousElapsed = 0;
    const render = () => {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();
      const delta = Math.min(0.05, elapsed - previousElapsed);
      previousElapsed = elapsed;
      if (packA && packB) {
        updatePackState(packA, packB, progressRef.current, elapsed);
      }
      rim.intensity =
        experienceTuning.lighting.rimIntensity +
        Math.sin(elapsed * experienceTuning.lighting.rimPulseSpeed) *
          experienceTuning.lighting.rimPulseAmplitude;
      renderer.render(scene, camera);
      if (delta >= 0) frame = requestAnimationFrame(render);
    };

    Promise.all([
      loadPack(assetByKey.packA.src, cyan),
      loadPack(assetByKey.packB.src, violet),
    ]).then(([resultA, resultB]) => {
      if (disposed) {
        disposeObject(resultA.pack.transform);
        disposeObject(resultB.pack.transform);
        return;
      }
      packA = resultA.pack;
      packB = resultB.pack;
      scene.add(packA.transform, packB.transform);
      onReadyRef.current({
        usingFallbacks: resultA.fallback || resultB.fallback,
        errors: [resultA.error, resultB.error].filter(
          (value): value is string => Boolean(value),
        ),
      });
    });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
      } else {
        clock.getDelta();
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      if (packA) disposeObject(packA.transform);
      if (packB) disposeObject(packB.transform);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      scene.clear();
    };
  }, [debug, progressRef]);

  return <div ref={hostRef} className="pack-canvas" aria-hidden="true" />;
}
