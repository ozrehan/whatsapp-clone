"use strict";
window.W = window.W || {};

// --- Bot: outgoing messages, tick progression, simulated replies --------
// Outgoing tick flow: ✓ single (not sent) -> ✓✓ grey (sent) -> ✓✓ blue (read).
// W.brain (data/brain.js) generates contextual replies; a safe fallback is
// used when it is missing.

// Generic fallback replies when W.brain is unavailable
var BOT_FALLBACK = ["Got it! 👍", "Nice 😄", "Haha true 😂", "Cool, tell me more!"];

function botFallback(userText) {
  var t = String(userText || "");
  var h = 0;
  for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return BOT_FALLBACK[h % BOT_FALLBACK.length];
}

// Typing indicator bubble inside #messages (removed before the reply lands)
function showTypingBubble(chat, senderName) {
  var box = W.$("messages");
  if (!box) return;
  var row = W.el("div", "msg-row in");
  var nameHtml = senderName
    ? '<div class="sender-name" style="color:' + W.nameColor(senderName) + '">' + W.esc(senderName) + "</div>"
    : "";
  row.innerHTML = '<div class="bubble">' + nameHtml +
    '<div class="typing-dots"><span></span><span></span><span></span></div></div>';
  row.id = "typingBubble";
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

function hideTypingBubble() {
  var t = W.$("typingBubble");
  if (t && t.parentNode) t.parentNode.removeChild(t);
}

W.bot = {
  // Send a plain text message as "me"
  sendText: function (chat, text) {
    W.bot.sendContent(chat, { type: "text", text: text });
  },

  // Send a richer message object (image / voice / doc / text)
  sendContent: function (chat, msgObj) {
    if (!chat || !msgObj) return;
    var msg = {
      id: W.uid(),
      from: "me",
      time: W.nowTime(),
      day: "today",
      sent: false, // painted as a single ✓ immediately
      read: false
    };
    for (var k in msgObj) {
      if (Object.prototype.hasOwnProperty.call(msgObj, k)) msg[k] = msgObj[k];
    }
    // Consume a pending reply-quote from the composer (set by W.setReplyQuote).
    if (W.store && W.store.replyTo && W.store.replyTo.chatId === chat.id) {
      msg.quote = { from: W.store.replyTo.from, text: W.store.replyTo.text };
    }
    (chat.messages = chat.messages || []).push(msg);
    chat.lastTime = msg.time;

    if (W.renderMessages) W.renderMessages();
    if (W.renderChatList) W.renderChatList();

    W.bot.progressTicks(chat, msg);
  },

  // Progress one outgoing message through sent -> read -> reply
  progressTicks: function (chat, msg) {
    if (!chat || !msg) return;

    function rerender() {
      if (W.renderMessages) W.renderMessages();
      if (W.renderChatList) W.renderChatList();
    }

    // 800ms: message reaches the server -> ✓✓ grey
    setTimeout(function () {
      msg.sent = true;
      rerender();
    }, 800);

    // 1600ms: message is read -> ✓✓ blue
    setTimeout(function () {
      msg.read = true;
      rerender();
    }, 1600);

    // ~2200ms: the other side starts typing...
    setTimeout(function () {
      var userText = msg.text || msg.caption || "";

      // Resolve the reply up front so the typing bubble can carry a
      // sender name for groups; fallback when W.brain is missing.
      var reply;
      try {
        reply = W.brain ? W.brain(chat, userText) : botFallback(userText);
      } catch (e) {
        reply = botFallback(userText);
      }
      var rFrom, rText;
      if (typeof reply === "string") {
        // DM: reply arrives from the chat's name
        rFrom = chat.name;
        rText = reply;
      } else {
        // Group: brain returns { from, text }
        rFrom = (reply && reply.from) || chat.name;
        rText = (reply && reply.text) || botFallback(userText);
      }

      var isActive = W.store.active && W.store.active.id === chat.id;

      // Show "typing..." in the header + a typing bubble while active
      if (isActive) {
        var st = W.$("convStatus");
        if (st) st.textContent = "typing...";
        showTypingBubble(chat, chat.type === "group" ? rFrom : null);
      }

      // 1.4s - 2.6s later: stop typing, land the reply
      var typingMs = 1400 + Math.random() * 1200;
      setTimeout(function () {
        hideTypingBubble();
        if (isActive && W.renderConvHeader) W.renderConvHeader(); // restore status

        var rmsg = {
          id: W.uid(),
          from: rFrom,
          type: "text",
          text: rText,
          time: W.nowTime(),
          day: "today"
        };
        (chat.messages = chat.messages || []).push(rmsg);
        chat.lastTime = rmsg.time;

        if (W.store.active && W.store.active.id === chat.id) {
          if (W.renderMessages) W.renderMessages();
        } else {
          // Chat isn't open: bump the unread badge, don't touch messages
          chat.unread = (chat.unread || 0) + 1;
        }
        if (W.renderChatList) W.renderChatList();
      }, typingMs);
    }, 2200);
  }
};
