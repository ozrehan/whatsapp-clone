"use strict";
window.W = window.W || {};

/* =====================================================================
   api.js — HTTP client for the real server API (base /api).
   Auth token is stored in localStorage under "wa_token" and sent as
   `Authorization: Bearer <token>` on every request.

   Any 401 response clears the token, stops pollers and shows the auth
   screen (handled by auth.js, which registers W.showAuth).
   ===================================================================== */

(function () {
  var TOKEN_KEY = "wa_token";

  function storedToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  var api = {
    token: storedToken(),

    setToken: function (t) {
      this.token = t || null;
      try {
        if (this.token) localStorage.setItem(TOKEN_KEY, this.token);
        else localStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    },

    clearToken: function () {
      this.setToken(null);
    },

    /* Low-level request. Resolves with parsed JSON (null on empty body).
       Rejects with an Error carrying .status and .body on HTTP errors. */
    req: function (method, path, body) {
      var self = this;
      var headers = { "Content-Type": "application/json" };
      if (self.token) headers["Authorization"] = "Bearer " + self.token;
      var opts = { method: method, headers: headers };
      if (body !== undefined && body !== null) opts.body = JSON.stringify(body);

      return fetch("/api" + path, opts).then(function (res) {
        if (res.status === 401) {
          // Session dead: log out everywhere, show the auth screen.
          self.clearToken();
          if (W.stopPolling) W.stopPolling();
          if (W.showAuth) W.showAuth();
          var authErr = new Error("Session expired. Please log in again.");
          authErr.status = 401;
          throw authErr;
        }
        return res.text().then(function (txt) {
          var data = null;
          if (txt) {
            try {
              data = JSON.parse(txt);
            } catch (e) {
              data = txt;
            }
          }
          if (!res.ok) {
            var err = new Error(
              (data && (data.error || data.message)) ||
                "Request failed (" + res.status + ")"
            );
            err.status = res.status;
            err.body = data;
            throw err;
          }
          return data;
        });
      });
    },

    get: function (path) {
      return this.req("GET", path);
    },

    post: function (path, body) {
      return this.req("POST", path, body === undefined ? {} : body);
    }
  };

  W.api = api;
})();
