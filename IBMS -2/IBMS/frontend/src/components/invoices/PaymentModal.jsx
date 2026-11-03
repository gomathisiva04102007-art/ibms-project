import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/api';
import { formatCurrency, PAYMENT_METHODS } from '../../utils/formatters';
import Alert from '../common/Alert';
import { CreditCard, X, DollarSign, Calendar, FileText, Check } from 'lucide-react';

export default function PaymentModal({ isOpen, invoice, onClose, onSuccess }) {
  if (!isOpen || !invoice) return null;

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.balanceDue > 0 ? invoice.balanceDue : '');
      setError('');
    }
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payNum = Number(amount);

    if (isNaN(payNum) || payNum <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (payNum > invoice.balanceDue + 0.01) {
      setError(`Amount cannot exceed the remaining balance due of ${formatCurrency(invoice.balanceDue)}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await paymentService.record({
        invoiceId: invoice._id,
        amount: payNum,
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFull = () => {
    setAmount(invoice.balanceDue);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Record Payment</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Invoice Total</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Already Paid</span>
              <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                {formatCurrency(invoice.amountPaid || 0)}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Remaining Due</span>
              <span className="font-bold text-amber-600 text-sm mt-0.5 block">
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Alert type="error" message={error} onClose={() => setError('')} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Amount (₹) *
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balanceDue}
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 text-base font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference / Transaction ID / UTR
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI-AXIS-998811 or NEFT-HDFC-33221"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via GPay from Client Finance"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Recording...' : 'Confirm & Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
