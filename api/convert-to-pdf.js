/**
 * Excel to PDF Conversion API
 *
 * This serverless function converts Excel workbooks to PDF format.
 * Receives an Excel buffer, parses it with exceljs, and renders as PDF using pdfkit.
 *
 * Used by the invoice generation feature to create professional PDF invoices
 * from populated Excel templates.
 */

import { Workbook } from 'exceljs';
import PDFDocument from 'pdfkit';
import { handleCors } from './_cors.js';

export default async function handler(req, res) {
  // Handle CORS and preflight
  if (!handleCors(req, res, { methods: 'POST, OPTIONS' })) {
    return; // CORS handled or request rejected
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read Excel buffer from request body
    const excelBuffer = req.body;

    if (!excelBuffer || excelBuffer.length === 0) {
      return res.status(400).json({ error: 'No Excel data provided' });
    }

    // Parse Excel file with exceljs
    const workbook = new Workbook();
    await workbook.xlsx.load(excelBuffer);

    if (workbook.worksheets.length === 0) {
      return res.status(400).json({ error: 'Excel file has no worksheets' });
    }

    // Get first worksheet
    const worksheet = workbook.worksheets[0];

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // Collect PDF chunks
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Handle PDF completion
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    });

    // Render Excel data to PDF
    renderWorksheetToPDF(doc, worksheet);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF conversion error:', error);
    return res.status(500).json({
      error: 'PDF conversion failed',
      details: error.message
    });
  }
}

/**
 * Render Excel worksheet to PDF document
 * @param {PDFDocument} doc - PDFKit document
 * @param {Worksheet} worksheet - ExcelJS worksheet
 */
function renderWorksheetToPDF(doc, worksheet) {
  const pageWidth = doc.page.width - 80; // Account for margins
  const pageHeight = doc.page.height - 80;
  const startX = 40;
  const startY = 40;
  const minCellWidth = 50;
  const maxCellWidth = 150;
  const defaultCellHeight = 18;
  const fontSize = 9;

  // Calculate column widths from Excel
  const columnWidths = calculateColumnWidths(worksheet, pageWidth, minCellWidth, maxCellWidth);

  // Set default font
  doc.font('Helvetica').fontSize(fontSize);

  let currentY = startY;
  const renderedRows = new Set(); // Track rendered rows for merged cells

  // Iterate through rows
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Calculate row height based on content
    const rowHeight = calculateRowHeight(row, columnWidths, defaultCellHeight);

    // Check if we need a new page
    if (currentY + rowHeight > pageHeight) {
      doc.addPage();
      currentY = startY;
    }

    let currentX = startX;

    // Iterate through cells in row
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colWidth = columnWidths[colNumber - 1] || minCellWidth;

      // Skip if this is part of a merged cell that was already rendered
      if (cell.master && cell.address !== cell.master.address) {
        currentX += colWidth;
        return;
      }

      const value = getCellDisplayValue(cell);

      // Draw cell border
      doc
        .rect(currentX, currentY, colWidth, rowHeight)
        .stroke();

      // Apply cell formatting
      let textOptions = {
        width: colWidth - 6,
        align: getAlignment(cell),
        lineBreak: true
      };

      // Apply font weight
      if (cell.font?.bold) {
        doc.font('Helvetica-Bold');
      } else {
        doc.font('Helvetica');
      }

      // Apply font size
      const cellFontSize = Math.min(cell.font?.size || fontSize, 12);
      doc.fontSize(cellFontSize);

      // Apply background color if exists
      if (cell.fill && cell.fill.fgColor) {
        const color = getRGBColor(cell.fill.fgColor);
        if (color) {
          doc.fillColor(color)
             .rect(currentX, currentY, colWidth, rowHeight)
             .fill();
          doc.fillColor('black'); // Reset to black for text
        }
      }

      // Draw cell text
      const textY = currentY + 3;
      doc.text(
        value,
        currentX + 3,
        textY,
        textOptions
      );

      currentX += colWidth;
    });

    currentY += rowHeight;
  });

  // Reset font
  doc.font('Helvetica').fontSize(fontSize);
}

/**
 * Calculate column widths from Excel, scaled to fit page
 * @param {Worksheet} worksheet
 * @param {number} pageWidth
 * @param {number} minWidth
 * @param {number} maxWidth
 * @returns {number[]} Array of column widths
 */
function calculateColumnWidths(worksheet, pageWidth, minWidth, maxWidth) {
  const widths = [];
  let totalWidth = 0;

  // Get column widths from Excel
  worksheet.columns.forEach((col, index) => {
    let width = col.width ? col.width * 7 : 70; // Excel width units to pixels
    width = Math.max(minWidth, Math.min(maxWidth, width));
    widths.push(width);
    totalWidth += width;
  });

  // Scale widths to fit page if necessary
  if (totalWidth > pageWidth) {
    const scale = pageWidth / totalWidth;
    return widths.map(w => w * scale);
  }

  return widths;
}

/**
 * Calculate row height based on content
 * @param {Row} row
 * @param {number[]} columnWidths
 * @param {number} defaultHeight
 * @returns {number} Calculated height
 */
function calculateRowHeight(row, columnWidths, defaultHeight) {
  let maxHeight = defaultHeight;

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const value = getCellDisplayValue(cell);
    const colWidth = columnWidths[colNumber - 1] || 70;

    // Estimate height based on text length and column width
    const charsPerLine = Math.floor(colWidth / 6); // Rough estimate
    const lines = Math.ceil(value.length / charsPerLine);
    const estimatedHeight = lines * 14; // Line height

    maxHeight = Math.max(maxHeight, Math.min(estimatedHeight, 100));
  });

  return maxHeight;
}

/**
 * Get cell alignment
 * @param {Cell} cell
 * @returns {string} 'left', 'center', or 'right'
 */
function getAlignment(cell) {
  if (cell.alignment && cell.alignment.horizontal) {
    const h = cell.alignment.horizontal;
    if (h === 'center') return 'center';
    if (h === 'right') return 'right';
  }

  // Default alignment based on cell type
  if (cell.type === 2 || (cell.numFmt && cell.numFmt.includes('$'))) {
    return 'right';
  }

  return 'left';
}

/**
 * Get RGB color from Excel color object
 * @param {object} colorObj
 * @returns {string|null} RGB color string or null
 */
function getRGBColor(colorObj) {
  if (!colorObj) return null;

  if (colorObj.argb) {
    // ARGB format (ignore alpha)
    const hex = colorObj.argb.substring(2); // Remove alpha
    return `#${hex}`;
  }

  return null;
}

/**
 * Get display value from Excel cell
 * @param {Cell} cell - ExcelJS cell object
 * @returns {string} Formatted cell value
 */
function getCellDisplayValue(cell) {
  if (!cell.value) return '';

  // Handle different cell types
  switch (cell.type) {
    case 2: // Number
      // Format currency
      if (cell.numFmt && cell.numFmt.includes('$')) {
        const num = parseFloat(cell.value);
        return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      }
      // Format regular numbers with commas
      if (cell.numFmt && (cell.numFmt.includes('#,##0') || cell.numFmt.includes('0.00'))) {
        const num = parseFloat(cell.value);
        const decimals = cell.numFmt.includes('.') ? 2 : 0;
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      return String(cell.value);

    case 3: // String
      return String(cell.value);

    case 4: // Date
      const date = new Date(cell.value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

    case 5: // Hyperlink
      return cell.value.text || cell.value.hyperlink || '';

    case 6: // Formula
      return String(cell.result || '');

    default:
      return String(cell.value);
  }
}

// Export configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Allow up to 10MB for Excel files
    }
  }
};
