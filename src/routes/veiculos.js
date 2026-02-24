const { Router } = require('express');
const db = require('../db');

const router = Router();

// Listar veículos (opcionalmente filtrar por cliente_id)
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

    query += ' ORDER BY v.modelo';
    const { rows } = await db.query(query, params);

    // Mapear para incluir objeto cliente
    const result = rows.map(r => ({
      id: r.id,
      cliente_id: r.cliente_id,
      placa: r.placa,
      modelo: r.modelo,
      ano: r.ano,
      cor: r.cor,
      cliente: r.cliente_nome ? { id: r.cliente_id, nome: r.cliente_nome } : undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error('Erro ao listar veículos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar veículo
router.post('/', async (req, res) => {
  try {
    const { cliente_id, placa, modelo, ano, cor } = req.body;
    const { rows } = await db.query(
      `INSERT INTO veiculos (cliente_id, placa, modelo, ano, cor)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cliente_id, placa, modelo, ano, cor]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar veículo:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar veículo
router.put('/:id', async (req, res) => {
  try {
    const { cliente_id, placa, modelo, ano, cor } = req.body;
    const { rows } = await db.query(
      `UPDATE veiculos SET cliente_id=$1, placa=$2, modelo=$3, ano=$4, cor=$5
       WHERE id=$6 RETURNING *`,
      [cliente_id, placa, modelo, ano, cor, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar veículo:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Excluir veículo
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM veiculos WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json({ message: 'Veículo excluído' });
  } catch (err) {
    console.error('Erro ao excluir veículo:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
