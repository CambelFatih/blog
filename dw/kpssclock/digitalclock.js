// Başlangıç saati, dakikası ve saniyesi
var h = 10;
var m = 15;
var s = 0;

function updateClock() {
    // Saniyeyi artır
    s++;
    if (s === 60) {
        s = 0;
        m++;
        if (m === 60) {
            m = 0;
            h++;
            if (h === 13) {
                h = 1;
            }
        }
    }

    // Tek haneli sayıları çift haneli yap
    var hDisplay = (h < 10) ? "0" + h : h;
    var mDisplay = (m < 10) ? "0" + m : m;
    var sDisplay = (s < 10) ? "0" + s : s;
  
    var time = hDisplay + ":" + mDisplay + ":" + sDisplay;
    
    var clockElement = document.getElementById("MyClockDisplay");
    if (clockElement) {
        clockElement.textContent = time;
    }

    // Analog saati güncelle
    var hourHand = document.getElementById('hour');
    var minuteHand = document.getElementById('minute');
    var secondHand = document.getElementById('second');
  
    if (hourHand && minuteHand && secondHand) {
        var hourRotation = (h % 12) * 30 + m * 0.5;
        var minuteRotation = m * 6;
        var secondRotation = s * 6;

        hourHand.style.transform = `rotate(${hourRotation}deg)`;
        minuteHand.style.transform = `rotate(${minuteRotation}deg)`;
        secondHand.style.transform = `rotate(${secondRotation}deg)`;
    }
}

// 1 saniyede bir otomatik çalıştır (setTimeout yerine daha temiz bir yöntem)
setInterval(updateClock, 1000);

// İlk açılışta hemen çalışması için
updateClock();
