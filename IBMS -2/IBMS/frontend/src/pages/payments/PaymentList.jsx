import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../../services/api';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import {
  CreditCard,
  Search,
  Calendar,
  Filter,
  Trash2,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete / Revert Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    payment: null,
    loading: false,
  });
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchPayments();
  }, [currentPage, methodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getAll({
        page: currentPage,
        limit: 10,
        search,
        paymentMethod: methodFilter === 'All' ? undefined : methodFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPayments(res.data.payments);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setAlert({ type: 'error', message: 'Failed to load payments history.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setMethodFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.payment) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await paymentService.delete(deleteDialog.payment._id);
      setAlert({
        type: 'success',
        message: `Payment ${deleteDialog.payment.paymentNumber} has been reversed and balances adjusted.`,
      });
      setDeleteDialog({ isOpen: false, payment: null, loading: false });
      fetchPayments();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to revert payment.',
      });
      setDeleteDialog({ isOpen: false, payment: null, loading: false });
    }
  };

  const totalCollectedOnPage = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Payment Collections</h2>
          <p className="text-sm text-slate-500">
            Real cash ledger, external bank transfers, UPI receipts, and audit trail
          </p>
        </div>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Filters Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3"
      >
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, receipt #, notes..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="All">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" message="Loading payments ledger..." />
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No payment records found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Payments are recorded directly against open invoices in the Invoices module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Receipt / Payment #</th>
                  <th className="px-4 py-3">Linked Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference / UTR</th>
                  <th className="px-4 py-3 text-right">Amount Received</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 font-mono">
                      {p.paymentNumber}
                    </td>
                    <td className="px-4 py-3">
                      {p.invoice ? (
                        <Link
                          to={`/invoices/${p.invoice._id}`}
                          className="font-bold text-primary-600 hover:underline font-mono"
                        >
                          {p.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Archived Invoice</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700">
                        {p.customer?.name || 'Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {p.referenceNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            payment: p,
                            loading: false,
                          })
                        }
                        title="Revert / Delete Payment"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          limit={10}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Delete / Reversal Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Revert Payment"
        message={`Revert payment receipt ${deleteDialog.payment?.paymentNumber} of ${formatCurrency(
          deleteDialog.payment?.amount || 0
        )}? The linked invoice's balance due and payment status will be adjusted automatically.`}
        confirmText="Revert Payment"
        isLoading={deleteDialog.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, payment: null, loading: false })}
      />
    </div>
  );
}
