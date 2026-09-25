"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { StaticGlassCard } from "@/components/experience/GlassCard";

export type ArtistCarouselItem = {
  slug: string;
  name: string;
  soldierClass: string;
  image: string;
};

/** Pixels of horizontal drag that rotate the ring by one card */
const DRAG_PX_PER_CARD = 140;
/** Movement above which a pointer interaction counts as a drag, not a click */
const CLICK_TOLERANCE_PX = 6;
/** A short swipe past this distance always moves at least one card */
const SWIPE_MIN_PX = 40;

/** Shortest signed distance between two positions on a ring of `count` slots */
function ringOffset(from: number, to: number, count: number) {
  return ((((to - from) % count) + count * 1.5) % count) - count / 2;
}

export function ArtistCarousel({ artists }: { artists: ArtistCarouselItem[] }) {
  const count = artists.length;
  // Continuous position; can grow past `count` so the ring always takes the short way round
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    startX: number;
    startPosition: number;
    deltaX: number;
    moved: boolean;
  } | null>(null);

  const active = ((Math.round(position) % count) + count) % count;
  const goTo = (index: number) =>
    setPosition((current) => Math.round(current) + ringOffset(Math.round(current), index, count));
  const step = (delta: number) => setPosition((current) => Math.round(current) + delta);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: event.clientX, startPosition: position, deltaX: 0, moved: false };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const deltaX = event.clientX - drag.current.startX;
    drag.current.deltaX = deltaX;
    if (!drag.current.moved && Math.abs(deltaX) < CLICK_TOLERANCE_PX) return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setPosition(drag.current.startPosition - deltaX / DRAG_PX_PER_CARD);
  };
  const onPointerUp = () => {
    const current = drag.current;
    if (current?.moved) {
      const start = Math.round(current.startPosition);
      let target = Math.round(current.startPosition - current.deltaX / DRAG_PX_PER_CARD);
      if (target === start && Math.abs(current.deltaX) > SWIPE_MIN_PX) {
        target = start - Math.sign(current.deltaX);
      }
      setPosition(target);
    }
    setDragging(false);
    // Keep `moved` readable by the click handler that fires right after
    setTimeout(() => (drag.current = null));
  };

  return (
    <section
      className="artist-carousel"
      aria-roledescription="carousel"
      aria-label="Featured artists"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      <div
        className={`artist-carousel__stage ${dragging ? "is-dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="artist-carousel__ring"
          style={{ "--count": count, "--position": position } as CSSProperties}
        >
          {artists.map((artist, index) => {
            const distance = Math.abs(ringOffset(position, index, count));
            const isActive = index === active;
            return (
              <Link
                key={artist.slug}
                href={`/artists/${artist.slug}`}
                className={`artist-carousel__item ${isActive ? "is-active" : ""} ${
                  distance > count / 4 ? "is-behind" : ""
                }`}
                style={{ "--i": index, "--distance": distance } as CSSProperties}
                aria-current={isActive ? "true" : undefined}
                draggable={false}
                onClick={(event) => {
                  // Drags and taps on side cards rotate instead of navigating
                  if (drag.current?.moved || !isActive) {
                    event.preventDefault();
                    if (!drag.current?.moved) goTo(index);
                  }
                }}
              >
                <StaticGlassCard
                  className="site-navbar-glass artist-carousel__glass"
                  cardClassName="site-navbar-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.image} alt="" draggable={false} />
                  <strong>{artist.name}</strong>
                  <span>{artist.soldierClass} · Special 1/1</span>
                </StaticGlassCard>
              </Link>
            );
          })}
        </div>
      </div>

      <StaticGlassCard
        className="site-navbar-glass artist-carousel__bar"
        cardClassName="site-navbar-surface"
      >
        <div className="artist-carousel__controls">
          <button
            className="cta-button cta-button--secondary"
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous artist"
          >
            <span>←</span>
          </button>
          <span className="artist-carousel__count" aria-live="polite">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button
            className="cta-button cta-button--secondary"
            type="button"
            onClick={() => step(1)}
            aria-label="Next artist"
          >
            <span>→</span>
          </button>
        </div>
      </StaticGlassCard>
    </section>
  );
}
