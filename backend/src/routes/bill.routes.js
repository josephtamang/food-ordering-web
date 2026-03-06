const router = require('express').Router();
const controller = require('../controllers/BillController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
// Specific routes before parameterized routes
router.get('/my-bills', (req, res) => controller.getMyBills(req, res));
router.get('/', authorize('admin', 'staff'), (req, res) => controller.getAll(req, res));
// Parameterized routes
router.post('/:orderId/request', (req, res) => controller.requestBill(req, res));
router.post('/:orderId', authorize('admin', 'staff'), (req, res) => controller.generate(req, res));
router.get('/:id/pdf', (req, res) => controller.downloadPDF(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.put('/:id/pay', (req, res) => controller.markPaid(req, res));

module.exports = router;
