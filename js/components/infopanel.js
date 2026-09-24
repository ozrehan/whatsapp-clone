"use strict";
window.W = window.W || {};

/* infopanel.js — slide-over panel host plus contact/group info and starred
   messages views. Expects DOM ids: panelOverlay, panelTitle, panelClose,
   panelBody. Cross-component calls (W.openLightbox, W.openStarred) guarded. */

(function () {

  /* Generic slide-over host. */
  W.openPanel = function (title, bodyHtml) {
    var ov = W.$("#panelOverlay");
    var t = W.$("#panelTitle");
    var body = W.$("#panelBody");
    if (!ov || !body) return;
    if (t) t.textContent = title || "";
    body.innerHTML = bodyHtml || "";
    body.scrollTop = 0;
    ov.classList.add("open");
  };

  W.closePanel = function () {
    var ov = W.$("#panelOverlay");
    if (ov) ov.classList.remove("open");
  };

  function isOpen() {
    var ov = W.$("#panelOverlay");
    return !!(ov && ov.classList.contains("open"));
  }

  /* Esc closes the panel. */
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && isOpen()) W.closePanel();
  });

  /* ---- Contact / group info ---- */

  function msgLabel(msg) {
    if (!msg) return "";
    if (msg.text) return msg.text;
    var labels = { image: "📷 Photo", video: "🎬 Video", voice: "🎤 Voice message", doc: "📄 Document" };
    return labels[msg.type] || "Message";
  }

  function imgThumb(msg, size) {
    size = size || 300;
    if (msg.seed) return "https://picsum.photos/seed/" + encodeURIComponent(msg.seed) + "/" + size;
    return "https://picsum.photos/seed/waimg-" + encodeURIComponent(msg.id || Math.random()) + "/" + size;
  }

  W.openInfo = function (chat) {
    if (!chat) return;
    var about = chat.about || chat.status || (chat.type === "group" ? "Group chat" : "Hey there! I am using WhatsApp.");
    var seed = chat.seed || ("chat-" + chat.id);
    var muted = !!chat.muted;

    var html = "";
    // Hero.
    html += '<div class="info-hero">' +
      W.avatarImg(seed, 120) +
      '<div class="info-hero-name">' + W.esc(chat.name || "") + "</div>" +
      '<div class="info-hero-about">' + W.esc(about) + "</div>" +
      "</div>";

    // Action row: mute toggle / starred / info.
    html += '<div class="info-actions">' +
      '<button class="info-action" data-act="mute">' +
        W.icon(muted ? "bell-off" : "bell", "ic") +
        "<span>" + (muted ? "Unmute" : "Mute") + "</span></button>" +
      '<button class="info-action" data-act="starred">' +
        W.icon("star", "ic") + "<span>Starred</span></button>" +
      '<button class="info-action" data-act="top">' +
        W.icon("info", "ic") + "<span>Info</span></button>" +
      "</div>";

    // Media, links and docs.
    var imgs = (chat.messages || []).filter(function (m) { return m.type === "image"; });
    html += '<div class="info-section"><div class="info-section-title">Media, links and docs</div>';
    html += '<div class="media-grid">';
    for (var i = 0; i < 9; i++) {
      var src;
      if (i < imgs.length) {
        src = imgThumb(imgs[i]);
      } else {
        src = "https://picsum.photos/seed/wa-media-" + encodeURIComponent(chat.id) + "-" + i + "/300";
      }
      html += '<button class="media-thumb" data-src="' + W.esc(src) + '">' +
        '<img src="' + W.esc(src) + '" alt="" loading="lazy"></button>';
    }
    html += "</div></div>";

    // Members for groups.
    if (chat.type === "group" && chat.participants && chat.participants.length) {
      html += '<div class="info-section"><div class="info-section-title">Members · ' +
        chat.participants.length + "</div>";
      chat.participants.forEach(function (p, idx) {
        var pname = p.name || p;
        var pseed = p.seed || ("member-" + pname);
        html += '<div class="member-row">' +
          W.avatarImg(pseed, 40) +
          '<div class="member-meta"><div class="member-name">' + W.esc(pname) + "</div></div>" +
          (idx === 0 ? '<span class="admin-tag">Admin</span>' : "") +
          (p.isYou ? '<span class="admin-tag you-tag">You</span>' : "") +
          "</div>";
      });
      html += "</div>";
    }

    // Settings rows.
    html += '<div class="info-section">' +
      '<button class="info-row" data-act="mute-row">' +
        "<span>Mute notifications</span>" +
        '<span class="toggle' + (muted ? " on" : "") + '"><span class="knob"></span></span>' +
      "</button>" +
      '<button class="info-row" data-act="starred">' +
        "<span>Starred messages</span>" + W.icon("chevron-right", "ic dim") +
      "</button>" +
      "</div>";

    W.openPanel(chat.type === "group" ? "Group info" : "Contact info", html);

    var body = W.$("#panelBody");
    if (!body) return;

    body.querySelectorAll("[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.getAttribute("data-act");
        if (act === "mute" || act === "mute-row") {
          if (W.toggleMute) W.toggleMute(chat);
          // Re-render to reflect the new mute state.
          W.openInfo(chat);
        } else if (act === "starred") {
          if (W.openStarred) W.openStarred();
        } else if (act === "top") {
          body.scrollTop = 0;
        }
      });
    });

    body.querySelectorAll(".media-thumb").forEach(function (th) {
      th.addEventListener("click", function () {
        var src = th.getAttribute("data-src");
        if (W.openLightbox) W.openLightbox(src);
      });
    });
  };

  /* ---- Starred messages ---- */

  W.openStarred = function () {
    var list = W.starredAll ? W.starredAll() : [];
    var html = "";
    if (!list.length) {
      html = '<div class="empty-note">No starred messages yet.<br>' +
        "Hover a message and tap the star to keep it here.</div>";
    } else {
      list.forEach(function (s, i) {
        var m = s.msg || {};
        var txt = m.text || m.caption || (m.type === "image" ? "📷 Photo" :
          m.type === "voice" ? "🎤 Voice message" : m.type === "doc" ? "📄 Document" : "");
        html += '<button class="starred-row" data-idx="' + i + '">' +
          '<div class="starred-chat">' + W.esc((s.chat && s.chat.name) || "") + "</div>" +
          '<div class="starred-text">' + W.esc(txt) + "</div>" +
          '<div class="starred-time">' + W.esc(m.time || "") + "</div>" +
          "</button>";
      });
    }
    W.openPanel("Starred messages", html);

    var body = W.$("#panelBody");
    if (!body) return;
    body.querySelectorAll(".starred-row").forEach(function (row) {
      row.addEventListener("click", function () {
        var s = list[parseInt(row.getAttribute("data-idx"), 10)];
        if (!s || !s.chat || !W.openChat) return;
        W.closePanel();
        W.openChat(s.chat);
        // Scroll the starred message into view after the chat renders.
        var mid = s.msg && s.msg.id;
        if (mid) {
          setTimeout(function () {
            var node = document.querySelector('[data-mid="' + mid + '"]');
            if (node) {
              node.scrollIntoView({ behavior: "smooth", block: "center" });
              node.classList.add("flash");
              setTimeout(function () { node.classList.remove("flash"); }, 1200);
            }
          }, 80);
        }
      });
    });
  };

  /* Panel close button wiring (idempotent — safe if app.js also binds it). */
  if (!W._panelCloseBound) {
    W._panelCloseBound = true;
    document.addEventListener("click", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("#panelClose")) {
        W.closePanel();
      }
    });
  }

})();
