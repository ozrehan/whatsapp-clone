"use strict";
window.W = window.W || {};

/* =====================================================================
   chatlist.js — renders the sidebar chat list from W.store.chats
   (GET /api/chats). Server returns pinned-first, then recent; we keep
   that order and only apply the local search filter + archived toggle.
   ===================================================================== */

// One-line preview text for the last message in a row
function chatPreview(m) {
  if (!m) return "";
  var kind = m.kind || "text";
  if (kind === "image") return "📷 " + (m.text || "Photo");
  if (kind === "voice") return "🎤 Voice message";
  return m.text || "";
}

// Does a chat match the live search text?
function chatMatches(chat, q) {
  if (!q) return true;
  q = q.trim().toLowerCase();
  if ((chat.name || "").toLowerCase().indexOf(q) !== -1) return true;
  var last = chat.lastMessage;
  if (last && (last.text || "").toLowerCase().indexOf(q) !== -1) return true;
  return false;
}

W.renderChatList = function () {
  var list = W.$("chatList");
  if (!list) return;

  var chats = W.store.chats || [];
  var me = W.myUsername ? W.myUsername() : null;

  // Archive visibility: archived chats hidden unless the archived view is open
  var visible = chats.filter(function (c) {
    return W.store.showArchived ? !!c.archived : !c.archived;
  });

  var ordered = visible.filter(function (c) {
    return chatMatches(c, W.store.search);
  });

  var html = "";
  ordered.forEach(function (c) {
    var last = c.lastMessage || null;
    var snippet = chatPreview(last);

    // Group snippet: prefix the sender's first name
    if (c.isGroup && last && !W.isMine(last)) {
      var who = last.fromName || last.from || "";
      var first = String(who).split(" ")[0];
      snippet =
        '<span class="snippet-text">' + W.esc(first) + ":</span> " + W.esc(snippet);
    } else if (last && me && W.isMine(last)) {
      // Own last message: show delivery ticks (from the server) before snippet
      snippet = W.msgTicks(last) + " " + W.esc(snippet);
    } else {
      snippet = W.esc(snippet);
    }

    var unread = c.unreadCount || 0;
    html +=
      '<div class="chat-row' +
      (W.store.active === c.id ? " active" : "") +
      '" data-chat="' +
      W.esc(c.id) +
      '">' +
      '<img class="avatar lg" src="' +
      W.avatar(W.chatSeed(c), 100) +
      '" alt="">' +
      '<div class="chat-info">' +
      '<div class="chat-top">' +
      '<span class="chat-name">' +
      W.esc(c.name) +
      (c.pinned ? W.icon("pin", "pin-ic") : "") +
      (c.muted ? W.icon("bell-off", "mute-ic") : "") +
      "</span>" +
      '<span class="chat-time' +
      (unread ? " unread" : "") +
      '">' +
      W.esc(W.listTime(last && last.ts)) +
      "</span>" +
      "</div>" +
      '<div class="chat-bottom">' +
      '<span class="chat-snippet">' +
      snippet +
      "</span>" +
      (unread ? '<span class="unread-badge">' + unread + "</span>" : "") +
      "</div>" +
      "</div>" +
      "</div>";
  });

  list.innerHTML = html || '<div class="chat-list-empty">No chats found</div>';

  // Click a row -> open the chat
  list.querySelectorAll(".chat-row").forEach(function (row) {
    row.addEventListener("click", function () {
      if (W.openChat) W.openChat(row.getAttribute("data-chat"));
    });
  });

  // Archived toggle row: "Archived (n)"
  var bar = W.$("archivedBar");
  if (bar) {
    var n = chats.filter(function (c) {
      return c.archived;
    }).length;
    if (n > 0) {
      bar.style.display = "";
      bar.innerHTML =
        W.icon("archive", "arch-ic") +
        '<span class="arch-label">Archived</span>' +
        '<span class="arch-count">' +
        n +
        "</span>";
      bar.onclick = function () {
        W.store.showArchived = !W.store.showArchived;
        W.renderChatList();
      };
    } else {
      bar.style.display = "none";
      bar.innerHTML = "";
      bar.onclick = null;
    }
  }

  // Status strip lives in status.js -- call it if it exists, never define it.
  if (W.renderStatusStrip) W.renderStatusStrip();
};
