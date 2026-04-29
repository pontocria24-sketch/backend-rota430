const { Router } = require('express');
const db = require('../db');
const { adminOnly } = require('../middleware/auth');

const router = Router();

// 🔎 BUSCAR CONFIGURAÇÕES
router.get('/', async (req, res) => {
  try {
    let { rows } = await db.query('SELECT * FROM configuracoes LIMIT 1');

    // 🔥 Se não existir, cria padrão
    if (!rows[0]) {
      const insert = await db.query(`
        INSERT INTO configuracoes (
          nome_sistema,
          headline,
          subheadline,
          cor_primaria,
          cor_sidebar,
          pontos_por_real
        )
        VALUES (
          'MecânicaPro',
          '',
          '',
          '#3b82f6',
          '#1e293b',
          1
        )
        RETURNING *
      `);

      return res.json(insert.rows[0]);
    }

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

    // 🔥 pega o ID da configuração existente
    const current = await db.query('SELECT id FROM configuracoes LIMIT 1');

    // 🔥 se não existir, cria
    if (!current.rows[0]) {
      const insert = await db.query(`
        INSERT INTO configuracoes (
          nome_sistema,
          headline,
          subheadline,
          cor_primaria,
          cor_sidebar,
          pontos_por_real,
          mensagem_aniversario,
          mensagem_revisao,
          logo_path
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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

      return res.json(insert.rows[0]);
    }

    const id = current.rows[0].id;

    // 🔥 UPDATE CORRETO (COM WHERE)
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
      WHERE id = $10
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
      logo_path,
      id
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
