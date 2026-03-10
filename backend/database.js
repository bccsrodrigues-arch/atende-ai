/**
 * ==============================================================
 * SERVIÇO DE BANCO DE DADOS
 * ==============================================================
 * Fornece funções para interagir com o banco de dados SQLite
 * Todas as operações CRUD para clientes, chamadas, etc.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";

// Configurar caminho do banco de dados
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "database.db");

// Criar conexão com o banco
const db = new sqlite3.Database(dbPath);

// Promisificar operações do banco para usar async/await
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

const allAsync = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
};

/**
 * OPERAÇÕES COM CLIENTES
 */

/**
 * Buscar cliente pelo telefone (usado ao receber chamada)
 * @param {string} telefone - Número do telefone
 * @returns {Promise<Object>} Dados do cliente
 */
export const buscarClientePorTelefone = async (telefone) => {
	try {
		const cliente = await getAsync(
			"SELECT * FROM clientes WHERE telefone = ?",
			[telefone],
		);
		return cliente;
	} catch (error) {
		console.error("Erro ao buscar cliente por telefone:", error);
		return null;
	}
};

/**
 * Buscar cliente pelo ID
 * @param {number} clienteId - ID do cliente
 * @returns {Promise<Object>} Dados do cliente
 */
export const buscarClientePorId = async (clienteId) => {
	try {
		const cliente = await getAsync("SELECT * FROM clientes WHERE id = ?", [
			clienteId,
		]);
		return cliente;
	} catch (error) {
		console.error("Erro ao buscar cliente por ID:", error);
		return null;
	}
};

/**
 * Listar todos os clientes com paginação
 * @param {number} pagina - Número da página
 * @param {number} porPagina - Registros por página
 * @returns {Promise<Array>} Lista de clientes
 */
export const listarClientes = async (pagina = 1, porPagina = 20) => {
	try {
		const offset = (pagina - 1) * porPagina;
		const clientes = await allAsync(
			"SELECT * FROM clientes ORDER BY data_cadastro DESC LIMIT ? OFFSET ?",
			[porPagina, offset],
		);
		return clientes;
	} catch (error) {
		console.error("Erro ao listar clientes:", error);
		return [];
	}
};

/**
 * Criar novo cliente
 * @param {Object} dadosCliente - Dados do cliente
 * @returns {Promise<number>} ID do cliente criado
 */
export const criarCliente = async (dadosCliente) => {
	try {
		const resultado = await runAsync(
			`INSERT INTO clientes 
       (uuid, nome, telefone, email, cpf_cnpj, endereco, dados_importantes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				uuidv4(),
				dadosCliente.nome,
				dadosCliente.telefone,
				dadosCliente.email,
				dadosCliente.cpf_cnpj || null,
				dadosCliente.endereco || null,
				dadosCliente.dados_importantes || null,
			],
		);
		return resultado.lastID;
	} catch (error) {
		console.error("Erro ao criar cliente:", error);
		return null;
	}
};

/**
 * Atualizar dados do cliente
 * @param {number} clienteId - ID do cliente
 * @param {Object} dadosAtualizacao - Dados para atualizar
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const atualizarCliente = async (clienteId, dadosAtualizacao) => {
	try {
		// Construir UPDATE dinâmico
		const campos = Object.keys(dadosAtualizacao);
		const valores = Object.values(dadosAtualizacao);
		const setClauses = campos.map((campo) => `${campo} = ?`).join(", ");

		await runAsync(`UPDATE clientes SET ${setClauses} WHERE id = ?`, [
			...valores,
			clienteId,
		]);

		return true;
	} catch (error) {
		console.error("Erro ao atualizar cliente:", error);
		return false;
	}
};

/**
 * OPERAÇÕES COM CHAMADAS
 */

/**
 * Registrar nova chamada
 * @param {number} clienteId - ID do cliente
 * @param {string} motivoChamada - Motivo da chamada
 * @returns {Promise<number>} ID da chamada
 */
export const registrarChamada = async (clienteId, motivoChamada) => {
	try {
		const resultado = await runAsync(
			`INSERT INTO chamadas 
       (uuid, cliente_id, motivo_chamada) 
       VALUES (?, ?, ?)`,
			[uuidv4(), clienteId, motivoChamada],
		);

		// Atualizar última interação do cliente
		await runAsync(
			"UPDATE clientes SET ultima_interacao = CURRENT_TIMESTAMP WHERE id = ?",
			[clienteId],
		);

		return resultado.lastID;
	} catch (error) {
		console.error("Erro ao registrar chamada:", error);
		return null;
	}
};

/**
 * Buscar chamada pelo ID
 * @param {number} chamadaId - ID da chamada
 * @returns {Promise<Object>} Dados da chamada
 */
export const buscarChamada = async (chamadaId) => {
	try {
		const chamada = await getAsync("SELECT * FROM chamadas WHERE id = ?", [
			chamadaId,
		]);
		return chamada;
	} catch (error) {
		console.error("Erro ao buscar chamada:", error);
		return null;
	}
};

/**
 * Finalizar chamada e registrar resultado
 * @param {number} chamadaId - ID da chamada
 * @param {Object} dadosFinal - Dados finais da chamada
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const finalizarChamada = async (chamadaId, dadosFinal) => {
	try {
		// Calcular duração
		const chamada = await buscarChamada(chamadaId);
		const dataHoraInicio = new Date(chamada.data_hora);
		const agora = new Date();
		const duracao = Math.floor((agora - dataHoraInicio) / 1000);

		await runAsync(
			`UPDATE chamadas 
       SET duracao_segundos = ?,
           resultado = ?,
           foi_resolvido = ?,
           transcricao = ?,
           transferido_para_atendente = ?,
           avaliacao = ?,
           notas_internas = ?
       WHERE id = ?`,
			[
				duracao,
				dadosFinal.resultado,
				dadosFinal.foi_resolvido ? 1 : 0,
				dadosFinal.transcricao || null,
				dadosFinal.transferido_para_atendente ? 1 : 0,
				dadosFinal.avaliacao || null,
				dadosFinal.notas_internas || null,
				chamadaId,
			],
		);

		return true;
	} catch (error) {
		console.error("Erro ao finalizar chamada:", error);
		return false;
	}
};

/**
 * Listar histórico de chamadas de um cliente
 * @param {number} clienteId - ID do cliente
 * @param {number} limite - Número de registros
 * @returns {Promise<Array>} Histórico de chamadas
 */
export const listarChamadasCliente = async (clienteId, limite = 10) => {
	try {
		const chamadas = await allAsync(
			`SELECT * FROM chamadas 
       WHERE cliente_id = ? 
       ORDER BY data_hora DESC 
       LIMIT ?`,
			[clienteId, limite],
		);
		return chamadas;
	} catch (error) {
		console.error("Erro ao listar chamadas:", error);
		return [];
	}
};

/**
 * OPERAÇÕES COM ATENDENTES
 */

/**
 * Buscar atendente disponível
 * @param {string} especialidade - Especialidade desejada (opcional)
 * @returns {Promise<Object>} Dados do atendente
 */
export const buscarAtendenteLivre = async (especialidade = null) => {
	try {
		let sql = "SELECT * FROM atendentes WHERE status = ?";
		const params = ["disponivel"];

		if (especialidade) {
			sql += " AND especialidade = ?";
			params.push(especialidade);
		}

		sql += " ORDER BY chamadas_atendidas ASC LIMIT 1";

		const atendente = await getAsync(sql, params);
		return atendente;
	} catch (error) {
		console.error("Erro ao buscar atendente livre:", error);
		return null;
	}
};

/**
 * Atualizar status do atendente
 * @param {number} atendenteId - ID do atendente
 * @param {string} status - Novo status (disponivel/ocupado/ausente)
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const atualizarStatusAtendente = async (atendenteId, status) => {
	try {
		await runAsync("UPDATE atendentes SET status = ? WHERE id = ?", [
			status,
			atendenteId,
		]);
		return true;
	} catch (error) {
		console.error("Erro ao atualizar status atendente:", error);
		return false;
	}
};

/**
 * OPERAÇÕES COM INTERAÇÕES IA
 */

/**
 * Registrar interação do agente IA
 * @param {number} chamadaId - ID da chamada
 * @param {Object} interacao - Dados da interação
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const registrarInteracaoIa = async (chamadaId, interacao) => {
	try {
		// Contar quantas interações já existe
		const resultado = await getAsync(
			"SELECT COUNT(*) as count FROM interacoes_ia WHERE chamada_id = ?",
			[chamadaId],
		);

		const sequencia = (resultado?.count || 0) + 1;

		const insertResult = await runAsync(
			`INSERT INTO interacoes_ia 
       (chamada_id, sequencia, tipo, mensagem_usuario, resposta_ia, confianca_resposta, agente_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				chamadaId,
				sequencia,
				interacao.tipo,
				interacao.mensagem_usuario,
				interacao.resposta_ia,
				interacao.confianca_resposta || 0.8,
				interacao.agente_id || 1, // Fallback p/ agente padrão se não especificado
			],
		);

		const interacaoId = insertResult.lastID;
		console.log(
			`[DB] Interação registrada. ID: ${interacaoId} (Agente: ${interacao.agente_id || 1})`,
		);
		return interacaoId;
	} catch (error) {
		console.error("[DB] Erro ao registrar interação IA:", error);
		return null;
	}
};

/**
 * OPERAÇÕES COM PROBLEMAS CONHECIDOS
 */

/**
 * Buscar problemas por categoria
 * @param {string} categoria - Categoria do problema
 * @returns {Promise<Array>} Lista de problemas
 */
export const buscarProblemasPorCategoria = async (categoria) => {
	try {
		const problemas = await allAsync(
			"SELECT * FROM problemas_conhecidos WHERE categoria = ? ORDER BY prioridade DESC",
			[categoria],
		);
		return problemas;
	} catch (error) {
		console.error("Erro ao buscar problemas:", error);
		return [];
	}
};

/**
 * Listar todos os problemas / base de conhecimento
 */
export const listarProblemas = async () => {
	try {
		return await allAsync(
			"SELECT * FROM problemas_conhecidos ORDER BY prioridade DESC, data_criacao DESC",
		);
	} catch (error) {
		console.error("Erro ao listar problemas:", error);
		return [];
	}
};

/**
 * Adicionar novo problema (Treinar IA)
 */
export const adicionarProblema = async (dados) => {
	try {
		const resultado = await runAsync(
			`INSERT INTO problemas_conhecidos (categoria, descricao, solucao, palavras_chave, prioridade) VALUES (?, ?, ?, ?, ?)`,
			[
				dados.categoria,
				dados.descricao,
				dados.solucao,
				dados.palavras_chave,
				dados.prioridade || 5,
			],
		);
		return resultado.lastID;
	} catch (error) {
		console.error("Erro ao adicionar problema conhecidos:", error);
		return null;
	}
};

/**
 * Deletar problema da base de treinamento
 */
export const deletarProblema = async (id) => {
	try {
		await runAsync("DELETE FROM problemas_conhecidos WHERE id = ?", [id]);
		return true;
	} catch (error) {
		console.error("Erro ao deletar problema:", error);
		return false;
	}
};

export const atualizarProblema = async (id, dados) => {
	try {
		const campos = Object.keys(dados);
		const valores = Object.values(dados);
		const setClauses = campos.map((campo) => `${campo} = ?`).join(", ");

		await runAsync(
			`UPDATE problemas_conhecidos SET ${setClauses} WHERE id = ?`,
			[...valores, id],
		);
		return true;
	} catch (error) {
		console.error("Erro ao atualizar problema:", error);
		return false;
	}
};

/**
 * Buscar solução baseada em palavras-chave
 * @param {string} palavrasChave - Palavras para buscar
 * @returns {Promise<Object>} Melhor correspondência encontrada
 */
export const buscarSolucao = async (palavrasChave) => {
	try {
		if (!palavrasChave || palavrasChave.trim().length === 0) return null;

		// Normalizar termos de busca
		const termos = palavrasChave
			.toLowerCase()
			.replace(/[^\w\s]/gi, "")
			.split(" ")
			.filter((t) => t.length > 2);

		if (termos.length === 0) return null;

		// Buscar todos os problemas para ranqueamento
		const problemas = await allAsync(
			"SELECT * FROM problemas_conhecidos ORDER BY prioridade DESC",
		);

		const matches = [];

		problemas.forEach((problema) => {
			const textoBase =
				`${problema.descricao} ${problema.palavras_chave || ""} ${problema.categoria || ""} ${problema.solucao || ""}`.toLowerCase();
			let score = 0;

			termos.forEach((termo) => {
				// Peso para palavra-chave exata ou termos na descrição
				if (problema.palavras_chave?.toLowerCase().includes(termo)) score += 4;
				if (problema.descricao?.toLowerCase().includes(termo)) score += 2;
				if (textoBase.includes(termo)) score += 1;
			});

			// Bonus por prioridade do treinamento
			score += (problema.prioridade || 5) / 10;

			if (score >= 2) {
				// Score minimizado para abranger mais resultados
				matches.push({ problema, score });
			}
		});

		// Ordenar por score decrescente e retornar top 3
		matches.sort((a, b) => b.score - a.score);
		return matches.slice(0, 3).map((m) => m.problema);
	} catch (error) {
		console.error("Erro ao buscar solução:", error);
		return null;
	}
};

/**
 * OPERAÇÕES COM AGENTES
 */

export const listarAgentes = async () => {
	try {
		return await allAsync("SELECT * FROM agentes ORDER BY data_criacao DESC");
	} catch (error) {
		console.error("Erro ao listar agentes:", error);
		return [];
	}
};

export const buscarAgente = async (id) => {
	try {
		return await getAsync("SELECT * FROM agentes WHERE id = ?", [id]);
	} catch (error) {
		console.error("Erro ao buscar agente:", error);
		return null;
	}
};

export const criarAgente = async (dados) => {
	try {
		const result = await runAsync(
			`
			INSERT INTO agentes 
			(uuid, nome, voz_id, tom_voz, velocidade, instrucao_comportamental, script_saudacao, script_encerramento, script_transferencia, finalizado, ativo)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			[
				uuidv4(),
				dados.nome,
				dados.voz_id || "female",
				dados.tom_voz || "profissional",
				dados.velocidade || 1.0,
				dados.instrucao_comportamental || "",
				dados.script_saudacao || "",
				dados.script_encerramento || "",
				dados.script_transferencia || "",
				dados.finalizado ? 1 : 0,
				dados.ativo ?? 1,
			],
		);
		return result.lastID;
	} catch (error) {
		console.error("Erro ao criar agente:", error);
		return null;
	}
};

export const atualizarAgente = async (id, dados) => {
	try {
		const campos = Object.keys(dados);
		const valores = Object.values(dados);
		const setClauses = campos.map((campo) => `${campo} = ?`).join(", ");

		await runAsync(
			`UPDATE agentes SET ${setClauses}, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`,
			[...valores, id],
		);
		return true;
	} catch (error) {
		console.error("Erro ao atualizar agente:", error);
		return false;
	}
};

export const deletarAgente = async (id) => {
	try {
		// Não permitir deletar o último agente ou o ID 1
		if (id === 1) return false;
		await runAsync("DELETE FROM agentes WHERE id = ?", [id]);
		return true;
	} catch (error) {
		console.error("Erro ao deletar agente:", error);
		return false;
	}
};

export const deletarRegra = async (id) => {
	try {
		await runAsync("DELETE FROM regras_ia WHERE id = ?", [id]);
		return true;
	} catch (error) {
		console.error("Erro ao deletar regra:", error);
		return false;
	}
};

export const atualizarRegra = async (id, instrucao) => {
	try {
		await runAsync("UPDATE regras_ia SET instrucao = ? WHERE id = ?", [
			instrucao,
			id,
		]);
		return true;
	} catch (error) {
		console.error("Erro ao atualizar regra:", error);
		return false;
	}
};

export const listarRegrasAtivas = async (agenteId = null) => {
	try {
		const sql = agenteId
			? "SELECT id, instrucao FROM regras_ia WHERE ativo = 1 AND agente_id = ?"
			: "SELECT id, instrucao FROM regras_ia WHERE ativo = 1";
		return await allAsync(sql, agenteId ? [agenteId] : []);
	} catch (error) {
		console.error("Erro ao listar regras:", error);
		return [];
	}
};

export const adicionarRegra = async (nome, instrucao, agenteId = 1) => {
	try {
		const resultado = await runAsync(
			"INSERT INTO regras_ia (nome, instrucao, agente_id) VALUES (?, ?, ?)",
			[nome, instrucao, agenteId],
		);
		return resultado.lastID;
	} catch (error) {
		console.error("Erro ao adicionar regra:", error);
		return null;
	}
};

export const obterEstatisticas = async () => {
	try {
		const totalClientes = await getAsync(
			"SELECT COUNT(*) as count FROM clientes",
		);
		const totalChamadas = await getAsync(
			"SELECT COUNT(*) as count FROM chamadas",
		);
		const chamadasResolvidas = await getAsync(
			"SELECT COUNT(*) as count FROM chamadas WHERE foi_resolvido = 1",
		);
		const chamadasTransferidas = await getAsync(
			"SELECT COUNT(*) as count FROM chamadas WHERE transferido_para_atendente = 1",
		);

		return {
			total_clientes: totalClientes?.count || 0,
			total_chamadas: totalChamadas?.count || 0,
			chamadas_resolvidas: chamadasResolvidas?.count || 0,
			chamadas_transferidas: chamadasTransferidas?.count || 0,
			taxa_resolucao: `${(((chamadasResolvidas?.count || 0) / (totalChamadas?.count || 1)) * 100).toFixed(2)}%`,
		};
	} catch (error) {
		console.error("Erro ao obter estatísticas:", error);
		return {};
	}
};

export const registrarFeedback = async (
	interacaoId,
	feedback,
	justificativa = "",
) => {
	try {
		console.log(
			`[DB] Tentando registrar feedback. ID: ${interacaoId}, Tipo: ${feedback}`,
		);
		const result = await runAsync(
			"UPDATE interacoes_ia SET feedback_usuario = ?, justificativa_feedback = ? WHERE id = ?",
			[feedback, justificativa, interacaoId],
		);
		console.log(
			`[DB] Feedback atualizado. ID ${interacaoId}. Mudanças: ${result.changes}`,
		);
		return result.changes > 0;
	} catch (error) {
		console.error("[DB] Erro ao registrar feedback:", error);
		return false;
	}
};

export const obterAprendizadosRecentes = async (limite = 5) => {
	try {
		// Busca feedbacks negativos para aprender o que NÃO fazer
		return await allAsync(
			`SELECT id, mensagem_usuario, resposta_ia, justificativa_feedback 
			 FROM interacoes_ia 
			 WHERE feedback_usuario = 'negativo' 
			 ORDER BY data_hora DESC LIMIT ?`,
			[limite],
		);
	} catch (error) {
		console.error("Erro ao obter aprendizados:", error);
		return [];
	}
};

export const deletarAprendizado = async (id) => {
	try {
		const result = await runAsync(
			"UPDATE interacoes_ia SET feedback_usuario = NULL, justificativa_feedback = NULL WHERE id = ?",
			[id],
		);
		return result.changes > 0;
	} catch (error) {
		console.error("Erro ao deletar aprendizado:", error);
		return false;
	}
};

/**
 * RELATÓRIOS
 */

export default {
	buscarClientePorTelefone,
	buscarClientePorId,
	listarClientes,
	criarCliente,
	atualizarCliente,
	registrarChamada,
	buscarChamada,
	finalizarChamada,
	listarChamadasCliente,
	buscarAtendenteLivre,
	atualizarStatusAtendente,
	registrarInteracaoIa,
	buscarProblemasPorCategoria,
	listarProblemas,
	adicionarProblema,
	deletarProblema,
	atualizarProblema,
	buscarSolucao,
	obterEstatisticas,
	listarRegrasAtivas,
	adicionarRegra,
	deletarRegra,
	atualizarRegra,
	registrarFeedback,
	obterAprendizadosRecentes,
	listarAgentes,
	buscarAgente,
	criarAgente,
	atualizarAgente,
	deletarAgente,
	deletarAprendizado,
};
