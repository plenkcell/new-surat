// File: assets/js/modules/_tte.mjs (Versi Final dengan Semua Fungsi & Perbaikan Bug)

const { PDFDocument } = PDFLib;

let uploadedPdfBytes = null;
let activeSignatureBytes = null;
let watermarkBytes = null;
let placedSignatures = [];

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

async function renderPdfPreview(file) {
    const container = document.getElementById('pdf-preview-container');
    container.innerHTML = '';
    placedSignatures = [];

    const fileReader = new FileReader();
    fileReader.onload = async function() {
        uploadedPdfBytes = this.result.slice(0);
        const typedarray = new Uint8Array(this.result);
        const pdfDoc = await pdfjsLib.getDocument({ data: typedarray }).promise;
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const canvas = document.createElement('canvas');
            canvas.id = `pdf-page-${i}`;
            canvas.dataset.pageNum = i;
            container.appendChild(canvas);
            
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = { canvasContext: canvas.getContext('2d'), viewport };
            await page.render(renderContext).promise;
        }
    };
    fileReader.readAsArrayBuffer(file);
}

function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    const clearButton = document.getElementById('clear-signature-btn');
    const sigUploadInput = document.getElementById('signature-image-upload');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function startDrawing(e) {
        drawing = true;
        sigUploadInput.value = ''; 
        const pos = getMousePos(e);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        const dataUrl = canvas.toDataURL('image/png');
        fetch(dataUrl).then(res => res.arrayBuffer()).then(buffer => {
            activeSignatureBytes = buffer;
        });
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeSignatureBytes = null;
        sigUploadInput.value = '';
    });
}

function initDraggableAndResizable(element, signatureObject) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false, isResizing = false;
    let currentResizer = null;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.classList.contains('resizer')) {
            isResizing = true;
            currentResizer = e.target;
        } else {
            isDragging = true;
        }
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        if (isDragging) {
            element.style.top = `${element.offsetTop - pos2}px`;
            element.style.left = `${element.offsetLeft - pos1}px`;
        } else if (isResizing) {
            const minSize = 50;
            if (currentResizer.classList.contains('bottom-right')) {
                element.style.width = Math.max(minSize, element.offsetWidth - pos1) + 'px';
                element.style.height = Math.max(minSize, element.offsetHeight - pos2) + 'px';
            } else if (currentResizer.classList.contains('bottom-left')) {
                element.style.width = Math.max(minSize, element.offsetWidth + pos1) + 'px';
                element.style.height = Math.max(minSize, element.offsetHeight - pos2) + 'px';
                element.style.left = `${element.offsetLeft - pos1}px`;
            } else if (currentResizer.classList.contains('top-right')) {
                element.style.width = Math.max(minSize, element.offsetWidth - pos1) + 'px';
                element.style.height = Math.max(minSize, element.offsetHeight + pos2) + 'px';
                element.style.top = `${element.offsetTop - pos2}px`;
            } else if (currentResizer.classList.contains('top-left')) {
                element.style.width = Math.max(minSize, element.offsetWidth + pos1) + 'px';
                element.style.height = Math.max(minSize, element.offsetHeight + pos2) + 'px';
                element.style.top = `${element.offsetTop - pos2}px`;
                element.style.left = `${element.offsetLeft - pos1}px`;
            }
        }
    }

    function closeDragElement() {
        const targetCanvas = document.getElementById(`pdf-page-${signatureObject.pageNum}`);
        signatureObject.x = element.offsetLeft - targetCanvas.offsetLeft;
        signatureObject.y = element.offsetTop - targetCanvas.offsetTop;
        signatureObject.width = element.offsetWidth;
        signatureObject.height = element.offsetHeight;
        
        isDragging = false;
        isResizing = false;
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function renderPlacedSignatures() {
    document.querySelectorAll('.signature-stamp').forEach(stamp => stamp.remove());
    const container = document.getElementById('pdf-preview-container');
    
    placedSignatures.forEach((sig, index) => {
        const targetCanvas = document.getElementById(`pdf-page-${sig.pageNum}`);
        if (!targetCanvas) return;

        const stampContainer = document.createElement('div');
        stampContainer.className = 'draggable-signature signature-stamp';
        stampContainer.style.display = 'block';
        stampContainer.style.left = `${targetCanvas.offsetLeft + sig.x}px`;
        stampContainer.style.top = `${targetCanvas.offsetTop + sig.y}px`;
        stampContainer.style.width = `${sig.width}px`;
        stampContainer.style.height = `${sig.height}px`;
        
        stampContainer.innerHTML = `
            <img src="${URL.createObjectURL(new Blob([sig.bytes], {type: 'image/png'}))}" alt="Tanda Tangan Ditempel">
            <div class="resizer top-left"></div>
            <div class="resizer top-right"></div>
            <div class="resizer bottom-left"></div>
            <div class="resizer bottom-right"></div>
            <button class="delete-stamp-btn" data-index="${index}">&times;</button>
        `;
        container.appendChild(stampContainer);
        initDraggableAndResizable(stampContainer, sig);
    });
}

async function embedAndDownload() {
    const placedStamps = document.querySelectorAll('.signature-stamp');
    if (!uploadedPdfBytes) {
        Swal.fire('Error', 'Silakan pilih file PDF terlebih dahulu.', 'error');
        return;
    }
    if (placedStamps.length === 0) {
        Swal.fire('Error', 'Silakan letakkan minimal satu tanda tangan di atas dokumen.', 'error');
        return;
    }

    const pdfDocForEmbed = await PDFDocument.load(uploadedPdfBytes.slice(0)); 
    const pages = pdfDocForEmbed.getPages();

    if (watermarkBytes) {
        const watermarkImage = await pdfDocForEmbed.embedPng(watermarkBytes.slice(0));
        const watermarkDims = watermarkImage.scale(0.3);
        pages.forEach(page => page.drawImage(watermarkImage, { x: page.getWidth() / 2 - watermarkDims.width / 2, y: page.getHeight() / 2 - watermarkDims.height / 2, width: watermarkDims.width, height: watermarkDims.height, opacity: 0.1 }));
    }

    for (const sig of placedSignatures) {
        const targetPage = pages[sig.pageNum - 1];
        const targetCanvas = document.getElementById(`pdf-page-${sig.pageNum}`);
        if (!targetPage || !targetCanvas) continue;

        const scale = targetPage.getWidth() / targetCanvas.width;
        const sigWidth = sig.width * scale;
        const sigHeight = sig.height * scale;
        const x_pdf = sig.x * scale;
        const y_pdf = targetPage.getHeight() - (sig.y * scale) - sigHeight;

        const signatureImage = await pdfDocForEmbed.embedPng(sig.bytes.slice(0));
        targetPage.drawImage(signatureImage, { x: x_pdf, y: y_pdf, width: sigWidth, height: sigHeight });
    }

    const pdfBytes = await pdfDocForEmbed.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tte_${document.getElementById('tte-pdf-file').files[0].name}`;
    link.click();
    URL.revokeObjectURL(link.href);

    Swal.fire({
        title: 'Berhasil!',
        text: 'Dokumen telah berhasil ditandatangani dan diunduh.',
        icon: 'success',
        confirmButtonText: 'Selesai'
    }).then(() => {
        window.location.reload();
    });
}

export function initTtePage() {
    const fileInput = document.getElementById('tte-pdf-file');
    const sigUploadInput = document.getElementById('signature-image-upload');
    const downloadBtn = document.getElementById('download-btn');
    const previewContainer = document.getElementById('pdf-preview-container');
    
    if (!fileInput) return;
    initSignaturePad();

    fetch('assets/images/watermark.png')
        .then(res => res.arrayBuffer())
        .then(buffer => { watermarkBytes = buffer; });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            renderPdfPreview(file);
        }
    });
    
    sigUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const canvas = document.getElementById('signature-pad');
        if (file && file.type === 'image/png') {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            const fileReaderForBytes = new FileReader();
            fileReaderForBytes.onload = function(e) {
                activeSignatureBytes = e.target.result;
                // Tampilkan TTD yang diunggah sebagai preview di canvas signature pad
                const img = new Image();
                img.onload = () => {
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                const blob = new Blob([activeSignatureBytes], {type: 'image/png'});
                img.src = URL.createObjectURL(blob);
            };
            fileReaderForBytes.readAsArrayBuffer(file);
        }
    });

    previewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-stamp-btn')) {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index, 10);
            placedSignatures.splice(index, 1);
            renderPlacedSignatures();
            return;
        }
        if (e.target.closest('.signature-stamp')) return;
        if (!activeSignatureBytes) {
            Swal.fire('Info', 'Silakan gambar atau unggah tanda tangan Anda terlebih dahulu.', 'info');
            return;
        }
        const target = e.target;
        if (target.tagName.toLowerCase() !== 'canvas') return;
        
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left - 75;
        const y = e.clientY - rect.top - 37.5;

        placedSignatures.push({
            bytes: activeSignatureBytes,
            pageNum: parseInt(target.dataset.pageNum, 10),
            x: x, y: y,
            width: 150, height: 75
        });
        
        renderPlacedSignatures();
    });

    downloadBtn.addEventListener('click', embedAndDownload);
}