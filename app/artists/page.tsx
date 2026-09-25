import type { Metadata } from "next";
import { ArtistCarousel } from "@/components/artists/ArtistCarousel";
import { GlassCard } from "@/components/experience/GlassCard";
import { SiteFooter } from "@/components/experience/SiteFooter";
import { SiteNavbar } from "@/components/experience/SiteNavbar";
import { artists } from "@/lib/artists";
import { assetByKey } from "@/lib/experience/assets";

export const metadata: Metadata = {
  title: "Artists | Mutable Soldiers",
  description:
    "Meet the 16 artists creating Special 1/1 soldiers for Mutable Soldiers: Soldiers of the Ancient World.",
};

export default function ArtistsPage() {
  return (
    <main className="waitlist-page artist-page">
      <div className="waitlist-backdrop" aria-hidden="true">
        <video
          className="waitlist-backdrop__video"
          src={assetByKey.ambient.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="waitlist-backdrop__veil" />
      </div>

      <SiteNavbar />

      <div className="artist-content">
        <GlassCard className="artist-card artist-index-intro" flat>
          <h1>16 Artists</h1>
          <p>
            Special 1/1 soldiers crafted by some of the greatest artists in this
            space. Drag, swipe or use the arrows to meet them.
          </p>
        </GlassCard>

        <ArtistCarousel
          artists={artists.map((artist) => ({
            slug: artist.slug,
            name: artist.name,
            soldierClass: artist.soldier.className,
            image: artist.soldier.blurredImage,
          }))}
        />
      </div>

      <SiteFooter placement="page" />
    </main>
  );
}
