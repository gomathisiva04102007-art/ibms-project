import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function InvoicePrintTemplate({ invoice }) {
  if (!invoice) return null;

  const {
    invoiceNumber,
    issueDate,
    dueDate,
    placeOfSupply,
    isInterState,
    customerSnapshot = {},
    businessSnapshot = {},
    items = [],
    subtotal = 0,
    totalDiscount = 0,
    taxableSubtotal = 0,
    totalCgst = 0,
    totalSgst = 0,
    totalIgst = 0,
    totalTax = 0,
    grandTotal = 0,
    amountPaid = 0,
    balanceDue = 0,
    status,
    notes,
    terms,
    amountInWords,
  } = invoice;

  return (
    <div className="bg-white p-8 md:p-12 text-slate-900 font-sans max-w-4xl mx-auto border border-slate-200 shadow-lg print-container rounded-lg">
      {/* Header Banner */}
      <div className="border-b-2 border-slate-800 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-2.5 py-1 rounded">
              TAX INVOICE
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {businessSnapshot.businessName || 'Business Name'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-sm leading-relaxed">
              {businessSnapshot.address && `${businessSnapshot.address}, `}
              {businessSnapshot.city && `${businessSnapshot.city}, `}
              {businessSnapshot.state && `${businessSnapshot.state} `}
              {businessSnapshot.postalCode && `- ${businessSnapshot.postalCode}`}
            </p>
            <div className="text-xs text-slate-700 font-medium mt-2 space-y-0.5">
              {businessSnapshot.gstin && <p><span className="font-bold">GSTIN:</span> {businessSnapshot.gstin}</p>}
              {businessSnapshot.pan && <p><span className="font-bold">PAN:</span> {businessSnapshot.pan}</p>}
              {businessSnapshot.email && <p><span className="font-bold">Email:</span> {businessSnapshot.email}</p>}
              {businessSnapshot.phone && <p><span className="font-bold">Phone:</span> {businessSnapshot.phone}</p>}
            </div>
          </div>

          <div className="text-left sm:text-right sm:self-start">
            <div className="inline-block sm:text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</span>
              <p className="text-xl font-black text-primary-700 tracking-tight font-mono">{invoiceNumber}</p>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <p><span className="text-slate-500">Invoice Date:</span> <span className="font-semibold">{formatDate(issueDate)}</span></p>
              <p><span className="text-slate-500">Payment Due:</span> <span className="font-semibold text-slate-800">{formatDate(dueDate)}</span></p>
              <p><span className="text-slate-500">Place of Supply:</span> <span className="font-semibold text-slate-800">{placeOfSupply}</span></p>
              <p>
                <span className="text-slate-500">Supply Type:</span>{' '}
                <span className="font-bold text-primary-700">
                  {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Billed To (Customer):
          </span>
          <p className="text-sm font-bold text-slate-900">{customerSnapshot.name || 'Customer'}</p>
          <p className="text-slate-600 mt-0.5">
            {customerSnapshot.billingAddress && `${customerSnapshot.billingAddress}, `}
            {customerSnapshot.city && `${customerSnapshot.city}, `}
            {customerSnapshot.state && `${customerSnapshot.state} `}
            {customerSnapshot.postalCode && `- ${customerSnapshot.postalCode}`}
          </p>
          <div className="mt-2 space-y-0.5 font-medium text-slate-700">
            {customerSnapshot.gstin ? (
              <p><span className="font-bold">GSTIN:</span> {customerSnapshot.gstin}</p>
            ) : (
              <p className="text-slate-400">GSTIN: Unregistered Consumer</p>
            )}
            {customerSnapshot.phone && <p><span className="font-bold">Phone:</span> {customerSnapshot.phone}</p>}
            {customerSnapshot.email && <p><span className="font-bold">Email:</span> {customerSnapshot.email}</p>}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tax & Compliance Summary:
          </span>
          <div className="space-y-1.5 text-slate-700">
            <p><span className="font-semibold">Supplier State:</span> {businessSnapshot.state || 'Maharashtra'}</p>
            <p><span className="font-semibold">Customer State:</span> {customerSnapshot.state || placeOfSupply}</p>
            <p>
              <span className="font-semibold">Reverse Charge Applicable:</span> No
            </p>
            <p className="pt-1">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border" style={{
                backgroundColor: status === 'Paid' ? '#ecfdf5' : '#fffbeb',
                color: status === 'Paid' ? '#047857' : '#b45309',
                borderColor: status === 'Paid' ? '#a7f3d0' : '#fde68a'
              }}>
                Invoice Status: {status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-2.5 border-r border-slate-200 text-center w-8">#</th>
              <th className="p-2.5 border-r border-slate-200">Description of Goods / Services</th>
              <th className="p-2.5 border-r border-slate-200 text-center">HSN/SAC</th>
              <th className="p-2.5 border-r border-slate-200 text-center">Qty</th>
              <th className="p-2.5 border-r border-slate-200 text-right">Unit Rate</th>
              <th className="p-2.5 border-r border-slate-200 text-right">Disc</th>
              <th className="p-2.5 border-r border-slate-200 text-right">Taxable Value</th>
              {isInterState ? (
                <th className="p-2.5 border-r border-slate-200 text-right">IGST</th>
              ) : (
                <>
                  <th className="p-2.5 border-r border-slate-200 text-right">CGST</th>
                  <th className="p-2.5 border-r border-slate-200 text-right">SGST</th>
                </>
              )}
              <th className="p-2.5 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="p-2.5 text-center font-medium border-r border-slate-200 text-slate-500">
                  {index + 1}
                </td>
                <td className="p-2.5 border-r border-slate-200">
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  {item.description && (
                    <span className="text-[11px] text-slate-500">{item.description}</span>
                  )}
                </td>
                <td className="p-2.5 text-center font-mono text-[11px] border-r border-slate-200 text-slate-600">
                  {item.hsnCode || '-'}
                </td>
                <td className="p-2.5 text-center font-semibold border-r border-slate-200">
                  {item.quantity} {item.unit}
                </td>
                <td className="p-2.5 text-right font-medium border-r border-slate-200">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="p-2.5 text-right text-slate-500 border-r border-slate-200">
                  {item.discountAmount > 0 ? formatCurrency(item.discountAmount) : '-'}
                </td>
                <td className="p-2.5 text-right font-semibold border-r border-slate-200">
                  {formatCurrency(item.taxableAmount)}
                </td>
                {isInterState ? (
                  <td className="p-2.5 text-right border-r border-slate-200">
                    <span className="text-[11px] text-slate-500 block">({item.igstRate}%)</span>
                    <span className="font-medium">{formatCurrency(item.igstAmount)}</span>
                  </td>
                ) : (
                  <>
                    <td className="p-2.5 text-right border-r border-slate-200">
                      <span className="text-[11px] text-slate-500 block">({item.cgstRate}%)</span>
                      <span className="font-medium">{formatCurrency(item.cgstAmount)}</span>
                    </td>
                    <td className="p-2.5 text-right border-r border-slate-200">
                      <span className="text-[11px] text-slate-500 block">({item.sgstRate}%)</span>
                      <span className="font-medium">{formatCurrency(item.sgstAmount)}</span>
                    </td>
                  </>
                )}
                <td className="p-2.5 text-right font-bold text-slate-900">
                  {formatCurrency(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations & Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Box: Amount in words & Bank Details */}
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Invoice Total in Words:</span>
            <p className="font-semibold text-primary-900 italic leading-relaxed">
              {amountInWords || 'Indian Rupees Only'}
            </p>
          </div>

          {businessSnapshot.bankDetails?.bankName && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                Bank Payment Details for NEFT / RTGS / UPI:
              </span>
              <div className="space-y-0.5 text-slate-700">
                <p><span className="font-semibold">Bank Name:</span> {businessSnapshot.bankDetails.bankName}</p>
                {businessSnapshot.bankDetails.accountHolder && (
                  <p><span className="font-semibold">Account Holder:</span> {businessSnapshot.bankDetails.accountHolder}</p>
                )}
                <p><span className="font-semibold">Account Number:</span> <span className="font-mono">{businessSnapshot.bankDetails.accountNumber}</span></p>
                <p><span className="font-semibold">IFSC Code:</span> <span className="font-mono">{businessSnapshot.bankDetails.ifscCode}</span></p>
                {businessSnapshot.bankDetails.branch && (
                  <p><span className="font-semibold">Branch:</span> {businessSnapshot.bankDetails.branch}</p>
                )}
                {businessSnapshot.bankDetails.upiId && (
                  <p><span className="font-semibold">UPI ID:</span> <span className="font-mono text-primary-700 font-bold">{businessSnapshot.bankDetails.upiId}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Box: Math Table */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Item Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Discount:</span>
              <span className="font-medium">- {formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200 font-semibold">
            <span>Taxable Turnover:</span>
            <span>{formatCurrency(taxableSubtotal)}</span>
          </div>

          {/* GST breakdown */}
          {isInterState ? (
            <div className="flex justify-between text-slate-600">
              <span>Integrated GST (IGST):</span>
              <span className="font-medium">{formatCurrency(totalIgst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST):</span>
                <span className="font-medium">{formatCurrency(totalCgst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST):</span>
                <span className="font-medium">{formatCurrency(totalSgst)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
            <span>Total GST Tax:</span>
            <span>{formatCurrency(totalTax)}</span>
          </div>

          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-300">
            <span>Grand Total (INR):</span>
            <span className="text-primary-700">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="flex justify-between text-xs text-emerald-700 pt-1 font-semibold">
            <span>Amount Paid:</span>
            <span>{formatCurrency(amountPaid)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-amber-700 pt-1 border-t border-slate-200">
            <span>Balance Due:</span>
            <span>{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes & Signatory Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
        <div>
          {terms && (
            <div className="mb-3">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1">
                Terms & Conditions:
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{terms}</p>
            </div>
          )}
          {notes && (
            <div>
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-1">
                Customer Notes:
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end items-end sm:text-right pt-6 sm:pt-0">
          <p className="text-xs font-bold text-slate-800">
            For {businessSnapshot.businessName || 'Apex Invoicing'}
          </p>
          <div className="h-16 w-40 border-b border-dashed border-slate-400 mt-2 mb-1 flex items-end justify-center">
            <span className="text-[10px] text-slate-400 font-mono italic">Authorized Signature</span>
          </div>
          <span className="text-[10px] text-slate-500">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
}
