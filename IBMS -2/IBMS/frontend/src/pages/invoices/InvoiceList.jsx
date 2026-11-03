import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PaymentModal from '../../components/invoices/PaymentModal';
import Alert from '../../components/common/Alert';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Ban,
  CreditCard,
  Filter,
  Calendar,
  ArrowUpDown,
  Download,
  Printer,
} from 'lucide-react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Modal actions
  const [paymentModalState, setPaymentModalState] = useState({ isOpen: false, invoice: null });
  const [voidDialog, setVoidDialog] = useState({ isOpen: false, invoice: null, reason: '', loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, invoice: null, loading: false });
  const [alert, setAlert] = useState({ type: '', message: '' });

  const STATUS_TABS = ['All', 'Unpaid', 'Overdue', 'Partially Paid', 'Paid', 'Draft', 'Voided'];

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter, sortOption]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll({
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter === 'All' ? undefined : statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort: sortOption,
      });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setAlert({ type: 'error', message: 'Failed to load invoices from database.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  const handleVoidConfirm = async () => {
    if (!voidDialog.invoice) return;
    try {
      setVoidDialog((prev) => ({ ...prev, loading: true }));
      await invoiceService.voidInvoice(voidDialog.invoice._id, voidDialog.reason || 'Cancelled by user');
      setAlert({ type: 'success', message: `Invoice ${voidDialog.invoice.invoiceNumber} has been voided.` });
      setVoidDialog({ isOpen: false, invoice: null, reason: '', loading: false });
      fetchInvoices();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to void invoice.' });
      setVoidDialog({ isOpen: false, invoice: null, reason: '', loading: false });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.invoice) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await invoiceService.delete(deleteDialog.invoice._id);
      setAlert({ type: 'success', message: 'Invoice deleted successfully.' });
      setDeleteDialog({ isOpen: false, invoice: null, loading: false });
      fetchInvoices();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cannot delete invoice.' });
      setDeleteDialog({ isOpen: false, invoice: null, loading: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Invoices</h2>
          <p className="text-sm text-slate-500">
            Create, track, and manage GST tax invoices and customer payments
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Invoice
        </Link>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusFilter(tab);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === tab
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Advanced Filters */}
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
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
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

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
              <option value="due_date">Due Date</option>
            </select>
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

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" message="Loading invoices..." />
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No invoices match your criteria</h4>
            <p className="text-xs text-slate-500 mt-1">
              Create a new invoice or adjust filters to view matching documents.
            </p>
            <Link
              to="/invoices/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="font-bold text-primary-600 hover:underline font-mono"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span className="block text-[10px] text-slate-400">
                        {inv.isInterState ? 'IGST (Inter-State)' : 'CGST+SGST'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                        {inv.customerSnapshot?.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {inv.customerSnapshot?.city || inv.customerSnapshot?.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(inv.amountPaid || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span
                        className={
                          inv.balanceDue > 0
                            ? inv.status === 'Overdue'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                            : 'text-slate-400'
                        }
                      >
                        {formatCurrency(inv.balanceDue || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/invoices/${inv._id}`}
                          title="View & Print"
                          className="p-1 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Record payment if not fully paid, not draft, not voided */}
                        {inv.status !== 'Paid' && inv.status !== 'Draft' && inv.status !== 'Voided' && (
                          <button
                            onClick={() => setPaymentModalState({ isOpen: true, invoice: inv })}
                            title="Record Payment"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit if draft or unpaid with 0 payments */}
                        {(inv.status === 'Draft' || (inv.status === 'Unpaid' && inv.amountPaid === 0)) && (
                          <Link
                            to={`/invoices/${inv._id}/edit`}
                            title="Edit Invoice"
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Void button if not paid, not voided, and 0 payments */}
                        {inv.status !== 'Voided' && inv.amountPaid === 0 && (
                          <button
                            onClick={() =>
                              setVoidDialog({
                                isOpen: true,
                                invoice: inv,
                                reason: '',
                                loading: false,
                              })
                            }
                            title="Void Invoice"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button if Draft or Voided */}
                        {(inv.status === 'Draft' || inv.status === 'Voided') && inv.amountPaid === 0 && (
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                invoice: inv,
                                loading: false,
                              })
                            }
                            title="Delete Invoice"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        invoice={paymentModalState.invoice}
        onClose={() => setPaymentModalState({ isOpen: false, invoice: null })}
        onSuccess={() => {
          setAlert({ type: 'success', message: 'Payment recorded and balance updated.' });
          fetchInvoices();
        }}
      />

      {/* Void Dialog */}
      <ConfirmDialog
        isOpen={voidDialog.isOpen}
        title="Void Invoice"
        message={`Are you sure you want to mark invoice ${voidDialog.invoice?.invoiceNumber} as Voided? This will cancel the receivable amount from customer ledger while preserving an audit trail.`}
        confirmText="Void Invoice"
        isLoading={voidDialog.loading}
        onConfirm={handleVoidConfirm}
        onCancel={() => setVoidDialog({ isOpen: false, invoice: null, reason: '', loading: false })}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Invoice"
        message={`Permanently delete invoice ${deleteDialog.invoice?.invoiceNumber}? Only draft or voided invoices without recorded payments can be deleted.`}
        confirmText="Delete"
        isLoading={deleteDialog.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, invoice: null, loading: false })}
      />
    </div>
  );
}
