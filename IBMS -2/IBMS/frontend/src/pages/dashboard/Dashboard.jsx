import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Package,
  Plus,
  ArrowRight,
  CreditCard,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, chartsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRevenueCharts(),
      ]);
      setStats(statsRes.data.stats);
      setCharts(chartsRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Unable to load real-time dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading live dashboard statistics..." />;
  }

  const COLORS = ['#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#94a3b8'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Financial Dashboard</h2>
          <p className="text-sm text-slate-500">Live overview of sales, collections, and GST invoicing</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Add Customer
          </Link>
          <Link
            to="/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors"
          >
            <CreditCard className="w-4 h-4 text-primary-600" />
            Record Payment
          </Link>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">
              {formatCurrency(stats?.totalInvoicedAmount || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Across <span className="font-semibold text-slate-700">{stats?.totalInvoices || 0}</span> issued invoices
            </p>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Revenue</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats?.totalRevenueCollected || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Real cash payments collected</p>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats?.totalOutstandingBalance || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Unpaid + partially paid balance
            </p>
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Invoices</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600">
              {stats?.overdueInvoices || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Requires immediate collection follow-up
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <span className="text-xs text-slate-500 font-medium">Fully Paid</span>
            <p className="text-lg font-bold text-slate-800">{stats?.paidInvoices || 0}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <span className="text-xs text-slate-500 font-medium">Unpaid</span>
            <p className="text-lg font-bold text-slate-800">{stats?.unpaidInvoices || 0}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
          <Users className="w-5 h-5 text-primary-500" />
          <div>
            <span className="text-xs text-slate-500 font-medium">Customers</span>
            <p className="text-lg font-bold text-slate-800">{stats?.totalCustomers || 0}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
          <Package className="w-5 h-5 text-indigo-500" />
          <div>
            <span className="text-xs text-slate-500 font-medium">Catalog Items</span>
            <p className="text-lg font-bold text-slate-800">{stats?.totalProducts || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Monthly Invoiced vs Collected</h3>
              <p className="text-xs text-slate-500">6-month trend based on live database transactions</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {charts?.monthlyTrends && charts.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrends}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), '']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="invoiced" name="Invoiced Amount" fill="#0c8de9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Payments Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No monthly transactional data available
              </div>
            )}
          </div>
        </div>

        {/* Invoice Status Distribution Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Invoice Status Mix</h3>
            <p className="text-xs text-slate-500">Distribution by payment state</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {charts?.statusDistribution && charts.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} invoices`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No invoice data yet</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {charts?.statusDistribution?.map((item, idx) => (
              <div key={item.status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.status}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {charts?.recentInvoices && charts.recentInvoices.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charts.recentInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-primary-600">
                        <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[120px]">
                        {inv.customerSnapshot?.name || inv.customer?.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">No invoices created yet</div>
            )}
          </div>
        </div>

        {/* Recent Payments Stream */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Recent Collections</h3>
            <Link to="/payments" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {charts?.recentPayments && charts.recentPayments.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Payment #</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charts.recentPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {p.paymentNumber}
                        <span className="block text-[10px] text-slate-400">{formatDate(p.paymentDate)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[120px]">
                        {p.customer?.name || 'Customer'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">No payment transactions recorded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
