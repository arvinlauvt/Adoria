// In-memory stand-ins for Upstash Redis and the Airtable Users table, so the
// auth flow can be developed and tested without provisioning either service.
//
// SAFETY: these are opt-in only. Nothing here activates unless
// AUTH_ALLOW_INMEMORY_STORE is explicitly "true", and it is refused outright
// on Netlify. Silently degrading to in-memory storage in production would
// mean unshared sessions, meaningless rate limits, and users vanishing
// between requests — so the failure mode is a loud throw, never a fallback.

export function inMemoryStoreAllowed() {
  if (process.env.NETLIFY) return false;
  return process.env.AUTH_ALLOW_INMEMORY_STORE === "true";
}

export function warnInMemory(what) {
  console.warn(
    `[auth] ${what} is using the IN-MEMORY DEV STORE. Data is per-process and ` +
      `lost on restart. This must never be enabled in production.`
  );
}

// --- Redis stand-in -------------------------------------------------------
// Implements only the commands lib/auth/* actually uses: get, set (with ex),
// del, incr, expire, ttl.

export function createInMemoryRedis() {
  const store = new Map(); // key -> { value, expiresAt|null }

  function live(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  return {
    async get(key) {
      const entry = live(key);
      return entry ? entry.value : null;
    },
    async set(key, value, opts = {}) {
      const expiresAt = opts.ex ? Date.now() + opts.ex * 1000 : null;
      store.set(key, { value, expiresAt });
      return "OK";
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async incr(key) {
      const entry = live(key);
      const next = (entry ? Number(entry.value) : 0) + 1;
      store.set(key, {
        value: next,
        expiresAt: entry ? entry.expiresAt : null,
      });
      return next;
    },
    async expire(key, seconds) {
      const entry = live(key);
      if (!entry) return 0;
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    },
    async ttl(key) {
      const entry = live(key);
      if (!entry) return -2; // Redis: key does not exist
      if (entry.expiresAt === null) return -1; // Redis: no expiry set
      return Math.ceil((entry.expiresAt - Date.now()) / 1000);
    },
  };
}

// --- Airtable Orders stand-in ---------------------------------------------
// Only the operations the admin dashboard needs, plus create for seeding.

export function createInMemoryOrders() {
  const records = new Map();
  let counter = 0;

  return {
    async createOrder(fields) {
      const id = `recORD${String(++counter).padStart(11, "0")}`;
      const record = { id, fields: { ...fields } };
      records.set(id, record);
      return record;
    },
    async listOrders() {
      // Newest first, matching the real query's sort.
      return [...records.values()].sort((a, b) =>
        String(b.fields["Order Date"] || "").localeCompare(String(a.fields["Order Date"] || ""))
      );
    },
    async getOrder(id) {
      return records.get(id) || null;
    },
    async updateOrder(id, fields) {
      const record = records.get(id);
      if (!record) throw new Error(`Dev store: no order ${id}`);
      record.fields = { ...record.fields, ...fields };
      return record;
    },
  };
}

// --- Airtable Users stand-in ----------------------------------------------
// Mimics the shape lib/users.js expects back from Airtable: records with an
// `id` and a `fields` object.

export function createInMemoryUsers() {
  const records = new Map(); // id -> { id, fields }
  let counter = 0;

  return {
    async createUser(fields) {
      const id = `recDEV${String(++counter).padStart(11, "0")}`;
      const record = { id, fields: { ...fields } };
      records.set(id, record);
      return record;
    },
    async findUserByEmail(email) {
      const target = String(email).toLowerCase();
      for (const record of records.values()) {
        if (String(record.fields.Email || "").toLowerCase() === target) {
          return record;
        }
      }
      return null;
    },
    async getUserById(id) {
      return records.get(id) || null;
    },
    async updateUser(id, fields) {
      const record = records.get(id);
      if (!record) throw new Error(`Dev store: no user ${id}`);
      record.fields = { ...record.fields, ...fields };
      return record;
    },
  };
}
