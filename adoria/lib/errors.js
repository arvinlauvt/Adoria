// Every error a user sees should answer three questions: what happened, why,
// and what to do next. A bare "Invalid input" answers none of them and leaves
// someone re-submitting the same thing hoping for a different result.
//
// That applies to outages too, not just validation. "Could not create your
// account right now." tells a customer nothing they can act on: they don't
// know whether the account exists, whether retrying helps, or who to ask.
// So an unexpected failure is classified below into the only two facts that
// change what the user should do — is this our configuration (retrying is
// pointless) or a service being briefly unreachable (retrying is the fix) —
// and always carries a reference code they can quote to us.
//
// `field` lets a form put the message next to the input at fault rather than
// in a generic banner. `code` is stable for the client to branch on; the
// prose can be reworded without breaking anything.

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
      ? `If you need it sorted now, message us on WhatsApp and quote ${this.reference}.`
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

// Turns an internal failure into the distinction the user actually needs:
// will trying again help? Deliberately says nothing about which service
// failed, which host it lives on, or what the credentials were.
function classify(err) {
  const text = String((err && err.message) || err);

  // A missing/blank environment variable. The request never left our side,
  // and it will fail identically every time until someone fixes the setting.
  if (/\b(is|are) not set\b|\bis missing\b|\bnot configured\b/i.test(text)) {
    return {
      code: "misconfigured",
      why: "The site is missing a setting it needs to reach the service that stores accounts, so the request stopped before it got anywhere.",
      retryable: false,
    };
  }

  // A dependency answered, but refused us. Credentials, permissions, or a
  // schema mismatch — all of them need a human, not a retry.
  const status = Number((text.match(/failed:\s*(\d{3})/) || [])[1]);
  if (status === 401 || status === 403) {
    return {
      code: "upstream_denied",
      why: "The service that stores accounts refused our request, which means our access to it needs fixing.",
      retryable: false,
    };
  }
  if (status === 404 || status === 422) {
    return {
      code: "upstream_mismatch",
      why: "The service that stores accounts didn't accept the shape of our request, which is a setup problem on our end.",
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      code: "upstream_down",
      why: "The service that stores accounts is having problems of its own right now.",
      retryable: true,
    };
  }

  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timeout|network/i.test(text)) {
    return {
      code: "upstream_unreachable",
      why: "We couldn't reach the service that stores accounts — most likely a brief network problem between us and them.",
      retryable: true,
    };
  }

  return {
    code: "unexpected",
    why: "The request reached us but couldn't be completed. This is a bug on our side, not anything you did wrong.",
    retryable: true,
  };
}

/**
 * Wraps a route handler so nothing escapes as an unhandled rejection or a bare
 * 500 with no explanation. An AppError is deliberate and passed through;
 * anything else is a bug, so it's logged with full context and a reference
 * code, then reported to the user in plain language.
 *
 * `failure.what` should name the thing that didn't happen, from the user's
 * point of view ("We couldn't create your account."). `failure.note` is for
 * routes where a partial failure leaves the user unsure what state they're in
 * and they need telling how to check — signup is the clear case, since the
 * account row and the session are separate writes.
 *
 * The route deliberately does NOT supply the "try again" line: whether
 * retrying is worth it depends on the failure, not the endpoint, so telling
 * someone to retry a missing config setting would just waste their time.
 * classify() decides that, and the reference sentence is always appended.
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
          why: "This page needs an account, and your session has expired or was never started.",
          action: "Sign in and try again.",
        }).toResponse();
      }
      if (err && err.status === 403) {
        return new AppError({
          status: 403,
          code: "forbidden",
          what: "You don't have access to this.",
          why: "It's restricted to admin accounts, and yours isn't one.",
          action: "If you think that's wrong, ask whoever runs the shop to check your account's role.",
        }).toResponse();
      }

      const reference = newErrorReference();
      const { code, why, retryable } = classify(err);

      // Loud on the server, and tagged with the same code the user is holding,
      // so "it said CB-K7M2QP" goes straight to the stack trace that caused it.
      console.error(
        `[${routeName}] ${reference} ${code}:`,
        err && err.stack ? err.stack : err
      );

      const retryAdvice = retryable
        ? "Wait about a minute and try again."
        : "Trying again won't help on its own — this one needs us to fix it, and we can see it's happened.";

      return new AppError({
        status: 503,
        code,
        reference,
        what: failure.what || "Something broke on our side.",
        why,
        action: [failure.note, retryAdvice].filter(Boolean).join(" "),
      }).toResponse();
    }
  };
}
