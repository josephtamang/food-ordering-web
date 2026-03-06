const router = require('express').Router();
const controller = require('../controllers/StatsController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/dashboard', protect, authorize('admin', 'staff'), (req, res) => controller.getDashboardStats(req, res));

module.exports = router;
