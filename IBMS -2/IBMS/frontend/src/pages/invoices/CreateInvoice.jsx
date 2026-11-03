import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Building,
  User,
  Calendar,
  Percent,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const preSelectedCustomerId = queryParams.get('customerId') || '';

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Invoice form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(preSelectedCustomerId);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [placeOfSupply, setPlaceOfSupply] = useState(profile?.state || 'Maharashtra');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState(profile?.defaultNotes || '');
  const [terms, setTerms] = useState(profile?.defaultPaymentTerms || '');

  // Line items
  const [items, setItems] = useState([
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

  // Live calculation result from server/client
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
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll({ limit: 100, status: 'active' }),
        productService.getAll({ limit: 100, status: 'active' }),
      ]);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);

      if (preSelectedCustomerId) {
        const found = custRes.data.customers.find((c) => c._id === preSelectedCustomerId);
        if (found) {
          setSelectedCustomer(found);
          setPlaceOfSupply(found.state);
        }
      }
    } catch (err) {
      console.error('Error loading customers/products:', err);
      setError('Failed to load customers and products catalog.');
    } finally {
      setLoading(false);
    }
  };

  // When customer changes
  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    const found = customers.find((c) => c._id === customerId);
    if (found) {
      setSelectedCustomer(found);
      setPlaceOfSupply(found.state || profile?.state || 'Maharashtra');
    } else {
      setSelectedCustomer(null);
    }
  };

  // Recalculate invoice totals whenever items or place of supply change
  useEffect(() => {
    calculateLiveTotals();
  }, [items, placeOfSupply, selectedCustomerId]);

  const calculateLiveTotals = async () => {
    const validItems = items.filter((i) => i.name && Number(i.quantity) > 0 && i.unitPrice !== '');
    if (validItems.length === 0) {
      setCalculation({
        isInterState: (placeOfSupply || '').toLowerCase() !== (profile?.state || 'Maharashtra').toLowerCase(),
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
      return;
    }

    try {
      const res = await invoiceService.calculate({
        customerId: selectedCustomerId || undefined,
        placeOfSupply,
        items: validItems,
      });
      setCalculation(res.data.calculation);
    } catch (err) {
      // Fallback local calc
      console.error('Server calculation error:', err);
    }
  };

  // Line item handlers
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
    } else {
      updated[index].product = '';
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
    setError('');
  };

  const handleSubmit = async (targetStatus) => {
    if (!selectedCustomerId) {
      setError('Please select a customer for this invoice.');
      return;
    }

    const invalidItem = items.find(
      (i) => !i.name || !i.quantity || Number(i.quantity) <= 0 || i.unitPrice === '' || Number(i.unitPrice) < 0
    );

    if (invalidItem) {
      setError('Please make sure every item has a name, positive quantity, and valid unit price.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await invoiceService.create({
        customerId: selectedCustomerId,
        issueDate,
        dueDate,
        placeOfSupply,
        items,
        notes,
        terms,
        status: targetStatus,
      });

      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      console.error('Invoice creation failed:', err);
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading invoice workspace..." />;
  }

  const supplierState = profile?.state || 'Maharashtra';
  const isInterStateSupply = (placeOfSupply || '').trim().toLowerCase() !== supplierState.trim().toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Create Tax Invoice</h2>
            <p className="text-xs text-slate-500">
              Indian GST compliant invoice with automatic CGST/SGST and IGST tax engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('Draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('Unpaid')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Issue & Finalize Invoice
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Invoice Setup Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Selection */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-semibold"
            >
              <option value="">-- Choose a Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.customerId}) - {c.state}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                <p className="text-slate-600">{selectedCustomer.billingAddress || 'No address'}</p>
                <p className="text-slate-600 font-medium">
                  {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.postalCode}
                </p>
                <p className="text-primary-700 font-mono pt-1">
                  {selectedCustomer.gstin ? `GSTIN: ${selectedCustomer.gstin}` : 'Unregistered Consumer'}
                </p>
              </div>
            )}
          </div>

          {/* Place of Supply & Tax Mode Indicator */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Place of Supply (State) *
            </label>
            <select
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-semibold"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <div className="mt-3 p-3 rounded-lg border text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                <span className={isInterStateSupply ? 'text-primary-700' : 'text-emerald-700'}>
                  {isInterStateSupply ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Supplier in <span className="font-semibold text-slate-700">{supplierState}</span>, Supply to{' '}
                <span className="font-semibold text-slate-700">{placeOfSupply}</span>.
                {isInterStateSupply
                  ? ' Integrated GST (IGST) will be applied at the full tax rate.'
                  : ' Tax will be split equally between Central GST (CGST) and State GST (SGST).'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-800">Invoice Line Items</h3>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-2.5 w-60">Item & Description</th>
                <th className="p-2.5 w-24">HSN/SAC</th>
                <th className="p-2.5 w-20 text-center">Qty</th>
                <th className="p-2.5 w-20">Unit</th>
                <th className="p-2.5 w-28 text-right">Unit Price (₹)</th>
                <th className="p-2.5 w-24 text-right">Discount</th>
                <th className="p-2.5 w-24 text-center">GST %</th>
                <th className="p-2.5 w-32 text-right">Amount (₹)</th>
                <th className="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const rawTotal = qty * price;
                let discAmt = 0;
                if (item.discountType === 'percentage') {
                  discAmt = (rawTotal * (Number(item.discountValue) || 0)) / 100;
                } else {
                  discAmt = Math.min(Number(item.discountValue) || 0, rawTotal);
                }
                const taxable = Math.max(0, rawTotal - discAmt);
                const tax = (taxable * (Number(item.gstRate) || 0)) / 100;
                const lineTotal = taxable + tax;

                return (
                  <tr key={index} className="align-top hover:bg-slate-50/50">
                    <td className="p-2 space-y-1.5">
                      {/* Catalog selector */}
                      <select
                        value={item.product || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-700"
                      >
                        <option value="">-- Catalog Item or Custom --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (₹{p.unitPrice})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Item name *"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded p-1.5 text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded p-1 text-slate-600"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="HSN"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono text-slate-700"
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
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-800"
                      />
                    </td>

                    <td className="p-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-700"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-right font-bold text-slate-800"
                      />
                    </td>

                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.discountValue}
                          onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                          className="w-14 text-xs bg-white border border-slate-300 rounded p-1.5 text-right font-medium"
                        />
                        <select
                          value={item.discountType}
                          onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                          className="text-[10px] bg-slate-100 border border-slate-300 rounded p-1"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-2">
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-800"
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>
                            {r}%
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2 text-right">
                      <span className="font-bold text-slate-900 block">{formatCurrency(lineTotal)}</span>
                      <span className="text-[10px] text-slate-400 block">
                        Tax: {formatCurrency(tax)}
                      </span>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary and Terms / Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes and Terms */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, interest on overdue balance, etc..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Notes / Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes displayed on invoice footer..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* GST Tax Calculation Summary Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-sm">
          <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Invoice Financial Summary</span>
            <span className="text-xs font-normal text-slate-500">Live GST Computed</span>
          </h3>

          <div className="flex justify-between text-slate-600">
            <span>Gross Subtotal:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(calculation.subtotal)}</span>
          </div>

          {calculation.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Total Item Discounts:</span>
              <span className="font-semibold">- {formatCurrency(calculation.totalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-100 font-semibold">
            <span>Taxable Turnover:</span>
            <span>{formatCurrency(calculation.taxableSubtotal)}</span>
          </div>

          {/* Conditional GST breakdown */}
          {calculation.isInterState ? (
            <div className="flex justify-between text-primary-700 bg-primary-50 p-2 rounded">
              <span>Integrated GST (IGST):</span>
              <span className="font-bold">{formatCurrency(calculation.totalIgst)}</span>
            </div>
          ) : (
            <div className="space-y-1 bg-slate-50 p-2 rounded">
              <div className="flex justify-between text-slate-700 text-xs">
                <span>Central GST (CGST):</span>
                <span className="font-semibold">{formatCurrency(calculation.totalCgst)}</span>
              </div>
              <div className="flex justify-between text-slate-700 text-xs">
                <span>State GST (SGST):</span>
                <span className="font-semibold">{formatCurrency(calculation.totalSgst)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
            <span>Total GST Tax:</span>
            <span>{formatCurrency(calculation.totalTax)}</span>
          </div>

          <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t-2 border-slate-200">
            <span>Grand Total (INR):</span>
            <span className="text-primary-700">{formatCurrency(calculation.grandTotal)}</span>
          </div>

          {calculation.amountInWords && (
            <div className="p-2.5 bg-slate-50 rounded text-xs text-primary-900 italic font-medium leading-relaxed">
              {calculation.amountInWords}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Draft')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Unpaid')}
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow"
            >
              {submitting ? 'Generating Invoice...' : 'Generate & Issue Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
