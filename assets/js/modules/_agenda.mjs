// File: assets/js/modules/_agenda.mjs (Lengkap & Final dengan Perbaikan Format Tanggal)
let calendar;

// ### PERBAIKAN: Class Formatter hanya untuk tampilan, bukan input ###
class WaktuIndonesiaFormatter {
    constructor(locale = 'id-ID') {
        this.locale = locale;
        this.dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    }
    formatDate(dateInput) {
        if (!dateInput) return 'Tanggal tidak valid';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) { return 'Tanggal tidak valid'; }
        return date.toLocaleDateString(this.locale, this.dateOptions);
    }
}
const formatter = new WaktuIndonesiaFormatter();



async function processAgenda(action, eventData) {
    const currentToken = localStorage.getItem('jwt_token');
    try {
        const response = await fetch('backend/CRUD/api_process_agenda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ action, ...eventData })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        Swal.fire('Berhasil!', result.message, 'success');
        calendar.refetchEvents();
        return true;
    } catch (error) {
        Swal.fire('Gagal!', error.message, 'error');
        return null;
    }
}

export function handleAgendaVisibility() {
    if (calendar) {
        setTimeout(() => {
            if (!calendar.el.querySelector('.fc-view-harness')) {
                calendar.render();
            }
            calendar.updateSize();
        }, 100);
    }
}

export function initAgendaPage() {
    const calendarEl = document.getElementById('calendar-container');
    const modal = document.getElementById('agenda-modal');
    const form = document.getElementById('agenda-form');
    const modalTitle = document.getElementById('agenda-modal-title');
    const idInput = document.getElementById('agenda-id');
    const titleInput = document.getElementById('agenda-title');
    const descInput = document.getElementById('agenda-desc');
    const pemohonInput = document.getElementById('agenda-pemohon');
    const startDateInput = document.getElementById('agenda-start-date');
    const startTimeInput = document.getElementById('agenda-start-time');
    const endTimeInput = document.getElementById('agenda-end-time');
    const lokasiInput = document.getElementById('agenda-lokasi');
    const deleteBtn = document.getElementById('agenda-delete-btn');
    const cancelBtn = document.getElementById('agenda-cancel-btn');

    if (!calendarEl) return;
    
    const userLevel = JSON.parse(atob(localStorage.getItem('jwt_token').split('.')[1])).data.level;
    const isAdmin = userLevel === 'admin';

    let tooltip = document.createElement('div');
    tooltip.className = 'fc-event-tooltip';
    document.body.appendChild(tooltip);

    calendar = new FullCalendar.Calendar(calendarEl, {
        height: '100%',
        initialView: 'dayGridMonth',
        locale: 'id',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: isAdmin ? 'addEventButton dayGridMonth,timeGridWeek,listWeek' : 'dayGridMonth,timeGridWeek,listWeek'
        },
        customButtons: {
            addEventButton: {
                text: '+ Tambah Agenda',
                click: function() {
                    modalTitle.textContent = "Tambah Agenda Baru";
                    form.reset();
                    deleteBtn.style.display = 'none';
                    idInput.value = '';
                    const today = new Date().toISOString().split('T')[0];
                    startDateInput.value = today;
                    startTimeInput.value = "08:00";
                    modal.classList.add('active');
                }
            }
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            const currentToken = localStorage.getItem('jwt_token');
            const params = new URLSearchParams({ start: fetchInfo.startStr, end: fetchInfo.endStr });
            fetch(`backend/CRUD/api_get_agendas.php?${params.toString()}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { 
                        throw new Error(err.message || 'Gagal memuat data agenda.');
                    });
                }
                return response.json();
            })
            .then(data => successCallback(data))
            .catch(error => failureCallback(error));
        },
        editable: isAdmin,
        selectable: true,
        dateClick: function(info) {
            if (!isAdmin) return;
            modalTitle.textContent = "Tambah Agenda Baru";
            form.reset();
            deleteBtn.style.display = 'none';
            idInput.value = '';
            startDateInput.value = info.dateStr;
            startTimeInput.value = "08:00";
            modal.classList.add('active');
        },
        eventClick: function(info) {
            tooltip.style.display = 'none';
            const props = info.event.extendedProps;
            const start = info.event.start;
            if (!isAdmin) {
                Swal.fire({
                    title: `<strong>${info.event.title}</strong>`,
                    html: `
                        <p style="text-align: left; margin-bottom: 8px;"><i class='bx bxs-calendar'></i> ${formatter.formatDate(start)}</p>
                        <p style="text-align: left; margin-bottom: 8px;"><i class='bx bx-time-five'></i> ${props.waktu} WIB</p>
                        <p style="text-align: left; margin-bottom: 8px;"><i class='bx bx-map'></i> ${props.lokasi || '-'}</p>
                        <hr>
                        <p style="text-align: left;">${props.deskripsi || '-'}</p>
                    `,
                    icon: 'info'
                });
                return;
            }
            modalTitle.textContent = "Edit Agenda";
            form.reset();
            idInput.value = info.event.id;
            titleInput.value = info.event.title;
            descInput.value = props.deskripsi;
            pemohonInput.value = props.pemohon;
            startDateInput.value = start.toISOString().split('T')[0];
            startTimeInput.value = props.waktu.split(' - ')[0];
            endTimeInput.value = props.waktu.split(' - ')[1] || '';
            lokasiInput.value = props.lokasi;
            deleteBtn.style.display = 'block';
            modal.classList.add('active');
        },
        eventDrop: function(info) {
            if (confirm("Anda yakin ingin memindahkan agenda ini?")) {
                processAgenda('update_date', { id: info.event.id, start: info.event.startStr.split('T')[0] });
            } else { info.revert(); }
        },
        eventMouseEnter: function(info) {
            const props = info.event.extendedProps;
            tooltip.innerHTML = `
                <strong>${info.event.title}</strong>
                <p><i class='bx bxs-calendar'></i> ${formatter.formatDate(info.event.startStr)}</p>
                <p><i class='bx bx-time-five'></i> ${props.waktu} WIB</p>
                <p><i class='bx bx-map'></i> ${props.lokasi || '-'}</p>
            `;
            tooltip.style.display = 'block';
            document.addEventListener('mousemove', e => {
                tooltip.style.left = `${e.pageX + 15}px`;
                tooltip.style.top = `${e.pageY + 15}px`;
            });
        },
        eventMouseLeave: function(info) {
            tooltip.style.display = 'none';
        }
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Simpan Agenda?',
            text: "Pastikan semua data sudah benar.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const eventData = {
                    id: idInput.value,
                    title: titleInput.value,
                    desc: descInput.value,
                    pemohon: pemohonInput.value,
                    start: startDateInput.value,
                    startTime: startTimeInput.value,
                    endTime: endTimeInput.value || null,
                    location: lokasiInput.value
                };
                const action = idInput.value ? 'update_meta' : 'create';
                const successMessage = await processAgenda(action, eventData);
                if (successMessage) {
                    modal.classList.remove('active');
                    Swal.fire('Berhasil!', successMessage, 'success');
                }
            }
        });
    };

    deleteBtn.onclick = () => {
        Swal.fire({
            title: 'Anda Yakin?',
            text: "Agenda yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const successMessage = await processAgenda('delete', { id: idInput.value });
                if (successMessage) {
                    modal.classList.remove('active');
                    Swal.fire('Terhapus!', successMessage, 'success');
                }
            }
        });
    };

    cancelBtn.onclick = () => {
        modal.classList.remove('active');
    };
    
    // Jangan panggil calendar.render() di sini, biarkan handleAgendaVisibility yang mengurusnya
}