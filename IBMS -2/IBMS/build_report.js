const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
} = require('docx');

const { FONT_FAMILY } = require('./report_helpers');
const { getPreliminarySections } = require('./report_sections_prelim');
const { getChapter1And2 } = require('./report_sections_ch1_ch2');
const { getChapter3 } = require('./report_sections_ch3');
const { getChapter4 } = require('./report_sections_ch4');
const { getChapter5And6 } = require('./report_sections_ch5_ch6');

console.log('===============================================================');
console.log('ASSEMBLING FULL ACADEMIC PROJECT REPORT (IBMS)');
console.log('===============================================================\n');

const prelimElements = getPreliminarySections();
console.log(`✓ Preliminary sections loaded (${prelimElements.length} elements)`);

const ch1ch2Elements = getChapter1And2();
console.log(`✓ Chapters 1 & 2 loaded (${ch1ch2Elements.length} elements)`);

const ch3Elements = getChapter3();
console.log(`✓ Chapter 3 loaded (${ch3Elements.length} elements)`);

const ch4Elements = getChapter4();
console.log(`✓ Chapter 4 loaded (${ch4Elements.length} elements)`);

const ch5ch6Elements = getChapter5And6();
console.log(`✓ Chapters 5, 6, References & Appendices loaded (${ch5ch6Elements.length} elements)`);

const allChildren = [
  ...prelimElements,
  ...ch1ch2Elements,
  ...ch3Elements,
  ...ch4Elements,
  ...ch5ch6Elements,
];

console.log(`\nTotal report elements: ${allChildren.length}`);

// Document definition with academic formatting
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: FONT_FAMILY,
          size: 24, // 12pt
          color: '1E293B',
        },
        paragraph: {
          spacing: {
            line: 360, // 1.5 line spacing
            after: 120, // 6pt after
          },
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,    // 1.0 inch
            bottom: 1440, // 1.0 inch
            left: 1800,   // 1.25 inch (binding gutter)
            right: 1440,  // 1.0 inch
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: 'Billing and Invoice Management System (IBMS)',
                  font: FONT_FAMILY,
                  size: 18, // 9pt
                  italics: true,
                  color: '64748B',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120 },
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT_FAMILY,
                  size: 20, // 10pt
                  color: '64748B',
                }),
              ],
            }),
          ],
        }),
      },
      children: allChildren,
    },
  ],
});

const outputDocxPath = path.join(__dirname, 'Billing_and_Invoice_Management_System_Project_Report.docx');
const outputPdfPath = path.join(__dirname, 'Billing_and_Invoice_Management_System_Project_Report.pdf');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputDocxPath, buffer);
  const stats = fs.statSync(outputDocxPath);
  console.log(`\n✓ Successfully generated DOCX report:`);
  console.log(`  File: ${outputDocxPath}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);

  console.log('\nConverting DOCX to PDF using native Microsoft Word COM automation...');
  const psScript = `
    $ErrorActionPreference = 'Stop'
    $docxPath = '${outputDocxPath.replace(/\\/g, '\\\\')}'
    $pdfPath = '${outputPdfPath.replace(/\\/g, '\\\\')}'
    
    Write-Host "Opening Word application..."
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    try {
      Write-Host "Opening document: $docxPath"
      $doc = $word.Documents.Open($docxPath)
      Write-Host "Exporting to PDF: $pdfPath"
      # wdFormatPDF = 17
      $doc.SaveAs([ref]$pdfPath, [ref]17)
      $doc.Close()
      Write-Host "PDF Export completed successfully."
    } finally {
      $word.Quit()
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
  `;

  try {
    const psResult = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
    });
    console.log(psResult);

    if (fs.existsSync(outputPdfPath)) {
      const pdfStats = fs.statSync(outputPdfPath);
      console.log(`✓ Successfully generated PDF report:`);
      console.log(`  File: ${outputPdfPath}`);
      console.log(`  Size: ${(pdfStats.size / 1024).toFixed(2)} KB`);
    } else {
      console.error('✗ PDF file was not created.');
    }
  } catch (err) {
    console.error('✗ Error during PDF conversion:', err.message);
  }
});
