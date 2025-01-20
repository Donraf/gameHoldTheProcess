const Router = require('express');
const router = new Router();
const userRouter = require('./userRouter');
const chartRouter = require('./chartRouter');
const pointRouter = require('./pointRouter');

router.use('/user', userRouter);
router.use('/chart', chartRouter);
router.use('/point', pointRouter);

module.exports = router;