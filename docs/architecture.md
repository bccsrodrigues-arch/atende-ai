# Arquitetura do Sistema

Este repositório contém dois sistemas principais: **Atende AI** (POC para geração e publicação de conteúdo) e **Voice Agent** (sistema de atendimento telefônico com IA).

## Atende AI

### Objetivo

POC/MVP simples que gera conteúdo (texto/imagem) e publica como demonstração (ex.: LinkedIn). Arquitetura mínima e 100% viável com ferramentas gratuitas.

### Componentes

- **Frontend**: Interface para usuário gerar/visualizar conteúdo e acionar envio (Lovable/no-code ou HTML+JS).
- **Backend**: Node.js + Express para validação, armazenamento opcional e envio para webhook N8N.
- **Automações**: N8N workflow para processar payload, enriquecer (gerar imagem) e publicar via APIs.
- **Armazenamento**: Supabase (gratuito) ou SQLite local para rascunhos.

### Fluxo de Dados

1. Usuário → Frontend: cria conteúdo.
2. Frontend → Backend: POST /api/posts → valida e encaminha para N8N.
3. N8N → processa, persiste e publica.

### Segurança

- Tokens/segredos nunca no frontend.
- Variáveis de ambiente no backend/N8N.

## Voice Agent

### Objetivo

Sistema completo para atendimento telefônico com IA humanizada, banco de dados de clientes e roteamento inteligente.

### Componentes

- **Frontend**: Dashboard admin para gerenciar clientes, visualizar métricas e testar IA.
- **Backend**: Node.js + Express com rotas para API, integração OpenAI e Twilio.
- **Banco de Dados**: SQLite para clientes, chamadas, interações IA e atendentes.
- **Integrações**: OpenAI GPT-4 para processamento de linguagem, Twilio para chamadas/voz.

### Fluxo de Dados

1. Chamada → Twilio webhook → Backend processa voz/texto.
2. Backend → OpenAI: analisa intenção, busca conhecimento.
3. Resposta gerada → TTS via Twilio ou roteamento para atendente.
4. Dados persistidos no banco.

### Funcionalidades Chave

- Recebimento de chamadas e TTS humanizado.
- Análise IA de intenção e busca em base de conhecimento.
- Gerenciamento de clientes e histórico.
- Roteamento inteligente para atendentes.
- Dashboard com estatísticas e testes.

## Considerações Gerais

- Ambos sistemas usam Node.js, focam em simplicidade e ferramentas gratuitas.
- Separação clara entre frontend/backend.
- Segurança com variáveis de ambiente e validação de dados.
