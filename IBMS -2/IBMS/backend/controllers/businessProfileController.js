const BusinessProfile = require('../models/BusinessProfile');

// @desc    Get current user's business profile
// @route   GET /api/business-profile
// @access  Private
const getBusinessProfile = async (req, res, next) => {
  try {
    let profile = await BusinessProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = await BusinessProfile.create({
        user: req.user._id,
        businessName: req.user.businessName || `${req.user.name}'s Enterprises`,
        email: req.user.email,
        phone: req.user.phone || '',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business profile
// @route   PUT /api/business-profile
// @access  Private
const updateBusinessProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      legalName,
      email,
      phone,
      gstin,
      pan,
      address,
      city,
      state,
      postalCode,
      country,
      currency,
      currencySymbol,
      invoicePrefix,
      defaultPaymentTerms,
      defaultNotes,
      bankDetails,
      logoUrl,
    } = req.body;

    let profile = await BusinessProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new BusinessProfile({ user: req.user._id });
    }

    if (businessName) profile.businessName = businessName.trim();
    if (legalName !== undefined) profile.legalName = legalName.trim();
    if (email !== undefined) profile.email = email.trim();
    if (phone !== undefined) profile.phone = phone.trim();
    if (gstin !== undefined) profile.gstin = gstin.trim().toUpperCase();
    if (pan !== undefined) profile.pan = pan.trim().toUpperCase();
    if (address !== undefined) profile.address = address.trim();
    if (city !== undefined) profile.city = city.trim();
    if (state !== undefined) profile.state = state.trim();
    if (postalCode !== undefined) profile.postalCode = postalCode.trim();
    if (country !== undefined) profile.country = country.trim();
    if (currency !== undefined) profile.currency = currency.trim();
    if (currencySymbol !== undefined) profile.currencySymbol = currencySymbol.trim();
    if (invoicePrefix !== undefined) profile.invoicePrefix = invoicePrefix.trim().toUpperCase();
    if (defaultPaymentTerms !== undefined) profile.defaultPaymentTerms = defaultPaymentTerms.trim();
    if (defaultNotes !== undefined) profile.defaultNotes = defaultNotes.trim();
    if (logoUrl !== undefined) profile.logoUrl = logoUrl;

    if (bankDetails) {
      profile.bankDetails = {
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName.trim() : profile.bankDetails?.bankName,
        accountHolder: bankDetails.accountHolder !== undefined ? bankDetails.accountHolder.trim() : profile.bankDetails?.accountHolder,
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber.trim() : profile.bankDetails?.accountNumber,
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode.trim().toUpperCase() : profile.bankDetails?.ifscCode,
        branch: bankDetails.branch !== undefined ? bankDetails.branch.trim() : profile.bankDetails?.branch,
        upiId: bankDetails.upiId !== undefined ? bankDetails.upiId.trim() : profile.bankDetails?.upiId,
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinessProfile,
  updateBusinessProfile,
};
