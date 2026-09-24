"use strict";
window.W = window.W || {};

/* =====================================================================
   infopanel.js — slide-over panel host plus:
     - contact/group info (media from server images, members, mute,
       pin, archive — all persisted via the API)
     - starred messages (GET /api/starred)
     - new chat (user search via /api/users/search, start 1:1 chat)
     - new group (name + member picker, POST /api/chats)
   Expects DOM ids: panelOverlay, panelTitle, panelClose, panelBody.
   ===================================================================== */

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

  function kindLabel(m) {
    if (m.kind === "image") return "📷 Photo";
    if (m.kind === "voice") return "🎤 Voice message";
    return "Message";
  }

  W.openInfo = function (chat) {
    if (!chat) return;
    var members = chat.memberNames || chat.members || [];
    var about = chat.isGroup
      ? "Group · " + members.length + " members"
      : "Hey there! I am using WhatsApp.";
    var muted = !!chat.muted;
    var pinned = !!chat.pinned;
    var archived = !!chat.archived;

    var html = "";
    // Hero.
    html +=
      '<div class="info-hero">' +
      '<img class="avatar" src="' +
      W.avatar(W.chatSeed(chat), 120) +
      '" alt="">' +
      '<div class="info-hero-name">' +
      W.esc(chat.name || "") +
      "</div>" +
      '<div class="info-hero-about">' +
      W.esc(about) +
      "</div>" +
      "</div>";

    // Action row: mute / pin / starred / archive.
    html +=
      '<div class="info-actions">' +
      '<button class="info-action" data-act="mute">' +
      W.icon(muted ? "bell-off" : "bell", "ic") +
      "<span>" +
      (muted ? "Unmute" : "Mute") +
      "</span></button>" +
      '<button class="info-action" data-act="pin">' +
      W.icon("pin", "ic") +
      "<span>" +
      (pinned ? "Unpin" : "Pin") +
      "</span></button>" +
      '<button class="info-action" data-act="starred">' +
      W.icon("star", "ic") +
      "<span>Starred</span></button>" +
      '<button class="info-action" data-act="archive">' +
      W.icon("archive", "ic") +
      "<span>" +
      (archived ? "Unarchive" : "Archive") +
      "</span></button>" +
      "</div>";

    // Media: real shared images from the server.
    var imgs = (W.getMessages(chat.id) || []).filter(function (m) {
      return m.kind === "image" && m.data;
    });
    html +=
      '<div class="info-section"><div class="info-section-title">Media, links and docs</div>';
    if (imgs.length) {
      html += '<div class="media-grid">';
      imgs.slice(0, 9).forEach(function (m) {
        html +=
          '<button class="media-thumb" data-mid="' +
          W.esc(m.id) +
          '"><img src="' +
          W.esc(m.data) +
          '" alt="" loading="lazy"></button>';
      });
      html += "</div>";
    } else {
      html += '<div class="media-empty">No media shared yet.</div>';
    }
    html += "</div>";

    // Members for groups.
    if (chat.isGroup && members.length) {
      html +=
        '<div class="info-section"><div class="info-section-title">Members · ' +
        members.length +
        "</div>";
      var me = W.myUsername ? W.myUsername() : null;
      members.forEach(function (p, idx) {
        var pname = typeof p === "string" ? p : p.name || "";
        var puname = typeof p === "string" ? p : p.username || p.name || "";
        html +=
          '<div class="member-row">' +
          '<img class="avatar" src="' +
          W.avatar("user-" + puname, 40) +
          '" alt="">' +
          '<div class="m-body"><div class="m-name">' +
          W.esc(pname) +
          "</div></div>" +
          (idx === 0 ? '<span class="admin-tag">Admin</span>' : "") +
          (me && puname === me ? '<span class="admin-tag you-tag">You</span>' : "") +
          "</div>";
      });
      html += "</div>";
    }

    // Settings rows.
    html +=
      '<div class="info-section">' +
      '<button class="info-row" data-act="mute-row">' +
      "<span>Mute notifications</span>" +
      '<span class="toggle' +
      (muted ? " on" : "") +
      '"><span class="knob"></span></span>' +
      "</button>" +
      '<button class="info-row" data-act="archive-row">' +
      "<span>Archive chat</span>" +
      '<span class="toggle' +
      (archived ? " on" : "") +
      '"><span class="knob"></span></span>' +
      "</button>" +
      '<button class="info-row" data-act="starred">' +
      "<span>Starred messages</span>" +
      W.icon("chevron-right", "ic dim") +
      "</button>" +
      "</div>";

    W.openPanel(chat.isGroup ? "Group info" : "Contact info", html);

    var body = W.$("#panelBody");
    if (!body) return;

    body.querySelectorAll("[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.getAttribute("data-act");
        if (act === "mute" || act === "mute-row") {
          if (W.toggleMute) W.toggleMute(chat);
          setTimeout(function () {
            if (W.getChat(chat.id)) W.openInfo(W.getChat(chat.id));
          }, 350);
        } else if (act === "pin") {
          if (W.togglePin) W.togglePin(chat);
          setTimeout(function () {
            if (W.getChat(chat.id)) W.openInfo(W.getChat(chat.id));
          }, 350);
        } else if (act === "archive" || act === "archive-row") {
          if (W.toggleArchive) W.toggleArchive(chat);
          setTimeout(function () {
            if (W.getChat(chat.id)) W.openInfo(W.getChat(chat.id));
          }, 350);
        } else if (act === "starred") {
          if (W.openStarred) W.openStarred();
        }
      });
    });

    body.querySelectorAll(".media-thumb").forEach(function (th) {
      th.addEventListener("click", function () {
        var m = W.findMessage(chat.id, th.getAttribute("data-mid"));
        if (m && m.data && W.openLightbox) W.openLightbox(m.data, m.text || "");
      });
    });
  };

  /* ---- Starred messages (GET /api/starred) ---- */

  W.openStarred = function () {
    W.openPanel("Starred messages", '<div class="empty-note">Loading…</div>');
    W.api
      .get("/starred")
      .then(function (r) {
        var list = (r && r.messages) || [];
        var html = "";
        if (!list.length) {
          html =
            '<div class="empty-note">No starred messages yet.<br>' +
            "Hover a message and tap the star to keep it here.</div>";
        } else {
          list.forEach(function (s, i) {
            var txt =
              s.text ||
              (s.kind === "image"
                ? "📷 Photo"
                : s.kind === "voice"
                ? "🎤 Voice message"
                : "");
            html +=
              '<button class="starred-row" data-idx="' +
              i +
              '">' +
              '<div class="starred-chat">' +
              W.esc(s.chatName || "") +
              "</div>" +
              '<div class="starred-text">' +
              W.esc(txt) +
              "</div>" +
              '<div class="starred-time">' +
              W.esc(W.msgTime(s.ts)) +
              "</div>" +
              "</button>";
          });
        }
        W.openPanel("Starred messages", html);
        var body = W.$("#panelBody");
        if (!body) return;
        body.querySelectorAll(".starred-row").forEach(function (row) {
          row.addEventListener("click", function () {
            var s = list[parseInt(row.getAttribute("data-idx"), 10)];
            if (!s || !s.chatId || !W.openChat) return;
            W.closePanel();
            W.openChat(s.chatId);
            // Scroll the starred message into view after the chat renders.
            var mid = s.id;
            if (mid) {
              setTimeout(function () {
                var node = document.querySelector('[data-mid="' + mid + '"]');
                if (node) {
                  node.scrollIntoView({ behavior: "smooth", block: "center" });
                  node.classList.add("flash");
                  setTimeout(function () {
                    node.classList.remove("flash");
                  }, 1200);
                }
              }, 600);
            }
          });
        });
      })
      .catch(function (e) {
        W.openPanel(
          "Starred messages",
          '<div class="empty-note">Couldn\'t load starred messages.</div>'
        );
        W.apiErr(e);
      });
  };

  /* ---- New chat: search users, start a 1:1 chat ---- */

  var ncTimer = null;

  function userRow(u) {
    return (
      '<button class="chat-row nc-user" data-username="' +
      W.esc(u.username) +
      '">' +
      '<img class="avatar lg" src="' +
      W.avatar("user-" + u.username, 100) +
      '" alt="">' +
      '<div class="chat-row-main"><div class="chat-row-top">' +
      '<span class="chat-name">' +
      W.esc(u.name || u.username) +
      '</span></div>' +
      '<div class="chat-row-sub">@' +
      W.esc(u.username) +
      "</div></div></button>"
    );
  }

  W.openNewChat = function () {
    var html =
      '<div class="nc-wrap">' +
      '<button class="info-row nc-group-btn" id="ncGroupBtn">' +
      W.icon("newchat", "ic") +
      "<span>New group</span>" +
      W.icon("chevron-right", "ic dim") +
      "</button>" +
      '<div class="info-section-title nc-label">Search users</div>' +
      '<div class="search-box nc-search">' +
      W.icon("search", "ic search-ic") +
      '<input id="ncSearch" type="text" placeholder="Search by name or username" autocomplete="off">' +
      "</div>" +
      '<div class="newchat-list" id="ncResults">' +
      '<div class="empty-note">Type to search everyone on WhatsApp.</div>' +
      "</div>" +
      "</div>";

    W.openPanel("New chat", html);

    var input = W.$("#ncSearch");
    var results = W.$("#ncResults");
    var groupBtn = W.$("#ncGroupBtn");
    if (groupBtn)
      groupBtn.addEventListener("click", function () {
        W.openGroupCreate();
      });
    if (!input || !results) return;

    input.addEventListener("input", function () {
      if (ncTimer) clearTimeout(ncTimer);
      var q = input.value.trim();
      if (!q) {
        results.innerHTML =
          '<div class="empty-note">Type to search everyone on WhatsApp.</div>';
        return;
      }
      ncTimer = setTimeout(function () {
        results.innerHTML = '<div class="empty-note">Searching…</div>';
        W.api
          .get("/users/search?q=" + encodeURIComponent(q))
          .then(function (users) {
            users = (users && users.users) || [];
            if (!users.length) {
              results.innerHTML =
                '<div class="empty-note">No users found for "' +
                W.esc(q) +
                '".</div>';
              return;
            }
            results.innerHTML = users.map(userRow).join("");
            results.querySelectorAll(".nc-user").forEach(function (row) {
              row.addEventListener("click", function () {
                var username = row.getAttribute("data-username");
                W.api
                  .post("/chats", { username: username })
                  .then(function (r) {
                    var chat = r && r.chat;
                    W.closePanel();
                    if (W.refreshChatList) W.refreshChatList();
                    if (chat && W.openChat) W.openChat(chat.id);
                  })
                  .catch(W.apiErr);
              });
            });
          })
          .catch(function (e) {
            results.innerHTML =
              '<div class="empty-note">Search failed. Try again.</div>';
            W.apiErr(e);
          });
      }, 300);
    });
    input.focus();
  };

  /* ---- New group: name + member picker ---- */

  W.openGroupCreate = function () {
    var selected = []; // [{username,name}]

    var html =
      '<div class="nc-wrap">' +
      '<div class="info-section-title nc-label">Group name</div>' +
      '<div class="search-box nc-search">' +
      '<input id="gcName" type="text" placeholder="Group subject" maxlength="60" autocomplete="off">' +
      "</div>" +
      '<div class="info-section-title nc-label">Add members</div>' +
      '<div class="search-box nc-search">' +
      W.icon("search", "ic search-ic") +
      '<input id="gcSearch" type="text" placeholder="Search users" autocomplete="off">' +
      "</div>" +
      '<div class="nc-chips" id="gcChips"></div>' +
      '<div class="newchat-list" id="gcResults">' +
      '<div class="empty-note">Search and tap users to add them.</div>' +
      "</div>" +
      '<button class="auth-btn nc-create" id="gcCreate">Create group</button>' +
      "</div>";

    W.openPanel("New group", html);

    var nameInput = W.$("#gcName");
    var searchInput = W.$("#gcSearch");
    var results = W.$("#gcResults");
    var chips = W.$("#gcChips");
    var createBtn = W.$("#gcCreate");

    function renderChips() {
      chips.innerHTML = selected
        .map(function (u, i) {
          return (
            '<span class="nc-chip" data-i="' +
            i +
            '">' +
            W.esc(u.name || u.username) +
            ' <b data-x="' +
            i +
            '">×</b></span>'
          );
        })
        .join("");
      chips.querySelectorAll("[data-x]").forEach(function (x) {
        x.addEventListener("click", function (ev) {
          ev.stopPropagation();
          selected.splice(parseInt(x.getAttribute("data-x"), 10), 1);
          renderChips();
        });
      });
    }

    var gTimer = null;
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (gTimer) clearTimeout(gTimer);
        var q = searchInput.value.trim();
        if (!q) {
          results.innerHTML =
            '<div class="empty-note">Search and tap users to add them.</div>';
          return;
        }
        gTimer = setTimeout(function () {
          W.api
            .get("/users/search?q=" + encodeURIComponent(q))
            .then(function (users) {
              users = (users && users.users) || [];
              var avail = users.filter(function (u) {
                return !selected.some(function (s) {
                  return s.username === u.username;
                });
              });
              results.innerHTML = avail.length
                ? avail.map(userRow).join("")
                : '<div class="empty-note">No more users found.</div>';
              results.querySelectorAll(".nc-user").forEach(function (row) {
                row.addEventListener("click", function () {
                  var username = row.getAttribute("data-username");
                  var found = avail.filter(function (u) {
                    return u.username === username;
                  })[0];
                  if (found) {
                    selected.push({
                      username: found.username,
                      name: found.name
                    });
                    renderChips();
                    row.style.display = "none";
                  }
                });
              });
            })
            .catch(W.apiErr);
        }, 300);
      });
    }

    if (createBtn) {
      createBtn.addEventListener("click", function () {
        var name = nameInput ? nameInput.value.trim() : "";
        if (!name) {
          W.toast("Enter a group name");
          return;
        }
        if (!selected.length) {
          W.toast("Add at least one member");
          return;
        }
        createBtn.disabled = true;
        W.api
          .post("/chats", {
            name: name,
            members: selected.map(function (u) {
              return u.username;
            })
          })
          .then(function (r) {
            var chat = r && r.chat;
            W.closePanel();
            if (W.refreshChatList) W.refreshChatList();
            if (chat && W.openChat) W.openChat(chat.id);
          })
          .catch(function (e) {
            createBtn.disabled = false;
            W.apiErr(e);
          });
      });
    }
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
