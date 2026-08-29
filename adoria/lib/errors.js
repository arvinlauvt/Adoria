// An error a customer sees has one job: say what to do next, in as few words
// as will carry it. Anything longer gets skimmed, and a skimmed error is the
// same as no error.
//
// Two kinds, treated differently:
//
//   Their input — say what to fix, in one sentence. No apology, no
//   explanation of our internals.
//   Our fault  — don't explain the plumbing. Say it's on us, give the
//   reference code, point at WhatsApp. They can't fix it and don't want a
//   diagnosis.
//
// `field` lets a form put the message next to the input at fault. `code` is
// stable for the client to branch on; the prose can change freely.

import { randomBytes } from "crypto";

export class AppError extends Error {
  constructor({ status = 400, code, what, why, action, field = null, reference = null }) {
    super(`${what} ${why}`.trim());
    this.status = status;
    this.code = code;
    this.what = what;
    this.why = why;
    this.action = action;
    this.field = field;
    this.reference = reference;
  }

  toResponse() {
    // `error` is the same content joined into one sentence-run, for any caller
    // that just prints a string. The reference is appended only here, so a UI
    // rendering the fields separately can show it as its own line without it
    // appearing twice.
    const reference = this.reference
      ? `Message us on WhatsApp and quote ${this.reference}.`
      : null;

    return Response.json(
      {
        error: [this.what, this.why, this.action, reference].filter(Boolean).join(" "),
        code: this.code,
        what: this.what,
        why: this.why,
        action: this.action,
        ...(this.field ? { field: this.field } : {}),
        ...(this.reference ? { reference: this.reference } : {}),
      },
      { status: this.status }
    );
  }
}

export function badRequest({ status = 400, code, what, why, action, field }) {
  return new AppError({ status, code, what, why, action, field });
}

// Short enough to read aloud over the phone, and drawn from an alphabet with
// no 0/O/1/I so it survives being copied by hand.
export function newErrorReference() {
  const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (const b of randomBytes(6)) out += ALPHABET[b % ALPHABET.length];
  return `CB-${out}`;
}

// The only thing the customer needs from a server failure: is it worth
// trying again? Everything else about which service broke belongs in the
// log, not on their screen.
function isRetryable(err) {
  const text = String((err && err.message) || err);

  // Missing config, or a dependency refusing us: identical every time until
  // someone fixes it. Telling them to retry would waste their evening.
  if (/\b(is|are) not set\b|\bis missing\b|\bnot configured\b/i.test(text)) return false;
  const status = Number((text.match(/failed:\s*(\d{3})/) || [])[1]);
  if (status === 401 || status === 403 || status === 404 || status === 422) return false;

  return true;
}

/**
 * Wraps a route handler so nothing escapes as an unhandled rejection or a bare
 * 500 with no explanation. An AppError is deliberate and passed through;
 * anything else is a bug, so it's logged with full context and a reference
 * code, then reported to the user in plain language.
 *
 * `failure.what` names the thing that didn't happen, in the customer's terms
 * ("We couldn't create your account."). `failure.note` is only for the few
 * routes where a partial failure leaves them unsure what state they're in —
 * signup, where the account row and the session are separate writes.
 *
 * The route never supplies the "try again" line: whether retrying helps
 * depends on the failure, not the endpoint. isRetryable() decides, and the
 * reference sentence is appended automatically.
 */
export function withErrorHandling(routeName, handler, failure = {}) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AppError) return err.toResponse();

      // err.status is set by requireSession/requireAdmin.
      if (err && err.status === 401) {
        return new AppError({
          status: 401,
          code: "not_signed_in",
          what: "You're not signed in.",
          action: "Sign in and try again.",
        }).toResponse();
      }
      if (err && err.status === 403) {
        return new AppError({
          status: 403,
          code: "forbidden",
          what: "This page is admin-only.",
          action: "If that seems wrong, ask the shop owner to check your account.",
        }).toResponse();
      }

      const reference = newErrorReference();
      const retryable = isRetryable(err);
      const code = retryable ? "temporary" : "broken";

      // Loud on the server, and tagged with the same code the user is holding,
      // so "it said CB-K7M2QP" goes straight to the stack trace that caused it.
      console.error(
        `[${routeName}] ${reference} ${code}:`,
        err && err.stack ? err.stack : err
      );

      return new AppError({
        status: 503,
        code,
        reference,
        what: failure.what || "Something went wrong on our end.",
        // No `why`. They can't act on which service failed, and reading it
        // costs them the sentence that tells them what to do.
        action: [
          failure.note,
          retryable ? "Try again in a minute." : "It's not something you did.",
        ]
          .filter(Boolean)
          .join(" "),
      }).toResponse();
    }
  };
}
