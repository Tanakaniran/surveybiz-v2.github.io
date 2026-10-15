// src/modules/customers/customers.controller.js
const db = require('../../config/database');

const getCustomers = async (request, reply) => {
    try {
        const { status } = request.query;
        const targetStatus = status === 'Archived' ? 'Archived' : 'Active';
        
        const { rows } = await db.query(
            "SELECT * FROM customers WHERE status = $1 ORDER BY created_at DESC",
            [targetStatus]
        );
        return reply.code(200).send({ success: true, data: rows });
    } catch (error) {
        console.error('[GET CUSTOMERS ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal mengambil data' });
    }
};

const createCustomer = async (request, reply) => {
    const { name, email, city } = request.body; 
    
    if (!name || !email || !city) {
        return reply.code(400).send({ success: false, error: 'Nama, Email, dan Kota wajib diisi.' });
    }

    const generatedId = 'CUST-NEW-' + Math.floor(Math.random() * 10000);
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const { rows } = await db.query(
            `INSERT INTO customers (customer_id, name, email, phone, city, age, registration_date, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active') RETURNING *`,
            [generatedId, name, email, '08000000000', city, 25, today] 
        );
        
        // Menyusun data utuh secara eksplisit sebelum dikirim ke frontend
        const newCustomerData = rows[0];

        return reply.code(201).send({ 
            success: true, 
            data: newCustomerData 
        });
    } catch (error) {
        console.error('[CREATE CUSTOMER ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal menambah data: ' + error.message });
    }
};

const updateCustomerStatus = async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    try {
        let query = String(id).startsWith('CUST') 
            ? "UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $2 RETURNING *"
            : "UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2 RETURNING *";

        const { rows } = await db.query(query, [status, id]);
        
        if (rows.length === 0) return reply.code(404).send({ success: false, error: 'Pelanggan tidak ditemukan' });
        return reply.code(200).send({ success: true, data: rows[0] });
    } catch (error) {
        console.error('[UPDATE STATUS ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal arsip: ' + error.message });
    }
};

const deleteCustomerPermanently = async (request, reply) => {
    const { id } = request.params;
    try {
        let query = String(id).startsWith('CUST')
            ? "DELETE FROM customers WHERE customer_id = $1 RETURNING *"
            : "DELETE FROM customers WHERE id::text = $1 RETURNING *";
            
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) return reply.code(404).send({ success: false, error: 'Data tidak ditemukan' });
        return reply.code(200).send({ success: true, message: 'Data dihapus permanen' });
    } catch (error) {
        console.error('[DELETE ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal hapus: ' + error.message });
    }
};

const getDashboardStats = async (request, reply) => {
    try {
        const total = await db.query("SELECT COUNT(*) FROM customers WHERE status = 'Active'");
        const cities = await db.query("SELECT city, COUNT(*) as count FROM customers WHERE status = 'Active' GROUP BY city ORDER BY count DESC LIMIT 5");
        
        return reply.code(200).send({
            success: true,
            total_active: parseInt(total.rows[0].count),
            city_distribution: cities.rows
        });
    } catch (error) {
        console.error('[DASHBOARD ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal memuat statistik' });
    }
};

module.exports = { getCustomers, createCustomer, updateCustomerStatus, deleteCustomerPermanently, getDashboardStats };