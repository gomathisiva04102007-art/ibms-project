import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Package,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report datasets
  const [revenueData, setRevenueData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const [productData, setProductData] = useState([]);

  useEffect(() => {
    fetchActiveReport();
  }, [activeTab]);

  const fetchActiveReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (activeTab === 'revenue') {
        const res = await reportService.getRevenue(params);
        setRevenueData(res.data);
      } else if (activeTab === 'invoices') {
        const res = await reportService.getInvoices(params);
        setInvoiceData(res.data);
      } else if (activeTab === 'payments') {
        const res = await reportService.getPayments(params);
        setPaymentData(res.data);
      } else if (activeTab === 'gst') {
        const res = await reportService.getGst(params);
        setGstData(res.data);
      } else if (activeTab === 'customers') {
        const res = await reportService.getCustomers();
        setCustomerData(res.data.customers || []);
      } else if (activeTab === 'products') {
        const res = await reportService.getProducts();
        setProductData(res.data.productSales || []);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError('Could not generate the selected report.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchActiveReport();
  };

  const handleExportCsv = () => {
    if (activeTab === 'revenue' && revenueData?.breakdown) {
      exportToCsv(
        'Revenue_Report',
        [
          { label: 'Date', key: 'date' },
          { label: 'Invoiced Amount (INR)', accessor: (r) => r.invoiced },
          { label: 'Collected Revenue (INR)', accessor: (r) => r.collected },
        ],
        revenueData.breakdown
      );
    } else if (activeTab === 'invoices' && invoiceData?.invoices) {
      exportToCsv(
        'Invoices_Report',
        [
          { label: 'Invoice Number', key: 'invoiceNumber' },
          { label: 'Customer', accessor: (r) => r.customerSnapshot?.name },
          { label: 'State', accessor: (r) => r.placeOfSupply },
          { label: 'Issue Date', accessor: (r) => formatDate(r.issueDate) },
          { label: 'Due Date', accessor: (r) => formatDate(r.dueDate) },
          { label: 'Taxable Turnover (INR)', key: 'taxableSubtotal' },
          { label: 'CGST (INR)', key: 'totalCgst' },
          { label: 'SGST (INR)', key: 'totalSgst' },
          { label: 'IGST (INR)', key: 'totalIgst' },
          { label: 'Grand Total (INR)', key: 'grandTotal' },
          { label: 'Amount Paid (INR)', key: 'amountPaid' },
          { label: 'Balance Due (INR)', key: 'balanceDue' },
          { label: 'Status', key: 'status' },
        ],
        invoiceData.invoices
      );
    } else if (activeTab === 'payments' && paymentData?.payments) {
      exportToCsv(
        'Payments_Report',
        [
          { label: 'Receipt #', key: 'paymentNumber' },
          { label: 'Invoice #', accessor: (r) => r.invoice?.invoiceNumber },
          { label: 'Customer', accessor: (r) => r.customer?.name },
          { label: 'Payment Date', accessor: (r) => formatDate(r.paymentDate) },
          { label: 'Method', key: 'paymentMethod' },
          { label: 'Reference / UTR', key: 'referenceNumber' },
          { label: 'Amount (INR)', key: 'amount' },
        ],
        paymentData.payments
      );
    } else if (activeTab === 'gst' && gstData?.rateWise) {
      exportToCsv(
        'GST_Report',
        [
          { label: 'GST Rate %', key: 'rate' },
          { label: 'Taxable Turnover (INR)', key: 'taxable' },
          { label: 'CGST (INR)', key: 'cgst' },
          { label: 'SGST (INR)', key: 'sgst' },
          { label: 'IGST (INR)', key: 'igst' },
          { label: 'Total Tax (INR)', key: 'totalTax' },
        ],
        gstData.rateWise
      );
    } else if (activeTab === 'customers') {
      exportToCsv(
        'Customer_Sales_Report',
        [
          { label: 'Customer ID', key: 'customerId' },
          { label: 'Customer Name', key: 'name' },
          { label: 'State', key: 'state' },
          { label: 'GSTIN', key: 'gstin' },
          { label: 'Total Invoiced (INR)', key: 'totalInvoiced' },
          { label: 'Total Paid (INR)', key: 'totalPaid' },
          { label: 'Balance Due (INR)', key: 'balanceDue' },
        ],
        customerData
      );
    } else if (activeTab === 'products') {
      exportToCsv(
        'Product_Sales_Report',
        [
          { label: 'Item Name', key: 'name' },
          { label: 'HSN/SAC', key: 'hsnCode' },
          { label: 'Quantity Sold', key: 'quantitySold' },
          { label: 'Unit', key: 'unit' },
          { label: 'Total Sales (INR)', key: 'totalSales' },
          { label: 'Tax Collected (INR)', key: 'taxCollected' },
        ],
        productData
      );
    }
  };

  const REPORT_TABS = [
    { id: 'revenue', label: 'Revenue & Cash', icon: TrendingUp },
    { id: 'invoices', label: 'Invoices Summary', icon: Receipt },
    { id: 'payments', label: 'Collections Ledger', icon: DollarSign },
    { id: 'gst', label: 'GST Tax Compliance', icon: ShieldCheck },
    { id: 'customers', label: 'Customer Sales', icon: Users },
    { id: 'products', label: 'Product Sales', icon: Package },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Financial Reports & Analytics</h2>
          <p className="text-sm text-slate-500">
            Real database audit reports, GST tax schedules, and CSV export
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Report
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 no-print">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      {activeTab !== 'customers' && activeTab !== 'products' && (
        <form
          onSubmit={handleApplyFilters}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print"
        >
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Filter Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
            >
              Update
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner size="lg" message="Compiling financial report data..." />
      ) : (
        <div className="space-y-6">
          {/* TAB 1: REVENUE REPORT */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Cash Revenue Collected</span>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-2">
                    {formatCurrency(revenueData.summary?.totalRevenueCollected || 0)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real payments in hand</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced Billed</span>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {formatCurrency(revenueData.summary?.totalInvoicedSales || 0)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Across all issued invoices</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Receivables</span>
                  <h3 className="text-2xl font-bold text-amber-600 mt-2">
                    {formatCurrency(revenueData.summary?.totalOutstandingInvoiced || 0)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Pending collections</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-800">
                  Daily Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Invoiced Billed (INR)</th>
                        <th className="px-4 py-3 text-right">Collected Revenue (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueData.breakdown?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-700">{formatDate(row.date)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(row.invoiced)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            {formatCurrency(row.collected)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES SUMMARY REPORT */}
          {activeTab === 'invoices' && invoiceData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Taxable Turnover</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {formatCurrency(invoiceData.summary?.totalTaxable || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Total GST Collected</span>
                  <p className="text-xl font-bold text-primary-600 mt-1">
                    {formatCurrency(invoiceData.summary?.totalTax || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Total Billed</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {formatCurrency(invoiceData.summary?.grandTotal || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Total Collected</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(invoiceData.summary?.totalPaid || 0)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Taxable</th>
                        <th className="px-4 py-3 text-right">CGST</th>
                        <th className="px-4 py-3 text-right">SGST</th>
                        <th className="px-4 py-3 text-right">IGST</th>
                        <th className="px-4 py-3 text-right">Grand Total</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceData.invoices?.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-primary-600 font-mono">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {inv.customerSnapshot?.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(inv.taxableSubtotal)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.totalCgst)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.totalSgst)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.totalIgst)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {formatCurrency(inv.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS LEDGER */}
          {activeTab === 'payments' && paymentData && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Total Payments Logged</span>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(paymentData.summary?.totalCollected || 0)}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {Object.entries(paymentData.summary?.methodBreakdown || {}).map(([method, amt]) => (
                    <div key={method} className="p-2 bg-slate-50 rounded border text-xs">
                      <span className="text-slate-500 block">{method}:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Payment #</th>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3 text-right">Amount Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentData.payments?.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800 font-mono">{p.paymentNumber}</td>
                          <td className="px-4 py-3 font-mono text-primary-600">
                            {p.invoice?.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{p.customer?.name}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                            {p.referenceNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 text-sm">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GST TAX COMPLIANCE REPORT */}
          {activeTab === 'gst' && gstData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Total Taxable Value</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {formatCurrency(gstData.gstSummary?.totalTaxable || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Intra-State CGST</span>
                  <p className="text-xl font-bold text-primary-600 mt-1">
                    {formatCurrency(gstData.gstSummary?.totalCgst || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Intra-State SGST</span>
                  <p className="text-xl font-bold text-primary-600 mt-1">
                    {formatCurrency(gstData.gstSummary?.totalSgst || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500">Inter-State IGST</span>
                  <p className="text-xl font-bold text-indigo-600 mt-1">
                    {formatCurrency(gstData.gstSummary?.totalIgst || 0)}
                  </p>
                </div>
              </div>

              {/* Rate-wise Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-800">
                  Rate-wise GST Liability Schedule
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">GST Rate %</th>
                        <th className="px-4 py-3 text-right">Taxable Turnover (INR)</th>
                        <th className="px-4 py-3 text-right">CGST (INR)</th>
                        <th className="px-4 py-3 text-right">SGST (INR)</th>
                        <th className="px-4 py-3 text-right">IGST (INR)</th>
                        <th className="px-4 py-3 text-right">Total GST Tax (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gstData.rateWise?.map((r) => (
                        <tr key={r.rate} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {r.rate}% {r.rate === 0 ? '(Exempt)' : ''}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.taxable)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(r.cgst)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(r.sgst)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(r.igst)}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary-700">
                            {formatCurrency(r.totalTax)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER SALES REPORT */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-800">
                Customer Sales & Balance Summary
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Customer ID</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">GSTIN</th>
                      <th className="px-4 py-3 text-right">Total Invoiced</th>
                      <th className="px-4 py-3 text-right">Total Paid</th>
                      <th className="px-4 py-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerData.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-primary-600">{c.customerId}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                        <td className="px-4 py-3 text-slate-600">{c.state}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {c.gstin || 'Unregistered'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.totalInvoiced)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(c.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">
                          {formatCurrency(c.balanceDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PRODUCT SALES REPORT */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-800">
                Product & Service Sales Performance
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3 text-center">HSN/SAC</th>
                      <th className="px-4 py-3 text-center">Quantity Sold</th>
                      <th className="px-4 py-3 text-right">Taxable Sales</th>
                      <th className="px-4 py-3 text-right">Tax Collected</th>
                      <th className="px-4 py-3 text-right">Total Gross Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productData.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">{p.hsnCode || '-'}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {p.quantitySold} {p.unit}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(p.taxableSales)}</td>
                        <td className="px-4 py-3 text-right text-primary-600 font-medium">
                          {formatCurrency(p.taxCollected)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(p.totalSales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
