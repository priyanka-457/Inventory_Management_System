const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/category-distribution', analyticsController.getCategoryDistribution);
router.get('/top-items', analyticsController.getTopItems);
router.get('/total-value', analyticsController.getTotalValue);
router.get('/low-stock', analyticsController.getLowStockItems);

module.exports = router;