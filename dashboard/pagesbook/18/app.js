$(document).ready(function() {
	// Başlangıç sayfası
	var currentPage = localStorage.getItem('currentPage') || 1;
  const pageInput = document.getElementById("page-input");
  pageInput.value = currentPage;

  pageInput.addEventListener("click", function() {// bu kod sayfaları numarayla gezmemizi sağlayan textboxın saydamlığını ayarlıyor.
    pageInput.style.opacity = "1";
  });
  
  pageInput.addEventListener("blur", function() {
    pageInput.style.opacity = "0.2";
  });
  // Yükleniyor animasyonunu göster
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loading").style.display = "flex";
});

// Yükleniyor animasyonunu kaldır
window.addEventListener("load", function () {
  document.getElementById("loading").style.display = "none";
});

document.getElementById('page-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    var pageIndex = parseInt(event.target.value);
    if (pageIndex >= 0 && pageIndex < 79+1) {
      loadPage(pageIndex,pageInput);    
      currentPage=pageIndex;
      localStorage.setItem('currentPage', currentPage);
    }
  }
});

	// Önceki sayfa butonuna tıklanınca
	$('#prev-btn').click(function() {
		if (currentPage > 1) {
			currentPage--;
      pageInput.value=currentPage;
			loadPage(currentPage,pageInput);
      localStorage.setItem('currentPage', currentPage);
		}
	});

	// Sonraki sayfa butonuna tıklanınca
	$('#next-btn').click(function() {
		if (currentPage < 79) {
			currentPage++;
      pageInput.value=currentPage;
			loadPage(currentPage,pageInput);
      localStorage.setItem('currentPage', currentPage);
		}
	});

	// İlk sayfa yükleme
	loadPage(currentPage,pageInput);
});

function loadPage(pageNum, pageInput) {
	$.ajax({
		url: 'pages/page' + pageNum + '.html',
		success: function(data) {
			$('#page-container').html(data);
			// Tooltip'leri etkinleştir
			activateTooltips();
      pageInput.value = pageNum;
		}
	});
}

function activateTooltips() {
	// Tooltip'leri etkinleştirme kodu buraya yazılabilir
  
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
	console.log('Tooltip\'ler etkinleştirildi');
}
// Sayfa yüklendiğinde ekran genişliği kontrol edilir
window.addEventListener('load', function() {
    var isMobile = window.innerWidth < 768;
  
    // `isMobile` değişkeni CSS dosyasında kullanılmak üzere kök değişkenlere atanır
    if (isMobile) {
      document.documentElement.style.setProperty('--is-mobile', 'true');
    }
  });
var body = document.getElementsByTagName("body")[0];
var icon = document.getElementById("icon");
var mode = localStorage.getItem("mode");

if (mode === "gece") {
  body.classList.add("gece");
  icon.src = "https://www.kuyza.com/dw/Ebook-img/dark.png";
} else {
  body.classList.add("gunduz");
  icon.src = "https://www.kuyza.com/dw/Ebook-img/brightness.png";
}
function toggleMode() {
  var body = document.getElementsByTagName("body")[0];
  var icon = document.getElementById("icon");
  var mode = localStorage.getItem("mode");

  if (mode === "gece") {
    body.classList.remove("gece");
    body.classList.add("gunduz");
    icon.src = "https://www.kuyza.com/dw/Ebook-img/brightness.png";
    localStorage.setItem("mode", "gunduz");
  } else {
    body.classList.remove("gunduz");
    body.classList.add("gece");
    icon.src = "https://www.kuyza.com/dw/Ebook-img/dark.png";
    localStorage.setItem("mode", "gece");
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

