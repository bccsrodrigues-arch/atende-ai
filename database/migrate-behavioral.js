/**
 * MIGRATION PARA SUPORTARE REGRAS ESPECÍFICAS E FEEDBACK DE IA
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../backend/database.db");

const db = new sqlite3.Database(dbPath);

const runAsync = (sql) => {
	return new Promise((resolve, reject) => {
		db.run(sql, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
};

async function migrate() {
	console.log("🚀 Iniciando migração para Treinamento Comportamental...");

	try {
		// 1. Tabela de Regras Comportamentais (Instruções de como agir)
		await runAsync(`
            CREATE TABLE IF NOT EXISTS regras_ia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                instrucao TEXT NOT NULL,
                ativo BOOLEAN DEFAULT TRUE,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
		console.log("✅ Tabela regras_ia criada.");

		// 2. Adicionar coluna de feedback na tabela de interações se não existir
		// SQLite não tem 'IF NOT EXISTS' para colunas, então tentamos e pegamos o erro se já existir
		try {
			await runAsync(
				`ALTER TABLE interacoes_ia ADD COLUMN feedback_usuario TEXT`,
			); // 'positivo' ou 'negativo'
			console.log("✅ Coluna feedback_usuario adicionada a interacoes_ia.");
		} catch (_e) {
			console.log("ℹ️ Coluna feedback_usuario já existe ou erro ignorado.");
		}

		try {
			await runAsync(
				`ALTER TABLE interacoes_ia ADD COLUMN justificativa_feedback TEXT`,
			);
			console.log(
				"✅ Coluna justificativa_feedback adicionada a interacoes_ia.",
			);
		} catch (_e) {
			console.log("ℹ️ Coluna justificativa_feedback já existe.");
		}

		// 3. Inserir regra padrão inicial
		await runAsync(`
            INSERT INTO regras_ia (nome, instrucao) 
            VALUES ('Personalidade Humana', 'Aja como um atendente empático. Se o cliente estiver bravo, peça desculpas. Nunca responda com frases curtas demais.')
        `);

		console.log("✨ Migração concluída com sucesso!");
		db.close();
	} catch (error) {
		console.error("❌ Erro na migração:", error);
	}
}

migrate();
