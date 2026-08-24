"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

type GlassCardProps = {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
};

type TiltHandler = (rotationX: number, rotationY: number) => void;

export function GlassCard({
  className = "",
  children,
  interactive = true,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<TiltHandler | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  useGSAP(
    (_context, contextSafe) => {
      const card = cardRef.current;
      if (!card || !interactive) return;
      if (!contextSafe) return;

      gsap.set(card, { transformPerspective: 900, transformOrigin: "50% 50%" });
      const rotateXTo = gsap.quickTo(card, "rotationX", {
        duration: 0.5,
        ease: "power3.out",
      });
      const rotateYTo = gsap.quickTo(card, "rotationY", {
        duration: 0.5,
        ease: "power3.out",
      });

      tiltRef.current = contextSafe((rotationX: number, rotationY: number) => {
        rotateXTo(rotationX);
        rotateYTo(rotationY);
      }) as TiltHandler;
      resetRef.current = contextSafe(() => {
        rotateXTo(0);
        rotateYTo(0);
      }) as () => void;

      return () => {
        tiltRef.current = null;
        resetRef.current = null;
      };
    },
    { scope: cardRef, dependencies: [interactive], revertOnUpdate: true },
  );

  return (
    <div
      ref={cardRef}
      className={`glass-card ${className}`}
      onPointerMove={(event) => {
        if (!interactive || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        tiltRef.current?.(-y * 4.5, x * 5.5);
      }}
      onPointerLeave={() => resetRef.current?.()}
    >
      <div className="glass-card__shine" aria-hidden="true" />
      <div className="glass-card__content">{children}</div>
    </div>
  );
}

type CTAButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function CTAButton({ children, variant = "primary" }: CTAButtonProps) {
  return (
    <button className={`cta-button cta-button--${variant}`} type="button">
      <span>{children}</span>
    </button>
  );
}
