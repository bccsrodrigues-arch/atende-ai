/**
 * MIGRATION PARA SUPORTE A MÚLTIPLOS AGENTES E PERFIS DE IA
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../backend/database.db");

const db = new sqlite3.Database(dbPath);

const runAsync = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) reject(err);
			else resolve(this);
		});
	});
};

const getAsync = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
};

async function migrate() {
	console.log("🚀 Iniciando migração para Perfil Mult-Agentes...");

	try {
		// 1. Criar Tabela de Agentes
		await runAsync(`
            CREATE TABLE IF NOT EXISTS agentes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                voz_id TEXT,
                tom_voz TEXT,
                velocidade REAL DEFAULT 1.0,
                script_saudacao TEXT,
                script_encerramento TEXT,
                script_transferencia TEXT,
                instrucao_comportamental TEXT,
                finalizado BOOLEAN DEFAULT 0,
                ativo BOOLEAN DEFAULT 0,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
		console.log("✅ Tabela 'agentes' criada.");

		// 2. Criar Agente Padrão (Maria Silva)
		const existingAgent = await getAsync("SELECT * FROM agentes LIMIT 1");
		let agentePadraoId;

		if (!existingAgent) {
			const result = await runAsync(
				`
                INSERT INTO agentes (uuid, nome, voz_id, tom_voz, velocidade, script_saudacao, script_encerramento, script_transferencia, ativo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
				[
					uuidv4(),
					"Maria (Padrão)",
					"female",
					"profissional",
					1.0,
					"Olá! Bem-vindo à Atende AI. Sou a Maria, sua assistente virtual. Como posso ajudar você hoje?",
					"Obrigado por entrar em contato. Tenha um ótimo dia!",
					"Vou transferir você para um de nossos atendentes especializados. Por favor, aguarde um momento.",
					1,
				],
			);
			agentePadraoId = result.lastID;
			console.log("✅ Agente padrão criado.");
		} else {
			agentePadraoId = existingAgent.id;
		}

		// 3. Adicionar coluna agente_id nas tabelas relacionadas
		const tablesToUpdate = [
			"regras_ia",
			"problemas_conhecidos",
			"interacoes_ia",
		];

		for (const table of tablesToUpdate) {
			try {
				// SQLite não tem syntax de colunas opcionais, então tentamos adicionar a coluna se não existir
				await runAsync(
					`ALTER TABLE ${table} ADD COLUMN agente_id INTEGER REFERENCES agentes(id)`,
				);
				console.log(
					`✅ Coluna 'agente_id' adicionada a ${table}. Primário: ${agentePadraoId}`,
				);
			} catch (_e) {
				console.log(
					`ℹ️ Coluna agente_id em ${table} já existe ou erro ignorado.`,
				);
			}

			// Sempre tentamos atualizar dados órfãos para o primeiro agente
			await runAsync(
				`UPDATE ${table} SET agente_id = ? WHERE agente_id IS NULL OR agente_id = 0`,
				[agentePadraoId],
			);
		}

		console.log("✨ Migração de múltiplos agentes concluída com sucesso!");
		db.close();
	} catch (error) {
		console.error("❌ Erro na migração:", error);
	}
}

migrate();
