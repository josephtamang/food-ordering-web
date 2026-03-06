const router = require('express').Router();
const controller = require('../controllers/CartController');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', (req, res) => controller.getCart(req, res));
router.post('/add', (req, res) => controller.addToCart(req, res));
router.put('/:productId', (req, res) => controller.updateCartItem(req, res));
router.delete('/:productId', (req, res) => controller.removeFromCart(req, res));
router.delete('/', (req, res) => controller.clearCart(req, res));

module.exports = router;
