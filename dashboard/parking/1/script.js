
try {
  fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' })).then(function(response) {
    return true;
  }).catch(function(e) {
    var carbonScript = document.createElement("script");
    carbonScript.src = "//cdn.carbonads.com/carbon.js?serve=CE7DC2JW&placement=wwwcssscriptcom";
    carbonScript.id = "_carbonads_js";
    document.getElementById("carbon-block").appendChild(carbonScript);
  });
} catch (error) {
  console.log(error);
}
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LLWL5N9CSM');


  var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['% 10 Dolu: 10', '% 90 Boş: 90'],
    datasets: [{
      data: [10, 90],
      backgroundColor: ['#444444', '#0D6EFD'],
      borderWidth: 0 // Border kalınlığını 0 olarak ayarla
    }]
  },
  options: {
    responsive: false, // Responsive özelliği devre dışı bırakılır
    maintainAspectRatio: false, // Boyut oranı korunmaz
    legend: {
      position: 'right' // Etiketlerin sol tarafa hizalanması
    }
  }
});

var map = L.map('map').setView([41.0158, 29.0576], 15); // İlk konum ve yakınlaştırma seviyesi ayarlanır

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var marker = L.marker([41.0158, 29.0576]).addTo(map); // İşaretlenen konumun enlem ve boylam değerleri

marker.bindPopup("<b>Acıbadem Açık Otoparkı</b> <br> <a href='https://www.google.com/maps?q=41.0158,29.0576' target='_blank'>Google Haritalar'da görüntüle</a>").openPopup();

// API'den veriyi çekme
fetch('https://api.ibb.gov.tr/ispark/Park')
  .then(response => response.json())
  .then(data => {
    const tbody = document.querySelector('.fluid-table tbody');

    // Verileri kullanarak tabloya satır ekleme ve grafik oluşturma
    data.forEach(park => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Park Adı">${park.parkName}</td>
        <td data-label="Kapasite">${park.capacity}</td>
        <td data-label="Boş Kapasite"><canvas id="chart-${park.parkID}"></canvas></td>
        <td data-label="Çalışma Saatleri">${park.workHours}</td>
        <td data-label="Otopark Türü">${park.parkType}</td>
        <td data-label="Ücretsiz Süre">${park.freeTime}DK</td>
        <td data-label="İlçe">${park.district}</td>
        <td data-label="Açık mı?">${park.isOpen ? 'Evet' : 'Hayır'}</td>
      `;
      tbody.appendChild(row);


      const bos = park.emptyCapacity;
      const dolu = park.capacity - bos;
 
      // Dolu ve boş oranları hesaplama
      let doluOran = 0;
      let bosOran = 0;
      if (dolu !== 0) {
        doluOran = (dolu / park.capacity) * 100;
        bosOran = 100 - doluOran;
      } else if (bos !== 0) {
        bosOran = (bos / park.capacity) * 100;
        doluOran = 100 - bosOran;
      }

      // Yuvarlama işlemi için toFixed() kullanabilirsiniz
      const yuvarlanmisDoluOran = doluOran.toFixed(0); // İki ondalık basamağa yuvarlama
      const yuvarlanmisBosOran = bosOran.toFixed(0); 
      // Pie grafik oluşturma
      const ctx = document.getElementById(`chart-${park.parkID}`).getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['%'+yuvarlanmisDoluOran+ ' Dolu:'+dolu+'','%'+yuvarlanmisBosOran+' Boş:'+park.emptyCapacity+''],
          datasets: [{
            data: [dolu, park.emptyCapacity],
            backgroundColor: ['#444444', '#0D6EFD'],
            borderWidth: 0
          }]
        }
      });
    });
  })
  .catch(error => {
    console.error('Veri çekme hatası:', error);
  });
