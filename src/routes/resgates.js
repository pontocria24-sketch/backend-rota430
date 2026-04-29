const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM resgates_brindes ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { cliente_id, brinde_id, pontos_usados } = req.body;
  const { rows } = await db.query(
    `INSERT INTO resgates_brindes (cliente_id, brinde_id, pontos_usados)
     VALUES ($1, $2, $3) RETURNING *`,
    [cliente_id, brinde_id, pontos_usados]
  );
  res.json(rows[0]);
});

module.exports = router;
