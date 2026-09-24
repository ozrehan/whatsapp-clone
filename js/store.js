"use strict";
window.W = window.W || {};

/* =====================================================================
   store.js — app state, backed by the real server API.
   Server state (profile, chats, messages, status feed) is refreshed from
   /api; client-side prefs (wallpaper, notification toggles, avatar
   override, viewed statuses) stay in localStorage.
   ===================================================================== */

(function () {
  var PREFS_KEY = "wa_prefs";

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(PREFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  W.store = {
    active: null, // active chat id (string)
    search: "", // live search text for the chat list
    showArchived: false,
    wallpaper: "doodle",
    replyTo: null, // { chatId, msgId, from, text } quoted into the composer
    settings: {
      notifications: true,
      sounds: true,
      messagePreview: true
    },
    profile: null, // { username, name, seed } from GET /api/me
    chats: [], // from GET /api/chats (pinned-first, then recent)
    messages: {}, // chatId -> [message] ascending
    typing: {}, // chatId -> [{username,name}]
    statusFeed: [] // from GET /api/status
  };

  // Restore client-side prefs (wallpaper + toggles + avatar override).
  var prefs = loadPrefs();
  if (prefs.wallpaper) W.store.wallpaper = prefs.wallpaper;
  if (prefs.settings) {
    for (var k in prefs.settings) {
      if (Object.prototype.hasOwnProperty.call(prefs.settings, k)) {
        W.store.settings[k] = prefs.settings[k];
      }
    }
  }
  W.store.avatarSeed = prefs.avatarSeed || null;

  W.savePrefs = function () {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          wallpaper: W.store.wallpaper,
          settings: W.store.settings,
          avatarSeed: W.store.avatarSeed
        })
      );
    } catch (e) {}
  };

  /* ---- lookups ------------------------------------------------------- */

  W.getChat = function (id) {
    var chats = W.store.chats || [];
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === id) return chats[i];
    }
    return null;
  };

  W.getMessages = function (chatId) {
    return W.store.messages[chatId] || [];
  };

  W.findMessage = function (chatId, msgId) {
    var arr = W.store.messages[chatId] || [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === msgId) return arr[i];
    }
    return null;
  };

  W.myUsername = function () {
    return (W.store.profile && W.store.profile.username) || null;
  };

  W.isMine = function (m) {
    var me = W.myUsername();
    return !!m && !!me && (m.from === me || m.from === "me");
  };

  /* Deterministic avatar seed for a chat (the API chat shape has no seed). */
  W.chatSeed = function (chat) {
    return "chat-" + (chat && chat.id != null ? chat.id : "x");
  };

  /* ---- chat list ------------------------------------------------------ */

  W.refreshChatList = function () {
    return W.api.get("/chats").then(function (r) {
      W.store.chats = (r && r.chats) || [];
      if (W.renderChatList) W.renderChatList();
      return W.store.chats;
    });
  };

  /* ---- message fetching ----------------------------------------------- */

  // Full fetch replaces the local cache; incremental fetch (after=lastTs)
  // merges new messages and refreshes mutable fields (tick, starredByMe).
  W.fetchMessages = function (chatId, full) {
    var after = 0;
    if (!full) {
      var cur = W.store.messages[chatId] || [];
      if (cur.length) after = cur[cur.length - 1].ts || 0;
    }
    var path =
      "/chats/" +
      encodeURIComponent(chatId) +
      "/messages" +
      (after ? "?after=" + encodeURIComponent(after) : "");
    return W.api.get(path).then(function (r) {
      var incoming = (r && r.messages) || [];
      var added = 0;
      if (full) {
        W.store.messages[chatId] = incoming.slice();
        W.store.messages[chatId].sort(function (a, b) {
          return (a.ts || 0) - (b.ts || 0);
        });
        added = incoming.length;
      } else {
        var arr = (W.store.messages[chatId] = W.store.messages[chatId] || []);
        incoming.forEach(function (m) {
          var ex = null;
          for (var i = 0; i < arr.length; i++) {
            if (arr[i].id === m.id) {
              ex = arr[i];
              break;
            }
          }
          if (ex) {
            ex.tick = m.tick;
            ex.starredByMe = m.starredByMe;
            ex.text = m.text;
          } else {
            arr.push(m);
            added++;
          }
        });
        arr.sort(function (a, b) {
          return (a.ts || 0) - (b.ts || 0);
        });
      }
      W.store.typing[chatId] = (r && r.typing) || [];
      return { added: added, typing: W.store.typing[chatId] };
    });
  };

  W.markChatRead = function (chatId) {
    return W.api
      .post("/chats/" + encodeURIComponent(chatId) + "/read")
      .then(function () {
        var c = W.getChat(chatId);
        if (c) {
          c.unreadCount = 0;
          if (W.renderChatList) W.renderChatList();
        }
      })
      .catch(function () {});
  };

  /* ---- sending ---------------------------------------------------------
     payload: { text, kind: "text"|"image"|"voice", data?, replyTo? }
     (replyTo = quoted message id). Resolves with the created message. */

  W.sendMessage = function (chatId, payload) {
    return W.api
      .post("/chats/" + encodeURIComponent(chatId) + "/messages", payload)
      .then(function (r) {
        var msg = r && r.message;
        if (msg) {
          var arr = (W.store.messages[chatId] =
            W.store.messages[chatId] || []);
          if (!W.findMessage(chatId, msg.id)) arr.push(msg);
          if (W.store.active === chatId && W.renderMessages)
            W.renderMessages({ scroll: true });
        }
        if (W.refreshChatList) W.refreshChatList().catch(function () {});
        return msg;
      })
      .catch(function (e) {
        W.apiErr(e);
        return null;
      });
  };

  /* ---- chat mutations (persist server-side) ----------------------------- */

  function applyChatPatch(chatId, patch) {
    var c = W.getChat(chatId);
    if (c) {
      for (var k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k)) c[k] = patch[k];
      }
    }
    if (W.renderChatList) W.renderChatList();
  }

  W.togglePin = function (chat) {
    if (!chat) return;
    W.api
      .post("/chats/" + encodeURIComponent(chat.id) + "/pin")
      .then(function (r) {
        applyChatPatch(chat.id, { pinned: !!(r && r.pinned) });
        W.toast(r && r.pinned ? "Pinned" : "Unpinned");
      })
      .catch(W.apiErr);
  };

  W.toggleArchive = function (chat) {
    if (!chat) return;
    W.api
      .post("/chats/" + encodeURIComponent(chat.id) + "/archive")
      .then(function (r) {
        applyChatPatch(chat.id, { archived: !!(r && r.archived) });
        W.toast(r && r.archived ? "Archived" : "Unarchived");
      })
      .catch(W.apiErr);
  };

  W.toggleMute = function (chat) {
    if (!chat) return;
    W.api
      .post("/chats/" + encodeURIComponent(chat.id) + "/mute")
      .then(function (r) {
        applyChatPatch(chat.id, { muted: !!(r && r.muted) });
        W.toast(r && r.muted ? "Muted" : "Unmuted");
      })
      .catch(W.apiErr);
  };

  /* ---- star / delete (server-side) -------------------------------------- */

  // Resolves with the NEW starred state (true/false), or null on failure.
  W.starMessage = function (msgId) {
    return W.api
      .post("/messages/" + encodeURIComponent(msgId) + "/star")
      .then(function (r) {
        return !!(r && r.starred);
      })
      .catch(function (e) {
        W.apiErr(e);
        return null;
      });
  };

  // Resolves true when the message was deleted (own messages only).
  W.deleteMessage = function (chatId, msgId) {
    return W.api
      .post("/messages/" + encodeURIComponent(msgId) + "/delete")
      .then(function () {
        var arr = W.store.messages[chatId] || [];
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].id === msgId) {
            arr.splice(i, 1);
            break;
          }
        }
        return true;
      })
      .catch(function (e) {
        W.apiErr(e);
        return false;
      });
  };

  /* ---- error helper ----------------------------------------------------- */

  W.apiErr = function (e) {
    if (e && e.status === 401) return; // api.js already showed the auth screen
    if (W.toast) W.toast((e && e.message) || "Something went wrong");
  };
})();
