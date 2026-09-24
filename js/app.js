"use strict";
window.W = window.W || {};

/* =====================================================================
   app.js — WhatsApp Web clone bootstrap.
   Auth gate: with a token -> boot the real app; without -> auth screen.
   Polling: active chat every 2.5s (messages + typing), chat list every
   5s (lastMessage / unread). Load order: dom -> format -> api -> store
   -> components -> auth -> bot -> app.
   ===================================================================== */

(function () {

  /* ---- polling ------------------------------------------------------- */

  W.poll = { listTimer: null, activeTimer: null, activeId: null };

  W.stopActivePoll = function () {
    if (W.poll.activeTimer) {
      clearInterval(W.poll.activeTimer);
      W.poll.activeTimer = null;
    }
    W.poll.activeId = null;
  };

  W.startActivePoll = function (chatId) {
    W.stopActivePoll();
    W.poll.activeId = chatId;
    W.poll.activeTimer = setInterval(function () {
      if (W.store.active !== chatId) {
        W.stopActivePoll();
        return;
      }
      W.fetchMessages(chatId, false)
        .then(function (res) {
          if (W.store.active !== chatId) return;
          // renderMessages skips the rerender internally when the
          // signature is unchanged (no flicker, no scroll yank).
          W.renderMessages();
          W.renderConvHeader();
          if (res.added > 0) W.markChatRead(chatId);
          if (W.renderChatList) W.renderChatList();
        })
        .catch(function () {
          /* transient network hiccup: next tick retries */
        });
    }, 2500);
  };

  W.stopListPoll = function () {
    if (W.poll.listTimer) {
      clearInterval(W.poll.listTimer);
      W.poll.listTimer = null;
    }
  };

  W.startListPoll = function () {
    W.stopListPoll();
    W.poll.listTimer = setInterval(function () {
      if (W.refreshChatList) W.refreshChatList().catch(function () {});
    }, 5000);
  };

  W.stopPolling = function () {
    W.stopActivePoll();
    W.stopListPoll();
  };

  /* ---- boot (post-auth) ------------------------------------------------ */

  var booted = false;

  W.boot = function () {
    W.api
      .get("/me")
      .then(function (me) {
        W.store.profile = (me && me.user) || {};
        var seed = W.store.avatarSeed || (W.store.profile && W.store.profile.seed) || "me";
        var sideAv = document.getElementById("sideAvatar");
        var sideName = document.getElementById("sideName");
        if (sideAv) sideAv.src = W.avatar(seed, 80);
        if (sideName) sideName.textContent = (me && me.name) || "You";
        return W.refreshChatList();
      })
      .then(function () {
        return W.refreshStatus ? W.refreshStatus() : null;
      })
      .then(function () {
        if (W.renderChatList) W.renderChatList();
        W.startListPoll();
        booted = true;
      })
      .catch(function (e) {
        W.apiErr(e);
      });
  };

  /* ---- init (DOM ready) ------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // --- 1. Image lightbox --------------------------------------------
    var lbImg = document.getElementById("lightboxImg");
    W.openLightbox = function (src, caption) {
      var lb = document.getElementById("lightbox");
      if (!lb || !lbImg) return;
      lbImg.src = src || "";
      var cap = document.getElementById("lightboxCap");
      if (cap) cap.textContent = caption || "";
      var title = document.getElementById("lightboxTitle");
      if (title) title.textContent = "";
      lb.classList.add("open");
      document.body.classList.add("no-scroll");
    };
    W.closeLightbox = function () {
      var lb = document.getElementById("lightbox");
      if (lb) lb.classList.remove("open");
      document.body.classList.remove("no-scroll");
    };
    var lbClose = document.getElementById("lightboxClose");
    if (lbClose) lbClose.addEventListener("click", W.closeLightbox);
    var lb = document.getElementById("lightbox");
    if (lb)
      lb.addEventListener("click", function (e) {
        if (e.target === lb) W.closeLightbox();
      });

    // --- 2. Sidebar controls -------------------------------------------
    var search = document.getElementById("searchInput");
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

    var back = document.getElementById("convBack");
    if (back)
      back.addEventListener("click", function () {
        if (W.closeChat) W.closeChat();
      });

    var btnStatus = document.getElementById("btnStatus");
    if (btnStatus)
      btnStatus.addEventListener("click", function () {
        if (W.openStatusList) W.openStatusList();
      });

    var btnStarred = document.getElementById("btnStarred");
    if (btnStarred)
      btnStarred.addEventListener("click", function () {
        if (W.openStarred) W.openStarred();
      });

    var btnSettings = document.getElementById("btnSettings");
    if (btnSettings)
      btnSettings.addEventListener("click", function () {
        if (W.openSettings) W.openSettings();
      });

    var btnNewChat = document.getElementById("btnNewChat");
    if (btnNewChat)
      btnNewChat.addEventListener("click", function () {
        if (W.openNewChat) W.openNewChat();
      });

    // Tapping the conversation header opens contact / group info.
    var who = document.getElementById("convWho");
    if (who)
      who.addEventListener("click", function () {
        var c = W.store && W.store.active ? W.getChat(W.store.active) : null;
        if (c && W.openInfo) W.openInfo(c);
      });

    // --- 3. Global keyboard shortcuts -----------------------------------
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (W.closeLightbox) W.closeLightbox();
        if (W.closeStatusViewer) W.closeStatusViewer();
        if (W.closePanel) W.closePanel();
      }
    });

    // --- 4. Component init ----------------------------------------------
    if (W.initInputBar) W.initInputBar();
    if (W.applyWallpaper) W.applyWallpaper(W.store && W.store.wallpaper);

    // Mobile: start on the list; the conv view slides over it.
    if (W.closeChat) W.closeChat();

    // --- 5. Auth gate ----------------------------------------------------
    if (W.api && W.api.token) {
      W.boot();
    } else if (W.showAuth) {
      W.showAuth();
    }
  }
})();
