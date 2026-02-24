const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    // Total de clientes
    const clientesRes = await db.query('SELECT COUNT(*) as total FROM clientes');
    const total_clientes = parseInt(clientesRes.rows[0].total);

    // Total de veículos
    const veiculosRes = await db.query('SELECT COUNT(*) as total FROM veiculos');
    const total_veiculos = parseInt(veiculosRes.rows[0].total);

    // OS abertas
    const osAbertasRes = await db.query("SELECT COUNT(*) as total FROM ordens_servico WHERE status = 'aberta'");
    const os_abertas = parseInt(osAbertasRes.rows[0].total);

    // OS finalizadas no mês
    const osFinMesRes = await db.query(`
      SELECT COUNT(*) as total FROM ordens_servico 
      WHERE status = 'finalizada' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const os_finalizadas_mes = parseInt(osFinMesRes.rows[0].total);

    // Faturamento do mês
    const fatRes = await db.query(`
      SELECT COALESCE(SUM(valor_total), 0) as total FROM ordens_servico 
      WHERE status = 'finalizada' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const faturamento_mes = parseFloat(fatRes.rows[0].total);

    // Revisões pendentes (clientes com última OS finalizada há mais de 6 meses)
    const revisaoRes = await db.query(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM clientes c
      INNER JOIN ordens_servico os ON os.cliente_id = c.id
      WHERE os.status = 'finalizada'
      GROUP BY c.id
      HAVING MAX(os.created_at) < NOW() - INTERVAL '6 months'
    `);
    const revisoes_pendentes = revisaoRes.rows.length;

    // Aniversariantes do mês
    const anivRes = await db.query(`
      SELECT id, nome, cpf_cnpj, telefone, email, data_nascimento, pontos_totais, created_at
      FROM clientes 
      WHERE EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
      ORDER BY EXTRACT(DAY FROM data_nascimento)
    `);

    // OS por mês (últimos 6 meses)
    const osPorMesRes = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as quantidade,
        COALESCE(SUM(valor_total), 0) as faturamento
      FROM ordens_servico 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes
    `);

    res.json({
      total_clientes,
      total_veiculos,
      os_abertas,
      os_finalizadas_mes,
      faturamento_mes,
      revisoes_pendentes,
      aniversariantes: anivRes.rows,
      os_por_mes: osPorMesRes.rows.map(r => ({
        mes: r.mes,
        quantidade: parseInt(r.quantidade),
        faturamento: parseFloat(r.faturamento),
      })),
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
