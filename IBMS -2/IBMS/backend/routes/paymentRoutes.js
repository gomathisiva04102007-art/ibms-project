const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  recordPayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(recordPayment);

router.route('/:id')
  .get(getPaymentById)
  .delete(deletePayment);

module.exports = router;
