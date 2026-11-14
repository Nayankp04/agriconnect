const express = require('express');
const router = express.Router();
const {
  getLogisticsProfile,
  updateLogisticsProfile,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getLogisticsDashboard,
} = require('../controllers/logisticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/profile')
  .get(getLogisticsProfile)
  .post(updateLogisticsProfile)
  .put(updateLogisticsProfile);

router.route('/vehicles')
  .get(getVehicles)
  .post(authorize('LOGISTICS', 'ADMIN'), addVehicle);

router.route('/vehicles/:id')
  .put(authorize('LOGISTICS', 'ADMIN'), updateVehicle)
  .delete(authorize('LOGISTICS', 'ADMIN'), deleteVehicle);

router.get('/dashboard', getLogisticsDashboard);

module.exports = router;
