---
description: Como rodar o projeto localmente (setup completo)
---

# Setup Local do Projeto

// turbo-all

## Passo 1: Instalar dependências raiz
```bash
npm install
```

## Passo 2: Instalar dependências do Voice Agent
```bash
cd voice-agent && npm install && cd ..
```

## Passo 3: Inicializar banco de dados
```bash
npm run setup-db:voice
```

## Passo 4: Configurar variáveis de ambiente
- Copiar `voice-agent/.env.example` para `voice-agent/.env`
- Preencher as chaves necessárias (OPENAI_API_KEY, TWILIO_*, etc.)

## Passo 5: Rodar o servidor Atende AI (POC)
```bash
npm start
```
> Acesse http://localhost:3000

## Passo 6: Rodar o Voice Agent (em terminal separado)
```bash
npm run start:voice
```
> Acesse http://localhost:3000 (backend)

## Passo 7: Rodar o Frontend Voice Agent (em terminal separado)
```bash
npm run client:voice
```
> Acesse http://localhost:8080

## Observações
- O Atende AI (raiz) e o Voice Agent AMBOS usam porta 3000 - não podem rodar ao mesmo tempo
- Para desenvolvimento com hot-reload use: `npm run dev:voice`
