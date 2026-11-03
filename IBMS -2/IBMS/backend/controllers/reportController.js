const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { round } = require('../utils/gstCalculator');

// Helper to build date range query
const buildDateFilter = (startDate, endDate, dateField = 'issueDate') => {
  const filter = {};
  if (startDate || endDate) {
    filter[dateField] = {};
    if (startDate) filter[dateField].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[dateField].$lte = end;
    }
  }
  return filter;
};

// @desc    Get Revenue Report (distinguishing cash collected vs invoiced sales)
// @route   GET /api/reports/revenue
// @access  Private
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const paymentDateFilter = buildDateFilter(startDate, endDate, 'paymentDate');
    const invoiceDateFilter = buildDateFilter(startDate, endDate, 'issueDate');

    const [payments, invoices] = await Promise.all([
      Payment.find({ user: userId, ...paymentDateFilter }).sort({ paymentDate: 1 }),
      Invoice.find({ user: userId, status: { $nin: ['Draft', 'Voided'] }, ...invoiceDateFilter }).sort({ issueDate: 1 }),
    ]);

    const totalRevenueCollected = round(payments.reduce((acc, p) => acc + (p.amount || 0), 0));
    const totalInvoicedSales = round(invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
    const totalOutstandingInvoiced = round(invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0));

    // Daily breakdown for visual graphs and table
    const dailyMap = {};

    payments.forEach((p) => {
      const key = new Date(p.paymentDate).toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, invoiced: 0, collected: 0 };
      dailyMap[key].collected = round(dailyMap[key].collected + (p.amount || 0));
    });

    invoices.forEach((inv) => {
      const key = new Date(inv.issueDate).toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, invoiced: 0, collected: 0 };
      dailyMap[key].invoiced = round(dailyMap[key].invoiced + (inv.grandTotal || 0));
    });

    const breakdown = Object.values(dailyMap).sort((a, b) => (a.date > b.date ? 1 : -1));

    res.status(200).json({
      success: true,
      summary: {
        totalRevenueCollected,
        totalInvoicedSales,
        totalOutstandingInvoiced,
        totalInvoicesIssued: invoices.length,
        totalPaymentsReceived: payments.length,
      },
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Invoices Report with filters
// @route   GET /api/reports/invoices
// @access  Private
const getInvoiceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, status } = req.query;
    const userId = req.user._id;

    const query = { user: userId, ...buildDateFilter(startDate, endDate, 'issueDate') };

    if (customerId) query.customer = customerId;

    if (status && status !== 'All') {
      if (status === 'Overdue') {
        query.status = { $nin: ['Paid', 'Voided', 'Draft'] };
        query.balanceDue = { $gt: 0 };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name customerId gstin')
      .sort({ issueDate: -1 });

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let grandTotal = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    invoices.forEach((inv) => {
      totalTaxable += inv.taxableSubtotal || 0;
      totalCgst += inv.totalCgst || 0;
      totalSgst += inv.totalSgst || 0;
      totalIgst += inv.totalIgst || 0;
      totalTax += inv.totalTax || 0;
      grandTotal += inv.grandTotal || 0;
      totalPaid += inv.amountPaid || 0;
      totalBalance += inv.balanceDue || 0;
    });

    res.status(200).json({
      success: true,
      summary: {
        count: invoices.length,
        totalTaxable: round(totalTaxable),
        totalCgst: round(totalCgst),
        totalSgst: round(totalSgst),
        totalIgst: round(totalIgst),
        totalTax: round(totalTax),
        grandTotal: round(grandTotal),
        totalPaid: round(totalPaid),
        totalBalance: round(totalBalance),
      },
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Payments History Report
// @route   GET /api/reports/payments
// @access  Private
const getPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate, paymentMethod, customerId } = req.query;
    const userId = req.user._id;

    const query = { user: userId, ...buildDateFilter(startDate, endDate, 'paymentDate') };

    if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;
    if (customerId) query.customer = customerId;

    const payments = await Payment.find(query)
      .populate('invoice', 'invoiceNumber grandTotal')
      .populate('customer', 'name customerId')
      .sort({ paymentDate: -1 });

    const totalCollected = round(payments.reduce((acc, p) => acc + (p.amount || 0), 0));

    // Method breakdown
    const methodBreakdown = {};
    payments.forEach((p) => {
      const m = p.paymentMethod || 'Other';
      methodBreakdown[m] = round((methodBreakdown[m] || 0) + p.amount);
    });

    res.status(200).json({
      success: true,
      summary: {
        count: payments.length,
        totalCollected,
        methodBreakdown,
      },
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GST Tax Breakdown Report (Intra vs Inter state, Rate wise)
// @route   GET /api/reports/gst
// @access  Private
const getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const query = {
      user: userId,
      status: { $nin: ['Draft', 'Voided'] },
      ...buildDateFilter(startDate, endDate, 'issueDate'),
    };

    const invoices = await Invoice.find(query);

    let intraStateTaxable = 0;
    let interStateTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const rateWise = {
      0: { rate: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      5: { rate: 5, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      12: { rate: 12, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      18: { rate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      28: { rate: 28, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    };

    invoices.forEach((inv) => {
      if (inv.isInterState) {
        interStateTaxable += inv.taxableSubtotal || 0;
      } else {
        intraStateTaxable += inv.taxableSubtotal || 0;
      }

      totalCgst += inv.totalCgst || 0;
      totalSgst += inv.totalSgst || 0;
      totalIgst += inv.totalIgst || 0;

      // Rate breakdown per item
      (inv.items || []).forEach((item) => {
        const rate = item.gstRate || 0;
        if (!rateWise[rate]) {
          rateWise[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        }
        rateWise[rate].taxable = round(rateWise[rate].taxable + (item.taxableAmount || 0));
        rateWise[rate].cgst = round(rateWise[rate].cgst + (item.cgstAmount || 0));
        rateWise[rate].sgst = round(rateWise[rate].sgst + (item.sgstAmount || 0));
        rateWise[rate].igst = round(rateWise[rate].igst + (item.igstAmount || 0));
        rateWise[rate].totalTax = round(rateWise[rate].totalTax + (item.totalTaxAmount || 0));
      });
    });

    const totalTaxable = round(intraStateTaxable + interStateTaxable);
    const totalGst = round(totalCgst + totalSgst + totalIgst);

    res.status(200).json({
      success: true,
      gstSummary: {
        totalTaxable,
        intraStateTaxable: round(intraStateTaxable),
        interStateTaxable: round(interStateTaxable),
        totalCgst: round(totalCgst),
        totalSgst: round(totalSgst),
        totalIgst: round(totalIgst),
        totalGst,
      },
      rateWise: Object.values(rateWise).filter((r) => r.taxable > 0 || r.rate === 18),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer-wise Sales Report
// @route   GET /api/reports/customers
// @access  Private
const getCustomerReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const customers = await Customer.find({ user: userId }).sort({ totalInvoiced: -1 });

    const summary = customers.map((c) => ({
      _id: c._id,
      customerId: c.customerId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      state: c.state,
      gstin: c.gstin,
      totalInvoiced: c.totalInvoiced || 0,
      totalPaid: c.totalPaid || 0,
      balanceDue: c.balanceDue || 0,
    }));

    res.status(200).json({
      success: true,
      customers: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Product-wise Sales Report
// @route   GET /api/reports/products
// @access  Private
const getProductReport = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate line items from non-voided invoices
    const productSales = await Invoice.aggregate([
      { $match: { user: userId, status: { $nin: ['Draft', 'Voided'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantitySold: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.totalAmount' },
          taxableSales: { $sum: '$items.taxableAmount' },
          taxCollected: { $sum: '$items.totalTaxAmount' },
          hsnCode: { $first: '$items.hsnCode' },
          unit: { $first: '$items.unit' },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.status(200).json({
      success: true,
      productSales: productSales.map((p) => ({
        name: p._id,
        quantitySold: round(p.quantitySold),
        totalSales: round(p.totalSales),
        taxableSales: round(p.taxableSales),
        taxCollected: round(p.taxCollected),
        hsnCode: p.hsnCode,
        unit: p.unit,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevenueReport,
  getInvoiceReport,
  getPaymentReport,
  getGstReport,
  getCustomerReport,
  getProductReport,
};
