"use client";

import { GlassTiltCard } from "@/assets/glass-tilt-card";

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
