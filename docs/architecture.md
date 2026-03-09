# Arquitetura do Sistema

Este repositório contém o sistema **Atende AI**: um software completo e unificado para atendimento telefônico e virtual com IA.

## Atende AI

### Objetivo

Sistema completo para atendimento telefônico com IA humanizada, banco de dados de clientes e roteamento inteligente. O principal objetivo é reduzir o tempo de espera do cliente e automatizar as respostas iniciais utilizando IA, redirecionando para agentes humanos apenas quando necessário.

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

- O sistema usa Node.js, foca em simplicidade e ferramentas gratuitas para a fase atual.
- Separação clara entre frontend/backend através do isolamento das pastas `frontend/` e `backend/`.
- Segurança com variáveis de ambiente (`.env`) e validação de dados nas chamadas.
