"use strict";
window.W = window.W || {};

// --- Basic DOM helpers -------------------------------------------------

// Get element by id (leading '#' is optional)
W.$ = function (id) {
  if (typeof id === "string" && id.charAt(0) === "#") id = id.slice(1);
  return document.getElementById(id);
};

// Create an element with an optional className and innerHTML
W.el = function (tag, cls, html) {
  var d = document.createElement(tag);
  if (cls) d.className = cls;
  if (html != null) d.innerHTML = html;
  return d;
};

// HTML-escape a string so user/bot text can be safely injected
W.esc = function (s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// SVG icon from the shared sprite: W.icon('pin') -> <svg ...><use .../></svg>
W.icon = function (name, cls) {
  return '<svg class="ic ' + (cls || "") + '"><use href="assets/icons.svg#' + name + '"></use></svg>';
};

// Avatar placeholder URL keyed by a seed string
W.avatar = function (seed, size) {
  return "https://picsum.photos/seed/" + seed + "/" + (size || 100);
};

// Avatar <img> tag (for innerHTML contexts)
W.avatarImg = function (seed, size, cls) {
  return '<img class="avatar ' + (cls || "") + '" src="' + W.avatar(seed, size) + '" alt="">';
};

// Short unique message id
W.uid = function () {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

// Toast notification, visible for 2 seconds (no-op if #toast is missing)
W.toast = function (msg) {
  var t = W.$("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(W._toastTimer);
  W._toastTimer = setTimeout(function () {
    t.classList.remove("show");
  }, 2000);
};
