import test from 'node:test';
import assert from 'node:assert/strict';
import { Billing, defaultProfile, dashboard, calculate, present, HttpError, type State } from './billing.ts';

function fixture() {
  const state: State = { customers: [], products: [], invoices: [], payments: [] };
  const billing = new Billing(state, defaultProfile({ email: 'owner@example.test' }));
  const customer = billing.catalog('customers', { name: 'Kaveri Trading', state: 'Maharashtra' });
  const product = billing.catalog('products', { name: 'Installation', type: 'service', unitPrice: 100, gstRate: 18 });
  const input = { customerId: customer._id, issueDate: '2026-01-01', dueDate: '2099-01-15', status: 'Unpaid',
    items: [{ product: product._id, name: product.name, quantity: 2, unitPrice: 100, gstRate: 18, discountType: 'percentage', discountValue: 10 }] };
  return { billing, state, customer, product, input };
}

test('intra-state and inter-state GST totals match their tax split', () => {
  const { billing, state, input } = fixture();
  const intra = calculate(input, billing.profile, state);
  assert.equal(intra.grandTotal, 212.4);
  assert.equal(intra.totalCgst, 16.2);
  assert.equal(intra.totalSgst, 16.2);
  assert.equal(intra.totalIgst, 0);
  const inter = calculate({ ...input, placeOfSupply: 'Karnataka' }, billing.profile, state);
  assert.equal(inter.totalIgst, 32.4);
  assert.equal(inter.totalCgst, 0);
  assert.equal(inter.grandTotal, intra.grandTotal);
});

test('unowned customer or product IDs cannot create invoice references', () => {
  const { billing, input, state } = fixture();
  assert.throws(() => billing.invoice({ ...input, customerId: 'another-owner' }), HttpError);
  assert.throws(() => calculate({ ...input, items: [{ ...input.items[0], product: 'another-owner' }] }, billing.profile, state), HttpError);
  assert.equal(state.invoices.length, 0);
});

test('payment updates balance, refuses overpayment and reverses on deletion', () => {
  const { billing, input, state, customer } = fixture();
  const invoice = billing.invoice(input);
  const payment = billing.payment({ invoiceId: invoice._id, amount: 100, paymentMethod: 'UPI' });
  assert.equal(billing.find('invoices', invoice._id).balanceDue, 112.4);
  assert.equal(present('customers', customer, state).totalPaid, 100);
  assert.throws(() => billing.payment({ invoiceId: invoice._id, amount: 112.41, paymentMethod: 'UPI' }), /exceed/);
  assert.throws(() => billing.voidInvoice(invoice._id, 'Duplicate'), /without payments/);
  billing.deleteRecord('payments', payment._id);
  assert.equal(billing.find('invoices', invoice._id).balanceDue, 212.4);
  assert.equal(billing.find('invoices', invoice._id).status, 'Unpaid');
  assert.equal(present('customers', customer, state).totalPaid, 0);
});

test('drafts do not affect billed totals or accept payments', () => {
  const { billing, input, state } = fixture();
  const invoice = billing.invoice({ ...input, status: 'Draft' });
  assert.equal(dashboard(state).stats.totalInvoicedAmount, 0);
  assert.throws(() => billing.payment({ invoiceId: invoice._id, amount: 1, paymentMethod: 'Cash' }), /issued/);
  billing.deleteRecord('invoices', invoice._id);
  assert.equal(state.invoices.length, 0);
});

test('reference checks and allowlists protect history and financial fields', () => {
  const { billing, input, customer, product } = fixture();
  const invoice = billing.invoice({ ...input, grandTotal: 1, amountPaid: 10000 });
  assert.equal(invoice.grandTotal, 212.4);
  assert.equal(invoice.amountPaid, 0);
  assert.throws(() => billing.deleteRecord('customers', customer._id), /referenced/);
  assert.throws(() => billing.deleteRecord('products', product._id), /referenced/);
  assert.throws(() => billing.deleteRecord('invoices', invoice._id), /draft or voided/);
  billing.updateProfile({ invoiceNextNumber: 1, userId: 'another-owner' });
  assert.equal(billing.profile.invoiceNextNumber, 1002);
});

test('invalid amounts, GST rates and dates are rejected', () => {
  const { billing, input } = fixture();
  for (const changes of [{ quantity: -1 }, { unitPrice: NaN }, { gstRate: 42 }, { discountValue: 101 }]) {
    assert.throws(() => billing.invoice({ ...input, items: [{ ...input.items[0], ...changes }] }), HttpError);
  }
  assert.throws(() => billing.invoice({ ...input, dueDate: 'invalid' }), HttpError);
  assert.throws(() => billing.invoice({ ...input, dueDate: '2025-01-01' }), HttpError);
});

test('fully paid invoices and voided invoices cannot accept another payment', () => {
  const { billing, input, state } = fixture();
  const paid = billing.invoice(input);
  billing.payment({ invoiceId: paid._id, amount: paid.grandTotal, paymentMethod: 'Cash' });
  assert.equal(billing.find('invoices', paid._id).status, 'Paid');
  assert.throws(() => billing.payment({ invoiceId: paid._id, amount: 0.01, paymentMethod: 'Cash' }), /exceed/);
  const voided = billing.invoice(input);
  billing.voidInvoice(voided._id, 'Created twice');
  assert.throws(() => billing.payment({ invoiceId: voided._id, amount: 1, paymentMethod: 'Cash' }), /issued/);
  assert.equal(dashboard(state).stats.totalInvoicedAmount, paid.grandTotal);
});
