document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Mencegah halaman refresh
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Ubah teks tombol saat memproses
            loginBtn.textContent = 'Memverifikasi...';
            loginBtn.disabled = true;
            errorMessage.classList.add('hidden');

            try {
                // Panggil API Backend Node.js
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Simpan JWT Token dan data user ke localStorage
                    localStorage.setItem('surveybiz_token', data.token);
                    localStorage.setItem('surveybiz_user', JSON.stringify(data.user));
                    
                    // Arahkan ke halaman utama (kita buat nanti)
                    window.location.href = 'dashboard.html';
                } else {
                    // Tampilkan pesan error dari backend
                    errorMessage.textContent = data.error || 'Login gagal';
                    errorMessage.classList.remove('hidden');
                }
            } catch (error) {
                errorMessage.textContent = 'Tidak dapat terhubung ke server.';
                errorMessage.classList.remove('hidden');
            } finally {
                // Kembalikan tombol ke keadaan semula
                loginBtn.textContent = 'Masuk';
                loginBtn.disabled = false;
            }
        });
    }
});

 // Tampilkan / sembunyikan kata sandi
  const pw = document.getElementById('password'), tg = document.getElementById('togglePw');
  tg.addEventListener('click', () => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    document.getElementById('eyeOn').classList.toggle('hidden', show);
    document.getElementById('eyeOff').classList.toggle('hidden', !show);
    tg.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  });