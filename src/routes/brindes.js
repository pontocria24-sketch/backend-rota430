const { Router } = require('express');
const db = require('../db');

const router = Router();

// Listar brindes
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM brindes ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar brindes:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar brinde
router.post('/', async (req, res) => {
  try {
    const { nome, descricao, imagem_path, pontos_necessarios, estoque, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO brindes (nome, descricao, imagem_path, pontos_necessarios, estoque, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, descricao, imagem_path, pontos_necessarios, estoque || 0, status || 'ativo']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar brinde:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar brinde
router.put('/:id', async (req, res) => {
  try {
    const { nome, descricao, imagem_path, pontos_necessarios, estoque, status } = req.body;
    const { rows } = await db.query(
      `UPDATE brindes SET nome=$1, descricao=$2, imagem_path=$3, pontos_necessarios=$4, estoque=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [nome, descricao, imagem_path, pontos_necessarios, estoque, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Brinde não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar brinde:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Excluir brinde
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM brindes WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Brinde não encontrado' });
    res.json({ message: 'Brinde excluído' });
  } catch (err) {
    console.error('Erro ao excluir brinde:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Resgatar brinde
router.post('/resgatar', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { cliente_id, brinde_id } = req.body;

    // Verificar brinde
    const brindeRes = await client.query('SELECT * FROM brindes WHERE id = $1', [brinde_id]);
    const brinde = brindeRes.rows[0];
    if (!brinde) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Brinde não encontrado' }); }
    if (brinde.status !== 'ativo' || brinde.estoque <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Brinde indisponível' });
    }

    // Verificar pontos do cliente
    const clienteRes = await client.query('SELECT pontos_totais FROM clientes WHERE id = $1', [cliente_id]);
    const cliente = clienteRes.rows[0];
    if (!cliente) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Cliente não encontrado' }); }
    if (cliente.pontos_totais < brinde.pontos_necessarios) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Pontos insuficientes' });
    }

    // Criar resgate
    await client.query(
      `INSERT INTO resgates_brindes (cliente_id, brinde_id) VALUES ($1, $2)`,
      [cliente_id, brinde_id]
    );

    // Descontar pontos e estoque
    await client.query(
      'UPDATE clientes SET pontos_totais = pontos_totais - $1 WHERE id = $2',
      [brinde.pontos_necessarios, cliente_id]
    );
    await client.query(
      'UPDATE brindes SET estoque = estoque - 1 WHERE id = $1',
      [brinde_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Brinde resgatado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao resgatar brinde:', err);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
});

module.exports = router;
