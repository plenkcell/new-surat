import { openModal as openPdfModal } from './_pdfViewer.mjs';

const riwayatModal = document.getElementById('riwayat-modal-container');
let currentRiwayatData = {};

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

function toggleLoader(show) {
    const loader = riwayatModal?.querySelector('.loader-riwayat');
    const content = riwayatModal?.querySelector('.content-wrapper-riwayat');
    if (loader) loader.style.display = show ? 'flex' : 'none';
    if (content) content.style.display = show ? 'none' : 'block';
}

export async function openRiwayatModal(suratData) {
    if (!riwayatModal) return;
    currentRiwayatData = suratData;
    riwayatModal.style.display = 'flex';
    toggleLoader(true);
    
    const historyBody = riwayatModal.querySelector('.history-body-riwayat');
    historyBody.innerHTML = '';

    try {
        const currentToken = localStorage.getItem('jwt_token');
        const response = await fetch(`backend/CRUD/api_get_riwayat_disposisi.php?no_agenda=${suratData.no_agenda}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Gagal memuat detail disposisi.');
        }
        
        const data = await response.json();
        const { surat_info, history_disposisi } = data;

        riwayatModal.querySelector('.perihal-riwayat').textContent = `Perihal: ${surat_info.perihal}`;
        riwayatModal.querySelector('.pengirim-riwayat').textContent = `Dari: ${surat_info.pengirim}`;
        riwayatModal.querySelector('.no-agenda-riwayat').textContent = `(No. Agenda: ${surat_info.no_agenda})`;

        if (history_disposisi && history_disposisi.length > 0) {
            history_disposisi.forEach((h, index) => {
                const item = document.createElement('div');
                item.className = `history-item-jwb ${index % 2 === 0 ? 'history-item-jwb-left' : 'history-item-jwb-right'}`;
                item.innerHTML = `<div class="history-header-jwb"><strong>${h.user}</strong> (${h.nm_unit})</div><div class="history-body-jwb">${h.isi_disposisi}</div><div class="history-time-jwb">${new Date(h.waktu).toLocaleString('id-ID')}</div>`;
                historyBody.appendChild(item);
            });
        } else {
            historyBody.innerHTML = '<p>Belum ada riwayat disposisi untuk surat ini.</p>';
        }

        toggleLoader(false);

    } catch (error) {
        historyBody.innerHTML = `<p style="color: red; text-align: center;">${error.message}</p>`;
        toggleLoader(false);
    }
}

export function initRiwayatModal() {
    const closeBtn = riwayatModal?.querySelector('.modal-close-riwayat');
    const viewPdfBtn = riwayatModal?.querySelector('.view-pdf-riwayat');
    const printBtn = document.getElementById('print-riwayat-btn');
    
    closeBtn?.addEventListener('click', () => {
        if (riwayatModal) riwayatModal.style.display = 'none';
    });
    
    viewPdfBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentRiwayatData.file_token) {
            const pdfModalEl = document.getElementById('pdf-modal');
            const filePath = `backend/view_file.php?token=${currentRiwayatData.file_token}`;
            openPdfModal(pdfModalEl, filePath, { title: `Dokumen: ${currentRiwayatData.file_surat}`, token: currentRiwayatData.file_token });
        } else {
            Swal.fire('Info', 'Tidak ada file PDF yang terlampir pada surat ini.', 'info');
        }
    });

    printBtn?.addEventListener('click', () => {
        const headerToPrint = riwayatModal.querySelector('.header-surat-jwb').cloneNode(true);
        const historyToPrint = riwayatModal.querySelector('#panel-riwayat-cetak').cloneNode(true);
        
        headerToPrint.querySelector('.view-pdf-riwayat').style.display = 'none';

        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Cetak Isi Disposisi</title>');
        
        // ### BLOK CSS BARU DENGAN GAYA WATERMARK YANG DISEMPURNAKAN ###
        printWindow.document.write(`
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                
                body { 
                    font-family: 'Poppins', sans-serif; 
                    position: relative;
                }
                
                @page { 
                    size: auto;
                    margin: 15mm;
                }
                
                /* Gaya untuk Konten Cetak */
                .header-surat-jwb { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
                .panel-jwb { border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
                .panel-heading-jwb { background-color: #e9ecef; padding: 0.75rem 1.25rem; font-weight: 600; border-bottom: 1px solid #dee2e6;}
                .panel-body-jwb { padding: 1.25rem; }
                .history-item-jwb { margin-bottom: 1rem; page-break-inside: avoid; }
                .history-header-jwb { font-size: 0.9rem; margin-bottom: 4px; }
                .history-body-jwb { background-color: #fdfdff; border: 1px solid #efefef; padding: 10px; border-radius: 8px; }
                .history-time-jwb { font-size: 0.75rem; color: #6c757d; text-align: right; margin-top: 4px; }

                /* === GAYA BARU UNTUK WATERMARK YANG LEBIH BAIK === */
                body::after {
                    /* Teks watermark dengan baris baru */
                    content: 'E-SURAT RSIFC\\A E-SURAT RSIFC\\A E-SURAT RSIFC';
                    
                    /* Posisi di tengah halaman secara absolut */
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    
                    /* Trik untuk centering dan rotasi */
                    transform: translate(-50%, -50%) rotate(-45deg);
                    
                    /* Tampil di belakang konten */
                    z-index: -1;
                    
                    /* Gaya Teks Watermark */
                    font-size: 10vw; /* Ukuran sangat besar dan fleksibel */
                    font-weight: bold;
                    color: rgba(0, 0, 0, 0.08); /* Lebih transparan */
                    text-align: center;
                    line-height: 1.5; /* Jarak antar baris teks */
                    pointer-events: none; /* Agar tidak bisa di-klik */
                    white-space: pre; /* Wajib agar baris baru berfungsi */
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(headerToPrint.outerHTML);
        printWindow.document.write(historyToPrint.outerHTML);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    });
}