"use client";

import { FormEvent, useState } from "react";
import { GlassCard } from "@/components/experience/GlassCard";

const xrplClassicAddress = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

type LookupFeedback = {
  tone: "idle" | "error" | "ready";
  message: string;
};

const idleFeedback: LookupFeedback = {
  tone: "idle",
  message: "Submitting your wallet address will not connect it.",
};

export function WaitlistLookup() {
  const [address, setAddress] = useState("");
  const [feedback, setFeedback] = useState<LookupFeedback>(idleFeedback);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAddress = address.trim();

    if (!xrplClassicAddress.test(normalizedAddress)) {
      setFeedback({
        tone: "error",
        message: "Enter a valid classic XRPL wallet address.",
      });
      return;
    }

    setAddress(normalizedAddress);
    setFeedback({
      tone: "ready",
      message: "Address accepted. Spot lookup will be connected next.",
    });
  };

  const handleAddressChange = (nextAddress: string) => {
    setAddress(nextAddress);
    if (feedback.tone !== "idle") setFeedback(idleFeedback);
  };

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
              id="xrpl-wallet-address"
              className="waitlist-input"
              name="walletAddress"
              type="text"
              value={address}
              onChange={(event) => handleAddressChange(event.target.value)}
              placeholder="r..."
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={feedback.tone === "error"}
              aria-describedby="wallet-address-feedback"
            />

            <button
              className="cta-button cta-button--primary waitlist-submit"
              type="submit"
              disabled={!address.trim()}
            >
              <span>Submit</span>
            </button>
          </div>

          <p
            id="wallet-address-feedback"
            className="waitlist-feedback"
            data-tone={feedback.tone}
            aria-live="polite"
          >
            {feedback.message}
          </p>
        </form>
      </GlassCard>
    </section>
  );
}
