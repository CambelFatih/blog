# Fatih Furkan Çambel kişisel blogu: Claude çalışma kılavuzu

Bu site **Fatih Furkan Çambel'in kişisel blogudur** ve **Claude tarafından yönetilir**. Yazılar yazarın ağzından, birinci tekil şahısla anlatılır; site adı ve yazar `_config.yml` → `title` / `author`. Logo/favicon: `assets/favicon.svg` (FÇ monogramı), `assets/icon-512.png` onun PNG'si. Kullanıcı bir konu ve/veya ham metin verir; Claude yazıyı düzenler, yayına hazırlar, commit'ler ve PR açar. Kullanıcı tasarım ve içerik kararlarını Claude'a bırakmıştır; soru sormak yerine makul kararı ver ve uygula.

## Site nasıl çalışır

- **Jekyll 3.10** (GitHub Pages'in yerleşik derleyicisi). `main` dalına gelen her push'u GitHub Pages otomatik derleyip yayınlar. Ayrı bir Actions iş akışı yoktur.
- Canlı adres: `https://cambelfatih.github.io/blog/` (`baseurl: /blog`). Şablonlarda ve Markdown'da site içi yollar için her zaman `relative_url` kullan.
- Yazı URL'si: `/:year/:month/:day/:slug/`. Dosya adındaki tarih ve slug URL'yi belirler. Yayınlanmış bir yazının dosya adını **değiştirme**, URL kırılır.

| Yol | Ne |
|---|---|
| `_posts/` | Tüm yazılar. Eskiler `.html` (WordPress'ten taşındı), yeniler `.md` |
| `_layouts/`, `_includes/`, `assets/css/main.css`, `assets/js/main.js` | Tema (tek CSS, tek JS) |
| `_data/categories.yml` | Kategori slug → Türkçe ad + açıklama |
| `category/<slug>/index.html` | Her kategori için 5 satırlık sayfa (front matter only) |
| `index.html` | Ana sayfa (sayfalama: 13 yazı/sayfa, `/page/N/`) |
| `archive/`, `search/`, `search.json`, `404.html` | Arşiv, istemci tarafı arama, eski WordPress URL yönlendirmeleri |
| `about/`, `privacy/` | Sabit sayfalar (`layout: page`) |
| `wp-content/` | **Dokunma.** Eski yazıların görselleri + H5P quiz çalışma zamanı |
| `dashboard/`, `dw/` | **Dokunma.** Bağımsız uygulamalar (saat, EnglishStory, CV…); Jekyll olduğu gibi kopyalar |
| `tools/cover.js` | Kapak görseli üreteci |
| `google40725d501500b265.html` + `_config.yml` → `webmaster_verifications` | **Silme.** Google Search Console doğrulaması (HTML dosyası + meta etiketi); silinirse site doğrulaması düşer |

## Yeni yazı ekleme (ana iş akışı)

1. **Metni düzenle.** Kullanıcının metnini herkesin anlayacağı, akıcı Türkçe bir blog yazısına çevir:
   - Sohbet izlerini temizle ("sana", "yapıştırdığın cevap" gibi), yazıyı yazarın ağzından anlat.
   - Kişiye/projeye özel ayrıntıları genelleştir; jargonu kısaca açıkla.
   - Yapı: kısa giriş → `##` başlıklı bölümler → net bir kapanış. Gövdede `#` (h1) kullanma; başlığı layout basar.
   - Doğru Türkçe karakterler (ç, ğ, ı, İ, ö, ş, ü). Gerçek dışı iddia ekleme.
2. **Dosyayı oluştur:** `_posts/YYYY-MM-DD-slug.md`. Slug küçük harf, ASCII, tire ile (`ı→i, ğ→g, ş→s, ç→c, ö→o, ü→u`).
3. **Front matter** (aynen bu alanlar):

   ```yaml
   ---
   title: "Okunaklı, Merak Uyandıran Başlık"
   date: 2026-11-03 12:00:00 +0000   # her zaman +0000 (site timezone UTC); dosya adındaki tarihle aynı gün
   categories: [softw]               # _data/categories.yml'deki slug'lar; ilki ana kategori (kart ve ilgili yazılar onu kullanır)
   tags: [Clean Architecture, CQRS]  # isteğe bağlı; aramada kullanılır
   description: "140–160 karakterlik özet. Kartlarda, aramada ve Google/sosyal medya önizlemesinde görünür."
   image: /assets/images/posts/slug.png
   ---
   ```

4. **Kapak görseli** (1200×630, sitenin stiliyle):

   ```bash
   node tools/cover.js assets/images/posts/<slug>.png "<Kategori adı>" "Başlık satır 1|satır 2" "Kısa alt başlık"
   ```

   Yazı içi görseller: `assets/images/posts/<slug>/...`, Markdown'da `![açıklama]({{ '/assets/images/posts/<slug>/x.png' | relative_url }})`.
5. **Doğrula** (aşağıdaki "Derleme ve kontrol"), sonra commit, push ve PR.

### Markdown notları

- GFM: tablolar, ```` ```csharp ```` kod blokları (Prism ile renklenir; dil adını yaz), `> alıntı`, `---` ayraç.
- Kod içinde `{{` veya `{%` geçiyorsa o bloğu `{% raw %}` … `{% endraw %}` arasına al, yoksa Liquid derlemeyi bozar.
- YouTube: `<iframe src="https://www.youtube.com/embed/ID" allowfullscreen></iframe>` (CSS otomatik 16:9 yapar).
- Geniş tablolar otomatik yatay kaydırılır; ek bir şey gerekmez.

### SEO kuralları (her yeni yazıda uygula)

- **`title` ≤ 60 karakter**, benzersiz; aranacak anahtar kelime başa yakın ("X Nedir? …", "X ile Y Nasıl Yapılır?"). Sitede aynı başlık olmasın.
- **`description` 140–160 karakter**, düz Türkçe cümle; içeriği gerçekten özetlesin, anahtar kelimeyi içersin. Anahtar kelime listesi ya da gövdeden kopya ilk cümle olmasın.
- **İlk kategori = ana konu.** C#/.NET'e özgü yazılarda `net`, genel yazılımda `softw` önce gelsin.
- Tamamen İngilizce yazılarda front matter'a `lang: "en_US"` ekle; başlık ve açıklama da İngilizce olsun. Türkçe öğrenenlere yönelik İngilizce–Türkçe içerik Türkçe sayılır.
- Gövdede h1 yok, bölümler `##`. Her görselde anlamlı alt metin olsun.
- 1–2 ilgili eski yazıya **iç bağlantı** ver (konu kümesi oluşturur). Arşiv veya arama ile ilgili yazıyı bul.
- Sohbet kalıntısı bırakma: "Tabii!", "Elbette!", "Harika soru", "senin için hazırladım", `utm_source=chatgpt.com`.
- Neredeyse boş sayfa (yalnızca video/quiz) yayınlama; en az birkaç cümlelik açıklayıcı giriş yaz.
- Şablon tarafı hazır, ek bir şey gerekmez: `jekyll-seo-tag` (canonical, Open Graph, BlogPosting JSON-LD), yazılarda BreadcrumbList, `sitemap.xml`, `feed.xml`, arama ve 404 sayfaları `noindex`. Görseli olmayan sayfalar `assets/og-default.jpg` kullanır.

## Kategoriler

Mevcut slug'lar `_data/categories.yml` içinde: `softw, net, tech, eng, german, finance, entrepreneurship, self-improvement, popular-science, philosophy, history, films, music, art, math, bio, biography, araclar`. Önce bunlardan seç. Tarayıcıda çalışan araç yazıları `araclar` kategorisine de eklenir.

Yeni kategori gerekiyorsa:
1. `_data/categories.yml`'ye ekle (değerleri tırnak içinde yaz; virgüller YAML'ı bozmasın).
2. `category/<slug>/index.html` oluştur:
   ```
   ---
   layout: category
   category: <slug>
   title: "<Türkçe ad>"
   description: "<açıklama>"
   ---
   ```

## Etkileşimli araç yazısı

Uygulama yazının içinde çalışır (örnek: `_posts/2026-11-07-vardiya-takvimi-izin-planlayici.md`). Kendi CSS/JS dosyası yalnızca o yazıda yüklenir; tema dosyalarına eklenmez:

```html
<link rel="stylesheet" href="{{ '/assets/css/<ad>.css' | relative_url }}?v={{ site.time | date: '%s' }}">
<section id="<ad>-app" class="..." aria-label="..."><noscript><p>…JavaScript gerekir.</p></noscript></section>
<script src="{{ '/assets/js/<ad>.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>
```

- Arayüzü JS kursun (HTML'i yazıya gömme); böylece form metinleri arama dizinine ve okuma süresine karışmaz.
- Renkler `main.css` token'larını kullansın; yeni renkleri iki temada da tanımla. Geniş arayüz için `.vp` gibi `margin-left: calc(50% - genişlik / 2)` ile dar sütundan taşır.
- `.prose` stilleri (p/ol/h3 boşlukları, koyu temadaki `[style*="color"]` ters çevirme filtresi) uygulamaya da değer; uygulamanın CSS'inde sıfırla.

## Sabit sayfa ekleme

`<ad>/index.md` + `layout: page`, `title`, isteğe bağlı `lead` (başlık altı) ve `description`. Menüye eklenecekse `_config.yml` → `nav`.

## Derleme ve kontrol

GitHub Pages ile birebir aynı sürüm:

```bash
gem list -i github-pages >/dev/null || gem install --no-document github-pages   # ilk seferde ~3 dk
export LANG=C.UTF-8 LC_ALL=C.UTF-8
JEKYLL_ENV=production "$(gem env | sed -n 's/.*EXECUTABLE DIRECTORY: //p')/jekyll" build
```

Hata veya uyarı olmamalı. Sonra `_site/` içinde kontrol et:
- Yeni yazı `_site/YYYY/MM/DD/slug/index.html` olarak var mı, ana sayfada ilk (öne çıkan) kart o mu?
- Görseller ve iç bağlantılar mevcut dosyalara mı gidiyor?
- Gerekirse Playwright ile ekran görüntüsü al. `https://cambelfatih.github.io/blog/*` isteklerini `_site/`'a yönlendir (`page.route`). Sandbox'ta cdnjs (Prism) ve Google Fonts erişilemeyebilir; bu canlıyı etkilemez.

## Git

- Kullanıcının belirttiği/oturumun verdiği dalda çalış, `main`'e doğrudan push etme; PR aç. Birleşince Pages 1–2 dakikada yayınlar.
- Commit mesajı Türkçe ve açıklayıcı olsun: `Yeni yazı: <başlık>`.

## Tasarım ilkeleri

- Tek CSS dosyası (araç yazılarının kendi dosyası hariç, bkz. yukarı), renkler `:root` token'larında; koyu mod hem işletim sistemi tercihini hem `data-theme` anahtarını izler. Yeni renk eklerken iki temayı da tanımla.
- JS minimum: tema anahtarı, kod kopyalama, tablo sarmalama, arama. Framework ekleme.
- Arayüz metinleri Türkçe.
