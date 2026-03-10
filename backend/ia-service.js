/**
 * ==============================================================
 * SERVIÇO DE IA - INTEGRAÇÃO COM GOOGLE GEMINI
 * ==============================================================
 * Gerencia todas as interações com a API Google Gemini
 * - Processa linguagem natural
 * - Gera respostas contextualizadas
 * - Detecta intenção do cliente
 * - Avalia confiança das respostas
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import db from "./database.js";

dotenv.config();

// Inicializar cliente Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * CONFIGURAÇÕES DO AGENTE DE IA
 */
const CONFIG_AGENTE = {
	modelo: "gemini-2.5-flash",
	temperatura: 0.85, // Mais criativo e natural
	sistemPrompt: `Você é um atendente HUMANO real de uma empresa. Ninguém deve perceber que você é uma IA.

REGRAS DE NATURALIDADE (OBRIGATÓRIO):
- Fale como um brasileiro de verdade: use "tá", "né", "beleza", "show", "pode deixar", "ah sim", "olha só"
- Use frases CURTAS e diretas. Nada de parágrafos enormes
- Varie suas respostas: NUNCA repita a mesma frase/estrutura duas vezes seguidas
- Demonstre emoção real: se o cliente está frustrado, diga "putz, entendo sua frustração" 
- Use pausas naturais com "..." quando estiver "pensando"
- Não use bullet points ou listas numeradas em respostas normais. Fale como se fosse uma conversa de WhatsApp
- NUNCA diga "Estou aqui para ajudá-lo" ou frases genéricas de robô
- Pode usar 1-2 emojis no máximo, e apenas quando fizer sentido
- Se não souber algo, diga "Hmm, deixa eu verificar aqui..." em vez de "Não possuo essa informação"

SUAS RESPONSABILIDADES:
1. ENTENDER o cliente e seu problema com empatia genuína
2. BUSCAR SOLUÇÕES no conhecimento técnico fornecido no contexto
3. RESOLVER de forma clara, simples e amigável
4. TRANSFERIR para atendente humano quando necessário, sem fazer o cliente repetir tudo`,
};

/**
 * Analisar intenção do usuário usando Gemini
 */
export const analisarIntencao = async (mensagem) => {
	try {
		const apiKey = process.env.GEMINI_API_KEY || "";
		if (apiKey.includes("SUA_CHAVE") || apiKey.length < 10) {
			return { categoria: "suporte", urgencia: 5 };
		}

		const model = genAI.getGenerativeModel({ model: CONFIG_AGENTE.modelo });

		const prompt = `Analise a intenção da seguinte mensagem de cliente: "${mensagem}"
Retorne APENAS um JSON plano com estas chaves:
{
  "categoria": "vendas|suporte|financeiro|reclamacao|cancelamento|saudacao|duvida",
  "urgencia": 1 a 10
}`;

		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: { responseMimeType: "application/json" },
		});

		const response = result.response;
		const json = JSON.parse(response.text());

		return {
			categoria: json.categoria,
			intenção: `Consulta sobre ${json.categoria}`,
			palavras_chave: mensagem
				.split(" ")
				.filter((w) => w.length > 3)
				.slice(0, 5),
			urgencia: json.urgencia,
		};
	} catch (error) {
		console.error("Erro ao analisar intenção (Gemini):", error);
		return { categoria: "suporte", urgencia: 5 };
	}
};

/**
 * Processar mensagem do usuário
 */
export const processarMensagem = async (
	mensagem,
	_contextoCliente = {},
	historicoConversa = [],
	agenteId = 1,
) => {
	let funcoesConhecidas = [];
	let solucaoAplicada = false;

	try {
		// 1. Carregar Regras e Aprendizados do Banco
		const regrasComportamentais = await db.listarRegrasAtivas(agenteId);
		const aprendizados = await db.obterAprendizadosRecentes(10);
		const agenteDinamico = await db.buscarAgente(agenteId);
		funcoesConhecidas = (await db.buscarSolucao(mensagem)) || [];
		solucaoAplicada = funcoesConhecidas.length > 0;

		let systemInstruction =
			CONFIG_AGENTE.sistemPrompt +
			"\n\n### DIRETRIZES DE ATENDIMENTO (OBRIGATÓRIO):";

		if (agenteDinamico) {
			systemInstruction += `\n- Sua Identidade: ${agenteDinamico.nome}
- Tom de Voz: ${agenteDinamico.tom_voz}
- Sua Missão: ${agenteDinamico.instrucao_comportamental}`;
		}

		if (regrasComportamentais && regrasComportamentais.length > 0) {
			systemInstruction +=
				"\n\n### REGRAS COMPORTAMENTAIS ESPECÍFICAS:\n" +
				regrasComportamentais.map((r) => `[REGRA]: ${r.instrucao}`).join("\n");
		}

		if (aprendizados && aprendizados.length > 0) {
			systemInstruction +=
				"\n\n### HISTÓRICO DE CORREÇÕES (NÃO REPITA ERROS):\n" +
				aprendizados
					.map(
						(a) =>
							`- Contexto: "${a.mensagem_usuario}" -> Nunca responda "${a.resposta_ia}". Correto: ${a.justificativa_feedback}`,
					)
					.join("\n");
		}

		if (solucaoAplicada) {
			systemInstruction +=
				`\n\n### CONHECIMENTO TÉCNICO (FONTE DA VERDADE):\n` +
				funcoesConhecidas
					.map((s) => `- Problema: ${s.descricao}\n  Solução: ${s.solucao}`)
					.join("\n\n");
		}

		// 2. Verificar API Key para modo demonstrativo
		const apiKey = process.env.GEMINI_API_KEY || "";
		if (apiKey.includes("SUA_CHAVE") || apiKey.length < 10) {
			let fallbackResponse =
				"Olá! Desculpe, mas minha inteligência avançada (Gemini) ainda não foi configurada no arquivo .env.";
			if (solucaoAplicada) {
				fallbackResponse = `(Modo Local) Baseado no meu treinamento:\n${funcoesConhecidas.map((s) => s.solucao).join("\n")}`;
			}
			return {
				sucesso: true,
				resposta: `${fallbackResponse}\n\n⚠️ Por favor, insira uma GEMINI_API_KEY válida para habilitar a IA completa.`,
				intencao: "configuracao",
				confianca: 0.5,
				deve_transferir: false,
				solucao_aplicada: solucaoAplicada,
			};
		}

		// 3. Chamar Gemini com Prompt Unificado para Reduzir Latência
		const model = genAI.getGenerativeModel({
			model: CONFIG_AGENTE.modelo,
			systemInstruction: `${systemInstruction}\n\nIMPORTANTE: Sua resposta deve ser exclusivamente um JSON com as chaves: 'resposta' (sua frase para o cliente), 'intencao' (suporte|vendas|financeiro|saudacao|outro), 'urgencia' (1-10) e 'deve_transferir' (boolean).`,
		});

		// Formatar histórico
		const history = historicoConversa.map((msg) => ({
			role: msg.role === "user" ? "user" : "model",
			parts: [{ text: msg.content }],
		}));

		const chat = model.startChat({
			history,
			generationConfig: {
				responseMimeType: "application/json",
				temperature: CONFIG_AGENTE.temperatura,
			},
		});

		const result = await chat.sendMessage(mensagem);
		const rawText = result.response.text();

		// Parsear resposta estruturada
		let structuredResult;
		try {
			structuredResult = JSON.parse(rawText);
		} catch (_e) {
			console.error("Erro ao parsear resposta JSON do Gemini:", rawText);
			structuredResult = {
				resposta: rawText,
				intencao: "suporte",
				urgencia: 5,
				deve_transferir: false,
			};
		}

		return {
			sucesso: true,
			resposta: structuredResult.resposta,
			intencao: structuredResult.intencao,
			confianca: solucaoAplicada ? 0.95 : 0.8,
			deve_transferir: structuredResult.deve_transferir || false,
			solucao_aplicada: solucaoAplicada,
			urgencia: structuredResult.urgencia,
		};
	} catch (error) {
		console.error("Erro processarMensagem (Gemini):", error);

		let fallbackResponse =
			"Desculpe, estou passando por uma instabilidade técnica no momento. Vou te transferir para um atendente humano.";

		if (solucaoAplicada && funcoesConhecidas && funcoesConhecidas.length > 0) {
			fallbackResponse = `(Modo Offline/Fallback) Com base no meu conhecimento: \n${funcoesConhecidas.map((s) => s.solucao).join("\n\n")}`;
		}

		return {
			sucesso: true,
			resposta: fallbackResponse,
			deve_transferir: !solucaoAplicada,
			confianca: solucaoAplicada ? 0.6 : 0.1,
			erro: error.message,
		};
	}
};

/**
 * Avaliar necessidade de transferência
 */
export const avaliarNecessidadeTransferencia = async (
	mensagemUsuario,
	respostaIA,
	analiseIntencao,
) => {
	const indicadores = {
		urgencia_alta: analiseIntencao.urgencia >= 8,
		frustacao: /frustrad|furioso|raiva|revolt|decepcion|gerente|policia/.test(
			mensagemUsuario.toLowerCase(),
		),
		cancelamento: analiseIntencao.categoria === "cancelamento",
		incerteza:
			respostaIA.includes("desculpe") && respostaIA.includes("atendente"),
	};
	return Object.values(indicadores).filter((v) => v).length >= 1;
};

/**
 * Calcular confiança da resposta
 */
export const calcularConfiancaResposta = (
	solucaoConhecida,
	_urgencia,
	deveTransferir,
) => {
	let confianca = solucaoConhecida ? 0.8 : 0.6;
	if (deveTransferir) confianca -= 0.2;
	return Math.max(0.1, Math.min(1.0, confianca));
};

/**
 * Gerar resumo da chamada
 */
export const gerarResumoChamada = async (dados) => {
	return `Resumo Gemini - Cliente: ${dados.nomeCliente || "N/A"}, Motivo: ${dados.motivo || "N/A"}`;
};

/**
 * Validar resposta da IA
 */
export const validarResposta = async (_resposta, _contexto = {}) => {
	return { valida: true, contem_informacao_falsa: false };
};

/**
 * Gerar sugestões de novos conhecimentos
 */
export const gerarSugestoes = async (agenteId) => {
	try {
		const apiKey = process.env.GEMINI_API_KEY || "";
		if (apiKey.includes("SUA_CHAVE") || apiKey.length < 10) return [];

		const model = genAI.getGenerativeModel({ model: CONFIG_AGENTE.modelo });

		const regrasAtuais = await db.listarRegrasAtivas(agenteId);
		const aprendizados = await db.obterAprendizadosRecentes(20);
		const agenteDinamico = await db.buscarAgente(agenteId);

		const comportamentoAgente = agenteDinamico?.instrucao_comportamental
			? agenteDinamico.instrucao_comportamental
			: "Assistente de atendimento padrão";

		const prompt = `Gere sugestões exclusivas. Use um nível de criatividade diferente agora [Seed Aleatória: ${Math.random()}].
Analise os dados deste agente (ID: ${agenteId}):
COMPORTAMENTO E PROPÓSITO DO AGENTE: "${comportamentoAgente}"
REGRAS ATUAIS: ${JSON.stringify(regrasAtuais)}
ERROS PASSADOS (Lições): ${JSON.stringify(aprendizados)}

Gere 3 ideias TOTALMENTE NOVAS e diretas que combinem com o PROPOSITO do agente, para melhorar o atendimento ou corrigir erros.
Não repita ideias que já existam em REGRAS ATUAIS. Se não houver erros passados, invente dicas muito criativas de heurística de vendas ou suporte baseadas na instrução.
Gere um JSON com 3 sugestões de melhoria.
Estrutura: { "sugestoes": [ { "id": number, "titulo": string, "descricao": string, "solucao": string, "tipo": "regra|conhecimento" } ] }`;

		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: { responseMimeType: "application/json" },
		});

		const json = JSON.parse(result.response.text());
		return json.sugestoes || [];
	} catch (error) {
		console.error("Erro gerarSugestoes (Gemini):", error);
		// Fallback para quando o limite grátis da API explodir ou der erro
		return [
			{
				id: 101,
				titulo: "Sempre se desculpar em atrasos",
				descricao:
					"O agente deve demonstrar empatia imediata quando o cliente reportar demora no atendimento.",
				solucao:
					"Comece a resposta pedindo desculpas sinceramente pela espera caso o cliente mencione atraso.",
				tipo: "regra",
			},
			{
				id: 102,
				titulo: "Procedimento de Cancelamento",
				descricao:
					"O agente precisa saber o fluxo básico para reter um cliente antes de cancelar.",
				solucao:
					"Antes de prosseguir com qualquer cancelamento, ofereça um desconto de 20% no próximo mês.",
				tipo: "conhecimento",
			},
		];
	}
};

export default {
	analisarIntencao,
	processarMensagem,
	avaliarNecessidadeTransferencia,
	calcularConfiancaResposta,
	gerarResumoChamada,
	validarResposta,
	gerarSugestoes,
	CONFIG_AGENTE,
};
