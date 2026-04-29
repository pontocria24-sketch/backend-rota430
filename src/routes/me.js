const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET /me
router.get('/', async (req, res) => {
  try {
    // 🔥 PROTEÇÃO
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;
    const nivel = req.user.nivel;

    // 🔍 busca usuário
    const userRes = await db.query(
      'SELECT id, nome, email, nivel FROM usuarios WHERE id = $1',
      [userId]
    );

    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    let cliente = null;

    // 🔥 se for cliente
    if (nivel === 3) {
      const clienteRes = await db.query(
        'SELECT id, cpf_cnpj, telefone, pontos_totais FROM clientes WHERE usuario_id = $1',
        [userId]
      );

      cliente = clienteRes.rows[0] || null;
    }

    res.json({
      usuario: user,
      cliente
    });

  } catch (err) {
    console.error('Erro na rota /me:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
