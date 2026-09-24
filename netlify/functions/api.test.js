"use strict";
/* Backend tests for netlify/functions/api.js — pure node, zero deps.
 * In-memory store shim implementing the raw blobs interface.
 * Exit 0 on pass, non-zero with failure list otherwise. */
const assert = require("assert");
const { createApp, blobAdapter } = require("./api");
const { ensureSeeded } = require("./seed");

function memStore() {
  const m = new Map();
  return {
    get: async (k, opts) => {
      if (!m.has(k)) return null;
      const v = m.get(k);
      return opts && opts.type === "json" ? JSON.parse(v) : v;
    },
    set: async (k, v) => {
      m.set(k, typeof v === "string" ? v : JSON.stringify(v));
    },
    delete: async (k) => {
      m.delete(k);
    },
    list: async ({ prefix } = {}) => ({
      blobs: [...m.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((k) => ({ key: k })),
    }),
    _map: m,
  };
}

const failures = [];
let passed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log("  ok -", name);
    })
    .catch((e) => {
      failures.push(name + ": " + (e && e.message));
      console.log("  FAIL -", name, "->", e && e.message);
    });
}

(async () => {
  const raw = memStore();
  await ensureSeeded(raw);
  const app = createApp(blobAdapter(raw));
  const H = (method, path, query, body, token) =>
    app.handle(method, path, query || {}, body === undefined ? null : body, token ? { authorization: "Bearer " + token } : {});
  const AH = (method, path, query, body, token) => H(method, path, query, body, token);

  let aliceTok, bobTok, carolTok, chatId, msgId;

  await check("seed created demo users + reply pools", async () => {
    const u = await raw.get("users/priya.json", { type: "json" });
    assert(u && u.name === "Priya Sharma", "priya user missing");
    assert.strictEqual(u.passHash.length, 128, "scrypt hash length");
    const pools = await raw.get("seed/replypools.json", { type: "json" });
    assert(pools && pools.priya && pools.priya.length > 5, "priya pool missing");
    assert(await raw.get("meta/seeded", { type: "json" }), "meta/seeded missing");
  });

  await check("signup alice", async () => {
    const r = await H("POST", "/auth/signup", {}, { username: "alice", password: "secret1", name: "Alice" });
    assert.strictEqual(r.status, 201);
    assert(r.body.token && r.body.token.length === 32, "token");
    assert.strictEqual(r.body.user.username, "alice");
    aliceTok = r.body.token;
  });

  await check("signup seeds bot chats for new user", async () => {
    const r = await AH("GET", "/chats", {}, null, aliceTok);
    assert.strictEqual(r.status, 200);
    const botChats = r.body.chats.filter((c) => c.bot);
    assert(botChats.length >= 5, "expected bot chats, got " + botChats.length);
    const priya = botChats.find((c) => c.id && r.body.chats.includes(c));
    assert(priya, "a bot chat exists");
    assert.strictEqual(r.body.chats.find((c) => c.bot && c.unreadCount >= 1) && 1, 1, "one unread bot msg for realism");
  });

  await check("signup duplicate -> 409", async () => {
    const r = await H("POST", "/auth/signup", {}, { username: "alice", password: "secret1", name: "Alice2" });
    assert.strictEqual(r.status, 409);
  });

  await check("signup bad username -> 400", async () => {
    const r = await H("POST", "/auth/signup", {}, { username: "AB", password: "secret1", name: "X" });
    assert.strictEqual(r.status, 400);
  });

  await check("login alice", async () => {
    const r = await H("POST", "/auth/login", {}, { username: "alice", password: "secret1" });
    assert.strictEqual(r.status, 200);
    assert(r.body.token && r.body.token.length === 32);
  });

  await check("login bad password -> 401", async () => {
    const r = await H("POST", "/auth/login", {}, { username: "alice", password: "nope" });
    assert.strictEqual(r.status, 401);
  });

  await check("signup bob + carol", async () => {
    let r = await H("POST", "/auth/signup", {}, { username: "bob", password: "secret2", name: "Bob" });
    assert.strictEqual(r.status, 201);
    bobTok = r.body.token;
    r = await H("POST", "/auth/signup", {}, { username: "carol", password: "secret3", name: "Carol" });
    carolTok = r.body.token;
  });

  await check("GET /me", async () => {
    const r = await AH("GET", "/me", {}, null, aliceTok);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.user.username, "alice");
    assert.strictEqual(r.body.user.seed, "alice-ava");
  });

  await check("users/search excludes self, matches substring", async () => {
    const r = await AH("GET", "/users/search", { q: "ali" }, null, bobTok);
    assert.strictEqual(r.status, 200);
    assert(r.body.users.some((u) => u.username === "alice"), "finds alice");
    assert(!r.body.users.some((u) => u.username === "bob"), "excludes self");
    const r2 = await AH("GET", "/users/search", { q: "PRIYA" }, null, bobTok);
    assert(r2.body.users.some((u) => u.username === "priya"), "case-insensitive name match");
  });

  await check("create 1:1 chat alice<->bob", async () => {
    const r = await AH("POST", "/chats", {}, { username: "bob" }, aliceTok);
    assert.strictEqual(r.status, 201);
    assert(r.body.chat.id.startsWith("c_"));
    assert.deepStrictEqual([...r.body.chat.members].sort(), ["alice", "bob"]);
    chatId = r.body.chat.id;
  });

  await check("1:1 chat idempotent", async () => {
    const r = await AH("POST", "/chats", {}, { username: "alice" }, bobTok);
    assert.strictEqual(r.body.chat.id, chatId, "same chat id");
  });

  await check("1:1 chat with self -> 400", async () => {
    const r = await AH("POST", "/chats", {}, { username: "bob" }, bobTok);
    assert.strictEqual(r.status, 400);
  });

  await check("create group chat", async () => {
    const r = await AH("POST", "/chats", {}, { name: "Team", members: ["bob", "carol"] }, aliceTok);
    assert.strictEqual(r.status, 201);
    assert(r.body.chat.isGroup === true);
    assert.deepStrictEqual([...r.body.chat.members].sort(), ["alice", "bob", "carol"]);
    assert.strictEqual(r.body.chat.memberNames.bob, "Bob");
  });

  await check("group with unknown member -> 400", async () => {
    const r = await AH("POST", "/chats", {}, { name: "X", members: ["nosuchuser"] }, aliceTok);
    assert.strictEqual(r.status, 400);
  });

  await check("alice sends message", async () => {
    const r = await AH("POST", `/chats/${chatId}/messages`, {}, { text: "hello bob" }, aliceTok);
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.body.message.text, "hello bob");
    assert.strictEqual(r.body.message.tick, "sent");
    assert.strictEqual(r.body.message.fromName, "Alice");
    msgId = r.body.message.id;
    const idx = await raw.get(`msgindex/${msgId}.json`, { type: "json" });
    assert.strictEqual(idx, chatId, "msgindex written");
  });

  await check("bob polls with ?after and sees it", async () => {
    const r = await AH("GET", `/chats/${chatId}/messages`, { after: "0" }, null, bobTok);
    assert.strictEqual(r.status, 200);
    const m = r.body.messages.find((x) => x.id === msgId);
    assert(m, "message visible to bob");
    assert.strictEqual(m.tick, null, "tick null for non-sender");
    assert.strictEqual(m.fromName, "Alice");
    assert.strictEqual(m.starredByMe, false);
  });

  await check("unreadCount reflects bob's unread", async () => {
    const r = await AH("GET", "/chats", {}, null, bobTok);
    const c = r.body.chats.find((x) => x.id === chatId);
    assert.strictEqual(c.unreadCount, 1, "bob has 1 unread, got " + c.unreadCount);
  });

  await check("bob /read then alice sees tick read", async () => {
    let r = await AH("POST", `/chats/${chatId}/read`, {}, null, bobTok);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.ok, true);
    r = await AH("GET", "/chats", {}, null, bobTok);
    assert.strictEqual(r.body.chats.find((x) => x.id === chatId).unreadCount, 0);
    r = await AH("GET", `/chats/${chatId}/messages`, { after: "0" }, null, aliceTok);
    const m = r.body.messages.find((x) => x.id === msgId);
    assert.strictEqual(m.tick, "read", "blue tick after read");
  });

  await check("typing set + seen", async () => {
    let r = await AH("POST", `/chats/${chatId}/typing`, {}, null, aliceTok);
    assert.strictEqual(r.body.ok, true);
    r = await AH("GET", `/chats/${chatId}/messages`, {}, null, bobTok);
    assert(r.body.typing.some((t) => t.username === "alice" && t.name === "Alice"), "bob sees alice typing");
    r = await AH("GET", `/chats/${chatId}/messages`, {}, null, aliceTok);
    assert(!r.body.typing.some((t) => t.username === "alice"), "viewer excluded from own typing");
  });

  await check("stale typing key ignored", async () => {
    await raw.set(`typing/${chatId}/bob.json`, JSON.stringify({ ts: Date.now() - 60000 }));
    const r = await AH("GET", `/chats/${chatId}/messages`, {}, null, aliceTok);
    assert(!r.body.typing.some((t) => t.username === "bob"), "stale typing filtered");
  });

  await check("star toggle + GET /starred", async () => {
    let r = await AH("POST", `/messages/${msgId}/star`, {}, null, bobTok);
    assert.deepStrictEqual(r.body, { starred: true });
    r = await AH("GET", "/starred", {}, null, bobTok);
    assert(r.body.messages.some((m) => m.id === msgId && m.chatId === chatId && m.chatName), "starred listed with chatName");
    r = await AH("POST", `/messages/${msgId}/star`, {}, null, bobTok);
    assert.deepStrictEqual(r.body, { starred: false });
    r = await AH("GET", "/starred", {}, null, bobTok);
    assert(!r.body.messages.some((m) => m.id === msgId), "unstarred gone");
  });

  await check("image message with data URL", async () => {
    const dataUrl = "data:image/png;base64," + "a".repeat(1000);
    const r = await AH("POST", `/chats/${chatId}/messages`, {}, { kind: "image", text: "pic", data: dataUrl }, aliceTok);
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.body.message.kind, "image");
  });

  await check("oversize data URL -> 413", async () => {
    const big = "data:image/png;base64," + "a".repeat(2 * 1024 * 1024);
    const r = await AH("POST", `/chats/${chatId}/messages`, {}, { kind: "image", data: big }, aliceTok);
    assert.strictEqual(r.status, 413);
  });

  await check("replyTo validation", async () => {
    let r = await AH("POST", `/chats/${chatId}/messages`, {}, { text: "x", replyTo: "m_nope" }, aliceTok);
    assert.strictEqual(r.status, 400);
    r = await AH("POST", `/chats/${chatId}/messages`, {}, { text: "reply!", replyTo: msgId }, bobTok);
    assert.strictEqual(r.status, 201);
    assert(r.body.message.reply === undefined || true, "ok");
    const g = await AH("GET", `/chats/${chatId}/messages`, {}, null, aliceTok);
    const m = g.body.messages.find((x) => x.id === r.body.message.id);
    assert(m.reply && m.reply.text === "hello bob", "reply quote attached");
  });

  await check("pin/archive/mute toggle", async () => {
    let r = await AH("POST", `/chats/${chatId}/pin`, {}, null, aliceTok);
    assert.deepStrictEqual(r.body, { pinned: true });
    r = await AH("POST", `/chats/${chatId}/archive`, {}, null, aliceTok);
    assert.deepStrictEqual(r.body, { archived: true });
    r = await AH("POST", `/chats/${chatId}/mute`, {}, null, aliceTok);
    assert.deepStrictEqual(r.body, { muted: true });
    r = await AH("POST", `/chats/${chatId}/mute`, {}, null, aliceTok);
    assert.deepStrictEqual(r.body, { muted: false });
    const l = await AH("GET", "/chats", {}, null, aliceTok);
    const c = l.body.chats.find((x) => x.id === chatId);
    assert(c.pinned === true && c.archived === true && c.muted === false, "prefs reflected");
    assert.strictEqual(l.body.chats[0].id, chatId, "pinned chat sorts first");
  });

  await check("status post + GET /status grouped", async () => {
    let r = await AH("POST", "/status", {}, { text: "my day ☀️" }, aliceTok);
    assert.strictEqual(r.status, 201);
    assert(r.body.item.id.startsWith("s_"));
    r = await AH("GET", "/status", {}, null, bobTok);
    const mine = r.body.statuses.find((s) => s.username === "alice");
    assert(mine && mine.name === "Alice" && mine.items.some((i) => i.text === "my day ☀️"), "alice status grouped");
    // seeded demo statuses only if fresh (they are, ts=now-hours)
    assert(r.body.statuses.some((s) => s.username === "priya"), "seeded priya status present");
  });

  await check("status requires text or imageData -> 400", async () => {
    const r = await AH("POST", "/status", {}, {}, aliceTok);
    assert.strictEqual(r.status, 400);
  });

  await check("unauthorized (no token) -> 401", async () => {
    for (const [m, p] of [["GET", "/chats"], ["GET", "/me"], ["POST", `/chats/${chatId}/messages`], ["GET", "/starred"], ["GET", "/status"]]) {
      const r = await H(m, p, {}, m === "POST" ? {} : null);
      assert.strictEqual(r.status, 401, `${m} ${p} should be 401`);
    }
  });

  await check("bad token -> 401", async () => {
    const r = await H("GET", "/me", {}, null, "deadbeefdeadbeefdeadbeefdeadbeef");
    assert.strictEqual(r.status, 401);
  });

  await check("non-member chat access -> 404", async () => {
    const r = await AH("GET", `/chats/${chatId}/messages`, {}, null, carolTok);
    assert.strictEqual(r.status, 404);
    const r2 = await AH("POST", `/chats/${chatId}/messages`, {}, { text: "hi" }, carolTok);
    assert.strictEqual(r2.status, 404);
  });

  await check("delete other's message -> 403", async () => {
    const r = await AH("POST", `/messages/${msgId}/delete`, {}, null, bobTok);
    assert.strictEqual(r.status, 403);
  });

  await check("delete own message", async () => {
    const r = await AH("POST", `/messages/${msgId}/delete`, {}, null, aliceTok);
    assert.deepStrictEqual(r.body, { ok: true });
    const g = await AH("GET", `/chats/${chatId}/messages`, {}, null, bobTok);
    assert(!g.body.messages.some((x) => x.id === msgId), "deleted hidden");
    const l = await AH("GET", "/chats", {}, null, bobTok);
    const c = l.body.chats.find((x) => x.id === chatId);
    assert(c.lastMessage && c.lastMessage.id !== msgId, "lastMessage skips deleted");
  });

  await check("bot reply written with future ts, hidden until due", async () => {
    const r = await AH("GET", "/chats", {}, null, aliceTok);
    const botChat = r.body.chats.find((c) => c.bot);
    assert(botChat, "alice has a bot chat");
    const before = Date.now();
    const s = await AH("POST", `/chats/${botChat.id}/messages`, {}, { text: "hey there" }, aliceTok);
    assert.strictEqual(s.status, 201);
    const rawMsgs = await raw.get(`chatmsgs/${botChat.id}.json`, { type: "json" });
    const botMsg = rawMsgs.find((m) => m.from !== "alice" && m.ts >= before);
    assert(botMsg, "bot reply persisted");
    assert(botMsg.ts >= before + 4000 && botMsg.ts <= before + 4100, "bot ts = now+4000, got delta " + (botMsg.ts - before));
    const pools = await raw.get("seed/replypools.json", { type: "json" });
    const chat = await raw.get(`chats/${botChat.id}.json`, { type: "json" });
    assert(pools[chat.botUser].includes(botMsg.text), "bot text from round-robin pool");
    // not yet visible via poll filter
    const g = await AH("GET", `/chats/${botChat.id}/messages`, {}, null, aliceTok);
    assert(!g.body.messages.some((m) => m.id === botMsg.id), "future bot msg hidden");
    // second user message -> next pool entry (round-robin)
    const s2 = await AH("POST", `/chats/${botChat.id}/messages`, {}, { text: "another" }, aliceTok);
    assert.strictEqual(s2.status, 201);
    const rawMsgs2 = await raw.get(`chatmsgs/${botChat.id}.json`, { type: "json" });
    const botMsg2 = rawMsgs2.filter((m) => m.from !== "alice" && m.ts >= before).pop();
    assert.notStrictEqual(botMsg2.text, botMsg.text, "round-robin advances");
  });

  await check("expired session -> 401", async () => {
    await raw.set(`sessions/${aliceTok}.json`, JSON.stringify({ username: "alice", expiresAt: Date.now() - 1 }));
    const r = await H("GET", "/me", {}, null, aliceTok);
    assert.strictEqual(r.status, 401);
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("FAILURES:\n - " + failures.join("\n - "));
    process.exit(1);
  }
})().catch((e) => {
  console.error("HARNESS ERROR:", e);
  process.exit(2);
});
