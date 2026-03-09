/**
 * ==============================================================
 * SERVIÇO DE BANCO DE DADOS
 * ==============================================================
 * Fornece funções para interagir com o banco de dados SQLite
 * Todas as operações CRUD para clientes, chamadas, etc.
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Configurar caminho do banco de dados
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.db');

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
    const cliente = await getAsync('SELECT * FROM clientes WHERE telefone = ?', [telefone]);
    return cliente;
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
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
    const cliente = await getAsync('SELECT * FROM clientes WHERE id = ?', [clienteId]);
    return cliente;
  } catch (error) {
    console.error('Erro ao buscar cliente por ID:', error);
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
      'SELECT * FROM clientes ORDER BY data_cadastro DESC LIMIT ? OFFSET ?',
      [porPagina, offset]
    );
    return clientes;
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
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
      ]
    );
    return resultado.lastID;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
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
    const setClauses = campos.map((campo) => `${campo} = ?`).join(', ');

    await runAsync(`UPDATE clientes SET ${setClauses} WHERE id = ?`, [...valores, clienteId]);

    return true;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
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
      [uuidv4(), clienteId, motivoChamada]
    );

    // Atualizar última interação do cliente
    await runAsync('UPDATE clientes SET ultima_interacao = CURRENT_TIMESTAMP WHERE id = ?', [
      clienteId,
    ]);

    return resultado.lastID;
  } catch (error) {
    console.error('Erro ao registrar chamada:', error);
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
    const chamada = await getAsync('SELECT * FROM chamadas WHERE id = ?', [chamadaId]);
    return chamada;
  } catch (error) {
    console.error('Erro ao buscar chamada:', error);
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
      ]
    );

    return true;
  } catch (error) {
    console.error('Erro ao finalizar chamada:', error);
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
      [clienteId, limite]
    );
    return chamadas;
  } catch (error) {
    console.error('Erro ao listar chamadas:', error);
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
    let sql = 'SELECT * FROM atendentes WHERE status = ?';
    const params = ['disponivel'];

    if (especialidade) {
      sql += ' AND especialidade = ?';
      params.push(especialidade);
    }

    sql += ' ORDER BY chamadas_atendidas ASC LIMIT 1';

    const atendente = await getAsync(sql, params);
    return atendente;
  } catch (error) {
    console.error('Erro ao buscar atendente livre:', error);
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
    await runAsync('UPDATE atendentes SET status = ? WHERE id = ?', [status, atendenteId]);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status atendente:', error);
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
      'SELECT COUNT(*) as count FROM interacoes_ia WHERE chamada_id = ?',
      [chamadaId]
    );

    const sequencia = (resultado?.count || 0) + 1;

    await runAsync(
      `INSERT INTO interacoes_ia 
       (chamada_id, sequencia, tipo, mensagem_usuario, resposta_ia, confianca_resposta) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        chamadaId,
        sequencia,
        interacao.tipo,
        interacao.mensagem_usuario,
        interacao.resposta_ia,
        interacao.confianca_resposta || 0.8,
      ]
    );

    return true;
  } catch (error) {
    console.error('Erro ao registrar interação IA:', error);
    return false;
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
      'SELECT * FROM problemas_conhecidos WHERE categoria = ? ORDER BY prioridade DESC',
      [categoria]
    );
    return problemas;
  } catch (error) {
    console.error('Erro ao buscar problemas:', error);
    return [];
  }
};

/**
 * Listar todos os problemas / base de conhecimento
 */
export const listarProblemas = async () => {
  try {
    return await allAsync(
      'SELECT * FROM problemas_conhecidos ORDER BY prioridade DESC, data_criacao DESC'
    );
  } catch (error) {
    console.error('Erro ao listar problemas:', error);
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
      [dados.categoria, dados.descricao, dados.solucao, dados.palavras_chave, dados.prioridade || 5]
    );
    return resultado.lastID;
  } catch (error) {
    console.error('Erro ao adicionar problema conhecidos:', error);
    return null;
  }
};

/**
 * Deletar problema da base de treinamento
 */
export const deletarProblema = async (id) => {
  try {
    await runAsync('DELETE FROM problemas_conhecidos WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Erro ao deletar problema:', error);
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
    // Converter palavras-chave em padrão de busca
    const termos = palavrasChave.toLowerCase().split(' ');

    // Buscar problemas que correspondem aos termos
    const problemas = await allAsync('SELECT * FROM problemas_conhecidos ORDER BY prioridade DESC');

    // Encontrar melhor correspondência
    let melhorMatch = null;
    let melhorScore = 0;

    problemas.forEach((problema) => {
      const palavrasProblema = problema.palavras_chave.toLowerCase().split(',');
      let score = 0;

      termos.forEach((termo) => {
        if (palavrasProblema.some((palavra) => palavra.includes(termo.trim()))) {
          score++;
        }
      });

      if (score > melhorScore) {
        melhorScore = score;
        melhorMatch = problema;
      }
    });

    return melhorMatch;
  } catch (error) {
    console.error('Erro ao buscar solução:', error);
    return null;
  }
};

/**
 * OPERAÇÕES DE RELATÓRIOS
 */

/**
 * Obter estatísticas do sistema
 * @returns {Promise<Object>} Estatísticas gerais
 */
export const obterEstatisticas = async () => {
  try {
    const totalClientes = await getAsync('SELECT COUNT(*) as count FROM clientes');
    const totalChamadas = await getAsync('SELECT COUNT(*) as count FROM chamadas');
    const chamadasResolvidas = await getAsync(
      'SELECT COUNT(*) as count FROM chamadas WHERE foi_resolvido = 1'
    );
    const chamadasTransferidas = await getAsync(
      'SELECT COUNT(*) as count FROM chamadas WHERE transferido_para_atendente = 1'
    );

    return {
      total_clientes: totalClientes?.count || 0,
      total_chamadas: totalChamadas?.count || 0,
      chamadas_resolvidas: chamadasResolvidas?.count || 0,
      chamadas_transferidas: chamadasTransferidas?.count || 0,
      taxa_resolucao:
        (((chamadasResolvidas?.count || 0) / (totalChamadas?.count || 1)) * 100).toFixed(2) + '%',
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {};
  }
};

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
  buscarSolucao,
  obterEstatisticas,
};
