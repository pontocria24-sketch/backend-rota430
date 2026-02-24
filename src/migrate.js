require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function migrate() {
  console.log('🔄 Iniciando migração do banco de dados...\n');

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        cpf VARCHAR UNIQUE NOT NULL,
        cargo VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        senha VARCHAR NOT NULL,
        nivel VARCHAR CHECK (nivel IN ('admin','mecanico')) DEFAULT 'mecanico'
      );
    `);
    console.log('✅ Tabela funcionarios criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        cpf_cnpj VARCHAR UNIQUE NOT NULL,
        telefone VARCHAR,
        email VARCHAR UNIQUE NOT NULL,
        senha VARCHAR NOT NULL,
        data_nascimento DATE,
        pontos_totais INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela clientes criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        placa VARCHAR NOT NULL,
        modelo VARCHAR NOT NULL,
        ano INTEGER,
        cor VARCHAR
      );
    `);
    console.log('✅ Tabela veiculos criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id),
        veiculo_id UUID REFERENCES veiculos(id),
        mecanico_id UUID REFERENCES funcionarios(id),
        descricao TEXT,
        valor_total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR CHECK (status IN ('aberta','finalizada')) DEFAULT 'aberta',
        pdf_path VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela ordens_servico criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS brindes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR NOT NULL,
        descricao TEXT,
        imagem_path VARCHAR,
        pontos_necessarios INTEGER NOT NULL,
        estoque INTEGER DEFAULT 0,
        status VARCHAR CHECK (status IN ('ativo','inativo')) DEFAULT 'ativo'
      );
    `);
    console.log('✅ Tabela brindes criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS resgates_brindes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id),
        brinde_id UUID REFERENCES brindes(id),
        status VARCHAR CHECK (status IN ('pendente','aprovado','recusado')) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela resgates_brindes criada');

    await db.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome_sistema VARCHAR DEFAULT 'MecânicaPro',
        logo_path VARCHAR,
        headline VARCHAR,
        subheadline VARCHAR,
        cor_primaria VARCHAR DEFAULT '#f97316',
        pontos_por_real DECIMAL(5,2) DEFAULT 1.0
      );
    `);
    console.log('✅ Tabela configuracoes criada');

    // Inserir admin padrão se não existir
    const adminExists = await db.query("SELECT id FROM funcionarios WHERE email = 'admin@mecanica.com'");
    if (adminExists.rows.length === 0) {
      const senhaHash = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO funcionarios (nome, cpf, cargo, email, senha, nivel)
         VALUES ('Administrador', '00000000000', 'Gerente', 'admin@mecanica.com', $1, 'admin')`,
        [senhaHash]
      );
      console.log('✅ Admin padrão criado (admin@mecanica.com / admin123)');
    }

    // Inserir configuração padrão se não existir
    const configExists = await db.query('SELECT id FROM configuracoes LIMIT 1');
    if (configExists.rows.length === 0) {
      await db.query(
        `INSERT INTO configuracoes (nome_sistema, headline, subheadline, cor_primaria, pontos_por_real)
         VALUES ('MecânicaPro', 'Bem-vindo à MecânicaPro', 'Sua oficina de confiança', '#f97316', 1.0)`
      );
      console.log('✅ Configuração padrão criada');
    }

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
  } finally {
    await db.end();
  }
}

migrate();
