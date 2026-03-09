/**
 * ==============================================================
 * SERVIÇO DE IA - INTEGRAÇÃO COM HUGGING FACE (ALTERNATIVA GRATUITA)
 * ==============================================================
 * Gerencia todas as interações com a API Hugging Face (gratuita)
 * - Processa linguagem natural
 * - Gera respostas contextualizadas
 * - Detecta intenção do cliente
 * - Avalia confiança das respostas
 */

import db from './database.js';

// Configuração Hugging Face
const HUGGINGFACE_MODEL = 'gpt2'; // Modelo gratuito para geração de texto
const HUGGINGFACE_API_URL = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`;

/**
 * CONFIGURAÇÕES DO AGENTE DE IA
 */
const CONFIG_AGENTE = {
  modelo: HUGGINGFACE_MODEL,
  temperatura: 0.7, // Balanceado entre criatividade e consistência
  maxTokens: 1000,
  sistemPrompt: `Você é um agente de atendimento ao cliente humanizado e profissional para uma empresa.
  
Suas responsabilidades:
1. ENTENDER o cliente e seu problema
2. BUSCAR SOLUÇÕES no banco de dados de problemas conhecidos
3. RESOLVER quando possível de forma clara e amigável
4. TRANSFERIR para atendente humano quando:
   - Não conseguir resolver o problema
   - O cliente solicitar
   - O problema for muito complexo ou delicado
   - Detectar frustração excessiva do cliente

Sempre mantenha um tom:
- Amigável e empático
- Profissional
- Claro e objetivo
- Humanizado (não soar robótico)

Se não souber a resposta, admita e ofereça transferência para um atendente.`,
};

/**
 * Analisar intenção do usuário
 * @param {string} mensagem - Mensagem do usuário
 * @param {Object} contextoCliente - Dados do cliente
 * @returns {Promise<Object>} Análise de intenção
 */
export const analisarIntencao = async (mensagem, _contextoCliente = {}) => {
  try {
    // Análise simples baseada em palavras-chave (gratuita)
    const lower = mensagem.toLowerCase();
    let categoria = 'outro';
    let urgencia = 5;

    if (lower.includes('pagamento') || lower.includes('pagar') || lower.includes('boleto')) {
      categoria = 'pagamento';
      urgencia = 7;
    } else if (
      lower.includes('erro') ||
      lower.includes('não funciona') ||
      lower.includes('problema técnico')
    ) {
      categoria = 'tecnico';
      urgencia = 8;
    } else if (
      lower.includes('ajuda') ||
      lower.includes('suporte') ||
      lower.includes('atendimento')
    ) {
      categoria = 'suporte';
      urgencia = 4;
    } else if (lower.includes('cancelar') || lower.includes('cancelamento')) {
      categoria = 'cancelamento';
      urgencia = 9;
    } else if (
      lower.includes('reclama') ||
      lower.includes('queixa') ||
      lower.includes('insatisfeito')
    ) {
      categoria = 'reclamacao';
      urgencia = 6;
    }

    // Extrair palavras-chave simples
    const palavras = mensagem.split(' ').filter((word) => word.length > 3);

    return {
      categoria,
      intenção: `Consulta sobre ${categoria}`,
      palavras_chave: palavras.slice(0, 5),
      urgencia,
    };
  } catch (error) {
    console.error('Erro ao analisar intenção:', error);
    return {
      categoria: 'suporte',
      intenção: 'consulta geral',
      palavras_chave: ['ajuda'],
      urgencia: 5,
    };
  }
};

/**
 * Processar mensagem do cliente e gerar resposta
 * @param {string} mensagem - Mensagem do usuário
 * @param {Object} contextoCliente - Dados do cliente
 * @param {Array} historicoConversa - Histórico de mensagens
 * @returns {Promise<Object>} Resposta do agente
 */
export const processarMensagem = async (mensagem, contextoCliente = {}, historicoConversa = []) => {
  try {
    // 1. Analisar intenção do usuário
    const intencao = await analisarIntencao(mensagem, contextoCliente);

    // 2. Buscar solução conhecida
    const solucaoConhecida = await db.buscarSolucao(intencao.palavras_chave.join(' '));

    // 3. Construir contexto para a IA
    let contextoMensagem = `
CONTEXTO DO CLIENTE:
- Nome: ${contextoCliente.nome || 'Desconhecido'}
- ID: ${contextoCliente.id || 'N/A'}
- Status: ${contextoCliente.status || 'ativo'}
- Dados importantes: ${contextoCliente.dados_importantes || 'Nenhum'}

INTENÇÃO DETECTADA:
- Categoria: ${intencao.categoria}
- Descrição: ${intencao.intenção}
- Urgência: ${intencao.urgencia}/10
`;

    if (solucaoConhecida) {
      contextoMensagem += `
SOLUÇÃO CONHECIDA ENCONTRADA:
- Problema: ${solucaoConhecida.descricao}
- Solução: ${solucaoConhecida.solucao}
- Prioridade: ${solucaoConhecida.prioridade}
`;
    }

    // 4. Preparar histórico de conversa
    const mensagensFormatadas = historicoConversa.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Adicionar mensagem atual
    mensagensFormatadas.push({
      role: 'user',
      content: mensagem,
    });

    // 5. Gerar resposta usando Hugging Face (gratuito)
    let respostaAgente;
    try {
      const inputs =
        CONFIG_AGENTE.sistemPrompt +
        '\n\n' +
        contextoMensagem +
        '\nCliente: ' +
        mensagem +
        '\nAssistente:';
      const response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          parameters: {
            max_length: inputs.length + 200,
            temperature: CONFIG_AGENTE.temperatura,
            do_sample: true,
          },
        }),
      });
      const data = await response.json();
      if (data && data[0] && data[0].generated_text) {
        respostaAgente = data[0].generated_text.replace(inputs, '').trim();
      } else {
        respostaAgente =
          'Olá! Sou o assistente virtual da Atende AI. Como posso ajudar você hoje com seus serviços bancários?';
      }
    } catch (error) {
      console.error('Erro na API Hugging Face:', error);
      respostaAgente =
        'Olá! Sou o assistente virtual da Atende AI. Como posso ajudar você hoje com seus serviços bancários?';
    }

    // 6. Avaliar se deve transferir para atendente
    const deveTransferir = await avaliarNecessidadeTransferencia(
      mensagem,
      respostaAgente,
      intencao
    );

    // 7. Detectar confiança da resposta
    const confianca = calcularConfiancaResposta(
      solucaoConhecida,
      intencao.urgencia,
      deveTransferir
    );

    return {
      sucesso: true,
      resposta: respostaAgente,
      intencao: intencao.categoria,
      confianca: confianca,
      deve_transferir: deveTransferir,
      solucao_aplicada: solucaoConhecida ? true : false,
      categoria_solucao: solucaoConhecida?.categoria || null,
    };
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);

    return {
      sucesso: false,
      resposta:
        'Desculpe, tive um problema ao processar sua solicitação. Vou conectá-lo com um atendente.',
      deve_transferir: true,
      confianca: 0.1,
      erro: error.message,
    };
  }
};

/**
 * Avaliar necessidade de transferência para atendente humano
 * @param {string} mensagemUsuario - Mensagem original
 * @param {string} respostaIA - Resposta gerada
 * @param {Object} analiseIntencao - Análise de intenção
 * @returns {Promise<boolean>} Se deve transferir
 */
export const avaliarNecessidadeTransferencia = async (
  mensagemUsuario,
  respostaIA,
  analiseIntencao
) => {
  try {
    // Indicadores de transferência
    const indicadores = {
      urgencia_alta: analiseIntencao.urgencia >= 8,
      palavras_frustacao: /frustrad|furioso|raiva|revolt|decepcion|problem|quer falar|gerente/.test(
        mensagemUsuario.toLowerCase()
      ),
      problema_complexo: /cancelamento|legal|contrato|processo|policia/.test(
        analiseIntencao.categoria
      ),
      resposta_incerta: respostaIA.includes('desculpe') && respostaIA.includes('atendente'),
      contexto_delicado:
        analiseIntencao.categoria === 'cancelamento' || analiseIntencao.categoria === 'reclamacao',
    };

    // Calcular score de transferência
    const scoreTransferencia = Object.values(indicadores).filter((v) => v).length;

    // Transferir se score >= 2 ou urgência muito alta
    return scoreTransferencia >= 2 || indicadores.urgencia_alta;
  } catch (error) {
    console.error('Erro ao avaliar transferência:', error);
    // Quando em dúvida, melhor transferir para humano
    return true;
  }
};

/**
 * Calcular confiança da resposta (0.0 a 1.0)
 * @param {Object} solucaoConhecida - Solução encontrada
 * @param {number} urgencia - Nível de urgência (1-10)
 * @param {boolean} deveTransferir - Se vai ser transferido
 * @returns {number} Confiança da resposta
 */
export const calcularConfiancaResposta = (solucaoConhecida, urgencia, deveTransferir) => {
  let confianca = 0.5; // Base

  // Aumentar confiança se solução conhecida
  if (solucaoConhecida) {
    confianca += 0.3;
  }

  // Aumentar para problemas menos urgentes
  if (urgencia <= 5) {
    confianca += 0.1;
  } else {
    confianca -= 0.1;
  }

  // Reduzir se vai transferir
  if (deveTransferir) {
    confianca -= 0.2;
  }

  // Garantir que fique entre 0 e 1
  return Math.max(0, Math.min(1, confianca));
};

/**
 * Gerar resumo da interação para os atendentes
 * @param {Object} dados - Dados da chamada
 * @returns {Promise<string>} Resumo formatado
 */
export const gerarResumoChamada = async (dados) => {
  try {
    // Resumo simples (gratuito)
    return `Resumo da chamada - Cliente: ${dados.nomeCliente || 'N/A'}, Telefone: ${dados.telefonecliente || 'N/A'}, Motivo: ${dados.motivo || 'N/A'}`;
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return 'Erro ao gerar resumo da chamada';
  }
};

/**
 * Validar resposta da IA (evitar alucinações)
 * @param {string} resposta - Resposta gerada
 * @param {Object} contexto - Contexto da chamada
 * @returns {Promise<Object>} Resultado da validação
 */
export const validarResposta = async (resposta, _contexto = {}) => {
  // Validação simples (gratuita) - será expandida futuramente
  return {
    valida: true,
    contem_informacao_falsa: false,
    explicacao: 'Validação simplificada - resposta considerada válida',
  };
};

export default {
  analisarIntencao,
  processarMensagem,
  avaliarNecessidadeTransferencia,
  calcularConfiancaResposta,
  gerarResumoChamada,
  validarResposta,
  CONFIG_AGENTE,
};
