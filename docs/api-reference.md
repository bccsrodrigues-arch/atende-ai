# Referência da API (Atende AI)

Todos os endpoints da API estão localizados sob o caminho `/api*` do host. Por padrão: `http://localhost:3000`.

## Grupo de Rotas Principais

### [Voz - Integração Twilio]

Atuam manipulando webhooks (comandos assíncronos gerados pela API da ligação do cliente).

- **POST /api/voz/receber**: Receber chamada. Identifica autor. Devolve TwiML.
- **POST /api/voz/processar**: Responde do processamento Gather na call principal ou repassa (via TwiML).
- **POST /api/voz/status**: Notificação de status event webhook da ligação em andamento, cancelamento ou conclusão.

### [Dashboard Admin Clientes]

Retorno e criação de usuários cadastrados do banco local.

- **GET /api/clientes**: Todos os clientes salvos (`limite=20, pagina=1`)
- **GET /api/clientes/:id**: Cliente individual
- **POST /api/clientes**: Novo cadastro
- **PUT /api/clientes/:id**: Atualizar cliente

### [Serviço IA e Chamadas Internas]

Trata de simular ou executar internamente as requisições de prompt sem depender da ligação (via chat no dashboard).

- **POST /api/ia/mensagem**: Recebe mensagem do front ou hook externo -> interpreta modelo e gera resposta de IA.
- **GET /api/chamadas**: Listagem de todas interações em call (`limite=50, pagina=1`).
- **GET /api/admin/estatisticas**: Gráficos e totais para a tela inicial do adm.
