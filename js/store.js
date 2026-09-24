"use strict";
window.W = window.W || {};

// --- App state ---------------------------------------------------------
// data/*.js owns W.chats (chat objects) and W.brain (reply engine).

W.store = {
  active: null,      // currently open chat object
  search: "",        // live search text for the chat list
  showArchived: false,
  wallpaper: "doodle",
  replyTo: null,     // { chatId, msgId } quoted into the composer
  settings: {
    notifications: true,
    sounds: true,
    messagePreview: true
  },
  profile: { name: "Rehan", seed: "rehan-self" }
};

// --- Chat lookups ------------------------------------------------------

W.getChat = function (id) {
  var chats = (W.data && W.data.chats) || [];
  for (var i = 0; i < chats.length; i++) {
    if (chats[i].id === id) return chats[i];
  }
  return null;
};

W.toggleMute = function (c) {
  if (c) c.muted = !c.muted;
};

W.toggleArchive = function (c) {
  if (c) c.archived = !c.archived;
};

// --- Starred messages --------------------------------------------------
// Stored as a map starKey -> true, so starring survives rerenders.

W._stars = {};

W.starKey = function (chatId, msgId) {
  return chatId + "::" + msgId;
};

W.isStarred = function (chatId, msgId) {
  return !!W._stars[W.starKey(chatId, msgId)];
};

// Flip the starred state; returns the NEW state (true = now starred)
W.toggleStar = function (chatId, msgId) {
  var k = W.starKey(chatId, msgId);
  if (W._stars[k]) {
    delete W._stars[k];
    return false;
  }
  W._stars[k] = true;
  return true;
};

// All starred messages as [{ chat, msg }] (for the starred-messages view)
W.starredAll = function () {
  var out = [];
  Object.keys(W._stars).forEach(function (key) {
    var idx = key.indexOf("::");
    var chatId = key.slice(0, idx);
    var msgId = key.slice(idx + 2);
    var chat = W.getChat(chatId);
    if (!chat) return;
    var msg = null;
    for (var i = 0; i < (chat.messages || []).length; i++) {
      if (chat.messages[i].id === msgId) { msg = chat.messages[i]; break; }
    }
    if (msg) out.push({ chat: chat, msg: msg });
  });
  return out;
};
