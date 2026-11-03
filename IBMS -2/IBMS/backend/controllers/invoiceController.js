const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const BusinessProfile = require('../models/BusinessProfile');
const Payment = require('../models/Payment');
const { calculateInvoiceGst, round } = require('../utils/gstCalculator');
const { generateNextInvoiceNumber } = require('../utils/invoiceNumberGenerator');
const { numberToIndianRupees } = require('../utils/numberToWords');

// Dynamic overdue status updater helper
const checkAndApplyOverdue = (invoice) => {
  if (
    invoice.status !== 'Paid' &&
    invoice.status !== 'Voided' &&
    invoice.status !== 'Draft' &&
    invoice.balanceDue > 0 &&
    new Date(invoice.dueDate) < new Date()
  ) {
    return 'Overdue';
  }
  return invoice.status;
};

// @desc    Get all invoices with filters, search, sort, pagination
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const {
      search,
      status,
      customerId,
      startDate,
      endDate,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (customerId) {
      query.customer = customerId;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.issueDate.$lte = end;
      }
    }

    if (status && status !== 'All') {
      if (status === 'Overdue') {
        query.status = { $nin: ['Paid', 'Voided', 'Draft'] };
        query.balanceDue = { $gt: 0 };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.gstin': { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { issueDate: -1, createdAt: -1 };
    if (sort === 'oldest') sortOption = { issueDate: 1 };
    else if (sort === 'amount_desc') sortOption = { grandTotal: -1 };
    else if (sort === 'amount_asc') sortOption = { grandTotal: 1 };
    else if (sort === 'due_date') sortOption = { dueDate: 1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, invoicesList] = await Promise.all([
      Invoice.countDocuments(query),
      Invoice.find(query).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    // Apply live overdue status dynamically
    const invoices = invoicesList.map((inv) => {
      const invObj = inv.toObject();
      invObj.status = checkAndApplyOverdue(inv);
      return invObj;
    });

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice details with payments and words
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('customer', 'name email phone billingAddress city state postalCode gstin');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    const payments = await Payment.find({
      invoice: invoice._id,
      user: req.user._id,
    }).sort({ paymentDate: -1 });

    const invoiceObj = invoice.toObject();
    invoiceObj.status = checkAndApplyOverdue(invoice);
    invoiceObj.amountInWords = numberToIndianRupees(invoice.grandTotal);
    invoiceObj.balanceInWords = numberToIndianRupees(invoice.balanceDue);

    res.status(200).json({
      success: true,
      invoice: invoiceObj,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate invoice totals preview (server-side dry-run)
// @route   POST /api/invoices/calculate
// @access  Private
const calculateInvoicePreview = async (req, res, next) => {
  try {
    const { placeOfSupply, items, customerId } = req.body;

    const profile = await BusinessProfile.findOne({ user: req.user._id });
    const businessState = profile?.state || 'Maharashtra';

    let resolvedPlaceOfSupply = placeOfSupply;
    if (!resolvedPlaceOfSupply && customerId) {
      const cust = await Customer.findOne({ _id: customerId, user: req.user._id });
      if (cust) resolvedPlaceOfSupply = cust.state;
    }
    resolvedPlaceOfSupply = resolvedPlaceOfSupply || businessState;

    const calcResult = calculateInvoiceGst({
      businessState,
      placeOfSupply: resolvedPlaceOfSupply,
      items: items || [],
    });

    res.status(200).json({
      success: true,
      calculation: {
        ...calcResult,
        businessState,
        placeOfSupply: resolvedPlaceOfSupply,
        amountInWords: numberToIndianRupees(calcResult.grandTotal),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      issueDate,
      dueDate,
      placeOfSupply,
      items,
      notes,
      terms,
      status,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a customer for this invoice.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must contain at least one line item.',
      });
    }

    const customer = await Customer.findOne({ _id: customerId, user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Selected customer was not found.',
      });
    }

    const profile = await BusinessProfile.findOne({ user: req.user._id });
    const businessState = profile?.state || 'Maharashtra';
    const finalPlaceOfSupply = (placeOfSupply || customer.state || businessState).trim();

    // Perform complete server-side GST calculation
    const calc = calculateInvoiceGst({
      businessState,
      placeOfSupply: finalPlaceOfSupply,
      items,
    });

    const invoiceNumber = await generateNextInvoiceNumber(req.user._id);

    const initialStatus = status === 'Draft' ? 'Draft' : 'Unpaid';
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      user: req.user._id,
      invoiceNumber,
      customer: customer._id,
      customerSnapshot: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        gstin: customer.gstin,
        pan: customer.pan,
      },
      businessSnapshot: {
        businessName: profile?.businessName || req.user.businessName || 'Business',
        legalName: profile?.legalName || '',
        email: profile?.email || req.user.email,
        phone: profile?.phone || '',
        gstin: profile?.gstin || '',
        pan: profile?.pan || '',
        address: profile?.address || '',
        city: profile?.city || '',
        state: profile?.state || 'Maharashtra',
        postalCode: profile?.postalCode || '',
        bankDetails: profile?.bankDetails || {},
      },
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: finalDueDate,
      placeOfSupply: finalPlaceOfSupply,
      isInterState: calc.isInterState,
      items: calc.items,
      subtotal: calc.subtotal,
      totalDiscount: calc.totalDiscount,
      taxableSubtotal: calc.taxableSubtotal,
      totalCgst: calc.totalCgst,
      totalSgst: calc.totalSgst,
      totalIgst: calc.totalIgst,
      totalTax: calc.totalTax,
      grandTotal: calc.grandTotal,
      amountPaid: 0,
      balanceDue: calc.grandTotal,
      status: initialStatus,
      notes: notes !== undefined ? notes : (profile?.defaultNotes || ''),
      terms: terms !== undefined ? terms : (profile?.defaultPaymentTerms || ''),
    });

    // Update customer's financials if not draft
    if (initialStatus !== 'Draft') {
      customer.totalInvoiced = round((customer.totalInvoiced || 0) + calc.grandTotal);
      customer.balanceDue = round((customer.balanceDue || 0) + calc.grandTotal);
      await customer.save();
    }

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    if (invoice.status === 'Voided') {
      return res.status(400).json({
        success: false,
        message: 'Voided invoices cannot be modified.',
      });
    }

    if (invoice.amountPaid > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit line items of an invoice with recorded payments. Please revert payments first or create a credit adjustment.',
      });
    }

    const {
      customerId,
      issueDate,
      dueDate,
      placeOfSupply,
      items,
      notes,
      terms,
      status,
    } = req.body;

    const previousGrandTotal = invoice.grandTotal;
    const wasDraft = invoice.status === 'Draft';

    let customer = await Customer.findOne({
      _id: customerId || invoice.customer,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const profile = await BusinessProfile.findOne({ user: req.user._id });
    const businessState = profile?.state || 'Maharashtra';
    const finalPlaceOfSupply = (placeOfSupply || customer.state || businessState).trim();

    // Recalculate
    const calc = calculateInvoiceGst({
      businessState,
      placeOfSupply: finalPlaceOfSupply,
      items: items || invoice.items,
    });

    invoice.customer = customer._id;
    invoice.customerSnapshot = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      gstin: customer.gstin,
      pan: customer.pan,
    };

    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    invoice.placeOfSupply = finalPlaceOfSupply;
    invoice.isInterState = calc.isInterState;
    invoice.items = calc.items;
    invoice.subtotal = calc.subtotal;
    invoice.totalDiscount = calc.totalDiscount;
    invoice.taxableSubtotal = calc.taxableSubtotal;
    invoice.totalCgst = calc.totalCgst;
    invoice.totalSgst = calc.totalSgst;
    invoice.totalIgst = calc.totalIgst;
    invoice.totalTax = calc.totalTax;
    invoice.grandTotal = calc.grandTotal;
    invoice.balanceDue = round(calc.grandTotal - invoice.amountPaid);

    if (status) {
      invoice.status = status;
    }
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;

    await invoice.save();

    // Update customer balances
    if (!wasDraft && invoice.status !== 'Draft') {
      const diff = calc.grandTotal - previousGrandTotal;
      customer.totalInvoiced = round(customer.totalInvoiced + diff);
      customer.balanceDue = round(customer.balanceDue + diff);
      await customer.save();
    } else if (wasDraft && invoice.status !== 'Draft') {
      customer.totalInvoiced = round(customer.totalInvoiced + calc.grandTotal);
      customer.balanceDue = round(customer.balanceDue + calc.grandTotal);
      await customer.save();
    }

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully.',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Void an invoice with audit trail
// @route   POST /api/invoices/:id/void
// @access  Private
const voidInvoice = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    if (invoice.status === 'Voided') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already voided.',
      });
    }

    if (invoice.amountPaid > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot void an invoice with recorded payments. Please delete or refund the payments first.',
      });
    }

    const wasDraft = invoice.status === 'Draft';
    invoice.status = 'Voided';
    invoice.voidReason = reason || 'Cancelled by user';
    invoice.voidedAt = new Date();
    await invoice.save();

    // Adjust customer financial counters if not draft
    if (!wasDraft) {
      const customer = await Customer.findOne({ _id: invoice.customer, user: req.user._id });
      if (customer) {
        customer.totalInvoiced = round(Math.max(0, customer.totalInvoiced - invoice.grandTotal));
        customer.balanceDue = round(Math.max(0, customer.balanceDue - invoice.grandTotal));
        await customer.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been marked as Voided.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an invoice (only allowed for Draft or Voided with 0 payments)
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    // Check if payments exist
    const paymentCount = await Payment.countDocuments({
      invoice: invoice._id,
      user: req.user._id,
    });

    if (paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete invoice. There are ${paymentCount} recorded payment(s) linked to it.`,
      });
    }

    if (!['Draft', 'Voided'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only Draft or Voided invoices can be deleted to maintain accounting compliance. You can Void this invoice instead.',
      });
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  calculateInvoicePreview,
  createInvoice,
  updateInvoice,
  voidInvoice,
  deleteInvoice,
};
