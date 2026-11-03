import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceService, customerService, productService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, INDIAN_STATES, GST_RATES, UNITS } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState('Unpaid');

  const [items, setItems] = useState([]);
  const [calculation, setCalculation] = useState({
    isInterState: false,
    subtotal: 0,
    totalDiscount: 0,
    taxableSubtotal: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalTax: 0,
    grandTotal: 0,
    amountInWords: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [invRes, custRes, prodRes] = await Promise.all([
        invoiceService.getById(id),
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);

      const inv = invRes.data.invoice;
      if (inv.amountPaid > 0) {
        setError('Invoices with recorded payments cannot be modified.');
        setLoading(false);
        return;
      }

      setInvoiceNumber(inv.invoiceNumber);
      setSelectedCustomerId(inv.customer?._id || inv.customer);
      setPlaceOfSupply(inv.placeOfSupply);
      setIssueDate(new Date(inv.issueDate).toISOString().split('T')[0]);
      setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
      setNotes(inv.notes || '');
      setTerms(inv.terms || '');
      setStatus(inv.status);

      setItems(
        inv.items.map((i) => ({
          product: i.product || '',
          name: i.name,
          description: i.description || '',
          hsnCode: i.hsnCode || '',
          unit: i.unit || 'PCS',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountType: i.discountType || 'percentage',
          discountValue: i.discountValue || 0,
          gstRate: i.gstRate || 18,
        }))
      );

      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error loading invoice for edit:', err);
      setError('Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLiveTotals();
  }, [items, placeOfSupply, selectedCustomerId]);

  const calculateLiveTotals = async () => {
    const validItems = items.filter((i) => i.name && Number(i.quantity) > 0 && i.unitPrice !== '');
    if (validItems.length === 0) return;

    try {
      const res = await invoiceService.calculate({
        customerId: selectedCustomerId,
        placeOfSupply,
        items: validItems,
      });
      setCalculation(res.data.calculation);
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleProductSelect = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    const updated = [...items];
    if (prod) {
      updated[index] = {
        ...updated[index],
        product: prod._id,
        name: prod.name,
        description: prod.description || '',
        hsnCode: prod.hsnCode || '',
        unit: prod.unit || 'PCS',
        unitPrice: prod.unitPrice,
        gstRate: prod.gstRate,
      };
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: '',
        name: '',
        description: '',
        hsnCode: '',
        unit: 'PCS',
        quantity: 1,
        unitPrice: '',
        discountType: 'percentage',
        discountValue: 0,
        gstRate: 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setError('Invoice must have at least one line item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      await invoiceService.update(id, {
        customerId: selectedCustomerId,
        issueDate,
        dueDate,
        placeOfSupply,
        items,
        notes,
        terms,
        status,
      });

      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error('Invoice update failed:', err);
      setError(err.response?.data?.message || 'Failed to update invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading invoice for editing..." />;
  }

  const supplierState = profile?.state || 'Maharashtra';
  const isInterState = (placeOfSupply || '').toLowerCase() !== supplierState.toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/invoices/${id}`}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Edit Invoice {invoiceNumber}
            </h2>
            <p className="text-xs text-slate-500">Update line items, pricing, or dates</p>
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Updating...' : 'Save Changes'}
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Main Form Setup */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} - {c.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Place of Supply *
            </label>
            <select
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST+SGST)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <h3 className="text-sm font-bold text-slate-800">Line Items</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-lg"
          >
            + Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-2 w-60">Item Name</th>
                <th className="p-2 w-20 text-center">Qty</th>
                <th className="p-2 w-28 text-right">Price</th>
                <th className="p-2 w-24 text-center">GST %</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="p-2 space-y-1">
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded p-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full text-[11px] bg-white border border-slate-200 rounded p-1 text-slate-600"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full text-xs text-center font-bold bg-white border border-slate-300 rounded p-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full text-xs text-right font-bold bg-white border border-slate-300 rounded p-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.gstRate}
                      onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                      className="w-full text-xs font-bold text-center bg-white border border-slate-300 rounded p-1.5"
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-semibold uppercase">Updated Grand Total</span>
          <p className="text-2xl font-black text-primary-700">{formatCurrency(calculation.grandTotal)}</p>
          <p className="text-xs text-slate-500 italic mt-0.5">{calculation.amountInWords}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/invoices/${id}`}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
