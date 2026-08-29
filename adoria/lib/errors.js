// Every error a user sees should answer three questions: what happened, why,
// and what to do next. A bare "Invalid input" answers none of them and leaves
// someone re-submitting the same thing hoping for a different result.
//
// `field` lets a form put the message next to the input at fault rather than
// in a generic banner. `code` is stable for the client to branch on; the
// prose can be reworded without breaking anything.

export class AppError extends Error {
  constructor({ status = 400, code, what, why, action, field = null }) {
    super(`${what} ${why}`.trim());
    this.status = status;
    this.code = code;
    this.what = what;
    this.why = why;
    this.action = action;
    this.field = field;
  }

  toResponse() {
    return Response.json(
      {
        error: [this.what, this.why, this.action].filter(Boolean).join(" "),
        code: this.code,
        what: this.what,
        why: this.why,
        action: this.action,
        ...(this.field ? { field: this.field } : {}),
      },
      { status: this.status }
    );
  }
}

export function badRequest({ status = 400, code, what, why, action, field }) {
  return new AppError({ status, code, what, why, action, field });
}

// Wraps a route handler so nothing escapes as an unhandled rejection or a
// bare 500 with no explanation. An AppError is deliberate and passed through;
// anything else is a bug, so it's logged with full context on the server and
// reported to the user as an outage rather than leaking internals.
export function withErrorHandling(routeName, handler) {
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

      // Loud on the server. Never silent: an unexpected failure that only
      // shows as a blank 500 is a failure nobody finds out about until a
      // customer complains.
      console.error(
        `[${routeName}] unhandled error:`,
        err && err.stack ? err.stack : err
      );

      return new AppError({
        status: 503,
        code: "unavailable",
        what: "Something broke on our side.",
        why: "The request reached us but couldn't be completed, and it isn't anything you did wrong.",
        action: "Try again in a moment. If it keeps happening, message us on WhatsApp and we'll sort it out by hand.",
      }).toResponse();
    }
  };
}
