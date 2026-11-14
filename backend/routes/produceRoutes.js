const express = require('express');
const router = express.Router();
const {
  createProduce,
  getProduces,
  getProduceById,
  updateProduce,
  deleteProduce,
  updateProduceStock,
} = require('../controllers/produceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getProduces)
  .post(protect, authorize('FARMER', 'ADMIN'), createProduce);

router.route('/:id')
  .get(getProduceById)
  .put(protect, authorize('FARMER', 'ADMIN'), updateProduce)
  .patch(protect, authorize('FARMER', 'ADMIN'), updateProduceStock)
  .delete(protect, authorize('FARMER', 'ADMIN'), deleteProduce);

router.patch('/:id/stock', protect, authorize('FARMER', 'ADMIN'), updateProduceStock);

module.exports = router;
