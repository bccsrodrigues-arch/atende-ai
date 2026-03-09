/**
 * ==============================================================
 * EXEMPLOS DE USO DO SISTEMA
 * ==============================================================
 * Scripts e exemplos para testar e integrar o agente
 */

// ==========================================
// EXEMPLO 1: TESTE VIA cURL
// ==========================================

/*
# Criar um cliente
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "telefone": "+5511987654321",
    "email": "maria@example.com",
    "cpf_cnpj": "12345678901234",
    "endereco": "Rua das Flores, 123",
    "dados_importantes": "Cliente VIP com histórico de problemas de pagamento"
  }'

# Listar clientes
curl http://localhost:3000/api/clientes

# Obter um cliente específico
curl http://localhost:3000/api/clientes/1

# Testar processamento de mensagem
curl -X POST http://localhost:3000/api/ia/processar \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Meu cartão de crédito foi recusado",
    "cliente_id": 1,
    "historico": []
  }'

# Analisar intenção
curl -X POST http://localhost:3000/api/ia/analise-intencao \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Gostaria de cancelar minha assinatura"
  }'

# Ver estatísticas
curl http://localhost:3000/api/admin/estatisticas

# Ver dashboard completo
curl http://localhost:3000/api/admin/dashboard
*/

// ==========================================
// EXEMPLO 2: TESTE COM NODE.JS
// ==========================================

/*
const fetch = require('node-fetch');

// Função para criar cliente
async function criarCliente() {
  const resposta = await fetch('http://localhost:3000/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'João Pereira',
      telefone: '+5511999999999',
      email: 'joao@example.com'
    })
  });
  
  const dados = await resposta.json();
  console.log('Cliente criado:', dados);
  return dados.cliente.id;
}

// Função para testar IA
async function testarIA(mensagem, clienteId) {
  const resposta = await fetch('http://localhost:3000/api/ia/processar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mensagem,
      cliente_id: clienteId
    })
  });
  
  const dados = await resposta.json();
  console.log('Resposta IA:', dados.resposta);
}

// Executar
(async () => {
  const clienteId = await criarCliente();
  await testarIA('Qual é o saldo da minha conta?', clienteId);
})();
*/

// ==========================================
// EXEMPLO 3: INTEGRAÇÃO COM WEBHOOK N8N
// ==========================================

/*
N8N Workflow para redirecionar chamadas ao agente:

1. Trigger: Webhook (POST /webhook/chamada)
2. Extract: Parse JSON do Twilio
3. Lookup: Query BD para cliente
4. IA: Call API /api/ia/processar
5. Response: Retornar TwiML para Twilio

Exemplo de N8N:
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "abc123"
    },
    {
      "name": "Extract Data",
      "type": "n8n-nodes-base.function",
      "inputs": ["Webhook"],
      "code": "return [{ json: { telefone: $json.From } }]"
    },
    {
      "name": "Call API",
      "type": "n8n-nodes-base.httpRequest",
      "inputs": ["Extract Data"],
      "url": "http://localhost:3000/api/ia/processar",
      "method": "POST"
    }
  ]
}
*/

// ==========================================
// EXEMPLO 4: TREINAR AGENTE COM DADOS
// ==========================================

/*
// Script para popular problemas conhecidos
const db = require('./backend/database.js');

async function treinarAgente() {
  const problemas = [
    {
      categoria: 'Pagamento',
      descricao: 'Cliente relata que cartão foi rejeitado',
      solucao: 'Verificar saldo disponível, data de validade, ou sugerir outro método',
      palavras_chave: 'cartão,recusado,débito,falha,pagamento,cartão rejeitado',
      prioridade: 9
    },
    {
      categoria: 'Técnico',
      descricao: 'Aplicativo não funciona ou está muito lento',
      solucao: 'Solicitar atualização, limpar cache, ou verificar conexão de internet',
      palavras_chave: 'app,não funciona,lento,erro,travado,crash,bug',
      prioridade: 8
    },
    {
      categoria: 'Suporte',
      descricao: 'Cliente esqueceu a senha',
      solucao: 'Enviar link de recuperação por email ou verificar identidade por SMS',
      palavras_chave: 'senha,esqueci,reset,acesso,login,entrar,cuenta',
      prioridade: 7
    },
    {
      categoria: 'Cancelamento',
      descricao: 'Cliente quer cancelar a assinatura',
      solucao: 'Entender motivo, oferecer alternativas, ou processar cancelamento',
      palavras_chave: 'cancelar,sair,acabou,chega,fim,encerrar,parar',
      prioridade: 9
    }
  ];
  
  // Inserir cada problema
  for (const problema of problemas) {
    await db.inserirProblemaConhecido(problema);
  }
  
  console.log('✅ Agente treinado com ' + problemas.length + ' problemas');
}

treinarAgente();
*/

// ==========================================
// EXEMPLO 5: MONITORAR CHAMADAS EM TEMPO REAL
// ==========================================

/*
import EventEmitter from 'events';

// Criar emitter de eventos de chamada
class ChamadaEmitter extends EventEmitter {}
const chamadaEmitter = new ChamadaEmitter();

// Escutar eventos
chamadaEmitter.on('chamada-iniciada', (dados) => {
  console.log('📞 Chamada iniciada:', dados.cliente.nome);
});

chamadaEmitter.on('ia-respondendo', (dados) => {
  console.log('🤖 IA respondendo:', dados.resposta.substring(0, 50) + '...');
});

chamadaEmitter.on('chamada-finalizada', (dados) => {
  console.log('✅ Chamada finalizada:', dados.resultado);
});

chamadaEmitter.on('transferencia', (dados) => {
  console.log('🔄 Transferindo para atendente:', dados.atendente.nome);
});

// Emitir eventos no servidor
app.post('/api/voz/processar-input', async (req, res) => {
  // ... código ...
  chamadaEmitter.emit('ia-respondendo', { resposta: respostaIA.resposta });
  // ... código ...
});
*/

// ==========================================
// EXEMPLO 6: CUSTOMIZAR RESPOSTAS POR CLIENTE
// ==========================================

/*
// Adicionar contexto personalizado
async function processarMensagemPersonalizada(mensagem, clienteId) {
  const cliente = await db.buscarClientePorId(clienteId);
  
  // Personalizar baseado em histórico
  let contextoPersonal = '';
  
  if (cliente.dados_importantes.includes('VIP')) {
    contextoPersonal = 'Este é um cliente premium, ofereça melhor atendimento.';
  }
  
  if (cliente.status === 'em-risco') {
    contextoPersonal = 'Cliente em risco de saída, seja extra atencioso.';
  }
  
  // Combinar com processamento normal
  const resposta = await iaService.processarMensagem(
    mensagem,
    cliente,
    [],
    contextoPersonal
  );
  
  return resposta;
}
*/

// ==========================================
// EXEMPLO 7: DASHBOARD CUSTOMIZADO
// ==========================================

/*
HTML para widget de chamadas ao vivo:

<div id="chamadas-ao-vivo" class="widget">
  <h3>📞 Chamadas Ao Vivo</h3>
  <div id="lista-chamadas"></div>
</div>

JavaScript para atualizar em tempo real:

const eventSource = new EventSource('/api/chamadas/stream');

eventSource.addEventListener('nova-chamada', (event) => {
  const dados = JSON.parse(event.data);
  
  const html = `
    <div class="chamada-viva">
      <strong>${dados.cliente.nome}</strong>
      <p>Motivo: ${dados.motivo}</p>
      <span class="status">🟢 Ativa</span>
    </div>
  `;
  
  document.getElementById('lista-chamadas').insertAdjacentHTML('beforeend', html);
});
*/

// ==========================================
// EXEMPLO 8: EXPORTAR RELATÓRIOS
// ==========================================

/*
import ExcelJS from 'exceljs';

async function exportarRelatorio(dataInicio, dataFim) {
  // Buscar dados
  const chamadas = await db.buscarChamadasPeriodo(dataInicio, dataFim);
  
  // Criar workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Chamadas');
  
  // Adicionar cabeçalhos
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Cliente', key: 'cliente_nome', width: 20 },
    { header: 'Data', key: 'data_hora', width: 15 },
    { header: 'Duração', key: 'duracao_segundos', width: 10 },
    { header: 'Resolvido', key: 'foi_resolvido', width: 10 },
    { header: 'Avaliação', key: 'avaliacao', width: 10 }
  ];
  
  // Adicionar dados
  chamadas.forEach(chamada => {
    worksheet.addRow(chamada);
  });
  
  // Salvar
  await workbook.xlsx.writeFile('relatorio.xlsx');
  console.log('📊 Relatório exportado para relatorio.xlsx');
}

exportarRelatorio(new Date('2024-01-01'), new Date('2024-01-31'));
*/

// ==========================================
// EXEMPLO 9: TESTES AUTOMATIZADOS
// ==========================================

/*
// Usar Jest para testar
describe('Agente de IA', () => {
  test('deve processar mensagem de pagamento', async () => {
    const resposta = await iaService.processarMensagem(
      'Meu cartão foi recusado',
      { id: 1, nome: 'Teste' }
    );
    
    expect(resposta.intencao).toBe('pagamento');
    expect(resposta.sucesso).toBe(true);
  });
  
  test('deve transferir para atendente com urgência alta', async () => {
    const resposta = await iaService.processarMensagem(
      'Quero cancelar agora!',
      { id: 1 }
    );
    
    expect(resposta.deve_transferir).toBe(true);
  });
});

// Rodar testes
npm test
*/

// ==========================================
// EXEMPLO 10: DEPLOY EM PRODUÇÃO
// ==========================================

/*
// Dockerfile para containerização
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

# Build e run
docker build -t voice-agent .
docker run -p 3000:3000 -e OPENAI_API_KEY=xxx voice-agent

// docker-compose.yml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    volumes:
      - ./database:/app/database

# Deploy no Render, Railway, Heroku, etc
git push heroku main
*/

console.log("✅ Exemplos de uso carregados");
