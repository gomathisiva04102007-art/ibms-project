import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { formatCurrency, GST_RATES, UNITS } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  Tag,
  Percent,
  X,
  FileCode,
} from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const [categories, setCategories] = useState([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    code: '',
    hsnCode: '',
    description: '',
    type: 'product',
    category: 'General',
    unitPrice: '',
    gstRate: 18,
    unit: 'PCS',
    isActive: true,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortOption, categoryFilter, typeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll({
        page: currentPage,
        limit: 10,
        search,
        category: categoryFilter,
        type: typeFilter,
        sort: sortOption,
      });
      setProducts(res.data.products);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      if (res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setAlert({ type: 'error', message: 'Failed to load products.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalFormData({
      name: '',
      code: '',
      hsnCode: '',
      description: '',
      type: 'product',
      category: 'General',
      unitPrice: '',
      gstRate: 18,
      unit: 'PCS',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setModalFormData({
      name: product.name,
      code: product.code || '',
      hsnCode: product.hsnCode || '',
      description: product.description || '',
      type: product.type || 'product',
      category: product.category || 'General',
      unitPrice: product.unitPrice,
      gstRate: product.gstRate,
      unit: product.unit || 'PCS',
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalFormData.name || modalFormData.unitPrice === '') {
      setAlert({ type: 'error', message: 'Product name and unit price are required.' });
      return;
    }

    const price = Number(modalFormData.unitPrice);
    if (isNaN(price) || price < 0) {
      setAlert({ type: 'error', message: 'Unit price must be a valid positive number.' });
      return;
    }

    try {
      setModalLoading(true);
      if (editingProduct) {
        await productService.update(editingProduct._id, {
          ...modalFormData,
          unitPrice: price,
        });
        setAlert({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await productService.create({
          ...modalFormData,
          unitPrice: price,
        });
        setAlert({ type: 'success', message: 'Product created successfully.' });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Error saving product.',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await productService.delete(deleteDialog.product._id);
      setAlert({ type: 'success', message: 'Product deleted successfully.' });
      setDeleteDialog({ isOpen: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Cannot delete product.',
      });
      setDeleteDialog({ isOpen: false, product: null, loading: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Products & Services</h2>
          <p className="text-sm text-slate-500">
            Catalog items, HSN/SAC codes, pricing, and GST tax classifications
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, HSN code..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="product">Goods / Products</option>
              <option value="service">Services</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="newest">Newest Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" message="Loading catalog..." />
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No items found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add your services and products to quickly populate invoice line items.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3">Code / SKU</th>
                  <th className="px-4 py-3">HSN/SAC</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">GST Rate</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                            p.type === 'service'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {p.type}
                        </span>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 font-medium">
                      {p.code || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {p.hsnCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(p.unitPrice)}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">/ {p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          p.gstRate === 0
                            ? 'bg-slate-100 text-slate-600'
                            : p.gstRate === 18
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.gstRate}% GST
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, product: p, loading: false })}
                          title="Delete Product"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingProduct ? 'Edit Catalog Item' : 'Add Product or Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                  placeholder="e.g. Cloud Hosting Setup or Thermal Printer"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Classification Type *
                  </label>
                  <select
                    value={modalFormData.type}
                    onChange={(e) => setModalFormData({ ...modalFormData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  >
                    <option value="product">Goods / Physical Product</option>
                    <option value="service">Service / Consultancy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={modalFormData.category}
                    onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
                    placeholder="e.g. Software, Hardware, Consulting"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Item Code / SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalFormData.code}
                    onChange={(e) => setModalFormData({ ...modalFormData, code: e.target.value.toUpperCase() })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={modalFormData.hsnCode}
                    onChange={(e) => setModalFormData({ ...modalFormData, hsnCode: e.target.value })}
                    placeholder="e.g. 998313 (SAC) or 844332 (HSN)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={modalFormData.unitPrice}
                    onChange={(e) => setModalFormData({ ...modalFormData, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GST Rate *
                  </label>
                  <select
                    value={modalFormData.gstRate}
                    onChange={(e) => setModalFormData({ ...modalFormData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-semibold"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST {rate === 0 ? '(Exempt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit *
                  </label>
                  <select
                    value={modalFormData.unit}
                    onChange={(e) => setModalFormData({ ...modalFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-semibold"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Specifications
                </label>
                <textarea
                  rows={2}
                  value={modalFormData.description}
                  onChange={(e) => setModalFormData({ ...modalFormData, description: e.target.value })}
                  placeholder="Detailed description for invoice line items..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800"
                />
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
                  {modalLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"? If this item was previously used in any invoice, deletion is prevented to protect invoice history.`}
        confirmText="Delete Item"
        isLoading={deleteDialog.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, product: null, loading: false })}
      />
    </div>
  );
}
