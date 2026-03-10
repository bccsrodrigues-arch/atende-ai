/**
 * ==============================================================
 * SERVIDOR PRINCIPAL - EXPRESS
 * ==============================================================
 * Configuração do servidor com:
 * - Rotas de API REST
 * - Webhooks do Twilio
 * - Dashboard admin
 * - Autenticação básica
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Importar serviços
import dbService from "./database.js";
import iaService from "./ia-service.js";
import vozService from "./voz-service.js";

// Configuração
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Obter diretório
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * MIDDLEWARES
 */

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use(
	cors({
		origin: "*",
		credentials: true,
	}),
);

// Logging de requisições
app.use((req, _res, next) => {
	console.log(`\n📡 ${req.method} ${req.path}`);
	console.log("   Headers:", req.headers);
	next();
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/**
 * ================================================
 * ROTAS DE VOZ/TWILIO (CHAMADAS TELEFÔNICAS)
 * ================================================
 */

/**
 * POST /api/voz/chamada-recebida
 * Webhook Twilio - Nova chamada recebida
 * Exemplo: curl -X POST http://localhost:3000/api/voz/chamada-recebida -d "From=%2B5511999999999"
 */
app.post("/api/voz/chamada-recebida", vozService.handleChamadaRecebida);

/**
 * POST /api/voz/processar-input
 * Webhook Twilio - Processar input de voz/teclado
 */
app.post("/api/voz/processar-input", vozService.procesarInput);

/**
 * POST /api/voz/confirmar-resolucao
 * Webhook Twilio - Confirmar se problema foi resolvido
 */
app.post("/api/voz/confirmar-resolucao", vozService.confirmarResolucao);

/**
 * POST /api/voz/mensagem-registrada
 * Webhook Twilio - Mensagem de voz deixada
 */
app.post("/api/voz/mensagem-registrada", vozService.registrarMensagemVoz);

/**
 * ================================================
 * ROTAS DE API REST (GERENCIAR DADOS)
 * ================================================
 */

/**
 * GET /api/clientes
 * Listar todos os clientes com paginação
 * Query params: page=1, perPage=20
 */
app.get("/api/clientes", async (req, res) => {
	try {
		const page = req.query.page || 1;
		const perPage = req.query.perPage || 20;

		const clientes = await dbService.listarClientes(page, perPage);
		const stats = await dbService.obterEstatisticas();

		res.json({
			sucesso: true,
			dados: clientes,
			paginacao: {
				pagina: page,
				por_pagina: perPage,
				total: stats.total_clientes,
			},
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * GET /api/clientes/:id
 * Obter detalhes de um cliente
 */
app.get("/api/clientes/:id", async (req, res) => {
	try {
		const cliente = await dbService.buscarClientePorId(req.params.id);

		if (!cliente) {
			return res.status(404).json({
				sucesso: false,
				erro: "Cliente não encontrado",
			});
		}

		// Buscar histórico de chamadas
		const chamadas = await dbService.listarChamadasCliente(cliente.id);

		res.json({
			sucesso: true,
			cliente,
			historico_chamadas: chamadas,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * POST /api/clientes
 * Criar novo cliente
 * Body: { nome, telefone, email, cpf_cnpj?, endereco?, dados_importantes? }
 */
app.post("/api/clientes", async (req, res) => {
	try {
		const { nome, telefone, email, cpf_cnpj, endereco, dados_importantes } =
			req.body;

		// Validação básica
		if (!nome || !telefone || !email) {
			return res.status(400).json({
				sucesso: false,
				erro: "Nome, telefone e email são obrigatórios",
			});
		}

		const clienteId = await dbService.criarCliente({
			nome,
			telefone,
			email,
			cpf_cnpj,
			endereco,
			dados_importantes,
		});

		if (!clienteId) {
			return res.status(400).json({
				sucesso: false,
				erro: "Erro ao criar cliente (pode estar duplicado)",
			});
		}

		const novoCliente = await dbService.buscarClientePorId(clienteId);

		res.status(201).json({
			sucesso: true,
			mensagem: "Cliente criado com sucesso",
			cliente: novoCliente,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * PUT /api/clientes/:id
 * Atualizar dados do cliente
 */
app.put("/api/clientes/:id", async (req, res) => {
	try {
		const resultado = await dbService.atualizarCliente(req.params.id, req.body);

		if (!resultado) {
			return res.status(400).json({
				sucesso: false,
				erro: "Erro ao atualizar cliente",
			});
		}

		const clienteAtualizado = await dbService.buscarClientePorId(req.params.id);

		res.json({
			sucesso: true,
			mensagem: "Cliente atualizado com sucesso",
			cliente: clienteAtualizado,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * ================================================
 * ROTAS DE TREINAMENTO (BASE DE CONHECIMENTO)
 * ================================================
 */

/**
 * GET /api/treinamento/problemas
 * Listar base de conhecimento (problemas resolvidos)
 */
app.get("/api/treinamento/problemas", async (_req, res) => {
	try {
		const problemas = await dbService.listarProblemas();
		res.json({ sucesso: true, dados: problemas });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * POST /api/treinamento/problemas
 * Treinar IA com novo problema/solução
 */
app.post("/api/treinamento/problemas", async (req, res) => {
	try {
		const { categoria, descricao, solucao, palavras_chave, prioridade } =
			req.body;

		if (!categoria || !descricao || !solucao) {
			return res.status(400).json({
				sucesso: false,
				erro: "Categoria, descrição e solução são obrigatórios",
			});
		}

		const id = await dbService.adicionarProblema({
			categoria,
			descricao,
			solucao,
			palavras_chave,
			prioridade,
		});

		if (!id) throw new Error("Falha ao adicionar ao banco de dados");
		res.status(201).json({
			sucesso: true,
			mensagem: "Base de conhecimento atualizada com sucesso",
			id,
		});
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * PUT /api/treinamento/problemas/:id
 */
app.put("/api/treinamento/problemas/:id", async (req, res) => {
	try {
		const sucesso = await dbService.atualizarProblema(req.params.id, req.body);
		res.json({ sucesso });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * DELETE /api/treinamento/problemas/:id
 * Remover regra da IA
 */
app.delete("/api/treinamento/problemas/:id", async (req, res) => {
	try {
		const foiDeletado = await dbService.deletarProblema(req.params.id);
		if (!foiDeletado)
			throw new Error("Não foi possível excluir (ID não confere ou bloqueado)");
		res.json({
			sucesso: true,
			mensagem: "Regra removida da base de treinamento",
		});
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * ================================================
 * ROTAS DE IA (PROCESSAR TEXTO)
 * ================================================
 */

/**
 * POST /api/ia/processar
 * Processar mensagem de texto (teste da IA)
 * Body: { mensagem, cliente_id?, historico? }
 */
app.post("/api/ia/processar", async (req, res) => {
	const { mensagem, cliente_id, chamada_id, agente_id, historico } = req.body;

	if (!mensagem) {
		return res.status(400).json({ sucesso: false, erro: "Mensagem vazia" });
	}

	try {
		// 1. Processar com o motor de IA do iaService (com suporte a agente_id)
		const targetAgenteId = agente_id || 1;

		// O iaService.processarMensagem já cuida das regras e aprendizado
		const resultadoIa = await iaService.processarMensagem(
			mensagem,
			{ id: cliente_id },
			historico || [],
			targetAgenteId,
		);

		// 2. Registrar a interação no banco
		const idChamadaContexto = chamada_id || 1;
		const interacaoId = await dbService.registrarInteracaoIa(
			idChamadaContexto,
			{
				tipo: "texto",
				mensagem_usuario: mensagem,
				resposta_ia: resultadoIa.resposta,
				confianca_resposta: resultadoIa.confianca,
				agente_id: targetAgenteId,
			},
		);

		res.json({
			sucesso: true,
			interacao_id: interacaoId,
			resposta: {
				...resultadoIa,
				agente_id: targetAgenteId,
			},
		});
	} catch (error) {
		console.error("Erro ao processar IA (Server):", error);
		res
			.status(500)
			.json({ sucesso: false, erro: "Falha no processamento da IA" });
	}
});

/**
 * POST /api/ia/analise-intencao
 * Analisar intenção do usuário
 * Body: { mensagem }
 */
app.post("/api/ia/analise-intencao", async (req, res) => {
	try {
		const { mensagem } = req.body;

		if (!mensagem) {
			return res.status(400).json({
				sucesso: false,
				erro: "Mensagem é obrigatória",
			});
		}

		const analise = await iaService.analisarIntencao(mensagem);

		res.json({
			sucesso: true,
			analise,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * GET /api/ia/sugestoes/:agente_id
 * Gerar sugestões de conhecimento via IA
 */
app.get("/api/ia/sugestoes/:agente_id", async (req, res) => {
	try {
		const sugestoes = await iaService.gerarSugestoes(req.params.agente_id);
		res.json({ sucesso: true, sugestoes });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * ================================================
 * ROTAS DE VOZ (ELEVENLABS TTS)
 * ================================================
 */

/**
 * POST /api/voz/tts
 * Gerar áudio com ElevenLabs
 * Body: { texto, genero: "male"|"female" }
 */
app.post("/api/voz/tts", async (req, res) => {
	const { texto, genero } = req.body;
	const apiKey = process.env.ELEVENLABS_API_KEY || "";

	if (!texto) {
		return res.status(400).json({ sucesso: false, erro: "Texto vazio" });
	}

	if (apiKey.includes("SUA_CHAVE") || apiKey.length < 10) {
		return res.status(400).json({
			sucesso: false,
			erro: "ELEVENLABS_API_KEY não configurada no .env",
		});
	}

	let voiceId = "EXAVITQu4vr4xnSDxMaL"; // Default Female (Alice)
	if (genero === "male") {
		voiceId = process.env.ELEVENLABS_VOICE_MALE || "pNInz6obpgDQGcFmaJgB";
	} else if (genero === "female") {
		voiceId = process.env.ELEVENLABS_VOICE_FEMALE || "EXAVITQu4vr4xnSDxMaL";
	} else if (genero && genero.length > 5) {
		// Se vier um ID específico da ElevenLabs
		voiceId = genero;
	}

	try {
		console.log(`[TTS] Gerando voz com ID: ${voiceId}`);
		const response = await fetch(
			`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
			{
				method: "POST",
				headers: {
					"xi-api-key": apiKey,
					"Content-Type": "application/json",
					Accept: "audio/mpeg",
				},
				body: JSON.stringify({
					text: texto,
					model_id: "eleven_multilingual_v2",
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75,
						style: 0.3,
					},
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("ElevenLabs erro:", response.status, errorText);
			let msgDetalhada = response.statusText;
			try {
				const errorJson = JSON.parse(errorText);
				if (errorJson.detail?.message) {
					msgDetalhada = errorJson.detail.message;
				}
			} catch (_e) {}
			return res
				.status(response.status)
				.json({ sucesso: false, erro: `ElevenLabs: ${msgDetalhada}` });
		}

		// Enviar áudio direto como stream
		res.set({
			"Content-Type": "audio/mpeg",
			"Transfer-Encoding": "chunked",
		});

		const arrayBuffer = await response.arrayBuffer();
		res.send(Buffer.from(arrayBuffer));
	} catch (error) {
		console.error("Erro TTS ElevenLabs:", error);
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * GET /api/voz/voices
 * Listar vozes disponíveis na conta ElevenLabs
 */
app.get("/api/voz/voices", async (_req, res) => {
	const apiKey = process.env.ELEVENLABS_API_KEY || "";

	if (apiKey.includes("SUA_CHAVE") || apiKey.length < 10) {
		return res.json({ sucesso: false, erro: "API Key não configurada" });
	}

	try {
		const response = await fetch("https://api.elevenlabs.io/v1/voices", {
			headers: { "xi-api-key": apiKey },
		});
		const data = await response.json();
		
		if (!response.ok) {
		    return res.status(response.status).json({ sucesso: false, erro: data.detail?.message || "Erro na ElevenLabs" });
		}
		
		const voices = (data.voices || []).map((v) => ({
			id: v.voice_id,
			nome: v.name,
			categoria: v.category,
			preview: v.preview_url,
		}));
		res.json({ sucesso: true, voices });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * ================================================
 * ROTAS DE CHAMADAS
 * ================================================
 */

/**
 * GET /api/chamadas/historico/:cliente_id
 * Obter histórico de chamadas de um cliente
 */
app.get("/api/chamadas/historico/:cliente_id", async (req, res) => {
	try {
		const chamadas = await dbService.listarChamadasCliente(
			req.params.cliente_id,
		);

		res.json({
			sucesso: true,
			chamadas,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * ================================================
 * ROTAS DE DASHBOARD/ADMIN
 * ================================================
 */

/**
 * GET /api/admin/estatisticas
 * Obter estatísticas gerais do sistema
 */
app.get("/api/admin/estatisticas", async (_req, res) => {
	try {
		const stats = await dbService.obterEstatisticas();

		res.json({
			sucesso: true,
			estatisticas: stats,
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * GET /api/admin/dashboard
 * Dados completos para o dashboard
 */
app.get("/api/admin/dashboard", async (_req, res) => {
	try {
		const stats = await dbService.obterEstatisticas();
		const clientesRecentes = await dbService.listarClientes(1, 5);

		res.json({
			sucesso: true,
			dashboard: {
				estatisticas: stats,
				clientes_recentes: clientesRecentes,
			},
		});
	} catch (error) {
		res.status(500).json({
			sucesso: false,
			erro: error.message,
		});
	}
});

/**
 * ================================================
 * ROTAS DE TREINAMENTO E APRENDIZADO
 * ================================================
 */

/**
 * GET /api/admin/regras
 * Listar regras de comportamento ativas
 */
app.get("/api/admin/regras", async (req, res) => {
	try {
		const agenteId = req.query.agente_id;
		const regras = await dbService.listarRegrasAtivas(agenteId);
		res.json({ sucesso: true, regras });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * POST /api/admin/regras
 * Adicionar nova regra de comportamento
 */
app.post("/api/admin/regras", async (req, res) => {
	try {
		const { nome, instrucao, agente_id } = req.body;
		if (!nome || !instrucao) {
			return res
				.status(400)
				.json({ sucesso: false, erro: "Nome e instrução são obrigatórios" });
		}
		const id = await dbService.adicionarRegra(nome, instrucao, agente_id);
		res.json({ sucesso: true, id });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * DELETE /api/admin/regras/:id
 */
app.delete("/api/admin/regras/:id", async (req, res) => {
	try {
		const sucesso = await dbService.deletarRegra(req.params.id);
		res.json({ sucesso });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * PUT /api/admin/regras/:id
 */
app.put("/api/admin/regras/:id", async (req, res) => {
	try {
		const { instrucao } = req.body;
		const sucesso = await dbService.atualizarRegra(req.params.id, instrucao);
		res.json({ sucesso });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * POST /api/ia/feedback
 * Registrar feedback (positivo/negativo) para aprendizado
 */
app.post("/api/ia/feedback", async (req, res) => {
	try {
		const { interacao_id, feedback, justificativa } = req.body;
		if (!interacao_id || !feedback) {
			return res.status(400).json({
				sucesso: false,
				erro: "ID da interação e feedback são obrigatórios",
			});
		}
		const sucesso = await dbService.registrarFeedback(
			interacao_id,
			feedback,
			justificativa,
		);
		if (sucesso) {
			res.json({
				sucesso: true,
				mensagem: "Feedback registrado para aprendizado",
			});
		} else {
			res.status(400).json({
				sucesso: false,
				erro: "Não foi possível registrar o feedback. ID pode ser inválido.",
			});
		}
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * GET /api/admin/aprendizados
 * Listar erros/feedbacks negativos para visualização de aprendizado
 */
app.get("/api/admin/aprendizados", async (_req, res) => {
	try {
		const aprendizados = await dbService.obterAprendizadosRecentes(20);
		res.json({ sucesso: true, aprendizados });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * DELETE /api/admin/aprendizados/:id
 * Excluir um aprendizado/feedback negativo
 */
app.delete("/api/admin/aprendizados/:id", async (req, res) => {
	try {
		const sucesso = await dbService.deletarAprendizado(req.params.id);
		if (sucesso) {
			res.json({ sucesso: true, mensagem: "Aprendizado excluído" });
		} else {
			res
				.status(404)
				.json({ sucesso: false, erro: "Aprendizado não encontrado" });
		}
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});
/**
 * ================================================
 * ROTAS ESTÁTICAS
 * ================================================
 */

/**
 * GET /
 * Servir página principal
 */
app.get("/", (_req, res) => {
	res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

/**
 * GET /dashboard
 * Servir dashboard admin
 */
app.get("/dashboard", (_req, res) => {
	res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

/**
 * ================================================
 * TRATAMENTO DE ERROS
 * ================================================
 */

/**
 * ROTAS DE AGENTES
 */
app.get("/api/admin/agentes", async (_req, res) => {
	try {
		const agentes = await dbService.listarAgentes();
		res.json({ sucesso: true, agentes });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

app.get("/api/admin/agentes/:id", async (req, res) => {
	try {
		const agente = await dbService.buscarAgente(req.params.id);
		if (!agente)
			return res
				.status(404)
				.json({ sucesso: false, erro: "Agente não encontrado" });
		res.json({ sucesso: true, agente });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

app.post("/api/admin/agentes", async (req, res) => {
	try {
		const id = await dbService.criarAgente(req.body);
		res.json({ sucesso: true, id });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

app.put("/api/admin/agentes/:id", async (req, res) => {
	try {
		const sucesso = await dbService.atualizarAgente(req.params.id, req.body);
		res.json({ sucesso });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

app.delete("/api/admin/agentes/:id", async (req, res) => {
	try {
		const sucesso = await dbService.deletarAgente(req.params.id);
		res.json({ sucesso });
	} catch (error) {
		res.status(500).json({ sucesso: false, erro: error.message });
	}
});

/**
 * 404 - Rota não encontrada
 */
app.use((req, res) => {
	res.status(404).json({
		sucesso: false,
		erro: `Rota não encontrada: ${req.path}`,
	});
});

/**
 * 500 - Erro geral
 */
app.use((err, _req, res, _next) => {
	console.error("❌ Erro não tratado:", err);

	res.status(500).json({
		sucesso: false,
		erro: "Erro interno do servidor",
		mensagem: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

/**
 * ================================================
 * INICIAR SERVIDOR
 * ================================================
 */

const startServer = () => {
	const server = app.listen(PORT, "0.0.0.0", () => {
		console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🤖 AGENTE DE IA PARA ATENDER LIGAÇÕES            ║
║                                                            ║
║  ✅ Servidor iniciado em: http://localhost:${PORT}         ║
║                                                            ║
║  Endpoints principais:                                     ║
║  • POST /api/voz/chamada-recebida (Twilio webhook)        ║
║  • GET  /api/clientes                                      ║
║  • GET  /api/admin/dashboard                               ║
║  • GET  / (Frontend)                                       ║
║  • GET  /dashboard (Dashboard admin)                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
	});

	server.on("error", (err) => {
		if (err.code === "EADDRINUSE") {
			console.error(`❌ Porta ${PORT} já está em uso!`);
		} else {
			console.error("❌ Erro no servidor:", err);
		}
		process.exit(1);
	});
};

// Iniciar se não estiver em teste
if (process.env.NODE_ENV !== "test") {
	startServer();
}

export default app;
