/**
 * ==============================================================
 * INICIALIZADOR DO BANCO DE DADOS SQLITE
 * ==============================================================
 * Este arquivo cria e inicializa o banco de dados SQLite com:
 * - Tabela de clientes
 * - Tabela de histórico de chamadas
 * - Tabela de atendentes
 * - Índices para otimizar buscas
 *
 * Execute: node database/init-db.js
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

// Obter o caminho do diretório atual
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "database.db");

// Criar conexão com o banco
const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error("❌ Erro ao conectar ao banco:", err);
		process.exit(1);
	}
	console.log("✅ Conectado ao banco de dados SQLite em:", dbPath);
});

/**
 * TABELA 1: CLIENTES
 * Armazena informações dos clientes do sistema
 */
const createClientesTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      cpf_cnpj TEXT UNIQUE,
      endereco TEXT,
      dados_importantes TEXT,
      status TEXT DEFAULT 'ativo',
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultima_interacao DATETIME
    )
  `;

	db.run(sql, (err) => {
		if (err) {
			console.error("❌ Erro ao criar tabela clientes:", err);
		} else {
			console.log('✅ Tabela "clientes" criada/verificada');
		}
	});
};

/**
 * TABELA 2: HISTÓRICO DE CHAMADAS
 * Registra todas as interações do agente de IA com clientes
 */
const createChamadasTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS chamadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      cliente_id INTEGER NOT NULL,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      duracao_segundos INTEGER,
      motivo_chamada TEXT,
      transcricao TEXT,
      resultado TEXT,
      foi_resolvido BOOLEAN DEFAULT FALSE,
      transferido_para_atendente BOOLEAN DEFAULT FALSE,
      atendente_id INTEGER,
      avaliacao INTEGER,
      notas_internas TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (atendente_id) REFERENCES atendentes(id)
    )
  `;

	db.run(sql, (err) => {
		if (err) {
			console.error("❌ Erro ao criar tabela chamadas:", err);
		} else {
			console.log('✅ Tabela "chamadas" criada/verificada');
		}
	});
};

/**
 * TABELA 3: ATENDENTES
 * Informações dos atendentes reais que podem receber transferências
 */
const createAtendentesTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS atendentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone_interno TEXT,
      status TEXT DEFAULT 'disponivel',
      especialidade TEXT,
      chamadas_atendidas INTEGER DEFAULT 0,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

	db.run(sql, (err) => {
		if (err) {
			console.error("❌ Erro ao criar tabela atendentes:", err);
		} else {
			console.log('✅ Tabela "atendentes" criada/verificada');
		}
	});
};

/**
 * TABELA 4: INTERAÇÕES DO AGENTE DE IA
 * Histórico detalhado de cada mensagem/resposta do agente
 */
const createInteracoesTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS interacoes_ia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamada_id INTEGER NOT NULL,
      sequencia INTEGER,
      tipo TEXT,
      mensagem_usuario TEXT,
      resposta_ia TEXT,
      confianca_resposta DECIMAL(3,2),
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chamada_id) REFERENCES chamadas(id)
    )
  `;

	db.run(sql, (err) => {
		if (err) {
			console.error("❌ Erro ao criar tabela interações:", err);
		} else {
			console.log('✅ Tabela "interacoes_ia" criada/verificada');
		}
	});
};

/**
 * TABELA 5: CONFIGURAÇÕES E PROBLEMAS
 * Armazena tipos de problemas que o agente pode resolver
 */
const createProblemasTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS problemas_conhecidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL,
      descricao TEXT NOT NULL,
      solucao TEXT NOT NULL,
      palavras_chave TEXT,
      prioridade INTEGER DEFAULT 5,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

	db.run(sql, (err) => {
		if (err) {
			console.error("❌ Erro ao criar tabela problemas:", err);
		} else {
			console.log('✅ Tabela "problemas_conhecidos" criada/verificada');
		}
	});
};

/**
 * TABELA 6: AGENTES DE IA
 * Perfis customizados de agentes
 */
const createAgentesTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS agentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      voz_id TEXT DEFAULT 'female',
      tom_voz TEXT DEFAULT 'profissional',
      velocidade DECIMAL(2,1) DEFAULT 1.0,
      instrucao_comportamental TEXT,
      script_saudacao TEXT,
      script_pulpito TEXT,
      script_encerramento TEXT,
      script_transferencia TEXT,
      finalizado BOOLEAN DEFAULT FALSE,
      ativo BOOLEAN DEFAULT TRUE,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

	db.run(sql, (err) => {
		if (err) console.error("❌ Erro ao criar tabela agentes:", err);
		else console.log('✅ Tabela "agentes" criada/verificada');
	});
};

/**
 * TABELA 7: REGRAS DA IA
 * Instruções específicas de comportamento para os agentes
 */
const createRegrasTable = () => {
	const sql = `
    CREATE TABLE IF NOT EXISTS regras_ia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agente_id INTEGER DEFAULT 1,
      nome TEXT,
      instrucao TEXT NOT NULL,
      ativo BOOLEAN DEFAULT TRUE,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agente_id) REFERENCES agentes(id)
    )
  `;

	db.run(sql, (err) => {
		if (err) console.error("❌ Erro ao criar tabela regras_ia:", err);
		else console.log('✅ Tabela "regras_ia" criada/verificada');
	});
};

/**
 * CRIAR ÍNDICES para melhor desempenho
 * Índices são usados em buscas frequentes
 */
const createIndices = () => {
	const indices = [
		"CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone)",
		"CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email)",
		"CREATE INDEX IF NOT EXISTS idx_chamadas_cliente ON chamadas(cliente_id)",
		"CREATE INDEX IF NOT EXISTS idx_chamadas_data ON chamadas(data_hora)",
		"CREATE INDEX IF NOT EXISTS idx_interacoes_chamada ON interacoes_ia(chamada_id)",
		"CREATE INDEX IF NOT EXISTS idx_atendentes_status ON atendentes(status)",
		"CREATE INDEX IF NOT EXISTS idx_regras_agente ON regras_ia(agente_id)",
	];

	indices.forEach((indexSql) => {
		db.run(indexSql, (err) => {
			if (err) console.error("❌ Erro ao criar índice:", err);
		});
	});

	console.log("✅ Índices criados/verificados");
};

/**
 * INSERIR DADOS DE EXEMPLO
 * Adiciona dados para testes e demonstração
 */
const insertSampleData = () => {
	// Inserir clientes de exemplo
	const clientesExemplo = [
		{
			uuid: "550e8400-e29b-41d4-a716-446655440001",
			nome: "João Silva",
			telefone: "11999999999",
			email: "joao@example.com",
			cpf_cnpj: "12345678900",
			endereco: "Rua A, 123 - São Paulo, SP",
			dados_importantes: "Cliente premium com conta ativa desde 2022",
		},
		{
			uuid: "550e8400-e29b-41d4-a716-446655440002",
			nome: "Maria Santos",
			telefone: "11988888888",
			email: "maria@example.com",
			cpf_cnpj: "98765432100",
			endereco: "Avenida B, 456 - Rio de Janeiro, RJ",
			dados_importantes: "Problemas frequentes com pagamento",
		},
	];

	clientesExemplo.forEach((cliente) => {
		const sql = `
      INSERT OR IGNORE INTO clientes 
      (uuid, nome, telefone, email, cpf_cnpj, endereco, dados_importantes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

		db.run(sql, [
			cliente.uuid,
			cliente.nome,
			cliente.telefone,
			cliente.email,
			cliente.cpf_cnpj,
			cliente.endereco,
			cliente.dados_importantes,
		]);
	});

	// Inserir atendentes de exemplo
	const atendentesExemplo = [
		{
			uuid: "660e8400-e29b-41d4-a716-446655440001",
			nome: "Carlos Mendes",
			email: "carlos@company.com",
			telefone_interno: "1001",
			especialidade: "Financeiro",
		},
		{
			uuid: "660e8400-e29b-41d4-a716-446655440002",
			nome: "Ana Costa",
			email: "ana@company.com",
			telefone_interno: "1002",
			especialidade: "Técnico",
		},
	];

	atendentesExemplo.forEach((atendente) => {
		const sql = `
      INSERT OR IGNORE INTO atendentes 
      (uuid, nome, email, telefone_interno, especialidade) 
      VALUES (?, ?, ?, ?, ?)
    `;

		db.run(sql, [
			atendente.uuid,
			atendente.nome,
			atendente.email,
			atendente.telefone_interno,
			atendente.especialidade,
		]);
	});

	// Inserir problemas conhecidos
	const problemasExemplo = [
		{
			categoria: "Pagamento",
			descricao: "Cartão de crédito recusado",
			solucao:
				"Verificar saldo disponível, atualizar dados do cartão ou sugerir outro método",
			palavras_chave: "cartão,recusado,pagamento,débito",
			prioridade: 9,
		},
		{
			categoria: "Técnico",
			descricao: "Sistema fora do ar",
			solucao: "Informar sobre manutenção programada e tempo estimado de volta",
			palavras_chave: "fora do ar,sistema,indisponível,erro",
			prioridade: 10,
		},
		{
			categoria: "Suporte",
			descricao: "Esqueci minha senha",
			solucao: "Enviar link de recuperação por email ou SMS",
			palavras_chave: "senha,esqueci,reset,acesso",
			prioridade: 7,
		},
	];

	problemasExemplo.forEach((problema) => {
		const sql = `
      INSERT OR IGNORE INTO problemas_conhecidos 
      (categoria, descricao, solucao, palavras_chave, prioridade) 
      VALUES (?, ?, ?, ?, ?)
    `;

		db.run(sql, [
			problema.categoria,
			problema.descricao,
			problema.solucao,
			problema.palavras_chave,
			problema.prioridade,
		]);
	});

	// Inserir Chamada de Teste (ID 1) para Playground
	const sqlTeste = `
	  INSERT OR IGNORE INTO chamadas 
	  (id, uuid, cliente_id, motivo_chamada, resultado) 
	  VALUES (1, '00000000-0000-0000-0000-000000000001', 1, 'Teste IA Playground', 'Pendente')
	`;
	db.run(sqlTeste);

	// Inserir Agente Maria Padrão
	const sqlAgente = `
	  INSERT OR IGNORE INTO agentes 
	  (id, uuid, nome, voz_id, tom_voz, velocidade, instrucao_comportamental, script_saudacao, ativo) 
	  VALUES (1, '00000000-0000-0000-0000-000000000002', 'Maria', 'female', 'profissional', 1.0, 'Seja uma assistente cordial e prestativa.', 'Olá, eu sou a Maria. Como posso ajudar?', 1)
	`;
	db.run(sqlAgente);

	console.log("✅ Dados de exemplo inseridos");
};

/**
 * EXECUTAR INICIALIZAÇÃO COMPLETA
 */
const initDatabase = () => {
	console.log("\n🚀 Iniciando setup do banco de dados...\n");

	createClientesTable();
	createChamadasTable();
	createAtendentesTable();
	createInteracoesTable();
	createProblemasTable();
	createAgentesTable();
	createRegrasTable();
	createIndices();

	// Aguardar um pouco antes de inserir dados de exemplo
	setTimeout(() => {
		insertSampleData();

		setTimeout(() => {
			console.log("\n✅ Banco de dados inicializado com sucesso!");
			console.log(`📁 Arquivo: ${dbPath}`);
			db.close();
			process.exit(0);
		}, 500);
	}, 500);
};

// Executar inicialização
initDatabase();
