"use strict";
window.W = window.W || {};

/* =====================================================================
   inputbar.js — message composer: text send (POST to API), emoji picker,
   attach menu (real photo upload), real voice recorder (MediaRecorder),
   and reply-quote preview (replyTo -> API). Expects DOM ids:
   msgInput, sendBtn, micBtn, emojiBtn, emojiPicker, clipBtn, attachMenu,
   recorder, recTimer, recCancel, recSend, replyPreview, replyPreviewText,
   replyPreviewClose, inputBarWrap.
   ===================================================================== */

(function () {

  var MAX_DATA_URL = 1.5 * 1024 * 1024; // API cap on image/voice data-URLs

  /* Resolve the currently open chat id. */
  function activeChatId() {
    return W.store && W.store.active ? W.store.active : null;
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

  /* Primary send path: POST the message to the API. The pending reply
     quote (W.store.replyTo) is sent as replyTo=<message id>. */
  W.sendUserText = function (text) {
    text = (text || "").trim();
    if (!text) return;
    var chatId = activeChatId();
    if (!chatId) return;

    var payload = { text: text, kind: "text" };
    var q = W.store && W.store.replyTo;
    if (q && q.chatId === chatId && q.msgId) payload.replyTo = q.msgId;

    if (W.store) W.store.replyTo = null;
    renderReplyPreview();

    var inp = W.$("#msgInput");
    if (inp) {
      inp.value = "";
      toggleSendMic();
      inp.focus();
    }

    W.sendMessage(chatId, payload).then(function (msg) {
      if (msg && W.nudgeActivePoll) W.nudgeActivePoll();
    });
  };

  /* Throttled "I'm typing" ping (at most once per 4s). */
  var lastTypingPing = 0;
  function pokeTyping() {
    var now = Date.now();
    if (now - lastTypingPing < 4000) return;
    lastTypingPing = now;
    var chatId = activeChatId();
    if (chatId) {
      W.api
        .post("/chats/" + encodeURIComponent(chatId) + "/typing")
        .catch(function () {});
    }
  }

  /* ---- file -> data-URL helper -------------------------------------- */

  function fileToDataURL(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      cb(reader.result);
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(file);
  }

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

  /* ---- Voice recorder (real audio via MediaRecorder) ---- */

  var recTimerId = null;
  var recStart = 0;
  var mediaRec = null;
  var recChunks = [];
  var recStream = null;

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

    // Real audio capture.
    recChunks = [];
    mediaRec = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
          recStream = stream;
          try {
            mediaRec = new MediaRecorder(stream);
          } catch (e) {
            mediaRec = null;
          }
          if (mediaRec) {
            mediaRec.ondataavailable = function (ev) {
              if (ev.data && ev.data.size) recChunks.push(ev.data);
            };
            mediaRec.start();
          }
        })
        .catch(function () {
          if (W.toast) W.toast("Microphone not available");
        });
    }
  }

  function stopRecording(send) {
    if (recTimerId) {
      clearInterval(recTimerId);
      recTimerId = null;
    }
    var rec = W.$("#recorder");
    var wrap = W.$("#inputBarWrap");
    if (rec) rec.classList.remove("show");
    if (wrap) wrap.style.display = "";

    var chatId = activeChatId();

    function cleanupStream() {
      if (recStream) {
        recStream.getTracks().forEach(function (t) {
          try {
            t.stop();
          } catch (e) {}
        });
        recStream = null;
      }
    }

    if (mediaRec && mediaRec.state !== "inactive") {
      var mr = mediaRec;
      mediaRec = null;
      mr.onstop = function () {
        cleanupStream();
        if (send && chatId && recChunks.length) {
          var blob = new Blob(recChunks, {
            type: (mr.mimeType || "audio/webm").split(";")[0]
          });
          fileToDataURL(blob, function (url) {
            recChunks = [];
            if (!url) {
              if (W.toast) W.toast("Recording failed");
              return;
            }
            if (url.length > MAX_DATA_URL) {
              if (W.toast) W.toast("Voice note too large to send");
              return;
            }
            W.sendMessage(chatId, { kind: "voice", data: url }).then(
              function (msg) {
                if (msg && W.nudgeActivePoll) W.nudgeActivePoll();
              }
            );
          });
        } else {
          recChunks = [];
        }
      };
      try {
        mr.stop();
      } catch (e) {
        cleanupStream();
      }
    } else {
      cleanupStream();
      mediaRec = null;
      recChunks = [];
    }
    recStart = 0;
  }

  /* ---- Reply quote preview ---- */

  function msgSnippet(m) {
    if (!m) return "";
    if (m.text) {
      return m.text.length > 70 ? m.text.slice(0, 70) + "…" : m.text;
    }
    var labels = { image: "📷 Photo", voice: "🎤 Voice message" };
    return labels[m.kind] || "Message";
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

  /* Called by the hover menu ("reply"). Builds the quote {from, text} up
     front; the message id is sent to the API as replyTo. */
  W.setReplyQuote = function (chatId, msgId) {
    var m = W.findMessage ? W.findMessage(chatId, msgId) : null;
    var from = m ? (W.isMine(m) ? "You" : m.fromName || m.from || "Message") : "Message";
    if (W.store) {
      W.store.replyTo = {
        chatId: chatId,
        msgId: msgId,
        from: from,
        text: msgSnippet(m)
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

  /* ---- Photo attach (real upload as data-URL) ---- */

  var photoInput = null;

  function ensurePhotoInput() {
    if (photoInput) return photoInput;
    photoInput = document.createElement("input");
    photoInput.type = "file";
    photoInput.accept = "image/*";
    photoInput.style.display = "none";
    photoInput.addEventListener("change", function () {
      var f = photoInput.files && photoInput.files[0];
      photoInput.value = "";
      if (!f) return;
      fileToDataURL(f, function (url) {
        if (!url) {
          if (W.toast) W.toast("Couldn't read that image");
          return;
        }
        if (url.length > MAX_DATA_URL) {
          if (W.toast) W.toast("Image too large (max 1.5MB)");
          return;
        }
        var chatId = activeChatId();
        if (!chatId) return;
        W.sendMessage(chatId, { kind: "image", data: url, text: "" }).then(
          function (msg) {
            if (msg && W.nudgeActivePoll) W.nudgeActivePoll();
          }
        );
      });
    });
    document.body.appendChild(photoInput);
    return photoInput;
  }

  /* ---- Init: wire all composer controls ---- */

  W.initInputBar = function () {
    var inp = W.$("#msgInput");
    if (!inp) return;

    // Typing toggles send vs mic + throttled typing ping to the server.
    inp.addEventListener("input", function () {
      toggleSendMic();
      pokeTyping();
    });
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        W.sendUserText(inp.value);
      }
    });

    var sendBtn = W.$("#sendBtn");
    if (sendBtn)
      sendBtn.addEventListener("click", function () {
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
        var chatId = activeChatId();
        if (kind === "photo") {
          if (chatId) ensurePhotoInput().click();
        } else if (kind === "doc") {
          if (W.toast) W.toast("Documents aren't supported yet");
        } else if (kind === "camera") {
          if (W.toast) W.toast("Camera not available on web");
        }
      });
    }

    // Voice recorder.
    var micBtn = W.$("#micBtn");
    if (micBtn) micBtn.addEventListener("click", startRecording);
    var cancel = W.$("#recCancel");
    if (cancel)
      cancel.addEventListener("click", function () {
        stopRecording(false);
      });
    var send = W.$("#recSend");
    if (send)
      send.addEventListener("click", function () {
        stopRecording(true);
      });

    // Reply preview close.
    var rclose = W.$("#replyPreviewClose");
    if (rclose) rclose.addEventListener("click", W.clearReplyQuote);

    // Close floating emoji/attach panels on outside click.
    document.addEventListener("click", function (ev) {
      var pk = W.$("#emojiPicker");
      var mn = W.$("#attachMenu");
      var eb = W.$("#emojiBtn");
      var cb = W.$("#clipBtn");
      if (
        pk &&
        pk.classList.contains("open") &&
        !pk.contains(ev.target) &&
        !(eb && eb.contains(ev.target))
      ) {
        pk.classList.remove("open");
      }
      if (
        mn &&
        mn.classList.contains("open") &&
        !mn.contains(ev.target) &&
        !(cb && cb.contains(ev.target))
      ) {
        mn.classList.remove("open");
      }
    });

    toggleSendMic();
    renderReplyPreview();
  };
})();
