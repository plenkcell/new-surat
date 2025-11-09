<?php
// Kita masih butuh config.php untuk koneksi nanti, tapi tidak untuk session check
require_once 'backend/config.php';
//require_once 'backend/jwt_check.php';

// Variabel ini sekarang hanya sebagai fallback, data asli akan diisi oleh JavaScript
$namaUser = $_SESSION['user']['nm_pegawai'] ?? 'Pengguna';
$levelUser = $_SESSION['user']['level'] ?? 'Level';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - E-Surat</title>

    <script>
        // Skrip ini melindungi halaman sebelum konten lain dimuat
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = 'login.php?status=unauthenticated';
        }
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <link href='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css' rel='stylesheet' />
    <!-- Choices.js CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>
    <!-- Choices.js JS -->
    <script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>

</head>
<body>

    <div class="dashboard-container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <i class='bx bxs-envelope logo-icon'></i>
                    <span class="logo-text">E-Surat</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                <ul>
                    <li class="nav-item active"><a href="#" class="nav-link" data-target="home-section"><i class='bx bxs-home-smile'></i><span>Home</span></a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="disposisi-section"><i class='bx bx-file-find'></i><span>Disposisi</span></a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="surat-masuk-admin-section"><i class='bx bx-envelope-open'></i><span>Surat Masuk Admin</span></a></li>
                    
                    <li class="nav-item"><a href="#" class="nav-link" data-target="agenda-section"><i class='bx bx-calendar-event'></i><span>Agenda</span></a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="surat-masuk-admin-selesai-section"><i class='bx bx-calendar-event'></i><span>Surat Selesai Admin</span></a></li>
                    
                    <li class="nav-item"><a href="#" class="nav-link" data-target="report-section"><i class='bx bx-line-chart'></i><span>Report</span></a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="notifications-section"><i class='bx bxs-bell'></i><span>Notifications</span></a></li>
                    <li class="nav-item has-submenu">
                        <a href="#" class="nav-link submenu-toggle" data-target="master-data"><i class='bx bxs-data'></i><span>Master Data</span><i class='bx bx-chevron-down arrow'></i></a>
                        <ul class="submenu">
                            <li class="nav-item"><a href="#" class="nav-link" data-target="data-unit-section"><span>Data Unit / Bagian</span></a></li>
                            <li class="nav-item"><a href="#" class="nav-link" data-target="data-struktural-section"><span>Data Struktural</span></a></li>
                            <li class="nav-item"><a href="#" class="nav-link" data-target="data-pegawai-section"><span>Data Pegawai</span></a></li>
                            <li class="nav-item"><a href="#" class="nav-link" data-target="data-pengguna-section"><span>Data Pengguna</span></a></li>
                            <li class="nav-item"><a href="#" class="nav-link" data-target="setting-aplikasi-section"><span>Setting Aplikasi</span></a></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            <header class="main-header">
                <div class="header-left">
                    <i class='bx bx-menu' id="hamburger-button"></i>
                    <div class="header-greeting">
                        <p>Hello!</p>
                        <h1 id="user-greeting-name">Memuat...</h1>
                    </div>
                </div>
                <div class="header-user">
                    <div class="theme-switcher" id="theme-switcher-button" title="Ganti Tema">
                        <i class='bx bxs-sun sun-icon'></i>
                        <i class='bx bxs-moon moon-icon'></i>
                    </div>
                    <div class="user-profile">
                        <img src="https://i.pravatar.cc/150" alt="User Avatar" class="user-avatar" id="avatarButton">
                        <div class="dropdown-menu" id="dropdownMenu">
                            <div class="dropdown-header">
                                <h5 class="user-name" id="dropdown-user-name">...</h5>
                                <p class="user-level" id="dropdown-user-level">...</p>
                            </div>
                            <ul>
                                <li><a href="#" class="nav-link" data-target="profile-section"><i class='bx bx-user'></i><span>Profile</span></a></li>
                                <li><a href="#" class="nav-link" data-target="profile-section"><i class='bx bx-key'></i><span>Ganti Password</span></a></li>
                                <li class="divider"></li>
                                <li><a href="logout.php" id="logout-button"><i class='bx bx-log-out'></i><span>Logout</span></a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </header>

            <!-- ============================================= -->
<!--  SECTION: SURAT MASUK ADMIN SELESAI          -->
<!-- ============================================= -->
<!-- SECTION: SURAT MASUK ADMIN SELESAI -->
<section class="content-section" id="surat-masuk-admin-selesai-section">
  <div id="smas-controls-wrapper">
    <div class="controls-left-suratMasukAdmin">
      <div class="entries-control-suratMasukAdmin">
        Tampil
        <select id="smas-entries-select">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        data
      </div>
      <div class="filter-control-suratMasukAdmin">
        Disposisi
        <select id="smas-filter-disposisi">
          <option value="semua">Semua</option>
          <option value="sudah">Sudah</option>
          <option value="belum">Belum</option>
        </select>
      </div>
    </div>
    <div class="search-wrapper-suratMasukAdmin">
      <i class='bx bx-search'></i>
      <input id="smas-search-input" type="search" placeholder="Cari nomor/pengirim/perihal...">
    </div>
  </div>

  <div class="table-responsive-suratMasukAdmin">
    <table id="smas-data-table">
      <thead>
        <tr>
          <th>Detail Surat</th>
          <th>Info</th>
          <th>Status</th>
          <th>Tgl. Selesai</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="smas-table-body"></tbody>
    </table>
  </div>

  <div class="d-flex justify-content-between align-items-center mt-2">
    <div id="smas-pagination-info">Menampilkan 0-0 dari 0 data</div>
    <div id="smas-pagination-buttons"></div>
  </div>
</section>

<!-- Pastikan tidak ada: <video src="index.php">, <audio src="index.php">, <source src="index.php">, <link rel="preload" as="video" href="index.php"> -->

<!-- (Opsional) SweetAlert2 untuk dialog/toast lebih bagus -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Load modul mandiri -->
<script type="module">
  import { initSuratMasukAdminSelesaiPage } from './assets/js/modules/_suratMasukAdminSelesai.mjs';
  initSuratMasukAdminSelesaiPage();
</script>


            <section id="data-unit-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Master Data Unit / Bagian</h2>
                        <div class="widget-header-actions">
                            <button id="btn-tambah-bagian" class="btn-primary"><i class='bx bx-plus'></i> Tambah Bagian</button>
                        </div>
                    </div>
                    <div class="table-wrapper-bagian">
                        <div class="table-controls-bagian">
                            <div class="entries-control-bagian">
                                <label for="entries-select-bagian">Tampilkan</label>
                                <select id="entries-select-bagian">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span>data</span>
                            </div>
                            <div class="search-wrapper-bagian">
                                <i class='bx bx-search'></i>
                                <input type="text" id="search-input-bagian" placeholder="Cari kode atau nama bagian...">
                            </div>
                        </div>

                        <div class="table-responsive-bagian">
                            <table class="data-table-bagian">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Kode Bagian</th>
                                        <th>Nama Bagian</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="table-body-bagian"></tbody>
                            </table>
                        </div>
                        
                        <div class="pagination-controls-bagian">
                            <span id="pagination-info-bagian"></span>
                            <div class="pagination-buttons-bagian" id="pagination-buttons-bagian"></div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- ============================================= -->
            <!--       SECTION BARU: DATA STRUKTURAL           -->
            <!-- ============================================= -->
            <section id="data-struktural-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Master Data Struktural (Jabatan)</h2>
                        <div class="widget-header-actions">
                            <button id="btn-tambah-struktural" class="btn-primary">
                                <i class='bx bx-plus'></i> Tambah Jabatan
                            </button>
                        </div>
                    </div>
                    <div class="table-wrapper-struktural">
                        <div class="table-controls-struktural">
                            <div class="entries-control-struktural">
                                <label for="entries-select-struktural">Tampilkan</label>
                                <select id="entries-select-struktural">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                                <span>data</span>
                            </div>
                            <div class="search-wrapper-struktural">
                                <i class='bx bx-search'></i>
                                <input type="text" id="search-input-struktural" placeholder="Cari nama jabatan...">
                            </div>
                        </div>

                        <div class="table-responsive-struktural">
                            <table class="data-table-struktural">
                                <thead>
                                    <tr>
                                        <th>ID Jabatan</th>
                                        <th>Nama Jabatan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="table-body-struktural">
                                    <!-- Data akan di-render oleh _dataStruktural.mjs -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="pagination-controls-struktural">
                            <span id="pagination-info-struktural"></span>
                            <div class="pagination-buttons-struktural" id="pagination-buttons-struktural"></div>
                        </div>
                    </div>
                </div>
            </section>
            <!-- ============================================= -->
            <!--        AKHIR SECTION DATA STRUKTURAL          -->
            <!-- ============================================= -->

            <!-- MODAL BARU: Tambah / Ubah Jabatan Struktural -->
            <div id="struktural-modal" class="modal-container-struktural" style="display: none;">
                <div class="modal-content-struktural">
                    <div class="modal-header-struktural">
                        <h3 id="struktural-modal-title">Tambah Jabatan Baru</h3>
                        <span id="struktural-modal-close" class="modal-close-struktural">&times;</span>
                    </div>
                    <form id="struktural-form">
                        <div class="modal-body-struktural">
                            <!-- Input ID tersembunyi, hanya diisi saat mode edit -->
                            <input type="hidden" id="struktural-id" name="id_jabatan">

                            <div class="form-group-struktural">
                                <label for="struktural-nama">Nama Jabatan</label>
                                <input type="text" id="struktural-nama" name="nm_jabatan" class="form-input-struktural" required>
                            </div>
                        </div>

                        <div class="form-actions-struktural">
                            <button type="button" id="struktural-cancel-btn" class="btn-secondary-struktural">Batal</button>
                            <button type="submit" class="btn-primary-struktural">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- ============================================= -->
            <!--        SECTION BARU: SETTING APLIKASI         -->
            <!-- ============================================= -->
            <section id="setting-aplikasi-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Setting Aplikasi</h2>
                    </div>
                    <div class="setting-wrapper">
                        <!-- Skeleton loader untuk tampilan awal -->
                        <div id="setting-skeleton-loader">
                            <div class="setting-card-skeleton">
                                <div class="skeleton-line title"></div>
                                <div class="skeleton-line text"></div>
                                <div class="skeleton-line text short"></div>
                            </div>
                            <div class="setting-card-skeleton">
                                <div class="skeleton-image"></div>
                                <div class="skeleton-line title"></div>
                            </div>
                        </div>

                        <!-- Form utama (awalnya disembunyikan) -->
                        <form id="setting-form" class="form-grid-setting" style="display: none;">
                            <!-- Kolom Kiri: Informasi Teks -->
                            <div class="setting-card">
                                <div class="form-group-setting">
                                    <label for="setting-lembaga">Nama Lembaga</label>
                                    <input type="text" id="setting-lembaga" name="lembaga" class="form-input-setting" required>
                                </div>
                                <div class="form-group-setting">
                                    <label for="setting-alamat">Alamat</label>
                                    <textarea id="setting-alamat" name="alamat" rows="3" class="form-input-setting" required></textarea>
                                </div>
                                <div class="form-group-setting">
                                    <label for="setting-kota">Kota</label>
                                    <input type="text" id="setting-kota" name="kota" class="form-input-setting" required>
                                </div>
                                <div class="form-group-setting">
                                    <label for="setting-telp">Telepon</label>
                                    <input type="tel" id="setting-telp" name="telpon" class="form-input-setting" required>
                                </div>
                            </div>

                            <!-- Kolom Kanan: Upload Logo -->
                            <div class="setting-card">
                                <div class="form-group-setting">
                                    <label>Logo Saat Ini</label>
                                    <div class="logo-preview-container">
                                        <img id="setting-logo-preview" src="assets/images/placeholder.png" alt="Logo saat ini" class="logo-preview">
                                    </div>
                                </div>
                                <div class="form-group-setting">
                                    <label for="setting-logo-upload">Ganti Logo (Opsional)</label>
                                    <input type="file" id="setting-logo-upload" name="foto" class="input-file-setting" accept="image/png, image/jpeg">
                                    <small class="input-hint-setting">Hanya .png, .jpg, .jpeg. Maksimal 1MB.</small>
                                </div>
                            </div>
                            
                            <!-- Tombol Aksi -->
                            <div class="setting-actions">
                                <button type="submit" class="btn-primary-setting">
                                    <i class='bx bx-save'></i> Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <!-- ============================================= -->
            <!--     BAGIAN DATA PENGGUNA (YANG DISUNTING)     -->
            <!-- ============================================= -->
            <section id="data-pengguna-section" class="content-section">
            <div class="widget">
                <div class="widget-header">
                <h2>Master Data Pengguna</h2>
                <div class="widget-header-actions">
                    <button id="btn-tambah-pengguna" class="btn-primary">
                    <i class="bx bx-plus"></i> Tambah Pengguna
                    </button>
                </div>
                </div>

                <div class="table-wrapper-pengguna">
                <div class="table-controls-pengguna">
                    <div class="controls-left-pengguna">
                    <div class="entries-control-pengguna">
                        <label for="entries-select-pengguna">Tampilkan</label>
                        <select id="entries-select-pengguna">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        </select>
                        <span>data</span>
                    </div>

                    <div class="filter-control-pengguna">
                        <label for="filter-status-pengguna">Status</label>
                        <select id="filter-status-pengguna">
                        <option value="Semua">Semua</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                    </div>

                    <button id="btn-reset-filter-pengguna" class="btn-secondary-pengguna" title="Reset Filter & Muat Ulang">
                        <i class="bx bx-reset"></i>
                    </button>
                    </div>

                    <div class="search-wrapper-pengguna">
                    <i class="bx bx-search"></i>
                    <input type="text" id="search-input-pengguna" placeholder="Cari NIP atau nama...">
                    </div>
                </div>

                <div class="table-responsive-pengguna">
                    <table class="data-table-pengguna">
                    <thead>
                        <!-- 
                        PERUBAHAN: Kolom "Unit Kerja" ditambahkan.
                        Total kolom sekarang menjadi 8.
                        -->
                        <tr>
                        <th>NIP</th>
                        <th>Nama Pegawai</th>
                        <th>User Login</th>
                        <th>Jabatan</th>
                        <th>Unit Kerja</th>
                        <th>Level</th>
                        <th>Status</th>
                        <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-body-pengguna">
                        <!-- Data akan di-render oleh _dataPengguna.mjs -->
                    </tbody>
                    </table>
                </div>

                <div class="pagination-controls-pengguna">
                    <span id="pagination-info-pengguna"></span>
                    <div class="pagination-buttons-pengguna" id="pagination-buttons-pengguna"></div>
                </div>
                </div>
            </div>
            </section>
            <!-- ============================================= -->
            <!--   AKHIR BAGIAN DATA PENGGUNA (YANG DISUNTING)   -->
            <!-- ============================================= -->


            <!-- MODAL: Tambah / Ubah Pengguna -->
            <div id="pengguna-modal" class="modal-container-pengguna" style="display:none;">
            <div class="modal-content-pengguna">
                <div class="modal-header-pengguna">
                <h3 id="pengguna-modal-title">Tambah Pengguna</h3>
                <span id="pengguna-modal-close" class="modal-close-pengguna" style="cursor:pointer;">&times;</span>
                </div>

                <form id="pengguna-form">
                <div class="modal-body-pengguna">
                    <input type="hidden" id="pengguna-nip">

                    <div class="form-group-pengguna" style="position:relative;">
                    <label for="pengguna-nama">Nama Pegawai</label>
                    <input type="text" id="pengguna-nama" class="form-input-pengguna" placeholder="Ketik nama pegawai..." autocomplete="off">
                    <div id="pegawai-search-results" style="position:absolute;left:0;right:0;top:100%;z-index:999;background:var(--bg-content);border:1px solid var(--border-color);max-height:220px;overflow:auto;border-radius:6px;"></div>
                    </div>

                    <div class="form-group-pengguna">
                    <label for="pengguna-login">User Login</label>
                    <input type="text" id="pengguna-login" class="form-input-pengguna" placeholder="User login">
                    </div>

                    <div class="form-group-pengguna">
                    <label for="pengguna-level">Level</label>
                    <select id="pengguna-level" class="form-input-pengguna">
                        <option value="">-- Pilih Level --</option>
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                        <option value="direktur">direktur</option>
                    </select>
                    </div>

                    <div class="form-group-pengguna">
                    <label for="pengguna-jabatan">Jabatan</label>
                    <select id="pengguna-jabatan" class="form-input-pengguna">
                        <option value="">-- Pilih Jabatan --</option>
                    </select>
                    </div>

                    <div class="form-group-pengguna">
                    <label for="pengguna-unit">Unit Kerja</label>
                    <select id="pengguna-unit" class="form-input-pengguna">
                        <option value="">-- Pilih Unit --</option>
                    </select>
                    </div>
                </div>

                <div class="form-actions-pengguna">
                    <button type="button" id="pengguna-cancel-btn" class="btn-secondary-pengguna">Batal</button>
                    <button type="submit" class="btn-primary-pengguna">Simpan</button>
                </div>
                </form>
            </div>
            </div>

            <section id="data-pegawai-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Master Data Pegawai</h2>
                        <div class="widget-header-actions">
                            <button id="btn-tambah-pegawai" class="btn-primary">
                                <i class='bx bx-plus'></i> Tambah Pegawai
                            </button>
                        </div>
                    </div>

                    <div class="table-wrapper-pegawai">
                        <!-- Kontrol tabel -->
                        <div class="table-controls-pegawai">
                            <div class="controls-left-pegawai">
                                <div class="entries-control-pegawai">
                                    <label for="entries-select-pegawai">Tampilkan</label>
                                    <select id="entries-select-pegawai">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span>data</span>
                                </div>
                            </div>

                            <div class="search-wrapper-pegawai">
                                <i class='bx bx-search'></i>
                                <input type="text" id="search-input-pegawai" placeholder="Cari NIP atau nama pegawai...">
                            </div>
                        </div>

                        <!-- Tabel -->
                        <div class="table-responsive-pegawai">
                            <table class="data-table-pegawai">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>NIP</th>
                                        <th>Nama Pegawai</th>
                                        <th>Tanggal Lahir</th>
                                        <th>Email</th>
                                        <th>No. WA</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="table-body-pegawai"></tbody>
                            </table>
                        </div>

                        <!-- Paginasi -->
                        <div class="pagination-controls-pegawai">
                            <span id="pagination-info-pegawai"></span>
                            <div id="pagination-buttons-pegawai" class="pagination-buttons-pegawai"></div>
                        </div>
                    </div>
                </div>
            </section>


            <!-- Modal Pegawai -->
            <div id="pegawai-modal" class="modal-container-pegawai">
                <div class="modal-content-pegawai">
                    <div class="modal-header-pegawai">
                        <h3 id="pegawai-modal-title">Tambah Pegawai Baru</h3>
                        <span id="pegawai-modal-close" class="modal-close-pegawai">&times;</span>
                    </div>

                    <form id="pegawai-form">
                        <div class="modal-body-pegawai">
                            <div class="form-group-pegawai">
                                <label for="pegawai-nip">NIP</label>
                                <input type="text" id="pegawai-nip" class="form-input-pegawai" required>
                            </div>

                            <div class="form-group-pegawai">
                                <label for="pegawai-nama">Nama Pegawai</label>
                                <input type="text" id="pegawai-nama" class="form-input-pegawai" required>
                            </div>

                            <div class="form-group-pegawai">
                                <label for="pegawai-tgl-lahir">Tanggal Lahir</label>
                                <input type="date" id="pegawai-tgl-lahir" class="form-input-pegawai" required>
                            </div>

                            <div class="form-group-pegawai">
                                <label for="pegawai-email">Email</label>
                                <input type="email" id="pegawai-email" class="form-input-pegawai">
                            </div>

                            <div class="form-group-pegawai">
                                <label for="pegawai-wa">No. WhatsApp</label>
                                <input type="text" id="pegawai-wa" class="form-input-pegawai">
                            </div>
                        </div>

                        <div class="form-actions-pegawai">
                            <button type="button" id="pegawai-cancel-btn" class="btn-secondary-pegawai">Batal</button>
                            <button type="submit" class="btn-primary-pegawai">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>


            <section id="home-section" class="content-section active">
                <div class="widget-grid">
                    
                    <div class="widget progress-widget-jwb full-width">
                        <div class="widget-header">
                            <h2 id="summary-title-jwb">Anda Mempunyai Disposisi</h2>
                        </div>
                        <div class="progress-bar-container-jwb">
                            <div id="summary-progress-bar-jwb" class="progress-bar-jwb" style="width: 0%;"></div>
                        </div>
                        <span id="summary-status-jwb" class="progress-status-jwb">Memuat data...</span>
                    </div>

                    <div class="promo-banner-art full-width">
                        <div class="promo-content-art">
                            <div class="promo-icon-art">
                                <img src="assets/images/rsifc.png" alt="Logo RSIFC">
                            </div>
                            <div class="promo-text-art">
                                <h3 id="promo-title-art">Memuat Artikel...</h3>
                                <p id="promo-content-art"></p>
                            </div>
                        </div>
                        <div class="promo-footer-art">RSU Islam Fatimah Cilacap</div>
                    </div>

                    <div class="widget services-widget full-width">
                        <div class="widget-header"><h2>Kotak Surat</h2><a href="#" class="view-all">View All</a></div>
                        <div class="services-grid">
                            <a href="#" class="service-card nav-link" data-target="disposisi-section">
                                <div class="service-icon" style="--icon-bg: #E0F2F1; --icon-color: #009688;"><i class='bx bxs-file-import'></i></div>
                                <div class="service-info"><h4>Disposisi Surat</h4><p>Lihat surat masuk</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="kirim-surat-internal-section">
                                <div class="service-icon" style="--icon-bg: #FFF3E0; --icon-color: #FF9800;"><i class='bx bxs-paper-plane'></i></div>
                                <div class="service-info"><h4>Kirim Surat Internal</h4><p>Buat & kirim surat</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="daftar-surat-internal-section">
                                <div class="service-icon" style="--icon-bg: #E3F2FD; --icon-color: #2196F3;"><i class='bx bx-list-ul'></i></div>
                                <div class="service-info"><h4>Daftar Surat Internal</h4><p>Lihat surat terkirim</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="surat-selesai-section">
                                <div class="service-icon" style="--icon-bg: #F3E5F5; --icon-color: #9C27B0;"><i class='bx bxs-archive-out'></i></div>
                                <div class="service-info"><h4>Surat Internal Selesai</h4><p>Riwayat surat tuntas</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="surat-masuk-selesai-section">
                                <div class="service-icon" style="--icon-bg: #E0F2F1; --icon-color: #009688;"><i class='bx bxs-file-import'></i></div>
                                <div class="service-info"><h4>Surat Masuk Selesai</h4><p>Lihat riwayat surat masuk</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="arsip-surat-section">
                                <div class="service-icon" style="--icon-bg: #F3E5F5; --icon-color: #9C27B0;"><i class='bx bxs-archive'></i></div>
                                <div class="service-info"><h4>Arsip Surat</h4><p>Lihat surat terarsip</p></div>
                            </a>
                            <a href="#" class="service-card nav-link" data-target="tte-section">
                                <div class="service-icon" style="--icon-bg: #FEEBC8; --icon-color: #DD6B20;"><i class='bx bxs-pen'></i></div>
                                <div class="service-info"><h4>Tanda Tangan Digital</h4><p>Sertifikasi & TTE Dokumen</p></div>
                            </a>
                        </div>
                    </div>
                    <div class="widget appointments-widget full-width">
                        <div class="widget-header">
                            <h2>Agenda Terjadwal Hari Ini</h2>
                            <a href="#" class="view-all nav-link" data-target="agenda-section">Lihat Semua</a>
                        </div>
                        <ul id="agenda-today-list" class="appointments-list">
                            <li id="agenda-today-loader" class="appointment-item-loading">
                                <i class='bx bx-loader-alt bx-spin'></i> Memuat agenda...
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
            
            <section id="disposisi-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Daftar Disposisi Surat Masuk</h2>
                    </div>
                    <div class="table-controls-dispo1">
                        <div class="table-controls-left-dispo2">
                            <div class="entries-control-dispo1">
                                <label for="entries-select-dispo1">Tampilkan</label>
                                <select id="entries-select-dispo1">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <label for="entries-select-dispo1">data</label>
                            </div>
                            <div class="filter-control-dispo2">
                                <label for="filter-select-dispo2">Status Balasan:</label>
                                <select id="filter-select-dispo2">
                                    <option value="all">Semua</option>
                                    <option value="0">Belum Dijawab</option>
                                    <option value="1">Sudah Dijawab</option>
                                </select>
                            </div>
                            <button id="reset-filter-dispo3" class="btn-reset-dispo3">Reset Filter</button>
                        </div>
                        <div class="search-control-dispo1">
                            <label for="search-input-dispo1">Cari:</label>
                            <input type="text" id="search-input-dispo1" placeholder="Ketik untuk mencari...">
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="disposisi-table">
                            <thead>
                                <tr>
                                    <th>No. Agenda</th>
                                    <th>No. Surat & Pengirim</th>
                                    <th>Sifat Surat</th>
                                    <th>Perihal</th>
                                    <th>File Surat</th>
                                    <th>Detail Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="disposisi-table-body">
                            </tbody>
                            <tbody id="disposisi-skeleton-loader" style="display: none;">
                                <script>
                                    for (let i = 0; i < 5; i++) {
                                        document.write(`
                                            <tr>
                                                <td><div class="skeleton-box" style="width: 60%;"></div></td>
                                                <td>
                                                    <div class="skeleton-box" style="width: 90%;"></div>
                                                    <div class="skeleton-box" style="width: 70%; margin-top: 8px;"></div>
                                                </td>
                                                <td><div class="skeleton-box" style="width: 80%;"></div></td>
                                                <td><div class="skeleton-box" style="width: 95%;"></div></td>
                                                <td><div class="skeleton-box" style="width: 40px; height: 30px;"></div></td>
                                                <td><div class="skeleton-box" style="width: 90px; height: 30px;"></div></td>
                                                <td><div class="skeleton-box" style="width: 80px; height: 50px;"></div></td>
                                            </tr>
                                        `);
                                    }
                                </script>
                            </tbody>
                        </table>
                    </div>
                    <div id="loading-spinner" style="display: none; text-align: center; padding: 20px;">
                        <i class='bx bx-loader-alt bx-spin' style='font-size: 40px; color: var(--primary-color);'></i>
                    </div>
                    <div class="pagination-controls-dispo1">
                        <span id="pagination-info-dispo1"></span>
                        <div class="pagination-buttons-dispo1" id="pagination-buttons-dispo1">
                        </div>
                    </div>
                </div>
            </section>

            <section id="kirim-surat-internal-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Formulir Kirim Surat Internal</h2>
                    </div>
                    <div id="feedback-ksi" class="feedback-message"></div>
                    <form id="form-kirim-surat-ksi" class="form-grid-ksi">
                        <div>
                            <div class="form-group-ksi">
                                <label for="no-surat-ksi">No. Surat</label>
                                <input type="text" id="no-surat-ksi" name="no_surat" required />
                            </div>
                            
                            <div class="form-group-ksi">
                                <label for="tgl-surat-ksi">Tanggal Surat</label>
                                <div class="date-input-wrapper-ksi">
                                    <input type="date" id="tgl-surat-ksi" name="tgl_surat" class="native-date-input-ksi" required />
                                    <span id="date-display-ksi" class="date-display-ksi">Pilih tanggal...</span>
                                    <i class='bx bxs-calendar-event'></i>
                                </div>
                            </div>
                            
                            <div class="form-group-ksi">
                                <label for="s-surat-ksi">Sifat Surat</label>
                                <select id="s-surat-ksi" name="s_surat">                                                  
                                    <option value="Biasa">Biasa</option>
                                    <option value="Penting">Penting</option>
                                    <option value="Pribadi">Pribadi</option>
                                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                                </select>
                            </div>
                             <div class="form-group-ksi">
                                <label for="perihal-ksi">Perihal</label>
                                <textarea id="perihal-ksi" name="perihal" rows="3" required></textarea>
                            </div>
                        </div>
                        <div>
                            <div class="form-group-ksi">
                                <label for="keterangan-ksi">Keterangan</label>
                                <textarea id="keterangan-ksi" name="keterangan" rows="3" required></textarea>
                            </div>
                             <div class="form-group-ksi">
                                <label for="j-lampiran-ksi">Jumlah Lampiran</label>
                                <input type="text" id="j-lampiran-ksi" name="j_lampiran" value="0" required />
                            </div>
                            <div class="form-group-ksi">
                                <label for="foto-ksi">File Surat (PDF, Max 5MB)</label>
                                <input type="file" id="foto-ksi" name="foto" class="input-file-ksi" accept=".pdf" required />
                            </div>
                        </div>
                        <div class="form-actions-ksi">
                            <button type="submit" class="btn-primary">
                                <span class="btn-text-ksi">Kirim Surat</span>
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section id="daftar-surat-internal-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Daftar Surat Internal Terkirim</h2>
                    </div>
                    <div class="table-wrapper-dsi">
                        <div class="table-controls-dsi">
                            <div class="controls-left-dsi">
                                <div class="entries-control-dsi">
                                    <label>Tampilkan</label>
                                    <select id="entries-select-dsi">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                    <span>data</span>
                                </div>
                                <div class="filter-control-dsi">
                                    <label for="filter-select-dsi">Status Verifikasi:</label>
                                    <select id="filter-select-dsi">
                                        <option value="all">Semua</option>
                                        <option value="Belum">Belum Diverifikasi</option>
                                        <option value="Sudah">Sudah Diverifikasi</option>
                                        <option value="Non-Aktif" id="filter-nonaktif-dsi" style="display: none;">Non-Aktif</option>
                                    </select>
                                </div>
                                <button id="reset-filter-dsi" class="btn-dsi btn-reset-dsi">
                                    <i class='bx bx-reset'></i> Reset Filter
                                </button>
                            </div>
                            <div class="search-wrapper-dsi">
                                <i class='bx bx-search'></i>
                                <input type="text" id="search-input-dsi" placeholder="Cari surat...">
                            </div>
                        </div>
                        <div class="table-responsive-dsi">
                            <table class="surat-internal-table-dsi">
                                <thead>
                                    <tr>
                                        <th>No. Surat & Agenda</th>
                                        <th>Perihal & File</th>
                                        <th>Petugas</th>
                                        <th>Verifikasi</th>
                                        <th>Disposisi & Catatan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="table-body-dsi">
                                    </tbody>
                            </table>
                        </div>
                        <div id="loading-spinner-dsi" style="display: none; text-align: center; padding: 20px;">
                           <i class='bx bx-loader-alt bx-spin' style='font-size: 40px; color: var(--primary-color);'></i>
                        </div>
                        <div class="pagination-controls-dsi">
                            <span id="pagination-info-dsi"></span>
                            <div class="pagination-buttons-dsi" id="pagination-buttons-dsi"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="surat-selesai-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Daftar Surat Internal Selesai</h2>
                    </div>
                    <div class="table-wrapper-dsi">
                        
                    <div class="table-controls-dsi">
                        <div class="controls-left-dsi">
                            <div class="entries-control-dsi">
                                <label for="entries-select-ss">Tampilkan:</label>
                                <select id="entries-select-ss">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <button id="reset-filter-ss" class="btn-dsi btn-reset-dsi">
                                <i class='bx bx-reset'></i> Reset
                            </button>
                        </div>
                        <div class="search-wrapper-dsi">
                            <i class='bx bx-search'></i>
                            <input type="text" id="search-input-ss" placeholder="Cari surat...">
                        </div>
                    </div>

                        <div class="table-responsive-dsi">
                            <table class="surat-internal-table-dsi">
                                <thead>
                                    <tr>
                                        <th>No. Surat & Agenda</th>
                                        <th>Perihal & File</th>
                                        <th>Pengirim</th>
                                        <th>Verifikasi</th>
                                        <th>Disposisi & Catatan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="table-body-ss">
                                    </tbody>
                            </table>
                        </div>
                        <div id="loading-spinner-ss" style="display: none; text-align: center; padding: 20px;">
                        <i class='bx bx-loader-alt bx-spin' style='font-size: 40px; color: var(--primary-color);'></i>
                        </div>
                        
                        <div class="pagination-controls-dsi">
                            <span id="pagination-info-ss"></span>
                            <div class="pagination-buttons-dsi" id="pagination-buttons-ss"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="surat-masuk-selesai-section" class="content-section">
                <div class="table-wrapper-sms">
                    <div class="widget-header" style="padding:0; margin-bottom: 20px;">
                        <h2>Daftar Surat Masuk Selesai</h2>
                    </div>
                    <div class="table-controls-sms">
                        <div class="controls-left-sms">
                            <div class="entries-control-sms">
                                <label for="entries-select-sms">Tampilkan:</label>
                                <select id="entries-select-sms" class="entries-select-sms">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div class="filter-control-sms">
                                <label for="filter-jenis-sms">Jenis:</label>
                                <select id="filter-jenis-sms" class="entries-select-sms">
                                    <option value="all">Semua</option>
                                    <option value="Internal">Internal</option>
                                    <option value="Eksternal">Eksternal</option>
                                </select>
                            </div>
                            <button id="reset-filter-sms" class="btn-dsi btn-reset-dsi">
                                <i class='bx bx-reset'></i> Reset
                            </button>
                        </div>
                        <div class="search-wrapper-sms">
                            <i class='bx bx-search'></i>
                            <input type="text" id="search-input-sms" class="search-input-sms" placeholder="Cari di dalam arsip...">
                        </div>
                    </div>

                    <div id="loading-spinner-sms" style="display: none; justify-content: center; padding: 40px;">
                    <i class='bx bx-loader-alt bx-spin' style='font-size: 50px; color: var(--primary-color);'></i>
                    </div>
                    <div id="card-list-sms" class="sms-card-list">
                        </div>
                    <div class="pagination-controls-dsi" style="margin-top: 20px; background-color: var(--bg-content); padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px var(--shadow-color);">
                        <span id="pagination-info-sms"></span>
                        <div class="pagination-buttons-dsi" id="pagination-buttons-sms"></div>
                    </div>
                </div>
            </section>

            <section id="arsip-surat-section" class="content-section">
                <div class="table-wrapper-sms">
                    <div class="widget-header" style="padding:0; margin-bottom: 20px;">
                        <h2>Daftar Arsip Surat</h2>
                    </div>
                    <div class="table-controls-sms">
                        <div class="controls-left-sms">
                            <div class="entries-control-sms">
                                <label for="entries-select-arsip">Tampilkan:</label>
                                <select id="entries-select-arsip" class="entries-select-sms">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div class="filter-control-sms">
                                <label for="filter-jenis-arsip">Jenis:</label>
                                <select id="filter-jenis-arsip" class="entries-select-sms">
                                    <option value="all">Semua</option>
                                    <option value="Internal">Internal</option>
                                    <option value="Eksternal">Eksternal</option>
                                </select>
                            </div>
                            <button id="reset-filter-arsip" class="btn-dsi btn-reset-dsi">
                                <i class='bx bx-reset'></i> Reset
                            </button>
                        </div>
                        <div class="search-wrapper-sms">
                            <i class='bx bx-search'></i>
                            <input type="text" id="search-input-arsip" class="search-input-sms" placeholder="Cari di dalam arsip...">
                        </div>
                    </div>

                    <div id="loading-spinner-arsip" style="display: none; justify-content: center; padding: 40px;">
                    <i class='bx bx-loader-alt bx-spin' style='font-size: 50px; color: var(--primary-color);'></i>
                    </div>
                    <div id="card-list-arsip" class="sms-card-list">
                        </div>
                    <div class="pagination-controls-dsi" style="margin-top: 20px; background-color: var(--bg-content); padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px var(--shadow-color);">
                        <span id="pagination-info-arsip"></span>
                        <div class="pagination-buttons-dsi" id="pagination-buttons-arsip"></div>
                    </div>
                </div>
            </section>

            <section id="tte-section" class="content-section">
                <div class="tte-container-full">
                    <div class="tte-controls-panel">
                        <div class="tte-card">
                            <div class="tte-card__icon"><i class='bx bxs-file-find'></i></div>
                            <h2>1. Pilih Dokumen</h2>
                            <p>Unggah dokumen PDF yang akan ditandatangani.</p>
                            <input type="file" id="tte-pdf-file" class="input-file-ksi" accept=".pdf" required />
                        </div>

                        <div class="tte-card">
                            <div class="tte-card__icon"><i class='bx bxs-pen'></i></div>
                            <h2>2. Siapkan Tanda Tangan</h2>
                            <p>Gambar TTD di kanvas atau unggah gambar TTD Anda.</p>
                            <canvas id="signature-pad" class="signature-pad"></canvas>
                            <div class="signature-controls">
                                <button id="clear-signature-btn" type="button" class="btn-secondary-dsi">Bersihkan</button>
                                <input type="file" id="signature-image-upload" accept="image/png" style="display: none;">
                                <label for="signature-image-upload" class="btn-secondary-dsi">Unggah Gambar</label>
                            </div>
                        </div>
                        
                        <div class="tte-card">
                            <div class="tte-card__icon"><i class='bx bxs-download'></i></div>
                            <h2>3. Atur Posisi & Unduh</h2>
                            <p>Klik pada *preview* untuk menempelkan TTD, lalu atur posisi & ukurannya. Klik "Unduh" jika sudah selesai.</p>
                            <button id="download-btn" class="btn-primary" style="width: 100%;">Terapkan TTD & Unduh</button>
                        </div>
                    </div>
                    <div class="tte-preview-panel">
                        <div id="pdf-preview-container" class="pdf-container">
                            </div>
                    </div>
                </div>
            </section>
            
            <!-- ============================================= -->
            <!--       SECTION BARU: SURAT MASUK ADMIN         -->
            <!-- ============================================= -->
            <section id="surat-masuk-admin-section" class="content-section">
                <div class="widget">
                    <div class="widget-header">
                        <h2>Manajemen Surat Masuk</h2>
                        <div class="widget-header-actions">
                            <button id="btn-tambah-suratMasukAdmin" class="btn-primary">
                                <i class='bx bx-plus'></i> Tambah Surat Masuk
                            </button>
                        </div>
                    </div>
                    <div class="table-wrapper-suratMasukAdmin">
                        <div class="table-controls-suratMasukAdmin">
                            <div class="controls-left-suratMasukAdmin">
                                <div class="entries-control-suratMasukAdmin">
                                    <label for="entries-select-suratMasukAdmin">Tampilkan</label>
                                    <select id="entries-select-suratMasukAdmin">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                    <span>data</span>
                                </div>
                                <div class="filter-control-suratMasukAdmin">
                                    <label for="filter-verifikasi-suratMasukAdmin">Verifikasi</label>
                                    <select id="filter-verifikasi-suratMasukAdmin">
                                        <option value="semua">Semua</option>
                                        <option value="belum">Belum</option>
                                        <option value="sudah">Sudah</option>
                                    </select>
                                </div>
                                <div class="filter-control-suratMasukAdmin">
                                    <label for="filter-status-suratMasukAdmin">Status</label>
                                    <select id="filter-status-suratMasukAdmin">
                                        <option value="belum_selesai">Belum Selesai</option>
                                        <option value="selesai">Selesai</option>
                                        <option value="nonaktif">Non-Aktif</option>
                                    </select>
                                </div>
                                <div class="filter-control-suratMasukAdmin">
                                    <label for="filter-disposisi-suratMasukAdmin">Status Disposisi</label>
                                    <select id="filter-disposisi-suratMasukAdmin">
                                        <option value="semua">Semua</option>
                                        <option value="belum">Belum Ada</option>
                                        <option value="sudah">Sudah Ada</option>
                                    </select>
                                </div>
                            </div>
                            <div class="search-wrapper-suratMasukAdmin">
                                <i class='bx bx-search'></i>
                                <input type="text" id="search-input-suratMasukAdmin" placeholder="Cari no. agenda, no. surat, perihal...">
                            </div>
                        </div>

                        <div class="table-responsive-suratMasukAdmin">
                            <table class="data-table-suratMasukAdmin">
                            <thead>
                                <tr>
                                    <th>No. Agenda & Surat</th>
                                    <th>Asal & Tanggal Surat</th>
                                    <th>Perihal & File</th>
                                    <th>Keterangan</th>
                                    <th>Jenis Surat</th>
                                    <th>Sifat Surat</th>
                                    <th>Prioritas</th>
                                    <th>Verifikasi</th>
                                    <th>Disposisi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                                <tbody id="table-body-suratMasukAdmin"></tbody>
                            </table>
                        </div>
                        
                        <div class="pagination-controls-suratMasukAdmin">
                            <span id="pagination-info-suratMasukAdmin"></span>
                            <div class="pagination-buttons-suratMasukAdmin" id="pagination-buttons-suratMasukAdmin"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- MODAL DISPOSISI BUBBLE HARUS ADA DI SINI -->
            <div id="modal-disposisi-bubble" class="modal-disposisi-overlay" style="display:none;">
                <div class="modal-disposisi-content">
                <div class="modal-disposisi-header">
                    <div>
                        <span class="modal-disposisi-title">Detail Disposisi Surat</span><br>
                    </div>
                    <button class="modal-disposisi-close">&times;</button>
                    </div>
                <div class="modal-disposisi-body" id="modalDisposisiBubbleBody"></div>
                </div>
            </div>

            <div id="modal-img-zoom" class="modal-img-zoom-overlay" style="display:none;">
            <div class="modal-img-zoom-content">
                <img id="modalImgZoomTag" src="" alt="" />
                <div class="modal-img-zoom-title" id="modalImgZoomTitle"></div>
                <button class="modal-img-zoom-close" title="Tutup">&times;</button>
            </div>
            </div>

            <!-- ============================================= -->
            ``<!--       MODAL-MODAL UNTUK SURAT MASUK ADMIN     -->
            <!-- ============================================= -->

            <!-- MODAL TAMBAH/UBAH -->
            <div id="suratMasukAdmin-modal-tambahUbah" class="modal-container-suratMasukAdmin" style="display: none;">
                <div class="modal-content-suratMasukAdmin large">
                    <div class="modal-header-suratMasukAdmin">
                        <h3 id="suratMasukAdmin-modal-tambahUbah-title">Tambah Surat Masuk Baru</h3>
                        <span class="modal-close-suratMasukAdmin" data-modal-id="suratMasukAdmin-modal-tambahUbah">&times;</span>
                    </div>
                    <form id="suratMasukAdmin-form-tambahUbah" enctype="multipart/form-data">
                        <div class="modal-body-suratMasukAdmin form-grid-suratMasukAdmin">
                            <input type="hidden" id="tambahUbah-id_surat" name="id_surat">
                            <div class="form-column">
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-no_agenda">No. Agenda</label><input type="text" id="tambahUbah-no_agenda" name="no_agenda" class="form-input-suratMasukAdmin" required></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-no_surat">No. Surat</label><input type="text" id="tambahUbah-no_surat" name="no_surat" class="form-input-suratMasukAdmin" required></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-pengirim">Pengirim</label><input type="text" id="tambahUbah-pengirim" name="pengirim" class="form-input-suratMasukAdmin" required></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-tgl_surat">Tanggal Surat</label><input type="date" class="form-input-suratMasukAdmin" required name="tgl_surat" id="tambahUbah-tgl_surat"></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-perihal">Perihal/Resume</label><textarea class="form-input-suratMasukAdmin" rows="4" name="perihal" id="tambahUbah-perihal" required></textarea></div>
                            </div>
                            <div class="form-column">
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-tgl_terima">Tanggal Terima</label><input type="date" class="form-input-suratMasukAdmin" required name="tgl_terima" id="tambahUbah-tgl_terima"></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-j_surat">Jenis Surat</label><select class="form-input-suratMasukAdmin" id="tambahUbah-j_surat" name="j_surat"><option value="Eksternal">Eksternal</option><option value="Internal">Internal</option></select></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-s_surat">Sifat Surat</label><select class="form-input-suratMasukAdmin" id="tambahUbah-s_surat" name="s_surat"><option value="Biasa">Biasa</option><option value="Penting">Penting</option><option value="Pribadi">Pribadi</option><option value="Sangat Rahasia">Sangat Rahasia</option></select></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-p_surat">Prioritas Surat</label><select class="form-input-suratMasukAdmin" id="tambahUbah-p_surat" name="p_surat"><option value="Biasa (5 Hari)">Biasa (5 Hari)</option><option value="Segera (3 Hari)">Segera (3 Hari)</option><option value="Sangat Segera (1 Hari)">Sangat Segera (1 Hari)</option></select></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-krtl">Keterangan / RTL</label><input class="form-input-suratMasukAdmin" id="tambahUbah-krtl" name="krtl" required></div>
                                <div class="form-group-suratMasukAdmin"><label for="tambahUbah-j_lampiran">Jumlah Lampiran</label><input type="number" class="form-input-suratMasukAdmin" name="j_lampiran" id="tambahUbah-j_lampiran" value="0" required></div>
                                <div class="form-group-suratMasukAdmin"><label id="label-file_surat" for="tambahUbah-file_surat">File Surat (Format .pdf)</label><input type="file" name="file_surat" id="tambahUbah-file_surat" accept=".pdf"></div>
                            </div>
                        </div>
                        <div class="form-actions-suratMasukAdmin"><button type="button" class="btn-secondary-suratMasukAdmin" data-modal-id="suratMasukAdmin-modal-tambahUbah">Batal</button><button type="submit" class="btn-primary-suratMasukAdmin">Simpan</button></div>
                    </form>
                </div>
            </div>

            <!-- MODAL VALIDASI -->
            <div id="suratMasukAdmin-modal-validasi" class="modal-container-suratMasukAdmin" style="display: none;">
                <div class="modal-content-suratMasukAdmin">
                    <div class="modal-header-suratMasukAdmin"><h3 id="suratMasukAdmin-modal-validasi-title">Validasi Surat</h3><span class="modal-close-suratMasukAdmin" data-modal-id="suratMasukAdmin-modal-validasi">&times;</span></div>
                    <form id="suratMasukAdmin-form-validasi">
                        <div class="modal-body-suratMasukAdmin">
                            <input type="hidden" id="validasi-id_surat" name="id_surat">
                            <p>Anda akan memvalidasi surat dengan No. Agenda: <strong id="validasi-no_agenda_display">-</strong></p>
                            <div class="form-group-suratMasukAdmin"><label for="validasi-keterangan">Keterangan (Opsional)</label><textarea id="validasi-keterangan" name="keterangan" class="form-input-suratMasukAdmin" rows="3"></textarea></div>
                        </div>
                        <div class="form-actions-suratMasukAdmin"><button type="button" class="btn-secondary-suratMasukAdmin" data-modal-id="suratMasukAdmin-modal-validasi">Batal</button><button type="submit" class="btn-primary-suratMasukAdmin">Validasi Sekarang</button></div>
                    </form>
                </div>
            </div>

            <!-- MODAL DISPOSISI -->
            <div id="suratMasukAdmin-modal-disposisi" class="modal-container-suratMasukAdmin" style="display: none;">
                <div class="modal-content-suratMasukAdmin large">
                    <div class="modal-header-suratMasukAdmin"><h3 id="suratMasukAdmin-modal-disposisi-title">Disposisi Surat</h3><span class="modal-close-suratMasukAdmin" data-modal-id="suratMasukAdmin-modal-disposisi">&times;</span></div>
                    <div class="modal-body-suratMasukAdmin">
                        <input type="hidden" id="disposisi-id_surat">
                        <div class="disposisi-info-header">
                            <p><strong>No. Agenda:</strong> <span id="disposisi-no_agenda"></span></p>
                            <p><strong>Perihal:</strong> <span id="disposisi-perihal"></span></p>
                        </div>
                        <form id="suratMasukAdmin-form-disposisi-tambah">
                            <h4>Tambah Disposisi Baru</h4>
                            <div class="form-group-suratMasukAdmin">
                                <label for="disposisi-unit">Disposisikan ke Unit/Bagian:</label>
                                <select id="disposisi-unit" class="form-input-suratMasukAdmin" multiple></select>
                            </div>
                            <div class="form-actions-suratMasukAdmin" style="padding-top: 0; border-top: 0;">
                                <button type="submit" class="btn-primary-suratMasukAdmin">Kirim Disposisi</button>
                            </div>
                        </form>
                        <hr class="disposisi-divider">
                        <h4>Unit yang Telah Didisposisi</h4>
                        <div id="disposisi-list-container" class="disposisi-list"></div>
                    </div>
                </div>
            </div>

            <section id="report-section" class="content-section"><div class="widget"><h2>Laporan (Report)</h2><p>Konten untuk laporan.</p></div></section>
            <section id="notifications-section" class="content-section"><div class="widget"><h2>Notifikasi (Notifications)</h2><p>Konten untuk notifikasi.</p></div></section>

            <section id="agenda-section" class="content-section">
                <div class="page-container-agenda">
                    <div class="page-header-agenda">
                        <h2>Agenda Kegiatan</h2>
                        <p>Jadwal dan agenda kegiatan terpusat untuk semua unit.</p>
                    </div>
                    <div id="calendar-container" class="agenda-container">
                        <div id="calendar-container"></div>
                    </div>
                </div>
            </section>

            <section id="profile-section" class="content-section">
                <div class="profile-grid">
                    <div class="widget">
                        <div class="widget-header">
                            <h2>Profil Pengguna</h2>
                        </div>
                        <div id="profile-feedback" class="feedback-message"></div>
                        <form id="profile-form" class="profile-form">
                            <div class="form-group">
                                <label for="profile-nip">NIP</label>
                                <input type="text" id="profile-nip" name="nip" readonly>
                            </div>
                            <div class="form-group">
                                <label for="profile-username">Username</label>
                                <input type="text" id="profile-username" name="user_login" readonly>
                            </div>
                            <div class="form-group">
                                <label for="profile-name">Nama Lengkap</label>
                                <input type="text" id="profile-name" name="nm_pegawai" required>
                            </div>
                            <button type="submit" class="btn-primary">Simpan Perubahan</button>
                        </form>
                    </div>

                    <div class="widget">
                        <div class="widget-header">
                            <h2>Ganti Password</h2>
                        </div>
                         <div id="password-feedback" class="feedback-message"></div>
                        <form id="password-form" class="profile-form">
                            <div class="form-group">
                                <label for="old-password">Password Lama</label>
                                <input type="password" id="old-password" name="old_password" required>
                            </div>
                            <div class="form-group">
                                <label for="new-password">Password Baru</label>
                                <input type="password" id="new-password" name="new_password" required minlength="8">
                            </div>
                             <div class="form-group">
                                <label for="confirm-password">Konfirmasi Password Baru</label>
                                <input type="password" id="confirm-password" name="confirm_password" required>
                            </div>
                            <button type="submit" class="btn-primary">Ubah Password</button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <div id="status-modal" class="modal-container-status">
        <div class="modal-content-status">
            <div class="modal-header-status">
                <h3>Detail Status Disposisi</h3>
                <span class="modal-close-status">&times;</span>
            </div>
            <div class="modal-body-status" id="modal-body-content-status"></div>
        </div>
    </div>

    <div id="bagian-modal" class="modal-container-bagian" style="display: none;">
        <div class="modal-content-bagian">
            <div class="modal-header-bagian">
                <h3 id="bagian-modal-title">Tambah Bagian Baru</h3>
                <span id="bagian-modal-close" class="modal-close-bagian">&times;</span>
            </div>
            <div class="modal-body-bagian">
                <form id="bagian-form">
                    <div class="form-group-bagian">
                        <label for="bagian-kode">Kode Bagian</label>
                        <input type="text" id="bagian-kode" class="form-input-bagian" required>
                    </div>
                    <div class="form-group-bagian">
                        <label for="bagian-nama">Nama Bagian</label>
                        <input type="text" id="bagian-nama" class="form-input-bagian" required>
                    </div>
                    <div class="form-actions-bagian">
                        <button type="button" id="bagian-cancel-btn" class="btn-secondary-bagian">Batal</button>
                        <button type="submit" class="btn-primary-bagian">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="pdf-modal" class="modal-container-pdf">
        <div class="modal-content-pdf">
            <div class="modal-header-pdf">
                <h3 id="pdf-modal-title">Tampilan Dokumen</h3>
                <div class="modal-header-actions-pdf">
                    <button id="pdf-download-btn" class="modal-action-btn-pdf" title="Download Watermarked PDF"><i class='bx bx-download'></i></button>
                    <span class="modal-close-pdf">&times;</span>
                </div>
            </div>
            <div class="modal-body-pdf">
                <div class="pdf-viewer-container">
                    <canvas id="pdf-canvas"></canvas>
                </div>
                <div id="pdf-loader" class="pdf-loader">
                    <i class='bx bx-loader-alt bx-spin'></i> Memuat Dokumen...
                </div>
            </div>
            <div class="pdf-navigation">
                <button id="pdf-prev-btn"><i class='bx bx-chevron-left'></i> Sebelumnya</button>
                <span id="pdf-page-indicator"></span>
                <button id="pdf-next-btn">Berikutnya <i class='bx bx-chevron-right'></i></button>
            </div>
        </div>
    </div>
    
    <div id="command-palette-container" class="command-palette-container">
        <div id="command-palette" class="command-palette-modal">
            <div class="command-palette-header">
                <i class='bx bx-search'></i>
                <input type="text" id="command-palette-input" placeholder="Ketik perintah atau cari navigasi...">
                <div class="command-palette-shortcut">ESC</div>
            </div>
            <ul id="command-palette-results" class="command-palette-results">
            </ul>
            <div class="command-palette-footer">
                <span><kbd>↑</kbd> <kbd>↓</kbd> untuk navigasi</span>
                <span><kbd>↵</kbd> untuk memilih</span>
            </div>
        </div>
    </div>

    <div id="verif-modal-dsi" class="modal-container-dsi" style="display: none;">
        <div class="modal-content-dsi">
            <div class="modal-header-dsi">
                <h3>Formulir Verifikasi Surat Internal</h3>
                <span id="verif-modal-close-dsi" class="modal-close-dsi">&times;</span>
            </div>
            <div class="modal-body-dsi">
                <div id="verif-feedback-dsi" class="feedback-message"></div>
                <form id="verif-form-dsi" class="form-grid-ksi">
                    <input type="hidden" id="verif-id-surat-dsi" name="id_surat_int">
                    
                    <div>
                        <div class="form-group-dsi">
                            <label>No. Agenda (Otomatis)</label>
                            <input type="text" id="verif-no-agenda-dsi" name="no_agenda" class="form-input-dsi" readonly required>
                        </div>
                        <div class="form-group-dsi">
                            <label>No. Surat</label>
                            <p id="verif-no-surat-dsi" class="form-static-text-dsi">-</p>
                        </div>
                        <div class="form-group-dsi">
                            <label>Pengirim</label>
                            <p id="verif-pengirim-dsi" class="form-static-text-dsi">-</p>
                        </div>
                        <div class="form-group-dsi">
                            <label>Tanggal Surat</label>
                            <p id="verif-tgl-surat-dsi" class="form-static-text-dsi">-</p>
                        </div>
                    </div>
                    
                    <div>
                        <div class="form-group-dsi">
                            <label for="verif-tgl-terima-dsi">Tanggal Terima</label>
                            <input type="date" id="verif-tgl-terima-dsi" name="tgl_terima" class="form-input-dsi" required>
                        </div>
                        <div class="form-group-dsi">
                            <label for="verif-p-surat-dsi">Prioritas Surat</label>
                            <select id="verif-p-surat-dsi" name="p_surat" class="form-input-dsi" required>
                                <option value="Biasa (5 Hari)">Biasa (5 Hari)</option>
                                <option value="Segera (3 Hari)">Segera (3 Hari)</option>
                                <option value="Sangat Segera (1 Hari)">Sangat Segera (1 Hari)</option>
                            </select>
                        </div>
                        <div class="form-group-dsi">
                            <label>Perihal</label>
                            <p id="verif-perihal-dsi" class="form-static-text-dsi" style="min-height: 90px; align-items: flex-start;">-</p>
                        </div>
                    </div>

                    <div class="form-actions-ksi">
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">Verifikasi & Simpan</span>
                            <span class="btn-spinner" style="display: none;"><i class='bx bx-loader-alt'></i></span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
	
	<div id="status-modal" class="modal-container-status"></div>
    <div id="pdf-modal" class="modal-container-pdf"></div>
    <div id="command-palette-container" class="command-palette-container"></div>
    
	<div id="modal-container-jwb" class="modal-container-jwb" style="display: none;">
        <div class="modal-content-jwb">
            <div class="modal-header-jwb">
                <h3>Jawab Disposisi</h3>
                <span id="modal-close-jwb" class="modal-close-jwb">&times;</span>
            </div>
            <div class="modal-body-jwb">
                <div id="loader-jwb">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
                <div id="content-wrapper-jwb" style="display: none;">
                    <div class="header-surat-jwb">
                        <a href="#" id="view-pdf-jwb" class="view-pdf-button-jwb" title="Lihat File PDF">
                            <i class='bx bxs-file-pdf'></i>
                            <span>Lihat File</span>
                        </a>
                        <h4 id="perihal-jwb"></h4>
                        <p><span id="pengirim-jwb"></span> • <span id="tgl-terima-jwb"></span></p>
                        <p class="meta-jwb"><span id="verif-jwb"></span> • <span id="wkt-verif-jwb"></span></p>
                    </div>
                    <div class="panel-jwb">
                        <div class="panel-heading-jwb">Riwayat Disposisi</div>
                        <div id="history-body-jwb" class="panel-body-jwb"></div>
                    </div>
                    <div class="panel-jwb">
                        <div class="panel-heading-jwb">Tulis Jawaban Anda</div>
                        <div class="panel-body-jwb">
                            <div id="feedback-jwb" class="feedback-message"></div>
                            <form id="form-jwb" class="form-jwb">
                                <div class="form-group-jwb">
                                    <label for="isi-dispos-jwb">Isi Jawaban:</label>
                                    <textarea name="isi_dispos" id="isi-dispos-jwb" rows="5" required></textarea>
                                </div>
                                <div class="form-group-jwb">
                                    <label for="attachment-jwb">Lampirkan File (Opsional, Max 5MB)</label>
                                    <input type="file" name="attachment" id="attachment-jwb" class="input-file-jwb">
                                </div>
                                <div class="form-group-jwb signature-feature-jwb">
                                    <label>Tanda Tangan / Paraf:</label>
                                    <canvas id="signature-pad-jwb" class="signature-pad-jwb" width="300" height="150"></canvas>
                                    <div id="signature-error-jwb" class="error-message-jwb"></div>
                                    <button type="button" id="clear-signature-jwb" class="btn-secondary-jwb">Bersihkan</button>
                                </div>
                                <button type="submit" class="btn-primary">Simpan Disposisi</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="attachment-preview-modal" class="attachment-modal-jwb" style="display: none;">
        <span id="attachment-modal-close-jwb" class="attachment-modal-close-jwb">&times;</span>
        <div class="attachment-modal-content-jwb">
            <img src="" alt="Pratinjau Gambar" id="attachment-image-preview-jwb" style="display: none;">
            <video src="" id="attachment-video-preview-jwb" controls style="display: none;"></video>
        </div>
        <div id="attachment-modal-caption-jwb" class="attachment-modal-caption-jwb"></div>
    </div>

    <div id="success-modal-ksi" class="modal-container-ksi" style="display: none;">
        <div class="modal-content-ksi">
            <div class="modal-icon-ksi success">
                <i class='bx bx-check'></i>
            </div>
            <h3>Surat Internal Berhasil diBuat</h3>
            <p id="success-modal-message-ksi"></p>
            <button id="success-modal-ok-btn-ksi" class="btn-primary">OK</button>
        </div>
    </div>

    <div id="catatan-modal-dsi" class="modal-container-dsi" style="display: none;">
        <div class="modal-content-dsi">
            <div class="modal-header-dsi">
                <h3>Buat Catatan untuk Surat Internal</h3>
                <span id="catatan-modal-close-dsi" class="modal-close-dsi">&times;</span>
            </div>
            <div class="modal-body-dsi">
                <div id="catatan-feedback-dsi" class="feedback-message"></div>
                <form id="catatan-form-dsi">
                    <div class="form-group-dsi">
                        <label for="catatan-textarea-dsi">Catatan Anda:</label>
                        <textarea id="catatan-textarea-dsi" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Simpan Catatan</button>
                </form>
            </div>
        </div>
    </div>

    <div id="confirm-edit-catatan-modal-dsi" class="modal-container-dsi" style="display: none;">
        <div class="modal-content-dsi">
            <div class="modal-header-dsi">
                <h3>Konfirmasi</h3>
            </div>
            <div class="modal-body-dsi">
                <p>Sudah ada catatan untuk surat ini. Apakah Anda ingin mengubah catatan sebelumnya?</p>
                <div class="modal-actions-dsi">
                    <button id="confirm-yes-btn-dsi" class="btn-primary">Ya, Ubah Catatan</button>
                    <button id="confirm-no-btn-dsi" class="btn-secondary-dsi">Tidak, Batal</button>
                </div>
            </div>
        </div>
    </div>

    <div id="ubah-surat-modal-usi" class="modal-container-usi" style="display: none;">
        <div class="modal-content-usi">
            <div class="modal-header-usi">
                <h3>Ubah Surat Internal</h3>
                <span id="ubah-surat-close-usi" class="modal-close-usi">&times;</span>
            </div>
            <div class="modal-body-usi">
                <div id="ubah-surat-loader-usi" style="text-align: center; padding: 40px;">
                    <i class='bx bx-loader-alt bx-spin' style='font-size: 40px; color: var(--primary-color);'></i>
                </div>
                <div id="ubah-surat-feedback-usi" class="feedback-message"></div>
                <form id="ubah-surat-form-usi" style="display: none;">
                    </form>
            </div>
        </div>
    </div>

    <div id="confirm-ubah-modal-usi" class="modal-container-usi" style="display: none;">
        <div class="modal-content-usi confirm">
            <div class="modal-body-usi">
                <div class="modal-icon-ksi warning">
                    <i class='bx bx-error-circle'></i>
                </div>
                <h3>Konfirmasi Perubahan</h3>
                <p>Apakah Anda yakin data surat internal yang diubah sudah sesuai?</p>
                <div class="modal-actions-dsi">
                    <button id="confirm-ubah-no-btn-usi" class="btn-secondary-dsi">Batal</button>
                    <button id="confirm-ubah-yes-btn-usi" class="btn-primary">Ya, Simpan</button>
                </div>
            </div>
        </div>
    </div>

    <div id="agenda-modal" class="modal-container-status">
        <div class="modal-content-agenda">
            <div class="modal-header-agenda">
                <h3 id="agenda-modal-title">Tambah Agenda</h3>
            </div>
            <div class="modal-body-agenda">
                <form id="agenda-form">
                    <input type="hidden" id="agenda-id">
                    <div class="form-group-agenda">
                        <label for="agenda-title">Judul Agenda</label>
                        <input type="text" id="agenda-title" class="form-input-agenda" required>
                    </div>
                    <div class="form-group-agenda">
                        <label for="agenda-desc">Deskripsi</label>
                        <textarea id="agenda-desc" class="form-input-agenda" rows="3"></textarea>
                    </div>
                    <div class="form-group-agenda">
                        <label for="agenda-pemohon">Nama Pemohon</label>
                        <input type="text" id="agenda-pemohon" class="form-input-agenda">
                    </div>
                    <div class="form-group-agenda">
                        <label for="agenda-lokasi">Lokasi</label>
                        <input type="text" id="agenda-lokasi" class="form-input-agenda">
                    </div>
                    <div class="form-row-agenda">
                        <div class="form-group-agenda" style="position: relative;">
                            <label for="agenda-start-date">Tanggal Mulai</label>
                            <input type="date" id="agenda-start-date" class="form-input-agenda" required>
                        </div>
                    </div>
                    <div class="form-row-agenda">
                        <div class="form-group-agenda">
                            <label for="agenda-start-time">Jam Mulai</label>
                            <div class="time-input-wrapper">
                                <input type="time" id="agenda-start-time" class="form-input-agenda" required>
                            </div>
                        </div>
                        <div class="form-group-agenda">
                            <label for="agenda-end-time">Jam Selesai</label>
                            <div class="time-input-wrapper">
                                <input type="time" id="agenda-end-time" class="form-input-agenda">
                            </div>
                        </div>
                    </div>
                    
                    
                    <div class="agenda-form-actions">
                        <button type="submit" class="btn-primary">Simpan</button>
                        <button type="button" id="agenda-delete-btn" class="btn-danger-agd" style="display: none;">Hapus</button>
                        <button type="button" id="agenda-cancel-btn" class="btn-secondary-agd">Batal</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="riwayat-modal-container" class="modal-container-jwb" style="display: none;">
        <div class="modal-content-jwb">
            <div class="modal-header-jwb">
                <h3>Isi Disposisi</h3>
                <div class="modal-header-actions-pdf">
                    <button id="print-riwayat-btn" class="modal-action-btn-pdf" title="Cetak Riwayat Disposisi">
                        <i class='bx bx-printer'></i>
                    </button>
                    <span class="modal-close-riwayat modal-close-jwb">&times;</span>
                </div>
            </div>
            <div class="modal-body-jwb">
                <div class="loader-riwayat loader-jwb" style="display: none;"><i class='bx bx-loader-alt bx-spin'></i></div>
                <div class="content-wrapper-riwayat" style="display: none;">
                    <div class="header-surat-jwb">
                        <h4 class="perihal-riwayat">Perihal: Memuat...</h4>
                        <p>
                            <span class="pengirim-riwayat">Dari: Memuat...</span>
                            <span class="no-agenda-riwayat" style="margin-left: 10px; font-weight: 600; color: var(--primary-color);"></span>
                        </p>
                        <a href="#" class="view-pdf-riwayat view-pdf-button-jwb">
                            <i class='bx bxs-file-pdf'></i>
                            <span>Lihat PDF</span>
                        </a>
                    </div>
                    <div class="panel-jwb" id="panel-riwayat-cetak"> <div class="panel-heading-jwb">Riwayat Percakapan</div>
                        <div class="history-body-riwayat panel-body-jwb">
                            </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="status-modal-ss" class="modal-container-status" style="display: none;">
        <div class="modal-content-status">
            <div class="modal-header-status">
                <h3>Detail Disposisi & Catatan</h3>
                <span class="modal-close-status">&times;</span>
            </div>
            <div class="modal-body-status">
                </div>
        </div>
    </div>

    <div id="detail-list-modal" class="modal-container-status" style="display: none;">
        <div class="modal-content-status">
            <div class="modal-header-status">
                <h3 id="detail-list-title">Detail</h3>
                <span class="modal-close-status">&times;</span>
            </div>
            <div class="modal-body-status" id="detail-list-body">
                </div>
        </div>
    </div>                                
    
    <nav class="mobile-nav">
        <a href="#" class="nav-link active" data-target="home-section"><i class='bx bxs-home'></i><span>Home</span></a>
        <a href="#" class="nav-link" data-target="disposisi-section"><i class='bx bx-file-find'></i><span>Disposisi</span></a>
        <a href="#" class="nav-link" id="open-cp-mobile">
            <i class='bx bx-search-alt'></i>
            <span>Cari</span>
        </a>
        <a href="#" class="nav-link" data-target="agenda-section"><i class='bx bx-calendar-event'></i><span>Agenda</span></a>
        <a href="#" class="nav-link" data-target="notifications-section"><i class='bx bxs-bell'></i><span>Notifications</span></a>
    </nav>

    <script src="assets/js/lib/pdf.min.js"></script>
    <script src="assets/js/lib/pdf-lib.min.js"></script>
    <script>
        // Mengatur path untuk worker pdf.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/lib/pdf.worker.min.js';
    </script>
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/locales/id.js'></script>                                
    <script src="assets/js/pdfjs/pdf.mjs" type="module"></script>
    <script src="assets/js/script.mjs" type="module"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>    

</body>
</html>