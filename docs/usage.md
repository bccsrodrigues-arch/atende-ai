# Como Usar os Sistemas

Guia de uso para **Atende AI** e **Voice Agent**.

## Atende AI

### API Endpoints
- `GET /health`: Verifica status do servidor
- `POST /api/posts`: Envia payload para publicação
  - Body: `{ "title": "string", "data": "string" }`
  - Resposta: `{ "status": "saved", "id": number }`

### Fluxo de Uso
1. Gere conteúdo no frontend.
2. Envie POST para o backend.
3. N8N processa e publica automaticamente.

### Exemplo cURL
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Meu Post","data":"Conteúdo aqui"}'
```

## Voice Agent

### Dashboard
Acesse http://localhost:3000/dashboard para:
- Visualizar estatísticas de chamadas
- Gerenciar clientes (adicionar/editar)
- Testar IA com prompts
- Ver histórico de interações

### Funcionalidades
- **Recebimento de Chamadas**: Configure webhook no Twilio para `/api/twilio/webhook`
- **IA Conversacional**: Processa voz/texto, analisa intenção, responde ou roteia
- **Banco de Dados**: CRUD para clientes, problemas conhecidos, atendentes

### API Endpoints (Backend)
- `GET /api/health`: Status
- `GET /api/clients`: Lista clientes
- `POST /api/clients`: Adiciona cliente
- `POST /api/test-ia`: Testa IA com prompt
- `POST /api/twilio/webhook`: Webhook para chamadas (usado internamente)

### Exemplo de Teste IA
```bash
curl -X POST http://localhost:3000/api/test-ia \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Olá, como posso ajudar?"}'
```

### Configuração de Chamadas
1. Configure número Twilio.
2. Defina webhook para o endpoint do backend.
3. Ligue para o número para testar.

### Gerenciamento de Clientes
- Use o dashboard para CRUD.
- Dados incluem nome, telefone, histórico.

### Roteamento
- IA detecta quando transferir para atendente.
- Seleciona baseado em especialidade.

## Segurança
- Nunca exponha chaves API.
- Use HTTPS em produção.
- Valide inputs para prevenir injeções.

## Monitoramento
- Logs no console do backend.
- Dashboard para métricas em tempo real.