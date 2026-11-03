const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { round } = require('../utils/gstCalculator');

const generatePaymentNumber = async (userId) => {
  const lastPayment = await Payment.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select('paymentNumber');

  let seq = 1001;
  if (lastPayment && lastPayment.paymentNumber) {
    const match = lastPayment.paymentNumber.match(/\d+/);
    if (match) {
      seq = parseInt(match[0], 10) + 1;
    }
  }

  let number = `PAY-${seq}`;
  let exists = await Payment.findOne({ user: userId, paymentNumber: number });
  while (exists) {
    seq += 1;
    number = `PAY-${seq}`;
    exists = await Payment.findOne({ user: userId, paymentNumber: number });
  }

  return number;
};

// @desc    Get all recorded payments with filters & pagination
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const {
      search,
      paymentMethod,
      startDate,
      endDate,
      invoiceId,
      customerId,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (invoiceId) {
      query.invoice = invoiceId;
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate('invoice', 'invoiceNumber grandTotal amountPaid balanceDue status issueDate')
        .populate('customer', 'name email phone customerId')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('invoice', 'invoiceNumber grandTotal amountPaid balanceDue status')
      .populate('customer', 'name email phone customerId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments for a specific invoice
// @route   GET /api/invoices/:id/payments
// @access  Private
const getPaymentsForInvoice = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      invoice: req.params.id,
      user: req.user._id,
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new payment for an invoice
// @route   POST /api/payments
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    } = req.body;

    if (!invoiceId || amount === undefined || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID, payment amount, and payment method are required.',
      });
    }

    const payAmount = round(Number(amount));
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number greater than zero.',
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    if (invoice.status === 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment for a Draft invoice. Please issue the invoice first.',
      });
    }

    if (invoice.status === 'Voided') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment for a Voided invoice.',
      });
    }

    if (invoice.balanceDue <= 0 || invoice.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This invoice is already fully paid.',
      });
    }

    // Overpayment prevention check
    if (payAmount > invoice.balanceDue + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount.toFixed(2)}) exceeds outstanding balance (₹${invoice.balanceDue.toFixed(2)}). Overpayments are not allowed.`,
      });
    }

    const paymentNumber = await generatePaymentNumber(req.user._id);

    const payment = await Payment.create({
      user: req.user._id,
      paymentNumber,
      invoice: invoice._id,
      customer: invoice.customer,
      amount: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      referenceNumber: referenceNumber ? referenceNumber.trim() : '',
      notes: notes ? notes.trim() : '',
      recordedBy: req.user._id,
    });

    // Update Invoice status & amounts safely
    invoice.amountPaid = round(invoice.amountPaid + payAmount);
    invoice.balanceDue = round(Math.max(0, invoice.grandTotal - invoice.amountPaid));

    if (invoice.balanceDue <= 0.01) {
      invoice.balanceDue = 0;
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }
    await invoice.save();

    // Update Customer financial totals
    const customer = await Customer.findOne({ _id: invoice.customer, user: req.user._id });
    if (customer) {
      customer.totalPaid = round((customer.totalPaid || 0) + payAmount);
      customer.balanceDue = round(Math.max(0, (customer.balanceDue || 0) - payAmount));
      await customer.save();
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toFixed(2)} recorded successfully.`,
      payment,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        status: invoice.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revert / Delete payment safely
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    const invoice = await Invoice.findOne({ _id: payment.invoice, user: req.user._id });
    const customer = await Customer.findOne({ _id: payment.customer, user: req.user._id });

    // Reverse amounts
    if (invoice) {
      invoice.amountPaid = round(Math.max(0, invoice.amountPaid - payment.amount));
      invoice.balanceDue = round(invoice.grandTotal - invoice.amountPaid);
      if (invoice.amountPaid <= 0) {
        invoice.status = new Date(invoice.dueDate) < new Date() ? 'Overdue' : 'Unpaid';
      } else {
        invoice.status = 'Partially Paid';
      }
      await invoice.save();
    }

    if (customer) {
      customer.totalPaid = round(Math.max(0, customer.totalPaid - payment.amount));
      customer.balanceDue = round(customer.balanceDue + payment.amount);
      await customer.save();
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payment record deleted and balances adjusted safely.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentsForInvoice,
  recordPayment,
  deletePayment,
};
