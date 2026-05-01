const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ayd.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'ayd-admin-token';

function login(req, res) {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({
      token: ADMIN_TOKEN,
      user: { email: ADMIN_EMAIL },
    });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (token && token === ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Autenticación de administrador requerida' });
}

module.exports = { login, requireAdmin };
