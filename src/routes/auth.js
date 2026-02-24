const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' });
    }

    // Tenta encontrar como funcionário (por email)
    let result = await db.query(
      'SELECT id, nome, email, senha, nivel FROM funcionarios WHERE email = $1',
      [login]
    );

    let user = result.rows[0];
    let nivel = user?.nivel;

    // Se não achou, tenta como cliente (por email ou cpf_cnpj)
    if (!user) {
      result = await db.query(
        'SELECT id, nome, email, senha, cpf_cnpj FROM clientes WHERE email = $1 OR cpf_cnpj = $1',
        [login]
      );
      user = result.rows[0];
      nivel = 'cliente';
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, nivel },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivel,
      token,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
