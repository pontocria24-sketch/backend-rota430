const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, nome, email, nivel }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.nivel !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

function adminOrMecanico(req, res, next) {
  if (!['admin', 'mecanico'].includes(req.user.nivel)) {
    return res.status(403).json({ error: 'Acesso restrito a funcionários' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, adminOrMecanico };
