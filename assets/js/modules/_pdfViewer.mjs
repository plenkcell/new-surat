import * as pdfjsLib from '../pdfjs/pdf.mjs';

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/pdfjs/pdf.worker.mjs';
}

const statusModal = document.getElementById('status-modal');
const pdfModal = document.getElementById('pdf-modal');

async function apiFetch(url, opts = {}) {
    const token = localStorage.getItem('jwt_token');
    opts.headers = opts.headers || {};
    if (!(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, opts);
    const txt = await res.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
    
    // Tambahan untuk redirect jika sesi berakhir
    const expireMsg = "Sesi Anda telah berakhir. Silakan login kembali.";
    if (json && json.message && json.message === expireMsg) {
        Swal.fire({
            title: 'Sesi Berakhir',
            text: expireMsg,
            icon: 'warning',
            timer: 1500,
            showConfirmButton: false,
            willClose: () => { window.location.href = 'login.php'; }
        });
        throw new Error(expireMsg);
    }

    if (!res.ok) {
        const msg = (json && json.message) ? json.message : `HTTP ${res.status}: ${txt}`;
        const err = new Error(msg);
        err.raw = json;
        throw err;
    }
    return json;
}

let pdfState = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    loadingTask: null,
    currentFileToken: '',
    // KUNCI UTAMA: Variabel untuk melacak URL file yang SEDANG di-load
    loadingUrl: null 
};

function renderPage(num) {
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfPageNum = document.getElementById('pdf-page-indicator');
    const pdfPrevBtn = document.getElementById('pdf-prev-btn');
    const pdfNextBtn = document.getElementById('pdf-next-btn');

    pdfState.pageRendering = true;
    pdfState.pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: 1.5 });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        const renderContext = { canvasContext: pdfCanvas.getContext('2d'), viewport };
        page.render(renderContext).promise.then(() => {
            pdfState.pageRendering = false;
            if (pdfState.pageNumPending !== null) {
                renderPage(pdfState.pageNumPending);
                pdfState.pageNumPending = null;
            }
        });
    });
    pdfPageNum.textContent = `Halaman ${num} dari ${pdfState.pdfDoc.numPages}`;
    pdfPrevBtn.disabled = num <= 1;
    pdfNextBtn.disabled = num >= pdfState.pdfDoc.numPages;
}

function queueRenderPage(num) {
    if (pdfState.pageRendering) {
        pdfState.pageNumPending = num;
    } else {
        renderPage(num);
    }
}

export function openModal(modalElement, content, title) {
    const pdfTitle = document.getElementById('pdf-modal-title');
    const pdfLoader = document.getElementById('pdf-loader');
    const pdfCanvas = document.getElementById('pdf-canvas');

    if (modalElement.id === 'status-modal') {
        modalElement.querySelector('.modal-body-status').innerHTML = content;
    } else if (modalElement.id === 'pdf-modal') {
        // 1. Batalkan semua proses loading yang mungkin masih berjalan dari klik sebelumnya.
        if (pdfState.loadingTask) {
            pdfState.loadingTask.destroy();
        }

        // 2. Siapkan URL untuk permintaan BARU.
        const currentToken = localStorage.getItem('jwt_token');
        const urlToLoad = `${content}&jwt=${currentToken}`;
        
        // 3. Catat bahwa SEKARANG kita sedang memuat URL ini. Ini adalah "perintah terakhir".
        pdfState.loadingUrl = urlToLoad;
        pdfState.currentFileToken = title.token;
        
        // 4. Reset tampilan UI ke mode "loading" SEGERA.
        pdfTitle.textContent = title.title;
        pdfLoader.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Memuat Dokumen...";
        pdfLoader.style.display = 'flex';
        pdfCanvas.style.display = 'none';

        // 5. Mulai proses loading BARU.
        pdfState.loadingTask = pdfjsLib.getDocument(urlToLoad);
        pdfState.loadingTask.promise.then(pdfDoc_ => {
            // 6. PERIKSA: Apakah hasil ini datang dari "perintah terakhir"?
            if (urlToLoad !== pdfState.loadingUrl) {
                console.log("Hasil load PDF yang usang diabaikan (sukses).");
                return; // Jika bukan, abaikan dan jangan lakukan apa-apa.
            }

            // Jika ya, tampilkan PDF-nya.
            pdfState.pdfDoc = pdfDoc_;
            pdfState.pageNum = 1;
            pdfLoader.style.display = 'none';
            pdfCanvas.style.display = 'block';
            renderPage(pdfState.pageNum);

        }).catch(reason => {
            // 7. PERIKSA: Apakah error ini datang dari "perintah terakhir"?
            if (urlToLoad !== pdfState.loadingUrl) {
                console.log("Error dari PDF yang usang diabaikan.", reason);
                return; // Jika bukan, abaikan dan jangan tampilkan pesan error.
            }
            
            // Jika ya, ini adalah error yang valid. Tampilkan pesannya.
            console.error('Error loading PDF:', reason);
            pdfLoader.innerHTML = "Gagal memuat dokumen. Mungkin sesi Anda berakhir.";
        });
    }
    modalElement.style.display = "block";
}

export function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = "none";
    }
    if (modalElement && modalElement.id === 'pdf-modal') {
        if (pdfState.loadingTask) {
            pdfState.loadingTask.destroy();
        }
        if (pdfState.pdfDoc) {
            pdfState.pdfDoc.destroy();
        }
        // Reset semua state saat modal ditutup
        pdfState = { pdfDoc: null, pageNum: 1, pageRendering: false, pageNumPending: null, loadingTask: null, currentFileToken: '', loadingUrl: null };
    }
}

export function initPdfViewer() {
    const statusModalClose = statusModal?.querySelector('.modal-close-status');
    const pdfModalClose = pdfModal?.querySelector('.modal-close-pdf');
    const pdfPrevBtn = document.getElementById('pdf-prev-btn');
    const pdfNextBtn = document.getElementById('pdf-next-btn');
    const pdfDownloadBtn = document.getElementById('pdf-download-btn');

    if(statusModalClose) statusModalClose.onclick = () => closeModal(statusModal);
    if(pdfModalClose) pdfModalClose.onclick = () => closeModal(pdfModal);

    window.onclick = function(event) {
        if (event.target == statusModal) closeModal(statusModal);
        if (event.target == pdfModal) closeModal(pdfModal);
    }

    pdfPrevBtn?.addEventListener('click', () => { if (pdfState.pageNum > 1) { pdfState.pageNum--; queueRenderPage(pdfState.pageNum); } });
    pdfNextBtn?.addEventListener('click', () => { if (pdfState.pageNum < pdfState.pdfDoc.numPages) { pdfState.pageNum++; queueRenderPage(pdfState.pageNum); } });
    
    pdfDownloadBtn?.addEventListener('click', () => { 
        if (pdfState.currentFileToken) {
            const currentToken = localStorage.getItem('jwt_token');
            window.open(`backend/download_watermarked.php?token=${pdfState.currentFileToken}&jwt=${currentToken}`, '_blank');
        }
    });
}