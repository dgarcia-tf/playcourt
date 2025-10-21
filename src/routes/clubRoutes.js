const express = require('express');
const { body } = require('express-validator');
const { getClubProfile, updateClubProfile } = require('../controllers/clubController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { isValidImageDataUrl } = require('../utils/validators');

const router = express.Router();

router.get('/', authenticate, getClubProfile);

router.put(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name').optional().isString().trim().isLength({ min: 3 }),
    body('slogan').optional().isString().trim().isLength({ max: 140 }),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('address').optional().isString().trim().isLength({ max: 200 }),
    body('contactEmail').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('contactPhone').optional().isString().trim().isLength({ max: 40 }),
    body('website').optional().isString().trim().isLength({ max: 200 }),
    body('regulation').optional().isString().trim().isLength({ max: 5000 }),
    body('tournamentRegulation').optional().isString().trim().isLength({ max: 5000 }),
    body('logo')
      .optional({ checkFalsy: true })
      .custom((value) => isValidImageDataUrl(value))
      .withMessage('El logotipo debe ser una imagen en Base64 válida de hasta 2 MB.'),
    body('schedules').optional().isArray(),
    body('schedules.*.label').optional().isString().trim().isLength({ min: 3, max: 80 }),
    body('schedules.*.opensAt').optional().isString().trim().isLength({ max: 10 }),
    body('schedules.*.closesAt').optional().isString().trim().isLength({ max: 10 }),
    body('courts').optional().isArray(),
    body('courts.*.name').optional().isString().trim().isLength({ min: 2, max: 80 }),
    body('courts.*.surface').optional().isString().trim().isLength({ max: 40 }),
    body('courts.*.notes').optional().isString().trim().isLength({ max: 200 }),
    body('facilities').optional().isArray(),
    body('facilities.*').optional().isString().trim().isLength({ max: 80 }),
  ],
  updateClubProfile
);

module.exports = router;
