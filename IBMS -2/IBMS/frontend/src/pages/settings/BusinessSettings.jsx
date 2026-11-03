import React, { useState, useEffect } from 'react';
import { businessProfileService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import {
  Building2,
  Save,
  ShieldCheck,
  CreditCard,
  FileText,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
} from 'lucide-react';

export default function BusinessSettings() {
  const { updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    businessName: '',
    legalName: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
    country: 'India',
    invoicePrefix: 'INV',
    defaultPaymentTerms: '',
    defaultNotes: '',
    bankDetails: {
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      upiId: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await businessProfileService.get();
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          businessName: p.businessName || '',
          legalName: p.legalName || '',
          email: p.email || '',
          phone: p.phone || '',
          gstin: p.gstin || '',
          pan: p.pan || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || 'Maharashtra',
          postalCode: p.postalCode || '',
          country: p.country || 'India',
          invoicePrefix: p.invoicePrefix || 'INV',
          defaultPaymentTerms: p.defaultPaymentTerms || '',
          defaultNotes: p.defaultNotes || '',
          bankDetails: {
            bankName: p.bankDetails?.bankName || '',
            accountHolder: p.bankDetails?.accountHolder || '',
            accountNumber: p.bankDetails?.accountNumber || '',
            ifscCode: p.bankDetails?.ifscCode || '',
            branch: p.bankDetails?.branch || '',
            upiId: p.bankDetails?.upiId || '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching business settings:', err);
      setAlert({ type: 'error', message: 'Failed to load business profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAlert({ type: '', message: '' });
      const res = await businessProfileService.update(formData);
      updateProfile(res.data.profile);
      setAlert({ type: 'success', message: 'Business profile and tax settings saved successfully.' });
    } catch (err) {
      console.error('Error saving settings:', err);
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading company settings..." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Company Settings & Profile</h2>
          <p className="text-sm text-slate-500">
            Configure your enterprise details, tax identifiers, and bank account for invoices
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity & GST Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-800 text-base">
            <Building2 className="w-5 h-5 text-primary-600" />
            <span>Business Information & GST Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trading / Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Apex Innovations Pvt Ltd"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="e.g. Apex Innovations Private Limited"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Business GSTIN (15 Digits)
              </label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="27AABCA1234F1Z5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono text-slate-800 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Printed on Tax Invoice header
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company PAN
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AABCA1234F"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Billing Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 22 2840 9999"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Registered Address Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-800 text-base">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Place of Business (Supplier Origin State)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Registered Office Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Suite number, building name, road..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State (Primary GST Jurisdiction) *
              </label>
              <select
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-bold"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="400001"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bank & Remittance Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-800 text-base">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Bank Remittance & UPI Details (Printed on Invoices)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankDetails.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                placeholder="e.g. HDFC Bank Ltd"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountHolder}
                onChange={(e) => handleBankChange('accountHolder', e.target.value)}
                placeholder="e.g. Apex Innovations Pvt Ltd"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                placeholder="50200012345678"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.bankDetails.ifscCode}
                onChange={(e) => handleBankChange('ifscCode', e.target.value.toUpperCase())}
                placeholder="HDFC0000123"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                value={formData.bankDetails.upiId}
                onChange={(e) => handleBankChange('upiId', e.target.value)}
                placeholder="business@okhdfcbank"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono text-primary-700 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Invoice Customization Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-800 text-base">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>Default Invoicing Terms & Numbering</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="INV"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Generates {formData.invoicePrefix}-2026-1001
              </span>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Payment Terms
              </label>
              <input
                type="text"
                value={formData.defaultPaymentTerms}
                onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                placeholder="Payment due within 15 days of invoice date."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default Invoice Footer Notes
            </label>
            <textarea
              rows={2}
              value={formData.defaultNotes}
              onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
              placeholder="Thank you for your business!"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
