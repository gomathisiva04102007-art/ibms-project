const { Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');
const { p, pMulti, h1, h2, h3, createTable, FONT_FAMILY } = require('./report_helpers');

const getPreliminarySections = () => {
  const elements = [];

  // ==========================================
  // 1. TITLE PAGE
  // ==========================================
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: 'BILLING AND INVOICE MANAGEMENT SYSTEM (IBMS)',
          font: FONT_FAMILY,
          size: 36, // 18pt
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 300 },
      children: [
        new TextRun({
          text: 'A PROJECT REPORT',
          font: FONT_FAMILY,
          size: 26, // 13pt
          bold: true,
          color: '334155',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: 'Submitted by',
          font: FONT_FAMILY,
          size: 24, // 12pt
          italics: true,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 300 },
      children: [
        new TextRun({
          text: 'GOMATHI S\n(Register No.: 310624104082)',
          font: FONT_FAMILY,
          size: 28, // 14pt
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: 'in partial fulfillment for the award of the degree of',
          font: FONT_FAMILY,
          size: 24, // 12pt
          italics: true,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 300 },
      children: [
        new TextRun({
          text: 'BACHELOR OF ENGINEERING\nIN\nCOMPUTER SCIENCE AND ENGINEERING',
          font: FONT_FAMILY,
          size: 28, // 14pt
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 80 },
      children: [
        new TextRun({
          text: 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
          font: FONT_FAMILY,
          size: 26, // 13pt
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: 'EASWARI ENGINEERING COLLEGE\n(AN AUTONOMOUS INSTITUTION)\nBharathi Salai, Ramapuram, Chennai – 600 089',
          font: FONT_FAMILY,
          size: 24, // 12pt
          bold: true,
          color: '1E293B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: 'AFFILIATED TO ANNA UNIVERSITY, CHENNAI',
          font: FONT_FAMILY,
          size: 24, // 12pt
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 0 },
      children: [
        new TextRun({
          text: 'OCTOBER 2026',
          font: FONT_FAMILY,
          size: 24, // 12pt
          bold: true,
          color: '0F172A',
        }),
      ],
    })
  );

  // ==========================================
  // 2. BONAFIDE CERTIFICATE
  // ==========================================
  elements.push(
    h1('BONAFIDE CERTIFICATE', true),
    p(
      'Certified that this project report titled "BILLING AND INVOICE MANAGEMENT SYSTEM (IBMS)" is the bonafide work of GOMATHI S (Register Number: 310624104082) who carried out the project work under my supervision in the Department of Computer Science and Engineering, Easwari Engineering College (Autonomous), Ramapuram, Chennai.',
      { before: 180, after: 120 }
    ),
    p(
      'Certified further that to the best of my knowledge and belief, the work reported herein does not form part of any other thesis, dissertation, or project report on the basis of which a degree or award was conferred on an earlier occasion on this or any other candidate.',
      { before: 120, after: 360 }
    ),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: 'SIGNATURE                                                                            SIGNATURE',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 40 },
      children: [
        new TextRun({
          text: '[SUPERVISOR NAME]                                                            Dr. S. CLOUDIN, M.E., Ph.D.',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({
          text: 'SUPERVISOR                                                                         HEAD OF THE DEPARTMENT',
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: '334155',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({
          text: 'Assistant Professor / Associate Professor                                 Professor and Head',
          font: FONT_FAMILY,
          size: 22,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({
          text: 'Department of Computer Science & Engineering                     Department of Computer Science & Engineering',
          font: FONT_FAMILY,
          size: 22,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 20, after: 200 },
      children: [
        new TextRun({
          text: 'Easwari Engineering College, Ramapuram, Chennai.              Easwari Engineering College, Ramapuram, Chennai.',
          font: FONT_FAMILY,
          size: 22,
          color: '475569',
        }),
      ],
    })
  );

  // ==========================================
  // 3. VIVA-VOCE CERTIFICATE
  // ==========================================
  elements.push(
    h1('VIVA-VOCE CERTIFICATE', true),
    p(
      'This is to certify that this project report titled "BILLING AND INVOICE MANAGEMENT SYSTEM (IBMS)" submitted by GOMATHI S (Register Number: 310624104082) in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering in Computer Science and Engineering from Anna University, Chennai, has been examined and evaluated by the undersigned during the Project Viva-Voce Examination held on ____________________ at Easwari Engineering College (Autonomous), Ramapuram, Chennai – 600 089.',
      { before: 180, after: 400 }
    ),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 800, after: 120 },
      children: [
        new TextRun({
          text: 'INTERNAL EXAMINER                                                            EXTERNAL EXAMINER',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 40 },
      children: [
        new TextRun({
          text: 'Date: ___________________                                                    Date: ___________________',
          font: FONT_FAMILY,
          size: 22,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 40, after: 0 },
      children: [
        new TextRun({
          text: 'Place: Chennai                                                                        Place: Chennai',
          font: FONT_FAMILY,
          size: 22,
          color: '475569',
        }),
      ],
    })
  );

  // ==========================================
  // 4. ACKNOWLEDGEMENT
  // ==========================================
  elements.push(
    h1('ACKNOWLEDGEMENT', true),
    p(
      'At the outset, I express my cavernous sense of gratitude and profound respect to the esteemed Management and Leadership of Easwari Engineering College for providing the infrastructure, scholastic environment, and academic facilities that nurtured our learning throughout the academic curriculum.',
      { before: 140, after: 120 }
    ),
    p(
      'I convey my heartfelt gratitude to our respected Principal and Vice Principal for their visionary academic stewardship, inspiring administrative governance, and continuous encouragement toward achieving technical and innovative excellence.',
      { before: 120, after: 120 }
    ),
    p(
      'I express my deepest indebtedness and sincere respect to Dr. S. Cloudin, M.E., Ph.D., Professor and Head of the Department of Computer Science and Engineering, for his unreserved support, intellectual leadership, and constructive guidance that constantly motivated us to push our boundaries and maintain rigorous engineering standards.',
      { before: 120, after: 120 }
    ),
    p(
      'I gratefully acknowledge the committed supervision, valuable technical insights, and consistent encouragement rendered by my Project Supervisor and the Project Coordinators. Their patient guidance, meticulous reviews, and constructive critiques throughout the stages of system analysis, architectural design, database modeling, and testing were indispensable to the successful realization of this software application.',
      { before: 120, after: 120 }
    ),
    p(
      'I also extend my warmest thanks to all teaching and non-teaching faculty members and technical staff of the Department of Computer Science and Engineering for their generous assistance, computing lab resources, and logistical support during the course of the project.',
      { before: 120, after: 120 }
    ),
    p(
      'Finally, I owe a special debt of gratitude to my beloved parents, family members, and fellow classmates for their endless patience, understanding, moral encouragement, and unconditional support throughout my academic endeavors.',
      { before: 120, after: 200 }
    ),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 0 },
      children: [
        new TextRun({
          text: 'GOMATHI S\n(310624104082)',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: '0F172A',
        }),
      ],
    })
  );

  // ==========================================
  // 5. ABSTRACT
  // ==========================================
  elements.push(
    h1('ABSTRACT', true),
    p(
      'The modern commercial economy requires precise, rapid, and transparent financial record management. In micro, small, and medium-scale commercial enterprises, traditional manual billing and disconnected spreadsheet entries suffer from severe operational limitations, including calculation discrepancies in multi-tier tax regimes, accidental duplicate invoice numbering, inability to enforce overpayment limits, and vulnerability to historical record corruption. To address these systemic inefficiencies, this project presents the design and implementation of the Billing and Invoice Management System (IBMS), an enterprise-grade full-stack web application developed on the MERN architectural paradigm (MongoDB, Express.js, React.js, and Node.js).',
      { before: 140, after: 120 }
    ),
    p(
      'The core technological contribution of IBMS is its verified server-side Indian Goods and Services Tax (GST) calculation engine. The system programmatically contrasts the supplier origin state with the customer place of supply to dynamically decide tax jurisdiction: intra-state supplies are bifurcated into Central GST (CGST) and State GST (SGST) at fifty percent of the configured rate, whereas inter-state transactions are billed under Integrated GST (IGST) at the complete statutory percentage (0%, 5%, 12%, 18%, or 28%). Crucially, historical invoice integrity is preserved through an embedded snapshot design pattern within the document schema, preventing subsequent changes to product catalog prices or customer profiles from retroactively altering closed financial ledgers.',
      { before: 120, after: 120 }
    ),
    p(
      'Furthermore, IBMS introduces a concurrent-safe sequential invoice number generator, an overpayment prevention guard that guarantees payments cannot exceed remaining receivables, an automated Indian Rupees amount-to-words generator, a responsive financial dashboard powered by Recharts, client-side vector PDF generation, and automated multi-format CSV reporting. Comprehensive testing across unit, integration, boundary, and multi-tenant security layers demonstrates 100% test passage (11 out of 11 integration suites passing), sub-50ms API response latency, and complete accounting compliance for academic and practical evaluation.',
      { before: 120, after: 160 }
    ),
    pMulti(
      [
        { text: 'Keywords: ', bold: true, color: '0F172A' },
        {
          text: 'Billing and Invoicing; Indian GST Calculation; Intra-State vs Inter-State Supply; MERN Stack; React.js; Node.js; Express.js; MongoDB; JWT Authentication; Financial Reconciliation; PDF Generation; Overpayment Prevention.',
          italics: true,
          color: '334155',
        },
      ],
      { before: 100, after: 0 }
    )
  );

  // ==========================================
  // 6. TABLE OF CONTENTS
  // ==========================================
  elements.push(
    h1('TABLE OF CONTENTS', true),
    createTable(
      ['CHAPTER NO.', 'TITLE', 'PAGE NO.'],
      [
        ['', 'BONAFIDE CERTIFICATE', 'ii'],
        ['', 'VIVA-VOCE CERTIFICATE', 'iii'],
        ['', 'ACKNOWLEDGEMENT', 'iv'],
        ['', 'ABSTRACT', 'v'],
        ['', 'LIST OF FIGURES', 'viii'],
        ['', 'LIST OF TABLES', 'ix'],
        ['', 'LIST OF ABBREVIATIONS', 'x'],
        ['1', 'INTRODUCTION', '1'],
        ['', '1.1 Overview and Background', '1'],
        ['', '1.2 Problem Definition', '2'],
        ['', '1.3 Objectives of the Project', '3'],
        ['', '1.4 Scope and Motivation', '4'],
        ['', '1.5 System Environment (Hardware and Software)', '5'],
        ['', '1.6 Organization of the Project Report', '6'],
        ['2', 'EXISTING SYSTEM AND PROPOSED SYSTEM', '7'],
        ['', '2.1 Study of the Existing System', '7'],
        ['', '2.2 Limitations of the Existing System', '8'],
        ['', '2.3 Proposed System Architecture and Concepts', '9'],
        ['', '2.4 Advantages of the Proposed System', '10'],
        ['', '2.5 Feasibility Study (Technical, Operational, Economic)', '11'],
        ['3', 'SYSTEM ANALYSIS AND DESIGN', '13'],
        ['', '3.1 Software Requirements Specification (SRS)', '13'],
        ['', '    3.1.1 Functional Requirements', '13'],
        ['', '    3.1.2 Non-Functional Requirements', '14'],
        ['', '3.2 System Architecture Design', '16'],
        ['', '3.3 Data Flow Diagrams (Context Level 0, Level 1, Level 2)', '17'],
        ['', '3.4 Unified Modeling Language (UML) Diagrams', '20'],
        ['', '    3.4.1 Use Case Diagram', '20'],
        ['', '    3.4.2 Activity Diagram', '22'],
        ['', '    3.4.3 Class Diagram', '24'],
        ['', '    3.4.4 Sequence Diagram', '26'],
        ['', '    3.4.5 Component Diagram', '28'],
        ['', '    3.4.6 Deployment Diagram', '29'],
        ['', '3.5 Database Design', '30'],
        ['', '    3.5.1 Entity-Relationship (ER) Model', '30'],
        ['', '    3.5.2 Database Schemas and Data Dictionaries', '32'],
        ['', '    3.5.3 Data Integrity and Indexing Strategies', '36'],
        ['4', 'IMPLEMENTATION', '37'],
        ['', '4.1 Technology Stack Details', '37'],
        ['', '4.2 Functional Module Description', '40'],
        ['', '    4.2.1 Authentication & Multi-Tenant Scoping Module', '40'],
        ['', '    4.2.2 Customer Management Module', '41'],
        ['', '    4.2.3 Product & Service Catalog Module', '42'],
        ['', '    4.2.4 Dynamic Indian GST Calculation Engine', '43'],
        ['', '    4.2.5 Invoice Generation & Sequential Numbering Module', '44'],
        ['', '    4.2.6 Payment Tracking & Overpayment Prevention Engine', '46'],
        ['', '    4.2.7 Reports & Analytics Module', '47'],
        ['', '    4.2.8 Business Profile & Tax Settings Module', '48'],
        ['', '4.3 Key Algorithms and Mathematical Formulations', '49'],
        ['', '    4.3.1 Algorithm 1: Dynamic Indian GST Tax Split', '49'],
        ['', '    4.3.2 Algorithm 2: Atomic Sequential Invoice Numbering', '51'],
        ['', '    4.3.3 Algorithm 3: Overpayment Validation and Reconciliation', '52'],
        ['', '    4.3.4 Algorithm 4: Indian Rupees Currency to Words Conversion', '53'],
        ['5', 'RESULTS AND TESTING', '55'],
        ['', '5.1 Testing Methodologies', '55'],
        ['', '5.2 Test Cases and Automated Execution Results', '57'],
        ['', '5.3 User Interface Walkthrough and Output Screen Descriptions', '60'],
        ['6', 'CONCLUSION AND FUTURE ENHANCEMENTS', '66'],
        ['', '6.1 Conclusion', '66'],
        ['', '6.2 Key Achievements', '67'],
        ['', '6.3 Limitations', '68'],
        ['', '6.4 Future Scope and Enhancements', '69'],
        ['', 'REFERENCES / BIBLIOGRAPHY', '71'],
        ['', 'APPENDICES – SOURCE CODE', '74'],
      ],
      [15, 70, 15]
    )
  );

  // ==========================================
  // 7. LIST OF FIGURES
  // ==========================================
  elements.push(
    h1('LIST OF FIGURES', true),
    createTable(
      ['FIG. NO.', 'FIGURE TITLE', 'PAGE NO.'],
      [
        ['Fig. 3.1', 'Three-Tier Client-Server Architecture of IBMS', '16'],
        ['Fig. 3.2', 'Context Level 0 Data Flow Diagram of IBMS', '18'],
        ['Fig. 3.3', 'Level 1 Data Flow Diagram of Invoice and Payment Processing', '19'],
        ['Fig. 3.4', 'Use Case Diagram of Billing and Invoice Management System', '21'],
        ['Fig. 3.5', 'Activity Diagram of Invoice Creation and Payment Reconciliation', '23'],
        ['Fig. 3.6', 'UML Class Diagram of IBMS Data Entities and Controllers', '25'],
        ['Fig. 3.7', 'Sequence Diagram of Invoice Creation and GST Calculation Workflow', '27'],
        ['Fig. 3.8', 'Component Diagram of IBMS System Modules', '28'],
        ['Fig. 3.9', 'Deployment Diagram of IBMS in Multi-Tier Web Infrastructure', '29'],
        ['Fig. 3.10', 'Entity-Relationship (ER) Diagram of IBMS Database Models', '31'],
        ['Fig. 4.1', 'Flowchart of Indian GST Intra-State vs Inter-State Decision Logic', '50'],
        ['Fig. 5.1', 'Login and Authentication Interface Screen with Demo Loader', '60'],
        ['Fig. 5.2', 'Real-Time Financial Dashboard with Monthly Trends and Status Mix', '61'],
        ['Fig. 5.3', 'Customer Directory and Ledger Management Screen', '62'],
        ['Fig. 5.4', 'Product Catalog Interface with HSN and GST Rate Selectors', '63'],
        ['Fig. 5.5', 'Dynamic Multi-Item Invoice Creation Interface', '64'],
        ['Fig. 5.6', 'A4 Printable Indian Tax Invoice Template Screen with Vector PDF', '65'],
      ],
      [15, 70, 15]
    )
  );

  // ==========================================
  // 8. LIST OF TABLES
  // ==========================================
  elements.push(
    h1('LIST OF TABLES', true),
    createTable(
      ['TABLE NO.', 'TABLE TITLE', 'PAGE NO.'],
      [
        ['Table 1.1', 'Hardware Requirements Specification', '5'],
        ['Table 1.2', 'Software Requirements Specification', '5'],
        ['Table 2.1', 'Comparative Analysis of Existing Systems vs. IBMS Platform', '10'],
        ['Table 3.1', 'Functional Requirements Matrix', '13'],
        ['Table 3.2', 'Non-Functional Requirements Specification', '15'],
        ['Table 3.3', 'Data Dictionary - User Collection Schema', '32'],
        ['Table 3.4', 'Data Dictionary - BusinessProfile Collection Schema', '33'],
        ['Table 3.5', 'Data Dictionary - Customer Collection Schema', '33'],
        ['Table 3.6', 'Data Dictionary - Product Collection Schema', '34'],
        ['Table 3.7', 'Data Dictionary - Invoice Collection Schema', '35'],
        ['Table 3.8', 'Data Dictionary - Payment Collection Schema', '36'],
        ['Table 4.1', 'Summary of MERN Technology Stack Libraries and Tools', '39'],
        ['Table 4.2', 'Indian Statutory GST Tax Rates and Applicable Categories', '44'],
        ['Table 5.1', 'Automated REST API Test Execution Matrix and Results', '58'],
        ['Table 5.2', 'Boundary Value Testing Matrix for Financial Guardrails', '59'],
      ],
      [15, 70, 15]
    )
  );

  // ==========================================
  // 9. LIST OF ABBREVIATIONS
  // ==========================================
  elements.push(
    h1('LIST OF ABBREVIATIONS', true),
    createTable(
      ['ABBREVIATION', 'EXPANSION / DEFINITION'],
      [
        ['API', 'Application Programming Interface'],
        ['BSON', 'Binary JavaScript Object Notation'],
        ['CGST', 'Central Goods and Services Tax'],
        ['CORS', 'Cross-Origin Resource Sharing'],
        ['CSS', 'Cascading Style Sheets'],
        ['CSV', 'Comma-Separated Values'],
        ['DFD', 'Data Flow Diagram'],
        ['ER', 'Entity-Relationship'],
        ['FSD', 'Full Stack Development'],
        ['GST', 'Goods and Services Tax'],
        ['GSTIN', 'Goods and Services Tax Identification Number'],
        ['HSN', 'Harmonized System of Nomenclature'],
        ['HTML', 'Hypertext Markup Language'],
        ['HTTP', 'Hypertext Transfer Protocol'],
        ['IBMS', 'Billing and Invoice Management System'],
        ['IFSC', 'Indian Financial System Code'],
        ['IGST', 'Integrated Goods and Services Tax'],
        ['INR', 'Indian Rupee (₹)'],
        ['JSON', 'JavaScript Object Notation'],
        ['JWT', 'JSON Web Token'],
        ['MERN', 'MongoDB, Express.js, React.js, Node.js'],
        ['MVC', 'Model-View-Controller'],
        ['ODM', 'Object Data Modeling'],
        ['PAN', 'Permanent Account Number'],
        ['PDF', 'Portable Document Format'],
        ['POS', 'Point of Sale'],
        ['REST', 'Representational State Transfer'],
        ['SAC', 'Services Accounting Code'],
        ['SGST', 'State Goods and Services Tax'],
        ['SKU', 'Stock Keeping Unit'],
        ['SRS', 'Software Requirements Specification'],
        ['UI', 'User Interface'],
        ['UML', 'Unified Modeling Language'],
        ['UPI', 'Unified Payments Interface'],
        ['UTR', 'Unique Transaction Reference'],
        ['UX', 'User Experience'],
        ['VPA', 'Virtual Payment Address'],
      ],
      [25, 75]
    )
  );

  return elements;
};

module.exports = { getPreliminarySections };
