const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'ayd-admin-token';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (token && token === ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Autenticación de administrador requerida' });
}

module.exports = { requireAdmin };
