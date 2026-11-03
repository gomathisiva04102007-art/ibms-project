import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await customerService.getById(id);
      setData(res.data);
    } catch (err) {
      console.error('Error loading customer detail:', err);
      setError('Customer not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading customer profile & invoice history..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <Alert type="error" message={error || 'Customer not found'} />
      </div>
    );
  }

  const { customer, invoices, payments } = data;

  return (
    <div className="space-y-6">
      {/* Back and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">{customer.name}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 border border-primary-200">
                {customer.customerId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client profile, invoicing history, and transaction ledger
            </p>
          </div>
        </div>

        <Link
          to={`/invoices/new?customerId=${customer._id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice for this Customer
        </Link>
      </div>

      {/* Financial Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(customer.totalInvoiced || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{invoices.length} invoices issued</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(customer.totalPaid || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{payments.length} payments recorded</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
          <h3 className={`text-2xl font-bold mt-2 ${customer.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatCurrency(customer.balanceDue || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {customer.balanceDue > 0 ? 'Payment pending' : 'Zero balance / Cleared'}
          </p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Billing & GST Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contact Person / Email
            </span>
            <p className="text-slate-800 font-medium flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {customer.email || 'None provided'}
            </p>
            <p className="text-slate-600 text-xs mt-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              {customer.phone || 'None provided'}
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tax Registration
            </span>
            <p className="text-slate-800 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {customer.gstin ? `GSTIN: ${customer.gstin}` : 'Unregistered Customer'}
            </p>
            {customer.pan && (
              <p className="text-slate-600 text-xs mt-1">PAN: {customer.pan}</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Place of Supply & Address
            </span>
            <p className="text-slate-800 font-medium flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              State: {customer.state}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              {customer.billingAddress ? `${customer.billingAddress}, ` : ''}
              {customer.city ? `${customer.city} ` : ''}
              {customer.postalCode ? `- ${customer.postalCode}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List for this Customer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-800">Invoice History ({invoices.length})</h3>
          </div>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No invoices have been billed to this customer yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Due Date</th>
                  <th className="px-4 py-2.5 text-right">Grand Total</th>
                  <th className="px-4 py-2.5 text-right">Amount Paid</th>
                  <th className="px-4 py-2.5 text-right">Balance Due</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-primary-600">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={inv.balanceDue > 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments History for this Customer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Payment Ledger ({payments.length})</h3>
          </div>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payments recorded for this customer yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Payment #</th>
                  <th className="px-4 py-2.5">Payment Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Reference / UTR</th>
                  <th className="px-4 py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{p.paymentNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {p.referenceNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
