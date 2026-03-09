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

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar serviços
import dbService from './database.js';
import iaService from './ia-service.js';
import vozService from './voz-service.js';

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
    origin: '*',
    credentials: true,
  })
);

// Logging de requisições
app.use((req, res, next) => {
  console.log(`\n📡 ${req.method} ${req.path}`);
  console.log('   Headers:', req.headers);
  next();
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

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
app.post('/api/voz/chamada-recebida', vozService.handleChamadaRecebida);

/**
 * POST /api/voz/processar-input
 * Webhook Twilio - Processar input de voz/teclado
 */
app.post('/api/voz/processar-input', vozService.procesarInput);

/**
 * POST /api/voz/confirmar-resolucao
 * Webhook Twilio - Confirmar se problema foi resolvido
 */
app.post('/api/voz/confirmar-resolucao', vozService.confirmarResolucao);

/**
 * POST /api/voz/mensagem-registrada
 * Webhook Twilio - Mensagem de voz deixada
 */
app.post('/api/voz/mensagem-registrada', vozService.registrarMensagemVoz);

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
app.get('/api/clientes', async (req, res) => {
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
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await dbService.buscarClientePorId(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado',
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
app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, telefone, email, cpf_cnpj, endereco, dados_importantes } = req.body;

    // Validação básica
    if (!nome || !telefone || !email) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome, telefone e email são obrigatórios',
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
        erro: 'Erro ao criar cliente (pode estar duplicado)',
      });
    }

    const novoCliente = await dbService.buscarClientePorId(clienteId);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Cliente criado com sucesso',
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
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const resultado = await dbService.atualizarCliente(req.params.id, req.body);

    if (!resultado) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Erro ao atualizar cliente',
      });
    }

    const clienteAtualizado = await dbService.buscarClientePorId(req.params.id);

    res.json({
      sucesso: true,
      mensagem: 'Cliente atualizado com sucesso',
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
 * ROTAS DE IA (PROCESSAR TEXTO)
 * ================================================
 */

/**
 * POST /api/ia/processar
 * Processar mensagem de texto (teste da IA)
 * Body: { mensagem, cliente_id?, historico? }
 */
app.post('/api/ia/processar', async (req, res) => {
  try {
    const { mensagem, cliente_id, historico } = req.body;

    if (!mensagem) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Mensagem é obrigatória',
      });
    }

    // Buscar cliente se fornecido
    let cliente = null;
    if (cliente_id) {
      cliente = await dbService.buscarClientePorId(cliente_id);
    }

    // Processar com IA
    const resposta = await iaService.processarMensagem(mensagem, cliente || {}, historico || []);

    res.json({
      sucesso: true,
      resposta,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * POST /api/ia/analise-intencao
 * Analisar intenção do usuário
 * Body: { mensagem }
 */
app.post('/api/ia/analise-intencao', async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!mensagem) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Mensagem é obrigatória',
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
 * ================================================
 * ROTAS DE CHAMADAS
 * ================================================
 */

/**
 * GET /api/chamadas/historico/:cliente_id
 * Obter histórico de chamadas de um cliente
 */
app.get('/api/chamadas/historico/:cliente_id', async (req, res) => {
  try {
    const chamadas = await dbService.listarChamadasCliente(req.params.cliente_id);

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
app.get('/api/admin/estatisticas', async (req, res) => {
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
app.get('/api/admin/dashboard', async (req, res) => {
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
 * ROTAS ESTÁTICAS
 * ================================================
 */

/**
 * GET /
 * Servir página principal
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/**
 * GET /dashboard
 * Servir dashboard admin
 */
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

/**
 * ================================================
 * TRATAMENTO DE ERROS
 * ================================================
 */

/**
 * 404 - Rota não encontrada
 */
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: 'Rota não encontrada: ' + req.path,
  });
});

/**
 * 500 - Erro geral
 */
app.use((err, req, res, _next) => {
  console.error('❌ Erro não tratado:', err);

  res.status(500).json({
    sucesso: false,
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * ================================================
 * INICIAR SERVIDOR
 * ================================================
 */

const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
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

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Porta ${PORT} já está em uso!`);
    } else {
      console.error('❌ Erro no servidor:', err);
    }
    process.exit(1);
  });
};

// Iniciar se não estiver em teste
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
