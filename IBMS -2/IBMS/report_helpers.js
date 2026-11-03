const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ShadingType,
} = require('docx');

console.log('Starting Academic Report Generator for Billing and Invoice Management System (IBMS)...');

// Standard styles and colors
const FONT_FAMILY = 'Times New Roman';
const PRIMARY_COLOR = '0F172A'; // Navy Blue
const HEADER_BG = '1E293B';     // Dark Slate
const ROW_ALT_BG = 'F8FAFC';    // Subtle gray
const BORDER_COLOR = 'CBD5E1';  // Light border

// Helper functions for paragraphs
const p = (text, options = {}) => {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: {
      line: options.lineSpacing || 360, // 1.5 line spacing
      before: options.before !== undefined ? options.before : 0,
      after: options.after !== undefined ? options.after : 120, // 6pt after
    },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: options.size || 24, // 12pt (size is in half-points)
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || '1E293B',
      }),
    ],
  });
};

const pMulti = (runs, options = {}) => {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: {
      line: options.lineSpacing || 360,
      before: options.before !== undefined ? options.before : 0,
      after: options.after !== undefined ? options.after : 120,
    },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          font: FONT_FAMILY,
          size: r.size || 24,
          bold: r.bold || false,
          italics: r.italics || false,
          color: r.color || '1E293B',
        })
    ),
  });
};

const h1 = (text, pageBreakBefore = true) => {
  return new Paragraph({
    pageBreakBefore: pageBreakBefore,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 180 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT_FAMILY,
        size: 28, // 14pt bold
        bold: true,
        color: PRIMARY_COLOR,
      }),
    ],
  });
};

const h2 = (text) => {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 26, // 13pt bold
        bold: true,
        color: '0F172A',
      }),
    ],
  });
};

const h3 = (text) => {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 24, // 12pt bold
        bold: true,
        color: '1E293B',
      }),
    ],
  });
};

const bullet = (title, description) => {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 40, after: 80 },
    bullet: { level: 0 },
    children: [
      new TextRun({
        text: title + ': ',
        font: FONT_FAMILY,
        size: 24,
        bold: true,
        color: '0F172A',
      }),
      new TextRun({
        text: description,
        font: FONT_FAMILY,
        size: 24,
        color: '1E293B',
      }),
    ],
  });
};

const codeBox = (codeLines) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 12, color: '0284C7' },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            },
            children: codeLines.map(
              (line) =>
                new Paragraph({
                  spacing: { line: 240, before: 20, after: 20 },
                  children: [
                    new TextRun({
                      text: line,
                      font: 'Consolas',
                      size: 19, // 9.5pt
                      color: '0F172A',
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
    ],
  });
};

const createTable = (headers, rows, colWidths = []) => {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => {
        const cellOpts = {
          shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: h,
                  font: FONT_FAMILY,
                  size: 22, // 11pt bold
                  bold: true,
                  color: 'FFFFFF',
                }),
              ],
            }),
          ],
        };
        if (colWidths[i]) {
          cellOpts.width = { size: colWidths[i], type: WidthType.PERCENTAGE };
        }
        return new TableCell(cellOpts);
      }),
    })
  );

  // Data Rows
  rows.forEach((row, rowIdx) => {
    const isAlt = rowIdx % 2 === 1;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, i) => {
          const cellOpts = {
            shading: isAlt ? { fill: ROW_ALT_BG, type: ShadingType.CLEAR } : undefined,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            },
            children: [
              new Paragraph({
                alignment: i === 0 && row.length > 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { line: 280, before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: cellText,
                    font: FONT_FAMILY,
                    size: 21, // 10.5pt
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          };
          if (colWidths[i]) {
            cellOpts.width = { size: colWidths[i], type: WidthType.PERCENTAGE };
          }
          return new TableCell(cellOpts);
        }),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
};

module.exports = {
  p,
  pMulti,
  h1,
  h2,
  h3,
  bullet,
  codeBox,
  createTable,
  FONT_FAMILY,
  PRIMARY_COLOR,
};
