# Stack Técnica e Ferramentas

Este documento descreve a stack técnica utilizada nos sistemas **Atende AI** e **Voice Agent**, focando em ferramentas gratuitas e AI-first.

## Tecnologias Principais

### Linguagem e Runtime

- **Node.js 16+**: Runtime JavaScript para backend, com Express para APIs REST.
- **JavaScript (ES6+)**: Linguagem principal, com módulos ES6.

### Frontend

- **HTML/CSS/JavaScript**: Interfaces simples e responsivas (Voice Agent).
- **Lovable**: Plataforma no-code/low-code para UI/fluxos (Atende AI).
- **Alternativas**: Vite + React para desenvolvimento mais avançado.

### Backend

- **Express.js**: Framework web minimalista para APIs.
- **SQLite**: Banco de dados local, zero-config (Voice Agent).
- **Supabase**: Banco Postgres gratuito com autenticação (Atende AI).

### Integrações e APIs

- **OpenAI GPT-4**: Processamento de linguagem natural e geração de respostas (Voice Agent).
- **Twilio**: Chamadas telefônicas, TTS e STT (Voice Agent).
- **N8N**: Automações e workflows para processamento de dados (Atende AI).

### Ferramentas de Desenvolvimento

- **Git**: Controle de versão.
- **npm/yarn**: Gerenciamento de pacotes.
- **Docker**: Containerização para N8N e deployments.
- **Coding Agents**: Claude Code, Cursor AI, GitHub Copilot para assistência em código.

### Deployment e Hosting

- **Local**: Desenvolvimento e testes.
- **Vercel/Netlify**: Frontend gratuito.
- **Render/Railway**: Backend gratuito com limitações.
- **n8n.cloud**: N8N gratuito para testes.

## Comandos Úteis

### Instalação Node.js

```bash
# Debian/Ubuntu
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### N8N via Docker

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=user \
  -e N8N_BASIC_AUTH_PASSWORD=password \
  n8nio/n8n
```

### Supabase CLI

```bash
npm install -g supabase
supabase login
```

## Notas

- Priorize ferramentas gratuitas para POC.
- Use variáveis de ambiente para segredos.
- Mantenha simplicidade e modularidade.
