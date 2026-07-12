const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupValidator, loginValidator } = require('../validators/authValidators');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/signup', signupValidator, authController.signup);
router.post('/login', loginValidator, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
