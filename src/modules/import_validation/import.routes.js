const importController = require('./import.controller');

async function importRoutes(fastify, options) {
    fastify.post('/process-json', importController.processJsonData); // Route baru JSON murni
    fastify.get('/latest', importController.getLatestValidation);
}
module.exports = importRoutes;