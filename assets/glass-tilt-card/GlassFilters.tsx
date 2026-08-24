/**
 * Filtros SVG de refracción usados por <GlassTiltCard />.
 *
 * IMPORTANTE: montar este componente UNA sola vez, cerca de la raíz del árbol
 * (ej. en app/layout.tsx). Las tarjetas referencian estos filtros por id vía
 * `backdrop-filter: url(#glass-distortion)`, y los ids son globales al
 * documento — no hace falta (ni conviene) repetir este componente por cada
 * tarjeta que uses en la página.
 */
export function GlassFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.012"
          numOctaves={2}
          seed={7}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={2} result="blurredNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          scale={18}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      <filter id="glass-distortion-2" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.014 0.02"
          numOctaves={2}
          seed={41}
          result="noise2"
        />
        <feGaussianBlur in="noise2" stdDeviation={1.5} result="blurredNoise2" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise2"
          scale={10}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
