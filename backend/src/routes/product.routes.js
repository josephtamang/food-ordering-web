const router = require('express').Router();
const controller = require('../controllers/ProductController');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Public endpoints
router.get('/featured-items', (req, res) => controller.getFeatured(req, res));
router.get('/hot-deals', (req, res) => controller.getHotDeals(req, res));
router.get('/daily-specials', (req, res) => controller.getDailySpecials(req, res));
router.get('/chef-specials', (req, res) => controller.getChefSpecials(req, res));
router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));

// Admin/Staff endpoints
router.post('/', protect, authorize('admin', 'staff'), upload.single('image'), (req, res) => controller.create(req, res));
router.put('/:id', protect, authorize('admin', 'staff'), upload.single('image'), (req, res) => controller.update(req, res));
router.put('/:id/toggle-featured', protect, authorize('admin', 'staff'), (req, res) => controller.toggleFeatured(req, res));
router.put('/:id/toggle-hot-deal', protect, authorize('admin', 'staff'), (req, res) => controller.toggleHotDeal(req, res));
router.put('/:id/toggle-daily-special', protect, authorize('admin', 'staff'), (req, res) => controller.toggleDailySpecial(req, res));
router.put('/:id/toggle-chef-special', protect, authorize('admin', 'staff'), (req, res) => controller.toggleChefSpecial(req, res));
router.put('/:id/set-discount', protect, authorize('admin', 'staff'), (req, res) => controller.setDiscount(req, res));
router.delete('/:id', protect, authorize('admin'), (req, res) => controller.delete(req, res));
router.delete('/:id/remove-discount', protect, authorize('admin', 'staff'), (req, res) => controller.removeDiscount(req, res));

module.exports = router;
