"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlassTiltCard } from "@/assets/glass-tilt-card";
import { CTAButton } from "./GlassCard";

const pendingPages = ["Artists", "Drops"] as const;

export function SiteNavbar() {
  const pathname = usePathname();
  const homeIsActive = pathname === "/";
  const waitlistIsActive = pathname === "/waitlist";

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
          <Link className="site-navbar-brand" href="/#hero" aria-label="Mutable Soldiers home">
            <Image
              className="site-navbar-brand__logo"
              src="/assets/Logo-navbar.svg"
              width={309}
              height={100}
              alt=""
              priority
            />
          </Link>

          <nav className="site-navbar-nav" aria-label="Primary navigation">
            <Link
              className={`site-navbar-link ${homeIsActive ? "is-active" : ""}`}
              href="/#hero"
              aria-current={homeIsActive ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              className={`site-navbar-link ${waitlistIsActive ? "is-active" : ""}`}
              href="/waitlist"
              aria-current={waitlistIsActive ? "page" : undefined}
            >
              Waitlist
            </Link>
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
