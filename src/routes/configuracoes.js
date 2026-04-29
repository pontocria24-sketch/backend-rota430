const { Router } = require('express');
const db = require('../db');
const { adminOnly } = require('../middleware/auth');

const router = Router();

// 🔎 BUSCAR CONFIGURAÇÕES
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM configuracoes LIMIT 1');
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// 💾 SALVAR CONFIGURAÇÕES (POST e PUT)
async function salvar(req, res) {
  try {
    const {
      nome_sistema,
      headline,
      subheadline,
      cor_primaria,
      cor_sidebar,
      pontos_por_real,
      mensagem_aniversario,
      mensagem_revisao,
      logo_path
    } = req.body;

    const { rows } = await db.query(`
      UPDATE configuracoes
      SET
        nome_sistema = COALESCE($1, nome_sistema),
        headline = COALESCE($2, headline),
        subheadline = COALESCE($3, subheadline),
        cor_primaria = COALESCE($4, cor_primaria),
        cor_sidebar = COALESCE($5, cor_sidebar),
        pontos_por_real = COALESCE($6, pontos_por_real),
        mensagem_aniversario = COALESCE($7, mensagem_aniversario),
        mensagem_revisao = COALESCE($8, mensagem_revisao),
        logo_path = COALESCE($9, logo_path)
      RETURNING *
    `, [
      nome_sistema,
      headline,
      subheadline,
      cor_primaria,
      cor_sidebar,
      pontos_por_real,
      mensagem_aniversario,
      mensagem_revisao,
      logo_path
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
}

router.post('/', adminOnly, salvar);
router.put('/', adminOnly, salvar);

module.exports = router;
