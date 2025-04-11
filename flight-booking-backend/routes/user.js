const router = require('express').Router();
const userController = require('../controllers/userController');
const authAdmin = require('../middleware/authAdmin');

// Routes quản lý user (yêu cầu quyền admin)
router.get('/', authAdmin, userController.getAllUsers);
router.get('/:id', authAdmin, userController.getUserById);
router.post('/', authAdmin, userController.createUser);
router.put('/:id', authAdmin, userController.updateUser);
router.delete('/:id', authAdmin, userController.deleteUser);

module.exports = router; 