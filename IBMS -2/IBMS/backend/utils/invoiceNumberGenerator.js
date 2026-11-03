const BusinessProfile = require('../models/BusinessProfile');
const Invoice = require('../models/Invoice');

const generateNextInvoiceNumber = async (userId) => {
  const currentYear = new Date().getFullYear();
  
  // Find business profile to get prefix
  let profile = await BusinessProfile.findOne({ user: userId });
  const prefix = profile?.invoicePrefix || 'INV';

  // Find last created invoice for this user
  const lastInvoice = await Invoice.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let nextSequence = 1001;

  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  let invoiceNumber = `${prefix}-${currentYear}-${nextSequence}`;

  // Double check uniqueness in case of race condition
  let exists = await Invoice.findOne({ user: userId, invoiceNumber });
  while (exists) {
    nextSequence += 1;
    invoiceNumber = `${prefix}-${currentYear}-${nextSequence}`;
    exists = await Invoice.findOne({ user: userId, invoiceNumber });
  }

  return invoiceNumber;
};

module.exports = {
  generateNextInvoiceNumber,
};
