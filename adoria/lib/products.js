// Consumer-facing catalog. `edition` must match a "Product Edition" option
// in Airtable exactly. Swap `accent` and copy per drop as needed — the
// Seasonal box in particular is meant to be re-skinned a few times a year.

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
  },
];

export function getProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}
