import { badRequest } from "./errors";

// Nothing reaches Airtable, a formula, or an email without passing through
// here first. Two jobs: refuse anything oversized or malformed before it
// costs us work, and normalise what's left so downstream code can assume
// clean strings.

// Whole-body ceiling. Without it, a single request can stream megabytes into
// memory and then into Airtable. 64KB is far above any legitimate order (the
// longest field is a 1300-character letter).
export const MAX_BODY_BYTES = 64 * 1024;

// Per-field ceilings, mirroring what the forms actually allow. The client
// enforces these for feedback; these are the ones that count.
export const LIMITS = {
  name: 120,
  email: 254, // RFC 5321 maximum
  phone: 32,
  recipientName: 120,
  street: 300,
  city: 100,
  state: 100,
  postcode: 20,
  productEdition: 80,
  cubeBreakdown: 2000,
  cardMessage: 1300,
  addonType: 80,
  addonDetail: 200,
  messageType: 40,
  orderId: 64,
  billCode: 64,
  recordId: 40,
  code: 32,
  token: 512,
  password: 200, // bcrypt only uses the first 72 bytes; this stops a huge
  // string burning CPU in the hash before we ever get there
};

// Control characters (except tab/newline/carriage return) have no place in a
// name or an address. They're invisible, they corrupt CSV exports, and
// they're a common way to smuggle payloads past naive checks.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function stripControl(value) {
  return String(value).replace(CONTROL_CHARS, "");
}

// Reads and parses a JSON body with a hard size ceiling. Checks the declared
// Content-Length first (cheap), then measures what actually arrived, because
// a client can lie about or omit the header.
export async function readJsonBody(req) {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) {
    throw badRequest({
      code: "body_too_large",
      what: "That request was too big to accept.",
      why: `It was over the ${Math.round(MAX_BODY_BYTES / 1024)}KB limit we allow for a single submission.`,
      action: "Shorten the longest field — usually the card message — and send it again.",
    });
  }

  let raw;
  try {
    raw = await req.text();
  } catch {
    throw badRequest({
      code: "body_unreadable",
      what: "We couldn't read that request.",
      why: "The connection ended before the whole thing arrived.",
      action: "Check your connection and try again.",
    });
  }

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw badRequest({
      code: "body_too_large",
      what: "That request was too big to accept.",
      why: `It was over the ${Math.round(MAX_BODY_BYTES / 1024)}KB limit we allow for a single submission.`,
      action: "Shorten the longest field — usually the card message — and send it again.",
    });
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed;
  } catch {
    throw badRequest({
      code: "body_malformed",
      what: "We couldn't understand that request.",
      why: "The data didn't arrive in the format the form sends.",
      action: "Reload the page and fill the form in again rather than resubmitting.",
    });
  }
}

// A required string: trimmed, control characters removed, length-capped.
export function requiredString(value, { field, label, max, min = 1 }) {
  const cleaned = stripControl(value == null ? "" : value).trim();

  if (cleaned.length < min) {
    throw badRequest({
      field,
      code: "field_missing",
      what: `${label} is missing.`,
      why: "We can't process the order without it.",
      action: `Fill in ${label.toLowerCase()} and submit again.`,
    });
  }
  if (cleaned.length > max) {
    throw badRequest({
      field,
      code: "field_too_long",
      what: `${label} is too long.`,
      why: `We allow up to ${max} characters and that was ${cleaned.length}.`,
      action: `Shorten ${label.toLowerCase()} and submit again.`,
    });
  }
  return cleaned;
}

export function optionalString(value, { field, label, max }) {
  const cleaned = stripControl(value == null ? "" : value).trim();
  if (!cleaned) return "";
  if (cleaned.length > max) {
    throw badRequest({
      field,
      code: "field_too_long",
      what: `${label} is too long.`,
      why: `We allow up to ${max} characters and that was ${cleaned.length}.`,
      action: `Shorten ${label.toLowerCase()} and submit again.`,
    });
  }
  return cleaned;
}

export function emailField(value, { field = "email", label = "Email" } = {}) {
  const cleaned = requiredString(value, { field, label, max: LIMITS.email }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    throw badRequest({
      field,
      code: "email_invalid",
      what: "That email address doesn't look right.",
      why: "It's missing an @ or the part after the dot.",
      action: "Check for a typo and enter it again — this is where your order updates go.",
    });
  }
  return cleaned;
}

// Forgiving by design: spaces, dashes, brackets and a +country code are all
// fine. We only care that there are a plausible number of digits.
export function phoneField(value, { field = "phone", label = "Phone number" } = {}) {
  const cleaned = requiredString(value, { field, label, max: LIMITS.phone });
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw badRequest({
      field,
      code: "phone_invalid",
      what: "That phone number doesn't look right.",
      why: `We counted ${digits.length} digits, and a real number has between 7 and 15.`,
      action: "Enter it again — spaces, dashes and a +60 prefix are all fine.",
    });
  }
  return cleaned;
}

export function postcodeField(value, { field = "postcode", label = "Postcode" } = {}) {
  const cleaned = requiredString(value, { field, label, max: LIMITS.postcode });
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length !== 5) {
    throw badRequest({
      field,
      code: "postcode_invalid",
      what: "That postcode doesn't look right.",
      why: `Malaysian postcodes are 5 digits and that one had ${digits.length}.`,
      action: "Check it and enter it again.",
    });
  }
  return digits;
}

export function integerField(value, { field, label, min, max }) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest({
      field,
      code: "number_out_of_range",
      what: `${label} isn't a value we can accept.`,
      why: `It has to be a whole number between ${min} and ${max}.`,
      action: `Adjust ${label.toLowerCase()} and try again.`,
    });
  }
  return n;
}

export function dateOnlyField(value, { field = "occasionDate", label = "Delivery date" } = {}) {
  const cleaned = requiredString(value, { field, label, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw badRequest({
      field,
      code: "date_invalid",
      what: "That delivery date isn't in a format we recognise.",
      why: "Dates need to arrive as YYYY-MM-DD, and that one didn't.",
      action: "Pick the date again from the calendar rather than typing it.",
    });
  }
  const parsed = new Date(`${cleaned}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || cleaned !== parsed.toISOString().slice(0, 10)) {
    throw badRequest({
      field,
      code: "date_invalid",
      what: "That delivery date doesn't exist.",
      why: "The calendar day you sent isn't a real one — for example the 31st of a 30-day month.",
      action: "Pick the date again from the calendar.",
    });
  }
  return cleaned;
}

// One of a fixed set. Anything else is either a stale client or a tampered
// request, and neither should be written through to the database.
export function enumField(value, allowed, { field, label }) {
  const cleaned = stripControl(value == null ? "" : value).trim();
  if (!allowed.includes(cleaned)) {
    throw badRequest({
      field,
      code: "value_not_allowed",
      what: `${label} isn't one of the options we offer.`,
      why: "The value sent doesn't match anything on our list, which usually means the page was open a while and is now out of date.",
      action: "Reload the page and choose again.",
    });
  }
  return cleaned;
}

// Airtable formula strings are built by interpolation, so anything that ends
// up inside one has to have its quotes and backslashes escaped or a crafted
// value can break out of the string literal and rewrite the filter.
export function escapeFormulaValue(value) {
  return stripControl(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
