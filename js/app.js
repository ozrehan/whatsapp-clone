/* =====================================================================
   app.js — WhatsApp Web clone bootstrap
   Wires every component together and owns the top-level UI shell
   (search, sidebar actions, lightbox, toast, keyboard shortcuts).
   Load order: dom → format → data → store → components → bot → app.
   ===================================================================== */
(function () {
  "use strict";
  var W = (window.W = window.W || {});

  function el(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // --- 1. Data: attach the message corpus onto the chat list --------
    if (W.data && W.data.attachMessages) W.data.attachMessages();

    // Compatibility alias for any residual W.chats access.
    if (W.data && W.data.chats && !W.chats) W.chats = W.data.chats;

    // --- 2. Seed the starred set from data flags (message.starred) ----
    (W.data.chats || []).forEach(function (chat) {
      (chat.messages || []).forEach(function (m) {
        if (m.starred && !W.isStarred(chat.id, m.id)) W.toggleStar(chat.id, m.id);
      });
    });

    // --- 3. Toast ------------------------------------------------------
    var toastTimer = null;
    W.toast = function (msg) {
      var t = el("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        t.classList.remove("show");
      }, 2200);
    };

    // --- 4. Image lightbox ---------------------------------------------
    var lbImg = el("lightboxImg");
    W.openLightbox = function (seedOrUrl, caption) {
      var lb = el("lightbox");
      if (!lb || !lbImg) return;
      var src =
        /^https?:|^data:|^blob:/.test(seedOrUrl || "")
          ? seedOrUrl
          : W.avatar(seedOrUrl || "img", 900);
      lbImg.src = src;
      var cap = el("lightboxCap");
      if (cap) cap.textContent = caption || "";
      var title = el("lightboxTitle");
      if (title) title.textContent = "";
      lb.classList.add("open");
      document.body.classList.add("no-scroll");
    };
    W.closeLightbox = function () {
      var lb = el("lightbox");
      if (lb) lb.classList.remove("open");
      document.body.classList.remove("no-scroll");
    };
    var lbClose = el("lightboxClose");
    if (lbClose) lbClose.addEventListener("click", W.closeLightbox);
    var lb = el("lightbox");
    if (lb)
      lb.addEventListener("click", function (e) {
        if (e.target === lb) W.closeLightbox();
      });

    // --- 5. Sidebar controls --------------------------------------------
    var search = el("searchInput");
    if (search) {
      search.addEventListener("input", function () {
        W.store.search = search.value;
        if (W.renderChatList) W.renderChatList();
      });
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          search.value = "";
          W.store.search = "";
          if (W.renderChatList) W.renderChatList();
          search.blur();
        }
      });
    }

    var back = el("convBack");
    if (back)
      back.addEventListener("click", function () {
        if (W.closeChat) W.closeChat();
      });

    var btnStatus = el("btnStatus");
    if (btnStatus)
      btnStatus.addEventListener("click", function () {
        if (W.openStatusList) W.openStatusList();
      });

    var btnStarred = el("btnStarred");
    if (btnStarred)
      btnStarred.addEventListener("click", function () {
        if (W.openStarred) W.openStarred();
      });

    var btnSettings = el("btnSettings");
    if (btnSettings)
      btnSettings.addEventListener("click", function () {
        if (W.openSettings) W.openSettings();
      });

    var btnNewChat = el("btnNewChat");
    if (btnNewChat) btnNewChat.addEventListener("click", openNewChatPanel);

    // Tapping the conversation header opens contact / group info.
    var who = el("convWho");
    if (who)
      who.addEventListener("click", function () {
        if (W.store && W.store.active && W.openInfo) W.openInfo(W.store.active);
      });

    // --- 6. Global keyboard shortcuts ------------------------------------
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (W.closeLightbox) W.closeLightbox();
        if (W.closeStatusViewer) W.closeStatusViewer();
        if (W.closePanel) W.closePanel();
      }
    });

    // --- 7. Component init ------------------------------------------------
    if (W.initInputBar) W.initInputBar();
    if (W.applyWallpaper) W.applyWallpaper(W.store && W.store.wallpaper);
    if (W.renderStatusStrip) W.renderStatusStrip();
    if (W.renderChatList) W.renderChatList();

    // Mobile: start on the list; the conv view slides over it.
    if (W.closeChat) W.closeChat();
  }

  /* "New chat" panel: every DM contact as a row that opens the chat. */
  function openNewChatPanel() {
    if (!W.openPanel || !W.data) return;
    var rows = (W.data.chats || [])
      .filter(function (c) {
        return c.type !== "group";
      })
      .map(function (c, i) {
        return (
          '<button class="chat-row" data-i="' +
          i +
          '">' +
          W.avatarImg(c.seed, 96) +
          '<div class="chat-row-main"><div class="chat-row-top">' +
          '<span class="chat-name">' +
          W.esc(c.name) +
          "</span></div>" +
          '<div class="chat-row-sub">' +
          W.esc(c.about || c.status || "") +
          "</div></div></button>"
        );
      })
      .join("");
    var contacts = (W.data.chats || []).filter(function (c) {
      return c.type !== "group";
    });
    W.openPanel(
      "New chat",
      '<div class="newchat-list">' + (rows || '<div class="empty-note">No contacts.</div>') + "</div>"
    );
    var body = el("panelBody");
    if (!body) return;
    body.querySelectorAll(".newchat-list .chat-row").forEach(function (row) {
      row.addEventListener("click", function () {
        var c = contacts[parseInt(row.getAttribute("data-i"), 10)];
        if (c && W.openChat) {
          W.closePanel();
          W.openChat(c);
        }
      });
    });
  }
})();
