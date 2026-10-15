document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('surveybiz_user');
    if (!userStr) { window.location.href = 'index.html'; return; }
    
    // RBAC
    const user = JSON.parse(userStr);
    if (user.role === 'Manager') {
        alert("Manager tidak memiliki akses operasional.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/import/latest');
        const result = await response.json();

        if (result.success && result.summary) {
            // TITIK A: total_processed diubah menjadi total_records
            document.querySelectorAll('.text-3xl')[0].textContent = result.summary.total_records ?? 0;
            document.querySelectorAll('.text-3xl')[1].textContent = result.summary.valid_count ?? 0;
            document.querySelectorAll('.text-3xl')[2].textContent = result.summary.invalid_count ?? 0;

            const tbody = document.getElementById('errorTableBody');
            tbody.innerHTML = '';
            
            if (result.errors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-emerald-600 font-semibold">Semua data valid! Tidak ada anomali.</td></tr>`;
            } else {
                result.errors.forEach((err, idx) => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-red-50 transition-colors';
                    tr.innerHTML = `
                        <!-- TITIK B: row_number diubah menjadi row_index -->
                        <td class="p-4 font-mono text-xs text-slate-500">Baris ${err.row_index ?? '-'}</td>
                        <td class="p-4 font-medium text-slate-800">${err.column_name ?? '-'}</td>
                        <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">${err.error_type}</span></td>
                        <td class="p-4 text-slate-600 text-xs">${err.error_message}</td>
                        <!-- TITIK C: raw_value dihapus, diganti string statis "-" -->
                        <td class="p-4 font-mono text-xs text-red-500 bg-red-50 border border-red-100 rounded">-</td>
                        <td class="p-4"><button onclick="this.closest('tr').remove()" class="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded">Abaikan</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (error) {
        console.error('Gagal memuat data monitoring', error);
    }
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});