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
