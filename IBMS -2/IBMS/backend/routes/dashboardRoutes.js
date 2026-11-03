const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardCharts,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/revenue', getDashboardCharts);

module.exports = router;
