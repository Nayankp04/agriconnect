const express = require('express');
const router = express.Router();
const {
  createProcurement,
  getProcurements,
  getProcurementById,
  updateProcurement,
  deleteProcurement,
  respondToProcurement,
  handleResponseStatus,
} = require('../controllers/procurementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getProcurements)
  .post(protect, authorize('FPO', 'BUYER', 'ADMIN'), createProcurement);

router.route('/:id')
  .get(getProcurementById)
  .put(protect, authorize('FPO', 'BUYER', 'ADMIN'), updateProcurement)
  .delete(protect, authorize('FPO', 'BUYER', 'ADMIN'), deleteProcurement);

router.post('/:id/respond', protect, respondToProcurement);
router.put('/:id/accept-response', protect, authorize('FPO', 'BUYER', 'ADMIN'), handleResponseStatus);

module.exports = router;
