"use strict";
window.W = window.W || {};

/* =====================================================================
   auth.js — login / sign-up screen, styled like WhatsApp (dark #0b141a,
   #00a884 accents). Shown when there is no token in localStorage.
   On success the token is stored and W.boot() starts the real app.
   ===================================================================== */

(function () {

  var MODE = "login"; // "login" | "signup"
  var built = false;

  function build() {
    if (built) return;
    built = true;

    var screen = W.el("div", "auth-screen");
    screen.id = "authScreen";
    screen.innerHTML =
      '<div class="auth-phone">' +
        '<div class="auth-brand">' +
          '<span class="auth-logo">' + W.icon("newchat") + "</span>" +
          '<div class="auth-brand-name">WhatsApp</div>' +
          '<div class="auth-brand-sub">Real-time messaging</div>' +
        "</div>" +
        '<div class="auth-tabs">' +
          '<button class="auth-tab active" data-mode="login">Log in</button>' +
          '<button class="auth-tab" data-mode="signup">Sign up</button>' +
        "</div>" +
        '<form class="auth-form" id="authForm" autocomplete="off">' +
          '<div class="auth-field" id="authNameField" style="display:none">' +
            "<label>Display name</label>" +
            '<input id="authName" type="text" maxlength="40" placeholder="Your name" autocomplete="off">' +
          "</div>" +
          '<div class="auth-field">' +
            "<label>Username</label>" +
            '<input id="authUser" type="text" maxlength="32" placeholder="username" autocomplete="username">' +
          "</div>" +
          '<div class="auth-field">' +
            "<label>Password</label>" +
            '<input id="authPass" type="password" maxlength="128" placeholder="••••••••" autocomplete="current-password">' +
          "</div>" +
          '<div class="auth-error" id="authError"></div>' +
          '<button class="auth-btn" id="authSubmit" type="submit">Log in</button>' +
        "</form>" +
        '<div class="auth-note">Your chats sync from the server once you sign in.</div>' +
      "</div>";

    document.body.appendChild(screen);

    // Tab switching.
    screen.querySelectorAll(".auth-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        MODE = tab.getAttribute("data-mode");
        screen.querySelectorAll(".auth-tab").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
        var nameField = W.$("#authNameField");
        var submit = W.$("#authSubmit");
        if (nameField) nameField.style.display = MODE === "signup" ? "" : "none";
        if (submit) submit.textContent = MODE === "signup" ? "Sign up" : "Log in";
        setError("");
      });
    });

    // Submit.
    var form = W.$("#authForm");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        doAuth();
      });
    }
  }

  function setError(msg) {
    var e = W.$("#authError");
    if (e) {
      e.textContent = msg || "";
      e.style.display = msg ? "" : "none";
    }
  }

  function doAuth() {
    var username = (W.$("#authUser") || {}).value || "";
    var password = (W.$("#authPass") || {}).value || "";
    var name = (W.$("#authName") || {}).value || "";
    username = username.trim();
    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }
    var submit = W.$("#authSubmit");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Please wait…";
    }
    setError("");

    var path = MODE === "signup" ? "/auth/signup" : "/auth/login";
    var body =
      MODE === "signup"
        ? { username: username, password: password, name: name.trim() || username }
        : { username: username, password: password };

    W.api
      .post(path, body)
      .then(function (r) {
        if (!r || !r.token) throw new Error("Bad response from server");
        W.api.setToken(r.token);
        hide();
        if (W.boot) W.boot();
        if (W.toast) W.toast("Welcome" + (r.user && r.user.name ? ", " + r.user.name : "") + "!");
      })
      .catch(function (e) {
        if (submit) {
          submit.disabled = false;
          submit.textContent = MODE === "signup" ? "Sign up" : "Log in";
        }
        var msg = (e && e.message) || "Something went wrong";
        if (e && e.status === 401) msg = "Invalid username or password.";
        if (e && e.status === 409) msg = "That username is taken.";
        setError(msg);
      });
  }

  function hide() {
    var screen = W.$("#authScreen");
    if (screen) screen.classList.remove("open");
  }

  /* Show the auth screen (hides the app behind it). Idempotent. */
  W.showAuth = function () {
    build();
    var screen = W.$("#authScreen");
    if (screen) screen.classList.add("open");
    // Reset any half-booted state.
    if (W.stopPolling) W.stopPolling();
    W.store.active = null;
    var conv = W.$("convView");
    var empty = W.$("emptyState");
    if (conv) conv.style.display = "none";
    if (empty) empty.style.display = "";
    document.body.classList.remove("chat-open");
    if (W.closePanel) W.closePanel();
  };

  /* Log out: clear token + server state, stop pollers, show auth. */
  W.logout = function () {
    if (W.stopPolling) W.stopPolling();
    if (W.api) W.api.clearToken();
    W.store.active = null;
    W.store.profile = null;
    W.store.chats = [];
    W.store.messages = {};
    W.store.typing = {};
    W.store.statusFeed = [];
    W.store.replyTo = null;
    if (W.closePanel) W.closePanel();
    if (W.closeChat) W.closeChat();
    if (W.renderChatList) W.renderChatList();
    W.showAuth();
    if (W.toast) W.toast("Logged out");
  };

  // Enter key inside any auth input submits (form does this natively).
})();
