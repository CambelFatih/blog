/* Vardiya takvimi ve izin planlayıcı. #vardiya-app içine kurulur, bağımlılığı yok.
   Günler UTC gün numarası (Date.UTC / 864e5) olarak tutulur; yaz saati kaymalarından etkilenmez. */
(function () {
  "use strict";
  var app = document.getElementById("vardiya-app");
  if (!app) return;

  // Gün tipleri. D: 12 saatlik gündüz ya da normal mesai, N: 24 saatlik nöbet, O: off.
  var TYPES = {
    S: { name: "Sabah", code: "SAB" },
    A: { name: "Akşam", code: "AKŞ" },
    G: { name: "Gece", code: "GEC" },
    D: { name: "Gündüz", code: "GÜN" },
    N: { name: "Nöbet", code: "NÖB" },
    O: { name: "Off", code: "OFF" }
  };
  var NONE = { name: "", code: "" };
  var T = function (c) { return TYPES[c] || NONE; };
  var PRESETS = [
    ["SSAAGGOO", "2+2+2 · 2 Sabah, 2 Akşam, 2 Gece, 2 Off"],
    ["DDGGOO", "2+2+2 · 2 Gündüz, 2 Gece, 2 Off"],
    ["DDGGOOOO", "2+2+4 · 2 Gündüz, 2 Gece, 4 Off"],
    ["SSSAAAGGGOOO", "3+3+3 · 3 Sabah, 3 Akşam, 3 Gece, 3 Off"],
    ["SSSSSOOAAAAAOOGGGGGOO", "Haftalık · 5 Sabah, 5 Akşam, 5 Gece, araya 2 Off"],
    ["DGOO", "12/24–12/48 · Gündüz, Gece, 2 Off"],
    ["DDDDOOOO", "4+4 · 4 Gündüz, 4 Off"],
    ["DO", "12/36 · 1 Gündüz, 1 Off"],
    ["NOO", "24/48 · 1 Nöbet, 2 Off"],
    ["NOOO", "24/72 · 1 Nöbet, 3 Off"],
    ["DDDDDDO", "6+1 · 6 Gündüz, 1 Off"],
    ["DDDDDOO", "5+2 · 5 Gündüz, 2 Off"]
  ];
  var DAY = 864e5, KEY = "vardiya-planlayici", MAX_CYCLE = 60;

  var F = function (o) { o.timeZone = "UTC"; return new Intl.DateTimeFormat("tr-TR", o); };
  var FL = F({ day: "numeric", month: "long", year: "numeric", weekday: "long" });
  var FS = F({ day: "numeric", month: "short", weekday: "short" });
  var FM = F({ month: "long", year: "numeric" });
  var longD = function (i) { return FL.format(i * DAY); };
  var shortD = function (i) { return FS.format(i * DAY); };
  var iso = function (i) { return new Date(i * DAY).toISOString().slice(0, 10); };
  var mod = function (a, n) { return ((a % n) + n) % n; };
  var monthOf = function (i) { var d = new Date(i * DAY); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
  // "YYYY-MM-DD" → gün numarası; geçersiz ya da yazılmakta olan (yıl 0002 gibi) tarihler NaN.
  function idx(s) {
    if (!/^(19|20|21)\d\d-\d\d-\d\d$/.test(s || "")) return NaN;
    var i = Date.parse(s) / DAY;
    return i === Math.floor(i) && iso(i) === s ? i : NaN;
  }
  var t0 = (function () { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY; })();

  // Durum: p döngü, r referans tarih, k o gün döngünün kaçıncı günü (0'dan), s/e izin aralığı,
  // n öneri için izin günü, h öneri ufku (gün), v gösterilen ay sayısı.
  var S = { p: "SSAAGGOO", r: iso(t0), k: 0, s: iso(t0 + 9), e: iso(t0 + 15), n: 6, h: 365, v: matchMedia("(max-width: 640px)").matches ? 1 : 3 };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) Object.keys(S).forEach(function (k) { if (k in saved) S[k] = saved[k]; }); } catch (e) {}
  var q = new URLSearchParams(location.hash.slice(1));
  if (q.has("p")) {
    ["p", "r", "k", "s", "e"].forEach(function (k) { if (q.has(k)) S[k] = q.get(k); });
    history.replaceState(null, "", location.pathname + location.search);
  }
  S.p = /^[SAGDNO]{0,60}$/.test(S.p) ? S.p : "SSAAGGOO";
  if (isNaN(idx(S.r))) S.r = iso(t0);
  S.k = Math.min(Math.max(parseInt(S.k, 10) || 0, 0), Math.max(S.p.length - 1, 0));
  if (isNaN(idx(S.s))) S.s = "";
  if (isNaN(idx(S.e))) S.e = S.s;
  S.n = Math.min(Math.max(parseInt(S.n, 10) || 6, 1), 60);
  S.h = [90, 180, 365].indexOf(+S.h) > -1 ? +S.h : 365;
  S.v = [1, 3, 6, 12].indexOf(+S.v) > -1 ? +S.v : 3;

  var ref = 0, pick = null, lastP = null, cur = monthOf(t0);
  var typeAt = function (i) { return S.p.charAt(mod(i - ref + S.k, S.p.length)); };
  var isOff = function (i) { return typeAt(i) === "O"; };
  var hasWork = function () { return /[^O]/.test(S.p); };

  app.innerHTML =
    '<div class="vp-shell">' +
      '<div class="vp-panel">' +
        '<section class="vp-step">' +
          '<h3 class="vp-h"><span class="vp-num">1</span>Vardiya sistemin</h3>' +
          '<label class="vp-label" for="vp-preset">Hazır sistemler</label>' +
          '<select class="vp-input" id="vp-preset">' +
            PRESETS.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + "</option>"; }).join("") +
            '<option value="">Özel döngü</option>' +
          "</select>" +
          '<p class="vp-label vp-gap">Döngü <span class="vp-cycle-info" data-el="info"></span></p>' +
          '<div class="vp-seq" data-el="seq"></div>' +
          '<div class="vp-add" role="group" aria-label="Döngünün sonuna gün ekle">' +
            "SAGDNO".split("").map(function (c) { return '<button type="button" data-add="' + c + '"><i class="vp-dot t-' + c + '"></i>' + TYPES[c].name + "</button>"; }).join("") +
          "</div>" +
          '<p class="vp-hint vp-gap">Kendi düzenin listede yoksa günleri sırayla ekle; bir günü çıkarmak için üstüne tıkla. <button type="button" class="vp-link" data-clear>Döngüyü temizle</button></p>' +
        "</section>" +
        '<section class="vp-step">' +
          '<h3 class="vp-h"><span class="vp-num">2</span>Döngüdeki yerin</h3>' +
          '<div class="vp-row">' +
            '<label class="vp-field"><span class="vp-label">Tarih</span><input class="vp-input" type="date" id="vp-ref"></label>' +
            '<label class="vp-field"><span class="vp-label">O günkü vardiyan</span><select class="vp-input" id="vp-pos"></select></label>' +
          "</div>" +
          '<p class="vp-hint vp-gap">Bildiğin herhangi bir günü seç. Örneğin bugün ikinci gecendeysen tarih bugün, vardiya “Gece (2/2)” olmalı. Takvim bu güne göre ileri ve geri hesaplanır.</p>' +
        "</section>" +
        '<section class="vp-step">' +
          '<h3 class="vp-h"><span class="vp-num">3</span>İzin almak istediğin tarihler</h3>' +
          '<div class="vp-row">' +
            '<label class="vp-field"><span class="vp-label">Başlangıç</span><input class="vp-input" type="date" id="vp-start"></label>' +
            '<label class="vp-field"><span class="vp-label">Bitiş</span><input class="vp-input" type="date" id="vp-end"></label>' +
          "</div>" +
          '<p class="vp-hint vp-gap" data-el="pickHint"></p>' +
        "</section>" +
        '<section class="vp-step">' +
          '<h3 class="vp-h"><span class="vp-num">4</span>En verimli izin dönemi</h3>' +
          '<div class="vp-row">' +
            '<label class="vp-field"><span class="vp-label">Kaç gün izin?</span><input class="vp-input" type="number" id="vp-budget" min="1" max="60" inputmode="numeric"></label>' +
            '<label class="vp-field"><span class="vp-label">Ne kadar ileriye?</span><select class="vp-input" id="vp-horizon"><option value="90">3 ay</option><option value="180">6 ay</option><option value="365">12 ay</option></select></label>' +
          "</div>" +
          '<p class="vp-hint vp-gap">Bugünden itibaren bu kadar izin gününü off\'larınla birleştirip en uzun tatile çeviren dönemler. Takvimde görmek için birine tıkla.</p>' +
          '<ol class="vp-best" data-el="best"></ol>' +
        "</section>" +
      "</div>" +
      '<div class="vp-main">' +
        '<section class="vp-result" data-el="result" aria-live="polite"></section>' +
        '<div class="vp-toolbar">' +
          '<div class="vp-nav">' +
            '<button type="button" class="vp-btn" data-prev aria-label="Önceki aylar">‹</button>' +
            '<button type="button" class="vp-btn" data-next aria-label="Sonraki aylar">›</button>' +
            '<button type="button" class="vp-btn" data-today>Bugün</button>' +
            '<strong data-el="title"></strong>' +
          "</div>" +
          '<div class="vp-seg" role="group" aria-label="Kaç ay gösterilsin">' +
            [1, 3, 6, 12].map(function (v) { return '<button type="button" data-view="' + v + '">' + v + " ay</button>"; }).join("") +
          "</div>" +
        "</div>" +
        '<div class="vp-legend" data-el="legend"></div>' +
        '<div class="vp-months" data-el="months"></div>' +
        '<details class="vp-details"><summary>Gün gün döküm</summary><div class="vp-list" data-el="list"></div></details>' +
        '<div class="vp-actions">' +
          '<button type="button" class="vp-btn" data-share>Planı paylaş: bağlantıyı kopyala</button>' +
          '<button type="button" class="vp-btn" data-copy-list>Dökümü kopyala</button>' +
        "</div>" +
      "</div>" +
    "</div>";

  var el = {};
  app.querySelectorAll("[data-el]").forEach(function (n) { el[n.dataset.el] = n; });
  ["preset", "ref", "pos", "start", "end", "budget", "horizon"].forEach(function (k) { el[k] = document.getElementById("vp-" + k); });

  // Döngü değiştiğinde: çipler, özet ve "o günkü vardiyan" seçenekleri.
  function renderCycle() {
    var p = S.p, work = p.replace(/O/g, "").length;
    el.seq.innerHTML = p ? p.split("").map(function (c, i) {
      return '<button type="button" class="vp-chip t-' + c + '" data-rm="' + i + '" title="' + (i + 1) + ". gün: " + TYPES[c].name + ' (çıkarmak için tıkla)">' + TYPES[c].code + "</button>";
    }).join("") : '<span class="vp-hint">Döngü boş. Aşağıdan gün ekle.</span>';
    el.info.textContent = p ? "· " + p.length + " gün: " + work + " çalışma, " + (p.length - work) + " off" : "";
    var html = "";
    for (var i = 0, j; i < p.length; i = j) { // aynı tipteki ardışık günler: "Gece (2/2)"
      for (j = i; p[j] === p[i]; j++);
      for (var x = i; x < j; x++) html += '<option value="' + x + '">' + (x + 1) + ". gün · " + TYPES[p[x]].name + (j - i > 1 ? " (" + (x - i + 1) + "/" + (j - i) + ")" : "") + "</option>";
    }
    el.pos.innerHTML = html;
  }

  // Form alanlarını duruma eşitle; kullanıcının o an yazdığı alana dokunma.
  function sync(skip) {
    var set = function (n, v) { if (n !== skip) n.value = v; };
    set(el.preset, PRESETS.some(function (p) { return p[0] === S.p; }) ? S.p : "");
    set(el.ref, S.r); set(el.pos, S.k); set(el.start, S.s); set(el.end, S.e); set(el.budget, S.n); set(el.horizon, S.h);
    app.querySelectorAll("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.view === S.v); });
  }

  function calc(a, b) {
    var r = { work: 0, off: 0, fw: NaN, lw: NaN, bs: a, be: b };
    if (isNaN(a) || !S.p) return r;
    for (var i = a; i <= b; i++) {
      if (isOff(i)) r.off++;
      else { r.work++; if (isNaN(r.fw)) r.fw = i; r.lw = i; }
    }
    if (hasWork()) { while (isOff(r.bs - 1)) r.bs--; while (isOff(r.be + 1)) r.be++; }
    return r;
  }

  function msg(title, text) { el.result.className = "vp-result"; el.result.innerHTML = "<h3>" + title + "</h3><p>" + text + "</p>"; }

  function renderResult(a, b, r) {
    if (!S.p) return msg("Döngüye en az bir gün ekle", "Hazır bir vardiya sistemi seç ya da kendi döngünü oluştur.");
    if (isNaN(a)) return msg("İzin tarihlerini seç", "Başlangıç ve bitiş tarihini gir ya da takvimde iki güne tıkla.");
    if (b - a > 365) return msg("Aralık çok uzun", "En fazla 366 günlük bir aralık hesaplanabilir.");
    var total = b - a + 1, block = r.be - r.bs + 1, back = r.be + 1, lines = [], h, p;
    if (!hasWork()) return msg("Döngüde çalışma günü yok", "Seçtiğin döngünün tamamı off; izin kullanmana gerek yok.");
    if (!r.work) { h = "İzin kullanmana gerek yok"; p = "Seçtiğin " + total + " günün tamamı zaten off günün. Bu tarihlerde yıllık izninden gün harcamadan dinlenebilirsin."; }
    else if (r.off) { h = r.work + " gün izin yeterli"; p = "Seçtiğin " + total + " günün " + r.off + " günü zaten off; bu günler için izin yazdırmana gerek yok."; }
    else { h = r.work + " gün izin gerekiyor"; p = "Seçtiğin günlerin hepsi çalışma günü, off'a denk gelen gün yok."; }

    if (r.work && (r.fw !== a || r.lw !== b)) lines.push("Dilekçeye yazman gereken aralık: <strong>" + longD(r.fw) + " – " + longD(r.lw) + "</strong>. Baştaki ve sondaki off günlerini izin olarak yazdırma.");
    if (block > total || !r.work) lines.push((r.work ? "Off'larınla birlikte " : "Off'ların ") + "<strong>" + longD(r.bs) + " – " + longD(r.be) + "</strong> arası, toplam <strong>" + block + " gün</strong> " + (r.work ? "kesintisiz tatil yaparsın." : "sürüyor."));
    if (r.work && block > r.work) lines.push("Kullandığın her izin günü ortalama <strong>" + (block / r.work).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " gün</strong> tatil sağlıyor.");
    var last = typeAt(r.bs - 1);
    lines.push("Son vardiyan: " + longD(r.bs - 1) + ", " + T(last).name + (last === "G" || last === "N" ? " (ertesi sabah biter, tatilin fiilen o sabah başlar)" : "") + ". İşbaşı: <strong>" + longD(back) + ", " + T(typeAt(back)).name + "</strong>.");

    el.result.className = "vp-result" + (r.work ? "" : " is-ok");
    el.result.innerHTML = "<h3>" + h + "</h3><p>" + p + "</p>" +
      '<div class="vp-tiles">' +
        '<div class="vp-tile is-key"><span>İzinden düşecek</span><b>' + r.work + "</b><small>gün</small></div>" +
        '<div class="vp-tile is-off"><span>Zaten off</span><b>' + r.off + "</b><small>gün</small></div>" +
        '<div class="vp-tile"><span>Kesintisiz tatil</span><b>' + block + "</b><small>gün</small></div>" +
        '<div class="vp-tile"><span>İşbaşı</span><b>' + shortD(back).split(" ").slice(0, 2).join(" ") + "</b><small>" + shortD(back).split(" ")[2] + " · " + T(typeAt(back)).name + "</small></div>" +
      "</div>" +
      '<div class="vp-lines">' + lines.map(function (l) { return "<p>" + l + "</p>"; }).join("") + "</div>";
  }

  function renderMonths(a, b, r) {
    var html = "", big = S.v === 1;
    for (var k = 0; k < S.v; k++) {
      var mi = cur + k, y = Math.floor(mi / 12), m = mi % 12;
      var first = Date.UTC(y, m, 1) / DAY, n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      var cells = "", w = 0, o = 0;
      for (var j = (new Date(first * DAY).getUTCDay() + 6) % 7; j > 0; j--) cells += '<span aria-hidden="true"></span>';
      for (var d = 0; d < n; d++) {
        var i = first + d, t = typeAt(i), name = T(t).name, cls = "vp-day t-" + t, label = big ? name : T(t).code, note = "";
        if (t === "O") o++; else if (t) w++;
        if (i >= a && i <= b && t !== "O") { cls += " is-leave"; label = "İZİN"; note = ", izin gerekir"; }
        else if (i >= r.bs && i <= r.be) { cls += " in-block"; note = ", tatile denk gelen off"; }
        if (i === t0) cls += " is-today";
        if (i === pick) cls += " is-pick";
        var title = longD(i) + (name ? " · " + name : "") + note;
        cells += '<button type="button" tabindex="-1" class="' + cls + '" data-d="' + i + '" title="' + title + '" aria-label="' + title + '"><b>' + (d + 1) + "</b><small>" + (big && t === "O" ? "OFF" : label) + "</small></button>";
      }
      html += '<section class="vp-month"><header><h4>' + FM.format(first * DAY) + "</h4><span>" + w + " iş · " + o + " off</span></header>" +
        '<div class="vp-wd" aria-hidden="true"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div>' +
        '<div class="vp-grid">' + cells + "</div></section>";
    }
    el.months.innerHTML = html;
    var mf = function (mi) { return FM.format(Date.UTC(Math.floor(mi / 12), mi % 12, 1)); };
    el.title.textContent = S.v === 1 ? mf(cur) : mf(cur) + " – " + mf(cur + S.v - 1);
  }

  function renderLegend() {
    el.legend.innerHTML = "SAGDNO".split("").filter(function (c) { return S.p.indexOf(c) > -1; }).map(function (c) {
      return '<span><i class="vp-dot t-' + c + '"></i>' + (c === "O" ? "Off" : TYPES[c].name) + "</span>";
    }).join("") +
      '<span><i class="vp-dot is-leave"></i>İzin (yıllık izinden düşer)</span>' +
      '<span><i class="vp-dot in-block"></i>Tatile denk gelen off</span>' +
      '<span><i class="vp-dot is-today"></i>Bugün</span>';
  }

  // n izin gününü art arda çalışma günlerine koyup komşu off'larla birleştirir; en uzun tatilleri sıralar.
  function best(n, from, horizon) {
    var all = [], picked = [];
    for (var s = from; s < from + horizon; s++) {
      if (isOff(s)) continue;
      var e = s, c = 1;
      while (c < n) { e++; if (!isOff(e)) c++; }
      var bs = s, be = e;
      while (bs > from && isOff(bs - 1)) bs--;
      while (isOff(be + 1)) be++;
      all.push({ s: s, e: e, bs: bs, be: be, len: be - bs + 1 });
    }
    all.sort(function (x, y) { return y.len - x.len || x.s - y.s; });
    for (var i = 0; i < all.length && picked.length < 4; i++) {
      var o = all[i];
      if (picked.every(function (p) { return o.be < p.bs || o.bs > p.be; })) picked.push(o);
    }
    return picked;
  }

  function renderBest(a, b) {
    if (!hasWork()) { el.best.innerHTML = '<li class="vp-hint">Döngüde çalışma günü yok.</li>'; return; }
    el.best.innerHTML = best(S.n, t0, S.h).map(function (o) {
      return '<li><button type="button" class="vp-opt' + (o.s === a && o.e === b ? " is-on" : "") + '" data-apply="' + o.s + "," + o.e + '">' +
        '<span class="vp-opt-top"><strong>' + o.len + " gün tatil</strong><span>" + S.n + " gün izinle</span></span>" +
        '<span class="vp-opt-sub">Tatil: ' + shortD(o.bs) + " – " + shortD(o.be) + "</span>" +
        '<span class="vp-opt-sub">İzin: ' + shortD(o.s) + " – " + shortD(o.e) + "</span></button></li>";
    }).join("");
  }

  function listRows(a, b) {
    var rows = [];
    if (isNaN(a) || b - a > 365 || !S.p) return rows;
    for (var i = a; i <= b; i++) rows.push({ i: i, t: typeAt(i) });
    return rows;
  }

  function renderList(a, b) {
    var rows = listRows(a, b);
    el.list.innerHTML = rows.length ? rows.map(function (x) {
      return "<div><span>" + longD(x.i) + '</span><span class="vp-pill t-' + x.t + '">' + T(x.t).name + "</span><strong>" + (x.t === "O" ? "İzin gerekmez" : "İzin") + "</strong></div>";
    }).join("") : '<p class="vp-hint">İzin aralığı seçilmedi.</p>';
  }

  function render() {
    ref = idx(S.r);
    if (S.p !== lastP) { lastP = S.p; S.k = Math.min(S.k, Math.max(S.p.length - 1, 0)); renderCycle(); el.pos.value = S.k; }
    var a = idx(S.s), b = idx(S.e);
    if (isNaN(b) || b < a) b = a;
    var r = calc(a, b);
    renderResult(a, b, r);
    renderMonths(a, b, r);
    renderLegend();
    renderBest(a, b);
    renderList(a, b);
    el.pickHint.textContent = pick === null ? "İpucu: Takvimde önce başlangıç, sonra bitiş gününe tıklayarak da seçebilirsin." : "Şimdi takvimde bitiş gününe tıkla.";
    app.dataset.view = S.v;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  // İzin başlangıcı görünen ayların dışındaysa takvimi oraya kaydır.
  function show(i) { var mi = monthOf(i); if (!isNaN(i) && (mi < cur || mi >= cur + S.v)) cur = mi; }

  function copy(text, btn, done) {
    var label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    var ok = function () { btn.textContent = done; setTimeout(function () { btn.textContent = label; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { prompt("Kopyala:", text); });
    else prompt("Kopyala:", text);
  }

  app.addEventListener("click", function (ev) {
    var t = ev.target.closest("button"), d = t && t.dataset;
    if (!t || !app.contains(t)) return;
    if (d.add) { if (S.p.length < MAX_CYCLE) S.p += d.add; }
    else if (d.rm) S.p = S.p.slice(0, +d.rm) + S.p.slice(+d.rm + 1);
    else if ("clear" in d) S.p = "";
    else if (d.view) { S.v = +d.view; show(idx(S.s)); }
    else if ("prev" in d) cur -= S.v;
    else if ("next" in d) cur += S.v;
    else if ("today" in d) cur = monthOf(t0);
    else if (d.d) {
      var i = +d.d;
      if (pick === null) { pick = i; S.s = S.e = iso(i); }
      else { S.s = iso(Math.min(pick, i)); S.e = iso(Math.max(pick, i)); pick = null; }
    }
    else if (d.apply) { var se = d.apply.split(","); S.s = iso(+se[0]); S.e = iso(+se[1]); pick = null; show(+se[0]); }
    else if ("share" in d) { copy(location.href.split("#")[0] + "#" + new URLSearchParams({ p: S.p, r: S.r, k: S.k, s: S.s, e: S.e }), t, "Bağlantı kopyalandı ✓"); return; }
    else if ("copyList" in d) {
      var a = idx(S.s), b = Math.max(idx(S.e), a), r = calc(a, b), rows = listRows(a, b);
      if (!rows.length) return;
      copy(rows.map(function (x) { return longD(x.i) + " · " + T(x.t).name + " · " + (x.t === "O" ? "izin gerekmez" : "izin"); }).join("\n") +
        "\n\nToplam: " + r.work + " gün izin, " + r.off + " gün off. Kesintisiz tatil: " + longD(r.bs) + " – " + longD(r.be) + " (" + (r.be - r.bs + 1) + " gün).", t, "Kopyalandı ✓");
      return;
    }
    else return;
    sync();
    render();
  });

  function onInput(ev) {
    var t = ev.target, v = t.value, i = idx(v);
    if (t.type === "date" && v && isNaN(i)) return; // tarih henüz yazılıyor
    switch (t.id) {
      case "vp-preset": if (!v) return; S.p = v; S.k = 0; break;
      case "vp-ref": if (!v) return; S.r = v; break;
      case "vp-pos": S.k = +v; break;
      case "vp-start":
        var len = idx(S.e) - idx(S.s); // aralığı kaydırırken süreyi koru
        S.s = v; S.e = v ? iso(i + (len > 0 ? len : 0)) : "";
        pick = null; show(i); break;
      case "vp-end":
        S.e = v; if (!v) S.e = S.s; else if (!S.s || S.s > v) S.s = v;
        pick = null; break;
      case "vp-budget": var n = parseInt(v, 10); if (!(n >= 1 && n <= 60)) return; S.n = n; break;
      case "vp-horizon": S.h = +v; break;
      default: return;
    }
    sync(t);
    render();
  }
  app.addEventListener("input", onInput);
  app.addEventListener("change", onInput);

  show(idx(S.s));
  sync();
  render();
})();
