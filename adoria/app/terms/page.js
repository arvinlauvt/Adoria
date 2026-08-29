import Link from "next/link";
import LegalPage, { Section } from "../../components/LegalPage";
import { LEAD_TIME_DAYS, MAX_BOXES_PER_ORDER } from "../../lib/products";

export const metadata = {
  title: "Terms of Sale · Cubelle",
};

// Terms of sale for a Malaysian food business selling to consumers. The
// cancellation and refund wording is shaped by two things:
//
//   1. The Consumer Protection Act 1999 implies guarantees that a shop's own
//      terms cannot sign away, so nothing here claims to.
//   2. These are perishable and made to a customer's own message and date,
//      which is why cancellation closes once baking starts — that limit is
//      stated plainly rather than buried.
//
// Numbers come from lib/products.js so the page can't drift from what the
// checkout actually enforces.

const UPDATED = "30 August 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Sale" updated={UPDATED}>
      <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, color: "var(--text-body)", marginTop: 0 }}>
        These terms cover buying from Cubelle. They&rsquo;re written to be read, not
        to trip you up. If something here seems unfair, tell us — we&rsquo;d rather
        fix the terms than argue about them.
      </p>

      <Section heading="Who you're buying from">
        Cubelle, a small gift-box business operating from Kuantan, Pahang, Malaysia.
        Contact us on WhatsApp at{" "}
        <a href="https://wa.me/60106509189" target="_blank" rel="noreferrer" style={{ color: "var(--accent-text)" }}>
          +60 10-650 9189
        </a>
        .
      </Section>

      <Section heading="Orders">
        An order is confirmed once payment has gone through, not when the form is
        submitted. Until then nothing is reserved. We bake to a daily limit, so a
        delivery date can fill up while you are still filling in the form — if that
        happens you will be told before paying, and nothing will be charged.
        <br />
        <br />
        You can order up to {MAX_BOXES_PER_ORDER} boxes at a time. For more than
        that, message us and we will arrange it.
      </Section>

      <Section heading="Prices and payment">
        Prices are in Malaysian Ringgit and include everything except delivery where
        delivery is charged separately. Payment is taken by ToyyibPay; we never see
        or store your card or banking details.
        <br />
        <br />
        The price charged is the one calculated by us at checkout from the options
        you chose. If a price is displayed wrongly through an error on our side, we
        will contact you before taking payment rather than charge the wrong amount.
      </Section>

      <Section heading="Delivery">
        We need {LEAD_TIME_DAYS} days between your order and the delivery date, and
        the date picker will not let you choose sooner. We deliver in and around
        Kuantan; for anywhere else, message us first.
        <br />
        <br />
        We aim to arrive on the date you chose. If something outside our control
        delays it — weather, a courier problem, illness — we will tell you as soon
        as we know and agree what to do.
      </Section>

      <Section heading="Your message">
        We write your message by hand, exactly as you typed it, so please check
        spelling before you pay. We will not write anything unlawful, threatening, or
        abusive, and we may refuse an order on that basis and refund it in full.
      </Section>

      <Section heading="Allergens">
        Everything is baked in one small kitchen with shared equipment. We cannot
        promise any box is free of nuts, peanuts or sesame.{" "}
        <Link href="/allergens" style={{ color: "var(--accent-text)" }}>
          Read the allergen page
        </Link>{" "}
        before sending a box to anyone with a serious allergy. If the recipient has
        an anaphylactic allergy, please don&rsquo;t.
      </Section>

      <Section heading="Cancelling and refunds">
        Message us as soon as you can. If we have not started baking, we will cancel
        and refund in full.
        <br />
        <br />
        Once baking has started we usually cannot refund, because the food is
        perishable and made specifically to your message and your date. This is the
        one place these terms are strict, and it is the reason why.
        <br />
        <br />
        If your order arrives damaged, wrong, or not at all, that is on us. Send us a
        photo on WhatsApp within 48 hours of delivery and we will replace it or
        refund it. Nothing in these terms takes away the rights you have under the
        Consumer Protection Act 1999 — where these terms and that Act disagree, the
        Act wins.
      </Section>

      <Section heading="Accounts">
        An account is optional; you can order as a guest. If you have one, keep your
        password to yourself and tell us if you think someone else has used it. We
        may close an account that is being used to abuse the site.
      </Section>

      <Section heading="Our words and pictures">
        The writing, photographs, logo and design on this site belong to Cubelle.
        Please don&rsquo;t copy them for your own shop. If you think something here
        infringes your copyright, message us with a link and we will take it down
        while we look into it — you should not need a lawyer to get our attention.
      </Section>

      <Section heading="Privacy">
        What we collect and why is set out in our{" "}
        <Link href="/privacy" style={{ color: "var(--accent-text)" }}>
          Privacy Notice
        </Link>
        .
      </Section>

      <Section heading="Governing law">
        These terms are governed by Malaysian law, and the Malaysian courts have
        jurisdiction over any dispute.
      </Section>
    </LegalPage>
  );
}
