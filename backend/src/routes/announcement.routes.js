const router = require('express').Router();
const controller = require('../controllers/AnnouncementController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public - active announcements for customers
router.get('/', (req, res) => controller.getActive(req, res));

// Admin/staff - all announcements
router.get('/all', protect, authorize('admin', 'staff'), (req, res) => controller.getAll(req, res));

// Admin/staff - create
router.post('/', protect, authorize('admin', 'staff'), (req, res) => controller.create(req, res));

// Admin/staff - update
router.put('/:id', protect, authorize('admin', 'staff'), (req, res) => controller.update(req, res));

// Admin/staff - delete
router.delete('/:id', protect, authorize('admin', 'staff'), (req, res) => controller.delete(req, res));

module.exports = router;
