// Consumer-facing catalog. `edition` must match a "Product Edition" option
// in Airtable exactly. Swap `accent` and copy per drop as needed.

// Pricing: per box = base (by message type) + add-on (if selected), all
// multiplied by quantity. Base RM79 (card) / RM89 (letter). Add-on price
// depends on which add-on the product offers — see ADDON_PRICES.
export const PRICE_CARD = 79;
export const PRICE_LETTER = 89;
export const ADDON_PRICES = { flowers: 25, brassBookmark: 30 };

// Real capacity of the 15x15cm box, confirmed by the founder.
export const CUBE_CAP = 25;

// Real lead time from order to delivery — keep this in sync with the
// date picker in the checkout, and with the "Order Confirmed" stage of
// the tracker.
export const LEAD_TIME_DAYS = 7;

// Order and production caps. MAX_BOXES_PER_ORDER limits a single checkout;
// MAX_BOXES_PER_DAY is the kitchen's shared daily capacity across every
// product's Paid orders for the same delivery date — see /api/availability
// and the delivery-date check in /api/create-order.
export const MAX_BOXES_PER_ORDER = 3;
export const MAX_BOXES_PER_DAY = 5;

export const FLAVORS = ["Noir Cubes", "Cacao Sepia"];

export const FLOWER_OPTIONS = [
  { name: "Midnight Lavender", color: "#4b3a63" },
  { name: "Blushing Petal", color: "#d98ca0" },
  { name: "Cerulean Azure", color: "#2f6fa8" },
  { name: "Ivory Bloom", color: "#f3ead3" },
];

export const PRODUCTS = [
  {
    slug: "anniversary",
    name: "The Anniversary Box",
    edition: "Milestone & Anniversary Edition",
    occasionTag: "Romance",
    tagline: "For the date you never want to forget.",
    shortDescription:
      "Engagements, first dates remembered, the small private dates only the two of you keep. Add pressed flowers in one of four colours; the card does the rest.",
    description:
      "Our original box. Twenty-five hand-baked cubes over your words in gold ink — a short card message, or a full letter of up to 1,300 characters, your choice at checkout. Add pressed flowers if the moment calls for them. Choose the date — we build the lead time in.",
    accent: "#8a5a34",
    occasionDateLabel: "Anniversary date",
    occasionDateRequired: true,
    addon: { type: "flowers", label: "Flower Frame Kit" },
    letterFrame: "ornate",
    badges: ["Flower Frame Kit +RM25", "Date required"],
  },
  {
    slug: "congratulations",
    name: "The Congratulations Box",
    edition: "Celebration Edition",
    occasionTag: "Career",
    tagline: "For the wins that deserve more than a text.",
    shortDescription:
      "A new job, a new home, a degree finally finished. Same box, same craft — a card written for pride instead of romance, and an engraved token if you want it kept.",
    description:
      "A sleeker, congratulatory tone for the wins worth marking properly. Twenty-five hand-baked cubes, a card written for pride instead of romance, and an optional engraved Custom Brass Bookmark to keep long after the box is empty.",
    accent: "#4a3524",
    occasionDateLabel: "Send / delivery date (optional)",
    occasionDateRequired: false,
    addon: { type: "brassBookmark", label: "Custom Brass Bookmark" },
    letterFrame: "plain",
    badges: ["Custom Brass Bookmark +RM30", "Engraved, kept for years"],
  },
  {
    slug: "hostess",
    name: "The Hostess Box",
    edition: "Host & Visiting Edition",
    occasionTag: "Visiting",
    tagline: "A better guest than a fruit basket.",
    shortDescription:
      "For dinner parties, visiting family, and thanking someone who hosted you well. Smaller gesture, same box — arrives ready to hand over.",
    description:
      "For visiting family, dropping in on a dinner party, or thanking someone who hosted you well. Twenty-five hand-baked cubes, matte black box, your message in gold ink — an elevated alternative to whatever's usually picked up on the way over.",
    accent: "#3b2417",
    occasionDateLabel: "Delivery date (optional)",
    occasionDateRequired: false,
    addon: { type: "flowers", label: "Flower Frame Kit" },
    letterFrame: "ornate",
    badges: ["Flower Frame Kit +RM25", "Same-week delivery"],
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function getProductByEdition(edition) {
  return PRODUCTS.find((p) => p.edition === edition) || null;
}

// Server + client both call this so the charged amount always matches
// what the UI displayed — never trust a client-supplied total alone.
// `addonType` is the add-on's internal key (e.g. "flowers", "brassBookmark"),
// not its display label, so the price always comes from ADDON_PRICES here
// rather than anything the client sends.
export function computeTotalRM({ messageMode, addonType, quantity }) {
  const base = messageMode === "letter" ? PRICE_LETTER : PRICE_CARD;
  const addonPrice = addonType ? ADDON_PRICES[addonType] || 0 : 0;
  const perBox = base + addonPrice;
  return perBox * Math.max(1, quantity || 1);
}
