// public/js/import.js
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('surveybiz_user');
    if (!userStr) { window.location.href = 'index.html'; return; }
    const user = JSON.parse(userStr);
    
    if (user.role !== 'Admin') {
        alert('Hanya Admin yang boleh mengimpor data.');
        window.location.href = 'dashboard.html';
        return;
    }

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const uploadBtn = document.getElementById('uploadBtn');

    // 1. PAKSA tombol untuk selalu aktif saat halaman dimuat
    if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.style.pointerEvents = 'auto'; // Paksa agar bisa diklik
        uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (dropzone && fileInput) dropzone.addEventListener('click', () => fileInput.click());

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                fileSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
                fileInfo.classList.remove('hidden');
            }
        });
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.classList.add('hidden');
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            // Cek apakah library XLSX berhasil dimuat oleh browser
            if (typeof XLSX === 'undefined') {
                alert("Sistem masih memuat pustaka pembaca Excel. Pastikan koneksi internet Anda aktif, atau muat ulang (Refresh) halaman.");
                return;
            }

            const file = fileInput.files[0];
            if (!file) {
                alert("Silakan pilih berkas CSV atau XLSX terlebih dahulu!");
                return;
            }

            uploadBtn.textContent = 'Memproses Validasi... Mohon tunggu';
            uploadBtn.disabled = true;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    // Baca file menjadi JSON, defval memastikan sel kosong terbaca sebagai string kosong
                    const jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

                    console.log("Data terkirim ke backend:", jsonRows.length, "baris");

                    const response = await fetch('http://localhost:8080/api/import/process-json', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, data: jsonRows })
                    });
                    
                    const result = await response.json();
                    if (response.ok && result.success) {
                        alert('Validasi sukses! Sistem akan mengarahkan Anda ke Dasbor Kualitas.');
                        window.location.href = 'monitoring.html';
                    } else {
                        alert('Gagal dari server: ' + (result.error || 'Terjadi kesalahan sistem'));
                        resetUploadBtn();
                    }
                } catch (err) {
                    console.error("Error Frontend:", err);
                    alert('Gagal memproses file. Periksa konsol (F12).');
                    resetUploadBtn();
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function resetUploadBtn() {
        uploadBtn.textContent = 'Mulai Proses Validasi';
        uploadBtn.disabled = false;
        uploadBtn.style.pointerEvents = 'auto';
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});

// Aksesibilitas: Enter / Spasi membuka dialog pilih berkas
document.getElementById('dropzone').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
});