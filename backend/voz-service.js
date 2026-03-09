/**
 * ==============================================================
 * SERVIÇO DE VOZ - INTEGRAÇÃO COM TWILIO
 * ==============================================================
 * Gerencia chamadas telefônicas via Twilio
 * - Receber chamadas
 * - Processar áudio
 * - Gerar resposta de voz (TTS)
 * - Transferir para atendentes
 * - Registrar chamadas
 */

import twilio from "twilio";
import db from "./database.js";
import iaService from "./ia-service.js";

// Inicializar cliente Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// biome-ignore lint/suspicious/noExplicitAny: será usado na transferência real
const twilioClient = twilio(accountSid, authToken);

/**
 * CONFIGURAÇÕES DE VOZ
 */
const CONFIG_VOZ = {
	idioma: process.env.VOICE_LANGUAGE || "pt-BR",
	velocidade: process.env.VOICE_SPEED || "medium", // slow, medium, fast
	genero: process.env.VOICE_GENDER || "female",
	sotaque: "br",
};

/**
 * Função auxiliar para envolver texto em configurações de prosódia (velocidade)
 * @param {string} texto - Texto original
 * @returns {string} Texto com tags SSML
 */
const aplicarProsodia = (texto) => {
	let rate = "100%";
	if (CONFIG_VOZ.velocidade === "slow") rate = "75%";
	if (CONFIG_VOZ.velocidade === "fast") rate = "125%";
	
	return `<speak><prosody rate="${rate}">${texto}</prosody></speak>`;
};

/**
 * Manipulador de chamada recebida
 * Retorna XML/TwiML para Twilio
 * @param {string} telefoneChamador - Número que chamou
 * @returns {string} TwiML response
 */
export const handleChamadaRecebida = async (req, res) => {
	try {
		const telefoneChamador = req.body.From;

		// 1. Buscar cliente no banco de dados
		const cliente = await db.buscarClientePorTelefone(telefoneChamador);

		// 2. Criar resposta TwiML
		const twiml = new twilio.twiml.VoiceResponse();

		if (cliente) {
			// Cliente encontrado - cumprimentar personalmente
			const saudacao = `Olá ${cliente.nome}, bem-vindo! Como posso ajudá-lo hoje?`;
			twiml.say({ voice: "alice", language: CONFIG_VOZ.idioma }, aplicarProsodia(saudacao));
		} else {
			// Cliente novo - saudação genérica
			const saudacao =
				"Bem-vindo! Por favor, registre sua informação ou diga como posso ajudá-lo.";
			twiml.say({ voice: "alice", language: CONFIG_VOZ.idioma }, aplicarProsodia(saudacao));
		}

		// 3. Coletar input de voz do usuário
		twiml.gather({
			numDigits: 1,
			action: "/api/voz/processar-input",
			method: "POST",
			timeout: 5,
			speechTimeout: "auto",
			language: CONFIG_VOZ.idioma,
			speechModel: "numbers_and_commands",
			maxSpeechTime: 60,
		});

		res.type("text/xml");
		res.send(twiml.toString());
	} catch (error) {
		console.error("Erro ao handle chamada:", error);

		// Resposta de erro
		const twiml = new twilio.twiml.VoiceResponse();
		twiml.say(
			{ voice: "alice", language: CONFIG_VOZ.idioma },
			aplicarProsodia("Desculpe, ocorreu um erro. Tentando conectar com um atendente."),
		);

		res.type("text/xml");
		res.send(twiml.toString());
	}
};

/**
 * Processar input de voz/teclado
 * @param {Object} req - Request do Twilio
 * @param {Object} res - Response
 */
export const procesarInput = async (req, res) => {
	try {
		const { SpeechResult, Digits, CallSid } = req.body;
		const inputUsuario = SpeechResult || Digits || "";

		// 1. Buscar cliente
		const telefoneChamador = req.body.From;
		let cliente = await db.buscarClientePorTelefone(telefoneChamador);

		// 2. Se cliente novo, criar registro
		if (!cliente) {
			// Aqui seria necessário coletar dados (nome, etc)
			// Por enquanto, criar cliente genérico
			const novoClienteId = await db.criarCliente({
				nome: "Cliente de Teste",
				telefone: telefoneChamador,
				email: `cliente-${Date.now()}@unknown.com`,
			});
			cliente = await db.buscarClientePorId(novoClienteId);
		}

		// 3. Registrar chamada
		const chamadaId = await db.registrarChamada(cliente.id, inputUsuario);

		// 4. Processar com IA
		const respostaIA = await iaService.processarMensagem(
			inputUsuario,
			cliente,
			[], // Histórico vazio na primeira mensagem
		);

		// 5. Registrar interação
		await db.registrarInteracaoIa(chamadaId, {
			tipo: "voz",
			mensagem_usuario: inputUsuario,
			resposta_ia: respostaIA.resposta,
			confianca_resposta: respostaIA.confianca,
		});

		// 6. Criar resposta TwiML
		const twiml = new twilio.twiml.VoiceResponse();

		// Falar resposta da IA
		twiml.say(
			{ voice: "alice", language: CONFIG_VOZ.idioma },
			aplicarProsodia(respostaIA.resposta),
		);

		// 7. Decidir próximo passo
		if (respostaIA.deve_transferir) {
			// Transferir para atendente
			twiml.say(
				{ voice: "alice", language: CONFIG_VOZ.idioma },
				aplicarProsodia("Um momento, vou conectar você com um de nossos atendentes."),
			);

			// Registrar que foi transferido
			await db.finalizarChamada(chamadaId, {
				resultado: "Transferido para atendente",
				transferido_para_atendente: true,
				foi_resolvido: false,
			});

			// Transferir chamada
			const atendente = await db.buscarAtendenteLivre();
			if (atendente) {
				twiml.dial(atendente.telefone_interno);
			} else {
				twiml.say(
					{ voice: "alice", language: CONFIG_VOZ.idioma },
					aplicarProsodia("Desculpe, no momento não há atendentes disponíveis. Deixe uma mensagem."),
				);
				twiml.record({
					maxLength: 120,
					transcribe: true,
					action: "/api/voz/mensagem-registrada",
				});
			}
		} else {
			// Perguntar se resolveu
			twiml.say(
				{ voice: "alice", language: CONFIG_VOZ.idioma },
				aplicarProsodia("A sua solicitação foi resolvida? Digite 1 para sim ou 2 para não."),
			);

			twiml.gather({
				numDigits: 1,
				action: "/api/voz/confirmar-resolucao",
				method: "POST",
				timeout: 5,
			});
		}

		// 7. Armazenar dados da chamada na sessão/cache
		// (Em produção, usar Redis ou similar)
		global.chamadasAtivas = global.chamadasAtivas || {};
		global.chamadasAtivas[CallSid] = {
			chamadaId,
			clienteId: cliente.id,
			cliente,
			respostaIA,
		};

		res.type("text/xml");
		res.send(twiml.toString());
	} catch (error) {
		console.error("Erro ao processar input:", error);

		const twiml = new twilio.twiml.VoiceResponse();
		twiml.say(
			{ voice: "alice", language: CONFIG_VOZ.idioma },
			"Desculpe, ocorreu um erro no processamento.",
		);
		twiml.hangup();

		res.type("text/xml");
		res.send(twiml.toString());
	}
};

/**
 * Confirmar se problema foi resolvido
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
export const confirmarResolucao = async (req, res) => {
	try {
		const { Digits, CallSid } = req.body;
		const chamadaAtiva = global.chamadasAtivas?.[CallSid];

		if (!chamadaAtiva) {
			const twiml = new twilio.twiml.VoiceResponse();
			twiml.say(
				{ voice: "alice", language: CONFIG_VOZ.idioma },
				aplicarProsodia("Sessão expirada."),
			);
			twiml.hangup();
			res.type("text/xml");
			res.send(twiml.toString());
			return;
		}

		const foiResolvido = Digits === "1";

		// Finalizar chamada
		await db.finalizarChamada(chamadaAtiva.chamadaId, {
			resultado: foiResolvido ? "Resolvido" : "Não resolvido",
			foi_resolvido: foiResolvido,
			transferido_para_atendente: false,
		});

		// Resposta final
		const twiml = new twilio.twiml.VoiceResponse();

		if (foiResolvido) {
			twiml.say(
				{ voice: "alice", language: CONFIG_VOZ.idioma },
				aplicarProsodia("Ótimo! Fico feliz em ter ajudado. Obrigado por usar nosso serviço. Até logo!"),
			);
		} else {
			twiml.say(
				{ voice: "alice", language: CONFIG_VOZ.idioma },
				aplicarProsodia("Desculpe que não consegui resolver. Vou conectar com um atendente."),
			);
			// Transferir...
		}

		twiml.hangup();

		// Limpar dados da sessão
		delete global.chamadasAtivas[CallSid];

		res.type("text/xml");
		res.send(twiml.toString());
	} catch (error) {
		console.error("Erro ao confirmar resolução:", error);

		const twiml = new twilio.twiml.VoiceResponse();
		twiml.hangup();

		res.type("text/xml");
		res.send(twiml.toString());
	}
};

/**
 * Registrar mensagem de voz deixada
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
export const registrarMensagemVoz = async (req, res) => {
	try {
		const { RecordingUrl, CallSid, Transcription } = req.body;
		const chamadaAtiva = global.chamadasAtivas?.[CallSid];

		if (chamadaAtiva) {
			// Registrar transcription na chamada
			await db.finalizarChamada(chamadaAtiva.chamadaId, {
				resultado: "Mensagem deixada",
				transcricao: Transcription || "Não transcrita",
				transferido_para_atendente: false,
				foi_resolvido: false,
				notas_internas: `URL de áudio: ${RecordingUrl}`,
			});

			// Notificar atendentes sobre nova mensagem
			console.log("📱 Nova mensagem de voz registrada:", {
				cliente: chamadaAtiva.cliente.nome,
				transcricao: Transcription,
			});
		}

		const twiml = new twilio.twiml.VoiceResponse();
		twiml.say(
			{ voice: "alice", language: CONFIG_VOZ.idioma },
			aplicarProsodia("Obrigado pela sua mensagem. Um atendente retornará em breve."),
		);
		twiml.hangup();

		res.type("text/xml");
		res.send(twiml.toString());
	} catch (error) {
		console.error("Erro ao registrar mensagem:", error);
	}
};

/**
 * Transferir chamada para atendente específico
 * @param {number} chamadaId - ID da chamada
 * @param {string} especialidade - Especialidade needed
 * @returns {Promise<Object>} Atendente atribuído
 */
export const transferirParaAtendente = async (
	chamadaId,
	especialidade = null,
) => {
	try {
		// Buscar atendente disponível
		const atendente = await db.buscarAtendenteLivre(especialidade);

		if (!atendente) {
			console.log("⚠️ Nenhum atendente disponível");
			return null;
		}

		// Buscar chamada para obter dados (será usado na transferência real)
		const _chamada = await db.buscarChamada(chamadaId);

		// Aqui você faria a transferência real via Twilio
		// twilioClient.calls(chamada.sid).update({
		//   url: `https://seu-dominio/api/voz/transferir?atendente=${atendente.id}`,
		//   method: 'POST'
		// });

		// Atualizar status do atendente
		await db.atualizarStatusAtendente(atendente.id, "ocupado");

		return atendente;
	} catch (error) {
		console.error("Erro ao transferir:", error);
		return null;
	}
};

export default {
	handleChamadaRecebida,
	procesarInput,
	confirmarResolucao,
	registrarMensagemVoz,
	transferirParaAtendente,
	CONFIG_VOZ,
};
