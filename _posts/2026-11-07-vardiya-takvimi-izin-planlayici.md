---
title: "Vardiya Takvimi ve İzin Planlayıcı: Off Günlerini Gör"
date: 2026-11-07 12:00:00 +0000
categories: [araclar, tech]
tags: [Vardiya takvimi, Yıllık izin, İzin hesaplama, 2+2+2 vardiya, Vardiyalı çalışma]
description: "2+2+2 ve diğer vardiya sistemlerinde hangi gün off, hangi gün iş başı olduğunu önceden gör; yıllık iznini off gününe harcamadan en verimli tarihi bul."
image: /assets/images/posts/vardiya-takvimi-izin-planlayici.png
---
Vardiyalı çalışan herkesin bildiği bir dert var: Birkaç hafta sonrası için izin planlarken o günlerde sabahçı mı, gececi mi yoksa off mu olacağını kafadan hesaplamak. Takvime bakıp parmakla saymak hem zaman alıyor hem de hataya açık. Sonuç çoğu zaman aynı oluyor: Zaten off olduğun bir güne yıllık izin yazdırıp o günü boşa harcamak.

Bu sorunu çözmek için tarayıcıda çalışan bir **vardiya takvimi ve izin planlayıcı** hazırladım. Vardiya sistemini ve döngüde bugün nerede olduğunu bir kez giriyorsun; takvim aylar, hatta bir yıl sonrasına kadar hangi gün hangi vardiyada, hangi gün off olduğunu gösteriyor. İzin almak istediğin tarihleri seçtiğinde de kaç günün zaten off'a denk geldiğini, yıllık izninden kaç gün düşmesi gerektiğini ve off'larınla birlikte kaç gün kesintisiz tatil yapacağını hesaplıyor.

<link rel="stylesheet" href="{{ '/assets/css/vardiya.css' | relative_url }}?v={{ site.time | date: '%s' }}">
<section id="vardiya-app" class="vp" aria-label="Vardiya takvimi ve izin planlayıcı"><noscript><p>Planlayıcı, tarayıcında JavaScript açıkken çalışır.</p></noscript></section>
<script src="{{ '/assets/js/vardiya.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>

## Planlayıcı nasıl kullanılır?

1. **Vardiya sistemini seç.** Liste gruplara ayrılmış durumda: 12 saatlik vardiyalar (2 gündüz, 2 gece, 2 off; 2+2+4; 12/24–12/48), 8 saatlik üçlü vardiyalar (2 sabah, 2 akşam, 2 gece, 2 off; 3+3+3; haftalık dönüşüm), 24 saatlik nöbetler ve gündüz mesaisi. Seninki yoksa "Döngüyü düzenle" bölümünden günleri sırayla ekleyerek kendi döngünü oluştur.
2. **Döngüdeki yerini belirt.** Bildiğin herhangi bir günü (örneğin bugünü) seç ve o gün döngünün kaçıncı gününde olduğunu işaretle. Planlayıcı geri kalan bütün günleri buna göre hesaplar.
3. **İzin tarihlerini gir.** Başlangıç ve bitiş tarihini yaz ya da takvimde iki güne dokun. Sonuç kartı anında güncellenir: izinden düşecek gün sayısı, zaten off olan günler, dilekçeye yazman gereken aralık ve işbaşı tarihi.
4. **Önerilere bak.** Kaç gün izin kullanmak istediğini yazarsan planlayıcı önümüzdeki aylarda bu izni en uzun tatile çeviren dönemleri listeler. Birine dokunduğunda takvimde görürsün.

Takvimde her vardiya ayrı bir renkle, off günleri **OFF** etiketiyle görünür. Yıllık izinden düşecek günler turuncu **İZİN** kutusuyla, izin dönemine denk gelen ya da hemen yanındaki off günleri ise turuncu çerçeveyle işaretlenir. Görünümü 1, 3, 6 ya da 12 aya ayarlayabilirsin.

Planlayıcı telefonda da rahat kullanılır. Dar ekranda adımlar sırayla alt alta dizilir: önce ayarlar, sonra sonuç, ardından takvim. Takvimde gün seçerken sonuç kartı ekranın dışında kalırsa altta kısa bir özet çubuğu çıkar; çubuğa dokunduğunda sonuca dönersin. Ayarların yalnızca tarayıcında saklanır; sayfayı bir dahaki açışında kaldığın yerden devam edersin, hiçbir veri sunucuya gönderilmez.

## Off gününe izin yazmak neden kayıp?

Off günü zaten çalışmadığın gündür. İzin dilekçesine off günlerini de kapsayan bir aralık yazdığında, iş yerinin uygulamasına göre bu günler de yıllık izninden düşülebilir. 4857 sayılı İş Kanunu'nun 56. maddesi, izin süresine rastlayan ulusal bayram, hafta tatili ve genel tatil günlerinin izin süresinden sayılmayacağını söyler. Ancak vardiyalı düzende hangi off gününün hafta tatili sayılacağı ve iznin nasıl hesaplanacağı iş yerine ve sözleşmeye göre değişebilir. Dilekçeyi yalnızca çalışma günlerini kapsayacak şekilde yazmak bu belirsizliği baştan ortadan kaldırır.

İkinci kazanç planlamada: İzni off günlerine yaslarsan aynı izin hakkıyla çok daha uzun bir tatil elde edersin.

## Örnek: 2 gündüz, 2 gece, 2 off düzeninde 4 gün izinle 8 gün tatil

12 saatlik vardiyada 2 gündüz, 2 gece ve 2 off'tan oluşan 6 günlük döngüyü düşünelim. 4 günlük izni off'ların hemen ardından, yani ilk gündüz vardiyasından başlatırsan izin bittiğinde bir sonraki off'lar başlar: 2 off + 4 izin + 2 off ile **8 gün** kesintisiz tatil.

Aynı 4 günü ilk gece vardiyasından başlatırsan araya 2 off girer ama tatilin iki ucu da çalışma gününe dayanır. Toplam tatil **6 günde** kalır.

| İzin başlangıcı | Kullanılan izin | Kesintisiz tatil |
|---|---|---|
| Off'lardan hemen sonra (1. gündüz) | 4 gün | 8 gün |
| Döngünün ortasında (1. gece) | 4 gün | 6 gün |

Aradaki 2 günlük fark yalnızca başlangıç gününü doğru seçmekten geliyor. Aynı mantık 8 saatlik 2 sabah, 2 akşam, 2 gece, 2 off düzeninde de geçerli: Orada 6 gün izinle 10 gün tatil yapılabiliyor. Planlayıcının 4. adımı bu hesabı senin döngün ve tarihlerin için otomatik yapar.

## Listedeki vardiya sistemleri

| Grup | Döngü | Uzunluk |
|---|---|---|
| 12 saat | 2 Gündüz, 2 Gece, 2 Off | 6 gün |
| 12 saat | 2 Gündüz, 2 Gece, 4 Off | 8 gün |
| 12 saat (12/24–12/48) | Gündüz, Gece, 2 Off | 4 gün |
| 12 saat | 4 Gündüz, 4 Off | 8 gün |
| 12 saat (12/36) | Gündüz, Off | 2 gün |
| 8 saat | 2 Sabah, 2 Akşam, 2 Gece, 2 Off | 8 gün |
| 8 saat | 3 Sabah, 3 Akşam, 3 Gece, 3 Off | 12 gün |
| 8 saat (haftalık dönüşüm) | 5 Sabah, 2 Off, 5 Akşam, 2 Off, 5 Gece, 2 Off | 21 gün |
| 24 saat (24/48) | 1 Nöbet, 2 Off | 3 gün |
| 24 saat (24/72) | 1 Nöbet, 3 Off | 4 gün |
| Gündüz mesaisi (6+1) | 6 gün çalışma, 1 Off | 7 gün |
| Gündüz mesaisi (5+2) | 5 gün çalışma, 2 Off | 7 gün |

"2+2+2" adı iş yerine göre hem 12 saatlik 2 gündüz, 2 gece, 2 off düzenini hem de 8 saatlik 2 sabah, 2 akşam, 2 gece, 2 off düzenini anlatabilir. Bu yüzden listede adlar yerine günler yazıyor. Emin değilsen döngüdeki günleri tek tek kontrol et; gerekirse kendi döngünü oluştur.

## Dikkat edilmesi gerekenler

- **Gece vardiyası ertesi güne taşar.** Son vardiyan gece ya da 24 saatlik nöbetse vardiya ertesi sabah biter. Planlayıcı bunu sonuç kartında ayrıca belirtir. İş yerinin gece vardiyasını hangi güne saydığını kontrol et.
- **Resmî tatiller ve bayramlar hesaba katılmaz.** Vardiyalı düzende bayramlarda da çalışılabildiği için planlayıcı yalnızca döngüye bakar. Bayram ve genel tatil günlerinin izinden düşüp düşmeyeceğini iş yerinle teyit et.
- **Döngü değişirse referansı güncelle.** Ekip değişikliği ya da vardiya kaydırması olduğunda 2. adımdaki tarihi ve vardiyayı yeniden gir.
- **Planı ekip arkadaşınla paylaş.** "Planı paylaş" düğmesi döngünü ve tarihlerini içeren bir bağlantı kopyalar. Aynı ekipteyseniz arkadaşın bağlantıyı açtığında aynı takvimi görür. "Dökümü kopyala" ise izin aralığını gün gün metin olarak verir; dilekçe ya da mesaj yazarken işine yarar.

## Kapanış

Yıllık izin, vardiyalı çalışan biri için yılın en değerli günleri. Birkaç dakikalık planlamayla aynı izin hakkından çok daha uzun tatiller çıkarmak mümkün. Bu tür küçük araçları geliştirmeye devam edeceğim; sınava hazırlananlar için yaptığım [KPSS deneme sınavı zamanlayıcısına]({{ '/2026/11/03/kpss-deneme-sinavi-zamanlayicisi/' | relative_url }}) da göz atabilirsin. Özel güvenlikte 12/24–12/48 düzeninde çalışıyor ya da bu mesleğe hazırlanıyorsan [özel güvenlik sınavı hazırlık notlarım]({{ '/2025/08/12/ozel-guvenlik-sinavi-hazirlik/' | relative_url }}) da işine yarayabilir.
