import { showFeedback, formatIndonesianDate } from './_utils.mjs';
import { fetchDsiData as refreshTable } from './_daftarSuratInternal.mjs';

const token = localStorage.getItem('jwt_token');

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

const ubahSuratInternal = {
    modal: document.getElementById('ubah-surat-modal-usi'),
    form: document.getElementById('ubah-surat-form-usi'),
    feedbackEl: document.getElementById('ubah-surat-feedback-usi'),
    loader: document.getElementById('ubah-surat-loader-usi'),
    closeBtn: document.getElementById('ubah-surat-close-usi'),
    confirmModal: document.getElementById('confirm-ubah-modal-usi'),
    confirmYesBtn: document.getElementById('confirm-ubah-yes-btn-usi'),
    confirmNoBtn: document.getElementById('confirm-ubah-no-btn-usi'),
    currentId: null,

    open: async function(suratId) {
        this.currentId = suratId;
        this.modal.style.display = 'flex';
        this.form.style.display = 'none';
        this.loader.style.display = 'block';
        this.feedbackEl.style.display = 'none';
        
        try {
            const response = await fetch(`backend/CRUD/api_get_surat_internal_detail.php?id=${suratId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            this.renderForm(data);
        } catch (error) {
            this.form.innerHTML = `<p style="color:red">${error.message}</p>`;
            this.form.style.display = 'block';
        } finally {
            this.loader.style.display = 'none';
        }
    },
    
    renderForm: function(data) {
        this.form.innerHTML = `
            <input type="hidden" name="id_surat_int" value="${this.currentId}">
            <div class="form-grid-ksi">
                <div>
                    <div class="form-group-ksi">
                        <label for="no-surat-usi">No. Surat</label>
                        <input type="text" id="no-surat-usi" name="no_surat" value="${data.no_surat || ''}" required />
                    </div>
                    <div class="form-group-ksi">
                        <label for="tgl-surat-usi">Tanggal Surat</label>
                        <div class="date-input-wrapper-ksi">
                            <input type="date" id="tgl-surat-usi" name="tgl_surat" value="${data.tgl_surat || ''}" class="native-date-input-ksi" required/>
                            <span id="date-display-usi" class="date-display-ksi">${formatIndonesianDate(data.tgl_surat)}</span>
                            <i class='bx bxs-calendar-event'></i>
                        </div>
                    </div>
                    <div class="form-group-ksi">
                        <label>Sifat Surat</label>
                        <select name="s_surat">
                            <option value="${data.s_surat}" selected>${data.s_surat}</option>
                            <option value="Biasa">Biasa</option>
                            <option value="Penting">Penting</option>
                            <option value="Pribadi">Pribadi</option>
                            <option value="Sangat Rahasia">Sangat Rahasia</option>
                        </select>
                    </div>
                    <div class="form-group-ksi">
                        <label>Perihal</label>
                        <textarea name="perihal" rows="3" required>${data.perihal || ''}</textarea>
                    </div>
                    </div>
                <div>
                    <div class="form-group-ksi">
                        <label>Keterangan</label>
                        <textarea name="keterangan" rows="3" required>${data.keterangan || ''}</textarea>
                    </div>
                    <div class="form-group-ksi">
                        <label>Jumlah Lampiran</label>
                        <input type="text" name="j_lampiran" value="${data.j_lampiran || '0'}" required />
                    </div>
                    <div class="form-group-ksi">
                        <label>File Surat (PDF, Kosongkan jika tidak diubah)</label>
                        <p style="font-size:0.8rem; color: var(--text-secondary); margin-bottom: 8px;">File saat ini: ${data.file_surat || 'Tidak ada'}</p>
                        <input type="file" name="foto" class="input-file-ksi" accept=".pdf" />
                    </div>
                    </div>
                <div class="form-actions-ksi">
                    <button type="submit" class="btn-primary"><span class="btn-text-ksi">Simpan Perubahan</span></button>
                </div>
            </div>
        `;
        this.form.style.display = 'block';
        this.initCustomCalendar();
    },

    initCustomCalendar: function() {
        const tglSuratInput = document.getElementById('tgl-surat-usi');
        const dateDisplay = document.getElementById('date-display-usi');
        
        if (tglSuratInput && dateDisplay) {
            tglSuratInput.addEventListener('input', () => {
                dateDisplay.textContent = formatIndonesianDate(tglSuratInput.value);
            });
        }
    },
    
    close: function() {
        this.modal.style.display = 'none';
        this.form.innerHTML = '';
    },

    submitForm: async function() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="btn-spinner-ksi"><i class='bx bx-loader-alt'></i></span><span class="btn-text-ksi">Menyimpan...</span>`;
        submitButton.classList.add('loading');
        
        const formData = new FormData(this.form);

        try {
            const response = await fetch('backend/CRUD/api_update_surat_internal.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            showFeedback(this.feedbackEl, result.message, 'success');
            setTimeout(() => {
                this.close();
                refreshTable();
            }, 1500);

        } catch (error) {
            showFeedback(this.feedbackEl, error.message, 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.innerHTML = `<span class="btn-text-ksi">Simpan Perubahan</span>`;
            submitButton.disabled = false;
        }
    },

    init: function() {
        this.closeBtn?.addEventListener('click', () => this.close());
        
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const noSuratInput = document.getElementById('no-surat-usi');
            if (noSuratInput && noSuratInput.value.includes(' ')) {
                showFeedback(this.feedbackEl, 'Nomor Surat Tidak Boleh ada SPASI.', 'error');
                return;
            }
            this.confirmModal.style.display = 'flex';
        });

        this.confirmNoBtn?.addEventListener('click', () => {
            this.confirmModal.style.display = 'none';
        });
        this.confirmYesBtn?.addEventListener('click', () => {
            this.confirmModal.style.display = 'none';
            this.submitForm();
        });
    }
};

export default ubahSuratInternal;