"use client";

import Image from "next/image";
import Link from "next/link";
import { GlassTiltCard } from "@/assets/glass-tilt-card";

const pendingPages = ["Artists", "Drops"] as const;
const pendingCommunityLinks = ["Army X", "Telegram", "xrp.cafe"] as const;

type SiteFooterProps = {
  placement?: "story" | "page";
};

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

export function SiteFooter({ placement = "story" }: SiteFooterProps) {
  const footerCard = (
    <GlassTiltCard
      className="site-footer-glass"
      cardClassName="site-footer-surface"
      contentMode="intrinsic"
      idleFloat={false}
      interactive={false}
    >
      <div className="site-footer-inner">
            <Link className="site-footer-brand" href="/#hero" aria-label="Mutable Soldiers home">
              <Image
                className="site-footer-brand__logo"
                src="/assets/Logo.svg"
                width={339}
                height={100}
                alt=""
                priority
              />
            </Link>

            <nav className="site-footer-column" aria-label="Footer pages">
              <h2>Pages</h2>
              <Link className="site-footer-link" href="/#hero">
                Home
              </Link>
              <Link className="site-footer-link" href="/waitlist">
                Waitlist
              </Link>
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
  );

  if (placement === "page") {
    return <footer className="site-footer site-footer--page">{footerCard}</footer>;
  }

  return (
    <footer className="story-card site-footer" data-card="footer">
      <div className="story-card__motion site-footer__motion" data-card-motion>
        {footerCard}
      </div>
    </footer>
  );
}
