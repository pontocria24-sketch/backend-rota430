const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM alertas ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { titulo, descricao } = req.body;
  const { rows } = await db.query(
    'INSERT INTO alertas (titulo, descricao) VALUES ($1, $2) RETURNING *',
    [titulo, descricao]
  );
  res.json(rows[0]);
});

module.exports = router;
