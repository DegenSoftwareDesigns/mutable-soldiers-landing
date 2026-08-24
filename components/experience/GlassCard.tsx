"use client";

import { GlassTiltCard } from "@/assets/glass-tilt-card";

type GlassCardProps = {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
};

export function GlassCard({
  className = "",
  children,
  interactive = true,
}: GlassCardProps) {
  return (
    <GlassTiltCard
      className={`glass-card-stage ${className}`}
      cardClassName="glass-card"
      contentMode="intrinsic"
      idleFloat={interactive}
      interactive={interactive}
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
