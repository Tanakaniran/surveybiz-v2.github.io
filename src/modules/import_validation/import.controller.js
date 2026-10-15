const db = require('../../config/database');
const { validateRow } = require('./validator.engine');

const processJsonData = async (request, reply) => {
    const { filename, data } = request.body;
    
    if (!data || !Array.isArray(data)) {
        return reply.code(400).send({ success: false, error: 'Payload tidak memiliki array data yang valid' });
    }

    try {
        let totalProcessed = 0;
        let validCount = 0;
        let invalidCount = 0;
        const errorsToSave = [];
        const existingEmails = new Set();

        for (const row of data) {
            totalProcessed++;
            const rowErrors = validateRow(row, totalProcessed, existingEmails);
            
            if (rowErrors.length > 0) {
                invalidCount++;
                rowErrors.forEach(err => {
                    errorsToSave.push({
                        row_number: totalProcessed,
                        column_name: err.col,
                        error_type: err.type,
                        error_message: err.msg
                        // raw_value DIHAPUS karena tidak ada di Class Diagram SKPL
                    });
                });
            } else {
                validCount++;
            }
        }

        // PERBAIKAN 1: Tabel datasets HANYA menerima filename dan status (sesuai Class Diagram)
        const resDataset = await db.query(
            `INSERT INTO datasets (filename, status) VALUES ($1, 'Completed') RETURNING id`, 
            [filename]
        );
        const datasetId = resDataset.rows[0].id;

        // PERBAIKAN 2: Tabel validation_runs menggunakan kolom 'total_records', BUKAN 'total_processed'
        const resRun = await db.query(
            `INSERT INTO validation_runs (dataset_id, total_records, valid_count, invalid_count, status) 
             VALUES ($1, $2, $3, $4, 'Completed') RETURNING id`, 
            [datasetId, totalProcessed, validCount, invalidCount]
        );
        const runId = resRun.rows[0].id;

        // PERBAIKAN 3: Tabel validation_errors menggunakan 'run_id' dan 'row_index' (Sesuai Class Diagram)
        for (const err of errorsToSave) {
            await db.query(
                `INSERT INTO validation_errors (run_id, row_index, column_name, error_type, error_message) 
                 VALUES ($1, $2, $3, $4, $5)`, 
                [runId, err.row_number, err.column_name, err.error_type, err.error_message]
            );
        }

        return reply.code(200).send({ success: true, message: 'Proses validasi selesai' });

    } catch (error) {
        console.error('[DB IMPORT FATAL ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Database Error: ' + error.message });
    }
};

const getLatestValidation = async (request, reply) => {
    try {
        const runRes = await db.query(`SELECT * FROM validation_runs ORDER BY run_date DESC LIMIT 1`);
        if (runRes.rows.length === 0) return reply.code(200).send({ success: true, data: null });
        
        // PERBAIKAN: Gunakan run_id dan row_index
        const errorRes = await db.query(
            `SELECT * FROM validation_errors WHERE run_id = $1 ORDER BY row_index ASC`, 
            [runRes.rows[0].id]
        );
        return reply.code(200).send({ success: true, summary: runRes.rows[0], errors: errorRes.rows });
    } catch (error) {
        console.error('[MONITORING ERROR]:', error);
        return reply.code(500).send({ success: false, error: 'Gagal mengambil data monitoring' });
    }
};

module.exports = { processJsonData, getLatestValidation };