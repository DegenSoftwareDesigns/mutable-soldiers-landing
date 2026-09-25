import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GlassCard,
  LayeredGlassCard,
  StaticGlassCard,
} from "@/components/experience/GlassCard";
import { SiteFooter } from "@/components/experience/SiteFooter";
import { SiteNavbar } from "@/components/experience/SiteNavbar";
import { artists, getArtist, getArtistNeighbours } from "@/lib/artists";
import { assetByKey } from "@/lib/experience/assets";

type ArtistPageProps = {
  params: { slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return artists.map((artist) => ({ slug: artist.slug }));
}

export function generateMetadata({ params }: ArtistPageProps): Metadata {
  const artist = getArtist(params.slug);
  if (!artist) return {};
  const description = `${artist.name} created a Special 1/1 soldier for Mutable Soldiers: Soldiers of the Ancient World.`;
  return {
    title: `${artist.name} | Mutable Soldiers Artists`,
    description,
    openGraph: {
      title: `${artist.name} | Mutable Soldiers`,
      description,
      images: [artist.soldier.blurredImage],
    },
    twitter: { card: "summary_large_image", site: `@${artist.xHandle}` },
  };
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const artist = getArtist(params.slug);
  if (!artist) notFound();
  const { previous, next } = getArtistNeighbours(artist.slug);
  const { soldier } = artist;

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
        <section className="artist-hero" aria-labelledby="artist-name">
          <div className="artist-hero__main">
            <GlassCard className="artist-card artist-intro" flat>
              <p className="artist-eyebrow">Featured Artist · Special 1/1</p>
              <h1 id="artist-name">{artist.name}</h1>
              <p className="artist-tagline">{artist.tagline}</p>
              <div className="cta-row">
                <a
                  className="cta-button cta-button--primary"
                  href={`https://x.com/${artist.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>@{artist.xHandle} on X</span>
                </a>
                {artist.xrpCafeUrl && (
                  <a
                    className="cta-button cta-button--secondary"
                    href={artist.xrpCafeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>xrp.cafe profile</span>
                  </a>
                )}
              </div>
            </GlassCard>

            <GlassCard className="artist-card artist-about" flat>
              <h2>About the artist</h2>
              {artist.quote && (
                <blockquote className="artist-quote">“{artist.quote}”</blockquote>
              )}
              {artist.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </GlassCard>
          </div>

          <LayeredGlassCard className="artist-soldier" maxTilt={6}>
            <div className="artist-soldier__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={soldier.blurredImage}
                alt={
                  soldier.revealed
                    ? soldier.name
                    : `${soldier.name}, hidden until the reveal`
                }
              />
              {!soldier.revealed && (
                <span className="artist-soldier__badge">Revealing soon</span>
              )}
            </div>
            <h2>{soldier.name}</h2>
            <ul className="artist-chips" aria-label="Soldier details">
              <li>{soldier.className}</li>
              <li>Special 1/1</li>
              <li>Ancient World</li>
            </ul>
            <p>{soldier.lore}</p>
          </LayeredGlassCard>
        </section>


        {artist.collections.length > 0 && (
          <section className="artist-collections" aria-labelledby="collections-title">
            <h2 id="collections-title">More from {artist.name}</h2>
            <div className="artist-collections__grid">
              {artist.collections.map((collection) => (
                <a
                  className="artist-collection"
                  href={collection.url}
                  key={collection.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GlassCard className="artist-card" flat>
                    <strong>{collection.name}</strong>
                    <span>View on xrp.cafe →</span>
                  </GlassCard>
                </a>
              ))}
            </div>
          </section>
        )}

        <StaticGlassCard
          className="site-navbar-glass"
          cardClassName="site-navbar-surface"
        >
          <nav className="artist-pager" aria-label="More artists">
            <Link className="cta-button cta-button--secondary" href={`/artists/${previous.slug}`}>
              <span>← {previous.name}</span>
            </Link>
            <Link className="cta-button cta-button--primary" href="/waitlist">
              <span>Join the Waitlist</span>
            </Link>
            <Link className="cta-button cta-button--secondary" href={`/artists/${next.slug}`}>
              <span>{next.name} →</span>
            </Link>
          </nav>
        </StaticGlassCard>
      </div>

      <SiteFooter placement="page" />
    </main>
  );
}
