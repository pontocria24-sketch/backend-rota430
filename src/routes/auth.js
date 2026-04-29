const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // 🔎 Busca no USUARIOS (PADRÃO NOVO)
    const result = await db.query(
      'SELECT id, nome, email, senha_hash, nivel FROM usuarios WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // ❌ não encontrado
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 🔐 valida senha
    if (!user.senha_hash) {
      return res.status(500).json({ error: 'Usuário sem senha cadastrada' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 🔎 busca dados extras se for cliente
    let cliente = null;

    if (user.nivel === 3) {
      const clienteRes = await db.query(
        'SELECT * FROM clientes WHERE usuario_id = $1',
        [user.id]
      );
      cliente = clienteRes.rows[0] || null;
    }

    // 🔑 token
    const token = jwt.sign(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        nivel: user.nivel
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ resposta
    return res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
      token,
      cliente // opcional (usado no frontend depois)
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
