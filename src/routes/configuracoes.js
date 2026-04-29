const { Router } = require('express');
const db = require('../db');
const { adminOnly } = require('../middleware/auth');

const router = Router();

// GET
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM configuracoes LIMIT 1');

    if (!rows[0]) {
      const { rows: newRows } = await db.query(`
        INSERT INTO configuracoes (nome_sistema, headline, subheadline, cor_primaria, pontos_por_real)
        VALUES ('MecânicaPro', 'Bem-vindo à MecânicaPro', 'Sua oficina de confiança', '#f97316', 1.0)
        RETURNING *
      `);
      return res.json(newRows[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT (padrão REST)
router.put('/', adminOnly, async (req, res) => {
  try {
    const { nome_sistema, headline, subheadline, cor_primaria, pontos_por_real, logo_path } = req.body;

    const current = await db.query('SELECT id FROM configuracoes LIMIT 1');

    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const { rows } = await db.query(`
      UPDATE configuracoes 
      SET nome_sistema=$1, headline=$2, subheadline=$3, cor_primaria=$4, pontos_por_real=$5, logo_path=$6
      WHERE id=$7 RETURNING *
    `, [
      nome_sistema,
      headline,
      subheadline,
      cor_primaria,
      pontos_por_real,
      logo_path,
      current.rows[0].id
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 🔥 SUPORTE AO FRONT (resolve o 404)
router.post('/insert', adminOnly, async (req, res) => {
  try {
    const { nome_sistema, headline, subheadline, cor_primaria, pontos_por_real, logo_path } = req.body;

    const current = await db.query('SELECT id FROM configuracoes LIMIT 1');

    if (!current.rows[0]) {
      const { rows } = await db.query(`
        INSERT INTO configuracoes 
        (nome_sistema, headline, subheadline, cor_primaria, pontos_por_real, logo_path)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        nome_sistema,
        headline,
        subheadline,
        cor_primaria,
        pontos_por_real,
        logo_path
      ]);

      return res.json(rows[0]);
    }

    const { rows } = await db.query(`
      UPDATE configuracoes 
      SET nome_sistema=$1, headline=$2, subheadline=$3, cor_primaria=$4, pontos_por_real=$5, logo_path=$6
      WHERE id=$7 RETURNING *
    `, [
      nome_sistema,
      headline,
      subheadline,
      cor_primaria,
      pontos_por_real,
      logo_path,
      current.rows[0].id
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
