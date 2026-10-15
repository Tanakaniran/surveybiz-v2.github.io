// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek Sesi Login (Keamanan)
    const userStr = localStorage.getItem('surveybiz_user');
    if (!userStr) { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    const user = JSON.parse(userStr);

    // 2. Isi Profil Pengguna di Header
    document.getElementById('userName').textContent = user.name || user.username || 'Pengguna';
    document.getElementById('userRole').textContent = user.role || 'Manager';
    document.getElementById('userInitials').textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();

    // 3. Batasi Menu Berdasarkan Peran (RBAC)
    if (user.role === 'Manager') {
        const menuCustomers = document.getElementById('menu-customers');
        const menuImport = document.getElementById('menu-import');
        if(menuCustomers) menuCustomers.style.display = 'none';
        if(menuImport) menuImport.style.display = 'none';
    } else if (user.role === 'Analyst') {
        const menuImport = document.getElementById('menu-import');
        if(menuImport) menuImport.style.display = 'none';
    }

    // 4. Tarik Data dari API Fastify
    try {
        const [statsResponse, errorResponse] = await Promise.all([
            fetch('http://localhost:8080/api/customers/stats'),
            fetch('http://localhost:8080/api/import/latest')
        ]);

        const statsResult = await statsResponse.json();
        const errorResult = await errorResponse.json();

        // 5. Suntikkan Data ke Dasbor Utama
        if (statsResult.success) {
            document.getElementById('totalPelangganAktif').textContent = statsResult.total_active;
            
            // Render Sebaran Kota dengan Tata Letak yang Lebih Dalam dan Rapi
            const activityContainer = document.getElementById('recentActivityContainer');
            if (statsResult.city_distribution && statsResult.city_distribution.length > 0) {
                activityContainer.innerHTML = ''; 
                statsResult.city_distribution.forEach(item => {
                    activityContainer.innerHTML += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; margin-bottom: 0.5rem; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem;">
                            <span style="color: #334155; font-weight: 500;">📍 ${item.city || 'Tidak diketahui'}</span>
                            <span style="font-weight: 600; color: #047857; bg-color: #ecfdf5; padding: 0.25rem 0.6rem; border-radius: 9999px;">${item.count} pelanggan</span>
                        </div>
                    `;
                });
            } else {
                activityContainer.innerHTML = `<p style="font-size: 0.875rem; color: #64748b; text-align: center; padding: 1rem 0;">Belum ada sebaran kota.</p>`;
            }
        }

        if (errorResult.success && errorResult.summary) {
            document.getElementById('totalDataBermasalah').textContent = errorResult.summary.invalid_count;
            
            document.getElementById('apiWaitBadge').style.display = 'none';
            document.getElementById('emptyStateMessage').style.display = 'none';

            const tbody = document.getElementById('issueTableBody');
            tbody.innerHTML = '';
            const topErrors = errorResult.errors.slice(0, 5);
            
            if (topErrors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 1rem; color: #10b981;">✅ Semua data bersih.</td></tr>`;
            } else {
                topErrors.forEach(err => {
                    tbody.innerHTML += `
                        <tr>
                            <td style="padding: 0.75rem; font-family: monospace; font-size: 0.875rem; color: #64748b;">Baris ${err.row_index}</td>
                            <td style="padding: 0.75rem; font-weight: 500;">${err.column_name}</td>
                            <td style="padding: 0.75rem; color: #dc2626; font-size: 0.875rem;">${err.error_type}</td>
                        </tr>
                    `;
                });
            }
        } else {
            document.getElementById('totalDataBermasalah').textContent = '0';
        }

    } catch (error) {
        console.error('Gagal memuat data dasbor:', error);
        document.getElementById('apiWaitBadge').textContent = 'Gagal Koneksi API';
        document.getElementById('apiWaitBadge').style.background = '#fee2e2';
        document.getElementById('apiWaitBadge').style.color = '#991b1b';
    }

    // 6. Fungsionalitas Tombol Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});

// Tanggal hari ini (hanya tampilan)
document.getElementById('todayDate').textContent =
new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});