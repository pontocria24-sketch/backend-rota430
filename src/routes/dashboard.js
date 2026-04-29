const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clientesRes = await db.query('SELECT COUNT(*) as total FROM clientes');
    const total_clientes = parseInt(clientesRes.rows[0].total);

    const veiculosRes = await db.query('SELECT COUNT(*) as total FROM veiculos');
    const total_veiculos = parseInt(veiculosRes.rows[0].total);

    const osAbertasRes = await db.query(
      "SELECT COUNT(*) as total FROM ordens_servico WHERE status = 'aberta'"
    );
    const os_abertas = parseInt(osAbertasRes.rows[0].total);

    const osFinMesRes = await db.query(`
      SELECT COUNT(*) as total FROM ordens_servico 
      WHERE status = 'finalizada' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const os_finalizadas_mes = parseInt(osFinMesRes.rows[0].total);

    const fatRes = await db.query(`
      SELECT COALESCE(SUM(valor_total), 0) as total FROM ordens_servico 
      WHERE status = 'finalizada' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const faturamento_mes = parseFloat(fatRes.rows[0].total);

    res.json({
      total_clientes,
      total_veiculos,
      os_abertas,
      os_finalizadas_mes,
      faturamento_mes,
      revisoes_pendentes: 0,
      aniversariantes: [],
      os_por_mes: [],
    });

  } catch (err) {
    console.error('Erro ao buscar dashboard:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
