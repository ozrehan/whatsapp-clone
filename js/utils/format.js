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

// Double-tick span: grey when sent, blue when read
W.tickHtml = function (read) {
  return '<span class="ticks' + (read ? " blue" : "") + '">✓✓</span>';
};

// Ticks for one message:
//   ✓ single       -> not yet sent
//   ✓✓ grey        -> sent, not read
//   ✓✓ blue        -> read
W.msgTicks = function (m) {
  if (!m.sent) return "✓";
  return W.tickHtml(!!m.read);
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
