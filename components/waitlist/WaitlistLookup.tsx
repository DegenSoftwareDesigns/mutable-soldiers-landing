"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/experience/GlassCard";
import {
  cardMessage,
  PackReveal,
  preloadPack,
} from "@/components/waitlist/PackReveal";
import { lookupSpots, shareImage } from "@/lib/waitlist/spots";

const xrplClassicAddress = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

// TODO: replace the placeholder hrefs with the real community links.
const waysToGetASpot = [
  { label: "Follow Army X", href: "#" },
  { label: "Join the Telegram", href: "#" },
  { label: "Watch xrp.cafe", href: "#" },
];

type Status = "idle" | "loading" | "error" | "result";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// X can't attach images through an intent: the card comes from the link's
// Open Graph image, so the link must point at a public URL.
function shareUrl(spots: number) {
  const link = `${window.location.origin}/waitlist?spots=${spots}`;
  const text = `⚔️I've got ${spots} ${spots === 1 ? "spot" : "spots"} for the new $ARMY Mutable Soldiers NFT Collection ⚔️

What about you? 👉${link}`;
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

export function WaitlistLookup() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [invalid, setInvalid] = useState(false);
  const [spots, setSpots] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void preloadPack().catch(() => {});
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAddress = address.trim();

    if (!xrplClassicAddress.test(normalizedAddress)) {
      setInvalid(true);
      return;
    }

    setAddress(normalizedAddress);
    setStatus("loading");
    try {
      setSpots(await lookupSpots(normalizedAddress));
      setRevealed(false);
      setStatus("result");
    } catch {
      setStatus("error");
    }
  };

  const checkAnother = () => {
    setAddress("");
    setStatus("idle");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const feedback = invalid
    ? "Enter a valid classic XRPL wallet address."
    : status === "error"
      ? "We couldn't reach the spots list. Try again in a moment."
      : "Submitting your wallet address will not connect it.";

  if (status === "result") {
    return (
      <section className="waitlist-lookup waitlist-lookup--result" aria-labelledby="waitlist-title">
        <GlassCard className="waitlist-check-card waitlist-check-card--compact" flat>
          <div className="waitlist-compact">
            <div>
              <h1 id="waitlist-title" className="waitlist-compact__title">
                Check your spot
              </h1>
              <p className="waitlist-compact__address" title={address}>
                {shortAddress(address)}
              </p>
            </div>
            <button className="cta-button cta-button--secondary" type="button" onClick={checkAnother}>
              <span>Check another</span>
            </button>
          </div>
        </GlassCard>

        <PackReveal spots={spots} onRevealed={() => setRevealed(true)} />

        <p className="visually-hidden" aria-live="polite">
          {revealed ? cardMessage(spots) : ""}
        </p>

        {revealed ? (
          spots > 0 ? (
            <div className="waitlist-outcome waitlist-outcome--actions">
              {shareImage(spots) ? (
                <a
                  className="cta-button cta-button--primary"
                  href={shareImage(spots)!}
                  download={`mutable-soldiers-${spots}-spots.webp`}
                >
                  <span>Download card</span>
                </a>
              ) : null}
              <a
                className="cta-button cta-button--secondary"
                href={shareUrl(spots)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Share on X</span>
              </a>
            </div>
          ) : (
            <div className="waitlist-outcome waitlist-outcome--none">
              <h2 className="waitlist-outcome__title">Ways to get a spot</h2>
              <ul className="waitlist-ways">
                {waysToGetASpot.map((way) => (
                  <li key={way.label}>
                    <a className="waitlist-way" href={way.href}>
                      {way.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : null}
      </section>
    );
  }

  return (
    <section className="waitlist-lookup" aria-labelledby="waitlist-title">
      <GlassCard className="waitlist-check-card" flat>
        <h1 id="waitlist-title">Check your spot</h1>

        <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
          <label className="waitlist-form__label" htmlFor="xrpl-wallet-address">
            Enter your wallet address
          </label>

          <div className="waitlist-form__controls">
            <input
              ref={inputRef}
              id="xrpl-wallet-address"
              className="waitlist-input"
              name="walletAddress"
              type="text"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setInvalid(false);
                if (status === "error") setStatus("idle");
              }}
              readOnly={status === "loading"}
              placeholder="r..."
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={invalid}
              aria-describedby="wallet-address-feedback"
            />

            <button
              className="cta-button cta-button--primary waitlist-submit"
              type="submit"
              disabled={!address.trim() || status === "loading"}
            >
              <span>{status === "loading" ? "Checking…" : "Check spot"}</span>
            </button>
          </div>

          <p
            id="wallet-address-feedback"
            className="waitlist-feedback"
            data-tone={invalid || status === "error" ? "error" : "idle"}
            aria-live="polite"
          >
            {feedback}
          </p>
        </form>
      </GlassCard>
    </section>
  );
}
