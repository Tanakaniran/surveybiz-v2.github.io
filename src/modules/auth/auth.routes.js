const authController = require('./auth.controller');

async function authRoutes(fastify, options) {
    fastify.post('/login', authController.login);
}

module.exports = authRoutes;