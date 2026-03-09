# Referência da API

Documentação completa de todos os endpoints disponíveis nos sistemas **Atende AI** e **Voice Agent**.

## Formato de Resposta Padrão

Todas as respostas seguem este formato:

```json
// Sucesso
{
  "sucesso": true,
  "dados": { ... }
}

// Erro
{
  "sucesso": false,
  "erro": "descrição do erro"
}
```

---

## Atende AI (Servidor Raiz - porta 3000)

### GET /

Página inicial com instruções.

### GET /health

Verificar status do servidor.

- **Resposta**: `{ "status": "ok" }`

### POST /api/posts

Enviar payload para publicação.

- **Body**: `{ "title": "string", "data": "string" }`
- **Resposta**: `{ "status": "saved", "id": number }`

---

## Voice Agent (porta 3000)

### Saúde e Status

#### GET /api/health

Status do servidor Voice Agent.

#### GET /api/admin/estatisticas

Estatísticas gerais do sistema.

- **Resposta**:

```json
{
  "sucesso": true,
  "estatisticas": {
    "total_clientes": 2,
    "total_chamadas": 0,
    "chamadas_resolvidas": 0,
    "chamadas_transferidas": 0,
    "taxa_resolucao": "0.00%"
  }
}
```

#### GET /api/admin/dashboard

Dados completos para o dashboard admin.

### Clientes

#### GET /api/clientes

Listar clientes com paginação.

- **Query**: `?page=1&perPage=20`

#### GET /api/clientes/:id

Obter detalhes de um cliente específico + histórico de chamadas.

#### POST /api/clientes

Criar novo cliente.

- **Body**:

```json
{
  "nome": "string (obrigatório)",
  "telefone": "string (obrigatório)",
  "email": "string (obrigatório)",
  "cpf_cnpj": "string (opcional)",
  "endereco": "string (opcional)",
  "dados_importantes": "string (opcional)"
}
```

#### PUT /api/clientes/:id

Atualizar dados de um cliente.

- **Body**: campos a serem atualizados (parcial)

### IA (Processamento de Texto)

#### POST /api/ia/processar

Processar mensagem de texto com IA.

- **Body**:

```json
{
  "mensagem": "string (obrigatório)",
  "cliente_id": "number (opcional)",
  "historico": "array (opcional)"
}
```

- **Resposta**:

```json
{
  "sucesso": true,
  "resposta": {
    "sucesso": true,
    "resposta": "texto da resposta",
    "intencao": "categoria",
    "confianca": 0.8,
    "deve_transferir": false,
    "solucao_aplicada": true,
    "categoria_solucao": "Pagamento"
  }
}
```

#### POST /api/ia/analise-intencao

Analisar intenção do texto do usuário.

- **Body**: `{ "mensagem": "string" }`

### Chamadas

#### GET /api/chamadas/historico/:cliente_id

Histórico de chamadas de um cliente.

### Voz / Twilio (Webhooks internos)

> Estes endpoints são usados pelo Twilio como webhooks. Não chamar diretamente.

#### POST /api/voz/chamada-recebida

Webhook para chamada recebida. Retorna TwiML.

#### POST /api/voz/processar-input

Webhook para processar input de voz/teclado.

#### POST /api/voz/confirmar-resolucao

Webhook para confirmar se problema foi resolvido.

#### POST /api/voz/mensagem-registrada

Webhook para mensagem de voz deixada.

### Páginas HTML

#### GET /

Página principal do Voice Agent.

#### GET /dashboard

Dashboard admin do Voice Agent.

---

## Exemplos cURL

### Criar cliente

```bash
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","telefone":"+5511999","email":"maria@ex.com"}'
```

### Testar IA

```bash
curl -X POST http://localhost:3000/api/ia/processar \
  -H "Content-Type: application/json" \
  -d '{"mensagem":"Meu cartão de crédito foi recusado","cliente_id":1}'
```

### Ver estatísticas

```bash
curl http://localhost:3000/api/admin/estatisticas
```
