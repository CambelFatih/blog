# Kuyza blog: Claude çalışma kılavuzu

Bu site **Claude tarafından yönetilir**. Kullanıcı bir konu ve/veya ham metin verir; Claude yazıyı düzenler, yayına hazırlar, commit'ler ve PR açar. Kullanıcı tasarım ve içerik kararlarını Claude'a bırakmıştır; soru sormak yerine makul kararı ver ve uygula.

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
| `google40725d501500b265.html` | **Silme.** Google Search Console doğrulama dosyası; silinirse site doğrulaması düşer |

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

## Kategoriler

Mevcut slug'lar `_data/categories.yml` içinde: `softw, net, tech, eng, german, finance, entrepreneurship, self-improvement, popular-science, philosophy, history, films, music, art, math, bio, biography`. Önce bunlardan seç.

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

- Tek CSS dosyası, renkler `:root` token'larında; koyu mod hem işletim sistemi tercihini hem `data-theme` anahtarını izler. Yeni renk eklerken iki temayı da tanımla.
- JS minimum: tema anahtarı, kod kopyalama, tablo sarmalama, arama. Framework ekleme.
- Arayüz metinleri Türkçe.
