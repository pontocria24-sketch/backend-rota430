const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM logs ORDER BY created_at DESC');
  res.json(rows);
});

module.exports = router;
