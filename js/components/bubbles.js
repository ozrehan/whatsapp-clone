"use strict";
window.W = window.W || {};

// --- Sender name colours for group chats --------------------------------
// Palette from the original; unknown names fall back to a hash pick.

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

// --- Fake voice playback -------------------------------------------------
// Only one voice note plays at a time; state lives in W._voice.

W._voice = { interval: null, btn: null, bar: null };

W.toggleVoice = function (btn, chatId, msgId) {
  var chat = W.getChat(chatId);
  if (!chat) return;
  var msg = null;
  for (var i = 0; i < (chat.messages || []).length; i++) {
    if (chat.messages[i].id === msgId) { msg = chat.messages[i]; break; }
  }
  if (!msg) return;

  // Pause the currently playing note (same or different)
  function stopCurrent() {
    if (W._voice.interval) clearInterval(W._voice.interval);
    if (W._voice.btn) W._voice.btn.innerHTML = W.icon("play", "v-ic");
    if (W._voice.bar) W._voice.bar.style.width = "0%";
    W._voice.interval = null;
    W._voice.btn = null;
    W._voice.bar = null;
  }

  var isThisOne = W._voice.btn === btn;
  stopCurrent();
  if (isThisOne) return; // was playing -> now paused

  // Start playing this one
  var wrap = btn.closest(".voice-bubble");
  var fill = wrap ? wrap.querySelector(".voice-fill") : null;
  btn.innerHTML = W.icon("pause", "v-ic");
  W._voice.btn = btn;
  W._voice.bar = fill;

  var total = Math.max(1, Math.round((msg.duration || 5) * 10)); // 100ms steps
  var step = 0;
  W._voice.interval = setInterval(function () {
    step++;
    if (fill) fill.style.width = Math.min(100, (step / total) * 100) + "%";
    if (step >= total) stopCurrent();
  }, 100);
};

// --- Bubble body builders -----------------------------------------------

function bubbleInner(chat, m) {
  var inner = "";

  // Quoted / replied-to message
  if (m.quote) {
    inner +=
      '<div class="quoted">' +
        '<div class="q-sender" style="color:' + W.nameColor(m.quote.from) + '">' +
          W.esc(m.quote.from) +
        "</div>" +
        '<div class="q-text">' + W.esc(m.quote.text) + "</div>" +
      "</div>";
  }

  // Meta line: time + delivery ticks on own messages (+ star mark)
  var metaHtml =
    '<div class="msg-meta">' + W.esc(m.time || "") +
    (m.from === "me" ? " " + W.msgTicks(m) : "") +
    (W.isStarred(chat.id, m.id) ? " " + W.icon("star", "starred-mark") : "") +
    "</div>";

  if (m.type === "image") {
    inner +=
      '<div class="bubble-media" data-seed="' + W.esc(m.seed || "") + '" data-cap="' + W.esc(m.caption || "") + '">' +
        '<img src="' + W.avatar(m.seed || "img", 400) + '" alt="">' +
        metaHtml +
      "</div>";
    if (m.caption) inner += '<div class="media-cap">' + W.esc(m.caption) + "</div>";
    return inner;
  } else if (m.type === "voice") {
    inner +=
      '<div class="voice-bubble">' +
        '<button class="voice-play" data-vchat="' + chat.id + '" data-vmsg="' + m.id + '">' +
          W.icon("play", "v-ic") +
        "</button>" +
        '<div class="voice-track"><div class="voice-fill"></div></div>' +
        '<span class="voice-dur">' + W.fmtDur(m.duration) + "</span>" +
      "</div>";
  } else if (m.type === "doc") {
    inner +=
      '<div class="doc-bubble">' +
        '<div class="doc-ic">' + W.icon("doc", "d-ic") + "</div>" +
        '<div class="doc-meta"><div class="doc-name">' + W.esc(m.filename || "Document") + "</div>" +
        '<div class="doc-sub">' + W.esc(m.size || "") + "</div></div>" +
      "</div>";
  } else {
    inner += '<div class="msg-text">' + W.esc(m.text || "") + "</div>";
  }

  inner += metaHtml;
  return inner;
}

function hoverMenu(chat, m) {
  var menu =
    '<div class="hover-menu">' +
    '<button class="hm-btn" data-act="reply" title="Reply">' + W.icon("reply", "hm-ic") + "</button>" +
    '<button class="hm-btn" data-act="star" title="Star">' + W.icon("star", "hm-ic") + "</button>";
  if (m.type !== "text" && m.text == null) {
    // non-text bubbles: no copy button
  } else {
    menu += '<button class="hm-btn" data-act="copy" title="Copy">' + W.icon("copy", "hm-ic") + "</button>";
  }
  menu += '<button class="hm-btn" data-act="delete" title="Delete">' + W.icon("trash", "hm-ic") + "</button>";
  menu += "</div>";
  return menu;
}

// --- Main render --------------------------------------------------------

W.renderMessages = function () {
  var box = W.$("messages");
  var chat = W.store.active;
  if (!box || !chat) return;

  var html = "";
  var lastDay = null;
  var prevFrom = null;
  var msgs = chat.messages || [];

  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i];
    var mine = m.from === "me";

    // Day divider when the day changes
    if (m.day !== lastDay) {
      html += '<div class="day-pill">' + W.esc(W.dayLabel(m.day || "today")) + "</div>";
      lastDay = m.day;
    }

    // Tail (pointy corner) on the first bubble of a sender run
    var tail = m.from !== prevFrom ? " tail" : "";
    prevFrom = m.from;

    // Group sender name in the sender's colour (not on own bubbles)
    var senderName = "";
    if (chat.type === "group" && !mine) {
      senderName =
        '<div class="sender-name" style="color:' + W.nameColor(m.from) + '">' +
        W.esc(m.from) +
        "</div>";
    }

    html +=
      '<div class="msg-row ' + (mine ? "out" : "in") + tail + '" data-mid="' + m.id + '">' +
        '<div class="bubble">' +
          senderName +
          bubbleInner(chat, m) +
        "</div>" +
        hoverMenu(chat, m) +
      "</div>";
  }

  box.innerHTML = html;

  // Wire interactions
  box.querySelectorAll(".msg-row").forEach(function (row) {
    var mid = row.getAttribute("data-mid");

    function findMsg() {
      var arr = chat.messages || [];
      for (var j = 0; j < arr.length; j++) if (arr[j].id === mid) return arr[j];
      return null;
    }

    // Hover menu actions
    row.querySelectorAll(".hm-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var m = findMsg();
        if (!m) return;
        var act = b.getAttribute("data-act");

        if (act === "reply") {
          if (W.setReplyQuote) W.setReplyQuote(chat.id, m.id);
        } else if (act === "star") {
          var now = W.toggleStar(chat.id, m.id);
          W.toast(now ? "Starred" : "Unstarred");
          W.renderMessages();
        } else if (act === "copy") {
          var txt = m.text || m.caption || "";
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).catch(function () {});
          }
          W.toast("Copied");
        } else if (act === "delete") {
          var idx = chat.messages.indexOf(m);
          if (idx !== -1) chat.messages.splice(idx, 1);
          W.toast("Message deleted");
          W.renderMessages();
          if (W.renderChatList) W.renderChatList();
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

    // Image -> lightbox (lightbox.js owns W.openLightbox)
    var iw = row.querySelector(".bubble-media");
    if (iw) {
      iw.addEventListener("click", function () {
        if (W.openLightbox) W.openLightbox(iw.getAttribute("data-seed"), iw.getAttribute("data-cap"));
      });
    }
  });

  // Always scroll to the latest message
  box.scrollTop = box.scrollHeight;
};
