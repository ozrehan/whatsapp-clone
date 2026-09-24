"use strict";
window.W = window.W || {};

/* settings.js — settings panel: profile (avatar seed cycler + name),
   notification toggles, and chat wallpaper picker.
   W.applyWallpaper(key) is safe to call at boot (app.js guards its
   presence); it also re-rings the selected wallpaper option when the
   settings panel is open. */

(function () {

  var WALLPAPERS = [
    { key: "doodle", label: "Doodle" },
    { key: "dark", label: "Dark" },
    { key: "waves", label: "Waves" },
    { key: "grid", label: "Grid" }
  ];

  var SETTING_ROWS = [
    { key: "notifications", label: "Notifications", desc: "Show new message notifications" },
    { key: "sounds", label: "Sounds", desc: "Play sounds for incoming messages" },
    { key: "messagePreview", label: "Message preview", desc: "Show message text in notifications" }
  ];

  var avatarCycle = 1; // cycles rehan-self-N

  function profile() {
    if (W.store && !W.store.profile) W.store.profile = {};
    return (W.store && W.store.profile) || {};
  }

  function settings() {
    if (W.store && !W.store.settings) W.store.settings = {};
    return (W.store && W.store.settings) || {};
  }

  W.applyWallpaper = function (key) {
    var pane = document.getElementById("mainPane");
    if (pane) pane.dataset.wallpaper = key || "doodle";
    if (W.store) W.store.wallpaper = key || "doodle";
    // Update selected ring if the settings panel is currently open.
    var opts = document.querySelectorAll(".wp-option");
    opts.forEach(function (o) {
      o.classList.toggle("selected", o.getAttribute("data-wp") === key);
    });
  };

  W.openSettings = function () {
    if (!W.openPanel) return;
    var p = profile();
    var s = settings();
    var seed = p.seed || ("rehan-self-" + avatarCycle);
    var name = p.name || "You";
    var currentWp = (W.store && W.store.wallpaper) || "doodle";

    var html = "";
    // Profile row.
    html += '<div class="settings-profile">' +
      '<button class="settings-avatar" id="settingsAvatar" title="Change avatar">' +
        W.avatarImg(seed, 80) + "</button>" +
      '<div class="settings-profile-meta">' +
        '<label class="settings-label">Your name</label>' +
        '<input id="settingsName" class="settings-name-input" type="text" maxlength="40" value="' +
          W.esc(name) + '">' +
      "</div></div>";

    // Notification toggles.
    html += '<div class="info-section"><div class="info-section-title">Notifications</div>';
    SETTING_ROWS.forEach(function (row) {
      var on = s[row.key] !== false; // default on
      html += '<button class="info-row setting-row" data-setting="' + row.key + '">' +
        '<span class="setting-text"><span class="setting-label-main">' + W.esc(row.label) + "</span>" +
        '<span class="setting-desc">' + W.esc(row.desc) + "</span></span>" +
        '<span class="toggle' + (on ? " on" : "") + '"><span class="knob"></span></span>' +
        "</button>";
    });
    html += "</div>";

    // Wallpaper picker.
    html += '<div class="info-section"><div class="info-section-title">Chat wallpaper</div>';
    html += '<div class="wallpaper-grid">';
    WALLPAPERS.forEach(function (wp) {
      html += '<button class="wp-option wp-' + wp.key +
        (wp.key === currentWp ? " selected" : "") +
        '" data-wp="' + wp.key + '"><span class="wp-label">' +
        W.esc(wp.label) + "</span></button>";
    });
    html += "</div></div>";

    W.openPanel("Settings", html);

    // Avatar click → cycle seed 'rehan-self-N'.
    var avBtn = W.$("#settingsAvatar");
    if (avBtn) {
      avBtn.addEventListener("click", function () {
        avatarCycle = (avatarCycle % 9) + 1;
        var ns = "rehan-self-" + avatarCycle;
        var prof = profile();
        prof.seed = ns;
        avBtn.innerHTML = W.avatarImg(ns, 80);
        // Keep the sidebar header avatar in sync.
        var side = W.$("#sideAvatar");
        if (side) side.innerHTML = W.avatarImg(ns, 40);
      });
    }

    // Name input → store + sidebar header name.
    var nameInput = W.$("#settingsName");
    if (nameInput) {
      var commitName = function () {
        var v = nameInput.value.trim() || "You";
        profile().name = v;
        var sideName = W.$("#sideName");
        if (sideName) sideName.textContent = v;
      };
      nameInput.addEventListener("change", commitName);
      nameInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { nameInput.blur(); }
        ev.stopPropagation(); // don't trigger global shortcuts while typing
      });
    }

    // Setting toggles.
    var body = W.$("#panelBody");
    if (body) {
      body.querySelectorAll(".setting-row").forEach(function (row) {
        row.addEventListener("click", function () {
          var key = row.getAttribute("data-setting");
          var st = settings();
          var now = st[key] !== false;
          st[key] = !now;
          var tgl = row.querySelector(".toggle");
          if (tgl) tgl.classList.toggle("on", !now);
        });
      });
      // Wallpaper options.
      body.querySelectorAll(".wp-option").forEach(function (opt) {
        opt.addEventListener("click", function () {
          W.applyWallpaper(opt.getAttribute("data-wp"));
        });
      });
    }
  };

})();
