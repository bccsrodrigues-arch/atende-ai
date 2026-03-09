# Instalação e Setup

Este guia cobre a instalação e configuração dos sistemas **Atende AI** e **Voice Agent**.

## Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Git

## Instalação Centralizada
Execute o script de setup unificado:
```bash
chmod +x setup.sh
./setup.sh
```

Ou manualmente:
```bash
npm install  # Instala todas as dependências
npm run setup-db:voice  # Inicializa banco Voice Agent
```

## Configuração de APIs (Voice Agent)

### OpenAI
- Obtenha chave em https://platform.openai.com
- Adicione a `OPENAI_API_KEY` no `voice-agent/.env`

### Twilio
- Obtenha SID e token em https://www.twilio.com
- Configure webhook para `https://your-domain/voice-agent/api/twilio/webhook`
- Adicione `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN` no `voice-agent/.env`

## Executando os Sistemas

### Atende AI
```bash
npm start  # Porta 3000
```

### Voice Agent
```bash
npm run start:voice      # Backend na porta 3000
npm run client:voice     # Frontend na porta 8080
```

## Testes
Execute o script de teste unificado:
```bash
./test.sh
```

Ou manualmente:
```bash
npm test
```