import { Redis } from "@upstash/redis";

// Everything auth needs that Airtable can't safely provide: sessions,
// rate-limit counters, and short-lived reset/2FA tokens. All of it needs
// to be atomic and self-expiring, which Airtable has no primitive for.
//
// Lazily constructed (not at import time) so the app can still build and
// every non-auth route can still run before these env vars exist.
let client = null;

export function getRedis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — see .env.example."
    );
  }
  client = new Redis({ url, token });
  return client;
}
