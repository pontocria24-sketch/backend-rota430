const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET - listar serviços
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        id,
        nome,
        descricao,
        preco_base AS preco,
        created_at
      FROM servicos
      ORDER BY nome
    `);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar serviços:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST - criar serviço
router.post('/', async (req, res) => {
  try {
    // 🔐 PERMISSÃO CORRETA (AQUI dentro!)
    if (req.user.nivel !== 1 && req.user.nivel !== 2) {
      return res.status(403).json({ error: 'Sem permissão para criar serviço' });
    }

    const { nome, descricao, preco } = req.body;

    const { rows } = await db.query(`
      INSERT INTO servicos (nome, descricao, preco_base)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        nome,
        descricao,
        preco_base AS preco,
        created_at
    `, [nome, descricao, preco]);

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('Erro ao criar serviço:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
