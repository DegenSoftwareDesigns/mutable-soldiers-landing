import type { Metadata } from "next";
import { SiteFooter } from "@/components/experience/SiteFooter";
import { SiteNavbar } from "@/components/experience/SiteNavbar";
import { WaitlistLookup } from "@/components/waitlist/WaitlistLookup";
import { assetByKey } from "@/lib/experience/assets";
import { shareImage } from "@/lib/waitlist/spots";

const title = "Check your spot | Mutable Soldiers";
const description = "Check the spots associated with your XRPL wallet address.";

// Shared links look like /waitlist?spots=2 and carry the card image for X.
export function generateMetadata({
  searchParams,
}: {
  searchParams: { spots?: string };
}): Metadata {
  const image = shareImage(Number(searchParams.spots));

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title,
    description,
    ...(image && {
      openGraph: { title, description, images: [{ url: image, width: 1333, height: 2000 }] },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    }),
  };
}

export default function WaitlistPage() {
  return (
    <main className="waitlist-page">
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

      <div className="waitlist-content">
        <WaitlistLookup />
      </div>

      <SiteFooter placement="page" />
    </main>
  );
}
