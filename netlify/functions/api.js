"use strict";
/* WhatsApp-clone backend — single Netlify Function, manual routing.
 *
 * Deploy: netlify.toml sets [functions] directory = "netlify/functions";
 * _redirects maps /api/* -> /.netlify/functions/api (200 rewrite).
 * node_modules is vendored inside netlify/functions (no build step).
 *
 * Exported for tests: createApp(adapter), blobAdapter(rawStore).
 * The adapter exposes ONLY:
 *   getJson(key)          -> store.get(key, {type:"json"})
 *   setJson(key, value)   -> store.set(key, JSON.stringify(value))
 *   del(key)              -> store.delete(key)
 *   listKeys(prefix)      -> (await store.list({prefix})).blobs.map(b=>b.key)
 */
const crypto = require("crypto");
const { ensureSeeded, seedUser } = require("./seed");

/* ---------------- helpers ---------------- */
const randHex = (n) => crypto.randomBytes(n).toString("hex");
const newChatId = () => "c_" + randHex(6);
const newMsgId = () => "m_" + Date.now().toString(36) + randHex(4);
const newToken = () => randHex(16); // 32 hex chars
const newStatusId = () => "s_" + Date.now().toString(36) + randHex(4);
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const SESSION_TTL = 30 * 24 * 3600 * 1000;
const MAX_DATA_URL_BYTES = Math.floor(1.5 * 1024 * 1024);
const TYPING_WINDOW_MS = 6000;
const STATUS_TTL = 24 * 3600 * 1000;

const USERNAME_RE = /^[a-z0-9]{3,20}$/;
const publicUser = (u) => ({ username: u.username, name: u.name, seed: u.seed });

function blobAdapter(store) {
  return {
    raw: store,
    getJson: (key) => store.get(key, { type: "json" }),
    setJson: (key, value) => store.set(key, JSON.stringify(value)),
    del: (key) => store.delete(key),
    listKeys: async (prefix) =>
      (await store.list({ prefix })).blobs.map((b) => b.key),
  };
}

function createApp(store) {
  /* store = blobAdapter above */

  const ok = (body, status = 200) => ({ status, body });
  const err = (message, status = 400) => ({ status, body: { error: message } });

  async function currentUser(headers) {
    const h = headers["authorization"] || headers["Authorization"] || "";
    const m = /^Bearer\s+([0-9a-fA-F]{32})$/.exec(String(h).trim());
    if (!m) return null;
    const sess = await store.getJson(`sessions/${m[1].toLowerCase()}.json`);
    if (!sess || !sess.username || sess.expiresAt < Date.now()) return null;
    const u = await store.getJson(`users/${sess.username}.json`);
    return u || null;
  }

  async function getChat(id) {
    return store.getJson(`chats/${id}.json`);
  }
  async function getMessages(chatId) {
    return (await store.getJson(`chatmsgs/${chatId}.json`)) || [];
  }
  async function saveMessages(chatId, msgs) {
    await store.setJson(`chatmsgs/${chatId}.json`, msgs);
  }
  async function saveChat(chat) {
    await store.setJson(`chats/${chat.id}.json`, chat);
  }
  async function myChatIds(username) {
    return (await store.getJson(`userchats/${username}.json`)) || [];
  }
  async function requireMember(chat, username) {
    return !!chat && Array.isArray(chat.members) && chat.members.includes(username);
  }
  const visible = (m, now) => !m.deleted && m.ts <= now;

  let poolCache = null;
  async function replyPools() {
    if (!poolCache) {
      poolCache = (await store.getJson("seed/replypools.json")) || {};
    }
    return poolCache;
  }

  function enrichForViewer(m, chat, viewer, viewerName, allMsgs) {
    let tick = null;
    if (m.from === viewer) {
      const others = chat.members.filter((x) => x !== viewer);
      tick = others.every((x) => (m.readBy || []).includes(x)) ? "read" : "sent";
    }
    let reply = null;
    if (m.replyTo) {
      const q = allMsgs.find((x) => x.id === m.replyTo && !x.deleted);
      if (q) {
        reply = {
          id: q.id,
          from: q.from,
          fromName: q.from === viewer ? viewerName : chat.memberNames[q.from] || q.from,
          text: q.text || "",
          kind: q.kind || "text",
        };
      }
    }
    return {
      ...m,
      fromName: m.from === viewer ? viewerName : chat.memberNames[m.from] || m.from,
      tick,
      starredByMe: (m.stars || []).includes(viewer),
      reply,
    };
  }

  async function handle(method, path, query, body, headers) {
    query = query || {};
    headers = headers || {};
    if (path.length > 1) path = path.replace(/\/+$/, "");
    const segs = path.split("/").filter(Boolean);

    if (method === "OPTIONS") return ok({ ok: true });

    /* ----- public: auth ----- */
    if (method === "POST" && segs.join("/") === "auth/signup") {
      const { username, password, name } = body || {};
      if (!username || !USERNAME_RE.test(username))
        return err("username must be 3-20 lowercase letters/digits", 400);
      if (!password || String(password).length < 4)
        return err("password must be at least 4 characters", 400);
      if (!name || !String(name).trim()) return err("name is required", 400);
      if (await store.getJson(`users/${username}.json`))
        return err("username taken", 409);
      const salt = randHex(16);
      const user = {
        username,
        name: String(name).trim(),
        seed: `${username}-ava`,
        passHash: hashPw(String(password), salt),
        salt,
        createdAt: Date.now(),
      };
      await store.setJson(`users/${username}.json`, user);
      await store.setJson(`userchats/${username}.json`, []);
      await store.setJson(`status/${username}.json`, { items: [] });
      // Seed 1:1 bot chats with every demo user (uses raw store).
      await seedUser(store.raw, username);
      const token = newToken();
      await store.setJson(`sessions/${token}.json`, {
        username,
        expiresAt: Date.now() + SESSION_TTL,
      });
      return ok({ token, user: publicUser(user) }, 201);
    }

    if (method === "POST" && segs.join("/") === "auth/login") {
      const { username, password } = body || {};
      const user = username && (await store.getJson(`users/${username}.json`));
      if (!user || hashPw(String(password || ""), user.salt) !== user.passHash)
        return err("invalid username or password", 401);
      const token = newToken();
      await store.setJson(`sessions/${token}.json`, {
        username: user.username,
        expiresAt: Date.now() + SESSION_TTL,
      });
      return ok({ token, user: publicUser(user) });
    }

    /* ----- everything below needs auth ----- */
    const me = await currentUser(headers);
    if (!me) return err("unauthorized", 401);
    const viewer = me.username;
    const viewerName = me.name;

    /* GET /me */
    if (method === "GET" && segs.join("/") === "me") {
      return ok({ user: publicUser(me) });
    }

    /* GET /users/search?q= */
    if (method === "GET" && segs.join("/") === "users/search") {
      const q = String(query.q || "").toLowerCase().trim();
      if (!q) return ok({ users: [] });
      const keys = await store.listKeys("users/");
      const out = [];
      for (const k of keys) {
        const u = await store.getJson(k);
        if (!u || u.username === viewer) continue;
        if (u.username.includes(q) || String(u.name).toLowerCase().includes(q))
          out.push(publicUser(u));
      }
      return ok({ users: out });
    }

    /* GET /chats — list */
    if (method === "GET" && segs.length === 1 && segs[0] === "chats") {
      const now = Date.now();
      const out = [];
      for (const cid of await myChatIds(viewer)) {
        const chat = await getChat(cid);
        if (!chat) continue;
        const msgs = await getMessages(cid);
        const vis = msgs.filter((m) => visible(m, now));
        const last = vis.length ? vis[vis.length - 1] : null;
        const unreadCount = vis.filter(
          (m) => m.from !== viewer && !(m.readBy || []).includes(viewer)
        ).length;
        const pref = (chat.prefs && chat.prefs[viewer]) || {};
        out.push({
          id: chat.id,
          name: chat.name,
          isGroup: !!chat.isGroup,
          members: chat.members,
          memberNames: chat.memberNames,
          lastMessage: last
            ? {
                id: last.id,
                from: last.from,
                fromName:
                  last.from === viewer ? viewerName : chat.memberNames[last.from] || last.from,
                text: last.text || "",
                ts: last.ts,
                kind: last.kind || "text",
              }
            : null,
          unreadCount,
          pinned: !!pref.pinned,
          archived: !!pref.archived,
          muted: !!pref.muted,
          bot: !!chat.bot,
        });
      }
      out.sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return (b.lastMessage ? b.lastMessage.ts : 0) - (a.lastMessage ? a.lastMessage.ts : 0);
      });
      return ok({ chats: out });
    }

    /* POST /chats — 1:1 or group */
    if (method === "POST" && segs.length === 1 && segs[0] === "chats") {
      const b = body || {};
      // 1:1 chat (idempotent)
      if (b.username && !b.name) {
        const otherName = String(b.username);
        if (otherName === viewer) return err("cannot chat with yourself", 400);
        const other = await store.getJson(`users/${otherName}.json`);
        if (!other) return err("user not found", 404);
        for (const cid of await myChatIds(viewer)) {
          const c = await getChat(cid);
          if (
            c && !c.isGroup &&
            c.members.includes(viewer) && c.members.includes(otherName)
          ) {
            return ok({ chat: c });
          }
        }
        const chat = {
          id: newChatId(),
          name: other.name,
          isGroup: false,
          members: [viewer, otherName],
          memberNames: { [viewer]: viewerName, [otherName]: other.name },
          createdBy: viewer,
          createdAt: Date.now(),
          bot: false,
          botUser: null,
          prefs: {},
        };
        await saveChat(chat);
        await store.setJson(`chatmsgs/${chat.id}.json`, []);
        for (const u of [viewer, otherName]) {
          const list = await myChatIds(u);
          list.push(chat.id);
          await store.setJson(`userchats/${u}.json`, list);
        }
        return ok({ chat }, 201);
      }
      // group chat
      if (b.name && Array.isArray(b.members)) {
        const name = String(b.name).trim();
        if (!name) return err("group name is required", 400);
        const members = [...new Set(b.members.map(String))];
        if (!members.includes(viewer)) members.push(viewer);
        const memberNames = {};
        for (const u of members) {
          const rec = await store.getJson(`users/${u}.json`);
          if (!rec) return err(`unknown member: ${u}`, 400);
          memberNames[u] = rec.name;
        }
        const chat = {
          id: newChatId(),
          name,
          isGroup: true,
          members,
          memberNames,
          createdBy: viewer,
          createdAt: Date.now(),
          bot: false,
          botUser: null,
          prefs: {},
        };
        await saveChat(chat);
        await store.setJson(`chatmsgs/${chat.id}.json`, []);
        for (const u of members) {
          const list = await myChatIds(u);
          list.push(chat.id);
          await store.setJson(`userchats/${u}.json`, list);
        }
        return ok({ chat }, 201);
      }
      return err("provide {username} for a 1:1 chat or {name, members[]} for a group", 400);
    }

    /* GET /chats/:id/messages?after= */
    if (method === "GET" && segs.length === 3 && segs[0] === "chats" && segs[2] === "messages") {
      const chat = await getChat(segs[1]);
      if (!(await requireMember(chat, viewer))) return err("chat not found", 404);
      const now = Date.now();
      const after = parseFloat(query.after || "0") || 0;
      const all = await getMessages(chat.id);
      const messages = all
        .filter((m) => visible(m, now) && m.ts > after)
        .sort((a, b) => a.ts - b.ts)
        .map((m) => enrichForViewer(m, chat, viewer, viewerName, all));
      const typing = [];
      for (const k of await store.listKeys(`typing/${chat.id}/`)) {
        const u = k.slice(`typing/${chat.id}/`.length, -".json".length);
        if (u === viewer) continue;
        const t = await store.getJson(k);
        if (t && now - t.ts < TYPING_WINDOW_MS)
          typing.push({ username: u, name: chat.memberNames[u] || u });
      }
      return ok({ messages, typing });
    }

    /* POST /chats/:id/messages */
    if (method === "POST" && segs.length === 3 && segs[0] === "chats" && segs[2] === "messages") {
      const chat = await getChat(segs[1]);
      if (!(await requireMember(chat, viewer))) return err("chat not found", 404);
      const b = body || {};
      const kind = b.kind || "text";
      if (!["text", "image", "voice"].includes(kind)) return err("bad kind", 400);
      const text = b.text != null ? String(b.text) : "";
      if (kind === "text" && !text.trim()) return err("text is required", 400);
      let data = null;
      if (b.data != null) {
        if (typeof b.data !== "string") return err("data must be a string", 400);
        if (Buffer.byteLength(b.data, "utf8") > MAX_DATA_URL_BYTES)
          return err("media too large (max 1.5MB)", 413);
        data = b.data;
      }
      const msgs = await getMessages(chat.id);
      let replyTo = null;
      if (b.replyTo != null) {
        const q = msgs.find((x) => x.id === b.replyTo && !x.deleted);
        if (!q) return err("replyTo message not found in this chat", 400);
        replyTo = q.id;
      }
      const now = Date.now();
      const message = {
        id: newMsgId(),
        chatId: chat.id,
        from: viewer,
        text,
        kind,
        data,
        replyTo,
        ts: now,
        readBy: [],
        stars: [],
        deleted: false,
      };
      msgs.push(message);
      await store.setJson(`msgindex/${message.id}.json`, chat.id);

      // Bot reply: hidden until due via ts poll filter (ts = now + 4000).
      if (chat.bot && chat.botUser) {
        const pools = await replyPools();
        const pool = pools[chat.botUser] && pools[chat.botUser].length
          ? pools[chat.botUser]
          : ["hey!", "nice 😄", "lol"];
        const idx = chat.botIdx || 0;
        const botMsg = {
          id: newMsgId(),
          chatId: chat.id,
          from: chat.botUser,
          text: pool[idx % pool.length],
          kind: "text",
          data: null,
          replyTo: null,
          ts: now + 4000,
          readBy: [],
          stars: [],
          deleted: false,
        };
        msgs.push(botMsg);
        await store.setJson(`msgindex/${botMsg.id}.json`, chat.id);
        chat.botIdx = idx + 1;
        // the bot "reads" the user's message when it replies
        if (!message.readBy.includes(chat.botUser)) message.readBy.push(chat.botUser);
        await saveChat(chat);
      }
      await saveMessages(chat.id, msgs);
      return ok({ message: enrichForViewer(message, chat, viewer, viewerName, msgs) }, 201);
    }

    /* POST /chats/:id/read */
    if (method === "POST" && segs.length === 3 && segs[0] === "chats" && segs[2] === "read") {
      const chat = await getChat(segs[1]);
      if (!(await requireMember(chat, viewer))) return err("chat not found", 404);
      const now = Date.now();
      const msgs = await getMessages(chat.id);
      let changed = false;
      for (const m of msgs) {
        if (visible(m, now) && !(m.readBy || []).includes(viewer)) {
          m.readBy.push(viewer);
          changed = true;
        }
      }
      if (changed) await saveMessages(chat.id, msgs);
      return ok({ ok: true });
    }

    /* POST /chats/:id/typing */
    if (method === "POST" && segs.length === 3 && segs[0] === "chats" && segs[2] === "typing") {
      const chat = await getChat(segs[1]);
      if (!(await requireMember(chat, viewer))) return err("chat not found", 404);
      await store.setJson(`typing/${chat.id}/${viewer}.json`, { ts: Date.now() });
      return ok({ ok: true });
    }

    /* POST /messages/:id/star */
    if (method === "POST" && segs.length === 3 && segs[0] === "messages" && segs[2] === "star") {
      const chatId = await store.getJson(`msgindex/${segs[1]}.json`);
      const chat = chatId && (await getChat(chatId));
      if (!(await requireMember(chat, viewer))) return err("message not found", 404);
      const msgs = await getMessages(chat.id);
      const m = msgs.find((x) => x.id === segs[1] && !x.deleted);
      if (!m) return err("message not found", 404);
      m.stars = m.stars || [];
      const i = m.stars.indexOf(viewer);
      const starred = i === -1;
      if (starred) m.stars.push(viewer);
      else m.stars.splice(i, 1);
      await saveMessages(chat.id, msgs);
      return ok({ starred });
    }

    /* POST /messages/:id/delete */
    if (method === "POST" && segs.length === 3 && segs[0] === "messages" && segs[2] === "delete") {
      const chatId = await store.getJson(`msgindex/${segs[1]}.json`);
      const chat = chatId && (await getChat(chatId));
      if (!(await requireMember(chat, viewer))) return err("message not found", 404);
      const msgs = await getMessages(chat.id);
      const m = msgs.find((x) => x.id === segs[1]);
      if (!m || m.deleted) return err("message not found", 404);
      if (m.from !== viewer) return err("can only delete your own messages", 403);
      m.deleted = true;
      await saveMessages(chat.id, msgs);
      return ok({ ok: true });
    }

    /* GET /starred */
    if (method === "GET" && segs.join("/") === "starred") {
      const now = Date.now();
      const out = [];
      for (const cid of await myChatIds(viewer)) {
        const chat = await getChat(cid);
        if (!chat) continue;
        const msgs = await getMessages(cid);
        for (const m of msgs) {
          if (!visible(m, now) || !(m.stars || []).includes(viewer)) continue;
          out.push({
            ...enrichForViewer(m, chat, viewer, viewerName, msgs),
            chatId: cid,
            chatName: chat.name,
          });
        }
      }
      out.sort((a, b) => b.ts - a.ts);
      return ok({ messages: out });
    }

    /* POST /chats/:id/pin|archive|mute */
    if (
      method === "POST" && segs.length === 3 && segs[0] === "chats" &&
      ["pin", "archive", "mute"].includes(segs[2])
    ) {
      const chat = await getChat(segs[1]);
      if (!(await requireMember(chat, viewer))) return err("chat not found", 404);
      const key = segs[2] === "pin" ? "pinned" : segs[2] === "archive" ? "archived" : "muted";
      chat.prefs = chat.prefs || {};
      const pref = chat.prefs[viewer] || { pinned: false, archived: false, muted: false };
      pref[key] = !pref[key];
      chat.prefs[viewer] = pref;
      await saveChat(chat);
      return ok({ [key]: pref[key] });
    }

    /* POST /status */
    if (method === "POST" && segs.length === 1 && segs[0] === "status") {
      const b = body || {};
      const text = b.text != null ? String(b.text) : "";
      const imageData = b.imageData != null ? String(b.imageData) : "";
      if (!text.trim() && !imageData.trim()) return err("text or imageData is required", 400);
      const blob = (await store.getJson(`status/${viewer}.json`)) || { items: [] };
      const item = { id: newStatusId(), text, imageData: imageData || null, ts: Date.now() };
      blob.items.push(item);
      await store.setJson(`status/${viewer}.json`, blob);
      return ok({ item }, 201);
    }

    /* GET /status */
    if (method === "GET" && segs.length === 1 && segs[0] === "status") {
      const cutoff = Date.now() - STATUS_TTL;
      const out = [];
      for (const k of await store.listKeys("status/")) {
        const username = k.slice("status/".length, -".json".length);
        const u = await store.getJson(`users/${username}.json`);
        if (!u) continue;
        const blob = (await store.getJson(k)) || { items: [] };
        const items = (blob.items || [])
          .filter((it) => it.ts >= cutoff)
          .sort((a, b) => b.ts - a.ts);
        if (!items.length) continue;
        out.push({ username, name: u.name, seed: u.seed, items });
      }
      out.sort((a, b) => b.items[0].ts - a.items[0].ts);
      return ok({ statuses: out });
    }

    return err("not found", 404);
  }

  return { handle };
}

/* Netlify Function entrypoint */
async function handler(event) {
  const { getStore } = require("@netlify/blobs");
  const raw = getStore({ name: "whatsapp", consistency: "strong" });
  await ensureSeeded(raw);
  const app = createApp(blobAdapter(raw));

  let path = event.path || "/";
  // Strip the function mount prefix (covers direct invokes)...
  path = path.replace(/^\/\.netlify\/functions\/api/, "");
  // ...and the public /api prefix (covers the _redirects rewrite).
  path = path.replace(/^\/api/, "") || "/";
  if (!path.startsWith("/")) path = "/" + path;

  let body = null;
  if (event.body) {
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      body = rawBody ? JSON.parse(rawBody) : null;
    } catch (e) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "invalid JSON body" }),
      };
    }
  }

  try {
    const res = await app.handle(
      event.httpMethod,
      path,
      event.queryStringParameters || {},
      body,
      event.headers || {}
    );
    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify(res.body),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "internal error" }),
    };
  }
}

module.exports = { handler, createApp, blobAdapter };
