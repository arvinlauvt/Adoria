import { Redis } from "@upstash/redis";
import { inMemoryStoreAllowed, createInMemoryRedis, warnInMemory } from "./devStore";

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
  if (url && token) {
    client = new Redis({ url, token });
    return client;
  }

  // No credentials. Fall back only if a developer has explicitly opted in —
  // never silently, since in-memory sessions and rate limits would look like
  // they work while providing none of the guarantees they're there for.
  if (inMemoryStoreAllowed()) {
    warnInMemory("Session/rate-limit store");
    client = createInMemoryRedis();
    return client;
  }

  throw new Error(
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — see .env.example."
  );
}
