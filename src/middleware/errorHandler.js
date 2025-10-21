function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: 'Recurso no encontrado',
    path: req.originalUrl,
    method: req.method,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ message });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
