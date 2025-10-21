const jwt = require('jsonwebtoken');
const { User, userHasRole } = require('../models/User');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function authorizeRoles(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user || !roles.some((role) => userHasRole(req.user, role))) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};
