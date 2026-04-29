const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = Router();


// 🔥 CLIENTE LOGADO
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      'SELECT id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at FROM clientes WHERE usuario_id = $1',
      [userId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar cliente logado:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


// 🔥 LISTAR CLIENTES
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at FROM clientes ORDER BY nome'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


// 🔥 BUSCAR POR ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at FROM clientes WHERE id = $1',
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


// 🔥 CRIAR CLIENTE (CORRIGIDO)
router.post('/', async (req, res) => {
  try {
    const { nome, cpf_cnpj, telefone, email, data_nascimento, senha } = req.body;

    // 🔐 hash da senha
    const senhaHash = await bcrypt.hash(senha || '123456', 10);

    // 🔥 cria usuário primeiro
    const userRes = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, nivel)
       VALUES ($1, $2, $3, 3)
       RETURNING id`,
      [nome, email, senhaHash]
    );

    const usuarioId = userRes.rows[0].id;

    // 🔥 cria cliente vinculado
    const { rows } = await db.query(
      `INSERT INTO clientes (
        usuario_id,
        nome,
        cpf_cnpj,
        telefone,
        email,
        data_nascimento
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at`,
      [usuarioId, nome, cpf_cnpj, telefone, email, data_nascimento]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email ou CPF já cadastrado' });
    }
    console.error('Erro ao criar cliente:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


// 🔥 ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { nome, cpf_cnpj, telefone, email, data_nascimento } = req.body;

    const { rows } = await db.query(
      `UPDATE clientes 
       SET nome=$1, cpf_cnpj=$2, telefone=$3, email=$4, data_nascimento=$5
       WHERE id=$6
       RETURNING id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at`,
      [nome, cpf_cnpj, telefone, email, data_nascimento, req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


// 🔥 DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM clientes WHERE id = $1',
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({ message: 'Cliente excluído' });

  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


module.exports = router;
