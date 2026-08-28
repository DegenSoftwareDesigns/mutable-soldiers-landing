"use client";

import Image from "next/image";
import { GlassTiltCard } from "@/assets/glass-tilt-card";

const pendingPages = ["Waitlist", "Artists", "Drops"] as const;
const pendingCommunityLinks = ["Army X", "Telegram", "xrp.cafe"] as const;

function PendingFooterLink({ label }: { label: string }) {
  return (
    <button
      className="site-footer-link"
      type="button"
      disabled
      title={`${label} link coming soon`}
    >
      {label}
    </button>
  );
}

export function SiteFooter() {
  return (
    <footer className="story-card site-footer" data-card="footer">
      <div className="story-card__motion site-footer__motion" data-card-motion>
        <GlassTiltCard
          className="site-footer-glass"
          cardClassName="site-footer-surface"
          contentMode="intrinsic"
          idleFloat={false}
          interactive={false}
        >
          <div className="site-footer-inner">
            <a className="site-footer-brand" href="#hero" aria-label="Mutable Soldiers home">
              <Image
                className="site-footer-brand__logo"
                src="/assets/Logo.svg"
                width={339}
                height={100}
                alt=""
                priority
              />
            </a>

            <nav className="site-footer-column" aria-label="Footer pages">
              <h2>Pages</h2>
              <a className="site-footer-link" href="#hero">
                Home
              </a>
              {pendingPages.map((page) => (
                <PendingFooterLink label={page} key={page} />
              ))}
            </nav>

            <nav className="site-footer-column" aria-label="Community links">
              <h2>Links</h2>
              {pendingCommunityLinks.map((link) => (
                <PendingFooterLink label={link} key={link} />
              ))}
            </nav>
          </div>
        </GlassTiltCard>
      </div>
    </footer>
  );
}
