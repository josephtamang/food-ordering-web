const router = require('express').Router();
const controller = require('../controllers/CategoryController');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', protect, authorize('admin', 'staff'), upload.single('image'), (req, res) => controller.create(req, res));
router.put('/:id', protect, authorize('admin', 'staff'), upload.single('image'), (req, res) => controller.update(req, res));
router.delete('/:id', protect, authorize('admin'), (req, res) => controller.delete(req, res));

module.exports = router;
