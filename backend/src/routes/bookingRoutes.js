const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/resources/:id/bookings', authenticate, bookingController.getResourceBookings);
router.post('/', authenticate, bookingController.createBooking);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);
router.put('/:id/reschedule', authenticate, bookingController.rescheduleBooking);

module.exports = router;
