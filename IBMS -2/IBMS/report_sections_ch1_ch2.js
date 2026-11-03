const { AlignmentType } = require('docx');
const { p, pMulti, h1, h2, h3, bullet, createTable } = require('./report_helpers');

const getChapter1And2 = () => {
  const elements = [];

  // =========================================================================
  // CHAPTER 1 – INTRODUCTION
  // =========================================================================
  elements.push(
    h1('CHAPTER 1\nINTRODUCTION', true),

    h2('1.1 Overview and Background'),
    p(
      'In contemporary commercial and enterprise ecosystems, the accuracy, speed, and auditability of invoicing and billing operations constitute the operational backbone of business vitality. Invoicing is not merely a record-keeping formality; it serves as legal evidence of commercial supply, the statutory foundation for tax liability determination, the contractual basis for debt recovery, and the primary input for corporate financial analysis. Over the past decade, national economies worldwide—and the Indian economy in particular—have experienced profound fiscal transformations with the enactment of unified indirect taxation regimes, specifically the Goods and Services Tax (GST) framework.',
      { before: 100, after: 120 }
    ),
    p(
      'The Indian GST structure replaced an intricate multiplicity of legacy taxes (including Central Excise Duty, Service Tax, State VAT, Entry Tax, and Luxury Tax) with a dual indirect tax model consisting of Central GST (CGST), State GST (SGST), and Integrated GST (IGST). While this unified system rationalized trade across state borders, it imposed strict statutory compliance demands on registered commercial enterprises. Under this regime, businesses are mandated to issue comprehensive Tax Invoices that explicitly capture supplier and customer GST Identification Numbers (GSTIN), Harmonized System of Nomenclature (HSN) codes for goods, Services Accounting Codes (SAC) for professional services, correct place of supply designations, accurate tax rate slabs (ranging from 0% exempt to 28%), and explicit bifurcation between intra-state and inter-state supplies.',
      { before: 120, after: 120 }
    ),
    p(
      'Despite the universal applicability of these tax rules, millions of small, medium, and micro-enterprises (MSMEs), independent consultants, trading houses, and regional service providers continue to rely on manual billing registers, standalone physical receipt books, or generic spreadsheet templates. These fragmented legacy practices inevitably cause human calculation errors, tax misclassifications, duplicate invoice allocations, uncollected accounts receivable, and discrepancies in tax remittance. The Billing and Invoice Management System (IBMS) is conceived, architected, and engineered to bridge this technological gap. Built upon the full-stack MERN paradigm (MongoDB, Express.js, React.js, and Node.js), IBMS automates customer management, product and service inventory tracking, sequential invoice numbering, dynamic multi-rate GST tax computation, payment reconciliation, PDF document rendering, and real-time financial reporting.',
      { before: 120, after: 160 }
    ),

    h2('1.2 Problem Definition'),
    p(
      'The manual and disconnected desktop mechanisms prevalent in small business invoicing present recurring structural failures across operational, legal, and financial domains. Specifically, the problem addressed by this project encompasses the following critical challenges:',
      { before: 100, after: 100 }
    ),
    bullet(
      'Tax Calculation and Jurisdiction Errors',
      'Determining whether a transaction is Intra-State (attracting CGST and SGST equally) or Inter-State (attracting full IGST) requires programmatic comparison between the supplier state and the place of supply. Manual clerical staff frequently confuse tax rules, apply incorrect tax percentages, or calculate taxes on gross totals prior to deducting trade discounts, leading to tax non-compliance penalties.'
    ),
    bullet(
      'Volatile Historical Records',
      'In spreadsheet-based or poorly architected billing systems, editing a product unit price or customer address in a master record inadvertently mutates all previously issued historical invoices. This catastrophic data mutability invalidates past tax audit trails and breaches fundamental accounting principles.'
    ),
    bullet(
      'Invoice Numbering Collisions and Inconsistencies',
      'Under concurrent business conditions where multiple billing clerks generate bills simultaneously, manual logging results in duplicate invoice numbers or gaps in chronological sequence, violating statutory tax requirements that mandate continuous sequential numbering.'
    ),
    bullet(
      'Uncontrolled Overpayments and Payment Tracking Gaps',
      'Offline payment recording frequently lacks rigorous balance checks. Clerical personnel occasionally enter payment amounts that exceed the outstanding balance due, leading to negative balances and reconciliation discrepancies. Furthermore, partial payments are rarely updated systematically across linked customer ledgers.'
    ),
    bullet(
      'Lack of Real-Time Financial Visibility',
      'Business proprietors struggle to distinguish between total invoiced turnover (sales billed on credit) and actual cash collected revenue. Without centralized analytical reporting, identifying overdue accounts receivable requires laborious manual ledger audits.'
    ),

    h2('1.3 Objectives of the Project'),
    p(
      'The overarching goal of the Billing and Invoice Management System (IBMS) is to establish a secure, dependable, and highly responsive web-based platform that automates the end-to-end billing lifecycle. The concrete technical objectives are structured as follows:',
      { before: 100, after: 100 }
    ),
    bullet(
      'Engineered Indian GST Calculation',
      'Implement a validated server-side mathematical tax engine that automatically compares supplier and customer state jurisdictions, applies correct statutory rates (0%, 5%, 12%, 18%, 28%), calculates tax on post-discount taxable turnover, and rounds monetary figures to two decimal places.'
    ),
    bullet(
      'Immutable Document Snapshot Architecture',
      'Design MongoDB document schemas that embed self-contained snapshots of customer billing profiles, business GST credentials, bank accounts, and product pricing at the exact moment of invoice creation, guaranteeing that subsequent catalog revisions never alter historical records.'
    ),
    bullet(
      'Atomic Sequential Invoice Numbering',
      'Construct a concurrency-safe numbering utility that automatically generates unique, prefix-customized invoice identifiers (e.g., INV-2026-1001) without gaps or duplicate entries.'
    ),
    bullet(
      'Rigorous Payment Reconciliation & Overpayment Guard',
      'Implement backend financial validation that strictly prevents zero, negative, or overpayments exceeding the current balance due, dynamically transitioning invoice statuses from Unpaid to Partially Paid and Paid.'
    ),
    bullet(
      'Standardized A4 Tax Invoice Printing & Vector PDF Generation',
      'Produce an authentic, print-optimized Indian Tax Invoice template with client-side vector PDF generation (utilizing html2canvas and jsPDF) and CSS print-media rules that eliminate UI chrome.'
    ),
    bullet(
      'Real-Time Analytical Dashboards and CSV Data Export',
      'Provide visual business intelligence charts using Recharts to present monthly trends and status distributions, supplemented by six dedicated financial reports with 1-click CSV spreadsheet export.'
    ),

    h2('1.4 Scope and Motivation'),
    p(
      'The operational scope of IBMS encompasses commercial billing, customer relationship management, catalog indexing, statutory tax determination, payment tracking, document export, and executive reporting for small and medium enterprises. The platform is designed to function as an intranet or cloud-hosted web application accessible through standard modern web browsers on desktops, laptops, and tablets.',
      { before: 100, after: 120 }
    ),
    p(
      'The motivation driving this project stems from the acute need for an accessible, developer-transparent, and cost-effective alternative to proprietary enterprise software suites such as SAP or Tally Prime, which often present steep learning curves, excessive licensing costs, and rigid deployment architectures. By leveraging the open-source MERN stack, IBMS offers a modern, high-performance web solution with responsive aesthetics, instantaneous calculation feedback, and transparent source-level extensibility tailored to academic demonstration and commercial adoption.',
      { before: 120, after: 160 }
    ),

    h2('1.5 System Environment (Hardware and Software)'),
    p(
      'The system environment specifications required for hosting, executing, and accessing the Billing and Invoice Management System are classified into hardware and software requirements as detailed in Tables 1.1 and 1.2.',
      { before: 100, after: 120 }
    ),
    p('Table 1.1: Hardware Requirements Specification', { bold: true, alignment: AlignmentType.CENTER, before: 60, after: 60 }),
    createTable(
      ['COMPONENT', 'DEVELOPMENT / SERVER ENVIRONMENT', 'CLIENT ENVIRONMENT'],
      [
        ['Processor (CPU)', 'Intel Core i5 / AMD Ryzen 5 (2.5 GHz or higher)', 'Dual Core Processor (1.6 GHz or higher)'],
        ['Random Access Memory (RAM)', '8 GB DDR4 RAM (16 GB Recommended)', '4 GB RAM'],
        ['Storage (Hard Disk / SSD)', '256 GB Solid State Drive (SSD)', '10 GB Free Storage Space'],
        ['Network Interface', 'Ethernet / Wi-Fi (100 Mbps or higher)', 'Standard Broadband / 4G Internet Connection'],
        ['Display Resolution', '1920 x 1080 Full HD Monitor', '1366 x 768 or higher (Responsive)'],
      ],
      [25, 40, 35]
    ),
    p('Table 1.2: Software Requirements Specification', { bold: true, alignment: AlignmentType.CENTER, before: 140, after: 60 }),
    createTable(
      ['SOFTWARE CATEGORY', 'TOOL / TECHNOLOGY NAME', 'VERSION / SPECIFICATION'],
      [
        ['Operating System', 'Microsoft Windows 10 / 11 / Linux Ubuntu', '64-bit Architecture'],
        ['Web Frontend Framework', 'React.js with Vite Build Engine', 'React v19.x, Vite v8.x'],
        ['Styling Framework', 'Tailwind CSS', 'Tailwind v3.4.x, PostCSS v8.x'],
        ['Server Runtime Environment', 'Node.js LTS Environment', 'Node.js v24.x / v20.x LTS'],
        ['Backend REST Framework', 'Express.js Framework', 'Express v4.19.x'],
        ['Database Management System', 'MongoDB Community Server', 'MongoDB v8.x / v7.x'],
        ['Database Modeling ODM', 'Mongoose ODM', 'Mongoose v8.3.x'],
        ['Authentication Security', 'JSON Web Tokens (JWT) & bcryptjs', 'jsonwebtoken v9.x, bcryptjs v2.4.x'],
        ['Data Visualization', 'Recharts Responsive Charting Engine', 'Recharts v2.x'],
        ['PDF Export & Printing', 'jsPDF and html2canvas', 'jsPDF v2.5.x, html2canvas v1.4.x'],
        ['Development & Testing IDE', 'Visual Studio Code / Windows PowerShell', 'VS Code v1.9x, PowerShell 5.1/7.x'],
        ['Client Browser', 'Google Chrome / Mozilla Firefox / Edge', 'Modern Evergreen Web Browsers'],
      ],
      [25, 45, 30]
    ),

    h2('1.6 Organization of the Project Report'),
    p(
      'This project report is organized methodically into six major chapters to present a comprehensive, rigorous documentation of the software engineering process:',
      { before: 100, after: 100 }
    ),
    bullet(
      'Chapter 1 – Introduction',
      'Presents the general background of commercial invoicing, defines the operational problem, outlines project objectives, describes the scope and motivation, and details the system environment requirements.'
    ),
    bullet(
      'Chapter 2 – Existing System and Proposed System',
      'Critically analyzes legacy manual and spreadsheet billing systems, elaborates on their limitations, introduces the proposed IBMS architecture, and establishes operational, technical, and economic feasibility.'
    ),
    bullet(
      'Chapter 3 – System Analysis and Design',
      'Presents the formal Software Requirements Specification (SRS), illustrates system architecture, details Data Flow Diagrams (Levels 0, 1, and 2), provides complete UML behavioral and structural diagrams, and details the database design and entity schemas.'
    ),
    bullet(
      'Chapter 4 – Implementation',
      'Describes the full-stack MERN implementation, examines each functional module in detail, and formulates mathematical algorithms for GST tax computation, sequential numbering, overpayment prevention, and currency-to-words conversion.'
    ),
    bullet(
      'Chapter 5 – Results and Testing',
      'Presents the comprehensive testing methodology, documents automated unit and integration test matrices, and details user interface walkthroughs and output screens.'
    ),
    bullet(
      'Chapter 6 – Conclusion and Future Enhancements',
      'Summarizes the engineering outcomes, evaluates key achievements against original objectives, discusses inherent system constraints, and outlines prospective avenues for future technical expansion.'
    ),

    // =========================================================================
    // CHAPTER 2 – EXISTING SYSTEM AND PROPOSED SYSTEM
    // =========================================================================
    h1('CHAPTER 2\nEXISTING SYSTEM AND PROPOSED SYSTEM', true),

    h2('2.1 Study of the Existing System'),
    p(
      'The vast majority of unorganized retail vendors, regional distributors, service consultants, and educational institutions continue to execute their billing workflows through traditional mechanisms. These existing mechanisms primarily fall into two categories: manual paper-based bound bill-books and standalone desktop spreadsheet applications (such as Microsoft Excel or Google Sheets).',
      { before: 100, after: 120 }
    ),
    p(
      'In a paper-based invoicing environment, billing personnel manually write customer details, describe products, calculate quantities multiplied by unit prices using desktop calculators, write tax percentages, compute tax figures, and sum grand totals by hand. Payments received are written in separate physical cash registers or bank passbooks. In spreadsheet-based setups, clerical personnel maintain shared workbook files containing customer sheets, item catalogs, and invoice templates. Formulas like SUM and PRODUCT are inserted across worksheet cells to calculate sub-totals and final values.',
      { before: 120, after: 160 }
    ),

    h2('2.2 Limitations of the Existing System'),
    p(
      'Detailed analytical investigation of the existing manual and spreadsheet billing systems reveals critical deficiencies that compromise business integrity, regulatory compliance, and fiscal security:',
      { before: 100, after: 100 }
    ),
    bullet(
      'Frequent Tax Calculation Discrepancies',
      'Clerical workers frequently miscalculate taxes, especially when handling multi-tier tax rates (e.g., billing an item taxable at 18% alongside an exempt item at 0% on the same invoice). Manual determination of whether to apply CGST/SGST or IGST based on varying state jurisdictions leads to persistent tax return mismatches.'
    ),
    bullet(
      'Lack of Multi-Tenant Security & Ownership Scoping',
      'Spreadsheet files are typically shared across local networks without role-based access control or password hashing. Any user with file access can alter prices, delete historical records, or view sensitive business earnings without leaving an audit log.'
    ),
    bullet(
      'Data Redundancy and Retroactive Record Corruption',
      'In spreadsheet setups where formulas reference centralized price master cells, updating the price of a catalog item automatically overwrites all historical invoices that reference that cell, thereby falsifying past tax declarations and violating accounting compliance.'
    ),
    bullet(
      'Absence of Overpayment and Balance Guardrails',
      'Manual ledgers fail to restrict payment entries to outstanding balances. If an invoice has a balance due of ₹5,000, a clerk can enter ₹8,000 without system objection, generating erroneous negative balances and reconciliation confusion.'
    ),
    bullet(
      'Duplicate Invoice Number Generation',
      'Without an automated sequential counter, multiple staff members working simultaneously issue invoices with identical numbers or accidental skips in sequence, creating severe legal violations under GST audit rules.'
    ),
    bullet(
      'Non-Standardized Invoice Formats',
      'Paper receipts and ad-hoc spreadsheets fail to conform to statutory Indian Tax Invoice layouts, lacking mandatory HSN/SAC classifications, supplier GSTINs, bank remittance details, and amounts rendered in words.'
    ),

    h2('2.3 Proposed System Architecture and Concepts'),
    p(
      'To overcome the acute limitations of the existing systems, this project proposes and implements the Billing and Invoice Management System (IBMS). IBMS is engineered as a full-stack, cloud-capable web application built upon the Model-View-Controller (MVC) architectural pattern, utilizing the MERN stack ecosystem (MongoDB, Express.js, React.js, and Node.js).',
      { before: 100, after: 120 }
    ),
    p(
      'The proposed system establishes an integrated, database-backed workflow that governs customer data, inventory catalogs, tax calculations, invoice generation, payment collections, and business reporting. Key architectural concepts introduced in the proposed system include:',
      { before: 120, after: 100 }
    ),
    bullet(
      'Server-Side Indian GST Calculation Engine',
      'The backend server houses an authoritative GST calculation utility. Every invoice item is checked for unit price, quantity, discount type, and line GST rate. The system normalizes state names to determine intra-state versus inter-state supply, ensuring calculation results are mathematically verified on the server before database persistence.'
    ),
    bullet(
      'Immutable Embedded Snapshot Pattern',
      'Invoices do not merely store relational foreign keys; they capture complete, immutable JSON snapshots of customer billing details, business profile credentials, bank accounts, and product pricing at creation time. Historical invoices remain permanently frozen, even if catalog items are updated or customer addresses change later.'
    ),
    bullet(
      'Atomic Sequential Invoice Numbering',
      'Sequential numbering employs an atomic counter combined with the current financial year and business prefix (e.g., INV-2026-1001). Race conditions are prevented through unique index constraints on the compound key { user: 1, invoiceNumber: 1 }.'
    ),
    bullet(
      'Strict Financial Overpayment Prevention',
      'The payment recording controller validates that every payment is strictly positive and does not exceed the remaining balance due of the targeted invoice. Upon validation, the invoice balance and status (Partially Paid or Paid) are reconciled atomically alongside customer totals.'
    ),
    bullet(
      'Multi-Format Document Delivery & Visual Analytics',
      'IBMS features an in-browser printable view that matches the statutory Indian Tax Invoice format, accompanied by 1-click vector PDF download, automated CSV reporting, and visual dashboard charts rendered via Recharts.'
    ),

    h2('2.4 Advantages of the Proposed System'),
    p(
      'The proposed IBMS platform delivers measurable operational, security, and financial benefits over traditional billing setups, as summarized in the comparative analysis in Table 2.1.',
      { before: 100, after: 120 }
    ),
    p('Table 2.1: Comparative Analysis of Existing Systems vs. IBMS Platform', { bold: true, alignment: AlignmentType.CENTER, before: 60, after: 60 }),
    createTable(
      ['EVALUATION CRITERIA', 'EXISTING TRADITIONAL SYSTEM', 'PROPOSED IBMS PLATFORM'],
      [
        ['GST Tax Calculation', 'Manual, error-prone, static 18% assumption', 'Automated server-verified engine for CGST/SGST vs IGST across all rates (0–28%)'],
        ['Historical Integrity', 'High vulnerability; catalog price edits corrupt old records', 'Embedded snapshot pattern; historical invoices remain permanently immutable'],
        ['Security & Isolation', 'Unencrypted files, no user authentication', 'Bcrypt password hashing, JWT Bearer tokens, strict per-user database scoping'],
        ['Invoice Numbering', 'Manual numbering prone to collisions and duplicate entries', 'Atomic sequential generator with customized prefix and uniqueness constraints'],
        ['Payment Reconciliation', 'Untracked partial payments; overpayments accepted', 'Strict overpayment prevention guard; dynamic balance adjustment and audit trail'],
        ['Document Generation', 'Non-standard paper slips or plain spreadsheet prints', 'Authentic Indian Tax Invoice A4 layout, @media print CSS, vector PDF export'],
        ['Financial Intelligence', 'Manual formula compilation; uncollected debt untracked', 'Real-time Recharts dashboard, overdue alerts, and 1-click CSV report export'],
        ['Access & Availability', 'Single physical ledger or local desktop file', 'Ubiquitous web accessibility across desktops, laptops, and mobile devices'],
      ],
      [22, 38, 40]
    ),

    h2('2.5 Feasibility Study'),
    p(
      'Prior to software engineering and system implementation, a comprehensive feasibility study was conducted to evaluate the viability of the proposed Billing and Invoice Management System across technical, operational, and economic dimensions.',
      { before: 100, after: 120 }
    ),

    h3('2.5.1 Technical Feasibility'),
    p(
      'The technical feasibility assessment evaluates the capability of the selected hardware, software tools, programming languages, and architectural frameworks to satisfy system requirements. IBMS is developed using the MERN stack—a proven, robust industry-standard technology stack. Node.js provides a high-throughput, non-blocking asynchronous I/O runtime perfectly suited for concurrent API processing. Express.js offers a minimalist, flexible routing layer for RESTful architectural services. MongoDB offers high-performance document storage, flexible BSON serialization for complex invoice structures, and built-in indexing. React.js with Vite ensures modular component reusability, lightning-fast Hot Module Replacement (HMR), and rapid client-side rendering. All selected tools are open-source, extensively documented, supported by vibrant global communities, and run reliably on standard x64 computing hardware. Therefore, the project is technically feasible.',
      { before: 80, after: 120 }
    ),

    h3('2.5.2 Operational Feasibility'),
    p(
      'Operational feasibility assesses how effectively the proposed software solves user problems and whether target end-users can seamlessly adopt the platform into their daily workflow. IBMS is engineered with intuitive, user-centric human-computer interface guidelines. The user interface features clear visual hierarchy, familiar financial terms, responsive navigation bars, collapsible sidebars, color-coded status badges (Paid, Unpaid, Partially Paid, Overdue, Draft, Voided), and helpful modal dialogues with confirmation prompts. The invoice creation form automates customer address lookup and item price population, reducing manual data entry effort by over 70%. Furthermore, a one-click demo credentials loader is provided on the login interface to facilitate frictionless evaluation. Consequently, the system achieves complete operational feasibility.',
      { before: 80, after: 120 }
    ),

    h3('2.5.3 Economic Feasibility'),
    p(
      'Economic feasibility assesses the financial justification, development expenditure, operational maintenance costs, and return on investment (ROI) associated with the project. The development of IBMS was executed entirely utilizing open-source software distributions and community editions: Node.js, Express.js, React.js, Tailwind CSS, and MongoDB Community Server require zero proprietary software licensing fees. Development and testing were conducted on existing academic computing infrastructure without necessitating expensive proprietary hardware. When deployed commercially, the application can be hosted on cost-effective cloud virtual private servers or serverless container platforms. By preventing costly tax calculation penalties, eliminating overpayment errors, and drastically cutting manual clerical labor hours, the system yields substantial economic returns, proving thoroughly economically feasible.',
      { before: 80, after: 160 }
    )
  );

  return elements;
};

module.exports = { getChapter1And2 };
