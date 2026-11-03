const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  calculateInvoicePreview,
  createInvoice,
  updateInvoice,
  voidInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { getPaymentsForInvoice } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.post('/calculate', calculateInvoicePreview);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.get('/:id/payments', getPaymentsForInvoice);
router.post('/:id/void', voidInvoice);

module.exports = router;
