// The spots list is a two-column CSV (address,spots) hosted elsewhere. Set
// NEXT_PUBLIC_WAITLIST_SPOTS_URL to it; until then the mock in /public is used.
// Addresses missing from the list have 0 spots.
const spotsUrl =
  process.env.NEXT_PUBLIC_WAITLIST_SPOTS_URL ?? "/waitlist-spots.mock.csv";

export async function lookupSpots(address: string): Promise<number> {
  const response = await fetch(spotsUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Spots list responded with ${response.status}`);
  }

  for (const line of (await response.text()).split(/\r?\n/)) {
    const [listedAddress, spots] = line.split(",");
    if (listedAddress?.trim() === address) {
      return Math.max(0, Math.floor(Number(spots)) || 0);
    }
  }

  return 0;
}

// Pre-rendered share cards live at public/assets/waitlist/share/spots-N.webp,
// one per count. Counts above the maximum have no image.
export const MAX_SHARE_SPOTS = 3; // TODO: team decision, one image per count

export function shareImage(spots: number) {
  return spots >= 1 && spots <= MAX_SHARE_SPOTS
    ? `/assets/waitlist/share/spots-${spots}.webp`
    : null;
}
