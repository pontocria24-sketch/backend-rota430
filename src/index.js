require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./middleware/auth');

// ROTAS
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const veiculosRoutes = require('./routes/veiculos');
const ordensRoutes = require('./routes/ordens');
const funcionariosRoutes = require('./routes/funcionarios');
const brindesRoutes = require('./routes/brindes');
const dashboardRoutes = require('./routes/dashboard');
const configRoutes = require('./routes/configuracoes');
const meRoutes = require('./routes/me');

// 🔥 NOVAS ROTAS
const servicosRoutes = require('./routes/servicos');
const logsRoutes = require('./routes/logs');
const alertasRoutes = require('./routes/alertas');
const resgatesRoutes = require('./routes/resgates');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 LOG DE REQUEST (mantém)
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// 🔥 CORS (ok)
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// ROOT
app.get('/', (req, res) => {
  res.send('API MecânicaPro rodando 🚀');
});

// HEALTH
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 🔓 PUBLIC
app.use('/auth', authRoutes);

// 🔐 PRIVATE
app.use('/me', authMiddleware, meRoutes);

app.use('/clientes', authMiddleware, clientesRoutes);
app.use('/veiculos', authMiddleware, veiculosRoutes);
app.use('/ordens', authMiddleware, ordensRoutes);
app.use('/funcionarios', authMiddleware, funcionariosRoutes);
app.use('/brindes', authMiddleware, brindesRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/configuracoes', authMiddleware, configRoutes);

// 🔥 NOVAS ROTAS (ESSENCIAL PRA NÃO DAR ERRO NO FRONT)
app.use('/servicos', authMiddleware, servicosRoutes);
app.use('/logs', authMiddleware, logsRoutes);
app.use('/alertas', authMiddleware, alertasRoutes);

// 🔥 CORREÇÃO IMPORTANTE AQUI 👇
app.use('/resgates_brindes', authMiddleware, resgatesRoutes);

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    detalhe: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// START
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API MecânicaPro rodando na porta ${PORT}`);
});
