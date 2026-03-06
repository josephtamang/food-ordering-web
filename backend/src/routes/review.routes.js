const router = require('express').Router();
const controller = require('../controllers/ReviewController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/product/:productId', (req, res) => controller.getByProduct(req, res));
router.post('/product/:productId', protect, (req, res) => controller.create(req, res));
router.put('/:id', protect, (req, res) => controller.update(req, res));
router.delete('/:id', protect, (req, res) => controller.delete(req, res));
router.get('/my-reviews', protect, (req, res) => controller.getMyReviews(req, res));
router.get('/', protect, authorize('admin'), (req, res) => controller.getAll(req, res));

module.exports = router;
