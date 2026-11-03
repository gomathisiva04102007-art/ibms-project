import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import InvoicePrintTemplate from '../../components/invoices/InvoicePrintTemplate';
import PaymentModal from '../../components/invoices/PaymentModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft,
  Printer,
  Download,
  CreditCard,
  Edit2,
  Ban,
  CheckCircle,
  FileText,
  Clock,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const printRef = useRef(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setAlert({ type: '', message: '' });
      const res = await invoiceService.getById(id);
      setInvoice(res.data.invoice);
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setAlert({ type: 'error', message: 'Invoice not found or failed to load.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setDownloadingPdf(true);
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber || 'Invoice'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      setAlert({ type: 'error', message: 'Could not generate PDF. Please use the Print option.' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleVoidConfirm = async () => {
    try {
      setVoidLoading(true);
      await invoiceService.voidInvoice(invoice._id, voidReason || 'Cancelled by user');
      setAlert({ type: 'success', message: `Invoice ${invoice.invoiceNumber} has been voided.` });
      setVoidDialogOpen(false);
      fetchInvoiceDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to void invoice.' });
      setVoidDialogOpen(false);
    } finally {
      setVoidLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading invoice and payment history..." />;
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <Alert type="error" message="Invoice record could not be found." />
      </div>
    );
  }

  const canEdit = invoice.status === 'Draft' || (invoice.status === 'Unpaid' && invoice.amountPaid === 0);
  const canPay = invoice.status !== 'Paid' && invoice.status !== 'Draft' && invoice.status !== 'Voided';
  const canVoid = invoice.status !== 'Voided' && invoice.amountPaid === 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued to {invoice.customerSnapshot?.name} on {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canPay && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {downloadingPdf ? 'Exporting...' : 'Download PDF'}
          </button>

          {canEdit && (
            <Link
              to={`/invoices/${invoice._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              Edit
            </Link>
          )}

          {canVoid && (
            <button
              onClick={() => setVoidDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
              Void Invoice
            </button>
          )}
        </div>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Invoice Document Preview Card */}
      <div ref={printRef}>
        <InvoicePrintTemplate invoice={invoice} />
      </div>

      {/* Payment History Timeline (No-Print) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Payment Transactions ({payments.length})
            </h3>
          </div>
          {canPay && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              + Record Payment
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Receipt #</th>
                  <th className="px-4 py-2.5">Payment Date</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Reference / UTR</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800 font-mono">
                      {p.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {p.referenceNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.notes || '-'}</td>
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        invoice={invoice}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setAlert({ type: 'success', message: 'Payment successfully logged.' });
          fetchInvoiceDetails();
        }}
      />

      {/* Void Dialog */}
      <ConfirmDialog
        isOpen={voidDialogOpen}
        title="Void Invoice"
        message={`Are you sure you want to void invoice ${invoice.invoiceNumber}? This action is irreversible and preserves accounting audit trail.`}
        confirmText="Void Invoice"
        isLoading={voidLoading}
        onConfirm={handleVoidConfirm}
        onCancel={() => setVoidDialogOpen(false)}
      />
    </div>
  );
}
