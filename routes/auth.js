const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

const isEmail = () => {
  return body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }); // AI Refactor: Added normalizeEmail with conservative Gmail options to standardize casing and provider-specific quirks because validator was upgraded to 13.15.22 (via express-validator) which provides robust email normalization; this reduces duplicates without collapsing distinct Gmail addresses.
};

const isPassword = () => {
  return body('password', 'Please enter a password with only numbers and ' +
    'text and at least 5 characters.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim();
};

router.post(
  '/login', [
    isEmail(),
    isPassword()
  ],
  authController.postLogin
);

router.get('/signup', authController.getSignup);

router.post(
  '/signup', [
    isEmail()
      .custom(value => {
        return User.findOne({ email: value })
          .then(user => {
            if (user) {
              // The user already exists!
              // We return a promise rejection
              return Promise.reject(
                'E-Mail address already exists, please pick another one.');
            }
          });
      }),
    isPassword(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
