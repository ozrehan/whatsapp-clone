"use strict";
window.W = window.W || {};

/* =====================================================================
   chatview.js — open/close conversation, header, active-chat polling.
   The active chat polls GET /api/chats/:id/messages?after=<lastTs> every
   2.5s (appending new messages, updating server tick states and the
   typing indicator). Opening a chat does a full fetch + POST /read.
   ===================================================================== */

// Open a chat (accepts a chat id, or a chat object with .id).
W.openChat = function (chatOrId) {
  var id =
    typeof chatOrId === "string" ? chatOrId : chatOrId && chatOrId.id;
  if (!id) return;
  if (W.store.active === id && W.store.messages[id]) {
    // Already open with data: just make sure the UI is visible.
  }
  W.store.active = id;
  W._msgSig = null; // force a fresh render

  var empty = W.$("emptyState");
  var conv = W.$("convView");
  if (empty) empty.style.display = "none";
  if (conv) conv.style.display = "";

  W.renderConvHeader();
  if (W.renderChatList) W.renderChatList();

  // Full fetch, then render and mark read.
  W.fetchMessages(id, true)
    .then(function () {
      if (W.store.active !== id) return;
      W.renderMessages({ scroll: true });
      W.renderConvHeader();
      W.markChatRead(id);
    })
    .catch(function (e) {
      W.apiErr(e);
    });

  W.startActivePoll(id);

  // Mobile: slide the conversation view in
  document.body.classList.add("chat-open");
};

W.closeChat = function () {
  W.store.active = null;
  W.stopActivePoll();

  var empty = W.$("emptyState");
  var conv = W.$("convView");
  if (empty) empty.style.display = "";
  if (conv) conv.style.display = "none";

  if (W.renderChatList) W.renderChatList();

  // Mobile: back button (#convBack) slides back to the list
  document.body.classList.remove("chat-open");
};

// Refresh the conversation header (avatar, name, typing / members status).
W.renderConvHeader = function () {
  var chat = W.getChat(W.store.active);
  if (!chat) return;

  var av = W.$("convAvatar");
  var nm = W.$("convName");
  var st = W.$("convStatus");
  if (av) av.src = W.avatar(W.chatSeed(chat), 80);
  if (nm) nm.textContent = chat.name || "";
  if (st) {
    var ty = W.store.typing[chat.id] || [];
    if (ty.length) {
      st.textContent = "typing...";
    } else if (chat.isGroup) {
      var members = chat.memberNames || chat.members || [];
      st.textContent = members.join(", ");
    } else {
      st.textContent = chat.bot ? "bot" : "online";
    }
  }

  // Tapping the header opens contact/group info (infopanel.js owns W.openInfo)
  var who = W.$("convWho");
  if (who && !who._whoBound && W.openInfo) {
    who._whoBound = true;
    who.addEventListener("click", function () {
      var c = W.getChat(W.store.active);
      if (W.openInfo && c) W.openInfo(c);
    });
  }
};

// One extra poll shortly after we send, so bot replies land fast.
W.nudgeActivePoll = function () {
  var id = W.store.active;
  if (!id) return;
  setTimeout(function () {
    if (W.store.active !== id) return;
    W.fetchMessages(id, false)
      .then(function (res) {
        if (W.store.active !== id) return;
        if (res.added > 0) {
          W.renderMessages();
          W.renderConvHeader();
          W.markChatRead(id);
        } else {
          W.renderConvHeader();
        }
        if (W.renderChatList) W.renderChatList();
      })
      .catch(function () {});
  }, 900);
};
