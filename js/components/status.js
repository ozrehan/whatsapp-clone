"use strict";
window.W = window.W || {};

/* status.js — status strip, status list, and fullscreen status viewer.
   Expects DOM ids: statusStrip, statusViewer, svBars, svImg, svCaption,
   svName, svTime, svClose, svPrev, svNext, svReplyInput.
   Status data shape (W.data.statuses): [{ name, seed, time, items:
   [{ img?, caption?, time?, viewed? }] }]. All reads are defensive. */

(function () {

  function statuses() {
    return (W.data && W.data.statuses) || [];
  }

  function allViewed(s) {
    return (s.items || []).length > 0 &&
      (s.items || []).every(function (it) { return it.viewed; });
  }

  function statusImg(s, item, w, h) {
    w = w || 900; h = h || 1200;
    if (item && item.img) return item.img;
    if (item && item.seed) {
      return "https://picsum.photos/seed/" + encodeURIComponent(item.seed) + "/" + w + "/" + h;
    }
    var seed = (s.seed || s.name || "status") + "-" + (item && item.time ? item.time : w);
    return "https://picsum.photos/seed/" + encodeURIComponent(seed) + "/" + w + "/" + h;
  }

  /* ---- Strip ---- */

  W.renderStatusStrip = function () {
    var strip = W.$("#statusStrip");
    if (!strip) return;
    strip.innerHTML = "";

    // "My status" — own avatar with a plus badge.
    var mine = W.el("button", "status-item my-status");
    var mySeed = (W.store && W.store.profile && W.store.profile.seed) || "rehan-self-1";
    mine.innerHTML = '<span class="status-ring">' + W.avatarImg(mySeed, 56) +
      '<span class="status-plus">+</span></span>' +
      '<span class="status-name">My status</span>';
    mine.addEventListener("click", function () { W.openStatusList(); });
    strip.appendChild(mine);

    statuses().forEach(function (s, idx) {
      var seen = allViewed(s);
      var item = W.el("button", "status-item");
      item.innerHTML = '<span class="status-ring ' + (seen ? "ring-seen" : "ring-unseen") + '">' +
        W.avatarImg(s.seed || ("status-" + idx), 56) + "</span>" +
        '<span class="status-name">' + W.esc(s.name || "") + "</span>";
      item.addEventListener("click", function () { W.openStatusList(); });
      item.addEventListener("dblclick", function () { W.openStatusViewer(idx); });
      strip.appendChild(item);
    });
  };

  /* ---- Status list (hosted in the slide-over panel) ---- */

  W.openStatusList = function () {
    if (!W.openPanel) return;
    var list = statuses();
    var html = '<div class="status-list">';
    list.forEach(function (s, idx) {
      var seen = allViewed(s);
      var t = (s.items && s.items[0] && s.items[0].time) || s.time || "";
      html += '<button class="status-row" data-idx="' + idx + '">' +
        '<span class="status-ring sm ' + (seen ? "ring-seen" : "ring-unseen") + '">' +
          W.avatarImg(s.seed || ("status-" + idx), 48) + "</span>" +
        '<span class="status-row-meta"><span class="status-row-name">' +
          W.esc(s.name || "") + '</span>' +
        '<span class="status-row-time">' + W.esc(t) + "</span></span>" +
        "</button>";
    });
    if (!list.length) {
      html += '<div class="empty-note">No recent updates.</div>';
    }
    html += "</div>";
    W.openPanel("Status", html);

    var body = W.$("#panelBody");
    if (!body) return;
    body.querySelectorAll(".status-row").forEach(function (row) {
      row.addEventListener("click", function () {
        W.openStatusViewer(parseInt(row.getAttribute("data-idx"), 10));
      });
    });
  };

  /* ---- Fullscreen viewer ---- */

  var curStatus = -1;      // index into W.data.statuses
  var curItem = 0;         // index into status.items
  var progTimer = null;
  var prog = 0;            // 0..1 progress of current item
  var ITEM_MS = 5000;      // 5s per item
  var TICK_MS = 100;

  function viewer() { return W.$("#statusViewer"); }

  function stopProgress() {
    if (progTimer) { clearInterval(progTimer); progTimer = null; }
  }

  function markViewed() {
    var s = statuses()[curStatus];
    if (s && s.items) {
      s.items.forEach(function (it) { it.viewed = true; });
      W.renderStatusStrip();
    }
  }

  function paintBars() {
    var bars = W.$("#svBars");
    if (!bars) return;
    var s = statuses()[curStatus];
    var items = (s && s.items) || [];
    bars.innerHTML = "";
    items.forEach(function (_, i) {
      var bar = W.el("div", "sv-bar");
      var fill = W.el("div", "sv-fill");
      if (i < curItem) fill.style.width = "100%";
      else if (i === curItem) fill.style.width = (prog * 100) + "%";
      else fill.style.width = "0%";
      bar.appendChild(fill);
      bars.appendChild(bar);
    });
  }

  function paintCurrent() {
    var s = statuses()[curStatus];
    var items = (s && s.items) || [];
    var item = items[curItem] || {};
    var name = W.$("#svName");
    var time = W.$("#svTime");
    var img = W.$("#svImg");
    var cap = W.$("#svCaption");
    if (name) name.textContent = s ? s.name : "";
    if (time) time.textContent = item.time || (s ? s.time : "") || "";
    if (img) img.src = statusImg(s || {}, item);
    if (cap) cap.textContent = item.caption || "";
    // Header avatar: rebuild small avatar each time.
    var v = viewer();
    if (v) {
      var old = v.querySelector(".sv-avatar");
      if (old) old.remove();
      var av = W.el("span", "sv-avatar");
      av.innerHTML = W.avatarImg(s ? (s.seed || "status-" + curStatus) : "status", 40);
      var hdr = v.querySelector(".sv-header");
      if (hdr) hdr.insertBefore(av, hdr.firstChild);
    }
    paintBars();
  }

  function nextItem() {
    var s = statuses()[curStatus];
    var items = (s && s.items) || [];
    if (curItem + 1 < items.length) {
      curItem++;
      prog = 0;
      paintCurrent();
    } else {
      nextStatus();
    }
  }

  function prevItem() {
    if (curItem > 0) {
      curItem--;
    } else {
      prevStatus();
      return;
    }
    prog = 0;
    paintCurrent();
  }

  function nextStatus() {
    var list = statuses();
    if (curStatus + 1 < list.length) {
      curStatus++;
      curItem = 0;
      prog = 0;
      paintCurrent();
    } else {
      W.closeStatusViewer();
    }
  }

  function prevStatus() {
    if (curStatus > 0) {
      curStatus--;
      var items = (statuses()[curStatus].items) || [];
      curItem = Math.max(0, items.length - 1);
      prog = 0;
      paintCurrent();
    } else {
      prog = 0;
      paintCurrent();
    }
  }

  function startProgress() {
    stopProgress();
    progTimer = setInterval(function () {
      prog += TICK_MS / ITEM_MS;
      if (prog >= 1) { prog = 0; nextItem(); return; }
      var bars = W.$("#svBars");
      if (bars && bars.children[curItem]) {
        var fill = bars.children[curItem].querySelector(".sv-fill");
        if (fill) fill.style.width = (prog * 100) + "%";
      }
    }, TICK_MS);
  }

  /* Find the 1:1 chat matching a status contact name, for status replies. */
  function findDmChat(name) {
    var chats = (W.data && W.data.chats) || [];
    if (!name) return null;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].type !== "group" && chats[i].name === name) return chats[i];
    }
    return null;
  }

  W.openStatusViewer = function (i) {
    var list = statuses();
    if (!list.length || i == null || i < 0 || i >= list.length) return;
    var v = viewer();
    if (!v) return;
    curStatus = i;
    curItem = 0;
    prog = 0;
    v.classList.add("open");
    paintCurrent();
    startProgress();
    markViewed();
  };

  W.closeStatusViewer = function () {
    stopProgress();
    var v = viewer();
    if (v) v.classList.remove("open");
    curStatus = -1;
    curItem = 0;
    prog = 0;
  };

  W.isStatusViewerOpen = function () {
    var v = viewer();
    return !!(v && v.classList.contains("open"));
  };

  /* Viewer controls — bound once, lazily (ids may not exist until app boots). */
  function bindViewerControls() {
    var close = W.$("#svClose");
    if (close && !close._bound) {
      close._bound = true;
      close.addEventListener("click", W.closeStatusViewer);
    }
    var prev = W.$("#svPrev");
    if (prev && !prev._bound) {
      prev._bound = true;
      prev.addEventListener("click", function (ev) { ev.stopPropagation(); prevItem(); });
    }
    var next = W.$("#svNext");
    if (next && !next._bound) {
      next._bound = true;
      next.addEventListener("click", function (ev) { ev.stopPropagation(); nextItem(); });
    }
    var reply = W.$("#svReplyInput");
    if (reply && !reply._bound) {
      reply._bound = true;
      reply.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          var text = reply.value.trim();
          if (!text) return;
          var s = statuses()[curStatus];
          var chat = findDmChat(s && s.name);
          if (chat && W.bot && W.bot.sendText) {
            W.bot.sendText(chat, "Re: status — " + text);
            if (W.toast) W.toast("Reply sent");
          } else if (W.toast) {
            W.toast("No chat found for this contact");
          }
          reply.value = "";
          W.closeStatusViewer();
        }
        ev.stopPropagation();
      });
      // Typing in the reply box must not trigger panel Esc handling weirdness.
      reply.addEventListener("click", function (ev) { ev.stopPropagation(); });
    }
    var img = W.$("#svImg");
    if (img && !img._bound) {
      img._bound = true;
      // Click left/right halves of the image to go prev/next.
      img.addEventListener("click", function (ev) {
        var r = img.getBoundingClientRect();
        var x = ev.clientX - r.left;
        if (x < r.width / 2) prevItem(); else nextItem();
      });
    }
  }

  /* Esc hides the viewer (takes precedence over the panel's Esc handler,
     which checks its own open state). */
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && W.isStatusViewerOpen()) {
      ev.stopPropagation();
      W.closeStatusViewer();
    }
  }, true);

  /* Bind controls on first openStatusViewer call path too. */
  var _open = W.openStatusViewer;
  W.openStatusViewer = function (i) {
    bindViewerControls();
    _open(i);
  };

})();
