const { Router } = require('express');
const db = require('../db');

const router = Router();

// 🔥 ROTA /me
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const nivel = req.user.nivel;

    // 🔎 Busca usuário
    const userRes = await db.query(
      'SELECT id, nome, email, nivel FROM usuarios WHERE id = $1',
      [userId]
    );

    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    let cliente = null;

    // 🔥 Se for cliente
    if (nivel === 3) {
      const clienteRes = await db.query(
        'SELECT id, cpf_cnpj, telefone, pontos_totais FROM clientes WHERE usuario_id = $1',
        [userId]
      );

      cliente = clienteRes.rows[0] || null;
    }

    return res.json({
      usuario: user,
      cliente
    });

  } catch (err) {
    console.error('Erro no /me:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
