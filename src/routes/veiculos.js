const { Router } = require('express');
const db = require('../db');

const router = Router();

// LISTAR VEÍCULOS
router.get('/', async (req, res) => {
  try {
    const { cliente_id } = req.query;

    let query = `
      SELECT v.*, c.nome as cliente_nome
      FROM veiculos v
      LEFT JOIN clientes c ON c.id = v.cliente_id
    `;

    const params = [];

    if (cliente_id) {
      query += ' WHERE v.cliente_id = $1';
      params.push(cliente_id);
    }

    query += ' ORDER BY v.created_at DESC';

    const { rows } = await db.query(query, params);

    res.json(rows.map(v => ({
      id: v.id,
      placa: v.placa,
      modelo: v.modelo,
      ano: v.ano,
      cor: v.cor,
      cliente: {
        id: v.cliente_id,
        nome: v.cliente_nome
      }
    })));

  } catch (err) {
    console.error('Erro ao listar veículos:', err);
    res.status(500).json({ error: 'Erro ao listar veículos' });
  }
});

// CRIAR VEÍCULO
router.post('/', async (req, res) => {
  try {
    let { cliente_id, placa, modelo, ano, cor } = req.body;

    // 🔥 CORREÇÃO IMPORTANTE (aceita formato do Lovable)
    if (!cliente_id && req.body.cliente?.id) {
      cliente_id = req.body.cliente.id;
    }

    // 🔥 VALIDAÇÃO PROFISSIONAL
    if (!cliente_id) {
      return res.status(400).json({ error: 'cliente_id é obrigatório' });
    }

    if (!placa || !modelo) {
      return res.status(400).json({ error: 'placa e modelo são obrigatórios' });
    }

    const { rows } = await db.query(`
      INSERT INTO veiculos (cliente_id, placa, modelo, ano, cor)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [cliente_id, placa, modelo, ano || null, cor || null]);

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('Erro ao criar veículo:', err);
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});

module.exports = router;
