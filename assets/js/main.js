(function () {
  var root = document.documentElement;

  // Theme toggle: explicit choice is stored; otherwise the OS preference applies.
  var btn = document.getElementById("theme-toggle");
  if (btn) btn.addEventListener("click", function () {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  function copy(text, el, done) {
    var ok = function () { var t = el.textContent; el.textContent = done; setTimeout(function () { el.textContent = t; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () {}); else ok();
  }
  document.querySelectorAll("[data-copy-url]").forEach(function (b) {
    b.addEventListener("click", function () { copy(location.href.split("#")[0], b, "Kopyalandı ✓"); });
  });

  // Code blocks: copy button; plain <pre> gets a language class so Prism styles it.
  document.querySelectorAll(".prose pre").forEach(function (pre) {
    var code = pre.querySelector("code");
    if (!code) return;
    if (!/language-/.test(code.className + pre.className)) code.classList.add("language-none");
    var b = document.createElement("button");
    b.type = "button"; b.className = "copy-code"; b.textContent = "Kopyala";
    b.addEventListener("click", function () { copy(code.innerText, b, "Kopyalandı ✓"); });
    pre.appendChild(b);
  });

  // Wide tables scroll horizontally instead of breaking the layout.
  document.querySelectorAll(".prose table").forEach(function (t) {
    if (t.parentElement.classList.contains("table-wrap")) return;
    var w = document.createElement("div"); w.className = "table-wrap";
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });

  // Turkish-aware, accent-insensitive: "ogrenme" matches "Öğrenme", "ingilizce" matches "İngilizce".
  var norm = function (s) { return (s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // Table of contents (posts with `toc: true`): highlight the section in view, filter sections, print.
  var toc = document.querySelector(".toc");
  if (toc) {
    var links = {}, groups = [], cur = null;
    toc.querySelectorAll("nav a").forEach(function (a) { links[decodeURIComponent(a.hash.slice(1))] = a; });
    Array.prototype.forEach.call(document.querySelector(".post-body .prose").children, function (el) {
      if (el.tagName === "H2") groups.push(cur = { h: el, els: [] });
      if (cur) cur.els.push(el);
    });
    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || !links[e.target.id]) return;
          toc.querySelectorAll("a.active").forEach(function (a) { a.classList.remove("active"); });
          links[e.target.id].classList.add("active");
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      groups.forEach(function (g) { spy.observe(g.h); });
    }
    var q = document.getElementById("toc-search"), empty = toc.querySelector(".toc-empty");
    q.addEventListener("input", function () {
      var s = norm(q.value.trim()), any = false;
      groups.forEach(function (g) {
        var hit = !s || g.els.some(function (el) { return norm(el.textContent).indexOf(s) > -1; });
        g.els.forEach(function (el) { el.hidden = !hit; });
        if (links[g.h.id]) links[g.h.id].parentNode.hidden = !hit;
        any = any || hit;
      });
      empty.hidden = any;
    });
    toc.querySelector("[data-print]").addEventListener("click", function () { window.print(); });
  }

  // Search page (client-side over /search.json).
  var input = document.getElementById("search-input");
  if (!input || !window.SEARCH_INDEX) return;
  var list = document.getElementById("search-results"), status = document.getElementById("search-status"), data = null;
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function render() {
    var q = norm(input.value).trim(), terms = q.split(/\s+/).filter(Boolean);
    history.replaceState(null, "", input.value ? "?q=" + encodeURIComponent(input.value) : location.pathname);
    if (!terms.length) { list.innerHTML = ""; status.textContent = data.length + " yazıda arama yapabilirsin."; return; }
    var hits = data.map(function (p) {
      var head = norm(p.t + " " + p.c + " " + p.g), body = norm(p.x + " " + p.b), score = 0;
      for (var i = 0; i < terms.length; i++) {
        if (head.indexOf(terms[i]) > -1) score += 3; else if (body.indexOf(terms[i]) > -1) score += 1; else return null;
      }
      return { p: p, s: score };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s || (a.p.d < b.p.d ? 1 : -1); });
    status.textContent = hits.length ? hits.length + " sonuç bulundu." : "Sonuç bulunamadı. Farklı bir kelime dene.";
    list.innerHTML = hits.slice(0, 50).map(function (h) {
      var p = h.p, ex = p.x || p.b.split(" ").slice(0, 30).join(" ") + "…";
      return '<li><a href="' + p.u + '"><span class="muted">' + esc(p.c || "") + " · " + p.d.split("-").reverse().join(".") +
        "</span><strong>" + esc(p.t) + "</strong><span>" + esc(ex) + "</span></a></li>";
    }).join("");
  }

  input.value = new URLSearchParams(location.search).get("q") || "";
  status.textContent = "Yükleniyor…";
  fetch(window.SEARCH_INDEX).then(function (r) { return r.json(); }).then(function (j) {
    data = j; render(); input.addEventListener("input", render);
  }).catch(function () { status.textContent = "Arama dizini yüklenemedi."; });
  input.form.addEventListener("submit", function (e) { e.preventDefault(); if (data) render(); });
})();
