"use strict";
window.W = window.W || {};

// --- Chat list ---------------------------------------------------------
// NOTE: W.renderStatusStrip() is owned by status.js. We must NOT define it
// here, but we do call it (guarded) after every chat-list render.

// One-line preview text for the last message in a row
function chatPreview(m) {
  if (!m) return "";
  if (m.type === "image") return "📷 " + (m.caption || "Photo");
  if (m.type === "voice") return "🎤 Voice message (" + W.fmtDur(m.duration) + ")";
  if (m.type === "doc") return "📄 " + (m.filename || "Document");
  return m.text || "";
}

// Does a chat match the live search text?
function chatMatches(chat, q) {
  if (!q) return true;
  q = q.trim().toLowerCase();
  if ((chat.name || "").toLowerCase().indexOf(q) !== -1) return true;
  var msgs = chat.messages || [];
  for (var i = 0; i < msgs.length; i++) {
    var hay = (msgs[i].text || "") + " " + (msgs[i].caption || "");
    if (hay.toLowerCase().indexOf(q) !== -1) return true;
  }
  return false;
}

W.renderChatList = function () {
  var list = W.$("chatList");
  if (!list) return;

  var chats = (W.data && W.data.chats) || [] || [];

  // Archive visibility: archived chats hidden unless the archived view is open
  var visible = chats.filter(function (c) {
    return W.store.showArchived ? !!c.archived : !c.archived;
  });

  // Pinned chats first, everything else in data (seed) order
  var pinned = visible.filter(function (c) { return c.pinned; });
  var rest = visible.filter(function (c) { return !c.pinned; });
  var ordered = pinned.concat(rest).filter(function (c) { return chatMatches(c, W.store.search); });

  var html = "";
  ordered.forEach(function (c) {
    var last = (c.messages || [])[(c.msgs || []).length - 1];
    var snippet = chatPreview(last);

    // Group snippet: prefix the sender's first name
    if (c.type === "group" && last && last.from !== "me") {
      var first = String(last.from).split(" ")[0];
      snippet = '<span class="snippet-text">' + W.esc(first) + ":</span> " + W.esc(snippet);
    } else if (last && last.from === "me") {
      // Own last message: show delivery ticks before the snippet
      snippet = W.msgTicks(last) + " " + W.esc(snippet);
    } else {
      snippet = W.esc(snippet);
    }

    var unread = c.unread || 0;
    html +=
      '<div class="chat-row' + (unread ? "" : "") +
      (W.store.active && W.store.active.id === c.id ? " active" : "") +
      '" data-chat="' + c.id + '">' +
        '<img class="avatar lg" src="' + W.avatar(c.seed, 100) + '" alt="">' +
        '<div class="chat-info">' +
          '<div class="chat-top">' +
            '<span class="chat-name">' + W.esc(c.name) +
              (c.pinned ? W.icon("pin", "pin-ic") : "") +
              (c.muted ? W.icon("bell-off", "mute-ic") : "") +
            "</span>" +
            '<span class="chat-time' + (unread ? " unread" : "") + '">' +
              W.esc((last && last.time) || "") +
            "</span>" +
          "</div>" +
          '<div class="chat-bottom">' +
            '<span class="chat-snippet">' + snippet + "</span>" +
            (unread ? '<span class="unread-badge">' + unread + "</span>" : "") +
          "</div>" +
        "</div>" +
      "</div>";
  });

  list.innerHTML = html || '<div class="chat-list-empty">No chats found</div>';

  // Click a row -> open the chat
  list.querySelectorAll(".chat-row").forEach(function (row) {
    row.addEventListener("click", function () {
      var chat = W.getChat(row.getAttribute("data-chat"));
      if (chat && W.openChat) W.openChat(chat);
    });
  });

  // Archived toggle row: "Archived (n)"
  var bar = W.$("archivedBar");
  if (bar) {
    var n = chats.filter(function (c) { return c.archived; }).length;
    if (n > 0) {
      bar.style.display = "";
      bar.innerHTML =
        W.icon("archive", "arch-ic") +
        '<span class="arch-label">Archived</span>' +
        '<span class="arch-count">' + n + "</span>";
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
