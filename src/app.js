// src/app.js
const fastify = require('fastify')({ logger: true });
const db = require('./config/database');
require('dotenv').config();

// 1. Middleware CORS
fastify.register(require('@fastify/cors'), {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});

// 2. Plugin Multipart (Wajib untuk menangani file upload CSV)
fastify.register(require('@fastify/multipart'));

// 3. Pendaftaran Rute Modul (Tanpa duplikasi)
fastify.register(require('./modules/auth/auth.routes'), { prefix: '/api/auth' });
fastify.register(require('./modules/customers/customers.routes'), { prefix: '/api/customers' });
fastify.register(require('./modules/import_validation/import.routes'), { prefix: '/api/import' });

// 4. Endpoint Kesehatan
fastify.get('/api/health', async (request, reply) => {
    try {
        const result = await db.query('SELECT NOW() AS current_time, version()');
        return { 
            status: 'OK', 
            message: 'SurveyBiz API V2 is running optimally', 
            database_time: result.rows[0].current_time
        };
    } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'Database connection failed' });
    }
});

// 5. Inisialisasi Peladen
const start = async () => {
    const targetPort = process.env.PORT || 8080;
    try {
        await fastify.listen({ port: targetPort, host: '0.0.0.0' });
        fastify.log.info(`[SERVER SUCCESS] Listening on port ${targetPort}`);
    } catch (err) {
        if (err.code === 'EADDRINUSE') {
            fastify.log.warn(`[PORT CLASH] Port ${targetPort} is locked. Forcing Fastify to find an empty port...`);
            await fastify.listen({ port: 0, host: '0.0.0.0' });
            fastify.log.info(`[SERVER SUCCESS] Running on fallback port: ${fastify.server.address().port}`);
        } else {
            fastify.log.error(err);
            process.exit(1);
        }
    }
};

start();