const Router = require('express');
const router = new Router();
const pointController = require('../controllers/pointController');

router.post('/', pointController.create);
router.get('/', pointController.getAll);
router.get('/:id', pointController.getOne);
router.delete('/:id', pointController.delete);
router.put('/:id', pointController.update);

module.exports = router;