export type ArtistCollection = {
  name: string;
  url: string;
};

export type Artist = {
  slug: string;
  name: string;
  tagline: string;
  /** X handle without the @ */
  xHandle: string;
  xrpCafeUrl?: string;
  /** Written by the artist */
  bio: string[];
  quote?: string;
  soldier: {
    name: string;
    className: string;
    lore: string;
    /**
     * Pre-blurred export. Never ship the original artwork before the reveal:
     * a CSS blur can be removed from the browser, a blurred file cannot.
     */
    blurredImage: string;
    revealed: boolean;
  };
  collections: ArtistCollection[];
};

const placeholderSoldierImage = "/assets/artists/soldier-placeholder-blurred.svg";

export const artists: Artist[] = [
  {
    slug: "artist-one",
    name: "[Artist One]",
    tagline: "[Short line: discipline · location]",
    xHandle: "artistone",
    xrpCafeUrl: "https://xrp.cafe",
    bio: [
      "[Artist bio, paragraph one. Written by the artist.]",
      "[Artist bio, paragraph two. Optional.]",
    ],
    quote: "[How they approached their soldier, in their own words.]",
    soldier: {
      name: "[Soldier name]",
      className: "[Class]",
      lore: "[One line of lore about this soldier.]",
      blurredImage: placeholderSoldierImage,
      revealed: false,
    },
    collections: [
      { name: "[Collection A]", url: "https://xrp.cafe" },
      { name: "[Collection B]", url: "https://xrp.cafe" },
    ],
  },
  // Placeholders so the index shows the full roster of 16 until real data lands.
  ...Array.from({ length: 15 }, (_, index): Artist => {
    const number = String(index + 2).padStart(2, "0");
    return {
      slug: `artist-${number}`,
      name: `[Artist ${number}]`,
      tagline: "[Short line: discipline · location]",
      xHandle: `artist${number}`,
      bio: ["[Artist bio. Written by the artist.]"],
      soldier: {
        name: "[Soldier name]",
        className: "[Class]",
        lore: "[One line of lore about this soldier.]",
        blurredImage: placeholderSoldierImage,
        revealed: false,
      },
      collections: [],
    };
  }),
];

export function getArtist(slug: string) {
  return artists.find((artist) => artist.slug === slug);
}

export function getArtistNeighbours(slug: string) {
  const index = artists.findIndex((artist) => artist.slug === slug);
  const count = artists.length;
  return {
    previous: artists[(index - 1 + count) % count],
    next: artists[(index + 1) % count],
  };
}
