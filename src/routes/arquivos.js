const { Router } = require('express');
const db = require('../db');
const upload = require('../config/upload');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

// 📤 UPLOAD DE ARQUIVO
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { ordem_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const { rows } = await db.query(`
      INSERT INTO arquivos_os (ordem_id, nome, url, tipo, tamanho)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      ordem_id,
      file.originalname,
      `/uploads/${file.filename}`,
      file.mimetype,
      file.size
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar arquivo:', err);
    res.status(500).json({ error: 'Erro ao salvar arquivo' });
  }
});

// 📥 LISTAR ARQUIVOS DA OS
router.get('/:ordem_id', authMiddleware, async (req, res) => {
  try {
    const { ordem_id } = req.params;

    const { rows } = await db.query(`
      SELECT * FROM arquivos_os
      WHERE ordem_id = $1
      ORDER BY created_at DESC
    `, [ordem_id]);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar arquivos:', err);
    res.status(500).json({ error: 'Erro ao buscar arquivos' });
  }
});

module.exports = router;


// 🔎 LISTAR ARQUIVOS POR ORDEM
router.get('/:ordem_id', async (req, res) => {
  try {
    const { ordem_id } = req.params;

    const { rows } = await db.query(
      'SELECT * FROM arquivos_os WHERE ordem_id = $1 ORDER BY created_at DESC',
      [ordem_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar arquivos' });
  }
});
