"use client";

import { GlassTiltCard } from "@/assets/glass-tilt-card";
import { CTAButton } from "./GlassCard";

const pendingPages = ["Waitlist", "Artists", "Drops"] as const;

export function SiteNavbar() {
  return (
    <header className="site-navbar-shell">
      <GlassTiltCard
        className="site-navbar-glass"
        cardClassName="site-navbar-surface"
        contentMode="intrinsic"
        idleFloat={false}
        interactive={false}
      >
        <div className="site-navbar-inner">
          <a className="site-navbar-brand" href="#hero" aria-label="Mutable Soldiers home">
            <span className="site-navbar-brand__mark" aria-hidden="true">
              MS
            </span>
            <span className="site-navbar-brand__name">Mutable Soldiers</span>
          </a>

          <nav className="site-navbar-nav" aria-label="Primary navigation">
            <a className="site-navbar-link is-active" href="#hero" aria-current="page">
              Home
            </a>
            {pendingPages.map((page) => (
              <button
                className="site-navbar-link"
                type="button"
                disabled
                title={`${page} page coming soon`}
                key={page}
              >
                {page}
              </button>
            ))}
          </nav>

          <div className="site-navbar-wallet">
            <CTAButton>Connect Wallet</CTAButton>
          </div>
        </div>
      </GlassTiltCard>
    </header>
  );
}
