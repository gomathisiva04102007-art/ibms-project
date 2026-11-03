const assert = require('assert');
const http = require('http');
require('dotenv').config({ path: __dirname + '/../.env' });
const { app } = require('../server');

const PORT = 5055;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(`RUNNING FULL BACKEND REST API TEST SUITE`);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;

    const test = async (name, fn) => {
      try {
        await fn();
        console.log(`  ✓ [PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
        failed++;
      }
    };

    try {
      // 1. Health check
      await test('Health check endpoint /api/health returns 200 and healthy status', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/health',
          method: 'GET',
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'healthy');
      });

      // 2. Login with seeded user
      let authToken = '';
      await test('Login with seeded user (demo@example.com) returns JWT token', async () => {
        const res = await makeRequest(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
          { email: 'demo@example.com', password: 'Password123!' }
        );
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.token);
        assert.strictEqual(res.body.user.email, 'demo@example.com');
        authToken = res.body.token;
      });

      // 3. Auth protected route /api/auth/me
      await test('GET /api/auth/me returns current user profile when authenticated', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/auth/me',
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.user.email, 'demo@example.com');
      });

      // 4. Reject unauthenticated access
      await test('Protected routes reject requests without Bearer token with 401', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/customers',
          method: 'GET',
        });
        assert.strictEqual(res.status, 401);
      });

      // 5. Customer list
      let customerId = '';
      let customerState = '';
      await test('GET /api/customers returns customer list for authenticated user', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/customers',
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body.customers));
        assert.ok(res.body.customers.length > 0);
        customerId = res.body.customers[0]._id;
        customerState = res.body.customers[0].state;
      });

      // 6. Products list
      let productId = '';
      let productPrice = 0;
      await test('GET /api/products returns product list', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/products',
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body.products));
        assert.ok(res.body.products.length > 0);
        productId = res.body.products[0]._id;
        productPrice = res.body.products[0].unitPrice;
      });

      // 7. Invoices list & details
      let testInvoiceId = '';
      await test('GET /api/invoices returns invoices with status calculation', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/invoices',
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.body.invoices));
        assert.ok(res.body.invoices.length >= 4);
        testInvoiceId = res.body.invoices.find((i) => i.status === 'Unpaid')?._id || res.body.invoices[0]._id;
      });

      // 8. Server-side GST calculation preview
      await test('POST /api/invoices/calculate computes intra/inter state GST accurately', async () => {
        const res = await makeRequest(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/invoices/calculate',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          },
          {
            placeOfSupply: 'Maharashtra', // intra-state supply for Maharashtra supplier
            items: [
              {
                name: 'Test Consult',
                quantity: 2,
                unitPrice: 1000,
                discountType: 'percentage',
                discountValue: 10, // 10% off of 2000 = 200 -> taxable = 1800
                gstRate: 18,
              },
            ],
          }
        );
        assert.strictEqual(res.status, 200);
        const calc = res.body.calculation;
        assert.strictEqual(calc.isInterState, false);
        assert.strictEqual(calc.subtotal, 2000);
        assert.strictEqual(calc.totalDiscount, 200);
        assert.strictEqual(calc.taxableSubtotal, 1800);
        assert.strictEqual(calc.totalCgst, 162); // 9% of 1800
        assert.strictEqual(calc.totalSgst, 162); // 9% of 1800
        assert.strictEqual(calc.totalIgst, 0);
        assert.strictEqual(calc.grandTotal, 2124);
      });

      // 9. Payment overpayment rejection
      await test('POST /api/payments rejects overpayment exceeding invoice balance', async () => {
        const res = await makeRequest(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/payments',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
          },
          {
            invoiceId: testInvoiceId,
            amount: 99999999, // intentionally way above invoice balance
            paymentMethod: 'Bank Transfer',
          }
        );
        assert.strictEqual(res.status, 400);
        assert.ok(res.body.message.includes('exceeds outstanding balance'));
      });

      // 10. Dashboard stats
      await test('GET /api/dashboard/stats returns live aggregated metrics', async () => {
        const res = await makeRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: '/api/dashboard/stats',
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.stats);
        assert.ok(res.body.stats.totalInvoicedAmount > 0);
        assert.ok(res.body.stats.totalRevenueCollected > 0);
        assert.ok(res.body.stats.totalCustomers > 0);
      });

      // 11. Reports endpoints
      await test('GET /api/reports/revenue and /api/reports/gst return financial analytics', async () => {
        const [resRev, resGst] = await Promise.all([
          makeRequest({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/reports/revenue',
            method: 'GET',
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          makeRequest({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/reports/gst',
            method: 'GET',
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);
        assert.strictEqual(resRev.status, 200);
        assert.strictEqual(resGst.status, 200);
        assert.ok(resRev.body.summary);
        assert.ok(resGst.body.gstSummary);
      });

      console.log(`\n========================================`);
      console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log(`========================================\n`);

      server.close();
      process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Test suite error:', e);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
