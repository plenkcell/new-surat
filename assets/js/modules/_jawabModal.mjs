import { fetchDisposisiData } from './_disposisi.mjs';
import { openModal as openPdfModal } from './_pdfViewer.mjs';

const token = localStorage.getItem('jwt_token');
const jawabModal = document.getElementById('modal-container-jwb');
let currentJawabData = {};

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

function linkifyText(text) {
    if (!text) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        let fullUrl = url;
        if (!fullUrl.startsWith('http')) {
            fullUrl = 'http://' + fullUrl;
        }
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="chat-link-jwb">${url}</a>`;
    });
}

function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = `feedback-message ${type}`;
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 4000);
}

let canvas, ctx, isDrawing = false;
function initSignaturePad() { /* ... (Tidak Berubah) ... */ }
function isCanvasEmpty() { /* ... (Tidak Berubah) ... */ }

export async function openJawabModal(suratData) {
    currentJawabData = { 
        id_surat: suratData.id_surat, 
        id_dispo_unit: suratData.id_disposisi_unit,
        file_token: suratData.file_token,
        file_surat: suratData.file_surat
    };

    const loader = document.getElementById('loader-jwb');
    const content = document.getElementById('content-wrapper-jwb');
    const historyBody = document.getElementById('history-body-jwb');

    jawabModal.style.display = 'flex';
    loader.style.display = 'flex';
    content.style.display = 'none';
    historyBody.innerHTML = '';

    try {
        const response = await fetch(`backend/CRUD/api_get_jawab_detail.php?id_surat=${suratData.id_surat}&id_dispo_unit=${suratData.id_disposisi_unit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat detail disposisi.');

        const data = await response.json();
        const { surat_info, history_disposisi } = data;

        document.getElementById('perihal-jwb').textContent = `Perihal Surat: ${surat_info.perihal}`;
        document.getElementById('pengirim-jwb').textContent = `Dari: ${surat_info.pengirim}`;
        document.getElementById('tgl-terima-jwb').textContent = `Diterima: ${surat_info.tgl_terima}`;
        document.getElementById('verif-jwb').textContent = `Di Verif oleh: ${surat_info.user_verif}`;
        document.getElementById('wkt-verif-jwb').textContent = `Waktu: ${surat_info.wkt_verif}`;

        if (history_disposisi.length > 0) {
            history_disposisi.forEach((h, index) => {
                const item = document.createElement('div');
                const positionClass = (index % 2 === 0) ? 'history-item-jwb-left' : 'history-item-jwb-right';
                item.className = `history-item-jwb ${positionClass}`;
                
                const date = new Date(h.waktu);
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false };
                const formatter = new Intl.DateTimeFormat('id-ID', options);
                const formattedTime = formatter.format(date).replace('pukul', 'Jam') + ' WIB';
                
                const processedContent = linkifyText(h.isi_disposisi);

                const attachmentHTML = h.attachment_path && h.attachment_name
                    ? `<div class="attachment-jwb">
                           <a href="#" class="attachment-link-jwb" data-path="${h.attachment_path}" data-name="${h.attachment_name}">
                               <i class='bx bxs-file-blank'></i> ${h.attachment_name}
                           </a>
                       </div>` 
                    : '';

                item.innerHTML = `
                    <div class="history-header-jwb">
                        <strong>${h.user}</strong> (${h.nm_unit})
                    </div>
                    <div class="history-body-jwb ${h.is_aktif === '0' ? 'revised' : ''}">
                        ${processedContent}
                        ${attachmentHTML}
                    </div>
                    <div class="history-time-jwb">${formattedTime}</div>
                `;
                historyBody.appendChild(item);
            });
        } else {
            historyBody.innerHTML = '<p>Belum ada riwayat disposisi untuk surat ini.</p>';
        }

        loader.style.display = 'none';
        content.style.display = 'block';
        initSignaturePad();

    } catch (error) {
        loader.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

export function initJawabModal() {
    const jawabForm = document.getElementById('form-jwb');
    const closeBtn = document.getElementById('modal-close-jwb');
    const feedbackEl = document.getElementById('feedback-jwb');
    const viewPdfBtn = document.getElementById('view-pdf-jwb');
    const historyBody = document.getElementById('history-body-jwb');

    closeBtn?.addEventListener('click', () => jawabModal.style.display = 'none');

    if(viewPdfBtn) {
        viewPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentJawabData.file_token) {
                const pdfModalEl = document.getElementById('pdf-modal');
                const filePath = `backend/view_file.php?token=${currentJawabData.file_token}`;
                openPdfModal(pdfModalEl, filePath, { title: `Dokumen: ${currentJawabData.file_surat}`, token: currentJawabData.file_token });
            } else {
                alert('Tidak ada file PDF yang terlampir untuk surat ini.');
            }
        });
    }

    jawabForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const attachmentInput = document.getElementById('attachment-jwb');

        formData.append('isi_dispos', document.getElementById('isi-dispos-jwb').value);
        formData.append('id_surat', currentJawabData.id_surat);
        formData.append('id_dispo_unit', currentJawabData.id_dispo_unit);

        if (attachmentInput.files.length > 0) {
            if (attachmentInput.files[0].size > 5 * 1024 * 1024) {
                showFeedback(feedbackEl, 'Ukuran file tidak boleh melebihi 5MB.', 'error');
                return;
            }
            formData.append('attachment', attachmentInput.files[0]);
        }
        
        try {
            const response = await fetch('backend/CRUD/api_post_jawaban.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showFeedback(feedbackEl, result.message, 'success');
            jawabForm.reset();
            
            setTimeout(() => {
                jawabModal.style.display = 'none';
                fetchDisposisiData();
            }, 2000);

        } catch (error) {
            showFeedback(feedbackEl, error.message, 'error');
        }
    });

    if (historyBody) {
        historyBody.addEventListener('click', function(e) {
            const link = e.target.closest('.attachment-link-jwb');
            if (!link) return;

            e.preventDefault();
            const filePath = link.dataset.path;
            const fileName = link.dataset.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
            const videoExtensions = ['mp4', 'mov', 'wmv', 'webm', 'ogg', 'avi'];

            const secureFileUrl = `backend/api_get_attachment.php?path=${encodeURIComponent(filePath)}&jwt=${token}`;

            if (imageExtensions.includes(fileExtension)) {
                const previewModal = document.getElementById('attachment-preview-modal');
                const img = document.getElementById('attachment-image-preview-jwb');
                const video = document.getElementById('attachment-video-preview-jwb');
                const caption = document.getElementById('attachment-modal-caption-jwb');

                img.src = secureFileUrl;
                img.style.display = 'block';
                video.style.display = 'none';
                caption.textContent = fileName;
                previewModal.style.display = 'block';

            } else if (videoExtensions.includes(fileExtension)) {
                const previewModal = document.getElementById('attachment-preview-modal');
                const img = document.getElementById('attachment-image-preview-jwb');
                const video = document.getElementById('attachment-video-preview-jwb');
                const caption = document.getElementById('attachment-modal-caption-jwb');

                video.src = secureFileUrl;
                video.style.display = 'block';
                img.style.display = 'none';
                caption.textContent = fileName;
                previewModal.style.display = 'block';

            } else {
                window.open(secureFileUrl, '_blank');
            }
        });
    }

    const attachmentModal = document.getElementById('attachment-preview-modal');
    const attachmentCloseBtn = document.getElementById('attachment-modal-close-jwb');
    if (attachmentModal && attachmentCloseBtn) {
        const closeAttachmentModal = () => {
            attachmentModal.style.display = 'none';
            const video = document.getElementById('attachment-video-preview-jwb');
            video.pause();
            video.src = '';
            document.getElementById('attachment-image-preview-jwb').src = '';
        };
        attachmentCloseBtn.onclick = closeAttachmentModal;
        attachmentModal.onclick = function(e) {
            if (e.target === attachmentModal) {
                closeAttachmentModal();
            }
        }
    }
}