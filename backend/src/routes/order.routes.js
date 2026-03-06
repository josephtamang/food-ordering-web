const router = require('express').Router();
const controller = require('../controllers/OrderController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', (req, res) => controller.create(req, res));
router.get('/my-orders', (req, res) => controller.getMyOrders(req, res));
router.get('/all', authorize('admin', 'staff'), (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.put('/:id/status', authorize('admin', 'staff'), (req, res) => controller.updateStatus(req, res));

module.exports = router;
