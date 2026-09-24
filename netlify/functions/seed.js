"use strict";
/* Seeding for the WhatsApp-clone backend (Netlify Blobs).
 *
 * ensureSeeded(store) — lazy one-time seed of demo users + reply pools.
 * seedUser(store, username) — per-signup: 1:1 bot chats with every demo user.
 *
 * `store` here is the RAW blobs store: get(key,{type:"json"}),
 * set(key, stringValue), delete(key), list({prefix}) -> {blobs:[{key}]}.
 *
 * NOTE for the frontend agent: seeded demo status items carry
 * imageData as an https://picsum.photos/... URL (not a data-URL), so the
 * status viewer must handle both remote URLs and data-URLs in imageData.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const randHex = (n) => crypto.randomBytes(n).toString("hex");
const rid = (p) => p + Date.now().toString(36) + randHex(4);
const slug = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
const scryptHex = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");

const FALLBACK_REPLIES = [
  "haha nice 😄",
  "okay okay",
  "fr tho",
  "lol exactly",
  "say less 😎",
  "bet 👍",
  "interesting... tell me more",
  "no way 😂",
  "that's actually cool",
  "on my way, 5 mins",
];

function loadFrontendData() {
  const dir = path.join(__dirname, "..", "..", "js", "data");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  // Data files use both `window.W` and bare `W`; alias them to one object.
  vm.runInContext("var W = window.W = window.W || {};", sandbox);
  for (const f of ["chats.js", "messages.js", "replies.js", "statuses.js"]) {
    const code = fs.readFileSync(path.join(dir, f), "utf8");
    vm.runInContext(code, sandbox, { filename: f });
  }
  return sandbox.window.W; // {data:{chats,attachMessages,statuses}, pick, brain, FALLBACKS}
}

/* Build per-DM-contact reply pools by actually probing W.brain() from
 * replies.js with sample user texts — so the pools are genuinely derived
 * from replies.js, not hand-written. */
function buildReplyPools(W) {
  const pools = {};
  const probes = [
    "hi", "hello", "hey", "how are you", "what's up", "ok", "lol", "nice",
    "thanks", "bye", "see you", "?", "book tickets", "movie night",
    "cricket match", "dinner", "party", "work", "meeting", "deploy",
    "bug", "weekend plans", "good morning", "where are you",
  ];
  for (const c of (W.data.chats || []).filter((x) => x.type === "dm")) {
    const set = new Set();
    const fakeChat = { id: c.id, name: c.name, participants: [] };
    for (const p of probes) {
      for (let i = 0; i < 4; i++) {
        try {
          const r = W.brain(fakeChat, p);
          if (typeof r === "string" && r.trim()) set.add(r.trim());
        } catch (e) { /* brain branch we can't probe; ignore */ }
      }
    }
    for (const f of W.FALLBACKS || FALLBACK_REPLIES) set.add(f);
    pools[c.id] = [...set].slice(0, 40);
    if (!pools[c.id].length) pools[c.id] = [...FALLBACK_REPLIES];
  }
  return pools;
}

function agoMs(label) {
  const m = /(\d+)\s*h/i.exec(String(label || ""));
  return m ? parseInt(m[1], 10) * 3600e3 : 5 * 3600e3;
}

async function putUser(store, username, name, seed, demo) {
  const salt = randHex(16);
  await store.set(
    `users/${username}.json`,
    JSON.stringify({
      username,
      name,
      seed: seed || `${username}-ava`,
      passHash: scryptHex("password", salt),
      salt,
      createdAt: Date.now(),
      demo: !!demo, // demo bot users vs real signups
    })
  );
}

async function ensureSeeded(store) {
  if (await store.get("meta/seeded", { type: "json" })) return;

  const W = loadFrontendData();
  const chats = W.data.chats || [];
  const statuses = W.data.statuses || [];

  // 1. Reply pools per DM contact, derived from replies.js.
  await store.set("seed/replypools.json", JSON.stringify(buildReplyPools(W)));

  // 2. Demo users: every distinct chat partner.
  //    DM contacts use their chat id as username (priya, arjun, ...);
  //    group participants use a slug of their display name.
  const created = new Set();
  const statusSeedByName = {};
  for (const s of statuses) if (s.name) statusSeedByName[s.name] = s.seed;

  const addUser = async (username, name, seed) => {
    if (!username || created.has(username)) return;
    created.add(username);
    await putUser(store, username, name, seed, true);
    await store.set(`userchats/${username}.json`, JSON.stringify([]));
    await store.set(`status/${username}.json`, JSON.stringify({ items: [] }));
  };

  for (const c of chats) {
    if (c.type === "dm") await addUser(c.id, c.name, c.seed);
  }
  for (const c of chats) {
    if (c.type !== "group") continue;
    for (const p of c.participants || []) {
      await addUser(slug(p), p, statusSeedByName[p] || `${slug(p)}-ava`);
    }
  }

  // 3. A few seeded status items (text + picsum URL imageData — see note top).
  for (const sid of ["priya", "arjun", "aisha"]) {
    const s = statuses.find((x) => x.id === sid);
    if (!s || !created.has(sid)) continue;
    const items = (s.items || []).map((it, i) => ({
      id: rid("s_"),
      text: it.caption || "",
      imageData: `https://picsum.photos/seed/${it.seed || sid + i}/600/800`,
      ts: Date.now() - agoMs(it.time),
    }));
    await store.set(`status/${sid}.json`, JSON.stringify({ items }));
  }

  await store.set("meta/seeded", JSON.stringify({ at: Date.now() }));
}

async function addToUserChats(store, username, chatId) {
  const key = `userchats/${username}.json`;
  const list = (await store.get(key, { type: "json" })) || [];
  if (!list.includes(chatId)) list.push(chatId);
  await store.set(key, JSON.stringify(list));
}

/* Per-signup seeding: a 1:1 bot chat with every demo user, 3 bot-sent
 * greeting messages staggered in the past — first two marked read,
 * last one left unread for realism. */
async function seedUser(store, newUsername) {
  const pools = (await store.get("seed/replypools.json", { type: "json" })) || {};
  const me = (await store.get(`users/${newUsername}.json`, { type: "json" })) || {};
  const myName = me.name || newUsername;
  const now = Date.now();

  const userKeys = (await store.list({ prefix: "users/" })).blobs.map((b) => b.key);
  for (const key of userKeys) {
    const u = key.slice("users/".length, -".json".length);
    if (u === newUsername) continue;
    const other = (await store.get(key, { type: "json" })) || {};
    if (!other.demo) continue; // bot chats only with demo users, never real signups
    const pool = pools[u] && pools[u].length ? pools[u] : FALLBACK_REPLIES;

    const chatId = "c_" + randHex(6);
    const msgs = [
      {
        id: rid("m_"), chatId, from: u,
        text: pool[0] || "Hey! 👋", kind: "text", data: null, replyTo: null,
        ts: now - 3 * 864e5, readBy: [newUsername], stars: [], deleted: false,
      },
      {
        id: rid("m_"), chatId, from: u,
        text: pool[1] || pool[0] || "How have you been?", kind: "text", data: null, replyTo: null,
        ts: now - 2 * 864e5, readBy: [newUsername], stars: [], deleted: false,
      },
      {
        id: rid("m_"), chatId, from: u,
        text: pool[2] || pool[1] || pool[0] || "Ping me when you're free!",
        kind: "text", data: null, replyTo: null,
        ts: now - 5 * 60e3, readBy: [], stars: [], deleted: false,
      },
    ];

    const chat = {
      id: chatId,
      name: other.name || u,
      isGroup: false,
      members: [newUsername, u],
      memberNames: { [newUsername]: myName, [u]: other.name || u },
      createdBy: u,
      createdAt: now - 3 * 864e5,
      bot: true,
      botUser: u,
      botIdx: 0,
      prefs: {},
    };

    await store.set(`chats/${chatId}.json`, JSON.stringify(chat));
    await store.set(`chatmsgs/${chatId}.json`, JSON.stringify(msgs));
    for (const m of msgs) {
      await store.set(`msgindex/${m.id}.json`, JSON.stringify(chatId));
    }
    await addToUserChats(store, newUsername, chatId);
    await addToUserChats(store, u, chatId);
  }
}

module.exports = { ensureSeeded, seedUser };
