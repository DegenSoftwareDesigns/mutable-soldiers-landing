"use client";

import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import styles from "./GlassTiltCard.module.css";

export interface GlassTiltCardProps {
  /** Contenido dentro de la tarjeta (imagen, texto, lo que sea). Opcional. */
  children?: ReactNode;
  /** Clases extra para el contenedor exterior (.stage) -- ahí va el tamaño. */
  className?: string;
  /** Grados máximos de inclinación en cada eje. Default 12. */
  maxTilt?: number;
  /** Si se apaga, la tarjeta queda quieta cuando no hay hover (sin el "float" idle). */
  idleFloat?: boolean;
  /** Permite que el contenido defina la altura de la tarjeta. */
  contentMode?: "fill" | "intrinsic";
  /** Clase opcional aplicada directamente a la superficie de cristal. */
  cardClassName?: string;
  /** Desactiva tilt, reflejos ligados al cursor y float cuando es false. */
  interactive?: boolean;
}

const MAX_SHADOW = 26;
const REST_TRANSFORM = "perspective(1200px) rotateX(2deg) rotateY(-3deg) scale(1)";
const RETURN_TRANSITION_MS = 650; // debe matchear la duration del transition en .card (600ms) + margen

export function GlassTiltCard({
  children,
  className,
  maxTilt = 12,
  idleFloat = true,
  contentMode = "fill",
  cardClassName,
  interactive = true,
}: GlassTiltCardProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const idleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El rect se toma de .stage, que JAMÁS se transforma -> siempre estable,
  // sin importar cuánto esté rotada la tarjeta en ese instante. Ver el
  // comentario largo sobre esto en GlassTiltCard.module.css.
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (
        !interactive ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const stage = stageRef.current;
      const card = cardRef.current;
      if (!stage || !card) return;

      const rect = stage.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const cx = Math.min(Math.max(px, 0), 1);
      const cy = Math.min(Math.max(py, 0), 1);

      const rotateY = (cx - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - cy) * maxTilt * 2;

      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
      card.style.setProperty("--mx", `${cx * 100}%`);
      card.style.setProperty("--my", `${cy * 100}%`);

      const sx = -rotateY * (MAX_SHADOW / maxTilt);
      const sy = 22 + rotateX * (MAX_SHADOW / maxTilt) * -1;
      card.style.setProperty("--sx", `${sx}px`);
      card.style.setProperty("--sy", `${sy}px`);
      card.style.setProperty("--sb", `${40 + Math.abs(rotateY)}px`);

      const tiltAmount = (Math.abs(rotateX) + Math.abs(rotateY)) / (maxTilt * 2);
      card.style.setProperty("--ca", `${0.15 + tiltAmount * 0.55}`);
    },
    [interactive, maxTilt]
  );

  const activate = useCallback(() => {
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    cardRef.current?.classList.add(styles.isActive);
  }, []);

  const release = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = REST_TRANSFORM;
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
    card.style.setProperty("--sx", "0px");
    card.style.setProperty("--sy", "22px");
    card.style.setProperty("--sb", "40px");
    card.style.setProperty("--ca", "0.15");

    if (idleTimeout.current) clearTimeout(idleTimeout.current);

    if (!idleFloat) return; // se queda quieta en la posición de reposo

    // deja terminar la transición de retorno y recién ahí retoma la
    // animación idle, así no compiten transform inline vs. animation
    idleTimeout.current = setTimeout(() => {
      card.classList.remove(styles.isActive);
      card.style.transform = "";
    }, RETURN_TRANSITION_MS);
  }, [idleFloat]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      activate();
      handleMove(touch.clientX, touch.clientY);
    },
    [activate, handleMove]
  );

  return (
    <div
      ref={stageRef}
      className={[
        styles.stage,
        contentMode === "intrinsic" ? styles.intrinsic : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={interactive ? activate : undefined}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseLeave={interactive ? release : undefined}
      onTouchMove={interactive ? handleTouchMove : undefined}
      onTouchEnd={interactive ? release : undefined}
    >
      <div
        ref={cardRef}
        className={[styles.card, !idleFloat ? styles.isActive : "", cardClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.glassTint} />
        <div className={styles.glassTint2} />
        {children && <div className={styles.content}>{children}</div>}
        <div className={styles.specular} />
        <div className={styles.glint} />
        <div className={styles.chromatic} />
        <div className={styles.edge} />
      </div>
    </div>
  );
}
