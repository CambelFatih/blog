---
title: "Ölü Kod Nasıl Bulunur ve Güvenle Silinir? Kapsamlı Rehber"
date: 2026-11-10 20:00:00 +0000
categories: [softw, tech]
tags: [Dead code, Ölü kod, Refactoring, Teknik borç, Statik analiz, Feature flag, Telemetri]
description: "Ölü kod nasıl bulunur, gerçekten ölü olduğu nasıl kanıtlanır? Statik analiz, telemetri, tombstone, veritabanı, bağımlılıklar ve güvenli silme süreci."
image: /assets/images/posts/olu-kod-nasil-bulunur-ve-guvenle-silinir.png
---
Her büyüyen kod tabanı zamanla bir tavan arasına dönüşür. Kaldırılan bir entegrasyondan kalan metotlar, artık kimsenin açmadığı bir rapor ekranı, yıllar önce kapatılmış bir özelliğin bayrağı… Bunların hepsi derlenir, test edilir, güvenlik taramasından geçer ve her yeni geliştiricinin kafasını karıştırır; ama hiçbiri işe yaramaz.

Daha önce [Dead Code ve Forgotten Code]({{ '/2025/10/29/dead-code-ve-forgotten-code/' | relative_url }}) yazısında ölü kodun ne olduğunu ve günlük işte nasıl fark edileceğini anlatmıştım. Bu yazıda bir adım ileri gidiyorum: büyük sistemlerde ölü kodu **sistematik olarak bulmak**, bulunan kodun **gerçekten ölü olduğunu kanıtlamak** ve onu **hiçbir şeyi bozmadan silmek** için kullanılan yöntemleri tek bir yol haritasında topluyorum. Çünkü asıl zor olan ölü kodu bulmak değil, "bunu silersem bir yer patlar mı?" sorusuna emin bir cevap vermek.

## Ölü kod tam olarak nedir?

Literatürde ölü kod (dead code) iki şekilde tanımlanır: **çalışan ama sonucu programın çıktısını hiç etkilemeyen** kod ve kontrol akışı (control flow) yüzünden **hiçbir koşulda erişilemeyen** (unreachable) kod. Pratikte bu tanımı biraz genişletmek gerekiyor, çünkü büyük sistemlerde ölü olan yalnızca kaynak koddaki satırlar değil:

| Tür | Örnek |
|---|---|
| Erişilemeyen kod | `return` sonrasındaki satırlar, `if (false)` içindeki blok |
| Ölü atama (dead store) | Bir değişkene atanıp hiç okunmadan üzerine yazılan değer |
| Kullanılmayan kod | Hiçbir yerden çağrılmayan sınıf, metot veya API ucu |
| Ölü bağımlılık | `package.json` ya da `.csproj` içinde duran ama hiç kullanılmayan kütüphane |
| Ölü veritabanı nesnesi | Kimsenin çağırmadığı saklı yordam (stored procedure), view veya trigger |
| Ölü altyapı ve yapılandırma | Boşta duran sunucu tanımları, kalıcılaşmış ama silinmemiş feature flag'ler |

## Neden uğraşmaya değer?

Ölü kod "zaten çalışmıyor, kime zararı var?" diye görmezden gelinmeye çok müsait. Oysa bedelini her gün öderiz:

- **Teknik borç ve bilişsel yük:** Kodu okuyan herkes ölü kısmı da anlamaya çalışır. Yanlış yerde hata ayıklamak, yanlış metodu genişletmek bundan doğar.
- **Derleme ve test süresi:** Kullanılmayan her proje, sınıf ve test CI hattında zaman ve para harcar.
- **Güvenlik yüzeyi:** Unutulmuş bir API ucu ya da güncellenmeyen bir kütüphane, saldırganın en sevdiği kapıdır. Kimsenin sahiplenmediği kod, kimsenin yamalamadığı koddur.
- **Altyapı maliyeti:** Ölü koda hizmet eden sunucular, kuyruklar ve veritabanı nesneleri bulut faturasında gerçek bir kalemdir.

## Yol haritası: keşif, teyit, silme

Bu yazının geri kalanı şu akışı izliyor. Her adım bir öncekinin yanlış pozitiflerini (false positive) elemek için var:

```text
[Şüpheli kod] → [Statik + dinamik keşif] → [Üretimde teyit] → [Sahip ve iş onayı]
             → [Karantina (deprecation)] → [Atomik silme] → [Sürekli izleme]
```

## 1. Aşama: Şüphelileri bulmak

### Statik analiz

Statik analiz, kodu çalıştırmadan kaynak kodun soyut sözdizimi ağacı (Abstract Syntax Tree, AST) ve bağımlılık grafikleri üzerinden inceler. Hızlıdır, bütün depoyu (repository) dakikalar içinde tarar. Üç temel tekniğe dayanır:

- **Canlılık analizi (liveness analysis):** Bir değişkene atanan değerin programın geri kalanında okunup okunmadığını kontrol eder. Okunmadan üzerine yazılan değer ölü atamadır (dead store).
- **Erişilebilirlik analizi (reachability analysis):** Kontrol akış grafiğinin (Control Flow Graph, CFG) çıkmaz sokaklarını bulur: `return` sonrası satırlar, her zaman yanlış olan koşulların içi.
- **Çağrı grafiği haritalama (call graph):** Tüm kod tabanındaki çağrı ilişkilerini çıkarır ve hiçbir yerden referans almayan sınıf ve metotları listeler. Meta'nın kod ve varlık temizliği için geliştirdiği SCARF (Systematic Code and Asset Removal Framework) bu yaklaşımı şirket ölçeğinde, kod tabanı genelindeki bağımlılık grafiği üzerinden uygular.

C# derleyicisi ve analizörleri ilk iki türü zaten yakalar:

```csharp
public decimal Hesapla(Siparis siparis)
{
    var indirim = IndirimGetir(siparis); // IDE0059: değer hiç okunmadan ezilir (dead store)
    indirim = 0m;

    return siparis.Tutar - indirim;
    Log("hesaplandı");                   // CS0162: erişilemeyen kod
}
```

Kullanılmayan özel (private) üyeler için IDE0051/IDE0052, SonarQube'da "unused private method" ve "dead store" kuralları, Go'da `deadcode` ve `staticcheck`, Python'da `vulture`, JavaScript/TypeScript'te `knip` aynı işi görür.

Statik analizin büyük kör noktası **dinamik davranışlardır.** Yansıma (reflection), dinamik sınıf yükleme, bağımlılık enjeksiyonu (DI) konteynerleri, serileştirme ve çalışma zamanında oluşturulan çağrılar çağrı grafiğinde görünmez. Örneğin bir ASP.NET Core controller'ı kodda hiçbir yerden çağrılmaz; onu çerçeve, yönlendirme kuralları üzerinden yansıma ile çalıştırır. Bir kütüphanenin `public` API'si de başka depolardaki müşteriler tarafından kullanılıyor olabilir. Bu yüzden statik analizin çıktısı bir **şüpheli listesidir**, silme listesi değil.

### Derlenmiş çıktı analizi

Kaynak kod yerine gerçekten sevk edilen paketi incelemek de değerli bir kaynaktır. Java ve Android dünyasında ProGuard/R8 küçültme (shrinking) aşamasında kullanılmayan sınıf ve metotları çıkarır ve `-printusage` seçeneğiyle attıklarını listeler. .NET'te IL kırpma (trimming), yayın paketinden ulaşılamayan kodu ayıklar; C/C++ bağlayıcıları `--gc-sections` ile kullanılmayan bölümleri atar. Bu araçların "şunları attım" raporu, hazır bir ölü kod envanteri gibi okunabilir. Aynı sınırlama burada da geçerlidir: yansıma ile çağrılan kod için bu araçlara elle "dokunma" kuralı yazmak gerekir; o kurallar da kendi başına bir ipucudur.

### Dinamik analiz: test kapsamı

Testler çalışırken hangi satırın ve dalın (branch) hiç tetiklenmediğini haritalamak, statik analizin göremediği dinamik çağrıları yakalamaya yardımcı olur. Java'da JaCoCo, JavaScript'te Istanbul/Jest, .NET'te Coverlet bu işin standart araçlarıdır. Birim, entegrasyon ve uçtan uca testlerin birlikte hiç dokunmadığı kod, güçlü bir adaydır.

Ama dikkat: kapsam raporu "testler bu koda uğramıyor" der, "bu kod ölü" demez. Belki yalnızca testi yazılmamıştır. Test yazmanın sınırlarını [Unit Test Nedir, Ne Değildir?]({{ '/2025/09/30/unit-test-nedir/' | relative_url }}) yazısında ayrıca ele almıştım.

### Yapay zekâ destekli tespit

Son dönemde büyük dil modelleri (LLM) de bu alana girdi. 2025'te yayımlanan **DCE-LLM** çalışması iki aşamalı bir yöntem öneriyor: önce CodeBERT gibi küçük bir model, şüpheli satırları işaretleyen bir seçici olarak çalışıyor; ardından bir LLM bu satırların neden kullanılmadığına ya da neden erişilemez olduğuna dair gerekçeli bir değerlendirme üretiyor. Böylece klasik araçların kaçırdığı, iş mantığına gömülü ölü kodlar da yakalanabiliyor.

LLM'in güçlü yanı kodun ne yapmaya çalıştığını "anlayabilmesi"; zayıf yanı ise halüsinasyon riski ve kesin bir kanıt sunamaması. Bu yüzden LLM çıktısı da teyit gerektiren bir şüpheli listesi olarak ele alınmalı.

## 2. Aşama: "Gerçekten ölü mü?" sorusunu teyit etmek

Ölü kod temizliğindeki en büyük risk, yalnızca nadir bir iş koşulunda çalışan canlı bir kodu ölü sanıp silmektir. Ay sonu kapanışında, yılda bir kez yapılan bir raporlamada ya da yalnızca belirli bir müşteri tipinde çalışan kod, testlerde ve statik analizde ölü görünebilir. Teyit aşamasının amacı bu yanılgıyı önlemek.

### Üretim telemetrisi ve sürekli profilleme

Test ortamında çalışmayan kod, canlıda kullanıcı davranışına bağlı olarak çalışıyor olabilir. Bunu öğrenmenin en güvenilir yolu üretimden veri toplamaktır:

- **Hafif loglama veya metrik:** Şüpheli fonksiyonun ilk satırına performansı etkilemeyecek bir sayaç ya da OpenTelemetry izi eklenir ve belirli bir süre izlenir. Süre, iş takvimini kapsamalı: ay sonu, çeyrek sonu, yıl sonu kapanışları.
- **Sürekli profilleme (continuous profiling):** Üretimdeki CPU çağrı ağaçlarından hangi fonksiyonun ne sıklıkla çalıştığı izlenir. Kod eklemeden geniş bir resim verir, ama örnekleme yaptığı için nadir çağrıları kaçırabilir.

Telemetrinin kör noktası zamandır: 30 gün izlediğiniz kod, 31. gün çalışan yıllık bir işin parçası olabilir. Gözlem süresini iş birimlerinin takvimiyle birlikte belirlemek gerekir.

### Tombstone (mezar taşı) yöntemi

Tombstone, şüpheli kodun içine yerleştirilen ve çalıştığında uygulamayı asla durdurmayan, yalnızca izleme paneline sinyal gönderen küçük bir işarettir. Kod "dirilirse" haberiniz olur. .NET'te bunu yerleşik `System.Diagnostics.Metrics` ile birkaç satırda kurmak mümkün:

```csharp
using System.Diagnostics.Metrics;

public static class Tombstone
{
    private static readonly Meter Meter = new("Uygulama.OluKod");
    private static readonly Counter<long> Hits = Meter.CreateCounter<long>("tombstone.hits");

    // Uygulamayı durdurmaz; yalnızca "bu kod çalıştı" sinyali üretir.
    public static void Hit(string id) =>
        Hits.Add(1, new KeyValuePair<string, object?>("tombstone.id", id));
}

public Rapor EskiFormatlaDisaAktar(Siparis siparis)
{
    Tombstone.Hit("2026-11-eski-disa-aktarim");
    // ... mevcut kod olduğu gibi kalır
}
```

Sayaç OpenTelemetry ile panele aktarılır ve `tombstone.hits` sıfırdan büyük olduğunda alarm kurulur. Gözlem süresi boyunca alarm hiç çalmadıysa, kodun ölü olduğuna dair elinizde gerçek üretim verisi vardır.

### API ve ağ seviyesinde izleme

Mikroservis mimarilerinde bir metot, kod içindeki çağrı grafiğine göre canlı görünebilir; ama ona giden kapı, yani API ucu (endpoint), aylardır hiç istek almıyor olabilir. Service mesh (Istio, Linkerd) ya da API Gateway (Kong, APISIX) seviyesindeki trafik verisi bunu açıkça gösterir. Bir uca aylarca sıfır istek geliyorsa, arkasındaki bütün kod zinciri güçlü bir adaydır.

Burada da bir uyarı var: zamanlanmış işler (cron), mesaj kuyruğu tüketicileri ve servis içi doğrudan çağrılar gateway'den geçmez. Kuyruk konularını (topic) ve iş zamanlayıcılarını da ayrıca kontrol etmek gerekir.

### Sembolik yürütme ve diferansiyel test

Matematiksel kesinlik isteyen durumlarda iki teknik öne çıkar:

- **Dinamik sembolik yürütme (dynamic symbolic execution):** Araç, koda giden yolları bir kısıt (path constraint) olarak çıkarır ve bir çözücüyle o koda ulaşan herhangi bir girdi kombinasyonu olup olmadığını arar. Hiçbir kombinasyon yoksa kodun ulaşılamaz olduğu kanıtlanmış olur.
- **Diferansiyel test (differential testing):** Ölü kod temizlenmeden önceki ve sonraki sürüm, aynı otomatik üretilmiş girdilerle çalıştırılır ve çıktılar karşılaştırılır. Fark çıkmıyorsa temizlik davranışı değiştirmemiştir.

Bu tekniklerin bedeli ölçektir: yol sayısı dallanmayla birlikte üstel olarak büyür (path explosion) ve büyük sistemlerde analiz pratikte bitirilemez hâle gelebilir. Genellikle kritik ve sınırlı modüllerde kullanılırlar.

### Feature flag ile kademeli kapatma

Şüpheli kod yolu bir özellik bayrağının (feature flag) arkasına alınır ve önce trafiğin küçük bir kısmında, örneğin %1'inde, sonra kademeli olarak %100'ünde devre dışı bırakılır. Hiçbir hata, şikâyet ya da metrik sapması görülmezse kod güvenle silinebilir. Sorun çıkarsa geri almak bir bayrağı çevirmek kadar kolaydır; yeniden dağıtım (deploy) gerekmez.

### Git geçmişi

Kodun hikâyesi çoğu zaman teyidi hızlandırır. `git blame` kodu kimin, ne zaman yazdığını; `git log -S "MetotAdi" --oneline` o ismin hangi commit'lerde eklenip çıkarıldığını gösterir. İki yıl önce kaldırılmış bir ödeme entegrasyonunun unutulmuş parçası olduğu anlaşılan bir kod için uzun bir gözlem süresine gerek kalmayabilir.

## Gözden kaçan dört kör nokta

Uygulama kodunu temizlemek işin yalnızca bir kısmı. Büyük kurumsal sistemlerde operasyonu ya durduran ya da felakete sürükleyen dört alan var.

### 1. Veritabanındaki ölü kod

Uygulamadaki kod silinse bile veritabanındaki kullanılmayan saklı yordamlar, trigger'lar, view'lar ve fonksiyonlar orada kalır. Trigger'lar her yazma işleminde çalışmaya, kaynak tüketmeye ve kilitlenmelere (deadlock) yol açmaya devam edebilir.

Çözüm, veritabanının kendi istatistiklerine bakmaktır. SQL Server'da önbellekte hiç çalışma izi olmayan saklı yordamlar şöyle listelenir:

```sql
SELECT p.name
FROM sys.procedures AS p
LEFT JOIN sys.dm_exec_procedure_stats AS ps
       ON ps.object_id = p.object_id AND ps.database_id = DB_ID()
WHERE ps.object_id IS NULL;
```

İndeks kullanımı için `sys.dm_db_index_usage_stats` aynı işi görür. PostgreSQL'de `track_functions` ayarı açıldığında `pg_stat_user_functions`, kullanılmayan indeksler için de `pg_stat_user_indexes` (`idx_scan = 0`) kullanılır.

Önemli bir ayrıntı: bu istatistikler sunucu yeniden başladığında ya da plan önbelleği temizlendiğinde sıfırlanır. Tek bir anlık görüntü kanıt değildir; sorguyu aylar boyunca düzenli çalıştırıp sonuçları biriktirmek gerekir. Tespit edilen nesneler, onları kullanan uygulama koduyla aynı anda şemadan kaldırılmalıdır.

### 2. Hayalet bağımlılıklar

Kendi kodunuzu temizleyebilirsiniz; ama `package.json`, `pom.xml`, `go.mod` ya da `.csproj` dosyalarında duran ve hiç kullanılmayan üçüncü parti kütüphaneler projeyi şişirmeye devam eder. Daha kötüsü, bu paketler projeye dışarıdan güvenlik açığı (vulnerability) taşıyabilir: kullanmadığınız bir kütüphanedeki açık için de güvenlik uyarısı alırsınız ve onu güncel tutmak zorunda kalırsınız.

Maven için DepClean, Node.js için `depcheck`, `npm-check` ya da `knip`, Python için `deptry` gibi araçlar kod tabanında hiçbir yerden çağrılmayan bağımlılıkları raporlar. Bunlar da projeden tamamen kaldırılır.

### 3. Regülasyon gereği "çalışmaması gereken" kod

Bütün analizler ve ürün sahipleri bir kodun hiç çalışmadığını söyleyebilir; ama bazı kodlar zaten çalışmamak için vardır. KVKK, GDPR, HIPAA ya da bankacılık düzenlemeleri gereği yalnızca bir veri sızıntısı, siber saldırı ya da regülatör denetimi anında devreye girmesi gereken olay kayıt (audit/forensic) kodları ve felaket kurtarma (disaster recovery) yolları yıllarca tetiklenmeyebilir. Araçlar bunları ölü görür.

Bu yüzden silme sürecine hukuk ve uyum (compliance) ekiplerinin onayını içeren bir adım eklenmelidir. Yasal zorunluluktan duran kod silinmez; ekibin tanımladığı bir öznitelikle (örneğin `[RegulatoryKeep("KVKK olay kaydı")]` gibi) ya da analiz aracının bastırma mekanizmasıyla işaretlenir ve gerekçesiyle birlikte tarama dışında tutulur. Böylece bir sonraki temizlikte aynı tartışma tekrar yaşanmaz.

### 4. Altyapı kodu ve feature flag borcu

Modern sistemlerde altyapı da kodla yönetilir (Infrastructure as Code, IaC). Uygulama tarafındaki ölü kodu sildiğinizde ona hizmet eden Kubernetes `deployment.yaml` dosyaları, Terraform/Ansible tanımları ve boşta dönen bulut kaynakları çoğu zaman unutulur ve fatura kesmeye devam eder.

Feature flag'ler de zamanla borca dönüşür (toggle debt). Görevini tamamlamış ve %100 açık kalıcı hâle gelmiş bir özelliğin bayrağı, hem kodda gereksiz bir `if` hem de flag yönetim aracında (LaunchDarkly, Unleash vb.) eski bir kural olarak yaşar. Ömrü dolan bayrakların hem kuralları hem de koddaki dalları temizlenmeli, ardından ölü koda hizmet eden altyapı tanımları silinmelidir. Bu adım, ölü kod temizliğinin doğrudan para tasarrufuna dönüştüğü yerdir.

## Keşiften silmeye: Ölü kod yaşam döngüsü

Büyük sistemlerde ölü kod temizliği teknik bir taramadan çok bir risk ve süreç yönetimi (governance) işidir. Bulunan kodun kazara silinmesini önlemek için şu disiplinli akış işe yarar:

```text
[Keşif] → [Sahip ve iş onayı] → [Karantina (deprecation)] → [Atomik silme] → [Geri dönüş hazırlığı]
```

### Adım 1: Sahipliği belirlemek

Büyük projelerde en zor soru "Bu kodu kim yazdı, ne işe yarıyor?" sorusudur. `git blame` ve `CODEOWNERS` dosyası ile şüpheli kodun ait olduğu ekip belirlenir ve kod, o ekibin panosuna bir teknik borç kaydı olarak atanır. Sahibi olmayan kodun kararını kimse vermez; bu adım atlanırsa süreç orada tıkanır.

### Adım 2: İş ve mevzuat kontrolü

Bazı bilgiler hiçbir araçta yoktur, yalnızca iş analistlerinin ve ürün sahiplerinin aklındadır: dört yılda bir yapılan yasal bir raporlama, yalnızca büyük bir kriz anında devreye giren bir acil durum akışı gibi. Kod silinmeden önce ürün sahibinden "bu özellik artık sunulmuyor" onayı yazılı olarak, tercihen kaydın üzerinde alınır. Regülasyon şüphesi varsa hukuk ve uyum ekipleri de bu adıma dahil olur.

### Adım 3: Karantina (deprecation)

Kod doğrudan silinmez, önce karantinaya alınır. Dilin kendi işaretleme mekanizması kullanılır: Java'da `@Deprecated`, C++'ta `[[deprecated]]`, C#'ta `[Obsolete]`:

```csharp
[Obsolete("Eski dışa aktarım. 2027.1 sürümünde kaldırılacak; yerine RaporServisi.DisaAktar kullanın.",
          DiagnosticId = "OLU001")]
public Rapor EskiFormatlaDisaAktar(Siparis siparis) { /* ... */ }
```

Böylece kodu yeni çağırmaya kalkan bir geliştirici derleme anında uyarı alır. Kod bu hâliyle bir veya iki ana sürüm boyunca tutulur; tombstone ve telemetri bu süre içinde de izlenmeye devam eder.

### Adım 4: Atomik silme

Silme anı geldiğinde yalnızca o satırları silip geçmek zincirleme sorunlara yol açabilir. Kodla birlikte ona bağlı yapılandırma dosyaları, veritabanındaki artık kolonlar ve nesneler (schema migration ile), CI/CD hattı parametreleri, testler, feature flag kuralları ve altyapı tanımları da aynı anda temizlenir. Buna **atomik silme** (atomic deletion) denir: ya hepsi gider ya hiçbiri.

### Adım 5: Geri dönüş hazırlığı

Silme işlemi, içinde başka hiçbir değişiklik olmayan tek bir bağımsız commit veya pull request olarak yapılmalıdır. Canlıda beklenmedik bir sorun çıkarsa `git revert <commit>` ile sistem dakikalar içinde eski hâline döndürülebilir. Silmeyi bir özellik geliştirmesinin içine gömmek, geri dönüşü imkânsız değilse bile çok pahalı hâle getirir. Bu commit'in nasıl test edilip yayına çıktığını [CI/CD Pipeline Nedir?]({{ '/2026/04/08/ci-cd-pipline-nedir/' | relative_url }}) yazısında anlattığım hat belirler.

## Temizliği kalıcı hâle getirmek

Ölü kod bir kez temizlenip unutulacak bir şey değildir; tırnak kesmek gibi düzenli bakım ister. Bunu kalıcı kılmak için iki alışkanlık öne çıkıyor:

- **Düzenli bakım payı:** Her sprint'in belli bir kısmını, sık önerilen oranla %10–20'sini, teknik borç ve ölü kod temizliğine ayırmak. Böylece temizlik "vakit kalırsa yapılacak iş" olmaktan çıkar.
- **CI/CD kalite kapıları (quality gates):** SonarQube gibi araçları ya da derleyici uyarılarını hata sayan ayarları (.NET'te `TreatWarningsAsErrors`) CI hattına bağlamak. Yeni eklenen ve hiçbir yerde kullanılmayan yerel değişkenler veya özel metotlar ana dala birleşmeden reddedilir; ölü kod daha doğmadan engellenir.

## Yöntemlerin karşılaştırması

| Yöntem | Aşama | En güçlü yönü | Kör noktası |
|---|---|---|---|
| Statik analiz | Keşif | Çok hızlı, bütün depoyu tarar | Yansıma ve dinamik çağrıları kaçırır |
| Derlenmiş çıktı analizi | Keşif | Gerçekten sevk edilen kodu görür | Yansıma için elle kural gerekir |
| Test kapsamı | Keşif | Dinamik çağrıları da yakalar | Test eksikliğini ölü kodla karıştırabilir |
| LLM + AST hibrit | Keşif + akıl yürütme | İş mantığını anlayabilir | Halüsinasyon riski, kesin kanıt sunamaz |
| Üretim telemetrisi ve tombstone | Teyit | Gerçek kullanıcı verisine dayanır | Gözlem süresi dışında kalan nadir işleri kaçırır |
| API/ağ izleme | Teyit | Servis seviyesinde net sinyal verir | Kuyruk ve zamanlanmış işleri görmez |
| Sembolik yürütme | Teyit | Ulaşılamazlığı matematiksel olarak kanıtlar | Büyük sistemlerde yol patlaması ve yüksek işlem maliyeti |
| Feature flag ile kapatma | Teyit + silme | Geri alması anlıktır | Flag'in kendisi temizlenmezse yeni borç olur |

## Silmeden önce son kontrol listesi

Bir kodu silme kararından önce şu beş sorunun cevabı "evet" olmalı:

1. **Uygulama:** Statik, dinamik ve gerekiyorsa yapay zekâ destekli analizler yapıldı ve sonuçlar üretim telemetrisiyle teyit edildi mi?
2. **Ağ ve API:** Servis ve gateway seviyesinde trafiğin sıfır olduğu, kuyruklar ve zamanlanmış işler dahil doğrulandı mı?
3. **Veritabanı:** Koda bağlı tablolar, kolonlar, saklı yordamlar, trigger'lar ve view'lar kontrol edildi mi?
4. **Hukuk ve regülasyon:** Bu kod yasal olarak sistemde durması gereken bir acil durum veya denetim kodu değil mi?
5. **Altyapı:** Kod silindiğinde boşa çıkacak bulut kaynakları, IaC tanımları ve feature flag kuralları da temizlendi mi?

## Kapanış

Ölü kodu bulmak bugün hiç olmadığı kadar kolay; analizörler, kapsam araçları ve dil modelleri saniyeler içinde uzun bir aday listesi çıkarıyor. Zor olan, o listedeki her satır için "eminim" diyebilmek. Bu güveni tek bir araç vermiyor: statik analiz şüpheliyi gösteriyor, üretim verisi ve tombstone tanıklık ediyor, iş birimi ve hukuk onay veriyor, karantina ve atomik silme de olası bir hatanın bedelini küçültüyor.

Benim için en önemli ders şu oldu: ölü kod temizliği bir silme operasyonu değil, bir kanıt toplama sürecidir. Kanıtı sağlam olan kodu gönül rahatlığıyla silersiniz; kanıtı zayıf olanı ise karantinada bekletirsiniz. Her iki durumda da kod tabanı biraz daha okunur, biraz daha güvenli ve biraz daha ucuz hâle gelir.
