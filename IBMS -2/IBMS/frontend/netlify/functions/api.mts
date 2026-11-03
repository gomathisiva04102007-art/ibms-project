import { getUser, refreshSession, verifyRequestOrigin, AuthError } from '@netlify/identity';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { workspaces, records } from '../../db/schema.js';
import { Billing, defaultProfile, present, calculate, dashboard, report, HttpError, requireValue, type State, type Kind, type Data } from '../../server/billing.js';

function response(data: Data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?|^\/\.netlify\/functions\/api\/?/, '').split('/').filter(Boolean);
    const [resource, id, action] = path;
    const method = request.method;
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return response({ success: false, message: 'Method not allowed.' }, 405);
    if (method !== 'GET') verifyRequestOrigin(request);
    await refreshSession();
    const identity = await getUser();
    if (!identity) return response({ success: false, message: 'Please sign in to continue.' }, 401);
    let body: Data = {};
    if (['POST', 'PUT'].includes(method)) {
      requireValue((request.headers.get('content-type') || '').includes('application/json'), 'Send JSON request data.', 415);
      const raw = await request.text();
      requireValue(raw.length < 500_000, 'Request is too large.', 413);
      try { body = raw ? JSON.parse(raw) : {}; } catch { throw new HttpError(400, 'Invalid JSON request.'); }
      requireValue(body && typeof body === 'object' && !Array.isArray(body), 'Invalid request data.');
    }
    const userId = identity.id;
    const db = getDb();
    // A workspace row also serializes mutations for this owner. No client-supplied
    // user ID can affect the data scope or the lock.
    await db.insert(workspaces).values({ userId, profile: defaultProfile(identity) }).onConflictDoNothing();
    const result = await db.transaction(async tx => {
      const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.userId, userId)).for('update');
      const stored = await tx.select().from(records).where(eq(records.userId, userId));
      const state: State = { customers: [], products: [], invoices: [], payments: [] };
      for (const row of stored) state[row.kind].push({ ...row.data, _id: row.id, createdAt: row.createdAt.toISOString() });
      const billing = new Billing(state, workspace.profile);
      let data: Data;
      let status = 200;

      if (resource === 'auth' && id === 'me' && method === 'GET' && path.length === 2) {
        data = { user: { _id: userId, name: identity.name || identity.email || 'Business owner', email: identity.email, phone: identity.userMetadata?.phone || '', role: 'user' }, profile: billing.profile };
      } else if (resource === 'business-profile' && path.length === 1 && ['GET', 'PUT'].includes(method)) {
        data = { profile: method === 'PUT' ? billing.updateProfile(body) : billing.profile };
      } else if (resource === 'dashboard' && method === 'GET' && ['stats', 'revenue'].includes(id) && path.length === 2) {
        data = dashboard(state, id === 'revenue');
      } else if (resource === 'reports' && method === 'GET' && path.length === 2) {
        data = report(state, id, url.searchParams);
      } else if (['customers', 'products', 'invoices', 'payments'].includes(resource)) {
        const kind = resource as Kind;
        const singular = { customers: 'customer', products: 'product', invoices: 'invoice', payments: 'payment' }[kind];
        if (kind === 'invoices' && id === 'calculate' && method === 'POST' && path.length === 2) {
          data = { calculation: calculate(body, billing.profile, state) };
        } else if (kind === 'invoices' && id && action === 'void' && method === 'POST' && path.length === 3) {
          data = { invoice: present(kind, billing.voidInvoice(id, body.reason), state) };
        } else if (kind === 'invoices' && id && action === 'payments' && method === 'GET' && path.length === 3) {
          billing.find(kind, id);
          const payments = state.payments.filter(p => p.invoice === id);
          data = { payments, count: payments.length };
        } else if (path.length > 2) throw new HttpError(404, 'API route not found.');
        else if (method === 'GET' && !id) data = billing.list(kind, url.searchParams);
        else if (method === 'GET' && id) {
          const row = billing.find(kind, id);
          data = { [singular]: present(kind, row, state) };
          if (kind === 'invoices') data.payments = state.payments.filter(p => p.invoice === id);
          if (kind === 'customers') {
            data.invoices = state.invoices.filter(i => i.customer === id).map(i => present('invoices', i, state));
            data.payments = state.payments.filter(p => p.customer === id);
          }
        } else if (method === 'DELETE' && id) data = billing.deleteRecord(kind, id);
        else if ((method === 'POST' && !id) || (method === 'PUT' && id)) {
          let row: Data;
          if (kind === 'customers' || kind === 'products') row = billing.catalog(kind, body, id);
          else if (kind === 'invoices') row = billing.invoice(body, id);
          else { requireValue(method === 'POST', 'Payments cannot be edited.', 405); row = billing.payment(body); }
          data = { [singular]: present(kind, row, state) }; status = method === 'POST' ? 201 : 200;
        } else throw new HttpError(405, 'Method not allowed.');
      } else throw new HttpError(404, 'API route not found.');

      for (const { kind, data: row } of billing.changed.values()) {
        await tx.insert(records).values({ id: row._id, userId, kind, data: row }).onConflictDoUpdate({
          target: records.id, set: { data: row }, where: and(eq(records.userId, userId), eq(records.kind, kind)),
        });
      }
      for (const id of billing.deleted) await tx.delete(records).where(and(eq(records.id, id), eq(records.userId, userId)));
      if (billing.profileChanged) await tx.update(workspaces).set({ profile: billing.profile }).where(eq(workspaces.userId, userId));
      return { data: { success: true, ...data }, status };
    });
    return response(result.data, result.status);
  } catch (error) {
    if (error instanceof HttpError) return response({ success: false, message: error.message }, error.status);
    if (error instanceof AuthError) return response({ success: false, message: 'The request could not be authenticated.' }, error.status || 401);
    // Do not expose database details or session material in API responses or logs.
    return response({ success: false, message: 'The billing service is temporarily unavailable. Please try again.' }, 503);
  }
};
