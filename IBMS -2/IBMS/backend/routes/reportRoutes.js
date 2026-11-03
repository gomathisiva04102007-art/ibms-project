const express = require('express');
const router = express.Router();
const {
  getRevenueReport,
  getInvoiceReport,
  getPaymentReport,
  getGstReport,
  getCustomerReport,
  getProductReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/revenue', getRevenueReport);
router.get('/invoices', getInvoiceReport);
router.get('/payments', getPaymentReport);
router.get('/gst', getGstReport);
router.get('/customers', getCustomerReport);
router.get('/products', getProductReport);

module.exports = router;
