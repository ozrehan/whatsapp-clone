"use strict";
window.W = window.W || {};

/* inputbar.js — message composer: text send, emoji picker, attach menu,
   voice recorder, and reply-quote preview. Expects DOM ids:
   msgInput, sendBtn, micBtn, emojiBtn, emojiPicker, clipBtn, attachMenu,
   recorder, recTimer, recCancel, recSend, replyPreview, replyPreviewText,
   replyPreviewClose, inputBarWrap. */

(function () {

  /* Resolve the currently open chat (defensive across store shapes). */
  function activeChat() {
    if (W.getActiveChat) return W.getActiveChat();
    if (W.store && W.store.active) return W.store.active;
    return null;
  }

  /* Show #sendBtn when there is text, else #micBtn. */
  function toggleSendMic() {
    var inp = W.$("#msgInput");
    var sendBtn = W.$("#sendBtn");
    var micBtn = W.$("#micBtn");
    var hasText = !!(inp && inp.value.trim());
    if (sendBtn) sendBtn.style.display = hasText ? "" : "none";
    if (micBtn) micBtn.style.display = hasText ? "none" : "";
  }

  /* Primary send path: bot.sendText reads W.store.replyTo (the pending
     quote) when building the outgoing message; we clear the reply preview
     only after the send is dispatched. */
  W.sendUserText = function (text) {
    text = (text || "").trim();
    if (!text) return;
    var chat = activeChat();
    if (!chat || !W.bot || !W.bot.sendText) return;
    W.bot.sendText(chat, text);
    if (W.store) W.store.replyTo = null;
    renderReplyPreview();
    var inp = W.$("#msgInput");
    if (inp) {
      inp.value = "";
      toggleSendMic();
      inp.focus();
    }
  };

  /* ---- Emoji picker ---- */

  var EMOJIS = [
    "😀","😁","😂","🤣","😊","😍","😘","😎",
    "🤔","😐","😴","😷","🤯","😭","😡","🥳",
    "👍","👎","👏","🙏","💪","🤝","✌️","👋",
    "❤️","🔥","🎉","⭐","💯","✨","🙌","🤗"
  ];
  var pickerBuilt = false;

  function buildPicker() {
    var picker = W.$("#emojiPicker");
    if (!picker || pickerBuilt) return;
    pickerBuilt = true;
    EMOJIS.forEach(function (e) {
      var b = W.el("button", "emoji-opt");
      b.type = "button";
      b.textContent = e;
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        insertAtCursor(e);
      });
      picker.appendChild(b);
    });
  }

  function insertAtCursor(emoji) {
    var inp = W.$("#msgInput");
    if (!inp) return;
    var s = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
    var e = inp.selectionEnd != null ? inp.selectionEnd : s;
    inp.value = inp.value.slice(0, s) + emoji + inp.value.slice(e);
    inp.focus();
    var pos = s + emoji.length;
    inp.selectionStart = inp.selectionEnd = pos;
    toggleSendMic();
  }

  function closeFloating() {
    var picker = W.$("#emojiPicker");
    var menu = W.$("#attachMenu");
    if (picker) picker.classList.remove("open");
    if (menu) menu.classList.remove("open");
  }

  /* ---- Voice recorder ---- */

  var recTimerId = null;
  var recStart = 0;

  function fmtRec(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function buildRecBars() {
    var rec = W.$("#recorder");
    if (!rec) return;
    var bars = rec.querySelector(".rec-bars");
    if (bars) return; // already built
    bars = W.el("div", "rec-bars");
    for (var i = 0; i < 28; i++) {
      var bar = W.el("span", "rec-bar");
      bar.style.animationDelay = (i * 0.07) + "s";
      bars.appendChild(bar);
    }
    rec.insertBefore(bars, rec.firstChild);
  }

  function startRecording() {
    var rec = W.$("#recorder");
    var wrap = W.$("#inputBarWrap");
    if (!rec) return;
    buildRecBars();
    if (wrap) wrap.style.display = "none";
    rec.classList.add("show");
    recStart = Date.now();
    var t = W.$("#recTimer");
    if (t) t.textContent = "0:00";
    if (recTimerId) clearInterval(recTimerId);
    recTimerId = setInterval(function () {
      var el = W.$("#recTimer");
      if (el) el.textContent = fmtRec(Date.now() - recStart);
    }, 250);
  }

  function stopRecording(send) {
    if (recTimerId) { clearInterval(recTimerId); recTimerId = null; }
    var rec = W.$("#recorder");
    var wrap = W.$("#inputBarWrap");
    if (rec) rec.classList.remove("show");
    if (wrap) wrap.style.display = "";
    if (send) {
      var chat = activeChat();
      var dur = Math.max(1, Math.round((Date.now() - recStart) / 1000));
      if (chat && W.bot && W.bot.sendContent) {
        W.bot.sendContent(chat, { type: "voice", duration: dur });
      }
    }
    recStart = 0;
  }

  /* ---- Reply quote preview ---- */

  function msgSnippet(msg) {
    if (!msg) return "";
    if (msg.text) {
      return msg.text.length > 70 ? msg.text.slice(0, 70) + "…" : msg.text;
    }
    var labels = { image: "📷 Photo", video: "🎬 Video", voice: "🎤 Voice message", doc: "📄 Document" };
    return labels[msg.type] || "Message";
  }

  function renderReplyPreview() {
    var prev = W.$("#replyPreview");
    if (!prev) return;
    var q = W.store && W.store.replyTo;
    if (!q) {
      prev.classList.remove("show");
      prev.style.display = "none";
      return;
    }
    var txt = W.$("#replyPreviewText");
    if (txt) {
      // q.from is a sender name; color it via the standard name-color class.
      txt.innerHTML = "";
      var name = W.el("div", "reply-from");
      name.textContent = q.from || "Message";
      txt.appendChild(name);
      var body = W.el("div", "reply-body");
      body.textContent = q.text || "";
      txt.appendChild(body);
    }
    prev.classList.add("show");
    prev.style.display = "";
  }
  W.renderReplyPreview = renderReplyPreview;

  /* Called by chatview when the user taps "reply" on a message. Builds the
     quote {from, text} up front; W.bot.sendText consumes W.store.replyTo. */
  W.setReplyQuote = function (chatId, msgId) {
    var chat = W.getChat ? W.getChat(chatId) : null;
    var msg = null;
    if (chat && chat.messages) {
      for (var i = 0; i < chat.messages.length; i++) {
        if (chat.messages[i].id === msgId) { msg = chat.messages[i]; break; }
      }
    }
    var from = msg ? (msg.from === "me" ? "You" : msg.from) : "Message";
    if (W.store) {
      W.store.replyTo = {
        chatId: chatId,
        msgId: msgId,
        from: from,
        text: msgSnippet(msg)
      };
    }
    renderReplyPreview();
    var inp = W.$("#msgInput");
    if (inp) inp.focus();
  };

  W.clearReplyQuote = function () {
    if (W.store) W.store.replyTo = null;
    renderReplyPreview();
  };

  /* ---- Init: wire all composer controls ---- */

  W.initInputBar = function () {
    var inp = W.$("#msgInput");
    if (!inp) return;

    // Typing toggles send vs mic.
    inp.addEventListener("input", toggleSendMic);
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        W.sendUserText(inp.value);
      }
    });

    var sendBtn = W.$("#sendBtn");
    if (sendBtn) sendBtn.addEventListener("click", function () {
      W.sendUserText(inp.value);
    });

    // Emoji picker.
    var emojiBtn = W.$("#emojiBtn");
    var picker = W.$("#emojiPicker");
    buildPicker();
    if (emojiBtn && picker) {
      emojiBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var menu = W.$("#attachMenu");
        if (menu) menu.classList.remove("open");
        picker.classList.toggle("open");
      });
    }

    // Attach menu.
    var clipBtn = W.$("#clipBtn");
    var menu = W.$("#attachMenu");
    if (clipBtn && menu) {
      clipBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var pk = W.$("#emojiPicker");
        if (pk) pk.classList.remove("open");
        menu.classList.toggle("open");
      });
      menu.addEventListener("click", function (ev) {
        var item = ev.target.closest("[data-attach]");
        if (!item) return;
        ev.stopPropagation();
        menu.classList.remove("open");
        var kind = item.getAttribute("data-attach");
        var chat = activeChat();
        if (kind === "photo") {
          if (chat && W.bot && W.bot.sendContent) {
            W.bot.sendContent(chat, {
              type: "image",
              seed: "wa-" + Date.now(),
              caption: ""
            });
          }
        } else if (kind === "doc") {
          var docs = ["Project-proposal.pdf", "Resume-final.pdf", "Tickets.pdf"];
          var file = docs[Math.floor(Math.random() * docs.length)];
          if (chat && W.bot && W.bot.sendContent) {
            W.bot.sendContent(chat, {
              type: "doc",
              filename: file,
              size: "2.4 MB"
            });
          }
        } else if (kind === "camera") {
          if (W.toast) W.toast("Camera not available on web");
        }
      });
    }

    // Voice recorder.
    var micBtn = W.$("#micBtn");
    if (micBtn) micBtn.addEventListener("click", startRecording);
    var cancel = W.$("#recCancel");
    if (cancel) cancel.addEventListener("click", function () { stopRecording(false); });
    var send = W.$("#recSend");
    if (send) send.addEventListener("click", function () { stopRecording(true); });

    // Reply preview close.
    var rclose = W.$("#replyPreviewClose");
    if (rclose) rclose.addEventListener("click", W.clearReplyQuote);

    // Close floating emoji/attach panels on outside click.
    document.addEventListener("click", function (ev) {
      var pk = W.$("#emojiPicker");
      var mn = W.$("#attachMenu");
      var eb = W.$("#emojiBtn");
      var cb = W.$("#clipBtn");
      if (pk && pk.classList.contains("open") &&
          !pk.contains(ev.target) && !(eb && eb.contains(ev.target))) {
        pk.classList.remove("open");
      }
      if (mn && mn.classList.contains("open") &&
          !mn.contains(ev.target) && !(cb && cb.contains(ev.target))) {
        mn.classList.remove("open");
      }
    });

    toggleSendMic();
    renderReplyPreview();
  };

})();
