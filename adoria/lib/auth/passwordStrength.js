// Strength checking only — no bcrypt here. This file is imported by both
// the server (source of truth) and a client component (live-typing
// feedback), so it must stay free of Node-only/server-only code that would
// otherwise get pulled into the browser bundle for no reason.
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

zxcvbnOptions.setOptions({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  // Without this, feedback comes back as raw keys ("common", "dates") rather
  // than sentences, and those keys end up shown to the user as the reason
  // their password was rejected.
  translations: zxcvbnEnPackage.translations,
});

export const MIN_LENGTH = 10;
// zxcvbn scores 0 (trivial) to 4 (very strong). 3 is NIST's usual practical
// floor: it rejects "Password1", keyboard walks, and anything close to a
// known-breached pattern, without demanding arbitrary symbol/number rules
// (composition rules push people toward predictable substitutions like
// "P@ssw0rd" — length + estimated guessability is the stronger signal).
export const MIN_SCORE = 3;

// zxcvbn matches user inputs as whole dictionary entries, so passing
// "arvinlau@example.com" only penalizes that exact string — "arvinlau" on its
// own still scores as an unknown word, and "arvinlau-arvinlau" scored a full 4
// before this. Splitting each input into its alphanumeric parts is what makes
// the local-part, the domain, and each name token count individually.
function expandInputs(inputs) {
  const out = new Set();
  for (const raw of inputs) {
    const value = String(raw || "").trim().toLowerCase();
    if (!value) continue;
    out.add(value);
    for (const part of value.split(/[^a-z0-9]+/)) {
      if (part.length >= 3) out.add(part);
    }
  }
  return [...out];
}

// zxcvbn says what's wrong ("This is a commonly used password.") but never
// what to do instead, so every rejection gets one short suggestion appended.
const ADVICE = "Try four unrelated words — long beats complicated.";

// `inputs` are extra terms to penalize (email, name) so "arvin1990" scores
// low when it's literally the account's own email local-part.
export function checkPasswordStrength(password, inputs = []) {
  if (!password) {
    return { ok: false, score: 0, reason: "Enter a password." };
  }
  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      score: 0,
      reason: `Use at least ${MIN_LENGTH} characters — this one has ${password.length}. Four unrelated words works well.`,
    };
  }
  const expanded = expandInputs(["cubelle", "cubelle.my", ...inputs]);

  // zxcvbn credits long repeats, so "arvinlau-arvinlau" still scraped a 3 even
  // with the local-part in the dictionary. A password built only out of the
  // account's own details is the first thing anyone targeting this specific
  // person would try, so it's rejected outright rather than scored.
  const stripped = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  let residue = stripped;
  for (const token of expanded) {
    if (token.length >= 4) residue = residue.split(token).join("");
  }
  if (residue.length < 4) {
    return {
      ok: false,
      score: 0,
      reason: "This is just your email address. Pick something unrelated to you.",
    };
  }

  const result = zxcvbn(password, expanded);
  if (result.score < MIN_SCORE) {
    const diagnosis =
      result.feedback.warning ||
      result.feedback.suggestions[0] ||
      "This password is too easy to guess.";
    // zxcvbn's warnings are sentences already, but not all end in a full stop.
    const tidied = /[.!?]$/.test(diagnosis) ? diagnosis : `${diagnosis}.`;
    return { ok: false, score: result.score, reason: `${tidied} ${ADVICE}` };
  }
  return { ok: true, score: result.score, reason: "" };
}
