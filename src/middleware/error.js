function notFound(req, res) {
  res.status(404).json({ ok: false, error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Server error',
  });
}

module.exports = { notFound, errorHandler };
