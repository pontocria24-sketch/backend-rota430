# MecânicaPro API

Backend da aplicação MecânicaPro.

## Setup rápido

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do PostgreSQL

# 3. Criar tabelas e admin padrão
npm run db:migrate

# 4. Iniciar servidor
npm start        # produção
npm run dev      # desenvolvimento (auto-reload)
```

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/mecanica` |
| `JWT_SECRET` | Chave secreta para tokens JWT | `sua_chave_secreta_aqui` |
| `PORT` | Porta do servidor | `3000` |
| `FRONTEND_URL` | URL do frontend (CORS) | `https://seu-app.lovable.app` |
| `DATABASE_SSL` | Usar SSL na conexão | `true` ou `false` |

## Login padrão

- **Email:** admin@mecanica.com
- **Senha:** admin123

## Deploy no Coolify

1. Crie um serviço PostgreSQL no Coolify
2. Crie um novo serviço → Docker → aponte para este repositório
3. Configure as variáveis de ambiente
4. Deploy!
