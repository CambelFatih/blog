
const pages = document.querySelectorAll('.page');
const prevButton = document.querySelector('.prev-button');
const nextButton = document.querySelector('.next-button');
const pageInput = document.getElementById("page-input");

let currentPageIndex = 0;

// Sayfa yüklendiğinde son sayfa numarasını localStorage'dan al ve göster
window.addEventListener('load', function() {
  const lastPageIndex = parseInt(localStorage.getItem('lastPageIndex'));
  if (lastPageIndex && lastPageIndex < pages.length) {
    showPage(lastPageIndex);
    pageInput.value = lastPageIndex+1;
  } else {
    showPage(0);
  }
});


document.getElementById('page-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    var pageIndex = parseInt(event.target.value) - 1;
    if (pageIndex >= 0 && pageIndex < pages.length) {
      showPage(pageIndex);
    }
  }
});

// Sayfa yüklendiğinde ekran genişliği kontrol edilir
window.addEventListener('load', function() {
    var isMobile = window.innerWidth < 768;
  
    // `isMobile` değişkeni CSS dosyasında kullanılmak üzere kök değişkenlere atanır
    if (isMobile) {
      document.documentElement.style.setProperty('--is-mobile', 'true');
    }
  });
  
function showPage(pageIndex) {
  pages[currentPageIndex].classList.remove('active');
  pages[pageIndex].classList.add('active');
  currentPageIndex = pageIndex;
  localStorage.setItem('lastPageIndex', pageIndex); // Şimdiki sayfa numarasını localStorage'a kaydet
}


//showPage(0); // İlk sayfanın otomatik olarak yüklenmesi

prevButton.addEventListener('click', function() {
  if (currentPageIndex > 0) {
    showPage(currentPageIndex - 1);
    pageInput.value = currentPageIndex+1;
  }
});

nextButton.addEventListener('click', function() {
  if (currentPageIndex < pages.length - 1) {
    showPage(currentPageIndex + 1);
    pageInput.value = currentPageIndex+1;
  }
});

function toggleMode() {
  var body = document.getElementsByTagName("body")[0];
  var icon = document.getElementById("icon");
  if (body.classList.contains("gunduz")) {
    body.classList.remove("gunduz");
    body.classList.add("gece");
    icon.src = "https://www.kuyza.com/wp-content/uploads/2023/04/dark.png";
  } else if (body.classList.contains("gece")) {
    body.classList.remove("gece");
    body.classList.add("gunduz");
    icon.src = "https://www.kuyza.com/wp-content/uploads/2023/04/brightness.png";
  } else {
    body.classList.add("gece");
    icon.src = "https://www.kuyza.com/wp-content/uploads/2023/04/dark.png";
  }
}

function toggleAciklamaMetni(aciklamaMetniId) {
  var aciklamaMetni = document.getElementById(aciklamaMetniId);
  if (aciklamaMetni.style.display === "none") {
    aciklamaMetni.style.display = "block";
  } else {
    aciklamaMetni.style.display = "none";
  }
}

pageInput.addEventListener("click", function() {// bu kod sayfaları numarayla gezmemizi sağlayan textboxın saydamlığını ayarlıyor.
  pageInput.style.opacity = "1";
});

pageInput.addEventListener("blur", function() {
  pageInput.style.opacity = "0.2";
});


tippy('.tooltip-trigger', {
  content(reference) {
    const tooltipIpa = reference.getAttribute('data-tooltip-ipa');
    const tooltipDef = reference.getAttribute('data-tooltip-definition');
    return `
        <div>
          <div class="tooltip-header">
            <span class="tooltip-ipa">${tooltipIpa}</span>
            <button class="tooltip-audio-button">
              <img src="sound.png" alt="icon">
              <audio>
                <source src="path/to/audio/file.mp3" type="audio/mpeg">
              </audio>
            </button>
          </div>
          <div class="tooltip-definition">${tooltipDef}</div>
        </div>
      `;
  },
  allowHTML: true,
  placement: 'top',
  appendTo: document.body,
  interactive: true,
  onShow(instance) {
    const reference = instance.reference;
    const tooltip = instance.popper.firstElementChild;
    const tooltipIndex = reference.getAttribute('data-tooltip-index');
    const tooltipHeader = tooltip.querySelector('.tooltip-header');
    const tooltipIpa = tooltip.querySelector('.tooltip-ipa');
    const tooltipAudio = tooltip.querySelector('audio');
    const tooltipAudioButton = tooltip.querySelector('.tooltip-audio-button');
    const tooltipDefinition = tooltip.querySelector('.tooltip-definition');

    tooltipHeader.style.backgroundColor = 'white';
    tooltipIpa.style.color = 'black';
    tooltipAudio.src = `https://www.kuyza.com/dw/sounds/${tooltipIndex}.mp3`;   //`path/to/audio/file${tooltipIndex}.mp3` https://www.kuyza.com/dw/sounds/   sounds/
    tooltipAudioButton.addEventListener('click', () => {
      tooltipAudio.play();
    });
  },
});