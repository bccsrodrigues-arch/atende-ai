# Atende AI - Configuração do Agente de IA

## Sobre o Projeto

**Atende AI** é um sistema completo de atendimento telefônico e virtual com IA humanizada. O objetivo é fornecer atendimento inteligente, análise de intenção e busca em base de conhecimento, visando resolução rápida de problemas ou roteamento para atendentes reais.

## Sobre o Desenvolvedor

- **Nível**: Iniciante em programação (primeiro projeto)
- **Papel**: Estagiário sendo mentorado pelo agente (senior/mentor)
- **Comunicação**: Sempre em português brasileiro (PT-BR)
- O agente deve **guiar** o desenvolvedor, **explicar** decisões técnicas, **sugerir** melhores caminhos
- Nunca assumir conhecimento prévio - explicar conceitos quando necessário

## Diretrizes de Desenvolvimento

### Filosofia

- **Evitar over-engineering** - soluções simples e pragmáticas primeiro
- **Preferir implementações oficiais** da stack, evitar soluções customizadas
- **Não resolver problemas sozinho** - informar o desenvolvedor e ajudá-lo a decidir
- **Qualidade desde o início** - boas práticas de engenharia de software aplicadas gradualmente
- **Executar comandos diretamente** - sempre rodar os comandos no terminal ao invés de enviar listas para o usuário copiar/colar. O agente é mais rápido executando direto.

### Stack Oficial

- **Runtime**: Node.js 18+ (ES Modules / ESM)
- **Backend**: Express.js
- **Banco de Dados**: SQLite (dev/POC), Supabase (produção futura)
- **IA**: Hugging Face (gratuito) / OpenAI GPT-4 (futuro)
- **Telefonia**: Twilio (chamadas, TTS, STT)
- **Automação**: N8N (workflows)
- **Frontend**: HTML/CSS/JS vanilla (Dashboard admin e painel principal)
- **Controle de Versão**: Git + GitHub

### Padrões de Código

- JavaScript ES6+ com ES Modules (`import`/`export`)
- Código comentado em PT-BR
- Nomes de variáveis/funções em PT-BR (camelCase)
- Tratamento de erros com try/catch em todas as funções assíncronas
- Validação de dados na entrada das rotas
- Variáveis de ambiente via dotenv (nunca hardcode de segredos)

### Qualidade e CI/CD

- **Jules CLI** (`@google/jules`) deve ser utilizado SEMPRE que possível para tarefas remotas avançadas, automações, pull requests, refatorações pesadas, CI/CD, e verificação/qualidade geral do código do repositório
- Manter pipeline de CI/CD configurada
- Pre-commit hooks com linters, formatters e validadores de tipo
- Lint e Format combinados via Biome

### Documentação

- Documentação oficial mantida na pasta `docs/`
- 4-6 documentos centrais (nunca criar novos, sempre atualizar os existentes)
- Documentos atuais:
  1. `docs/architecture.md` - Arquitetura do sistema
  2. `docs/stack.md` - Stack técnica e ferramentas
  3. `docs/setup.md` - Instalação e configuração
  4. `docs/usage.md` - Como usar os sistemas
  5. `docs/api-reference.md` - Referência completa da API
  6. `docs/development-guide.md` - Guia de desenvolvimento e contribuição

### Ferramentas MCP

- Usar **Context7 MCP** para consultar documentações oficiais da stack sempre que necessário

## Estrutura do Projeto

```
atende-ai/
├── package.json           # Dependências raiz
├── docs/                  # Documentação oficial (4-6 docs centrais)
├── backend/
│   ├── server.js      # Servidor Express principal
│   ├── database.js    # Serviço de banco de dados
│   ├── ia-service.js  # Serviço de IA (Hugging Face)
│   └── voz-service.js # Serviço de voz (Twilio)
├── database/
│   ├── init-db.js     # Inicializador do banco SQLite
│   └── database.db    # Banco de dados SQLite
├── frontend/
│   ├── index.html     # Página principal
│   ├── dashboard.html # Dashboard admin
│   ├── script.js      # Lógica do frontend
│   └── styles.css     # Estilos
├── .env.example       # Exemplo de variáveis de ambiente
├── EXEMPLOS.js        # Exemplos de uso e integração
└── .agents/
    ├── AGENTS.md           # Este arquivo
    └── workflows/          # Workflows padronizados
```

## Estado Atual do Projeto (Março 2026)

- **Fase**: Desenvolvimento inicial / MVP
- **Atende AI**: Backend funcional com Express, SQLite, integração Twilio e Hugging Face. Unificamos o projeto para remover a complexidade de múltiplos sub-projetos.
- **Frontend**: Dashboard e página principal com HTML/CSS/JS
- **CI/CD**: ESLint, Prettier, Husky (pre-commit) implementados
- **Testes**: Sem testes unitários (implementações futuras necessárias)
- **Git**: Repositório provisionado e estruturado

## Problemas Conhecidos / Riscos

1. **Sem testes automatizados**: Nenhum teste unitário/integração
2. **`global` para estado**: `voz-service.js` usa `global.chamadasAtivas` (anti-pattern)
