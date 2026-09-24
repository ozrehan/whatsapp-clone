"use strict";
window.W = window.W || {};

/* =====================================================================
   bubbles.js — message bubble rendering + hover actions.
   Message shape comes from the server:
     { id, from, fromName, text, kind: "text"|"image"|"voice",
       data (data-URL for image/voice), replyTo (message id),
       ts, tick: "sent"|"read"|null, starredByMe }
   Tick states are rendered EXACTLY as the server reports them.
   ===================================================================== */

// --- Sender name colours for group chats --------------------------------

var NAME_COLORS = {
  Meera: "#ff9f43",
  Kabir: "#53bdeb",
  Tara: "#e91e63",
  Dev: "#35cd96",
  Nikhil: "#a06ee1",
  Aisha: "#e91e63",
  Rohan: "#53bdeb"
};
var NAME_FALLBACK = ["#ff9f43", "#53bdeb", "#e91e63", "#35cd96", "#a06ee1", "#00a0e5"];

W.nameColor = function (n) {
  if (NAME_COLORS[n]) return NAME_COLORS[n];
  var h = 0;
  n = String(n || "");
  for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return NAME_FALLBACK[h % NAME_FALLBACK.length];
};

// --- Real voice playback ------------------------------------------------
// One voice note at a time; state lives in W._voice.

W._voice = { audio: null, btn: null, bar: null };

W.toggleVoice = function (btn, chatId, msgId) {
  var m = W.findMessage ? W.findMessage(chatId, msgId) : null;
  if (!m || !m.data) return;

  function reset() {
    if (W._voice.audio) {
      try {
        W._voice.audio.pause();
      } catch (e) {}
      W._voice.audio.src = "";
    }
    if (W._voice.btn) W._voice.btn.innerHTML = W.icon("play", "v-ic");
    if (W._voice.bar) W._voice.bar.style.width = "0%";
    W._voice.audio = null;
    W._voice.btn = null;
    W._voice.bar = null;
  }

  var wasThis = W._voice.btn === btn;
  reset();
  if (wasThis) return; // was playing -> now paused

  var a = new Audio(m.data);
  var wrap = btn.closest(".voice-bubble");
  var fill = wrap ? wrap.querySelector(".voice-fill") : null;
  var durEl = wrap ? wrap.querySelector(".voice-dur") : null;

  a.addEventListener("loadedmetadata", function () {
    if (durEl && isFinite(a.duration)) durEl.textContent = W.fmtDur(a.duration);
  });
  a.addEventListener("timeupdate", function () {
    if (fill && a.duration) {
      fill.style.width = Math.min(100, (a.currentTime / a.duration) * 100) + "%";
    }
  });
  a.addEventListener("ended", reset);
  a.addEventListener("error", function () {
    W.toast("Can't play this voice note");
    reset();
  });

  W._voice.audio = a;
  W._voice.btn = btn;
  W._voice.bar = fill;
  btn.innerHTML = W.icon("pause", "v-ic");
  a.play().catch(function () {
    W.toast("Can't play this voice note");
    reset();
  });
};

// --- Helpers -------------------------------------------------------------

function kindLabel(kind) {
  var labels = { image: "📷 Photo", voice: "🎤 Voice message" };
  return labels[kind] || "Message";
}

// Resolve a replyTo message id into { from, text } for the quote block.
// Prefers the server-supplied m.reply quote object; falls back to local lookup.
function quoteOf(chatId, m) {
  if (!m || !m.replyTo) return null;
  var q = m.reply || (W.findMessage ? W.findMessage(chatId, m.replyTo) : null);
  if (q) {
    var from = W.isMine(q) ? "You" : q.fromName || q.from || "Message";
    var text = q.text || kindLabel(q.kind);
    if (text.length > 70) text = text.slice(0, 70) + "…";
    return { from: from, text: text };
  }
  return { from: "Message", text: "Replied to a message" };
}

function msgSnippet(m) {
  if (!m) return "";
  if (m.text) return m.text.length > 70 ? m.text.slice(0, 70) + "…" : m.text;
  return kindLabel(m.kind);
}

// --- Bubble body builders -----------------------------------------------

function bubbleInner(chat, m) {
  var inner = "";

  // Quoted / replied-to message
  var q = quoteOf(chat.id, m);
  if (q) {
    inner +=
      '<div class="quoted">' +
      '<div class="q-sender" style="color:' +
      W.nameColor(q.from) +
      '">' +
      W.esc(q.from) +
      "</div>" +
      '<div class="q-text">' +
      W.esc(q.text) +
      "</div>" +
      "</div>";
  }

  // Meta line: time + server delivery ticks on own messages (+ star mark)
  var metaHtml =
    '<div class="msg-meta">' +
    W.esc(W.msgTime(m.ts)) +
    (W.isMine(m) ? " " + W.msgTicks(m) : "") +
    (m.starredByMe ? " " + W.icon("star-fill", "starred-mark") : "") +
    "</div>";

  if (m.kind === "image") {
    inner +=
      '<div class="bubble-media" data-cap="' +
      W.esc(m.text || "") +
      '">' +
      '<img src="' +
      W.esc(m.data || "") +
      '" alt="">' +
      metaHtml +
      "</div>";
    if (m.text) inner += '<div class="media-cap">' + W.esc(m.text) + "</div>";
    return inner;
  } else if (m.kind === "voice") {
    inner +=
      '<div class="voice-bubble">' +
      '<button class="voice-play" data-vchat="' +
      W.esc(chat.id) +
      '" data-vmsg="' +
      W.esc(m.id) +
      '">' +
      W.icon("play", "v-ic") +
      "</button>" +
      '<div class="voice-track"><div class="voice-fill"></div></div>' +
      '<span class="voice-dur">--:--</span>' +
      "</div>";
  } else {
    // text: preserve line breaks
    inner +=
      '<div class="msg-text">' +
      W.esc(m.text || "").replace(/\n/g, "<br>") +
      "</div>";
  }

  inner += metaHtml;
  return inner;
}

function hoverMenu(chat, m) {
  var menu =
    '<div class="hover-menu">' +
    '<button class="hm-btn" data-act="reply" title="Reply">' +
    W.icon("reply", "hm-ic") +
    "</button>" +
    '<button class="hm-btn" data-act="star" title="Star">' +
    W.icon("star", "hm-ic") +
    "</button>";
  if (m.kind === "text" && m.text) {
    menu +=
      '<button class="hm-btn" data-act="copy" title="Copy">' +
      W.icon("copy", "hm-ic") +
      "</button>";
  }
  // Delete is server-side and only allowed on your own messages.
  if (W.isMine(m)) {
    menu +=
      '<button class="hm-btn" data-act="delete" title="Delete">' +
      W.icon("trash", "hm-ic") +
      "</button>";
  }
  menu += "</div>";
  return menu;
}

// --- Main render --------------------------------------------------------

W._msgSig = null; // last-rendered signature, to skip no-op poll rerenders

W.renderMessages = function (opts) {
  opts = opts || {};
  var box = W.$("messages");
  var chatId = W.store.active;
  var chat = chatId ? W.getChat(chatId) : null;
  if (!box || !chat) return;

  var msgs = W.getMessages(chatId);
  var typing = W.store.typing[chatId] || [];

  // Skip rerender when nothing changed (polling path).
  var sig = msgs
    .map(function (m) {
      return m.id + ":" + (m.tick || "") + ":" + (m.starredByMe ? 1 : 0);
    })
    .join(",") + "|t:" + typing.map(function (t) { return t.username; }).join(",");
  if (!opts.force && sig === W._msgSig) return;
  W._msgSig = sig;

  var nearBottom =
    box.scrollHeight - box.scrollTop - box.clientHeight < 160 ||
    box.scrollHeight === 0;

  var html = "";
  var lastDay = null;
  var prevFrom = null;

  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i];
    var mine = W.isMine(m);

    // Day divider when the day changes
    var day = W.dayOf(m.ts);
    if (day !== lastDay) {
      html += '<div class="day-pill">' + W.esc(day) + "</div>";
      lastDay = day;
    }

    // Tail (pointy corner) on the first bubble of a sender run
    var tail = m.from !== prevFrom ? " tail" : "";
    prevFrom = m.from;

    // Group sender name in the sender's colour (not on own bubbles)
    var senderName = "";
    if (chat.isGroup && !mine) {
      var sname = m.fromName || m.from || "";
      senderName =
        '<div class="sender-name" style="color:' +
        W.nameColor(sname) +
        '">' +
        W.esc(sname) +
        "</div>";
    }

    html +=
      '<div class="msg-row ' +
      (mine ? "out" : "in") +
      tail +
      '" data-mid="' +
      W.esc(m.id) +
      '">' +
      '<div class="bubble">' +
      senderName +
      bubbleInner(chat, m) +
      "</div>" +
      hoverMenu(chat, m) +
      "</div>";
  }

  // Typing indicator bubble(s) from the server `typing` array
  typing.forEach(function (t) {
    var tname = t.name || t.username || "";
    var nameHtml =
      '<div class="sender-name" style="color:' +
      W.nameColor(tname) +
      '">' +
      W.esc(tname) +
      "</div>";
    html +=
      '<div class="msg-row in"><div class="bubble">' +
      nameHtml +
      '<div class="typing-dots"><span></span><span></span><span></span></div>' +
      "</div></div>";
  });

  box.innerHTML = html;

  // Wire interactions
  box.querySelectorAll(".msg-row").forEach(function (row) {
    var mid = row.getAttribute("data-mid");
    if (!mid) return;

    // Hover menu actions
    row.querySelectorAll(".hm-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var m = W.findMessage(chatId, mid);
        if (!m) return;
        var act = b.getAttribute("data-act");

        if (act === "reply") {
          if (W.setReplyQuote) W.setReplyQuote(chatId, mid);
        } else if (act === "star") {
          W.starMessage(mid).then(function (now) {
            if (now === null) return;
            m.starredByMe = now;
            W._msgSig = null;
            W.toast(now ? "Starred" : "Unstarred");
            W.renderMessages({ force: true });
          });
        } else if (act === "copy") {
          var txt = m.text || "";
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).catch(function () {});
          }
          W.toast("Copied");
        } else if (act === "delete") {
          W.deleteMessage(chatId, mid).then(function (ok) {
            if (!ok) return;
            W._msgSig = null;
            W.toast("Message deleted");
            W.renderMessages({ force: true });
            if (W.renderChatList) W.renderChatList();
          });
        }
      });
    });

    // Voice play buttons
    var vp = row.querySelector(".voice-play");
    if (vp) {
      vp.addEventListener("click", function (e) {
        e.stopPropagation();
        W.toggleVoice(vp, vp.getAttribute("data-vchat"), vp.getAttribute("data-vmsg"));
      });
    }

    // Image -> lightbox with the real data-URL
    var iw = row.querySelector(".bubble-media");
    if (iw) {
      iw.addEventListener("click", function () {
        var m = W.findMessage(chatId, mid);
        if (m && m.data && W.openLightbox) W.openLightbox(m.data, m.text || "");
      });
    }
  });

  // Scroll to the latest message on first render, on send, or when the
  // user was already near the bottom (avoids yanking during polling).
  if (opts.scroll || nearBottom) box.scrollTop = box.scrollHeight;
};
