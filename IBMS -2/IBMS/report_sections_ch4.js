const { p, pMulti, h1, h2, h3, bullet, codeBox, createTable } = require('./report_helpers');
const { AlignmentType } = require('docx');

const getChapter4 = () => {
  const elements = [];

  // =========================================================================
  // CHAPTER 4 – IMPLEMENTATION
  // =========================================================================
  elements.push(
    h1('CHAPTER 4\nIMPLEMENTATION', true),

    h2('4.1 Technology Stack Details'),
    p(
      'The Billing and Invoice Management System (IBMS) is implemented using the full-stack MERN paradigm (MongoDB, Express.js, React.js, and Node.js), augmented with contemporary frontend libraries and robust backend architectural middleware. The software development follows a decoupled client-server architecture, communicating exclusively over asynchronous JSON-based RESTful application programming interfaces (APIs).',
      { before: 100, after: 120 }
    ),
    p(
      'The selection of tools, runtime environments, and external libraries was driven by requirements for rapid execution throughput, high developer ergonomics, strict data integrity guarantees, and seamless deployment across cloud container platforms. Table 4.1 summarizes the foundational technology stack components, their specific versions, and their operational responsibilities within the system.',
      { before: 120, after: 100 }
    ),
    p('Table 4.1: Summary of MERN Technology Stack Libraries and Tools', { bold: true, alignment: AlignmentType.CENTER, before: 60, after: 60 }),
    createTable(
      ['LAYER / COMPONENT', 'TECHNOLOGY & VERSION', 'ROLE AND OPERATIONAL RESPONSIBILITY'],
      [
        ['Client Framework', 'React.js (v19.0.0)', 'Declarative user interface development, functional component architecture, state hooks (useState, useEffect, useMemo), and dynamic DOM reconciliation.'],
        ['Frontend Build Tool', 'Vite (v6.2.0)', 'Next-generation frontend tooling providing native ES modules, instant server startup, and lightning-fast Hot Module Replacement (HMR).'],
        ['CSS Framework', 'Tailwind CSS (v3.4.17)', 'Utility-first stylesheet framework enabling responsive, accessible, and consistent financial dashboard aesthetics with minimal CSS bundle footprint.'],
        ['Client Routing', 'React Router DOM (v7.2.0)', 'Client-side declarative routing, protected route guards, and URL parameter management without page reloads.'],
        ['HTTP Client', 'Axios (v1.7.9)', 'Promise-based HTTP client featuring automated request interception for JWT Bearer tokens and centralized HTTP error handling.'],
        ['Data Visualization', 'Recharts (v2.15.1)', 'Composable SVG charting library used for rendering monthly revenue trends, payment status distributions, and financial analytics.'],
        ['Icons Suite', 'Lucide React (v1.16.0)', 'Clean, accessible, and lightweight SVG icon set for navigation, financial status indicators, and operational action buttons.'],
        ['PDF & Printing', 'jsPDF & html2canvas', 'Client-side vector and raster generation for downloading authentic A4 Indian Tax Invoices and thermal POS receipts.'],
        ['Server Runtime', 'Node.js (v24.15.0 LTS)', 'High-performance, event-driven, non-blocking asynchronous I/O JavaScript runtime executing backend business logic.'],
        ['API Framework', 'Express.js (v4.21.2)', 'Minimalist web server framework providing REST route dispatching, middleware pipeline chaining, and JSON payload serialization.'],
        ['Database Engine', 'MongoDB Community (v8.0)', 'Distributed, document-oriented NoSQL database storing structured BSON collections with atomic single-document guarantees.'],
        ['Object Data Modeling', 'Mongoose (v8.10.1)', 'Schema-based data modeling layer providing strong type casting, pre/post middleware hooks, and validation constraints.'],
        ['Authentication Security', 'JSON Web Token (v9.0.2)', 'Cryptographic stateless Bearer token generation (HMAC SHA-256) for secure user session management.'],
        ['Password Hashing', 'bcryptjs (v3.0.2)', 'Adaptive one-way cryptographic hashing algorithm utilizing salt rounds to protect stored user credentials against brute-force attacks.'],
      ],
      [22, 24, 54]
    ),

    h3('4.1.1 Frontend Architecture and State Management'),
    p(
      'The client application is organized into a modular hierarchy comprising pages, reusable components, context providers, and utility services. Global authentication state is managed via React Context API (AuthContext), which encapsulates the logged-in user profile, JWT persistence in localStorage, automatic token expiry detection, and authorization redirection. Components communicate with backend services through configured Axios API modules that automatically append the Authorization: Bearer <token> header to all outgoing requests. UI reactivity is achieved using local state hooks for modal dialogues, tabular pagination, real-time GST tax previews, and interactive filter controls.',
      { before: 80, after: 120 }
    ),

    h3('4.1.2 Backend Architecture and Middleware Pipeline'),
    p(
      'The server architecture adheres to the Model-Controller-Route design pattern. Incoming HTTP requests pass through a sequential Express middleware pipeline that handles CORS policy validation, JSON body parsing, URL-encoded parameter decoding, and route dispatching. Protected routes are intercepted by custom authMiddleware, which decodes the incoming JWT, validates signature authenticity, and injects the authenticated User document into req.user. Centralized error-handling middleware intercepts uncaught runtime exceptions and operational Mongoose validation errors, responding with standardized JSON envelopes { success: false, message: ... } to prevent server crashes and information leakage.',
      { before: 80, after: 160 }
    ),

    h2('4.2 Functional Module Description'),
    p(
      'The system comprises eight core functional modules engineered to automate end-to-end billing and financial management workflows:',
      { before: 100, after: 100 }
    ),

    h3('4.2.1 Authentication & Multi-Tenant Scoping Module'),
    p(
      'The Authentication module guarantees that every commercial enterprise operates within an isolated data silo. User registration captures the full name, corporate email address, contact phone number, initial business name, and password. The password is cryptographically salted and hashed using bcrypt with 10 salt rounds prior to persistence. Upon login, the system validates the email and password hash, issuing a signed JWT containing the user ID with a 7-day expiration lifespan. Every subsequent database query executed by the backend automatically scopes records by user ID ({ user: req.user._id }), ensuring complete multi-tenant tenant isolation and preventing unauthorized cross-tenant data access.',
      { before: 80, after: 120 }
    ),

    h3('4.2.2 Customer Management Module'),
    p(
      'The Customer Management module maintains client profiles, capturing corporate or individual names, email, telephone, billing address, postal code, state, and optional 15-character GSTIN. The system automatically computes and updates real-time financial balances for each customer: totalInvoiced, totalPaid, and current balanceDue. Customers can be searched via live regex filters, sorted by name or balance, and viewed through a paginated list. To uphold statutory auditing compliance, the system enforces a referential safeguard: a customer record cannot be permanently deleted if historical invoices exist in the database, preventing orphaned billing ledgers.',
      { before: 80, after: 120 }
    ),

    h3('4.2.3 Product & Service Catalog Module'),
    p(
      'The Product Catalog module enables enterprises to register sellable physical goods and professional services. Each item record stores a unique Stock Keeping Unit (SKU), descriptive title, HSN or SAC code, unit of measurement (such as PCS, HRS, BOX, or KG), standard unit selling price, and applicable statutory GST rate slab (0%, 5%, 12%, 18%, or 28%). Validation rules ensure unit prices are non-negative. During invoice creation, selecting a product dynamically pre-fills its description, HSN code, unit price, and GST rate into the active line item while permitting contextual overrides for custom commercial discounts or bulk pricing.',
      { before: 80, after: 120 }
    ),

    h3('4.2.4 Dynamic Indian GST Calculation Engine'),
    p(
      'The GST Calculation Engine enforces Indian Goods and Services Tax statutory logic. Taxes are categorized into Intra-State supplies (where the supplier business state matches the place of supply) and Inter-State supplies (where the supplier and recipient reside in different states). For Intra-State transactions, the statutory tax rate is evenly bifurcated into Central GST (CGST) and State GST (SGST). For Inter-State transactions, the entire tax percentage is levied under Integrated GST (IGST). Line item taxes are computed strictly against the net taxable turnover after deducting trade discounts (percentage or fixed amount), with every computation rounded to two decimal places. Table 4.2 outlines the statutory tax slabs supported by the engine.',
      { before: 80, after: 100 }
    ),
    p('Table 4.2: Indian Statutory GST Tax Rates and Applicable Categories', { bold: true, alignment: AlignmentType.CENTER, before: 60, after: 60 }),
    createTable(
      ['GST SLAB', 'CGST SPLIT', 'SGST SPLIT', 'IGST RATE', 'TYPICAL COMMERCIAL CATEGORY EXAMPLES'],
      [
        ['0% (Nil / Exempt)', '0.0%', '0.0%', '0.0%', 'Unprocessed agricultural produce, fresh milk, grains, educational books, healthcare services.'],
        ['5% (Concessional)', '2.5%', '2.5%', '5.0%', 'Packaged essential food staples, medicines, domestic air travel, renewable energy devices.'],
        ['12% (Standard I)', '6.0%', '6.0%', '12.0%', 'Processed food products, business class air tickets, computer hardware components, diagnostic kits.'],
        ['18% (Standard II)', '9.0%', '9.0%', '18.0%', 'Software development services, IT consulting, capital machinery, telecommunication, financial services.'],
        ['28% (Peak / Luxury)', '14.0%', '14.0%', '28.0%', 'Motor automobiles, luxury items, tobacco, high-end entertainment, air conditioners, refrigerants.'],
      ],
      [18, 14, 14, 14, 40]
    ),

    h3('4.2.5 Invoice Generation & Sequential Numbering Module'),
    p(
      'The Invoice Generation module automates the authoring, validation, and lifecycle management of billing documents. When a new invoice is requested, the system automatically fetches the user\'s configured prefix (e.g. INV) and current fiscal year, programmatically incrementing the highest recorded sequential counter to produce gapless, collision-free identifiers (e.g. INV-2026-1001). To guarantee historical ledger immutability, customer billing details, company GSTIN, and product line snapshots are serialized directly into the invoice document. Invoices transition through a structured lifecycle: Draft -> Unpaid -> Partially Paid -> Paid -> Overdue. Invoices may also be voided with a mandatory audit reason, provided no payments have been accepted.',
      { before: 80, after: 120 }
    ),

    h3('4.2.6 Payment Tracking & Overpayment Prevention Engine'),
    p(
      'The Payment Engine records receipts against issued invoices via Cash, UPI, Bank Transfer (NEFT/RTGS/IMPS), Credit/Debit Card, or Cheque. Each receipt generates an atomic payment number (e.g. PAY-1001). To prevent negative accounting balances, the engine enforces an overpayment guard: any payment amount exceeding the outstanding balance due (balanceDue) is rejected with an HTTP 400 Bad Request error. When a valid payment is accepted, the invoice amountPaid and balanceDue are updated, customer ledgers are synchronized, and the invoice status is dynamically transitioned to Partially Paid or Paid. If an erroneous payment is subsequently deleted, balances are safely reversed and status is restored.',
      { before: 80, after: 120 }
    ),

    h3('4.2.7 Reports & Analytics Module'),
    p(
      'The Reports module generates six specialized financial analysis reports: Revenue Analysis, Invoices Summary, Payment Ledger, GST Tax Breakdown, Customer Receivables, and Product Performance. Users can apply flexible date-range filters (This Month, Last Month, This Quarter, This Year, or Custom). Each report provides real-time mathematical aggregations alongside a one-click CSV export utility that dynamically formats records with appropriate MIME types and triggers browser downloads for immediate offline audit in Microsoft Excel or spreadsheet software.',
      { before: 80, after: 120 }
    ),

    h3('4.2.8 Business Profile & Tax Settings Module'),
    p(
      'The Business Profile module stores company-wide legal identification and tax registration data. Users configure their registered business trade name, 15-character GSTIN, 10-character Permanent Account Number (PAN), corporate address, contact email and phone, official banking coordinates (Account Number, Bank Name, Branch, IFSC Code) for client remittances, UPI VPA identifier, invoice numbering prefix, and standard payment terms. This metadata is automatically injected into all generated tax invoices and PDF printouts.',
      { before: 80, after: 160 }
    ),

    h2('4.3 Key Algorithms and Mathematical Formulations'),
    p(
      'The integrity and legal validity of IBMS rely on four fundamental algorithms and mathematical formulas engineered into the backend services.',
      { before: 100, after: 100 }
    ),

    h3('4.3.1 Algorithm 1: Dynamic Indian GST Tax Split'),
    p(
      'The Indian GST tax split algorithm decides whether a commercial supply attracts split CGST/SGST or unified IGST, computes line discounts, and aggregates taxable amounts. Fig. 4.1 depicts the decision flowchart.',
      { before: 80, after: 80 }
    ),
    p('Fig. 4.1: Flowchart of Indian GST Intra-State vs Inter-State Decision Logic', { bold: true, alignment: AlignmentType.CENTER, before: 60, after: 60 }),
    codeBox([
      '                  +--------------------------------------+',
      '                  | Read Business State & Place of Supply|',
      '                  +--------------------------------------+',
      '                                     |',
      '                                     v',
      '                 +----------------------------------------+',
      '                 | Normalize States: trim, lowercase,     |',
      '                 | remove whitespace and special symbols  |',
      '                 +----------------------------------------+',
      '                                     |',
      '                                     v',
      '                       /--------------------------\\',
      '                      /   Normalized Business State ==  \\',
      '                     <    Normalized Place of Supply?    >',
      '                      \\                                 /',
      '                       \\-------------------------------/',
      '                                 /           \\',
      '                           YES  /             \\  NO',
      '                               v               v',
      '                +-----------------------+   +-----------------------+',
      '                | Intra-State Supply     |   | Inter-State Supply    |',
      '                |-----------------------|   |-----------------------|',
      '                | CGST Rate = Rate / 2  |   | IGST Rate = Rate      |',
      '                | SGST Rate = Rate / 2  |   | CGST Rate = 0         |',
      '                | IGST Rate = 0         |   | SGST Rate = 0         |',
      '                +-----------------------+   +-----------------------+',
      '                                \\             /',
      '                                 \\           /',
      '                                  v         v',
      '                 +----------------------------------------+',
      '                 | Calculate Line Item Net Taxable:       |',
      '                 | ItemTotal = Quantity * UnitPrice       |',
      '                 | Taxable = ItemTotal - DiscountAmount   |',
      '                 | LineTax = (Taxable * EffectiveRate)/100|',
      '                 | Total = Taxable + LineTax              |',
      '                 +----------------------------------------+',
      '                                     |',
      '                                     v',
      '                 +----------------------------------------+',
      '                 | Round each figure to 2 decimal places: |',
      '                 | round(num) = round((num + EPSILON)*100)|',
      '                 |              / 100                     |',
      '                 +----------------------------------------+',
    ]),
    p(
      'The mathematical formulations for line item computations are derived as follows:',
      { before: 100, after: 80 }
    ),
    p(
      '1. Gross Line Total: TRaw = Qty * PUnit',
      { bold: true, alignment: AlignmentType.LEFT, before: 40, after: 40 }
    ),
    p(
      '2. Discount Computation:\n   - If Percentage Discount: DAmount = round( (TRaw * min(DVal, 100)) / 100 )\n   - If Fixed Amount Discount: DAmount = round( min(DVal, TRaw) )',
      { bold: true, alignment: AlignmentType.LEFT, before: 40, after: 40 }
    ),
    p(
      '3. Net Taxable Turnover: TTaxable = max(0, TRaw - DAmount)',
      { bold: true, alignment: AlignmentType.LEFT, before: 40, after: 40 }
    ),
    p(
      '4. Statutory Tax Apportionment:\n   - For Intra-State Supply (StateBiz = StateSupply):\n       CGSTAmount = round( (TTaxable * (RGST / 2)) / 100 )\n       SGSTAmount = round( (TTaxable * (RGST / 2)) / 100 )\n       IGSTAmount = 0\n   - For Inter-State Supply (StateBiz ≠ StateSupply):\n       CGSTAmount = 0\n       SGSTAmount = 0\n       IGSTAmount = round( (TTaxable * RGST) / 100 )',
      { bold: true, alignment: AlignmentType.LEFT, before: 40, after: 40 }
    ),
    p(
      '5. Grand Total Formulation: GrandTotal = Σ TTaxable + Σ CGSTAmount + Σ SGSTAmount + Σ IGSTAmount',
      { bold: true, alignment: AlignmentType.LEFT, before: 40, after: 120 }
    ),

    h3('4.3.2 Algorithm 2: Atomic Sequential Invoice Numbering'),
    p(
      'Statutory invoicing rules require continuous, gapless sequential numbering per fiscal year. In concurrent multi-user environments, race conditions can cause duplicate invoice numbers. Algorithm 2 resolves this through an atomic inspection and collision-resolution loop.',
      { before: 80, after: 100 }
    ),
    codeBox([
      'Algorithm 2: Atomic Sequential Invoice Number Generation',
      'Input:  userId (ObjectId)',
      'Output: invoiceNumber (String, e.g. "INV-2026-1001")',
      '------------------------------------------------------------------',
      '1: currentYear <- GetCurrentCalendarYear()',
      '2: profile <- BusinessProfile.FindOne({ user: userId })',
      '3: prefix <- profile.invoicePrefix IF profile.invoicePrefix EXISTS ELSE "INV"',
      '4: lastInvoice <- Invoice.FindOne({ user: userId })',
      '                          .SortBy({ createdAt: -1 })',
      '                          .SelectFields("invoiceNumber")',
      '5: nextSequence <- 1001',
      '6: IF lastInvoice IS NOT NULL AND lastInvoice.invoiceNumber IS NOT NULL THEN',
      '7:     parts <- SplitString(lastInvoice.invoiceNumber, "-")',
      '8:     lastSeq <- ParseInteger(parts[Length(parts) - 1])',
      '9:     IF IsValidNumber(lastSeq) THEN',
      '10:        nextSequence <- lastSeq + 1',
      '11:    END IF',
      '12: END IF',
      '13: candidateNumber <- Concatenate(prefix, "-", currentYear, "-", nextSequence)',
      '14: exists <- Invoice.FindOne({ user: userId, invoiceNumber: candidateNumber })',
      '15: WHILE exists IS NOT NULL DO',
      '16:     nextSequence <- nextSequence + 1',
      '17:     candidateNumber <- Concatenate(prefix, "-", currentYear, "-", nextSequence)',
      '18:     exists <- Invoice.FindOne({ user: userId, invoiceNumber: candidateNumber })',
      '19: END WHILE',
      '20: RETURN candidateNumber',
    ]),
    p(
      'This algorithm guarantees that even if concurrent requests initiate invoice generation simultaneously, each candidate number is actively verified against the database index before assignment, completely eliminating duplicate invoice key violations.',
      { before: 100, after: 120 }
    ),

    h3('4.3.3 Algorithm 3: Overpayment Validation and Reconciliation'),
    p(
      'To prevent accounting discrepancies such as negative balances due or overpayments, Algorithm 3 enforces strict validation upon every payment transaction.',
      { before: 80, after: 100 }
    ),
    codeBox([
      'Algorithm 3: Payment Verification and Ledger Reconciliation',
      'Input:  userId, invoiceId, paymentAmount, paymentMethod, referenceNumber',
      'Output: Payment Receipt and Updated Invoice Status',
      '------------------------------------------------------------------',
      '1: payAmount <- RoundToTwoDecimals(paymentAmount)',
      '2: IF payAmount <= 0 THEN',
      '3:     THROW ERROR "Payment amount must be greater than zero."',
      '4: END IF',
      '5: invoice <- Invoice.FindOne({ _id: invoiceId, user: userId })',
      '6: IF invoice IS NULL THEN THROW ERROR "Invoice not found."',
      '7: IF invoice.status == "Draft" THEN THROW ERROR "Cannot pay Draft invoice."',
      '8: IF invoice.status == "Voided" THEN THROW ERROR "Cannot pay Voided invoice."',
      '9: IF invoice.balanceDue <= 0 OR invoice.status == "Paid" THEN',
      '10:    THROW ERROR "Invoice is already fully settled."',
      '11: END IF',
      '12: IF payAmount > (invoice.balanceDue + 0.01) THEN',
      '13:    THROW ERROR "Payment exceeds outstanding balance. Overpayment rejected."',
      '14: END IF',
      '15: receiptNumber <- GeneratePaymentNumber(userId)  // e.g. PAY-1001',
      '16: payment <- Payment.Create({ invoiceId, payAmount, paymentMethod, referenceNumber })',
      '17: invoice.amountPaid <- RoundToTwoDecimals(invoice.amountPaid + payAmount)',
      '18: invoice.balanceDue <- RoundToTwoDecimals(Max(0, invoice.grandTotal - invoice.amountPaid))',
      '19: IF invoice.balanceDue <= 0.01 THEN',
      '20:    invoice.balanceDue <- 0.00',
      '21:    invoice.status <- "Paid"',
      '22: ELSE',
      '23:    invoice.status <- "Partially Paid"',
      '24: END IF',
      '25: invoice.Save()',
      '26: customer <- Customer.FindOne({ _id: invoice.customer, user: userId })',
      '27: IF customer IS NOT NULL THEN',
      '28:    customer.totalPaid <- RoundToTwoDecimals(customer.totalPaid + payAmount)',
      '29:    customer.balanceDue <- RoundToTwoDecimals(Max(0, customer.balanceDue - payAmount))',
      '30:    customer.Save()',
      '31: END IF',
      '32: RETURN payment, invoice',
    ]),
    p(
      'By reconciling the invoice and customer ledgers atomically, financial numbers remain perpetually synchronized without human intervention.',
      { before: 100, after: 120 }
    ),

    h3('4.3.4 Algorithm 4: Indian Rupees Currency to Words Conversion'),
    p(
      'In compliance with Indian commercial standards, invoice documents must print the total payable sum in written words using the Indian numbering system (Crores, Lakhs, Thousands, Hundreds, and Paise). Algorithm 4 decomposes numerical amounts into their respective hierarchical groups.',
      { before: 80, after: 100 }
    ),
    codeBox([
      'Algorithm 4: Number to Indian Rupees Words Converter',
      'Input:  num (Float, e.g. 125430.50)',
      'Output: words (String, e.g. "Rupees One Lakh Twenty Five Thousand Four Hundred and Thirty and Fifty Paise Only")',
      '------------------------------------------------------------------',
      '1:  IF num IS NULL OR num == 0 THEN RETURN "Zero Rupees Only"',
      '2:  rounded <- Round(num * 100) / 100',
      '3:  parts <- SplitString(rounded, ".")',
      '4:  integerPart <- ParseInteger(parts[0])',
      '5:  decimalPart <- ParseInteger(parts[1]) IF parts[1] EXISTS ELSE 0',
      '6:  crores <- Floor(integerPart / 10000000)',
      '7:  integerPart <- integerPart MOD 10000000',
      '8:  lakhs <- Floor(integerPart / 100000)',
      '9:  integerPart <- integerPart MOD 100000',
      '10: thousands <- Floor(integerPart / 1000)',
      '11: integerPart <- integerPart MOD 1000',
      '12: hundreds <- integerPart',
      '13: words <- ""',
      '14: IF crores > 0 THEN words += ConvertTwoDigits(crores) + " Crore "',
      '15: IF lakhs > 0 THEN words += ConvertTwoDigits(lakhs) + " Lakh "',
      '16: IF thousands > 0 THEN words += ConvertTwoDigits(thousands) + " Thousand "',
      '17: IF hundreds > 0 THEN words += ConvertThreeDigits(hundreds) + " "',
      '18: result <- "Rupees " + Trim(words)',
      '19: IF decimalPart > 0 THEN',
      '20:    result += " and " + ConvertTwoDigits(decimalPart) + " Paise"',
      '21: END IF',
      '22: RETURN result + " Only"',
    ]),
    p(
      'This algorithmic formulation operates deterministically across all commercial transaction scales, guaranteeing flawless text rendering on printed tax invoices and legal receipts.',
      { before: 100, after: 160 }
    )
  );

  return elements;
};

module.exports = { getChapter4 };
