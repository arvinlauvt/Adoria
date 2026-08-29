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
      reason: `Use at least ${MIN_LENGTH} characters.`,
    };
  }
  const result = zxcvbn(password, ["cubelle", ...inputs]);
  if (result.score < MIN_SCORE) {
    const feedback =
      result.feedback.warning ||
      result.feedback.suggestions[0] ||
      "This password is too easy to guess.";
    return { ok: false, score: result.score, reason: feedback };
  }
  return { ok: true, score: result.score, reason: "" };
}
