const { Router } = require('express');
const db = require('../db');

const router = Router();

// Listar ordens (opcionalmente filtrar por cliente_id)
router.get('/', async (req, res) => {
  try {
    const { cliente_id } = req.query;
    let query = `
      SELECT os.*,
        c.nome as cliente_nome, c.cpf_cnpj as cliente_cpf,
        v.placa as veiculo_placa, v.modelo as veiculo_modelo,
        f.nome as mecanico_nome
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      LEFT JOIN veiculos v ON v.id = os.veiculo_id
      LEFT JOIN funcionarios f ON f.id = os.mecanico_id
    `;
    const params = [];

    if (cliente_id) {
      query += ' WHERE os.cliente_id = $1';
      params.push(cliente_id);
    }

    query += ' ORDER BY os.created_at DESC';
    const { rows } = await db.query(query, params);

    const result = rows.map(r => ({
      id: r.id,
      cliente_id: r.cliente_id,
      veiculo_id: r.veiculo_id,
      mecanico_id: r.mecanico_id,
      descricao: r.descricao,
      valor_total: parseFloat(r.valor_total),
      status: r.status,
      pdf_path: r.pdf_path,
      created_at: r.created_at,
      cliente: r.cliente_nome ? { id: r.cliente_id, nome: r.cliente_nome, cpf_cnpj: r.cliente_cpf } : undefined,
      veiculo: r.veiculo_placa ? { id: r.veiculo_id, placa: r.veiculo_placa, modelo: r.veiculo_modelo } : undefined,
      mecanico: r.mecanico_nome ? { id: r.mecanico_id, nome: r.mecanico_nome } : undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error('Erro ao listar ordens:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar ordem de serviço
router.post('/', async (req, res) => {
  try {
    const { cliente_id, veiculo_id, mecanico_id, descricao, valor_total } = req.body;
    const { rows } = await db.query(
      `INSERT INTO ordens_servico (cliente_id, veiculo_id, mecanico_id, descricao, valor_total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cliente_id, veiculo_id, mecanico_id, descricao, valor_total || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar ordem:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar ordem (finalizar, editar)
router.put('/:id', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { descricao, valor_total, status, mecanico_id } = req.body;

    // Buscar OS atual
    const current = await client.query('SELECT * FROM ordens_servico WHERE id = $1', [req.params.id]);
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ordem não encontrada' });
    }

    const os = current.rows[0];

    // Atualizar OS
    const { rows } = await client.query(
      `UPDATE ordens_servico SET descricao=$1, valor_total=$2, status=$3, mecanico_id=$4
       WHERE id=$5 RETURNING *`,
      [
        descricao ?? os.descricao,
        valor_total ?? os.valor_total,
        status ?? os.status,
        mecanico_id ?? os.mecanico_id,
        req.params.id,
      ]
    );

    // Se está finalizando, adicionar pontos ao cliente
    if (status === 'finalizada' && os.status === 'aberta') {
      // Buscar pontos_por_real da configuração
      const configRes = await client.query('SELECT pontos_por_real FROM configuracoes LIMIT 1');
      const pontosPorReal = configRes.rows[0]?.pontos_por_real || 1;
      const pontosGanhos = Math.floor(parseFloat(valor_total || os.valor_total) * pontosPorReal);

      await client.query(
        'UPDATE clientes SET pontos_totais = pontos_totais + $1 WHERE id = $2',
        [pontosGanhos, os.cliente_id]
      );
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar ordem:', err);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
});

module.exports = router;
