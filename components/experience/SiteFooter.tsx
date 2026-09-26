"use client";

import Image from "next/image";
import Link from "next/link";
import { StaticGlassCard } from "./GlassCard";

const pendingPages = ["Artists", "Drops"] as const;
// A null href renders a disabled "coming soon" button.
const communityLinks: ReadonlyArray<{ label: string; href: string | null }> = [
  { label: "Army X", href: "https://x.com/ARMY_XRP589" },
  { label: "Telegram", href: null },
  { label: "xrp.cafe", href: null },
  {
    label: "Stats",
    href: "https://bithomp.com/token/rGG3wQ4kUzd7Jnmk1n5NWPZjjut62kCBfC/41524D5900000000000000000000000000000000",
  },
];

type SiteFooterProps = {
  placement?: "story" | "page" | "closing";
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
    <StaticGlassCard
      className="site-footer-glass"
      cardClassName="site-footer-surface"
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
              {communityLinks.map(({ label, href }) =>
                href ? (
                  <a
                    className="site-footer-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={label}
                  >
                    {label}
                  </a>
                ) : (
                  <PendingFooterLink label={label} key={label} />
                ),
              )}
            </nav>
      </div>
    </StaticGlassCard>
  );

  if (placement === "page") {
    return <footer className="site-footer site-footer--page">{footerCard}</footer>;
  }

  if (placement === "closing") {
    return (
      <footer className="site-footer site-footer--closing">{footerCard}</footer>
    );
  }

  return (
    <footer className="story-card site-footer" data-card="footer">
      <div className="story-card__motion site-footer__motion" data-card-motion>
        {footerCard}
      </div>
    </footer>
  );
}
