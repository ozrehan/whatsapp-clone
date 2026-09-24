"use strict";
window.W = window.W || {};

// --- Formatting helpers ------------------------------------------------

// Current time as "HH:MM" (24h)
W.nowTime = function () {
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
};

// Epoch-ms timestamp -> "HH:MM"
W.msgTime = function (ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
};

// Epoch-ms timestamp -> chat-list time label (HH:MM / Yesterday / date)
W.listTime = function (ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var now = new Date();
  if (d.toDateString() === now.toDateString()) return W.msgTime(ts);
  var y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  var dd = d.getDate();
  var mm = d.getMonth() + 1;
  return (
    (dd < 10 ? "0" + dd : "" + dd) +
    "/" +
    (mm < 10 ? "0" + mm : "" + mm) +
    "/" +
    d.getFullYear()
  );
};

// Epoch-ms timestamp -> day pill label (TODAY / YESTERDAY / DD/MM/YYYY)
W.dayOf = function (ts) {
  if (!ts) return "TODAY";
  var d = new Date(ts);
  var now = new Date();
  if (d.toDateString() === now.toDateString()) return "TODAY";
  var y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "YESTERDAY";
  var dd = d.getDate();
  var mm = d.getMonth() + 1;
  return (
    (dd < 10 ? "0" + dd : "" + dd) +
    "/" +
    (mm < 10 ? "0" + mm : "" + mm) +
    "/" +
    d.getFullYear()
  );
};

// Double-tick span: grey when sent, blue when read
W.tickHtml = function (read) {
  return '<span class="ticks' + (read ? " blue" : "") + '">✓✓</span>';
};

// Ticks for one message — driven ENTIRELY by the server `tick` field:
//   tick === "sent" -> ✓✓ grey   |   tick === "read" -> ✓✓ blue
//   no tick yet (pending) -> single ✓
W.msgTicks = function (m) {
  if (!m) return "";
  if (m.tick === "read") return W.tickHtml(true);
  if (m.tick === "sent") return W.tickHtml(false);
  return "✓";
};

// Seconds -> "m:ss"
W.fmtDur = function (sec) {
  sec = Math.max(0, Math.round(sec || 0));
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + ":" + (s < 10 ? "0" + s : "" + s);
};

// Day pill label: "today" -> "TODAY"
W.dayLabel = function (d) {
  return String(d || "").toUpperCase();
};
