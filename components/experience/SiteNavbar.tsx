"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlassTiltCard } from "@/assets/glass-tilt-card";
import type { ExperienceDevice } from "@/lib/experience/profile";
import { CTAButton } from "./GlassCard";

const pendingPages = ["Artists", "Drops"] as const;

type SiteNavbarProps = {
  device?: ExperienceDevice;
};

export function SiteNavbar({ device }: SiteNavbarProps = {}) {
  const pathname = usePathname();
  const homeIsActive = pathname === "/";
  const waitlistIsActive = pathname === "/waitlist";
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMenuOpen(false), [pathname, device]);

  useEffect(() => {
    if (device === "mobile" || device === "tablet") return;

    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    desktopQuery.addEventListener("change", closeAtDesktop);
    return () => desktopQuery.removeEventListener("change", closeAtDesktop);
  }, [device]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };

    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [menuOpen]);

  return (
    <header className="site-navbar-shell" data-device={device} ref={shellRef}>
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

          <nav
            className="site-navbar-nav site-navbar-nav--desktop"
            aria-label="Primary navigation"
          >
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

          <div className="site-navbar-wallet site-navbar-wallet--desktop">
            <CTAButton>Connect Wallet</CTAButton>
          </div>

          <button
            ref={toggleRef}
            className="site-navbar-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-navigation-panel"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>Menu</span>
            <span className="site-navbar-toggle__icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </GlassTiltCard>

      <div
        id="site-navigation-panel"
        className={`site-navbar-panel ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <GlassTiltCard
          className="site-navbar-panel__glass"
          cardClassName="site-navbar-panel__surface"
          contentMode="intrinsic"
          idleFloat={false}
          interactive={false}
        >
          <div className="site-navbar-panel__inner">
            <nav
              className="site-navbar-nav site-navbar-nav--menu"
              aria-label="Mobile and tablet navigation"
            >
              <Link
                className={`site-navbar-link ${homeIsActive ? "is-active" : ""}`}
                href="/#hero"
                aria-current={homeIsActive ? "page" : undefined}
                tabIndex={menuOpen ? undefined : -1}
                onClick={() => setMenuOpen(false)}
              >
                <span>Home</span>
                <span aria-hidden="true">01</span>
              </Link>
              <Link
                className={`site-navbar-link ${waitlistIsActive ? "is-active" : ""}`}
                href="/waitlist"
                aria-current={waitlistIsActive ? "page" : undefined}
                tabIndex={menuOpen ? undefined : -1}
                onClick={() => setMenuOpen(false)}
              >
                <span>Waitlist</span>
                <span aria-hidden="true">02</span>
              </Link>
              {pendingPages.map((page, index) => (
                <button
                  className="site-navbar-link"
                  type="button"
                  disabled
                  title={`${page} page coming soon`}
                  tabIndex={menuOpen ? undefined : -1}
                  key={page}
                >
                  <span>{page}</span>
                  <span aria-hidden="true">0{index + 3}</span>
                </button>
              ))}
            </nav>

            <div className="site-navbar-wallet site-navbar-wallet--menu">
              <CTAButton tabIndex={menuOpen ? undefined : -1}>
                Connect Wallet
              </CTAButton>
            </div>
          </div>
        </GlassTiltCard>
      </div>
    </header>
  );
}
