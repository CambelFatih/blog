// Generates a 1200x630 post cover in the site's style.
// usage: node tools/cover.js <out.png> "<EYEBROW>" "<Title line 1|line 2>" "<subtitle>"
const { chromium } = require("playwright");
const [out, eyebrow, title, sub] = process.argv.slice(2);
if (!out || !title) { console.error('usage: node tools/cover.js out.png "EYEBROW" "Title|line 2" "subtitle"'); process.exit(1); }
const logo = require("fs").readFileSync(require("path").join(__dirname, "../assets/favicon.svg"), "utf8");
const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const html = `<body style="margin:0"><div style="width:1200px;height:630px;box-sizing:border-box;padding:80px;
background:radial-gradient(900px 500px at 85% 110%,#4a1d10,transparent 60%),linear-gradient(135deg,#15161a,#24171a);
display:flex;flex-direction:column;justify-content:center;font-family:Inter,Arial,sans-serif;color:#fff">
<div style="display:flex;align-items:center;gap:14px;margin-bottom:36px">${logo.replace("<svg ", '<svg width="44" height="44" ')}<div style="font-size:26px;font-weight:700">Fatih Furkan Çambel</div></div>
<div style="font-size:24px;letter-spacing:5px;color:#ff6a3d;font-weight:700;margin-bottom:22px">${esc(eyebrow).toLocaleUpperCase("tr")}</div>
<div style="font-size:66px;font-weight:800;line-height:1.1;letter-spacing:-1.5px">${esc(title).replace(/\|/g, "<br>")}</div>
<div style="font-size:28px;margin-top:28px;opacity:.75">${esc(sub)}</div></div></body>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.screenshot({ path: out });
  await b.close();
  console.log("wrote", out);
})();
