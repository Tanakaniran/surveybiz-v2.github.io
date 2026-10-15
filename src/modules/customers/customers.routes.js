const customerController = require('./customers.controller');

async function customerRoutes(fastify, options) {
    fastify.get('/', customerController.getCustomers);
    fastify.post('/', customerController.createCustomer);
    fastify.patch('/:id/status', customerController.updateCustomerStatus);
    fastify.delete('/:id', customerController.deleteCustomerPermanently); // Rute Hapus
    fastify.get('/stats', customerController.getDashboardStats); // Rute Manager
}
module.exports = customerRoutes;