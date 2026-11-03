const express = require('express');
const router = express.Router();
const {
  getBusinessProfile,
  updateBusinessProfile,
} = require('../controllers/businessProfileController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getBusinessProfile)
  .put(protect, updateBusinessProfile);

module.exports = router;
