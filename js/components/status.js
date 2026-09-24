"use strict";
window.W = window.W || {};

/* =====================================================================
   status.js — status strip, status list (with composer), fullscreen
   viewer. Server feed shape (GET /api/status):
     [{ username, name, seed, items: [{ id, text, imageData, ts }] }]
   Seen/unseen rings are tracked client-side (viewed item ids in
   localStorage). Posting goes through POST /api/status.
   Expects DOM ids: statusStrip, statusViewer, svBars, svImg, svCaption,
   svName, svTime, svClose, svPrev, svNext, svReplyInput.
   ===================================================================== */

(function () {
  var VIEWED_KEY = "wa_status_viewed";
  var MAX_DATA_URL = 1.5 * 1024 * 1024;

  function viewedSet() {
    try {
      var raw = localStorage.getItem(VIEWED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function isViewed(itemId) {
    return viewedSet().indexOf(itemId) !== -1;
  }

  function markItemViewed(itemId) {
    try {
      var arr = viewedSet();
      if (arr.indexOf(itemId) === -1) {
        arr.push(itemId);
        localStorage.setItem(VIEWED_KEY, JSON.stringify(arr.slice(-500)));
      }
    } catch (e) {}
  }

  function feed() {
    return (W.store && W.store.statusFeed) || [];
  }

  function allViewed(s) {
    return (s.items || []).length > 0 &&
      (s.items || []).every(function (it) {
        return isViewed(it.id);
      });
  }

  /* ---- Fetch ---- */

  W.refreshStatus = function () {
    return W.api
      .get("/status")
      .then(function (r) {
        W.store.statusFeed = (r && r.statuses) || [];
        if (W.renderStatusStrip) W.renderStatusStrip();
        return W.store.statusFeed;
      })
      .catch(function (e) {
        W.apiErr(e);
        return [];
      });
  };

  /* ---- Strip ---- */

  W.renderStatusStrip = function () {
    var strip = W.$("#statusStrip");
    if (!strip) return;
    strip.innerHTML = "";

    // "My status" — own avatar with a plus badge -> composer list.
    var mine = W.el("button", "status-item my-status");
    var mySeed =
      (W.store && (W.store.avatarSeed || (W.store.profile && W.store.profile.seed))) ||
      "me";
    mine.innerHTML =
      '<span class="status-ring">' +
      W.avatarImg(mySeed, 56) +
      '<span class="status-plus">+</span></span>' +
      '<span class="status-name">My status</span>';
    mine.addEventListener("click", function () {
      W.openStatusList();
    });
    strip.appendChild(mine);

    feed().forEach(function (s, idx) {
      var seen = allViewed(s);
      var item = W.el("button", "status-item");
      item.innerHTML =
        '<span class="status-ring ' +
        (seen ? "ring-seen" : "ring-unseen") +
        '">' +
        W.avatarImg(s.seed || ("status-" + idx), 56) +
        "</span>" +
        '<span class="status-name">' +
        W.esc(s.name || s.username || "") +
        "</span>";
      item.addEventListener("click", function () {
        W.openStatusViewer(idx);
      });
      strip.appendChild(item);
    });
  };

  /* ---- Status list with composer (hosted in the slide-over panel) ---- */

  W.openStatusList = function () {
    if (!W.openPanel) return;
    var list = feed();
    var html = '<div class="status-list">';

    // Composer: post a text or photo status.
    html +=
      '<div class="info-section-title nc-label">New status</div>' +
      '<div class="status-compose">' +
      '<textarea id="scText" rows="2" placeholder="Type a status…"></textarea>' +
      '<div class="status-compose-row">' +
      '<button class="icon-btn" id="scPhoto" title="Photo status">' +
      W.icon("photo") +
      "</button>" +
      '<span style="flex:1"></span>' +
      '<button class="send-btn" id="scPost" title="Post status">' +
      W.icon("send") +
      "</button>" +
      "</div>" +
      '<input type="file" id="scFile" accept="image/*" style="display:none">' +
      "</div>";

    html += '<div class="info-section-title nc-label">Recent updates</div>';
    list.forEach(function (s, idx) {
      var seen = allViewed(s);
      var t =
        (s.items && s.items[0] && W.msgTime(s.items[0].ts)) || "";
      html +=
        '<button class="status-row" data-idx="' +
        idx +
        '">' +
        '<span class="status-ring sm ' +
        (seen ? "ring-seen" : "ring-unseen") +
        '">' +
        W.avatarImg(s.seed || ("status-" + idx), 48) +
        "</span>" +
        '<span class="status-row-meta"><span class="status-row-name">' +
        W.esc(s.name || s.username || "") +
        "</span>" +
        '<span class="status-row-time">' +
        W.esc(t) +
        (s.items && s.items.length > 1 ? " · " + s.items.length + " updates" : "") +
        "</span></span>" +
        "</button>";
    });
    if (!list.length) {
      html += '<div class="empty-note">No recent updates.</div>';
    }
    html += "</div>";
    W.openPanel("Status", html);

    // Text post.
    var postBtn = W.$("#scPost");
    if (postBtn) {
      postBtn.addEventListener("click", function () {
        var ta = W.$("#scText");
        var text = ta ? ta.value.trim() : "";
        if (!text) {
          W.toast("Type something first");
          return;
        }
        postBtn.disabled = true;
        W.api
          .post("/status", { text: text })
          .then(function () {
            W.toast("Status posted");
            return W.refreshStatus();
          })
          .then(function () {
            W.openStatusList();
          })
          .catch(function (e) {
            postBtn.disabled = false;
            W.apiErr(e);
          });
      });
    }

    // Photo post.
    var fileInput = W.$("#scFile");
    var photoBtn = W.$("#scPhoto");
    if (photoBtn && fileInput) {
      photoBtn.addEventListener("click", function () {
        fileInput.click();
      });
      fileInput.addEventListener("change", function () {
        var f = fileInput.files && fileInput.files[0];
        fileInput.value = "";
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var url = reader.result;
          if (!url || url.length > MAX_DATA_URL) {
            W.toast("Image too large (max 1.5MB)");
            return;
          }
          W.api
            .post("/status", { imageData: url })
            .then(function () {
              W.toast("Status posted");
              return W.refreshStatus();
            })
            .then(function () {
              W.openStatusList();
            })
            .catch(W.apiErr);
        };
        reader.onerror = function () {
          W.toast("Couldn't read that image");
        };
        reader.readAsDataURL(f);
      });
    }

    var body = W.$("#panelBody");
    if (!body) return;
    body.querySelectorAll(".status-row").forEach(function (row) {
      row.addEventListener("click", function () {
        W.openStatusViewer(parseInt(row.getAttribute("data-idx"), 10));
      });
    });
  };

  /* ---- Fullscreen viewer ---- */

  var curStatus = -1; // index into feed()
  var curItem = 0; // index into status.items
  var progTimer = null;
  var prog = 0; // 0..1 progress of current item
  var ITEM_MS = 5000; // 5s per item
  var TICK_MS = 100;

  function viewer() {
    return W.$("#statusViewer");
  }

  function stopProgress() {
    if (progTimer) {
      clearInterval(progTimer);
      progTimer = null;
    }
  }

  function paintBars() {
    var bars = W.$("#svBars");
    if (!bars) return;
    var s = feed()[curStatus];
    var items = (s && s.items) || [];
    bars.innerHTML = "";
    items.forEach(function (_, i) {
      var bar = W.el("div", "sv-bar");
      var fill = W.el("div", "sv-fill");
      if (i < curItem) fill.style.width = "100%";
      else if (i === curItem) fill.style.width = prog * 100 + "%";
      else fill.style.width = "0%";
      bar.appendChild(fill);
      bars.appendChild(bar);
    });
  }

  function paintCurrent() {
    var s = feed()[curStatus];
    var items = (s && s.items) || [];
    var item = items[curItem] || {};
    var name = W.$("#svName");
    var time = W.$("#svTime");
    var img = W.$("#svImg");
    var cap = W.$("#svCaption");
    if (name) name.textContent = (s && (s.name || s.username)) || "";
    if (time) time.textContent = W.msgTime(item.ts) || "";
    if (img) {
      // Hide the <img> for text-only statuses; the text slide shows instead.
      if (item.imageData) {
        img.style.display = "";
        img.src = item.imageData;
      } else {
        img.style.display = "none";
        img.removeAttribute("src");
      }
    }
    if (cap) cap.textContent = item.imageData ? item.text || "" : "";
    // Header avatar.
    var v = viewer();
    if (v) {
      var old = v.querySelector(".sv-avatar");
      if (old) old.remove();
      var av = W.el("span", "sv-avatar");
      av.innerHTML = W.avatarImg(s ? s.seed || "status-" + curStatus : "status", 40);
      var hdr = v.querySelector(".sv-header");
      if (hdr) hdr.insertBefore(av, hdr.firstChild);
    }
    // Text slide for text-only statuses.
    var stage = v ? v.querySelector(".sv-stage") : null;
    if (stage) {
      var slide = stage.querySelector(".sv-text-slide");
      if (!item.imageData) {
        if (!slide) {
          slide = W.el("div", "sv-text-slide");
          stage.insertBefore(slide, stage.firstChild);
        }
        slide.textContent = item.text || "";
        slide.style.display = "";
      } else if (slide) {
        slide.style.display = "none";
      }
    }
    paintBars();
  }

  function nextItem() {
    var s = feed()[curStatus];
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
    var list = feed();
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
      var items = (feed()[curStatus].items) || [];
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
      if (prog >= 1) {
        prog = 0;
        nextItem();
        return;
      }
      var bars = W.$("#svBars");
      if (bars && bars.children[curItem]) {
        var fill = bars.children[curItem].querySelector(".sv-fill");
        if (fill) fill.style.width = prog * 100 + "%";
      }
    }, TICK_MS);
  }

  /* Find the 1:1 chat with a user by username, for status replies. */
  function findDmChat(username) {
    var chats = W.store.chats || [];
    if (!username) return null;
    for (var i = 0; i < chats.length; i++) {
      var c = chats[i];
      if (c.isGroup) continue;
      var members = c.members || [];
      if (members.indexOf(username) !== -1) return c;
    }
    return null;
  }

  function markFeedViewed() {
    var s = feed()[curStatus];
    if (s && s.items) {
      s.items.forEach(function (it) {
        markItemViewed(it.id);
      });
      W.renderStatusStrip();
    }
  }

  W.openStatusViewer = function (i) {
    var list = feed();
    if (!list.length || i == null || i < 0 || i >= list.length) return;
    var v = viewer();
    if (!v) return;
    bindViewerControls();
    curStatus = i;
    curItem = 0;
    prog = 0;
    v.classList.add("open");
    paintCurrent();
    startProgress();
    markFeedViewed();
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

  /* Viewer controls — bound once, lazily. */
  function bindViewerControls() {
    var close = W.$("#svClose");
    if (close && !close._bound) {
      close._bound = true;
      close.addEventListener("click", W.closeStatusViewer);
    }
    var prev = W.$("#svPrev");
    if (prev && !prev._bound) {
      prev._bound = true;
      prev.addEventListener("click", function (ev) {
        ev.stopPropagation();
        prevItem();
      });
    }
    var next = W.$("#svNext");
    if (next && !next._bound) {
      next._bound = true;
      next.addEventListener("click", function (ev) {
        ev.stopPropagation();
        nextItem();
      });
    }
    var reply = W.$("#svReplyInput");
    if (reply && !reply._bound) {
      reply._bound = true;
      reply.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          var text = reply.value.trim();
          if (!text) return;
          var s = feed()[curStatus];
          var chat = findDmChat(s && s.username);
          if (chat && W.sendMessage) {
            W.sendMessage(chat.id, { text: "Re: status — " + text, kind: "text" });
            if (W.toast) W.toast("Reply sent");
          } else if (W.toast) {
            W.toast("No chat found for this contact");
          }
          reply.value = "";
          W.closeStatusViewer();
        }
        ev.stopPropagation();
      });
      reply.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    }
    var img = W.$("#svImg");
    if (img && !img._bound) {
      img._bound = true;
      // Click left/right halves of the image to go prev/next.
      img.addEventListener("click", function (ev) {
        var r = img.getBoundingClientRect();
        var x = ev.clientX - r.left;
        if (x < r.width / 2) prevItem();
        else nextItem();
      });
    }
  }

  /* Esc hides the viewer (takes precedence over the panel's Esc handler). */
  document.addEventListener(
    "keydown",
    function (ev) {
      if (ev.key === "Escape" && W.isStatusViewerOpen()) {
        ev.stopPropagation();
        W.closeStatusViewer();
      }
    },
    true
  );
})();
