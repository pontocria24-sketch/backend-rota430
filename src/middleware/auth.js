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

// 🔥 ADMIN = NIVEL 1
function adminOnly(req, res, next) {
  if (!req.user || req.user.nivel !== 1) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

// 🔥 ADMIN OU MECANICO = NIVEL 1 OU 2
function adminOrMecanico(req, res, next) {
  if (!req.user || ![1, 2].includes(req.user.nivel)) {
    return res.status(403).json({ error: 'Acesso restrito a funcionários' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, adminOrMecanico };
