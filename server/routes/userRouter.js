const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/AuthMiddleware');
const checkRole = require("../middleware/checkRoleMiddleware");

router.post('/users', userController.getAll);
router.post('/pageCount', userController.getPageCount);
router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.post('/score', userController.updateScore);
router.get('/auth', authMiddleware, userController.check);
router.get('/parSet/:id', userController.getParSet);
router.get('/parSet/:userId/:parSetId', userController.getScore);
router.get('/:id', userController.getOne);
router.delete('/:id', checkRole("ADMIN"), userController.delete);
router.put('/:id', checkRole("ADMIN"), userController.update);

module.exports = router;