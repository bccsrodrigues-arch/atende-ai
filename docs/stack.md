# Stack e Ferramentas

O **Atende AI** utiliza as seguintes tecnologias em seu sistema de atendimento com IA:

## Stack Oficial

- **Runtime**: Node.js 18+ (ES Modules / ESM)
- **Backend Framework**: Express.js
- **Banco de Dados**: SQLite (escolhido para ambiente dev/POC; possível migração para PostgreSQL local/cloud no futuro)
- **Modelos de IA**: Hugging Face (solução gratuita testada inicialmente) / OpenAI GPT-4 (pronta para uso em produção)
- **Integração de Telefonia/Voz**: Twilio (recebimento de chamadas, Text-to-Speech e Speech-to-Text)
- **Frontend**: Vanilla HTML/CSS/JS (sem uso de frameworks pesados no momento)

## Funcionalidades e Pacotes Utilizados

- Módulo nativo HTTP ou Express para lidar com a API.
- Configurações com `dotenv` para segredos.
- Acesso agnóstico com `cors`.
- Persistência das interações de IA e histórico através do arquivo `.db` local SQLite da raiz.

## Ambiente de Desenvolvimento

- **Manejo de Pacotes**: NPM
- **Linter & Formatter**: ESLint (configuração standalone flat config) e Prettier
- **Agente IAM/CLI**: Jules CLI (`@google/jules`) para remote reviews, qualidade, e CI/CD.
- **Git Hooks**: Husky para verificação pré-commit
