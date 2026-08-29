// URLs that come from the environment are checked here rather than trusted.
// Two failure modes this prevents:
//
//   1. SITE_URL unset. The old code built `${undefined}/api/toyyibpay-callback`
//      and handed that to the payment provider. The order would be paid and
//      the callback would never arrive, with nothing logged — money taken,
//      order stuck on Pending, and no signal anywhere.
//   2. TOYYIBPAY_BASE_URL pointing somewhere unexpected. That value decides
//      where the secret key gets POSTed, so it's restricted to hosts we
//      actually deal with instead of anything that parses as a URL.

const TOYYIBPAY_ALLOWED_HOSTS = new Set(["toyyibpay.com", "dev.toyyibpay.com"]);

function parseUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${name} is not a valid URL (got ${JSON.stringify(value)}). ` +
        `Set it to a full origin including https://, with no trailing slash.`
    );
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error(
      `${name} must use https (got ${url.protocol}//). Only localhost may use http.`
    );
  }
  return url;
}

// The site's own public origin, used to build the payment return/callback
// URLs. Throws rather than returning a broken string.
export function getSiteUrl() {
  const raw = process.env.SITE_URL;
  if (!raw) {
    throw new Error(
      "SITE_URL is not set. It's needed to build the payment return and callback " +
        "URLs — without it the payment provider has nowhere to send the customer " +
        "back to, or to confirm the payment. Set it in Netlify's environment " +
        "variables to the site's full public URL, no trailing slash."
    );
  }
  const url = parseUrl(raw, "SITE_URL");
  return url.origin;
}

export function getToyyibpayBaseUrl() {
  const raw = process.env.TOYYIBPAY_BASE_URL || "https://toyyibpay.com";
  const url = parseUrl(raw, "TOYYIBPAY_BASE_URL");
  if (!TOYYIBPAY_ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(
      `TOYYIBPAY_BASE_URL points at ${url.hostname}, which is not a ToyyibPay host. ` +
        `The secret key is sent to this address, so it's restricted to ` +
        `${[...TOYYIBPAY_ALLOWED_HOSTS].join(" or ")}.`
    );
  }
  return url.origin;
}

// Called at the top of the routes that need payment configured, so a
// misconfigured deploy fails on the first request with a precise message
// instead of halfway through taking someone's money.
export function requirePaymentConfig() {
  const missing = [];
  if (!process.env.TOYYIBPAY_SECRET_KEY) missing.push("TOYYIBPAY_SECRET_KEY");
  if (!process.env.TOYYIBPAY_CATEGORY_CODE) missing.push("TOYYIBPAY_CATEGORY_CODE");
  if (missing.length) {
    throw new Error(
      `Payment is not configured: ${missing.join(" and ")} ${
        missing.length === 1 ? "is" : "are"
      } not set. Add ${missing.length === 1 ? "it" : "them"} in Netlify's environment variables.`
    );
  }
  return { siteUrl: getSiteUrl(), baseUrl: getToyyibpayBaseUrl() };
}
