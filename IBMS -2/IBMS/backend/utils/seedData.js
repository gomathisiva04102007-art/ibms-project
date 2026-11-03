require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { calculateInvoiceGst, round } = require('./gstCalculator');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ibms_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing demo records...');
    await Promise.all([
      User.deleteMany({ email: 'demo@example.com' }),
    ]);

    // Create Demo User
    console.log('Creating demo user: demo@example.com / Password123!');
    const user = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'demo@example.com',
      password: 'Password123!',
      phone: '+91 98765 43210',
      businessName: 'Apex Innovations Pvt Ltd',
      role: 'user',
    });

    // Delete any orphaned records for this user
    await Promise.all([
      BusinessProfile.deleteMany({ user: user._id }),
      Customer.deleteMany({ user: user._id }),
      Product.deleteMany({ user: user._id }),
      Invoice.deleteMany({ user: user._id }),
      Payment.deleteMany({ user: user._id }),
    ]);

    // Create Business Profile (Supplier in Maharashtra)
    console.log('Creating Business Profile in Maharashtra...');
    const businessProfile = await BusinessProfile.create({
      user: user._id,
      businessName: 'Apex Innovations Pvt Ltd',
      legalName: 'Apex Innovations Private Limited',
      email: 'billing@apexinnovations.in',
      phone: '+91 22 2840 9999',
      gstin: '27AABCA5555F1Z8',
      pan: 'AABCA5555F',
      address: 'Suite 402, High-Tech IT Park, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400069',
      country: 'India',
      currency: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'INV',
      invoiceNextNumber: 1006,
      defaultPaymentTerms: 'Payment due within 15 days of invoice date. 18% p.a. interest applicable after due date.',
      defaultNotes: 'Thank you for your valued partnership. Please quote invoice number when remitting payment.',
      bankDetails: {
        bankName: 'HDFC Bank Ltd',
        accountHolder: 'Apex Innovations Pvt Ltd',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0000123',
        branch: 'Andheri East Branch, Mumbai',
        upiId: 'apexinnovations@okhdfcbank',
      },
    });

    // Create Products & Services
    console.log('Creating Products & Services...');
    const productsData = [
      {
        user: user._id,
        name: 'Enterprise Cloud Architecture Setup',
        code: 'SRV-CLOUD-01',
        hsnCode: '998313',
        description: 'Multi-region AWS/Azure cloud deployment with autoscaling and automated backup',
        type: 'service',
        category: 'Cloud Services',
        unitPrice: 45000,
        gstRate: 18,
        unit: 'PROJECT',
        isActive: true,
      },
      {
        user: user._id,
        name: 'Full Stack Web Application Development',
        code: 'SRV-DEV-02',
        hsnCode: '998314',
        description: 'End-to-end full stack development billed per consulting hour',
        type: 'service',
        category: 'Software Development',
        unitPrice: 2500,
        gstRate: 18,
        unit: 'HRS',
        isActive: true,
      },
      {
        user: user._id,
        name: 'POS Thermal Receipt Printer 80mm',
        code: 'PRD-POS-03',
        hsnCode: '844332',
        description: 'High-speed 260mm/s auto-cutter USB/Ethernet thermal barcode printer',
        type: 'product',
        category: 'Hardware',
        unitPrice: 6500,
        gstRate: 18,
        unit: 'PCS',
        isActive: true,
      },
      {
        user: user._id,
        name: 'Annual Software AMC & Support',
        code: 'SRV-AMC-04',
        hsnCode: '998717',
        description: 'Annual 24/7 technical maintenance contract with SLA guarantee',
        type: 'service',
        category: 'Maintenance',
        unitPrice: 36000,
        gstRate: 18,
        unit: 'YR',
        isActive: true,
      },
      {
        user: user._id,
        name: 'Business Intelligence Reporting Module',
        code: 'SRV-BI-05',
        hsnCode: '998315',
        description: 'Custom executive dashboard development and automated CSV/PDF reporting',
        type: 'service',
        category: 'Data Analytics',
        unitPrice: 28000,
        gstRate: 18,
        unit: 'PROJECT',
        isActive: true,
      },
      {
        user: user._id,
        name: 'Technical Training & Reference Guidebook',
        code: 'PRD-BOOK-06',
        hsnCode: '490110',
        description: 'Official printed software developer guide and curriculum (GST Exempt)',
        type: 'product',
        category: 'Documentation',
        unitPrice: 1200,
        gstRate: 0,
        unit: 'PCS',
        isActive: true,
      },
    ];

    const products = await Product.insertMany(productsData);

    // Create Customers
    console.log('Creating Customers across Maharashtra (Intra) and other states (Inter)...');
    const customersData = [
      {
        user: user._id,
        customerId: 'CUST-1001',
        name: 'TechNova Solutions LLP',
        email: 'accounts@technova.com',
        phone: '+91 98220 11223',
        billingAddress: 'Tower B, Cyber City, Magarpatta',
        city: 'Pune',
        state: 'Maharashtra', // Intra-state
        postalCode: '411028',
        gstin: '27AAACT1111A1Z1',
        pan: 'AAACT1111A',
        notes: 'Preferred IT client. Invoices processed on 10th of every month.',
        isActive: true,
      },
      {
        user: user._id,
        customerId: 'CUST-1002',
        name: 'BlueStar Mega Retailers',
        email: 'finance@bluestarretail.in',
        phone: '+91 98190 33445',
        billingAddress: '45, Industrial Estate, Worli',
        city: 'Mumbai',
        state: 'Maharashtra', // Intra-state
        postalCode: '400018',
        gstin: '27AABCB2222B1Z2',
        pan: 'AABCB2222B',
        notes: 'Retail hardware client.',
        isActive: true,
      },
      {
        user: user._id,
        customerId: 'CUST-1003',
        name: 'Global Logistics Infotech Ltd',
        email: 'billing@globallogistics.co.in',
        phone: '+91 80 4123 7890',
        billingAddress: '7th Floor, Silicon Tower, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka', // Inter-state
        postalCode: '560103',
        gstin: '29AAACG3333C1Z3',
        pan: 'AAACG3333C',
        notes: 'Inter-state enterprise supply. Requires IGST billing.',
        isActive: true,
      },
      {
        user: user._id,
        customerId: 'CUST-1004',
        name: 'Apex Cloud Systems Hyderabad',
        email: 'vendorpay@apexcloud.org',
        phone: '+91 40 2345 6789',
        billingAddress: 'Plot 12, Hitec City, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana', // Inter-state
        postalCode: '500081',
        gstin: '36AAACA4444D1Z4',
        pan: 'AAACA4444D',
        notes: 'Cloud infrastructure maintenance client.',
        isActive: true,
      },
      {
        user: user._id,
        customerId: 'CUST-1005',
        name: 'Sharma Retail Traders (Unregistered)',
        email: 'sharmatraders@gmail.com',
        phone: '+91 97654 32109',
        billingAddress: 'Gandhi Chowk, Sitabuldi',
        city: 'Nagpur',
        state: 'Maharashtra', // Intra-state B2C
        postalCode: '440012',
        gstin: '',
        pan: '',
        notes: 'Unregistered B2C customer.',
        isActive: true,
      },
    ];

    const customers = await Customer.insertMany(customersData);

    // Helper snapshots
    const makeCustSnapshot = (c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      billingAddress: c.billingAddress,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      gstin: c.gstin,
      pan: c.pan,
    });

    const bizSnapshot = {
      businessName: businessProfile.businessName,
      legalName: businessProfile.legalName,
      email: businessProfile.email,
      phone: businessProfile.phone,
      gstin: businessProfile.gstin,
      pan: businessProfile.pan,
      address: businessProfile.address,
      city: businessProfile.city,
      state: businessProfile.state,
      postalCode: businessProfile.postalCode,
      bankDetails: businessProfile.bankDetails,
    };

    console.log('Generating Invoices and Payments...');

    // Invoice 1: TechNova (Intra-state Maharashtra -> CGST 9% + SGST 9%) - Fully Paid
    const inv1Calc = calculateInvoiceGst({
      businessState: 'Maharashtra',
      placeOfSupply: 'Maharashtra',
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          description: products[0].description,
          hsnCode: products[0].hsnCode,
          unit: products[0].unit,
          quantity: 1,
          unitPrice: 45000,
          discountType: 'percentage',
          discountValue: 10, // 10% discount -> 4500
          gstRate: 18,
        },
        {
          product: products[1]._id,
          name: products[1].name,
          description: products[1].description,
          hsnCode: products[1].hsnCode,
          unit: products[1].unit,
          quantity: 12,
          unitPrice: 2500,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 18,
        },
      ],
    });

    const invoice1 = await Invoice.create({
      user: user._id,
      invoiceNumber: 'INV-2026-1001',
      customer: customers[0]._id,
      customerSnapshot: makeCustSnapshot(customers[0]),
      businessSnapshot: bizSnapshot,
      issueDate: new Date('2026-09-10'),
      dueDate: new Date('2026-09-25'),
      placeOfSupply: 'Maharashtra',
      isInterState: false,
      items: inv1Calc.items,
      subtotal: inv1Calc.subtotal,
      totalDiscount: inv1Calc.totalDiscount,
      taxableSubtotal: inv1Calc.taxableSubtotal,
      totalCgst: inv1Calc.totalCgst,
      totalSgst: inv1Calc.totalSgst,
      totalIgst: 0,
      totalTax: inv1Calc.totalTax,
      grandTotal: inv1Calc.grandTotal,
      amountPaid: inv1Calc.grandTotal,
      balanceDue: 0,
      status: 'Paid',
      notes: 'Thank you for your business. Payment received with thanks.',
      terms: businessProfile.defaultPaymentTerms,
    });

    // Payment for Invoice 1
    await Payment.create({
      user: user._id,
      paymentNumber: 'PAY-1001',
      invoice: invoice1._id,
      customer: customers[0]._id,
      amount: inv1Calc.grandTotal,
      paymentDate: new Date('2026-09-20'),
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'NEFT-HDFC-99881122',
      notes: 'Full payment received via NEFT.',
      recordedBy: user._id,
    });

    customers[0].totalInvoiced = inv1Calc.grandTotal;
    customers[0].totalPaid = inv1Calc.grandTotal;
    customers[0].balanceDue = 0;
    await customers[0].save();

    // Invoice 2: Global Logistics (Inter-state Karnataka -> IGST 18%) - Partially Paid
    const inv2Calc = calculateInvoiceGst({
      businessState: 'Maharashtra',
      placeOfSupply: 'Karnataka',
      items: [
        {
          product: products[2]._id,
          name: products[2].name,
          description: products[2].description,
          hsnCode: products[2].hsnCode,
          unit: products[2].unit,
          quantity: 5,
          unitPrice: 6500,
          discountType: 'percentage',
          discountValue: 5,
          gstRate: 18,
        },
        {
          product: products[4]._id,
          name: products[4].name,
          description: products[4].description,
          hsnCode: products[4].hsnCode,
          unit: products[4].unit,
          quantity: 1,
          unitPrice: 28000,
          discountType: 'fixed',
          discountValue: 2000,
          gstRate: 18,
        },
      ],
    });

    const partialPaymentAmount = 30000;
    const inv2Balance = round(inv2Calc.grandTotal - partialPaymentAmount);

    const invoice2 = await Invoice.create({
      user: user._id,
      invoiceNumber: 'INV-2026-1002',
      customer: customers[2]._id,
      customerSnapshot: makeCustSnapshot(customers[2]),
      businessSnapshot: bizSnapshot,
      issueDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-20'),
      placeOfSupply: 'Karnataka',
      isInterState: true,
      items: inv2Calc.items,
      subtotal: inv2Calc.subtotal,
      totalDiscount: inv2Calc.totalDiscount,
      taxableSubtotal: inv2Calc.taxableSubtotal,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: inv2Calc.totalIgst,
      totalTax: inv2Calc.totalTax,
      grandTotal: inv2Calc.grandTotal,
      amountPaid: partialPaymentAmount,
      balanceDue: inv2Balance,
      status: 'Partially Paid',
      notes: 'Initial advance payment of ₹30,000 recorded.',
      terms: businessProfile.defaultPaymentTerms,
    });

    await Payment.create({
      user: user._id,
      paymentNumber: 'PAY-1002',
      invoice: invoice2._id,
      customer: customers[2]._id,
      amount: partialPaymentAmount,
      paymentDate: new Date('2026-10-05'),
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-AXIS-4455667788',
      notes: 'Advance installment payment via UPI.',
      recordedBy: user._id,
    });

    customers[2].totalInvoiced = inv2Calc.grandTotal;
    customers[2].totalPaid = partialPaymentAmount;
    customers[2].balanceDue = inv2Balance;
    await customers[2].save();

    // Invoice 3: BlueStar Retailers (Intra-state Maharashtra -> CGST + SGST) - Unpaid
    const inv3Calc = calculateInvoiceGst({
      businessState: 'Maharashtra',
      placeOfSupply: 'Maharashtra',
      items: [
        {
          product: products[3]._id,
          name: products[3].name,
          description: products[3].description,
          hsnCode: products[3].hsnCode,
          unit: products[3].unit,
          quantity: 1,
          unitPrice: 36000,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 18,
        },
      ],
    });

    const invoice3 = await Invoice.create({
      user: user._id,
      invoiceNumber: 'INV-2026-1003',
      customer: customers[1]._id,
      customerSnapshot: makeCustSnapshot(customers[1]),
      businessSnapshot: bizSnapshot,
      issueDate: new Date('2026-10-12'),
      dueDate: new Date('2026-10-27'),
      placeOfSupply: 'Maharashtra',
      isInterState: false,
      items: inv3Calc.items,
      subtotal: inv3Calc.subtotal,
      totalDiscount: inv3Calc.totalDiscount,
      taxableSubtotal: inv3Calc.taxableSubtotal,
      totalCgst: inv3Calc.totalCgst,
      totalSgst: inv3Calc.totalSgst,
      totalIgst: 0,
      totalTax: inv3Calc.totalTax,
      grandTotal: inv3Calc.grandTotal,
      amountPaid: 0,
      balanceDue: inv3Calc.grandTotal,
      status: 'Unpaid',
      notes: 'Annual AMC billing for Year 2026-2027.',
      terms: businessProfile.defaultPaymentTerms,
    });

    customers[1].totalInvoiced = inv3Calc.grandTotal;
    customers[1].totalPaid = 0;
    customers[1].balanceDue = inv3Calc.grandTotal;
    await customers[1].save();

    // Invoice 4: Apex Cloud Systems (Inter-state Telangana -> IGST 18%) - Overdue!
    const inv4Calc = calculateInvoiceGst({
      businessState: 'Maharashtra',
      placeOfSupply: 'Telangana',
      items: [
        {
          product: products[1]._id,
          name: products[1].name,
          description: products[1].description,
          hsnCode: products[1].hsnCode,
          unit: products[1].unit,
          quantity: 20,
          unitPrice: 2500,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 18,
        },
      ],
    });

    const pastDueDate = new Date('2026-09-30'); // Due date is in past -> Overdue!
    const invoice4 = await Invoice.create({
      user: user._id,
      invoiceNumber: 'INV-2026-1004',
      customer: customers[3]._id,
      customerSnapshot: makeCustSnapshot(customers[3]),
      businessSnapshot: bizSnapshot,
      issueDate: new Date('2026-09-01'),
      dueDate: pastDueDate,
      placeOfSupply: 'Telangana',
      isInterState: true,
      items: inv4Calc.items,
      subtotal: inv4Calc.subtotal,
      totalDiscount: inv4Calc.totalDiscount,
      taxableSubtotal: inv4Calc.taxableSubtotal,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: inv4Calc.totalIgst,
      totalTax: inv4Calc.totalTax,
      grandTotal: inv4Calc.grandTotal,
      amountPaid: 0,
      balanceDue: inv4Calc.grandTotal,
      status: 'Overdue',
      notes: 'Payment is overdue. Please expedite payment immediately.',
      terms: businessProfile.defaultPaymentTerms,
    });

    customers[3].totalInvoiced = inv4Calc.grandTotal;
    customers[3].totalPaid = 0;
    customers[3].balanceDue = inv4Calc.grandTotal;
    await customers[3].save();

    // Invoice 5: Draft Invoice
    const inv5Calc = calculateInvoiceGst({
      businessState: 'Maharashtra',
      placeOfSupply: 'Maharashtra',
      items: [
        {
          product: products[5]._id,
          name: products[5].name,
          description: products[5].description,
          hsnCode: products[5].hsnCode,
          unit: products[5].unit,
          quantity: 10,
          unitPrice: 1200,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 0, // 0% GST Exempt
        },
      ],
    });

    await Invoice.create({
      user: user._id,
      invoiceNumber: 'INV-2026-1005',
      customer: customers[4]._id,
      customerSnapshot: makeCustSnapshot(customers[4]),
      businessSnapshot: bizSnapshot,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      placeOfSupply: 'Maharashtra',
      isInterState: false,
      items: inv5Calc.items,
      subtotal: inv5Calc.subtotal,
      totalDiscount: 0,
      taxableSubtotal: inv5Calc.taxableSubtotal,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTax: 0,
      grandTotal: inv5Calc.grandTotal,
      amountPaid: 0,
      balanceDue: inv5Calc.grandTotal,
      status: 'Draft',
      notes: 'Draft quotation for books order.',
      terms: businessProfile.defaultPaymentTerms,
    });

    console.log('----------------------------------------------------');
    console.log('Demo database seeded successfully!');
    console.log('Login credentials:');
    console.log('Email:    demo@example.com');
    console.log('Password: Password123!');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
