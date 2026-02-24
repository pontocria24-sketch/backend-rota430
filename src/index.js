require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const veiculosRoutes = require('./routes/veiculos');
const ordensRoutes = require('./routes/ordens');
const funcionariosRoutes = require('./routes/funcionarios');
const brindesRoutes = require('./routes/brindes');
const dashboardRoutes = require('./routes/dashboard');
const configRoutes = require('./routes/configuracoes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rotas públicas
app.use('/auth', authRoutes);

// Rotas protegidas (requerem JWT)
app.use('/clientes', authMiddleware, clientesRoutes);
app.use('/veiculos', authMiddleware, veiculosRoutes);
app.use('/ordens', authMiddleware, ordensRoutes);
app.use('/funcionarios', authMiddleware, funcionariosRoutes);
app.use('/brindes', authMiddleware, brindesRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/configuracoes', authMiddleware, configRoutes);

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MecânicaPro API rodando na porta ${PORT}`);
});
