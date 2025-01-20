const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/AuthMiddleware');
const checkRole = require("../middleware/checkRoleMiddleware");

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.get('/auth', authMiddleware, userController.check);
router.get('/', userController.getAll);
router.get('/:id', userController.getOne);
router.delete('/:id', checkRole("ADMIN"), userController.delete);
router.put('/:id', checkRole("ADMIN"), userController.update);

module.exports = router;