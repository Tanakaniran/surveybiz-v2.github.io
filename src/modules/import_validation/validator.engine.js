// src/modules/import_validation/validator.engine.js
function validateRow(row, rowIndex, existingEmails) {
    const errors = [];
    
    // 1. Cek Email Kosong atau Duplikat
    if (!row.email || row.email.trim() === '') {
        errors.push({ col: 'email', type: 'MISSING_VALUE', msg: 'Email tidak boleh kosong' });
    } else if (existingEmails.has(row.email)) {
        errors.push({ col: 'email', type: 'DUPLICATE', msg: 'Email sudah terdaftar / duplikat' });
    } else {
        existingEmails.add(row.email);
    }

    // 2. Cek Umur (Tidak Logis atau Huruf)
    const age = parseInt(row.age);
    if (isNaN(age) || age < 1 || age > 120) {
        errors.push({ col: 'age', type: 'INVALID_FORMAT', msg: 'Umur tidak valid (harus angka 1-120)' });
    }

    // 3. Cek Format Telepon (Hanya Angka)
    if (row.phone && !/^[0-9]+$/.test(row.phone)) {
        errors.push({ col: 'phone', type: 'INVALID_FORMAT', msg: 'Nomor telepon hanya boleh angka' });
    }

    return errors;
}

module.exports = { validateRow };