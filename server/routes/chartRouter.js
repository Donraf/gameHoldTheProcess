const Router = require('express');
const router = new Router();
const chartController = require('../controllers/chartController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', chartController.create);
router.get('/', chartController.getAll);
router.get('/:id', chartController.getOne);
router.delete('/:id', checkRole("ADMIN"), chartController.delete);
router.put('/:id', checkRole("ADMIN"), chartController.update);

module.exports = router;