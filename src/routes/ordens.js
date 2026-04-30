const { Router } = require('express');
const db = require('../db');

const router = Router();

// LISTAR ORDENS
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        os.*,
        c.nome AS cliente_nome,
        v.modelo AS veiculo_modelo,
        v.placa AS veiculo_placa,
        f.nome AS mecanico_nome
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      LEFT JOIN veiculos v ON v.id = os.veiculo_id
      LEFT JOIN funcionarios f ON f.id = os.mecanico_id
      ORDER BY os.created_at DESC
    `);

    const result = rows.map(r => ({
      id: r.id,
      descricao: r.descricao,
      status: r.status,
      valor_total: Number(r.valor_total),
      created_at: r.created_at,

      cliente: {
        id: r.cliente_id,
        nome: r.cliente_nome
      },

      veiculo: {
        id: r.veiculo_id,
        modelo: r.veiculo_modelo,
        placa: r.veiculo_placa
      },

      mecanico: r.mecanico_nome
        ? {
            id: r.mecanico_id,
            nome: r.mecanico_nome
          }
        : null
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar ordens' });
  }
});

// CRIAR OS
router.post('/', async (req, res) => {
  try {
    const { cliente_id, veiculo_id, descricao, valor_total } = req.body;

    const { rows } = await db.query(`
      INSERT INTO ordens_servico (cliente_id, veiculo_id, descricao, valor_total)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [cliente_id, veiculo_id, descricao, valor_total || 0]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar ordem' });
  }
});

// ATRIBUIR MECÂNICO
router.put('/:id/mecanico', async (req, res) => {
  try {
    const { mecanico_id } = req.body;

    const { rows } = await db.query(`
      UPDATE ordens_servico
      SET mecanico_id = $1
      WHERE id = $2
      RETURNING *
    `, [mecanico_id, req.params.id]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao vincular mecânico' });
  }
});

module.exports = router;

// EDITAR OS (SIMPLES)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, veiculo_id, descricao, valor_total, status } = req.body;

    const { rows } = await db.query(`
      UPDATE ordens_servico
      SET
        cliente_id = COALESCE($1, cliente_id),
        veiculo_id = COALESCE($2, veiculo_id),
        descricao = COALESCE($3, descricao),
        valor_total = COALESCE($4, valor_total),
        status = COALESCE($5, status)
      WHERE id = $6
      RETURNING *
    `, [cliente_id, veiculo_id, descricao, valor_total, status, id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Ordem não encontrada' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar ordem' });
  }
});
