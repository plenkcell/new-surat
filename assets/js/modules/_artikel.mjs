const token = localStorage.getItem('jwt_token');
let slideshowInterval = null; // Variabel untuk menyimpan timer
let articles = [];
let currentIndex = 0;

async function fetchArticles() {
    try {
        const response = await fetch('backend/CRUD/api_get_articles.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            console.error("Gagal mengambil artikel dari server.");
            return;
        };
        articles = await response.json();
        if (articles.length > 0) {
            startSlideshow();
        }
    } catch (error) {
        console.error("Gagal memuat artikel:", error);
    }
}

function updateArticleContent() {
    if (articles.length === 0) return;

    const titleEl = document.getElementById('promo-title-art');
    const contentEl = document.getElementById('promo-content-art');
    const textWrapper = document.querySelector('.promo-text-art');

    if (!titleEl || !contentEl || !textWrapper) return;

    const article = articles[currentIndex];

    textWrapper.classList.add('fade-out');

    setTimeout(() => {
        titleEl.textContent = article.judul_artikel;
        contentEl.textContent = article.isi_artikel;
        textWrapper.classList.remove('fade-out');
        
        currentIndex = (currentIndex + 1) % articles.length;
    }, 400); 
}

export function startSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    if (articles.length > 0) {
        updateArticleContent();
        slideshowInterval = setInterval(updateArticleContent, 5000);
        console.log("Slideshow dimulai.");
    }
}

export function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        console.log("Slideshow dihentikan.");
    }
}

// MODIFIKASI FINAL: Menambahkan 'export' agar fungsi ini bisa diimpor
export function initArtikelSlideshow() {
    if (document.getElementById('home-section')?.classList.contains('active')) {
        fetchArticles();
    }
}