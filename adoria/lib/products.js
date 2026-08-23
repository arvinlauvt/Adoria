// Consumer-facing catalog. `edition` must match a "Product Edition" option
// in Airtable exactly. Swap `accent` and copy per drop as needed — the
// Seasonal box in particular is meant to be re-skinned a few times a year.

// Pricing: per box = base (by message type) + add-on (if selected), all
// multiplied by quantity. Base RM79 (card) / RM89 (letter). Add-on flat +RM25.
export const PRICE_CARD = 79;
export const PRICE_LETTER = 89;
export const PRICE_ADDON = 25;

export const FLOWER_OPTIONS = [
  { name: "Midnight Lavender", swatch: "/flowers/midnight-lavender.png" },
  { name: "Blushing Petal", swatch: "/flowers/blushing-petal.png" },
  { name: "Cerulean Azure", swatch: "/flowers/cerulean-azure.png" },
  { name: "Ivory Bloom", swatch: "/flowers/ivory-bloom.png" },
];

export const PRODUCTS = [
  {
    slug: "anniversary",
    name: "The Anniversary Box",
    edition: "Milestone & Anniversary Edition",
    tagline: "For the date you never want to forget.",
    description:
      "Our original box, built for anniversaries and the milestones that come with a relationship — engagements, first dates remembered, the small private dates only the two of you keep. A gold-ink note carries the message; the box is just the excuse to say it.",
    accent: "#8a5a34",
    occasionDateLabel: "Anniversary date",
    occasionDateRequired: true,
    addon: { type: "flowers", label: "Flowers" },
  },
  {
    slug: "congratulations",
    name: "The Congratulations Box",
    edition: "Celebration Edition",
    tagline: "For promotions, new homes, and graduations.",
    description:
      "A sleeker, congratulatory tone for the wins worth marking properly — a new job, a new home, a degree finally finished. Same box, same craftsmanship, a card written for pride instead of romance.",
    accent: "#4a3524",
    occasionDateLabel: "Send / delivery date (optional)",
    occasionDateRequired: false,
    addon: { type: "achievementToken", label: "Achievement Token" },
  },
  {
    slug: "hostess",
    name: "The Hostess Box",
    edition: "Host & Visiting Edition",
    tagline: "A better guest than a fruit basket.",
    description:
      "For visiting family, dropping in on a dinner party, or thanking someone who hosted you well. Smaller gesture, same box — an elevated alternative to whatever's usually picked up on the way over.",
    accent: "#3b2417",
    occasionDateLabel: "Delivery date (optional)",
    occasionDateRequired: false,
    addon: { type: "flowers", label: "Flowers" },
  },
  {
    slug: "festive",
    name: "The Festive Box",
    edition: "Seasonal & Holiday Edition",
    tagline: "This season's limited drop.",
    description:
      "A limited-run edition timed to the Malaysian holiday calendar — warmth and gratitude over the year-end season. Packaging and card tone rotate with the season; what stays the same is the box.",
    accent: "#b98a3d",
    occasionDateLabel: "Delivery date (optional)",
    occasionDateRequired: false,
    comingSoon: true,
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

// Server + client both call this so the charged amount always matches
// what the UI displayed — never trust a client-supplied total alone.
export function computeTotalRM({ messageMode, addonSelected, quantity }) {
  const base = messageMode === "letter" ? PRICE_LETTER : PRICE_CARD;
  const perBox = base + (addonSelected ? PRICE_ADDON : 0);
  return perBox * Math.max(1, quantity || 1);
}
