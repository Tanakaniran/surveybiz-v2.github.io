const db = require('../../config/database');

const login = async (request, reply) => {
    try {
        // 1. Tangkap email dan password dari form index.html
        const { email, password } = request.body;

        // 2. Query ke tabel users berdasarkan EMAIL (bukan username)
        const query = `
            SELECT id, email, password_hash, role 
            FROM users 
            WHERE email = $1
        `;
        const result = await db.query(query, [email]);
        const user = result.rows[0];

        // 3. Validasi jika email tidak terdaftar
        if (!user) {
            return reply.code(401).send({ 
                error: 'Email atau kata sandi tidak valid.' 
            });
        }

        // 4. Pencocokan password (menggunakan pgcrypto bawaan PostgreSQL)
        const passCheckQuery = `SELECT (password_hash = crypt($1, password_hash)) AS is_match FROM users WHERE email = $2`;
        const checkResult = await db.query(passCheckQuery, [password, email]);
        
        if (!checkResult.rows[0] || !checkResult.rows[0].is_match) {
            return reply.code(401).send({ 
                error: 'Email atau kata sandi tidak valid.' 
            });
        }

        // 5. Berhasil Login - Kirim respons persis yang ditangkap app.js frontend
        return reply.code(200).send({
            token: 'dummy_jwt_token_surveybiz_2026',
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // PENGAMANAN: Mencegah server backend mati/crash total
        console.error("LOGIN ERROR:", error.message);
        return reply.code(500).send({ 
            error: 'Terjadi kesalahan pada server internal.' 
        });
    }
};

module.exports = { login };