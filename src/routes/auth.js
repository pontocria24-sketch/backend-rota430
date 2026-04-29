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

    // 🔎 Busca funcionário
    let result = await db.query(
      'SELECT id, nome, email, senha_hash, nivel FROM funcionarios WHERE email = $1',
      [email]
    );

    let user = result.rows[0];
    let nivel = user?.nivel;

    // 🔎 Se não achou, busca cliente
    if (!user) {
      result = await db.query(
        'SELECT id, nome, email, senha_hash FROM clientes WHERE email = $1 OR cpf_cnpj = $1',
        [email]
      );

      user = result.rows[0];
      nivel = 'cliente';
    }

    // ❌ Usuário não encontrado
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 🔐 Validação de senha
    if (!user.senha_hash) {
      return res.status(500).json({ error: 'Usuário sem senha cadastrada' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 🔑 Token
    const token = jwt.sign(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        nivel
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ Resposta
    return res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel,
      token
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
