import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/api';
import { formatCurrency, INDIAN_STATES } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
  Building,
  Phone,
  Mail,
  X,
} from 'lucide-react';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
    gstin: '',
    pan: '',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    customer: null,
    loading: false,
  });

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, sortOption, stateFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll({
        page: currentPage,
        limit: 10,
        search,
        state: stateFilter,
        sort: sortOption,
      });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setAlert({ type: 'error', message: 'Failed to load customers.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setModalFormData({
      customerId: '',
      name: '',
      email: '',
      phone: '',
      billingAddress: '',
      city: '',
      state: 'Maharashtra',
      postalCode: '',
      gstin: '',
      pan: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setModalFormData({
      customerId: customer.customerId,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      billingAddress: customer.billingAddress || '',
      city: customer.city || '',
      state: customer.state || 'Maharashtra',
      postalCode: customer.postalCode || '',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalFormData.name || !modalFormData.state) {
      setAlert({ type: 'error', message: 'Customer name and state are required.' });
      return;
    }

    try {
      setModalLoading(true);
      if (editingCustomer) {
        await customerService.update(editingCustomer._id, modalFormData);
        setAlert({ type: 'success', message: 'Customer updated successfully.' });
      } else {
        await customerService.create(modalFormData);
        setAlert({ type: 'success', message: 'Customer created successfully.' });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving customer information.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.customer) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await customerService.delete(deleteDialog.customer._id);
      setAlert({ type: 'success', message: 'Customer deleted successfully.' });
      setDeleteDialog({ isOpen: false, customer: null, loading: false });
      fetchCustomers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Cannot delete customer.',
      });
      setDeleteDialog({ isOpen: false, customer: null, loading: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Customers</h2>
          <p className="text-sm text-slate-500">Manage client directory, GSTIN profiles, and balances</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone, GSTIN..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="balance_desc">Highest Balance Due</option>
              <option value="balance_asc">Lowest Balance</option>
              <option value="newest">Newest Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" message="Loading customers..." />
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No customers found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add your first customer to generate professional GST invoices.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">State & GSTIN</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Total Invoiced</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary-600">
                      <Link to={`/customers/${c._id}`}>{c.customerId}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/customers/${c._id}`} className="font-semibold text-slate-800 hover:text-primary-600">
                        {c.name}
                      </Link>
                      {c.city && <span className="block text-[11px] text-slate-400">{c.city}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{c.state}</span>
                      <span className="block text-[11px] text-slate-400">
                        {c.gstin ? `GST: ${c.gstin}` : 'Unregistered'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.phone && <span className="block text-[11px]">{c.phone}</span>}
                      {c.email && <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">{c.email}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatCurrency(c.totalInvoiced || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={c.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatCurrency(c.balanceDue || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/customers/${c._id}`}
                          title="View Details"
                          className="p-1 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, customer: c, loading: false })}
                          title="Delete Customer"
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Customer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalFormData.name}
                    onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                    placeholder="e.g. Reliance Tech Ltd"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalFormData.customerId}
                    onChange={(e) => setModalFormData({ ...modalFormData, customerId: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={modalFormData.email}
                    onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })}
                    placeholder="accounts@client.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={modalFormData.phone}
                    onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State (Place of Supply) *
                  </label>
                  <select
                    required
                    value={modalFormData.state}
                    onChange={(e) => setModalFormData({ ...modalFormData, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
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
                    GSTIN (15 characters)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={modalFormData.gstin}
                    onChange={(e) => setModalFormData({ ...modalFormData, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 27AABCT1234F1Z5"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={modalFormData.billingAddress}
                  onChange={(e) => setModalFormData({ ...modalFormData, billingAddress: e.target.value })}
                  placeholder="Street address, building, floor..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={modalFormData.city}
                    onChange={(e) => setModalFormData({ ...modalFormData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={modalFormData.postalCode}
                    onChange={(e) => setModalFormData({ ...modalFormData, postalCode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteDialog.customer?.name}"? If there are any issued invoices for this customer, the system will prevent deletion to preserve financial compliance.`}
        confirmText="Delete Customer"
        isLoading={deleteDialog.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, customer: null, loading: false })}
      />
    </div>
  );
}
