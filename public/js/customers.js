// public/js/customers.js
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('surveybiz_user');
    if (!userStr) { window.location.href = 'index.html'; return; }
    
    const user = JSON.parse(userStr);
    let currentMode = 'Active'; 

    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const menuImport = document.getElementById('menu-import');
    
    if (user.role === 'Manager') {
        if(addCustomerBtn) addCustomerBtn.style.display = 'none';
        if(menuImport) menuImport.style.display = 'none';
    } else if (user.role === 'Analyst') {
        if(menuImport) menuImport.style.display = 'none';
    }

    if(addCustomerBtn && user.role === 'Admin') {
        const toggleArchiveBtn = document.createElement('button');
        toggleArchiveBtn.className = 'ml-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors';
        toggleArchiveBtn.innerHTML = '🗑️ Lihat Tong Sampah';
        toggleArchiveBtn.onclick = () => {
            currentMode = currentMode === 'Active' ? 'Archived' : 'Active';
            toggleArchiveBtn.innerHTML = currentMode === 'Active' ? '🗑️ Lihat Tong Sampah' : '📋 Master Data';
            loadCustomers();
        };
        addCustomerBtn.parentNode.insertBefore(toggleArchiveBtn, addCustomerBtn.nextSibling);
    }

    async function loadCustomers() {
        try {
            const response = await fetch(`http://localhost:8080/api/customers?status=${currentMode}`);
            const result = await response.json();
            if (result.success) renderTable(result.data);
        } catch (error) {
            console.error('Gagal memuat data pelanggan:', error);
        }
    }

    function renderTable(data) {
        const tbody = document.getElementById('customerTableBody');
        document.getElementById('totalData').textContent = data.length;
        tbody.innerHTML = '';

        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-slate-500">Tidak ada data ${currentMode}.</td></tr>`;
            return;
        }

        data.forEach(customer => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors customer-row';
            
            // PENGAMAN VARIABEL: Mencegah teks "undefined" bocor ke layar
            const custId = customer.customer_id || customer.id || '-';
            const custName = customer.name || '-';
            const custEmail = customer.email || '-';
            const custPhone = customer.phone || '-';
            const custCity = customer.city || '-';
            const custStatus = customer.status || 'Active';
            
            const statusColor = custStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
            
            let actionButtons = `<span class="text-slate-400 text-xs">Read Only</span>`;
            if (user.role !== 'Manager') {
                if (currentMode === 'Active') {
                    actionButtons = `<button onclick="archiveCustomer('${custId}', 'Archived')" class="text-yellow-600 hover:text-yellow-800 text-xs font-semibold">Arsip</button>`;
                } else {
                    actionButtons = `
                        <button onclick="archiveCustomer('${custId}', 'Active')" class="text-emerald-500 hover:text-emerald-700 text-xs font-semibold mr-2">Pulihkan</button>
                        <button onclick="deleteCustomer('${custId}')" class="text-red-600 hover:text-red-800 text-xs font-semibold">Hapus Permanen</button>
                    `;
                }
            }

            // Menggunakan variabel yang sudah dijamin tidak undefined
            tr.innerHTML = `
                <td class="p-4 font-mono text-xs text-slate-500">${custId}</td>
                <td class="p-4 font-medium text-slate-800 searchable-name">${custName}</td>
                <td class="p-4">
                    <div class="text-slate-800">${custEmail}</div>
                    <div class="text-xs text-slate-500">${custPhone}</div>
                </td>
                <td class="p-4 text-slate-600">${custCity}</td>
                <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${custStatus}</span></td>
                <td class="p-4 text-right">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.customer-row');
            rows.forEach(row => {
                const name = row.querySelector('.searchable-name').textContent.toLowerCase();
                row.style.display = name.includes(keyword) ? '' : 'none';
            });
        });
    }

    // PROSES TAMBAH PELANGGAN YANG UTUH
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', async () => {
            const name = prompt("Masukkan Nama Pelanggan Baru:");
            if (!name) return; 
            
            const email = prompt("Masukkan Email Pelanggan:");
            if (!email) return; 
            
            // Tambahkan input No HP agar data utuh & tidak undefined/dummy
            const phone = prompt("Masukkan No Telepon Pelanggan:");
            if (!phone) return;

            const city = prompt("Masukkan Kota Asal Pelanggan:");
            if (!city) return;

            try {
                const res = await fetch('http://localhost:8080/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Kirim semua data utuh
                    body: JSON.stringify({ name: name, email: email, phone: phone, city: city }) 
                });
                const result = await res.json();
                if (res.ok && result.success) {
                    alert("Pelanggan berhasil ditambahkan!");
                    loadCustomers(); 
                } else {
                    alert("Gagal: " + (result.error || 'Kesalahan Server'));
                }
            } catch (err) { alert("Koneksi ke server gagal."); }
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    loadCustomers();
});

window.archiveCustomer = async function(id, targetStatus) {
    const msg = targetStatus === 'Archived' ? 'mengarsipkan' : 'memulihkan';
    if (!confirm(`Yakin ingin ${msg} data dengan ID: ${id}?`)) return;
    try {
        const response = await fetch(`http://localhost:8080/api/customers/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus })
        });
        if (response.ok) { window.location.reload(); }
    } catch (error) { console.error(error); }
};

window.deleteCustomer = async function(id) {
    if (!confirm(`TINDAKAN FATAL: Yakin ingin menghapus permanen data ID: ${id} dari database? Data tidak bisa dikembalikan!`)) return;
    try {
        const response = await fetch(`http://localhost:8080/api/customers/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) { 
            alert('Data musnah dari sistem.');
            window.location.reload(); 
        }
    } catch (error) { console.error(error); }
};