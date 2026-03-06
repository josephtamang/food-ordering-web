const router = require('express').Router();
const controller = require('../controllers/AuthController');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/register', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));
router.get('/logout', (req, res) => controller.logout(req, res));
router.get('/me', protect, (req, res) => controller.getMe(req, res));
router.put('/me', protect, (req, res) => controller.updateProfile(req, res));
router.put('/me/avatar', protect, upload.single('avatar'), (req, res) => controller.updateAvatar(req, res));
router.put('/update-password', protect, (req, res) => controller.updatePassword(req, res));
router.post('/forgot-password', (req, res) => controller.forgotPassword(req, res));
router.put('/reset-password/:resetToken', (req, res) => controller.resetPassword(req, res));

module.exports = router;
