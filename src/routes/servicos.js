const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM servicos ORDER BY nome');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { nome, preco } = req.body;
  const { rows } = await db.query(
    'INSERT INTO servicos (nome, preco) VALUES ($1, $2) RETURNING *',
    [nome, preco]
  );
  res.json(rows[0]);
});

module.exports = router;
