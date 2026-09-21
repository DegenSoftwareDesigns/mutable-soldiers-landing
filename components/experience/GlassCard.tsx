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
  interactive?: boolean;
};

export function LayeredGlassCard({
  className,
  children,
  maxTilt = 12,
  perspective = 1000,
  restRotateX = 0,
  restRotateY = 0,
  interactive = true,
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
      interactive={interactive}
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

type StaticGlassCardProps = {
  className?: string;
  cardClassName?: string;
  children: React.ReactNode;
};

export function StaticGlassCard({
  className,
  cardClassName,
  children,
}: StaticGlassCardProps) {
  return (
    <div className={cn("static-glass-card-stage", className)}>
      <div
        className={cn(
          "static-glass-card spectrum-hero-card",
          cardClassName,
        )}
      >
        <div aria-hidden="true" className="spectrum-hero-card__surface" />
        <div className="static-glass-card__content">{children}</div>
      </div>
    </div>
  );
}

type CTAButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function CTAButton({
  children,
  variant = "primary",
  className,
  ...buttonProps
}: CTAButtonProps) {
  return (
    <button
      className={cn("cta-button", `cta-button--${variant}`, className)}
      type="button"
      {...buttonProps}
    >
      <span>{children}</span>
    </button>
  );
}
