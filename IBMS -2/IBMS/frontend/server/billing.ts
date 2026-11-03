import { randomUUID } from 'node:crypto';
import { calculateInvoiceGst, round } from './gstCalculator.js';
import { numberToIndianRupees } from './numberToWords.js';

export type Data = Record<string, any>;
export type Kind = 'customers' | 'products' | 'invoices' | 'payments';
export type State = Record<Kind, Data[]>;
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function requireValue(test: unknown, message: string, status = 400): asserts test {
  if (!test) throw new HttpError(status, message);
}
const pick = (body: Data, fields: string[]) => Object.fromEntries(fields.filter(k => body[k] !== undefined).map(k => [k, body[k]]));
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const sum = (rows: Data[], key: string) => round(rows.reduce((a, row) => a + Number(row[key] || 0), 0));
export function defaultProfile(user: Data): Data {
  return {
    businessName: text(user.userMetadata?.businessName) || 'My Business',
    legalName: '', email: user.email || '', phone: text(user.userMetadata?.phone),
    gstin: '', pan: '', address: '', city: '', state: 'Maharashtra', postalCode: '',
    country: 'India', currency: 'INR', currencySymbol: '₹', invoicePrefix: 'INV', invoiceNextNumber: 1001,
    defaultPaymentTerms: 'Payment due within 15 days of invoice date.', defaultNotes: 'Thank you for your business!',
    bankDetails: { bankName: '', accountHolder: '', accountNumber: '', ifscCode: '', branch: '', upiId: '' }, logoUrl: '',
  };
}
export function effectiveStatus(invoice: Data): string {
  if (['Draft', 'Voided'].includes(invoice.status)) return invoice.status;
  if (invoice.balanceDue <= 0) return 'Paid';
  if (new Date(invoice.dueDate).getTime() < Date.now()) return 'Overdue';
  return invoice.amountPaid > 0 ? 'Partially Paid' : 'Unpaid';
}
const billed = (state: State) => state.invoices.filter(i => !['Draft', 'Voided'].includes(i.status));
function customerTotals(customer: Data, state: State) {
  const invoices = billed(state).filter(i => i.customer === customer._id);
  return { ...customer, totalInvoiced: sum(invoices, 'grandTotal'), totalPaid: sum(invoices, 'amountPaid'), balanceDue: sum(invoices, 'balanceDue') };
}
export function present(kind: Kind, row: Data, state: State): Data {
  if (kind === 'customers') return customerTotals(row, state);
  if (kind === 'invoices') return {
    ...row, status: effectiveStatus(row),
    customer: state.customers.find(c => c._id === row.customer) || { ...row.customerSnapshot, _id: row.customer },
    amountInWords: numberToIndianRupees(row.grandTotal), balanceInWords: numberToIndianRupees(row.balanceDue),
  };
  if (kind === 'payments') return {
    ...row,
    customer: state.customers.find(c => c._id === row.customer) || null,
    invoice: state.invoices.find(i => i._id === row.invoice) || null,
  };
  return row;
}
function isoDate(value: unknown, label: string) {
  requireValue(typeof value === 'string' && Number.isFinite(new Date(value).getTime()), `${label} must be a valid date.`);
  return new Date(value).toISOString();
}
function nonnegative(value: unknown, label: string, min = 0) {
  requireValue(value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) >= min, `${label} must be at least ${min}.`);
  return Number(value);
}
export function calculate(body: Data, profile: Data, state: State) {
  requireValue(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 200, 'Add between 1 and 200 invoice items.');
  const items = body.items.map((item: Data) => {
    requireValue(text(item.name), 'Each item needs a name.');
    requireValue([0, 5, 12, 18, 28].includes(Number(item.gstRate)), 'Invalid GST rate.');
    const discountType = item.discountType || 'percentage';
    requireValue(['percentage', 'fixed'].includes(discountType), 'Invalid discount type.');
    const discountValue = nonnegative(item.discountValue ?? 0, 'Discount');
    requireValue(discountType !== 'percentage' || discountValue <= 100, 'Percentage discount cannot exceed 100.');
    if (item.product) requireValue(state.products.some(p => p._id === item.product), 'Product not found.', 404);
    return { ...pick(item, ['product', 'name', 'description', 'hsnCode', 'unit', 'gstRate']),
      quantity: nonnegative(item.quantity, 'Quantity', 0.01), unitPrice: nonnegative(item.unitPrice, 'Unit price'), discountType, discountValue };
  });
  const customer = state.customers.find(c => c._id === body.customerId);
  const placeOfSupply = text(body.placeOfSupply) || customer?.state || profile.state;
  requireValue(text(profile.state) && text(placeOfSupply), 'Business state and place of supply are required.');
  const result = calculateInvoiceGst({ businessState: profile.state, placeOfSupply, items });
  requireValue(Number.isFinite(result.grandTotal) && result.grandTotal <= 1e12, 'Invoice total is too large.');
  return { ...result, businessState: profile.state, placeOfSupply, amountInWords: numberToIndianRupees(result.grandTotal) };
}

export function filterRows(kind: Kind, rows: Data[], query: URLSearchParams): Data[] {
  const search = (query.get('search') || '').toLowerCase();
  return rows.filter(row => {
    if (search && ![row.name, row.email, row.phone, row.customerId, row.code, row.gstin, row.invoiceNumber, row.customerSnapshot?.name, row.paymentNumber, row.referenceNumber, row.notes].some(v => String(v || '').toLowerCase().includes(search))) return false;
    const status = query.get('status');
    if (status && status !== 'All' && (kind === 'customers' || kind === 'products' ? row.isActive !== (status === 'active') : effectiveStatus(row) !== status)) return false;
    for (const field of ['state', 'category', 'type', 'paymentMethod']) {
      const value = query.get(field);
      if (value && value !== 'All' && row[field] !== value) return false;
    }
    if (query.get('customerId') && row.customer !== query.get('customerId')) return false;
    if (query.get('invoiceId') && row.invoice !== query.get('invoiceId')) return false;
    const date = row[kind === 'payments' ? 'paymentDate' : 'issueDate'];
    if (date && query.get('startDate') && date.slice(0, 10) < query.get('startDate')!) return false;
    if (date && query.get('endDate') && date.slice(0, 10) > query.get('endDate')!) return false;
    return true;
  });
}

export class Billing {
  public changed = new Map<string, { kind: Kind; data: Data }>();
  public deleted = new Set<string>();
  public profileChanged = false;
  constructor(public state: State, public profile: Data) {}
  find(kind: Kind, id: string): Data {
    const row = this.state[kind].find(r => r._id === id);
    requireValue(row, 'Record not found.', 404);
    return row;
  }
  save(kind: Kind, input: Data, existing?: Data) {
    const now = new Date().toISOString();
    const data = { ...input, _id: existing?._id || randomUUID(), createdAt: existing?.createdAt || now, updatedAt: now };
    const position = this.state[kind].findIndex(r => r._id === data._id);
    if (position < 0) this.state[kind].push(data); else this.state[kind][position] = data;
    this.changed.set(data._id, { kind, data });
    return data;
  }
  remove(kind: Kind, row: Data) {
    this.state[kind] = this.state[kind].filter(r => r._id !== row._id);
    this.changed.delete(row._id);
    this.deleted.add(row._id);
  }
  list(kind: Kind, query: URLSearchParams) {
    let rows = filterRows(kind, this.state[kind], query).map(r => present(kind, r, this.state));
    const sort = query.get('sort') || '';
    const sorts: Record<string, [string, number]> = {
      name_asc: ['name', 1], name_desc: ['name', -1], balance_desc: ['balanceDue', -1], balance_asc: ['balanceDue', 1],
      oldest: ['createdAt', 1], amount_desc: ['grandTotal', -1], amount_asc: ['grandTotal', 1], due_date: ['dueDate', 1],
      price_asc: ['unitPrice', 1], price_desc: ['unitPrice', -1],
    };
    const [field, direction] = sorts[sort] || [kind === 'payments' ? 'paymentDate' : kind === 'invoices' ? 'issueDate' : 'createdAt', -1];
    rows.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * direction);
    const page = Math.max(1, Math.floor(Number(query.get('page')) || 1));
    const limit = Math.max(1, Math.min(1000, Math.floor(Number(query.get('limit')) || 10)));
    const total = rows.length;
    rows = rows.slice((page - 1) * limit, page * limit);
    return { [kind]: rows, total, count: rows.length, totalPages: Math.max(1, Math.ceil(total / limit)), currentPage: page,
      ...(kind === 'products' ? { categories: [...new Set(this.state.products.map(p => p.category))] } : {}) };
  }
  catalog(kind: 'customers' | 'products', body: Data, id?: string) {
    const existing = id ? this.find(kind, id) : undefined;
    const fields = kind === 'customers'
      ? ['customerId', 'name', 'email', 'phone', 'billingAddress', 'city', 'state', 'postalCode', 'gstin', 'pan', 'notes', 'isActive']
      : ['name', 'code', 'hsnCode', 'description', 'type', 'category', 'unitPrice', 'gstRate', 'unit', 'isActive'];
    const defaults = kind === 'customers'
      ? { customerId: `CUST-${randomUUID().slice(0, 8).toUpperCase()}`, name: '', email: '', phone: '', billingAddress: '', city: '', state: '', postalCode: '', gstin: '', pan: '', notes: '', isActive: true }
      : { name: '', code: '', hsnCode: '', description: '', type: 'product', category: 'General', unitPrice: 0, gstRate: 18, unit: 'PCS', isActive: true };
    const data: Data = { ...defaults, ...existing, ...pick(body, fields) };
    for (const key of fields) if (typeof data[key] === 'string') data[key] = data[key].trim();
    requireValue(text(data.name), 'Name is required.');
    requireValue(typeof data.isActive === 'boolean', 'Invalid active status.');
    if (kind === 'customers') {
      requireValue(text(data.state) && text(data.customerId), 'Customer state and ID are required.');
      requireValue(!this.state.customers.some(c => c._id !== id && c.customerId === data.customerId), 'Customer ID already exists.');
      data.email = text(data.email).toLowerCase();
      data.gstin = text(data.gstin).toUpperCase(); data.pan = text(data.pan).toUpperCase();
    } else {
      data.unitPrice = nonnegative(data.unitPrice, 'Unit price');
      data.gstRate = Number(data.gstRate);
      requireValue([0, 5, 12, 18, 28].includes(data.gstRate), 'Invalid GST rate.');
      requireValue(['product', 'service'].includes(data.type), 'Invalid product type.');
    }
    return this.save(kind, data, existing);
  }
  updateProfile(body: Data) {
    const fields = ['businessName', 'legalName', 'email', 'phone', 'gstin', 'pan', 'address', 'city', 'state', 'postalCode', 'country', 'invoicePrefix', 'defaultPaymentTerms', 'defaultNotes', 'logoUrl'];
    const profile = { ...this.profile, ...pick(body, fields) };
    for (const key of fields) { requireValue(typeof profile[key] === 'string', 'Business details must be text.'); profile[key] = profile[key].trim(); }
    requireValue(profile.businessName && profile.state && profile.invoicePrefix, 'Business name, state and invoice prefix are required.');
    if (body.bankDetails) profile.bankDetails = { ...profile.bankDetails, ...pick(body.bankDetails, ['bankName', 'accountHolder', 'accountNumber', 'ifscCode', 'branch', 'upiId']) };
    this.profile = profile; this.profileChanged = true;
    return profile;
  }
  invoice(body: Data, id?: string) {
    const existing = id ? this.find('invoices', id) : undefined;
    requireValue(!existing || (existing.status !== 'Voided' && existing.amountPaid === 0), 'Paid or voided invoices cannot be edited.');
    const customer = this.find('customers', body.customerId || existing?.customer);
    const input: Data = { ...existing, ...body, customerId: customer._id };
    const calculation = calculate(input, this.profile, this.state);
    const issueDate = isoDate(input.issueDate || new Date().toISOString(), 'Issue date');
    const dueDate = isoDate(input.dueDate, 'Due date');
    requireValue(dueDate >= issueDate, 'Due date cannot be before the issue date.');
    requireValue(['Draft', 'Unpaid'].includes(input.status || 'Unpaid'), 'Choose Draft or Unpaid for a new invoice.');
    const invoiceNumber = existing?.invoiceNumber || `${this.profile.invoicePrefix}-${this.profile.invoiceNextNumber++}`;
    if (!existing) this.profileChanged = true;
    return this.save('invoices', {
      ...calculation, invoiceNumber, customer: customer._id, customerSnapshot: { ...customer }, businessSnapshot: { ...this.profile },
      issueDate, dueDate, status: input.status || 'Unpaid', amountPaid: 0, balanceDue: calculation.grandTotal,
      notes: text(input.notes) || this.profile.defaultNotes, terms: text(input.terms) || this.profile.defaultPaymentTerms,
      voidReason: '', voidedAt: null,
    }, existing);
  }
  payment(body: Data) {
    const invoice = this.find('invoices', body.invoiceId);
    requireValue(!['Draft', 'Voided'].includes(invoice.status), 'Payments require an issued invoice.');
    const amount = round(nonnegative(body.amount, 'Payment amount', 0.01));
    requireValue(amount <= invoice.balanceDue, 'Payment cannot exceed the remaining balance.');
    requireValue(['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'].includes(body.paymentMethod), 'Choose a valid payment method.');
    const payment = this.save('payments', { invoice: invoice._id, customer: invoice.customer, amount,
      paymentDate: isoDate(body.paymentDate || new Date().toISOString(), 'Payment date'), paymentMethod: body.paymentMethod,
      referenceNumber: text(body.referenceNumber), notes: text(body.notes), paymentNumber: `PAY-${randomUUID().slice(0, 8).toUpperCase()}` });
    const updated: Data = { ...invoice, amountPaid: round(invoice.amountPaid + amount), balanceDue: round(invoice.balanceDue - amount) };
    updated.status = effectiveStatus(updated);
    this.save('invoices', updated, invoice);
    return payment;
  }
  deleteRecord(kind: Kind, id: string) {
    const row = this.find(kind, id);
    if (kind === 'customers') requireValue(!this.state.invoices.some(i => i.customer === id), 'Customers referenced by invoices cannot be deleted.');
    if (kind === 'products') requireValue(!this.state.invoices.some(i => i.items.some((item: Data) => item.product === id)), 'Products referenced by invoices cannot be deleted.');
    if (kind === 'invoices') requireValue(['Draft', 'Voided'].includes(row.status) && row.amountPaid === 0 && !this.state.payments.some(p => p.invoice === id), 'Only unpaid draft or voided invoices can be deleted.');
    if (kind === 'payments') {
      const invoice = this.find('invoices', row.invoice);
      const updated: Data = { ...invoice, amountPaid: round(invoice.amountPaid - row.amount), balanceDue: round(invoice.balanceDue + row.amount) };
      updated.status = effectiveStatus(updated);
      this.save('invoices', updated, invoice);
    }
    this.remove(kind, row);
    return { message: 'Record deleted.' };
  }
  voidInvoice(id: string, reason: string) {
    const invoice = this.find('invoices', id);
    requireValue(invoice.status !== 'Voided' && invoice.amountPaid === 0, 'Only invoices without payments can be voided.');
    requireValue(text(reason), 'Enter a reason for voiding the invoice.');
    return this.save('invoices', { ...invoice, status: 'Voided', voidReason: text(reason), voidedAt: new Date().toISOString() }, invoice);
  }
}

export function dashboard(state: State, charts = false): Data {
  const invoices = billed(state);
  const statuses = state.invoices.filter(i => i.status !== 'Voided').map(effectiveStatus);
  if (!charts) return { stats: {
    totalInvoices: invoices.length, totalInvoicedAmount: sum(invoices, 'grandTotal'), totalRevenueCollected: sum(state.payments, 'amount'),
    totalOutstandingBalance: sum(invoices, 'balanceDue'), paidInvoices: statuses.filter(s => s === 'Paid').length,
    unpaidInvoices: statuses.filter(s => s === 'Unpaid').length, partiallyPaidInvoices: statuses.filter(s => s === 'Partially Paid').length,
    overdueInvoices: statuses.filter(s => s === 'Overdue').length, draftInvoices: statuses.filter(s => s === 'Draft').length,
    totalCustomers: state.customers.filter(c => c.isActive).length, totalProducts: state.products.filter(p => p.isActive).length,
  } };
  const now = new Date();
  return {
    monthlyTrends: Array.from({ length: 6 }, (_, i) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      const key = date.toISOString().slice(0, 7);
      return { month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        revenue: sum(state.payments.filter(p => p.paymentDate.startsWith(key)), 'amount'), invoiced: sum(invoices.filter(p => p.issueDate.startsWith(key)), 'grandTotal') };
    }),
    statusDistribution: [...new Set(statuses)].map(status => ({ status, count: statuses.filter(s => s === status).length,
      total: sum(state.invoices.filter(i => effectiveStatus(i) === status), 'grandTotal') })),
    recentInvoices: [...state.invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(i => present('invoices', i, state)),
    recentPayments: [...state.payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(p => present('payments', p, state)),
  };
}

export function report(state: State, name: string, query: URLSearchParams): Data {
  const invoices = filterRows('invoices', state.invoices, query);
  const issued = invoices.filter(i => !['Draft', 'Voided'].includes(i.status));
  const payments = filterRows('payments', state.payments, query);
  if (name === 'customers') return { customers: state.customers.map(c => customerTotals(c, state)).sort((a, b) => b.totalInvoiced - a.totalInvoiced) };
  if (name === 'invoices') return { invoices: invoices.map(i => present('invoices', i, state)), summary: {
    count: invoices.length, totalTaxable: sum(invoices, 'taxableSubtotal'), totalCgst: sum(invoices, 'totalCgst'), totalSgst: sum(invoices, 'totalSgst'),
    totalIgst: sum(invoices, 'totalIgst'), totalTax: sum(invoices, 'totalTax'), grandTotal: sum(invoices, 'grandTotal'), totalPaid: sum(invoices, 'amountPaid'), totalBalance: sum(invoices, 'balanceDue'),
  } };
  if (name === 'payments') return { payments: payments.map(p => present('payments', p, state)), summary: {
    count: payments.length, totalCollected: sum(payments, 'amount'), methodBreakdown: Object.fromEntries([...new Set(payments.map(p => p.paymentMethod))].map(m => [m, sum(payments.filter(p => p.paymentMethod === m), 'amount')])) } };
  if (name === 'revenue') {
    const days: Record<string, Data> = {};
    for (const [rows, dateField, valueField, field] of [[issued, 'issueDate', 'grandTotal', 'invoiced'], [payments, 'paymentDate', 'amount', 'collected']] as const) {
      for (const row of rows) { const day = row[dateField].slice(0, 10); days[day] ||= { date: day, invoiced: 0, collected: 0 }; days[day][field] = round(days[day][field] + row[valueField]); }
    }
    return { summary: { totalRevenueCollected: sum(payments, 'amount'), totalInvoicedSales: sum(issued, 'grandTotal'), totalOutstandingInvoiced: sum(issued, 'balanceDue'), totalInvoicesIssued: issued.length, totalPaymentsReceived: payments.length }, breakdown: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)) };
  }
  if (name === 'gst') return { gstSummary: {
    totalTaxable: sum(issued, 'taxableSubtotal'), intraStateTaxable: sum(issued.filter(i => !i.isInterState), 'taxableSubtotal'), interStateTaxable: sum(issued.filter(i => i.isInterState), 'taxableSubtotal'),
    totalCgst: sum(issued, 'totalCgst'), totalSgst: sum(issued, 'totalSgst'), totalIgst: sum(issued, 'totalIgst'), totalGst: sum(issued, 'totalTax'),
  }, rateWise: [0, 5, 12, 18, 28].map(rate => {
    const items = issued.flatMap(i => i.items).filter(i => i.gstRate === rate);
    return { rate, taxable: sum(items, 'taxableAmount'), cgst: sum(items, 'cgstAmount'), sgst: sum(items, 'sgstAmount'), igst: sum(items, 'igstAmount'), totalTax: sum(items, 'totalTaxAmount') };
  }) };
  if (name === 'products') {
    const groups: Record<string, Data> = {};
    for (const item of issued.flatMap(i => i.items)) {
      const key = item.product || item.name;
      groups[key] ||= { name: item.name, quantitySold: 0, totalSales: 0, taxableSales: 0, taxCollected: 0, hsnCode: item.hsnCode, unit: item.unit };
      for (const [out, input] of [['quantitySold', 'quantity'], ['totalSales', 'totalAmount'], ['taxableSales', 'taxableAmount'], ['taxCollected', 'totalTaxAmount']]) groups[key][out] = round(groups[key][out] + item[input]);
    }
    return { productSales: Object.values(groups).sort((a, b) => b.totalSales - a.totalSales) };
  }
  throw new HttpError(404, 'Report not found.');
}
