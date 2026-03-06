const router = require('express').Router();
const controller = require('../controllers/UserController');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/', (req, res) => controller.getUsers(req, res));
router.post('/', (req, res) => controller.createUser(req, res));
// Sub-resource routes before single-param routes
router.get('/:id/orders', (req, res) => controller.getUserOrders(req, res));
router.get('/:id', (req, res) => controller.getUserById(req, res));
router.put('/:id/role', (req, res) => controller.updateUserRole(req, res));
router.put('/:id', (req, res) => controller.updateUser(req, res));
router.delete('/:id', (req, res) => controller.deleteUser(req, res));

module.exports = router;
