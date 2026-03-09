# Como Usar o Atende AI

Após finalizar seu ambiente de desenvolvimento (`npm run setup-db`, configurando `.env` e disparando com `npm start`), o Atende AI dispõe das seguintes chaves de interação:

## Painel (Dashboard Web Admin)

- Abra seu navegador em `http://localhost:8080/dashboard.html` (ou outra porta rodada via servidor HTTP).
- Aqui você terá acesso irrestrito às opções: visualizar ligações, criar/alterar clientes, interagir e listar agentes IA atendentes, além de verificar os erros da API.

## API Backend

Para as implementações automatizadas, interações sem servidor frontend visual, você pode testar com a ferramenta cURL e outras (Postman/Insomnia/Thunder Client):

`POST /api/ia/mensagem` -> Dispara um evento para IA da hugging-face ou de integração configurada simulando cliente, ex:

```bash
curl -X POST http://localhost:3000/api/ia/mensagem \
  -H "Content-Type: application/json" \
  -d '{"chamadaId": "CA...", "clienteId": 1, "mensagem": "Quero falar sobre boleto bancário atrasado"}'
```

Se precisar listar os clientes:

```bash
curl http://localhost:3000/api/clientes
```

## Telefonia Webhooks (Twilio)

Seu número virtual no Twilio deverá estar configurado para disparar requisições em eventos de ligação (Voice) aos endereços base expostos publicamente via `ngrok` ou algo similar (`http://seu-dominio-ngrok.ngrok-free.app/api/voz/receber`).

```
1. Receber chamada (ngrok direciona ao backend express local rotas `/api/voz/receber`)
2. IA responde.
3. Repetição (loop Twilio de "Gather").
```
