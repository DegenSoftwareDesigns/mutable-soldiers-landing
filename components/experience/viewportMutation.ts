import { packMotion } from "@/lib/experience/config";

// Viewport-wide stage of the pack glitch easter egg: a VHS-style tear and RGB
// split (SVG filter) over the sticky stage and the scrolling closing section,
// plus a fixed CRT signal-loss overlay above everything.
export type ViewportMutation = {
  update: (strength: number, age: number, elapsed: number) => void;
  release: () => void;
  dispose: () => void;
};

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(
  name: string,
  attributes: Record<string, string>,
  children: SVGElement[] = [],
) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  for (const child of children) element.appendChild(child);
  return element;
}

export function createViewportMutation(stage: HTMLElement): ViewportMutation {
  // The closing section scrolls outside the sticky stage, so it is filtered too.
  const findTargets = () => {
    const closing = stage.parentElement?.querySelector<HTMLElement>(
      ".closing-overlay",
    );
    return closing ? [stage, closing] : [stage];
  };
  let filteredTargets: HTMLElement[] = [];
  const tuning = packMotion.glitch;
  const filterId = `ms-mutation-${Math.random().toString(36).slice(2, 8)}`;

  const turbulence = svgElement("feTurbulence", {
    type: "fractalNoise",
    baseFrequency: "0 0.03",
    numOctaves: "1",
    seed: "1",
    result: "noise",
  });
  // Quantize the noise into hard horizontal bands; 0.5 means "no shift".
  const bands = svgElement(
    "feComponentTransfer",
    { in: "noise", result: "bands" },
    [
      svgElement("feFuncR", {
        type: "discrete",
        tableValues: "0.5 0.5 0.15 0.5 0.5 0.85 0.5 0.3 0.5 0.5",
      }),
      svgElement("feFuncG", { type: "table", tableValues: "0.5 0.5" }),
      svgElement("feFuncA", { type: "table", tableValues: "1 1" }),
    ],
  );
  const displacement = svgElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "bands",
    scale: "0",
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "torn",
  });
  const redOffset = svgElement("feOffset", {
    in: "red",
    dx: "0",
    result: "redShift",
  });
  const cyanOffset = svgElement("feOffset", {
    in: "cyan",
    dx: "0",
    result: "cyanShift",
  });
  const filter = svgElement(
    "filter",
    {
      id: filterId,
      x: "-5%",
      y: "0%",
      width: "110%",
      height: "100%",
      "color-interpolation-filters": "sRGB",
    },
    [
      turbulence,
      bands,
      displacement,
      svgElement("feColorMatrix", {
        in: "torn",
        type: "matrix",
        values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
        result: "red",
      }),
      redOffset,
      svgElement("feColorMatrix", {
        in: "torn",
        type: "matrix",
        values: "0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0",
        result: "cyan",
      }),
      cyanOffset,
      svgElement("feBlend", {
        in: "redShift",
        in2: "cyanShift",
        mode: "screen",
      }),
    ],
  );
  const svg = svgElement(
    "svg",
    { width: "0", height: "0", "aria-hidden": "true", class: "viewport-mutation-defs" },
    [svgElement("defs", {}, [filter])],
  );

  const overlay = document.createElement("div");
  overlay.className = "viewport-mutation";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="viewport-mutation__noise"></div>' +
    '<div class="viewport-mutation__scanlines"></div>' +
    '<div class="viewport-mutation__vignette"></div>' +
    '<img class="viewport-mutation__terror" alt="" decoding="async" />' +
    '<div class="viewport-mutation__label"></div>' +
    '<div class="viewport-mutation__flash"></div>';
  const noise = overlay.querySelector<HTMLElement>(".viewport-mutation__noise")!;
  const label = overlay.querySelector<HTMLElement>(".viewport-mutation__label")!;
  const terror = overlay.querySelector<HTMLImageElement>(
    ".viewport-mutation__terror",
  )!;
  // Load up front so the jump scare never waits on the network.
  terror.src = tuning.terrorSrc;
  const opacityLevels = tuning.terrorOpacityLevels;

  document.body.append(svg, overlay);

  let active = false;
  let lastStep = -Infinity;

  const clear = () => {
    if (!active) return;
    active = false;
    for (const target of filteredTargets) target.style.filter = "";
    filteredTargets = [];
    overlay.classList.remove("is-active");
    overlay.style.removeProperty("--mutation");
    label.textContent = "";
    terror.style.opacity = "0";
    terror.style.transform = "";
  };

  return {
    update(strength, age, elapsed) {
      if (strength <= 0) {
        clear();
        return;
      }
      overlay.style.setProperty("--mutation", strength.toFixed(3));
      if (!active) {
        active = true;
        overlay.classList.add("is-active");
      }
      // Stepped updates read as signal corruption rather than smooth motion.
      if (elapsed - lastStep < tuning.viewportStepSeconds) return;
      lastStep = elapsed;

      const spike = Math.random() < 0.15 ? 2 : 1;
      turbulence.setAttribute("seed", String(Math.floor(Math.random() * 1000)));
      turbulence.setAttribute(
        "baseFrequency",
        `0 ${(0.004 + Math.random() * 0.05).toFixed(4)}`,
      );
      displacement.setAttribute(
        "scale",
        (tuning.viewportTearPx * strength * spike * (0.3 + Math.random() * 0.7)).toFixed(1),
      );
      const split =
        tuning.viewportRgbSplitPx * strength * (0.4 + Math.random() * 0.6);
      redOffset.setAttribute("dx", split.toFixed(1));
      cyanOffset.setAttribute("dx", (-split).toFixed(1));
      const hue = (elapsed * tuning.viewportHueDegreesPerSecond) % 360;
      const filterValue =
        `url(#${filterId}) hue-rotate(${(hue * strength).toFixed(0)}deg) ` +
        `saturate(${(1 + 0.6 * strength).toFixed(2)}) ` +
        `contrast(${(1 + 0.18 * strength).toFixed(2)})`;
      filteredTargets = findTargets();
      for (const target of filteredTargets) target.style.filter = filterValue;
      noise.style.backgroundPosition =
        `${Math.floor(Math.random() * 200)}px ${Math.floor(Math.random() * 200)}px`;

      const showLabel =
        age >= tuning.viewportLabelDelay && Math.random() < 0.75;
      label.textContent = showLabel
        ? Math.random() < 0.5
          ? "SIGNAL LOST"
          : "MUTATION DETECTED"
        : "";

      // Full-screen apparition that flickers in stepped bursts.
      if (age >= tuning.terrorDelaySeconds) {
        if (Math.random() >= tuning.terrorHoldChance) {
          const level =
            opacityLevels[Math.floor(Math.random() * opacityLevels.length)];
          terror.style.opacity = String(level);
          const scale =
            1 + (Math.random() - 0.5) * 2 * tuning.terrorScaleJitter;
          terror.style.transform = `scale(${scale.toFixed(3)})`;
        }
      } else {
        terror.style.opacity = "0";
      }
    },
    release() {
      clear();
      overlay.classList.remove("is-flashing");
      // Restart the flash animation.
      void overlay.offsetWidth;
      overlay.classList.add("is-flashing");
    },
    dispose() {
      clear();
      svg.remove();
      overlay.remove();
    },
  };
}
