const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// Helper to generate customer ID
const generateCustomerId = async (userId) => {
  const lastCustomer = await Customer.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select('customerId');

  let seq = 1001;
  if (lastCustomer && lastCustomer.customerId) {
    const match = lastCustomer.customerId.match(/\d+/);
    if (match) {
      seq = parseInt(match[0], 10) + 1;
    }
  }

  let code = `CUST-${seq}`;
  let exists = await Customer.findOne({ user: userId, customerId: code });
  while (exists) {
    seq += 1;
    code = `CUST-${seq}`;
    exists = await Customer.findOne({ user: userId, customerId: code });
  }

  return code;
};

// @desc    Get all customers with search, sort, pagination
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const { search, state, status, sort, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'name_desc') sortOption = { name: -1 };
    else if (sort === 'balance_desc') sortOption = { balanceDue: -1 };
    else if (sort === 'balance_asc') sortOption = { balanceDue: 1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, customers] = await Promise.all([
      Customer.countDocuments(query),
      Customer.find(query).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer details with invoice history & payments
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const [invoices, payments] = await Promise.all([
      Invoice.find({ customer: customer._id, user: req.user._id }).sort({ issueDate: -1 }),
      Payment.find({ customer: customer._id, user: req.user._id }).sort({ paymentDate: -1 }),
    ]);

    // Recalculate live financial metrics to ensure 100% accuracy
    const activeInvoices = invoices.filter((inv) => inv.status !== 'Voided');
    const totalInvoiced = activeInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const balanceDue = Math.max(0, totalInvoiced - totalPaid);

    // Sync back to customer document
    customer.totalInvoiced = Math.round(totalInvoiced * 100) / 100;
    customer.totalPaid = Math.round(totalPaid * 100) / 100;
    customer.balanceDue = Math.round(balanceDue * 100) / 100;
    await customer.save();

    res.status(200).json({
      success: true,
      customer,
      invoices,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const {
      customerId,
      name,
      email,
      phone,
      billingAddress,
      city,
      state,
      postalCode,
      gstin,
      pan,
      notes,
    } = req.body;

    if (!name || !state) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and state are required (State is needed for GST calculations).',
      });
    }

    const assignedId = customerId && customerId.trim()
      ? customerId.trim().toUpperCase()
      : await generateCustomerId(req.user._id);

    // Check duplicate ID
    const existing = await Customer.findOne({ user: req.user._id, customerId: assignedId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Customer ID "${assignedId}" is already assigned. Please use a unique ID.`,
      });
    }

    const customer = await Customer.create({
      user: req.user._id,
      customerId: assignedId,
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      billingAddress: billingAddress ? billingAddress.trim() : '',
      city: city ? city.trim() : '',
      state: state.trim(),
      postalCode: postalCode ? postalCode.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      pan: pan ? pan.trim().toUpperCase() : '',
      notes: notes ? notes.trim() : '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Customer added successfully.',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const {
      name,
      email,
      phone,
      billingAddress,
      city,
      state,
      postalCode,
      gstin,
      pan,
      notes,
      isActive,
    } = req.body;

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (billingAddress !== undefined) customer.billingAddress = billingAddress.trim();
    if (city !== undefined) customer.city = city.trim();
    if (state) customer.state = state.trim();
    if (postalCode !== undefined) customer.postalCode = postalCode.trim();
    if (gstin !== undefined) customer.gstin = gstin.trim().toUpperCase();
    if (pan !== undefined) customer.pan = pan.trim().toUpperCase();
    if (notes !== undefined) customer.notes = notes.trim();
    if (isActive !== undefined) customer.isActive = Boolean(isActive);

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a customer safely
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // Safety safeguard: check if customer is linked to existing invoices
    const invoiceCount = await Invoice.countDocuments({
      user: req.user._id,
      customer: customer._id,
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer. There are ${invoiceCount} invoice(s) associated with this customer. You can deactivate the customer instead.`,
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
