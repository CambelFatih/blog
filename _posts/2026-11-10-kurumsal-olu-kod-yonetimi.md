---
title: "Kurumsal Ölü Kod Yönetimi: Kanıt, Risk ve Yönetişim"
date: 2026-11-10 22:00:00 +0000
categories: [softw, tech]
tags: [Dead code, Ölü kod, Teknik borç, Governance, Risk yönetimi, Feature flag, CI/CD]
description: "Kurumsal ölçekte ölü kod yönetimi: kanıt seviyeleri, risk matrisi, RACI, expand-contract, canary, CI/CD kalite kapıları, KPI ve 90 günlük uygulama planı."
image: /assets/images/posts/kurumsal-olu-kod-yonetimi.png
toc: true
---
[Ölü Kod Nasıl Bulunur ve Güvenle Silinir?]({{ '/2026/11/10/olu-kod-nasil-bulunur-ve-guvenle-silinir/' | relative_url }}) yazısında ölü kodu bulmanın ve teyit etmenin tekniklerini anlatmıştım. Bu yazı onun kurumsal tarafı: yüzlerce servis, onlarca ekip ve sıkı mevzuat altındaki bir yapıda bu işin **nasıl yönetileceği**.
{: .lead}

Kurumsal ölçekte ölü kod temizliği, kullanılmayan satırları bulup silmekten ibaret değildir. Silinen her parça; yazılımın davranışını, dış sistemlerle yapılan sözleşmeleri, veritabanı nesnelerini, felaket kurtarma yollarını, güvenlik kontrollerini ve yasal yükümlülükleri etkileyebilir. Bu yüzden iş, bir değişiklik yönetimi (change management) sürecine dönüşür. Aşağıda bu süreci kurmak için gereken kavramları, karar kurallarını, rolleri, şablonları ve ölçütleri bir araya getiriyorum.

## Yönetici özeti

- **0** Tek başına sıfır trafik ya da sıfır test kapsamı, silme kararı için yeterli kanıt değildir.
- **5 katman** Kaynak kod, çalışma zamanı, veri, platform/yapılandırma ve iş/regülasyon birlikte düşünülür.
- **1 kayıt** Her adayın sahibi, kanıtı, riski, onayı, değişikliği ve geri dönüş planı aynı yerde durur.
- **Ölçülebilir** Bakım yükü, saldırı yüzeyi, maliyet, hata oranı ve değişiklik riski birlikte izlenir.
{: .metrics}

> **Önerilen yönetim kararı:** Kurum genelinde "şu kadar satır silelim" gibi bir hedef koymak yerine önce bir **aday envanteri** ve bir **kanıt standardı** kurun. Yüksek riskli bileşenlerde çoklu kanıt, iş sahibi ve güvenlik/hukuk onayı olmadan üretimde silmeye izin vermeyin.
{: .callout .success}

## 1. Kapsam ve temel kavramlar

Kurumsal bir ölü kod programı yalnızca uygulama koduna bakmaz. Monolitler, mikroservisler, web ve mobil istemciler, batch işleri, veri platformları, veritabanı nesneleri, mesajlaşma altyapısı, bulut kaynakları, altyapı kodu (Infrastructure as Code, IaC), feature flag'ler ve derleme/dağıtım zinciri kapsamın parçasıdır.

Terimleri baştan ayırmak tartışmaları kısaltır:

| Terim | Tanım | Dikkat edilecek ayrım |
|---|---|---|
| Ölü kod (dead code) | Ürün davranışına katkısı olmayan ya da geçerli yürütme bağlamlarında erişilemeyen kod | Artık çağrılmayan bir metot bile dinamik erişim ihtimali için incelenmeli |
| Erişilemeyen kod (unreachable) | Kontrol akışı açısından hiçbir koşulda çalışmayan blok | Her zaman "ürün açısından gereksiz" anlamına gelmez; bir derleyici uyarısı olabilir |
| Ölü atama (dead store) | Okunmadan üzerine yazılan ya da hiç okunmayan atama | Değişken ölüdür; fonksiyonun tamamı ölü olmayabilir |
| Kullanılmayan bağımlılık | Derleme veya çalışma zamanı grafiğinde bulunan ama gerekmeyen paket | Build eklentileri, annotation processor'lar ve dolaylı kullanım gözden kaçabilir |
| Uyuyan özellik (dormant feature) | Üründe var ama koşul, bayrak, müşteri segmenti ya da takvim yüzünden etkin değil | Bir satış sözleşmesi ya da felaket kurtarma prosedürüyle tetiklenebilir |
| Eskimiş altyapı | Artık bir iş yüküne hizmet etmeyen kaynak veya IaC tanımı | Boşta sanal makine, eski deployment, kullanılmayan kuyruk ya da DNS kaydı |

> **Önemli ayrım:** "Şu an çağrılmıyor" gözlemi, "hiçbir geçerli senaryoda çağrılmayacak" anlamına gelmez. Silme kararı zamana, kapsama, iş bağlamına ve kanıtın kalitesine bağlıdır.
{: .callout .warning}

## 2. Temel ilkeler

Bütün süreç altı ilkeye dayanıyor:

1. **Kanıt çok kaynaklı olmalı.** Statik analiz, test kapsamı, üretim telemetrisi, sözleşme envanteri ve iş sahibinin bilgisi birlikte değerlendirilir.
2. **Gözlem süresi bağlama göre seçilmeli.** Günlük işler için birkaç hafta yeterli olabilir; yıllık raporlama, dönem sonu, vergi, denetim, sezonluk trafik ve felaket senaryoları için çok daha uzun süre ya da kontrollü bir tatbikat gerekir.
3. **Çalışmamak tasarım gereği olabilir.** Felaket kurtarma (DR), acil erişim (break-glass), dolandırıcılık müdahalesi, adli/denetim kaydı, hukuki muhafaza (legal hold) ve acil durum kodları nadir çalıştıkları için otomatik olarak silinmemelidir.
4. **Önce tüketici sözleşmeleri.** API, event, şema, CLI, dosya formatı, webhook ve entegrasyon tüketicileri bulunmadan iç çağrı grafiği tek başına yeterli değildir.
5. **Geri dönüş, değişiklikten önce tasarlanmalı.** `git revert` kodu geri alır; ama veri kaybını, daraltılmış şemayı ya da dış sistemlerdeki yan etkileri kendiliğinden geri getirmez.
6. **Muafiyetler yönetilmeli.** Her muafiyetin gerekçesi, sahibi, son gözden geçirme tarihi ve sona erme koşulu olmalıdır.

## 3. Keşif yöntemlerinin güçlü ve zayıf yanları

Keşif tekniklerini önceki yazıda ayrıntılı anlattığım için burada kurumsal açıdan önemli olan tarafa, yani her yöntemin neyi göremediğine odaklanıyorum.

### Statik analiz

| Teknik | Güçlü yanı | Kör noktası | Uygun kullanım |
|---|---|---|---|
| AST / referans tarama | Hızlı, tekrarlanabilir, ucuz | Yansıma (reflection), metinden yükleme, üretilmiş kod, çerçevenin kendi keşfi | Özel metot, değişken, import ve modül adayları |
| Kontrol akışı (CFG) analizi | Erişilemeyen blokları bulur | Dinamik koşullar, dış yapılandırma, platform varyantları | Dal ve blok seviyesinde analiz |
| Çağrı grafiği | Çağrı zincirlerini ve giriş noktalarını gösterir | Sanal çağrılar, yansıma, DI, event bus ve eklenti sistemleri grafiği eksik bırakabilir | Modül sınırları, özel/iç fonksiyonlar |
| Bağımlılık grafiği | Doğrudan ve dolaylı paketleri görünür kılar | Build eklentileri, kod üreticiler, çalışma zamanında yükleme | Manifest temizliği, SBOM sadeleştirme |
| Binary / bytecode / IL | Dağıtılan pakette gerçekte ne olduğunu doğrular | Kaynak kodun iş açısından ölü olduğunu tek başına kanıtlamaz | Build çıktısı, shrinker/linker davranışı, paket karşılaştırması |

> **Sık yapılan hata:** "Derleyici zaten optimize edip attı, demek ki kaynak kod ölü" çıkarımı geçerli değildir. Derleyici optimizasyonu belirli bir build yapılandırmasındaki makine kodu üretimiyle ilgilidir. Aynı kaynak kod başka bir hedef platformda, debug build'de, yansıma ile ya da farklı bir derleme sabitiyle anlamlı olabilir.
{: .callout .danger}

Binary incelemenin amacı kaynak dosyayı "kesin ölü" ilan etmek değil; yayın paketinin içeriğini, linker/shrinker etkisini, giriş noktalarını ve dağıtılan yüzeyi anlamaktır.

### Dinamik analiz ve üretim gözlemi

- **Test kapsamı (coverage):** Testlerin hangi satır, dal ve fonksiyona ulaştığını gösterir. Testlerin uğramadığı kodun üretimde de kullanılmadığını kanıtlamaz.
- **Profilleme:** Çalışma zamanı örneklemesi sıcak ve soğuk yolları gösterir; örnekleme yüzünden nadir çağrılar kaçabilir.
- **Dağıtık izleme (distributed tracing):** Servisler arası çağrı zincirini ve uç kullanımını görünür kılar. OpenTelemetry'nin anlamsal kuralları (semantic conventions), iz, metrik ve log alanlarının ekipler arasında aynı adlarla tutulmasını sağlar.
- **API Gateway / service mesh:** İstek sayısı, istemci kimliği, rota, durum kodu ve dönemsel dağılım izlenir. "0 istek" yalnızca ölçümün kapsadığı gateway, küme, tenant ve zaman aralığı için geçerlidir.
- **Log ve event analizi:** Kuyruk tüketicileri, zamanlanmış işler, webhook'lar ve asenkron tetikleyiciler ayrıca takip edilmelidir.

### İleri doğrulama teknikleri

- **Sembolik yürütme:** Sembolik girdilerle yol koşullarını araştırır; yol patlaması (path explosion) ve çevresel bağımlılıklar sınır oluşturur.
- **Diferansiyel test:** Eski sürümle değişiklik yapılmış sürüm aynı girdilerle çalıştırılır, davranış farkı aranır.
- **Mutasyon / tombstone deneyi:** Aday kod geçici olarak etkisizleştirilir ya da işaretlenir; test, staging ve kontrollü canary sırasında davranış farkı gözlenir.
- **Feature flag deneyleri:** Bayrak kapatılmadan veya temizlenmeden önce hedef kullanıcı, tenant ve geri dönüş koşulları belirlenir.
- **LLM destekli analiz:** Kodu açıklamada, adayları kümelemede ve bağımlılık hipotezi üretmede yardımcı olur. Ama model çıktısı kanıt değildir; her iddia derlenebilir referans, test, telemetri ve insan incelemesiyle doğrulanmalıdır.

## 4. Kanıt modeli: Aday ne zaman silinebilir?

Her aday için bir kanıt paketi oluşturulur. Amaç tek bir sinyale güvenmek değil, birbirinden bağımsız kanıtların aynı sonuca varmasını görmektir. Bunun için beş seviyeli bir ölçek işe yarar:

| Seviye | Kanıt | Karar |
|---|---|---|
| **E0**{: .badge} Hipotez | İsim, eski commit, geliştiricinin kanaati ya da basit bir arama sonucu | Yalnızca inceleme kuyruğuna al |
| **E1**{: .badge} Statik aday | Referans yok, çağrı grafiğinin köklerinden erişilemiyor, bağımlılık analizörü kullanılmadığını söylüyor | Dinamik ve mimari doğrulama gerekli |
| **E2**{: .badge} Gözlemsel destek | Belirlenmiş sürede telemetri, kapsam ya da trafik yok; ölçümün kapsamı belgeli | İş ve mevzuat incelemesine ilerle |
| **E3**{: .badge} Çoklu doğrulama | Statik + çalışma zamanı + tüketici envanteri + iş sahibi onayı + test/tombstone sonucu | Risk sınıfına göre kontrollü silme adayı |
| **E4**{: .badge} Kontrollü kaldırma | Canary başarılı, SLO etkisi yok, geri dönüş planı çalışır durumda | Kalıcı kapatma ve envanter güncellemesi |

Kanıt seviyesi tek başına karar vermez; bileşenin risk sınıfıyla birlikte okunur:

| Risk | Örnek | Asgari onay ve kontrol |
|---|---|---|
| Düşük | Özel yardımcı metot, kullanılmayan import, yerel ölü atama | Kod incelemesi + otomatik test + CI |
| Orta | Modül, iç servis ucu, kullanılmayan paket | Modül sahibi + tüketici araması + staging + geri dönüş |
| Yüksek | Public API, paylaşılan kütüphane, veritabanı şeması/yordamı, event sözleşmesi | Ürün/servis sahibi + mimari + veri sahibi + tüketici geçişi + canary |
| Kritik | Regüle kayıt, DR, ödeme, kimlik, güvenlik, acil erişim | Güvenlik + uyum/hukuk + iş sahibi + değişiklik kurulu; test veya tatbikat kanıtı |

> **Gözlem süresi:** Sabit bir endüstri standardı yoktur. En azından iş döngüsünü, sezonu, mali yılı, yasal raporlama ve kurtarma tatbikatı takvimini kapsamalıdır. Yılda bir ya da birkaç yılda bir yaşanan olaylar için yalnızca log beklemek yerine senaryo testi, runbook doğrulaması ve iş sahibinin beyanı gerekir.
{: .callout .warning}

## 5. Katman katman kontrol alanları

### Uygulama ve API

HTTP/REST, GraphQL, gRPC, webhook, CLI, SDK, event handler ve public kütüphane dışa aktarımları ayrı ayrı envantere alınır. Gateway metrikleri, servis içi telemetri ve tüketici depolarının taraması birleştirilir; API sürümleme ve deprecation politikası uygulanır. Dış tüketiciyi göremediğiniz durumlarda sözleşme kayıtları ve müşteri entegrasyon envanteri incelenir.

### Veritabanı

Saklı yordamlar, fonksiyonlar, trigger'lar, view'lar, materialized view'lar, zamanlanmış işler, sequence'ler, indeksler, şemalar, roller ve yetkiler incelenir. PostgreSQL'de `track_functions` ayarı açıksa `pg_stat_user_functions` fonksiyon çağrı istatistiği verir; ancak istatistikler gecikmeli güncellenebilir, sıfırlanabilir ve replika ya da yapılandırmaya göre farklılık gösterebilir. Bu yüzden sayaçta sıfır çağrı görmek tek başına hüküm değildir. Ayrıca:

- Uygulama dışından bağlanan ETL, BI, DBA betikleri, zamanlayıcılar ve raporlama araçlarını arayın.
- Trigger'ların dolaylı tetiklenmesini, cascade ve yetki bağımlılıklarını inceleyin.
- Şema değişikliklerinde **expand-contract** uygulayın: önce uyumlu genişletme, sonra tüketicilerin geçişi, gözlem ve en son daraltma.
- Veri silmeden ya da kolon kaldırmadan önce yedek, saklama süresi ve hukuki muhafaza kontrolü yapın.

### Bağımlılıklar ve tedarik zinciri

Doğrudan ve dolaylı paketler, build eklentileri, test araçları, annotation processor'lar, kod üreticiler, çalışma zamanı eklentileri ve container imaj katmanları ayrı sınıflandırılır. "Kaynak kodda import yok" demek "paket gereksiz" demek değildir. Kaldırmadan önce lockfile, SBOM (yazılım malzeme listesi), lisans, güvenlik açığı, build ve çalışma zamanı testleri karşılaştırılır.

### Feature flag ve yapılandırma

Her bayrak için sahibi, amacı, oluşturulma tarihi, hedef segmenti, varsayılan değeri, son kullanım zamanı, son kullanma tarihi ve kaldırma PR'ı kaydedilir. Bayrağın %100 açık olması onu hemen silmek için yeterli değildir: eski davranış dalı, geri dönüş stratejisi ve farklı tenant/bölge yapılandırmaları kontrol edilir.

### IaC ve bulut kaynakları

Terraform, CloudFormation, Ansible, Kubernetes manifestleri, Helm chart'ları, secret'lar, IAM politikaları, DNS, kuyruklar, bucket'lar, snapshot'lar, load balancer'lar ve zamanlanmış bulut işleri birlikte değerlendirilir. "Boşta" görünen kaynaklar için sahiplik, saklama süresi, bağlı alarmlar, yedekleme ve felaket kurtarma ilişkisi araştırılır. Sıralama önemlidir: önce plan/diff, sonra kontrollü devre dışı bırakma, sonra bekleme, en son silme (destroy).

### Build, test ve operasyon

Pipeline parametreleri, test fixture'ları, deployment işleri, runbook'lar, dashboard'lar, alarmlar, SLO'lar, nöbet (on-call) prosedürleri ve olay otomasyonları da aday envanterine girer. Kullanılmayan bir alarm ya da runbook kaldırılırken ilgili operasyonel kontrolün başka bir yerde karşılandığı belgelenmelidir.

## 6. Risk, güvenlik ve mevzuat

### Risk sınıfları

- **İş riski:** Nadir müşteri akışları, dönemsel işlemler, sözleşmeye bağlı özellikler, fiyatlama, vergilendirme ve raporlama.
- **Teknik risk:** Yansıma, dinamik çağrılar, eklentiler, olay güdümlü yapılar, şema bağımlılıkları, depolar arası bağımlılıklar, platform varyantları.
- **Operasyon riski:** Felaket kurtarma, failover, yedekten geri dönüş, olay müdahalesi, acil erişim, manuel operasyonlar.
- **Güvenlik riski:** Kimlik doğrulama ve yetkilendirme, denetim izi, dolandırıcılık tespiti, güvenlik olayları.
- **Uyum riski:** Kayıt saklama, denetim izi, veri minimizasyonu, hukuki muhafaza, sektörel kurallar.

### Mevzuata doğru yaklaşım

KVKK, GDPR, HIPAA ya da BDDK düzenlemeleri aynı yükümlülükleri getirmez. Her kod parçasına "kanun gereği saklanmalı" etiketi yapıştırmak yerine önce şu sorular cevaplanmalı: hangi veri, hangi işleme amacı, hangi kayıt kategorisi, hangi kurum, ülke ve iş kolu, hangi saklama-imha politikası?

Örneğin GDPR'daki saklama sınırlaması (storage limitation) ilkesi, kişisel verinin amacı için gerekli süreden uzun tutulmamasını öngörür; bütün kayıtlar için tek tip bir süre vermez. Yani bu ilke, denetim kayıtlarını süresiz saklama ya da denetim kodunu mutlaka koruma kuralı değildir.

Hukuk ve uyum ekibi; uygulanabilir mevzuatı, sektör rehberlerini, sözleşmeleri, dava veya inceleme muhafazalarını, kayıt takvimini ve silme yükümlülüklerini teyit etmelidir. Unutulmaması gereken bir ayrım: **kod ile ürettiği kayıt farklı varlıklardır.** Bir kaydı saklama zorunluluğu, onu üreten belirli bir uygulamanın sonsuza dek tutulmasını gerektirmez; ama eşdeğer kontrolün devam ettiği kanıtlanmalıdır.

> **Muafiyet tuzağı:** Kod içine eklenen özel bir etiket (örneğin `@RegulatedCompliance` gibi bir annotation) tek başına mevzuat kanıtı değildir; yalnızca kurum içi araçların tanıdığı bir üst veri (metadata) olabilir. Muafiyet kaydında hukuki dayanak, kontrolün sahibi, kapsam, süre ve periyodik gözden geçirme tarihi bulunmalıdır.
{: .callout .danger}

### Güvenlik ve tedarik zinciri

Gereksiz bağımlılıkları kaldırmak saldırı yüzeyini, bakım ve lisans yükünü azaltabilir; ama önce bağımlılık grafiği ve paketin build/çalışma zamanındaki rolü anlaşılmalıdır. NIST'in Güvenli Yazılım Geliştirme Çerçevesi (SSDF), güvenli geliştirme pratiklerini yazılım yaşam döngüsüne yerleştirmeyi önerir. Ölü kod çalıştırılabilir bir saldırı yüzeyi oluşturuyorsa onu kaldırmak riski azaltır; fakat güvenlik kazanımı ölçülmeden varsayılmamalıdır.

## 7. Ölü kod yaşam döngüsü

- Keşif
- Triyaj
- Sahip atama
- Kanıt toplama
- Onay
- Karantina
- Silme
- Canary
- Kapanış
{: .flow}

1. **Keşif ve envanter.** Tarayıcı çıktıları tekilleştirilir; depo, servis, ortam, dil, bileşen, aday türü, tespit tarihi ve güven seviyesi kaydedilir. Adaylar otomatik silme kuyruğuna değil, **inceleme** kuyruğuna girer.
2. **Sahiplik eşlemesi.** `CODEOWNERS` dosyası depo sahipliğini ve inceleme sorumluluğunu tanımlar. `git blame` tarihsel katkıyı gösterir ama bugünkü ürün sahipliğini kanıtlamaz. Servis kataloğu, ekip kataloğu, nöbet rotası ve ürün alanı eşlemesiyle doğrulanmalıdır.
3. **İş ve uyum incelemesi.** Ürün sahibi ve iş analisti özelliğin ticari/operasyonel amacını; güvenlik, hukuk ve uyum ekipleri kontrol ve mevzuat etkisini değerlendirir. Bu ekipler yalnızca gerçekten gerekli risk sınıflarında zorunlu onaya dahil edilir; her küçük refactoring için ağır bir değişiklik kurulu süreci kurulmaz.
4. **Deprecation / karantina.** Public API ve paylaşılan sözleşmeler için duyuru, sürümleme, kullanım metriği, geçiş rehberi ve son tarih belirlenir. `@Deprecated` benzeri işaretler çağıran geliştiriciyi uyarır; ama dış istemciyi, yansımayı ya da çalışma zamanındaki metin referanslarını engellemez. "Bir veya iki ana sürüm" evrensel bir standart değildir; kurumun yayın temposu ve tüketici sözleşmesine göre belirlenir.
5. **Silme hazırlığı.** Bağımlı kod, yapılandırma, şema, IAM, IaC, test, alarm, dashboard, runbook, doküman ve deployment parametreleri listelenir. Değişiklik küçük, incelenebilir ve mümkünse tek amaçlı bir PR/commit olmalıdır.
6. **Doğrulama ve kapanış.** CI, entegrasyon, sözleşme, güvenlik, performans ve canary sonuçları kaydedilir. Envanter, servis kataloğu, API kataloğu, CMDB, SBOM, bayrak kaydı ve runbook güncellenir. Muafiyet varsa son kullanma tarihi atanır.

## 8. Yönetişim: Kim neye karar verir?

Önerdiğim işleyiş modeli şu: merkezi platform veya mimari ekibi standardı ve görünürlüğü sağlar; alan (domain) ekipleri adaylar hakkında teknik ve iş kararını verir; risk fonksiyonları kritik kontrollerde onay ya da veto hakkına sahiptir. Bunu bir RACI tablosuyla netleştirmek işe yarar:

| Faaliyet | Geliştirici / servis sahibi | Ürün / iş analisti | Platform / mimari | Güvenlik / hukuk / uyum | Değişiklik / SRE |
|---|---|---|---|---|---|
| Aday keşfi | R | I | A/R | I | C |
| Teknik kanıt paketi | R | C | A/C | C | C |
| İş gerekliliği kararı | C | A/R | C | C | I |
| Uyum / güvenlik onayı | C | C | C | A/R | I |
| Değişiklik ve yayına alma | R | I | C | C | A/R |
| Kapanış ve KPI | R | C | A | C | R |

R: işi yapan (Responsible), A: nihai hesap veren (Accountable), C: danışılan (Consulted), I: bilgilendirilen (Informed). Her satırda tek bir A olması önerilir; tabloyu kurumun yapısına göre uyarlayın.

Karar hakları da açıkça yazılmalı:

- **Ekip:** Düşük ve orta riskli iç kodun teknik olarak kaldırılması.
- **Ürün sahibi:** "Bu özellik ya da iş akışı artık sunulmuyor" kararı.
- **Veri sahibi / DBA:** Şema, saklı yordam, veri saklama ve migration kararları.
- **Güvenlik / uyum / hukuk:** Kontrol ya da düzenleyici yükümlülük etkisi olan adaylarda onay.
- **Değişiklik kurulu (CAB):** Kurum politikasına göre kritik üretim değişiklikleri. Düşük riskli standart değişikliklerde önceden onaylanmış otomasyon tercih edilir.

## 9. Güvenli silme

Silme kapsamı yalnızca kaynak satırlarından oluşmaz. "Atomik silme" de her zaman tek bir transaction ya da tek bir commit anlamına gelmez: dağıtık sistemlerde bileşenler farklı zamanlarda geçiş yapar. Doğru hedef, **uyumlu ara durumlar** üzerinden kontrollü bir söküm yapmaktır.

### Silme paketinin kapsamı

- Kaynak kod, public dışa aktarımlar, rotalar, handler'lar, event abonelikleri ve eklenti kayıtları
- API şeması (OpenAPI, GraphQL, gRPC), SDK'lar ve istemci tüketicileri
- Feature flag'ler, ortam değişkenleri, secret'lar, config map'ler ve deployment parametreleri
- Veritabanı yordamları, fonksiyonlar, trigger'lar, view'lar, tablolar, kolonlar, indeksler, roller, işler ve migration'lar
- Bağımlılık manifesti, lockfile, build eklentileri, container katmanları ve SBOM
- IaC, Kubernetes, bulut kaynakları, IAM, DNS, kuyruklar, depolama ve yedek ilişkileri
- Testler, fixture'lar, mock'lar, dashboard'lar, alarmlar, runbook'lar, wiki ve destek dokümanları
{: .checklist}

### Veritabanında expand-contract

1. **Expand (genişlet):** Yeni şema ya da alan eklenir; eski ve yeni uygulama sürümleri uyumlu kalır.
2. **Migrate (taşı):** Veri taşınır, tüketiciler yeni sözleşmeye geçirilir; çift okuma/yazma gerekiyorsa tutarlılık kontrolleri yapılır.
3. **Observe (gözle):** Eski alanın okuma/yazma trafiği, batch ve raporlama tüketicileri izlenir.
4. **Contract (daralt):** Eski tüketici kalmadığı ve geri dönüş penceresi kapandığı kanıtlanınca eski alan kaldırılır.

### Geri dönüş planı

Silme PR'ı ayrı tutulur; değişiklik kaydı, artifact sürümü, migration ve yapılandırma değişiklikleri birbirine bağlanır. `git revert` kodu geri alabilir; ama yıkıcı bir migration'ı, dış sistemde yapılan silmeyi, veri dönüşümünü ya da geri alınamaz yan etkileri geri getirmez. Bu yüzden geri dönüş planı yedekten geri yükleme, ileriye dönük düzeltme (forward-fix), özelliği kapatma, şema uyumluluğu ve veri kurtarma adımlarını ayrı ayrı tanımlamalıdır. AWS Well-Architected'ın operasyonel mükemmellik rehberi de değişikliğin etkisini sınırlamayı, geri dönüş planını belgelemeyi ve dağıtım sonrası izlemeyle geri dönüş kararını hızlandırmayı vurgular.

## 10. Yayına alma ve olay planı

Canary, değişikliğin sistemin sınırlı bir bölümünde ve belirli bir süre boyunca uygulanıp kontrol grubuyla karşılaştırılmasıdır. Google SRE Workbook, ölçümlerin değişikliğe atfedilebilir ve temsil edici olması gerektiğinin altını çizer.

Önerilen yayına alma basamakları:

1. **CI ve test ortamı:** Birim, entegrasyon, sözleşme, migration, güvenlik ve performans testleri.
2. **Ön üretim (pre-production):** Üretime benzer yapılandırmayla kritik senaryo testleri.
3. **Canary:** Düşük riskli bir tenant, sunucu ya da trafik diliminde, baseline ile karşılaştırmalı.
4. **Kademeli yayılım:** Örneğin %5 → %25 → %50 → %100. Gerçek oranlar risk ve mimariye göre seçilir.
5. **Stabilizasyon:** İlgili iş döngüsü tamamlanana kadar telemetri ve iş metrikleri izlenir.

İzlenecek sinyaller:

| Boyut | Örnek sinyal | Durdurma / geri dönüş tetikleyicisi |
|---|---|---|
| Erişilebilirlik | Başarılı istek oranı, 5xx hataları, zaman aşımları | Önceden belirlenmiş SLO yakma hızı (burn rate) ya da hata bütçesi eşiği |
| Gecikme | p50/p95/p99, kuyruk gecikmesi | Baseline'a göre anlamlı gerileme |
| İş | Ödeme tamamlama oranı, rapor üretimi | İş metriğinde düşüş ya da kritik akışta kayıp |
| Veri bütünlüğü | Mutabakat, event gecikmesi, eksik/çift kayıt | Veri tutarsızlığı; gerekirse yayılım durdurulur |
| Güvenlik / uyum | Denetim olayları, erişim reddi, alarm kapsamı | Kontrol boşluğu ya da zorunlu kaydın kaybolması |

Bir şeyler ters giderse izlenecek sıra:

1. Yayılımı durdur; etkilenen sürümü, tenant'ı, bölgeyi ve değişiklikleri sabitle.
2. Önceden tanımlı eşiğe göre geri dönüş ya da ileriye dönük düzeltme kararı ver.
3. Migration ya da veri yan etkisi varsa veri kurtarma sorumlusunu devreye al.
4. Olay yöneticisi, servis sahibi, DBA, güvenlik/uyum ve iş birimini etki düzeyine göre çağır.
5. Olay sonrası kök nedeni, kaçan kanıtı, test boşluğunu ve eklenecek yeni kalite kapısını kaydet.

## 11. CI/CD kalite kapıları

CI/CD'nin buradaki hedefi bütün eski kodu tek seferde temizlemek değil; **yeni ölü kod borcunun birikmesini önlemek** ve yüksek riskli silme değişikliklerini kontrol altında tutmaktır. SonarQube'un quality gate özelliği, analiz sonuçlarını tanımlı koşullarla karşılaştırıp birleştirme ya da yayın kararında kullanılabilir. Ancak quality gate tek başına çalışma zamanındaki kullanımı ya da iş gerekliliğini ölçmez. Pipeline'ın kendisini [CI/CD Pipeline Nedir?]({{ '/2026/04/08/ci-cd-pipline-nedir/' | relative_url }}) yazısında anlatmıştım; buraya eklenecek kapılar şunlar:

- Yeni kullanılmayan özel üye ve erişilemeyen blok uyarıları; düşük riskli durumlarda otomatik düzeltme, ama her zaman inceleme ile.
- Yeni bağımlılık eklenirken gerekçe, sahip ve kullanım türü (runtime / build / test) kaydı.
- API, veritabanı ve event sözleşmesi değişikliklerinde tüketici ve uyumluluk testleri.
- Her feature flag için sahip, son kullanma tarihi ve temizlik kaydı zorunluluğu.
- IaC'deki destroy planlarında sahip, bağımlılık ve yedek/saklama kontrolü.
- Yüksek riskli kaldırmalarda kanıt paketinin ve gerekli onayların politika kontrolüyle doğrulanması.

Kavramsal bir politika örneği (belirli bir CI ürününün sözdizimi değildir, mantığı göstermek için yazılmış sözde koddur):

```python
if change.risk == "critical":
    require(evidence.level >= "E3")
    require(product_owner_approval)
    require(security_compliance_approval)
    require(rollback_plan)
    require(canary_plan)

if change.touches_database_contract:
    require(schema_compatibility_tests)
    require(consumer_migration_status)
    require(data_recovery_plan)

if new_feature_flag:
    require(flag_owner)
    require(expiry_date)
    require(cleanup_issue)
```

## 12. Ölçüm: KPI ve iş gerekçesi

### İzlenecek göstergeler

| KPI | Tanım | Ne söyler? |
|---|---|---|
| Adaydan karara süre | İlk tespitten onaylı karara kadar geçen medyan gün | Sahiplik ve yönetişim darboğazlarını |
| Kanıt tamlık oranı | Zorunlu kanıt alanları dolu aday / toplam aday | Silme kararlarının güvenilirliğini |
| Yanlış pozitif oranı | İncelemede canlı çıkan aday / incelenen aday | Tarayıcıların ayar ihtiyacını |
| Geri dönüş / olay oranı | Temizlik değişikliklerinden kaynaklanan geri dönüş ve olaylar | Kalite ve risk kontrolünün etkinliğini |
| Bağımlılık azalması | Kaldırılan doğrudan/dolaylı paket ve CVE maruziyeti | Güvenlik kazanımını (SBOM bağlamında) |
| Önlenen bulut maliyeti | Gerçekten kapatılan kaynağın net aylık maliyet farkı | Doğrudan tasarrufu (indirim ve ortak kaynak payı dahil) |
| Bakım yükü | Build süresi, test süresi, güncelleme ve bakım eforu | Üretkenlik kazanımını (önce/sonra aynı koşullarda) |
| Süresi geçmiş bayraklar | Son kullanma tarihi geçen feature flag sayısı | Bayrak borcunun (toggle debt) büyüklüğünü |

### İş gerekçesi (business case) nasıl hesaplanır?

Yönetime sunulacak hesabın iskeleti basit:

> **Net yıllık fayda** = doğrulanmış altyapı tasarrufu + lisans/barındırma tasarrufu + bakım eforu kazanımı + risk azaltımının beklenen değeri − analiz, değişiklik, test ve yayına alma maliyeti
{: .callout}

Risk azaltımının beklenen değeri kabaca **olasılık × etki** ile modellenebilir. Ancak bir güvenlik olayının ya da mevzuat ihlalinin olasılığı belirsizdir; bu sayıları kesin gerçek gibi sunmayın, düşük/orta/yüksek senaryolar ve varsayımlarla gösterin.

| Fayda alanı | Ölçüm yöntemi | Kanıt kaynağı |
|---|---|---|
| Bulut maliyeti | Kaynak silinmeden önce ve sonra fatura ve kullanım | Fatura dışa aktarımı, kaynak kimliği, etiketler |
| Güvenlik | Kaldırılan paket, açık, uç nokta ya da erişim yüzeyi | SBOM, tarayıcı raporu, saldırı yüzeyi envanteri |
| Üretkenlik | Build/test süresi, güncelleme ve olay eforu | CI analitiği, iş kayıtları |
| Operasyonel dayanıklılık | Alarm gürültüsü, başarısız değişiklik, kurtarma süresi | Gözlemlenebilirlik ve olay kayıtları |

> **Kapasite ayırma:** "Her sprint'in %10–20'si teknik borca" gibi sabit oranlar sık önerilir ama evrensel bir standart değildir. Kapasiteyi mevcut teknik borca, riske, ürün önceliklerine ve ölçülen bakım yüküne göre portföy bazında ayırmak daha sağlıklıdır.
{: .callout .warning}

## 13. 30/60/90 günlük uygulama planı

| Dönem | Hedef | Çıktılar | Başarı ölçütü |
|---|---|---|---|
| 0–30 gün | Yönetişimi ve pilotun temelini kurmak | Terim kataloğu, aday kayıt şeması, risk matrisi, CODEOWNERS/servis sahibi eşlemesi, pilot servis seçimi, telemetri boşluk analizi | Pilot kapsamı ve sahipleri atanmış, kanıt şablonu onaylanmış |
| 31–60 gün | Kanıt toplamak ve kontrollü pilot yapmak | Statik/dinamik tarama; API, veritabanı, bağımlılık, bayrak ve IaC envanteri; E0–E3 sınıflaması; deprecation denemesi; canary ve geri dönüş tatbikatı | İlk düşük/orta riskli adaylar güvenle kapatılmış, yanlış pozitifler ölçülmüş |
| 61–90 gün | Ölçeklemek ve CI'a bağlamak | Quality gate, policy-as-code, dashboard, RACI'nin yaygınlaştırılması, muafiyet kayıt sistemi, olay planı, yönetim raporu | Yeni kod, bayrak ve bağımlılık borcu için kontroller etkin; KPI trendleri raporlanıyor |

Ölçeklerken riski düşükten yükseğe doğru ilerleyin:

1. İç ve düşük riskli özel kod
2. Build/test bağımlılıkları ve kullanılmayan paketler
3. Feature flag'ler ve yapılandırma
4. İç API'ler ve servisler arası sözleşmeler
5. Veritabanı yordamları, view'lar ve şema
6. Public API'ler, kritik kontroller ve altyapı kaynakları

## 14. Şablonlar ve kontrol listeleri

### Aday kayıt şablonu

| Alan | İçerik |
|---|---|
| Aday kimliği / varlık | Depo, servis, dosya, sembol, veritabanı nesnesi ya da bulut kaynağı |
| Aday türü | Ölü kod, uyuyan özellik, bağımlılık, veritabanı, IaC, yapılandırma |
| Sahip ve iş alanı | Ekip, servis sahibi, ürün sahibi |
| Tespit sinyalleri | Statik, kapsam, iz, gateway, veritabanı istatistiği, envanter |
| Gözlem penceresi | Başlangıç–bitiş; sayaç sıfırlama ve telemetri kapsamı notu |
| Hariç tutulan senaryolar | Yıllık iş, DR, hukuki muhafaza, tenant, bölge, manuel tetikleme |
| Risk / kanıt seviyesi | Düşük–orta–yüksek–kritik / E0–E4 |
| Onaylar | Mühendislik, ürün, veri, güvenlik, hukuk, değişiklik |
| Silme kapsamı | Kod + şema + yapılandırma + test + IaC + doküman + alarm |
| Geri dönüş / kurtarma | Revert, geri yükleme, forward-fix, özelliği kapatma, sorumlu |
| Kapanış kanıtı | PR, CI, canary, SLO, dashboard, güncellenmiş envanter |

### Silmeden önce kontrol listesi

- Statik analiz ve çağrı grafiği sonuçları incelendi.
- Yansıma, DI, eklentiler, event'ler, üretilmiş kod ve çerçeve keşfi kontrol edildi.
- Test kapsamı ve üretim telemetrisinin kapsamı ve sürekliliği doğrulandı.
- API, SDK, webhook, kuyruk ve depolar arası tüketiciler tarandı.
- Batch, dönemsel, yıllık ve manuel tetiklenen işler kontrol edildi.
- Veritabanı trigger'ları, yordamlar, view'lar, işler, yetkiler ve dış raporlama tüketicileri kontrol edildi.
- Güvenlik, hukuki muhafaza, saklama süresi ve denetim kontrolüne etkisi değerlendirildi.
- Sahip, CODEOWNERS ve servis kataloğu üzerinden doğrulandı.
- Feature flag, IaC, secret, IAM, alarm, dashboard ve runbook bağımlılıkları listelendi.
- Test, canary, SLO eşiği, geri dönüş ve veri kurtarma planı onaylandı.
- PR/commit tek amaçlı; kapanışta envanter ve dokümanlar güncellenecek.
{: .checklist}

### Muafiyet kaydı alanları

```text
exemption_id, asset_id, rationale, legal_or_control_reference, owner, approver,
scope, review_date, expiry_date, compensating_control, evidence_uri
```

### Silme PR'ı açıklama şablonu

```markdown
## Amaç
Hangi aday, neden kaldırılıyor?

## Kanıt
- Statik analiz:
- Çalışma zamanı / telemetri:
- Tüketici / sözleşme kontrolü:
- İş sahibi onayı:
- Güvenlik / hukuk / veri onayı:

## Kapsam
Kod, API, veritabanı, yapılandırma, bağımlılık, IaC, test, alarm, doküman

## Risk ve etki
Risk seviyesi; etkilenen tenant, bölge ve sistemler

## Doğrulama
CI, entegrasyon, sözleşme, canary, SLO

## Geri dönüş
Revert / geri yükleme / forward-fix; sorumlu kişi

## Kapanış
Envanter, SBOM, servis kataloğu ve runbook güncellendi mi?
```

## 15. Teknik örnekler

### PostgreSQL'de fonksiyon kullanımını incelemek

```sql
-- Ön koşul: fonksiyon takibi açık olmalı ('pl' veya 'all').
SHOW track_functions;

-- İstatistikler en son ne zaman sıfırlandı? Gözlem penceresi buradan başlar.
SELECT stats_reset FROM pg_stat_database WHERE datname = current_database();

-- Takip edilen fonksiyonların çağrı sayıları
SELECT schemaname, funcname, calls, total_time, self_time
FROM pg_stat_user_functions
ORDER BY calls, total_time;

-- Sıfırlamadan bu yana hiç çağrılmamış, bu yüzden istatistikte hiç satırı olmayan fonksiyonlar
SELECT n.nspname AS sema, p.proname AS fonksiyon
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
LEFT JOIN pg_stat_user_functions AS s ON s.funcid = p.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND s.funcid IS NULL;
```

Bu sorgular yalnızca toplanmış istatistiği gösterir. Hiç çağrılmamış fonksiyonlar `pg_stat_user_functions` içinde görünmez, bu yüzden son sorgu katalogla karşılaştırma yapar. `track_functions = 'pl'` ayarı yalnızca prosedürel dillerdeki fonksiyonları izler; sorgu içine gömülen (inline) basit SQL fonksiyonları sayılmayabilir. Sayacın en son sıfırlanma zamanı, sunucu/replika kapsamı, izleme ayarı ve gözlem dönemi doğrulanmadan "kullanılmıyor" kararı verilmemelidir.

### Sahiplik için CODEOWNERS

```text
# .github/CODEOWNERS
/src/payments/       @payments-team
/src/identity/       @identity-team
/infra/production/   @platform-team
```

`git blame` geçmişteki katkıyı gösterir; CODEOWNERS ise bir daldaki inceleme sorumluluğunu tanımlar. İkisi de iş sahibinin kim olduğunu tek başına kanıtlamaz.

### Feature flag yaşam döngüsü kaydı

```yaml
flag_key: checkout_v2
owner: payments-team
created_at: 2026-02-01
expiry_at: 2026-05-01
state: 100_percent_enabled
cleanup_issue: PLAT-1234
rollback_owner: payments-oncall
last_reviewed_at: 2026-10-15
```

Buradaki tarihler ve kimlikler temsilidir. Önemli olan alanlardır: bu örnekte son kullanma tarihi çoktan geçmiş, yani bayrak temizlik sırasını bekliyor.

### Canary karar kuralı

```text
DEVAM:
- hata oranı SLO sınırları içinde
- p95 gecikme baseline ile uyumlu
- iş KPI'ları değişmedi
- denetim / veri mutabakatı başarılı

BEKLE:
- telemetri eksik ya da örneklem yetersiz
- kritik bir tüketicinin teyidi bekleniyor

GERİ DÖN:
- SLO yakma hızı eşiği aşıldı
- veri tutarsızlığı görüldü
- zorunlu bir denetim ya da güvenlik kontrolü kayboldu
```

## 16. Sınırlar: Yanlış pozitif ve yanlış negatifler

| Hata türü | Örnek | Nasıl azaltılır? |
|---|---|---|
| Yanlış pozitif | Yansıma ile çağrılan metot, yıllık rapor, DR kodu, eklenti giriş noktası, dış sistemin kullandığı API | Çalışma zamanı + sözleşme + iş takvimi + sahip onayı |
| Yanlış negatif | İç çağrı grafiğinde erişilebilir ama dışarıdan hiç tetiklenmeyen uç; ölü bağımlılık; gereksiz olduğu hâlde çağrılmaya devam eden özellik | API ve iş bağlamı analizi; yalnızca çağrı grafiğine güvenmemek |
| Ölçüm körlüğü | Örnekleme, log saklama süresi, telemetri kesintisi, hatalı enstrümantasyon | Kapsam envanteri, sıfırlama ve veri kalitesi kaydı |
| Ortam farkı | Prod/staging, bölge, tenant, platform ya da yapılandırma farkları | Yapılandırma matrisi ve temsil edici testler |
| Gelecek ihtiyacı | Henüz kullanılmayan ama sözleşme ya da yol haritası gereği korunması gereken kod | Ürün yaşam döngüsü ve son kullanma/gözden geçirme mekanizması |

> **Kesinlik beyanı:** Genel amaçlı sistemlerde tek bir statik analiz, bytecode incelemesi, kapsam raporu, sıfır API trafiği ya da LLM çıktısı **%100 ölü kod kanıtı** sağlayamaz. Pratikte "kesin tespit"; kapsamı tanımlanmış bir sistem, yeterli bir gözlem süresi, birbirinden bağımsız kanıtlar, bilinen istisnalar ve yetkili onayların birleşimidir.
{: .callout .danger}

Bu yazı genel bir kurumsal çerçevedir; hukuki görüş, belirli bir teknoloji için araç seçimi ya da canlı bir sistemde silme talimatı değildir. Kurum standardına dönüştürmeden önce araç isimleri, risk eşikleri, gözlem süreleri, onay mercileri, veri saklama takvimi ve geri dönüş hedefleri (RTO/RPO) kurumun kendi politikasıyla doldurulmalıdır.

## Kapanış

Küçük bir projede ölü kod temizliği bir geliştiricinin bir öğleden sonrasını alır. Kurumsal bir yapıda ise asıl iş kodu silmek değil, **kimin, hangi kanıtla, hangi riski kabul ederek** sildiğini görünür kılmaktır. Kanıt seviyeleri, risk matrisi, net karar hakları ve geri dönüş planı bir kez kurulduğunda, temizlik korkulan bir operasyon olmaktan çıkar ve sıradan, ölçülebilir bir bakım işine dönüşür.

## Kaynaklar

- [PostgreSQL: The Cumulative Statistics System](https://www.postgresql.org/docs/current/monitoring-stats.html): fonksiyon ve tablo istatistikleri, `track_functions`, sayaçların güncellenme davranışı.
- [OpenTelemetry: Semantic Conventions](https://opentelemetry.io/docs/concepts/semantic-conventions/): iz, metrik ve log alanlarının ortak isimlendirilmesi.
- [AWS Well-Architected: Operational Readiness and Change Management](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/operational-readiness.html): operasyonel hazırlık, runbook ve geri dönüş yönetimi.
- [GitHub Docs: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners): CODEOWNERS ile depo sahipliği ve inceleme sorumluluğu.
- [ICO: Storage limitation principle](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/): UK GDPR saklama sınırlaması ilkesi.
- [NIST: Secure Software Development Framework (SSDF)](https://csrc.nist.gov/projects/ssdf): güvenli geliştirme pratiklerinin yazılım yaşam döngüsüne yerleştirilmesi.
- [Google SRE Workbook: Canarying Releases](https://sre.google/workbook/canarying-releases/): kademeli dağıtım, kontrol grubu ve ölçümün atfedilebilirliği.
- [SonarQube: About new code](https://docs.sonarsource.com/sonarqube-server/user-guide/about-new-code): quality gate ve yeni koda odaklanma.
