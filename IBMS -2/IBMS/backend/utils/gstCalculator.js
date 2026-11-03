/**
 * Indian GST Tax Calculation Engine
 * 
 * Rules:
 * - Intra-State supply (Business State === Place of Supply): CGST (half) + SGST (half)
 * - Inter-State supply (Business State !== Place of Supply): IGST (full)
 * - Handles tax-exempt / 0%, 5%, 12%, 18%, 28% GST rates
 * - Proper financial rounding to 2 decimal places
 */

const round = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const normalizeState = (state) => {
  if (!state) return '';
  return state.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const calculateInvoiceGst = ({ businessState, placeOfSupply, items }) => {
  const isInterState = normalizeState(businessState) !== normalizeState(placeOfSupply);

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableSubtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const processedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const itemRawTotal = round(quantity * unitPrice);

    let discountAmount = 0;
    const discountValue = Number(item.discountValue) || 0;
    if (item.discountType === 'percentage') {
      discountAmount = round((itemRawTotal * Math.min(discountValue, 100)) / 100);
    } else {
      discountAmount = round(Math.min(discountValue, itemRawTotal));
    }

    const taxableAmount = round(Math.max(0, itemRawTotal - discountAmount));
    const gstRate = [0, 5, 12, 18, 28].includes(Number(item.gstRate)) ? Number(item.gstRate) : 18;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = gstRate;
      igstAmount = round((taxableAmount * igstRate) / 100);
    } else {
      cgstRate = round(gstRate / 2);
      sgstRate = round(gstRate / 2);
      cgstAmount = round((taxableAmount * cgstRate) / 100);
      sgstAmount = round((taxableAmount * sgstRate) / 100);
    }

    const totalTaxAmount = round(cgstAmount + sgstAmount + igstAmount);
    const totalAmount = round(taxableAmount + totalTaxAmount);

    subtotal += itemRawTotal;
    totalDiscount += discountAmount;
    taxableSubtotal += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;

    return {
      product: item.product || null,
      name: item.name ? item.name.trim() : 'Item',
      description: item.description ? item.description.trim() : '',
      hsnCode: item.hsnCode ? item.hsnCode.trim() : '',
      unit: item.unit || 'PCS',
      quantity,
      unitPrice,
      discountType: item.discountType || 'percentage',
      discountValue,
      discountAmount,
      taxableAmount,
      gstRate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTaxAmount,
      totalAmount,
    };
  });

  subtotal = round(subtotal);
  totalDiscount = round(totalDiscount);
  taxableSubtotal = round(taxableSubtotal);
  totalCgst = round(totalCgst);
  totalSgst = round(totalSgst);
  totalIgst = round(totalIgst);

  const totalTax = round(totalCgst + totalSgst + totalIgst);
  const grandTotal = round(taxableSubtotal + totalTax);

  return {
    isInterState,
    items: processedItems,
    subtotal,
    totalDiscount,
    taxableSubtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    grandTotal,
  };
};

module.exports = {
  round,
  normalizeState,
  calculateInvoiceGst,
};
