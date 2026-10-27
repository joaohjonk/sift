/* Sift · mark motion v3 (JJ, 29.09.26: keep the motion, lose the passing line, everything a little slower)
   Beats: 0.0 s plate · 0.4 to 2.7 s the search (holes flicker on, a few at a time) · 2.7 to 3.5 s the settle (the holes inside SIFT light up one by one, the rest stay dark)
          · 3.5 to 4.0 s hold · 4.0 to 4.8 s the mark (lit holes swell and close into solid Helvetica Bold; the plate fades). Total 5.1 s.
   Usage: SiftMark(canvas, { onDone, ambient }) → { play(), end() }
   ambient: true (the hero sieve) stops before the solid mark and keeps searching: SIFT stays lit in the plate while stray holes keep flickering. */
(function (g) {
  'use strict';
  var FONT = '"Helvetica Neue", Helvetica, Heros, Arial, sans-serif', RED = '#E8251A';
  function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  function SiftMark(cv, opt) {
    opt = opt || {}; var cx = cv.getContext('2d'), S, N = 25, cell, holes = [], raf = null, t0 = 0, done = false;
    var reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function word(ctx, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.font = '700 ' + (S * 0.392) + 'px ' + FONT; ctx.textBaseline = 'alphabetic';
      var w = ctx.measureText('SIFT').width, k = (S * 0.92) / w; ctx.translate(S * 0.04, S * 0.95); ctx.scale(k, 1); ctx.fillText('SIFT', 0, 0); ctx.restore(); }
    function setup() {
      var dpr = Math.min(2, g.devicePixelRatio || 1), r = cv.getBoundingClientRect(); S = Math.round(r.width) || cv.width;
      cv.width = S * dpr; cv.height = S * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cell = S / N;
      var o = document.createElement('canvas'); o.width = S; o.height = S; var oc = o.getContext('2d'); word(oc, 1); var d = oc.getImageData(0, 0, S, S).data;
      var seed = 9; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      holes = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var px = (x + .5) * cell, py = (y + .5) * cell, i = (Math.floor(py) * S + Math.floor(px)) * 4;
        holes.push({ x: px, y: py, word: d[i + 3] > 110, on: 0.4 + rnd() * 2.0, len: 0.18 + rnd() * 0.45, again: rnd() < 0.35 ? 0.4 + rnd() * 1.5 : -1, d: rnd() }); } }
    function frame(t) { // t in seconds
      cx.fillStyle = RED; cx.fillRect(0, 0, S, S);
      var r0 = cell * 0.26, solid = ease((t - 4.0) / 0.8);
      for (var i = 0; i < holes.length; i++) { var h = holes[i], lit = 0;
        if (t < 2.7) { var a = t - h.on; lit = a > 0 && a < h.len ? Math.sin(a / h.len * Math.PI) : 0;
          if (h.again > 0) { var b = t - h.on - h.again; if (b > 0 && b < h.len) lit = Math.max(lit, Math.sin(b / h.len * Math.PI)); } }
        else if (t < 3.5) { lit = h.word ? ease((t - 2.7 - h.d * 0.55) / 0.25) : 0; }
        else lit = h.word ? 1 : 0;
        var rr = r0;
        if (h.word && t >= 4.0) rr = r0 + (cell * 0.62 - r0) * solid;
        cx.globalAlpha = 1 - solid; cx.fillStyle = 'rgba(0,0,0,.16)'; if (!(h.word && lit >= 1)) { cx.beginPath(); cx.arc(h.x, h.y, r0, 0, Math.PI * 2); cx.fill(); }
        if (lit > 0) { cx.globalAlpha = (h.word && t >= 4.0) ? 1 - solid : lit; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(h.x, h.y, rr, 0, Math.PI * 2); cx.fill(); } }
      cx.globalAlpha = 1; if (t >= 4.0) word(cx, solid); }
    function amb(t) { // after the settle: SIFT lit, the rest of the plate keeps searching, slowly
      cx.fillStyle = RED; cx.fillRect(0, 0, S, S); var r0 = cell * 0.26;
      for (var i = 0; i < holes.length; i++) { var h = holes[i], lit = 0;
        if (h.word) lit = 1; else { var per = 7 + h.d * 9, ph = ((t + h.on * 3.1) % per) / per; lit = ph < 0.06 ? Math.sin(ph / 0.06 * Math.PI) * 0.9 : 0; }
        cx.globalAlpha = 1; cx.fillStyle = 'rgba(0,0,0,.16)'; if (lit < 1) { cx.beginPath(); cx.arc(h.x, h.y, r0, 0, Math.PI * 2); cx.fill(); }
        if (lit > 0) { cx.globalAlpha = lit; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(h.x, h.y, r0, 0, Math.PI * 2); cx.fill(); } }
      cx.globalAlpha = 1; }
    function loop(ts) { if (!t0) t0 = ts; var t = (ts - t0) / 1000;
      if (opt.ambient && t >= 3.5) { if (!done) { done = true; if (opt.onDone) opt.onDone(); } amb(t); raf = requestAnimationFrame(loop); return; }
      frame(t); if (t < 5.1) raf = requestAnimationFrame(loop); else end(); }
    function play() { cancelAnimationFrame(raf); setup(); done = false; t0 = 0; if (reduce) { end(); return; } raf = requestAnimationFrame(loop); }
    function end() { cancelAnimationFrame(raf); if (!S) setup(); if (opt.ambient) amb(0); else frame(6); if (!done) { done = true; if (opt.onDone) opt.onDone(); } }
    return { play: play, end: end, at: function (t) { if (!S) setup(); frame(t); } };
  }
  g.SiftMark = SiftMark;
})(window);
