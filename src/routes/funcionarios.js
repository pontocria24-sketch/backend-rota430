const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { adminOnly } = require('../middleware/auth');

const router = Router();

// Listar funcionários
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, cpf, cargo, email, nivel FROM funcionarios ORDER BY nome'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar funcionários:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar funcionário (admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { nome, cpf, cargo, email, senha, nivel } = req.body;
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    const { rows } = await db.query(
      `INSERT INTO funcionarios (nome, cpf, cargo, email, senha, nivel)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, cpf, cargo, email, nivel`,
      [nome, cpf, cargo, email, senhaHash, nivel || 'mecanico']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'CPF ou email já cadastrado' });
    }
    console.error('Erro ao criar funcionário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar funcionário (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { nome, cpf, cargo, email, nivel } = req.body;
    const { rows } = await db.query(
      `UPDATE funcionarios SET nome=$1, cpf=$2, cargo=$3, email=$4, nivel=$5
       WHERE id=$6
       RETURNING id, nome, cpf, cargo, email, nivel`,
      [nome, cpf, cargo, email, nivel, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar funcionário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Excluir funcionário (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM funcionarios WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json({ message: 'Funcionário excluído' });
  } catch (err) {
    console.error('Erro ao excluir funcionário:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
