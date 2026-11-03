const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { round } = require('../utils/gstCalculator');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all non-voided invoices for financial aggregations
    const [allInvoices, totalCustomers, totalProducts, allPayments] = await Promise.all([
      Invoice.find({ user: userId, status: { $ne: 'Voided' } }),
      Customer.countDocuments({ user: userId, isActive: true }),
      Product.countDocuments({ user: userId, isActive: true }),
      Payment.find({ user: userId }),
    ]);

    const now = new Date();

    let totalInvoicedAmount = 0;
    let totalOutstandingBalance = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;
    let draftCount = 0;

    allInvoices.forEach((inv) => {
      if (inv.status === 'Draft') {
        draftCount += 1;
        return; // Draft is not billed yet
      }

      totalInvoicedAmount += inv.grandTotal || 0;
      totalOutstandingBalance += inv.balanceDue || 0;

      const isOverdue = inv.balanceDue > 0 && new Date(inv.dueDate) < now && inv.status !== 'Paid';

      if (inv.status === 'Paid') {
        paidCount += 1;
      } else if (isOverdue) {
        overdueCount += 1;
      } else if (inv.status === 'Partially Paid') {
        partiallyPaidCount += 1;
      } else {
        unpaidCount += 1;
      }
    });

    // Revenue collected is strictly the sum of all payments received!
    const totalRevenueCollected = allPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalInvoices: allInvoices.filter((i) => i.status !== 'Draft').length,
        totalInvoicedAmount: round(totalInvoicedAmount),
        totalRevenueCollected: round(totalRevenueCollected),
        totalOutstandingBalance: round(totalOutstandingBalance),
        paidInvoices: paidCount,
        unpaidInvoices: unpaidCount,
        partiallyPaidInvoices: partiallyPaidCount,
        overdueInvoices: overdueCount,
        draftInvoices: draftCount,
        totalCustomers,
        totalProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard charts and recent activity data
// @route   GET /api/dashboard/revenue
// @access  Private
const getDashboardCharts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Past 6 months monthly metrics
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      months.push({
        label: `${monthName} ${year.toString().slice(-2)}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        invoiced: 0,
      });
    }

    // Aggregate payments by month
    const startWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const payments = await Payment.find({
      user: userId,
      paymentDate: { $gte: startWindow },
    });

    payments.forEach((p) => {
      const pDate = new Date(p.paymentDate);
      const targetMonth = months.find(
        (m) => m.year === pDate.getFullYear() && m.month === pDate.getMonth()
      );
      if (targetMonth) {
        targetMonth.revenue = round(targetMonth.revenue + (p.amount || 0));
      }
    });

    // Aggregate non-draft invoices by month
    const invoices = await Invoice.find({
      user: userId,
      status: { $nin: ['Draft', 'Voided'] },
      issueDate: { $gte: startWindow },
    });

    invoices.forEach((inv) => {
      const invDate = new Date(inv.issueDate);
      const targetMonth = months.find(
        (m) => m.year === invDate.getFullYear() && m.month === invDate.getMonth()
      );
      if (targetMonth) {
        targetMonth.invoiced = round(targetMonth.invoiced + (inv.grandTotal || 0));
      }
    });

    // Status breakdown counts
    const statusAgg = await Invoice.aggregate([
      { $match: { user: userId, status: { $ne: 'Voided' } } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
    ]);

    // Recent 5 Invoices
    const recentInvoices = await Invoice.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');

    // Recent 5 Payments
    const recentPayments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('invoice', 'invoiceNumber');

    res.status(200).json({
      success: true,
      monthlyTrends: months.map((m) => ({
        month: m.label,
        revenue: m.revenue,
        invoiced: m.invoiced,
      })),
      statusDistribution: statusAgg.map((s) => ({
        status: s._id,
        count: s.count,
        total: round(s.total),
      })),
      recentInvoices,
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCharts,
};
