"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ExperienceAssetSet } from "@/lib/experience/assets";
import {
  experienceTuning,
  packMotion,
  rangeProgress,
  smoothstep,
} from "@/lib/experience/config";
import type { ExperienceProgressSignal } from "@/lib/experience/progress";
import {
  maxDprForProfile,
  type ExperienceProfile,
} from "@/lib/experience/profile";
import { createViewportMutation } from "./viewportMutation";

export type PackSceneReady = {
  usingFallbacks: boolean;
  errors: string[];
};

type PackSceneCanvasProps = {
  assetSet: ExperienceAssetSet;
  profile: ExperienceProfile;
  progressSignal: ExperienceProgressSignal;
  debug?: boolean;
  onReady: (result: PackSceneReady) => void;
};

type PackObject = {
  transform: THREE.Group;
  content: THREE.Group;
  emissiveMaterials: TintableMaterial[];
  materialStates: Array<{
    material: TintableMaterial;
    color: THREE.Color;
    emissive: THREE.Color;
  }>;
  lastOpacity: number | null;
  lastEmissiveIntensity: number | null;
  lastNeutralBlend: number | null;
  lastRenderOrder: number | null;
};

type TintableMaterial =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshPhongMaterial;

type PackDragState = {
  offset: THREE.Vector2;
  targetOffset: THREE.Vector2;
  tilt: THREE.Vector2;
  targetTilt: THREE.Vector2;
  energy: number;
  targetEnergy: number;
  dragging: boolean;
  glitch: PackGlitchState;
};

type PackGlitchState = {
  charge: number;
  active: boolean;
  age: number;
  shakeTime: number;
  strength: number;
  cooldown: number;
  jumpTimer: number;
  jumpOffset: THREE.Vector3;
  jumpRotation: number;
  jumpScale: number;
  tinted: boolean;
};

type ActivePackDrag = {
  pointerId: number;
  pack: PackObject;
  state: PackDragState;
  lastX: number;
  lastY: number;
  lastTime: number;
};

const violet = new THREE.Color(0x8b2cff);
const cyan = new THREE.Color(0x18e8dd);
const greenLightColor = new THREE.Color(0x39ffad);
const purpleLightColor = new THREE.Color(0xa23cff);
const fusionSilver = new THREE.Color(0x929eaa);
const fusionSilverEmissive = new THREE.Color(0x465565);

function createPackDragState(): PackDragState {
  return {
    offset: new THREE.Vector2(),
    targetOffset: new THREE.Vector2(),
    tilt: new THREE.Vector2(),
    targetTilt: new THREE.Vector2(),
    energy: 0,
    targetEnergy: 0,
    dragging: false,
    glitch: {
      charge: 0,
      active: false,
      age: 0,
      shakeTime: 0,
      strength: 0,
      cooldown: 0,
      jumpTimer: 0,
      jumpOffset: new THREE.Vector3(),
      jumpRotation: 0,
      jumpScale: 0,
      tinted: false,
    },
  };
}

function damp(current: number, target: number, damping: number, delta: number) {
  return THREE.MathUtils.lerp(
    current,
    target,
    1 - Math.exp(-damping * delta),
  );
}

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

  return {
    transform,
    content,
    emissiveMaterials: [bodyMaterial, trimMaterial],
    materialStates: [bodyMaterial, trimMaterial].map((material) => ({
      material,
      color: material.color.clone(),
      emissive: material.emissive.clone(),
    })),
    lastOpacity: null,
    lastEmissiveIntensity: null,
    lastNeutralBlend: null,
    lastRenderOrder: null,
  };
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

function collectMaterials(root: THREE.Object3D, accent: THREE.Color) {
  const result: PackObject["emissiveMaterials"] = [];
  const materialStates: PackObject["materialStates"] = [];
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
          material.emissive.copy(accent).multiplyScalar(0.14);
        }
        result.push(material);
        materialStates.push({
          material,
          color: material.color.clone(),
          emissive: material.emissive.clone(),
        });
      }
    }
  });
  return { emissiveMaterials: result, materialStates };
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
    const materials = collectMaterials(content, fallbackColor);

    return {
      pack: {
        transform,
        content,
        ...materials,
        lastOpacity: null,
        lastEmissiveIntensity: null,
        lastNeutralBlend: null,
        lastRenderOrder: null,
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
  if (
    pack.lastOpacity !== null &&
    Math.abs(pack.lastOpacity - opacity) < 0.0005
  ) {
    return;
  }
  pack.lastOpacity = opacity;
  pack.content.visible = opacity > 0.001;
  pack.content.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      material.opacity = opacity;
    }
  });
}

function setPackRenderOrder(pack: PackObject, renderOrder: number) {
  if (pack.lastRenderOrder === renderOrder) return;
  pack.lastRenderOrder = renderOrder;
  pack.content.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.renderOrder = renderOrder;
  });
}

function configurePackRendering(pack: PackObject, renderOrder: number) {
  setPackRenderOrder(pack, renderOrder);
  pack.content.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const material of materials) {
      material.transparent = true;
      material.depthTest = true;
      material.depthWrite = true;
      material.needsUpdate = true;
    }
  });
}

function setEmissive(pack: PackObject, intensity: number) {
  if (
    pack.lastEmissiveIntensity !== null &&
    Math.abs(pack.lastEmissiveIntensity - intensity) < 0.0005
  ) {
    return;
  }
  pack.lastEmissiveIntensity = intensity;
  for (const material of pack.emissiveMaterials) {
    material.emissiveIntensity = intensity;
  }
}

function setNeutralBlend(pack: PackObject, amount: number) {
  const blend = smoothstep(amount) * packMotion.fusion.neutralBlend;
  if (
    pack.lastNeutralBlend !== null &&
    Math.abs(pack.lastNeutralBlend - blend) < 0.0005
  ) {
    return;
  }
  pack.lastNeutralBlend = blend;
  for (const state of pack.materialStates) {
    state.material.color.copy(state.color).lerp(fusionSilver, blend);
    state.material.emissive
      .copy(state.emissive)
      .lerp(fusionSilverEmissive, blend * 0.7);
  }
}

function lerp(a: number, b: number, t: number) {
  return THREE.MathUtils.lerp(a, b, smoothstep(t));
}

function applyPackDrag(
  pack: PackObject,
  state: PackDragState,
  delta: number,
  heroActive: boolean,
  reduceMotion: boolean,
  lockPlacement: boolean,
) {
  if (!heroActive) {
    state.dragging = false;
    state.targetOffset.set(0, 0);
    state.targetTilt.set(0, 0);
    state.targetEnergy = 0;
  }

  const offsetDamping = state.dragging
    ? packMotion.interaction.followDamping
    : packMotion.interaction.returnDamping;
  const tiltDamping = state.dragging
    ? packMotion.interaction.tiltFollowDamping
    : packMotion.interaction.tiltReturnDamping;
  const energyDamping = state.targetEnergy > state.energy
    ? packMotion.interaction.energyAttackDamping
    : packMotion.interaction.energyReleaseDamping;

  state.offset.x = damp(
    state.offset.x,
    state.targetOffset.x,
    offsetDamping,
    delta,
  );
  state.offset.y = damp(
    state.offset.y,
    state.targetOffset.y,
    offsetDamping,
    delta,
  );
  state.tilt.x = damp(state.tilt.x, state.targetTilt.x, tiltDamping, delta);
  state.tilt.y = damp(state.tilt.y, state.targetTilt.y, tiltDamping, delta);
  state.energy = damp(
    state.energy,
    state.targetEnergy,
    energyDamping,
    delta,
  );

  const gestureMemory = Math.exp(
    -packMotion.interaction.gestureMemoryDamping * delta,
  );
  state.targetTilt.multiplyScalar(gestureMemory);
  state.targetEnergy *= gestureMemory;

  // The final-section packs keep their own placement; only tilt and glow react.
  if (!lockPlacement) {
    pack.transform.position.x += state.offset.x;
    pack.transform.position.y += state.offset.y;
  }
  const tiltScale = reduceMotion
    ? packMotion.interaction.reducedMotionTiltScale
    : 1;
  pack.transform.rotation.x += state.tilt.x * tiltScale;
  pack.transform.rotation.z += state.tilt.y * tiltScale;
  setEmissive(
    pack,
    (pack.lastEmissiveIntensity ?? packMotion.glow.base) +
      state.energy * packMotion.interaction.emissiveBoost,
  );
}

// Easter egg: shaking a pack hard enough for long enough overloads it into a
// "mutant" glitch that holds until the pack is released. Returns the glitch
// strength so the canvas can add screen-space RGB split and shake.
function applyPackGlitch(
  pack: PackObject,
  state: PackDragState,
  delta: number,
  elapsed: number,
  heroActive: boolean,
  reduceMotion: boolean,
  lockPlacement: boolean,
) {
  const glitch = state.glitch;
  const tuning = packMotion.glitch;

  glitch.cooldown = Math.max(0, glitch.cooldown - delta);
  if (!heroActive) {
    glitch.active = false;
    glitch.strength = 0;
    glitch.charge = 0;
  } else if (glitch.active) {
    glitch.age += delta;
    if (state.dragging && state.energy >= tuning.energyThreshold) {
      glitch.shakeTime += delta;
    }
    if (state.dragging) {
      glitch.strength = Math.min(
        1,
        glitch.strength + delta / tuning.fadeInSeconds,
      );
    } else {
      glitch.strength = Math.max(
        0,
        glitch.strength - delta / tuning.releaseFadeSeconds,
      );
      if (glitch.strength === 0) {
        glitch.active = false;
        glitch.cooldown = tuning.cooldown;
      }
    }
  } else if (
    state.dragging &&
    state.energy >= tuning.energyThreshold &&
    glitch.cooldown === 0
  ) {
    glitch.charge = Math.min(1, glitch.charge + delta / tuning.chargeSeconds);
    if (glitch.charge >= 1) {
      glitch.charge = 0;
      glitch.active = true;
      glitch.age = 0;
      glitch.shakeTime = 0;
      glitch.strength = 0;
      glitch.jumpTimer = 0;
    }
  } else {
    glitch.charge = Math.max(0, glitch.charge - delta * tuning.chargeDecay);
  }

  if (!glitch.active) {
    // Build-up hint: the pack starts to stutter as the charge nears overload.
    const buildUp = Math.max(0, (glitch.charge - 0.35) / 0.65);
    if (buildUp > 0 && !reduceMotion && !lockPlacement) {
      const jitter = tuning.previewJitter * buildUp * buildUp;
      pack.transform.position.x += (Math.random() - 0.5) * jitter;
      pack.transform.position.y += (Math.random() - 0.5) * jitter;
    }
    return 0;
  }

  const strength = glitch.strength;

  const hueShift = (elapsed * tuning.hueCyclesPerSecond) % 1;
  for (const materialState of pack.materialStates) {
    materialState.material.color
      .copy(materialState.color)
      .offsetHSL(hueShift * strength, tuning.saturationBoost * strength, 0);
    materialState.material.emissive
      .copy(materialState.emissive)
      .offsetHSL(hueShift * strength, tuning.saturationBoost * strength, 0);
  }
  // Force setNeutralBlend to restore the original tint on the next frame.
  pack.lastNeutralBlend = null;

  const flicker =
    Math.random() < 0.3 ? 1 : Math.random() * 0.4;
  setEmissive(
    pack,
    (pack.lastEmissiveIntensity ?? packMotion.glow.base) +
      flicker * tuning.emissiveFlicker * strength,
  );

  if (reduceMotion) return strength;

  glitch.jumpTimer -= delta;
  if (glitch.jumpTimer <= 0) {
    glitch.jumpTimer = tuning.jumpInterval * (0.5 + Math.random());
    if (Math.random() < 0.55) {
      glitch.jumpOffset.set(
        (Math.random() - 0.5) * 2 * tuning.jumpOffset,
        (Math.random() - 0.5) * 2 * tuning.jumpOffset,
        0,
      );
      glitch.jumpRotation = (Math.random() - 0.5) * 2 * tuning.jumpRotation;
      glitch.jumpScale = (Math.random() - 0.5) * 2 * tuning.jumpScale;
    } else {
      glitch.jumpOffset.set(0, 0, 0);
      glitch.jumpRotation = 0;
      glitch.jumpScale = 0;
    }
  }
  if (!lockPlacement) {
    pack.transform.position.addScaledVector(glitch.jumpOffset, strength);
    pack.transform.scale.multiplyScalar(1 + glitch.jumpScale * strength);
  }
  pack.transform.rotation.z += glitch.jumpRotation * strength;

  return strength;
}

function updatePackState(
  packA: PackObject,
  packB: PackObject,
  progress: number,
  elapsed: number,
  reduceMotion: boolean,
  layoutTuning: { xScale: number; objectScale: number; yOffset: number },
) {
  const reposition = rangeProgress(progress, packMotion.ranges.reposition);
  const permutation = rangeProgress(progress, packMotion.ranges.permutation);
  const depthHandoff = rangeProgress(
    progress,
    packMotion.ranges.depthHandoff,
  );
  const fusion = rangeProgress(progress, packMotion.ranges.fusion);
  const zoom = rangeProgress(progress, packMotion.ranges.zoom);
  const finalReveal = rangeProgress(progress, packMotion.ranges.finalReveal);
  const pulseEnvelope =
    smoothstep(rangeProgress(progress, packMotion.ranges.pulseIn)) *
    (1 - smoothstep(rangeProgress(progress, packMotion.ranges.pulseOut)));
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * packMotion.glow.pulseSpeed);

  const permutationComplete = progress >= packMotion.ranges.permutation[1];
  setPackRenderOrder(packA, permutationComplete ? 0 : 1);
  setPackRenderOrder(packB, permutationComplete ? 1 : 0);

  if (progress >= packMotion.ranges.finalReveal[0]) {
    setNeutralBlend(packA, 0);
    setNeutralBlend(packB, 0);
    packA.transform.position.set(
      packMotion.final.greenX * layoutTuning.xScale,
      packMotion.final.greenY + layoutTuning.yOffset,
      0,
    );
    packB.transform.position.set(
      packMotion.final.purpleX * layoutTuning.xScale,
      packMotion.final.purpleY + layoutTuning.yOffset,
      packMotion.final.purpleZ,
    );
    const finalScale = lerp(
      packMotion.final.scaleFrom,
      packMotion.final.scaleTo,
      finalReveal,
    );
    packA.transform.scale.setScalar(finalScale * layoutTuning.objectScale);
    packB.transform.scale.setScalar(finalScale * layoutTuning.objectScale);
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
    setOpacity(packA, 1);
    setOpacity(packB, 1);
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
  const permutedAX = lerp(baseAX, packMotion.permutation.greenX, permutation);
  const permutedBX = lerp(baseBX, packMotion.permutation.purpleX, permutation);
  const aX = lerp(permutedAX, 0, fusion) * layoutTuning.xScale;
  const bX = lerp(permutedBX, 0, fusion) * layoutTuning.xScale;
  const earlyScale = lerp(
    packMotion.hero.scale,
    packMotion.spread.scale,
    reposition,
  );
  const fusedScale = lerp(earlyScale, packMotion.fusion.scale, fusion);
  const zoomScale = lerp(fusedScale, packMotion.fusion.zoomScale, zoom);
  setNeutralBlend(packA, fusion);
  setNeutralBlend(packB, fusion);
  const floatEnvelope = 1 - fusion;
  const greenFloatY =
    Math.sin(elapsed * packMotion.presentation.greenFloatSpeed) *
    packMotion.presentation.floatYAmplitude *
    floatEnvelope;
  const purpleFloatY =
    Math.sin(elapsed * packMotion.presentation.purpleFloatSpeed + Math.PI * 0.72) *
    packMotion.presentation.floatYAmplitude *
    floatEnvelope;
  const greenFloatZ =
    Math.sin(elapsed * packMotion.presentation.greenFloatSpeed + 0.8) *
    packMotion.presentation.floatZAmplitude *
    floatEnvelope;
  const purpleFloatZ =
    Math.sin(elapsed * packMotion.presentation.purpleFloatSpeed + 2.6) *
    packMotion.presentation.floatZAmplitude *
    floatEnvelope;
  const permutationArc = reduceMotion
    ? 0
    : Math.sin(Math.PI * smoothstep(permutation));
  const greenBaseZ =
    lerp(packMotion.hero.greenZ, packMotion.spread.greenZ, reposition) +
    greenFloatZ;
  const purpleBaseZ =
    lerp(packMotion.hero.purpleZ, packMotion.spread.purpleZ, reposition) +
    purpleFloatZ;
  const greenPermutedZ = lerp(
    greenBaseZ,
    packMotion.permutation.greenZ,
    depthHandoff,
  );
  const purplePermutedZ = lerp(
    purpleBaseZ,
    packMotion.permutation.purpleZ,
    depthHandoff,
  );

  packA.transform.position.set(
    aX,
    lerp(
      packMotion.presentation.greenY +
        greenFloatY +
        permutationArc * packMotion.permutation.arcY,
      0,
      fusion,
    ) + layoutTuning.yOffset,
    lerp(greenPermutedZ, packMotion.fusion.greenZ, fusion),
  );
  packB.transform.position.set(
    bX,
    lerp(
      packMotion.presentation.purpleY +
        purpleFloatY -
        permutationArc * packMotion.permutation.arcY,
      0,
      fusion,
    ) + layoutTuning.yOffset,
    lerp(purplePermutedZ, packMotion.fusion.purpleZ, fusion) +
      lerp(0, packMotion.fusion.zoomZ, zoom),
  );
  const breathingScale =
    1 + pulseEnvelope * pulse * packMotion.glow.scaleAmplitude;
  packA.transform.scale.setScalar(
    fusedScale * breathingScale * layoutTuning.objectScale,
  );
  packB.transform.scale.setScalar(
    zoomScale * breathingScale * layoutTuning.objectScale,
  );
  packA.transform.rotation.set(
    packMotion.presentation.greenRotation[0],
    lerp(packMotion.presentation.greenRotation[1], 0, fusion) +
      Math.sin(elapsed * packMotion.presentation.greenHoverSpeed) *
        packMotion.presentation.hoverAmplitude *
        (1 - fusion),
    lerp(
      packMotion.presentation.greenRotation[2] -
        permutationArc * packMotion.permutation.roll,
      0,
      fusion,
    ),
  );
  packB.transform.rotation.set(
    packMotion.presentation.purpleRotation[0],
    lerp(packMotion.presentation.purpleRotation[1], 0, fusion) +
      Math.sin(elapsed * packMotion.presentation.purpleHoverSpeed + 1.2) *
        packMotion.presentation.hoverAmplitude *
        (1 - fusion),
    lerp(
      packMotion.presentation.purpleRotation[2] +
        permutationArc * packMotion.permutation.roll,
      0,
      fusion,
    ),
  );

  const glowRamp = rangeProgress(progress, packMotion.ranges.fusion);
  const intensity =
    packMotion.glow.base +
    pulseEnvelope * pulse * packMotion.glow.pulseAmplitude +
    glowRamp * packMotion.glow.fusionGain;
  setEmissive(packA, intensity);
  setEmissive(packB, intensity);
  setOpacity(
    packA,
    1 - smoothstep(rangeProgress(progress, packMotion.ranges.greenMergeFade)),
  );
  setOpacity(packB, 1);
}

export function PackSceneCanvas({
  assetSet,
  profile,
  progressSignal,
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
    const dragA = createPackDragState();
    const dragB = createPackDragState();
    let activeDrag: ActivePackDrag | null = null;
    let lastHoverRaycast = 0;
    const initialRootCursor = document.documentElement.style.cursor;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const interactionEnabled =
      profile.device === "desktop" && profile.inputMode === "fine";
    const dprCap = maxDprForProfile(profile);
    const layoutTuning =
      profile.device === "mobile"
        ? {
            fov: 42,
            designZ: 8,
            xScale: 0.5,
            objectScale: 0.55,
            yOffset: 1.25,
          }
        : profile.device === "tablet"
          ? {
              fov: 38,
              designZ: 7.6,
              xScale: 0.82,
              objectScale: 0.9,
              yOffset: 0,
            }
          : {
              fov: experienceTuning.camera.fov,
              designZ: experienceTuning.camera.designZ,
              xScale: 1,
              objectScale: 1,
              yOffset: 0,
            };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      layoutTuning.fov,
      1,
      experienceTuning.camera.near,
      experienceTuning.camera.far,
    );
    camera.position.set(0, 0, layoutTuning.designZ);
    camera.lookAt(0, 0, 0);

    const effectiveDpr = Math.min(
      window.devicePixelRatio,
      dprCap,
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: effectiveDpr < dprCap,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = experienceTuning.lighting.exposure;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(effectiveDpr);
    host.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Packs can be shaken in the hero and once they return in the final section.
    const packsInteractive = (progress = progressSignal.get()) =>
      progress <= packMotion.ranges.reposition[0] ||
      progress >= packMotion.ranges.finalReveal[0];

    const setPointerFromEvent = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      if (
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return false;
      }
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return true;
    };

    const hitTestPack = (event: PointerEvent) => {
      if (
        !interactionEnabled ||
        !packA ||
        !packB ||
        !packsInteractive() ||
        !setPointerFromEvent(event)
      ) {
        return null;
      }
      const hitA = raycaster.intersectObject(packA.transform, true)[0];
      const hitB = raycaster.intersectObject(packB.transform, true)[0];
      if (!hitA && !hitB) return null;
      if (!hitA) return { pack: packB, state: dragB };
      if (!hitB) return { pack: packA, state: dragA };
      return hitA.distance <= hitB.distance
        ? { pack: packA, state: dragA }
        : { pack: packB, state: dragB };
    };

    const restoreCursor = () => {
      document.documentElement.style.cursor = initialRootCursor;
    };

    const finishDrag = () => {
      if (!activeDrag) return;
      activeDrag.state.dragging = false;
      activeDrag.state.targetOffset.set(0, 0);
      activeDrag.state.targetTilt.set(0, 0);
      activeDrag.state.targetEnergy = 0;
      activeDrag = null;
      restoreCursor();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        activeDrag ||
        event.button !== 0 ||
        (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
        (event.target as Element | null)?.closest?.(
          "a, button, input, textarea, select",
        )
      ) {
        return;
      }
      const hit = hitTestPack(event);
      if (!hit) return;
      event.preventDefault();
      hit.state.dragging = true;
      hit.state.targetOffset.copy(hit.state.offset);
      hit.state.targetTilt.set(0, 0);
      activeDrag = {
        pointerId: event.pointerId,
        pack: hit.pack,
        state: hit.state,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: event.timeStamp,
      };
      document.documentElement.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!activeDrag) {
        if (
          event.pointerType !== "mouse" ||
          event.timeStamp - lastHoverRaycast < 50
        ) {
          return;
        }
        lastHoverRaycast = event.timeStamp;
        document.documentElement.style.cursor = hitTestPack(event)
          ? "grab"
          : initialRootCursor;
        return;
      }
      if (event.pointerId !== activeDrag.pointerId) return;
      event.preventDefault();
      if (!packsInteractive()) {
        finishDrag();
        return;
      }

      const deltaX = event.clientX - activeDrag.lastX;
      const deltaY = event.clientY - activeDrag.lastY;
      const deltaSeconds = Math.max(
        (event.timeStamp - activeDrag.lastTime) / 1000,
        1 / 240,
      );
      const bounds = renderer.domElement.getBoundingClientRect();
      const cameraDistance = Math.max(
        0.1,
        camera.position.z - activeDrag.pack.transform.position.z,
      );
      const worldHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        cameraDistance;
      const worldPerPixel = worldHeight / Math.max(bounds.height, 1);
      activeDrag.state.targetOffset.x += deltaX * worldPerPixel;
      activeDrag.state.targetOffset.y -= deltaY * worldPerPixel;
      activeDrag.state.targetOffset.clampLength(
        0,
        packMotion.interaction.maxOffset,
      );

      const velocityX = deltaX / deltaSeconds;
      const velocityY = deltaY / deltaSeconds;
      const speed = Math.hypot(velocityX, velocityY);
      const velocityScale = packMotion.interaction.speedForMaxGlow;
      activeDrag.state.targetEnergy = Math.max(
        activeDrag.state.targetEnergy,
        Math.min(1, speed / velocityScale),
      );
      activeDrag.state.targetTilt.set(
        THREE.MathUtils.clamp(
          -velocityY / velocityScale,
          -1,
          1,
        ) * packMotion.interaction.maxTiltX,
        THREE.MathUtils.clamp(
          -velocityX / velocityScale,
          -1,
          1,
        ) * packMotion.interaction.maxTiltZ,
      );
      activeDrag.lastX = event.clientX;
      activeDrag.lastY = event.clientY;
      activeDrag.lastTime = event.timeStamp;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === activeDrag?.pointerId) finishDrag();
    };

    if (interactionEnabled) {
      window.addEventListener("pointerdown", onPointerDown, { capture: true });
      window.addEventListener("pointermove", onPointerMove, {
        capture: true,
        passive: false,
      });
      window.addEventListener("pointerup", onPointerUp, { capture: true });
      window.addEventListener("pointercancel", onPointerUp, { capture: true });
      window.addEventListener("blur", finishDrag);
    }

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
    const greenAccent = new THREE.PointLight(
      greenLightColor,
      experienceTuning.lighting.greenAccentIntensity,
      6,
      2,
    );
    const purpleAccent = new THREE.PointLight(
      purpleLightColor,
      experienceTuning.lighting.purpleAccentIntensity,
      6,
      2,
    );
    const silverFusionLight = new THREE.PointLight(
      fusionSilver,
      0,
      8,
      2,
    );
    silverFusionLight.position.set(0, 0.1, 1.6);
    scene.add(
      hemisphere,
      key,
      fill,
      rim,
      greenAccent,
      purpleAccent,
      silverFusionLight,
    );

    if (debug) scene.add(new THREE.AxesHelper(2));

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, dprCap),
      );
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let canvasGlitchActive = false;
    let lastCanvasGlitchUpdate = 0;
    const clearCanvasGlitch = () => {
      if (!canvasGlitchActive) return;
      canvasGlitchActive = false;
      renderer.domElement.style.filter = "";
      renderer.domElement.style.transform = "";
    };
    const applyCanvasGlitch = (strength: number, elapsed: number) => {
      if (strength <= 0 || reducedMotionQuery.matches) {
        clearCanvasGlitch();
        return;
      }
      // Stepped updates read as digital corruption rather than smooth motion.
      if (canvasGlitchActive && elapsed - lastCanvasGlitchUpdate < 0.05) return;
      canvasGlitchActive = true;
      lastCanvasGlitchUpdate = elapsed;
      const split =
        packMotion.glitch.rgbSplitPx * strength * (0.4 + Math.random() * 0.6);
      const shake = packMotion.glitch.shakePx * strength;
      const shakeX = (Math.random() - 0.5) * 2 * shake;
      const shakeY = (Math.random() - 0.5) * shake;
      const skew = Math.random() < 0.25 ? (Math.random() - 0.5) * 8 * strength : 0;
      renderer.domElement.style.filter =
        `drop-shadow(${split.toFixed(1)}px 0 rgba(255, 0, 90, 0.8)) ` +
        `drop-shadow(${(-split).toFixed(1)}px 0 rgba(0, 255, 235, 0.8))`;
      renderer.domElement.style.transform =
        `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px) skewX(${skew.toFixed(2)}deg)`;
    };

    // Keep shaking an already glitched pack and the whole viewport mutates.
    const stage = host.closest<HTMLElement>(".experience-stage");
    const viewportMutation =
      interactionEnabled && stage ? createViewportMutation(stage) : null;
    let mutationStrength = 0;
    let mutationAge = 0;
    const updateViewportMutation = (delta: number, elapsed: number) => {
      if (!viewportMutation) return;
      const mutating =
        !reducedMotionQuery.matches &&
        [dragA, dragB].some(
          (state) =>
            state.dragging &&
            state.glitch.active &&
            state.glitch.shakeTime >= packMotion.glitch.viewportDelaySeconds,
        );
      if (!mutating) {
        if (mutationStrength > 0) {
          mutationStrength = 0;
          mutationAge = 0;
          viewportMutation.release();
        }
        return;
      }
      mutationAge += delta;
      mutationStrength = Math.min(
        1,
        mutationStrength + delta / packMotion.glitch.viewportFadeInSeconds,
      );
      viewportMutation.update(mutationStrength, mutationAge, elapsed);
    };

    const clock = new THREE.Clock();
    const isRenderActive = (progress: number) =>
      progress <= packMotion.ranges.webglFade[1] + 0.005 ||
      progress >= packMotion.ranges.finalReveal[0] - 0.005;

    let renderActive = isRenderActive(progressSignal.get());
    const render = () => {
      frame = 0;
      if (disposed) return;
      const progress = progressSignal.get();
      if (document.hidden || !renderActive) return;

      const delta = Math.min(clock.getDelta(), 1 / 30);
      const elapsed = clock.elapsedTime;
      if (packA && packB) {
        updatePackState(
          packA,
          packB,
          progress,
          elapsed,
          reducedMotionQuery.matches,
          layoutTuning,
        );
        const heroActive = packsInteractive(progress);
        const lockPlacement = progress >= packMotion.ranges.finalReveal[0];
        applyPackDrag(
          packA,
          dragA,
          delta,
          heroActive,
          reducedMotionQuery.matches,
          lockPlacement,
        );
        applyPackDrag(
          packB,
          dragB,
          delta,
          heroActive,
          reducedMotionQuery.matches,
          lockPlacement,
        );
        const glitchStrength = Math.max(
          applyPackGlitch(
            packA,
            dragA,
            delta,
            elapsed,
            heroActive,
            reducedMotionQuery.matches,
            lockPlacement,
          ),
          applyPackGlitch(
            packB,
            dragB,
            delta,
            elapsed,
            heroActive,
            reducedMotionQuery.matches,
            lockPlacement,
          ),
        );
        applyCanvasGlitch(glitchStrength, elapsed);
        updateViewportMutation(delta, elapsed);
        const fusionProgress =
          progress < packMotion.ranges.zoom[1]
            ? smoothstep(
                rangeProgress(progress, packMotion.ranges.fusion),
              )
            : 0;
        renderer.toneMappingExposure =
          experienceTuning.lighting.exposure * (1 + fusionProgress * 0.04);
        greenAccent.intensity =
          experienceTuning.lighting.greenAccentIntensity *
            (1 - fusionProgress * 0.82) +
          dragA.energy * packMotion.interaction.accentLightBoost;
        purpleAccent.intensity =
          experienceTuning.lighting.purpleAccentIntensity *
            (1 - fusionProgress * 0.82) +
          dragB.energy * packMotion.interaction.accentLightBoost;
        silverFusionLight.intensity =
          experienceTuning.lighting.fusionSilverIntensity * fusionProgress;
        greenAccent.position.copy(packA.transform.position);
        greenAccent.position.x -= 0.32;
        greenAccent.position.y += 0.2;
        greenAccent.position.z += 1.35;
        purpleAccent.position.copy(packB.transform.position);
        purpleAccent.position.x += 0.32;
        purpleAccent.position.y += 0.15;
        purpleAccent.position.z += 1.35;
      }
      rim.intensity =
        experienceTuning.lighting.rimIntensity +
        Math.sin(elapsed * experienceTuning.lighting.rimPulseSpeed) *
          experienceTuning.lighting.rimPulseAmplitude;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    const startRendering = () => {
      if (disposed || document.hidden || !renderActive || frame) return;
      frame = requestAnimationFrame(render);
    };

    const stopRendering = () => {
      clearCanvasGlitch();
      if (mutationStrength > 0) {
        mutationStrength = 0;
        mutationAge = 0;
        viewportMutation?.update(0, 0, 0);
      }
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const syncRenderActivity = (progress: number) => {
      if (!packsInteractive(progress)) finishDrag();
      const nextRenderActive = isRenderActive(progress);
      if (nextRenderActive === renderActive) return;
      renderActive = nextRenderActive;
      if (renderActive) startRendering();
      else stopRendering();
    };

    const unsubscribeProgress = progressSignal.subscribe(syncRenderActivity);

    Promise.all([
      loadPack(assetSet.assets.packA.src, cyan),
      loadPack(assetSet.assets.packB.src, violet),
    ]).then(([resultA, resultB]) => {
      if (disposed) {
        disposeObject(resultA.pack.transform);
        disposeObject(resultB.pack.transform);
        return;
      }
      packA = resultA.pack;
      packB = resultB.pack;
      configurePackRendering(packB, 0);
      configurePackRendering(packA, 1);
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
        stopRendering();
      } else {
        startRendering();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    startRendering();

    return () => {
      disposed = true;
      stopRendering();
      unsubscribeProgress();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      window.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      window.removeEventListener("pointerup", onPointerUp, { capture: true });
      window.removeEventListener("pointercancel", onPointerUp, {
        capture: true,
      });
      window.removeEventListener("blur", finishDrag);
      restoreCursor();
      viewportMutation?.dispose();
      resizeObserver.disconnect();
      if (packA) disposeObject(packA.transform);
      if (packB) disposeObject(packB.transform);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      scene.clear();
    };
  }, [assetSet, debug, profile, progressSignal]);

  return <div ref={hostRef} className="pack-canvas" aria-hidden="true" />;
}
