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
  
const pages = document.querySelectorAll('.page');
const prevButton = document.querySelector('.prev-button');
const nextButton = document.querySelector('.next-button');

let currentPageIndex = 0;

function showPage(pageIndex) {
  pages[currentPageIndex].classList.remove('active');
  pages[pageIndex].classList.add('active');
  currentPageIndex = pageIndex;
}

showPage(0); // İlk sayfanın otomatik olarak yüklenmesi

prevButton.addEventListener('click', function() {
  if (currentPageIndex > 0) {
    showPage(currentPageIndex - 1);
  }
});

nextButton.addEventListener('click', function() {
  if (currentPageIndex < pages.length - 1) {
    showPage(currentPageIndex + 1);
  }
});

function toggleMode() {
  var body = document.getElementsByTagName("body")[0];
  if (body.classList.contains("gunduz")) {
    body.classList.remove("gunduz");
    body.classList.add("gece");
  } else if (body.classList.contains("gece")) {
    body.classList.remove("gece");
    body.classList.add("gunduz");
  } else {
    body.classList.add("gece");
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