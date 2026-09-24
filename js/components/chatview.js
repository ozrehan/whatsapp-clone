"use strict";
window.W = window.W || {};

// --- Conversation view -------------------------------------------------

W.openChat = function (chat) {
  if (!chat) return;
  W.store.active = chat;
  chat.unread = 0; // opening a chat clears its unread count

  var empty = W.$("emptyState");
  var conv = W.$("convView");
  if (empty) empty.style.display = "none";
  if (conv) conv.style.display = "";

  W.renderConvHeader();

  if (W.renderChatList) W.renderChatList();
  if (W.renderMessages) W.renderMessages();

  // Mobile: slide the conversation view in
  document.body.classList.add("chat-open");
};

W.closeChat = function () {
  W.store.active = null;

  var empty = W.$("emptyState");
  var conv = W.$("convView");
  if (empty) empty.style.display = "";
  if (conv) conv.style.display = "none";

  if (W.renderChatList) W.renderChatList();

  // Mobile: back button (#convBack) slides back to the list
  document.body.classList.remove("chat-open");
};

// Refresh the conversation header (avatar, name, status).
// The bot uses this to restore the status line after a "typing..." state.
W.renderConvHeader = function () {
  var chat = W.store.active;
  if (!chat) return;

  var av = W.$("convAvatar");
  var nm = W.$("convName");
  var st = W.$("convStatus");
  if (av) av.src = W.avatar(chat.seed, 80);
  if (nm) nm.textContent = chat.name;
  if (st) {
    if (chat.type === "group") {
      st.textContent = "You, " + (chat.participants || []).join(", ");
    } else {
      st.textContent = chat.status || "online";
    }
  }

  // Tapping the header opens contact/group info (info.js owns W.openInfo)
  var who = W.$("convWho");
  if (who && !who._whoBound && W.openInfo) {
    who._whoBound = true;
    who.addEventListener("click", function () {
      if (W.openInfo && W.store.active) W.openInfo(W.store.active);
    });
  }
};
