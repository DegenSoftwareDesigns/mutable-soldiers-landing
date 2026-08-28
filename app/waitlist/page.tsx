import type { Metadata } from "next";
import { SiteFooter } from "@/components/experience/SiteFooter";
import { SiteNavbar } from "@/components/experience/SiteNavbar";
import { WaitlistLookup } from "@/components/waitlist/WaitlistLookup";
import { assetByKey } from "@/lib/experience/assets";

export const metadata: Metadata = {
  title: "Check your spot | Mutable Soldiers",
  description: "Check the spots associated with your XRPL wallet address.",
};

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
