"use client";

import { GlassTiltCard } from "@/assets/glass-tilt-card";
import { TiltCard } from "@/components/spectrumui/tilt-card";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
  flat?: boolean;
};

export function GlassCard({
  className = "",
  children,
  interactive = true,
  flat = false,
}: GlassCardProps) {
  const enableTilt = interactive && !flat;

  return (
    <GlassTiltCard
      className={`glass-card-stage ${flat ? "glass-card-stage--flat" : ""} ${className}`}
      cardClassName={`glass-card ${flat ? "glass-card--flat-surface" : ""}`}
      contentMode="intrinsic"
      idleFloat={enableTilt}
      interactive={enableTilt}
      maxTilt={8}
    >
      <div className="glass-card__content">{children}</div>
    </GlassTiltCard>
  );
}

type LayeredGlassCardProps = {
  className?: string;
  children: React.ReactNode;
  maxTilt?: number;
  perspective?: number;
  restRotateX?: number;
  restRotateY?: number;
};

export function LayeredGlassCard({
  className,
  children,
  maxTilt = 12,
  perspective = 1000,
  restRotateX = 0,
  restRotateY = 0,
}: LayeredGlassCardProps) {
  return (
    <TiltCard
      containerClassName="glass-card-stage spectrum-layered-card-stage"
      className={cn(
        "glass-card spectrum-hero-card spectrum-layered-card",
        className,
      )}
      maxTilt={maxTilt}
      scale={1.02}
      perspective={perspective}
      restRotateX={restRotateX}
      restRotateY={restRotateY}
      glareColor="rgba(164, 115, 255, 0.28)"
      unstyled
    >
      <div
        aria-hidden="true"
        className="spectrum-hero-card__surface spectrum-layered-card__surface"
      />
      <div className="glass-card__content spectrum-hero-card__content spectrum-layered-card__content">
        {children}
      </div>
    </TiltCard>
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
