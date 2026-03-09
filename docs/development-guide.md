# Guia de Desenvolvimento

Guia para contribuição e desenvolvimento do projeto **Atende AI** e **Voice Agent**.

## Pré-requisitos

- Node.js 18+
- npm
- Git
- Editor de código (VS Code recomendado)

## Configuração do Ambiente

### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd atende-ai
npm install
cd voice-agent && npm install && cd ..
```

### 2. Configurar variáveis de ambiente

```bash
cp voice-agent/.env.example voice-agent/.env
# Editar voice-agent/.env com suas chaves
```

### 3. Inicializar banco de dados

```bash
npm run setup-db:voice
```

## Padrões de Código

### Estilo

- **Linguagem**: JavaScript ES6+ com ES Modules (`import`/`export`)
- **Nomenclatura**: camelCase para variáveis e funções, PascalCase para classes
- **Comentários**: em português (PT-BR)
- **Indentação**: 2 espaços
- **Aspas**: aspas simples (`'`)
- **Ponto e vírgula**: sempre usar

### Estrutura de Arquivos

- Cada arquivo deve conter um único serviço/responsabilidade
- Nomes de arquivos em kebab-case (ex: `ia-service.js`, `init-db.js`)
- Manter a separação: `backend/`, `database/`, `frontend/`

### Tratamento de Erros

Toda função assíncrona deve ter try/catch:

```javascript
export const minhaFuncao = async (parametro) => {
  try {
    // lógica
    return resultado;
  } catch (error) {
    console.error('Erro ao fazer X:', error);
    return null; // ou throw para propagar
  }
};
```

### Respostas da API

Formato padronizado para todas as respostas:

```javascript
// Sucesso
res.json({ sucesso: true, dados: resultado });

// Erro de validação
res.status(400).json({ sucesso: false, erro: 'campo obrigatório' });

// Erro interno
res.status(500).json({ sucesso: false, erro: error.message });
```

## Ferramentas de Qualidade

### ESLint (Linter)

Verifica erros e padrões de código:

```bash
npx eslint .           # Verificar
npx eslint . --fix     # Corrigir automaticamente
```

### Prettier (Formatter)

Formata o código automaticamente:

```bash
npx prettier --check .    # Verificar
npx prettier --write .    # Formatar
```

### Pre-commit Hooks

Os hooks de pre-commit rodam automaticamente antes de cada commit:

- ESLint: verifica erros de código
- Prettier: verifica formatação

## Banco de Dados

### SQLite

O projeto usa SQLite para desenvolvimento. O banco fica em:

- `voice-agent/backend/database.db` (usado pelo backend)
- `voice-agent/database/database.db` (criado pelo init-db.js)

### Tabelas Principais

1. **clientes** - Dados dos clientes
2. **chamadas** - Histórico de chamadas
3. **atendentes** - Atendentes humanos
4. **interacoes_ia** - Log de interações com a IA
5. **problemas_conhecidos** - Base de conhecimento

### Resetar banco

```bash
rm voice-agent/database/database.db voice-agent/backend/database.db
npm run setup-db:voice
```

## Scripts Disponíveis

| Script         | Comando                  | Descrição                         |
| -------------- | ------------------------ | --------------------------------- |
| start          | `npm start`              | Servidor Atende AI (porta 3000)   |
| start:voice    | `npm run start:voice`    | Backend Voice Agent (porta 3000)  |
| dev:voice      | `npm run dev:voice`      | Backend com hot-reload            |
| client:voice   | `npm run client:voice`   | Frontend Voice Agent (porta 8080) |
| setup-db:voice | `npm run setup-db:voice` | Inicializar banco SQLite          |
| setup          | `npm run setup`          | Setup completo do projeto         |
| test           | `npm test`               | Rodar testes                      |

## Fluxo de Trabalho (Git)

### Branches

- `main` - código estável de produção
- `develop` - código em desenvolvimento
- `feature/nome-da-feature` - novas funcionalidades
- `fix/nome-do-bug` - correções de bugs

### Processo

1. Criar branch a partir de `develop`
2. Desenvolver a feature
3. Rodar lint + testes
4. Criar Pull Request para `develop`
5. Após revisão, merge para `develop`
6. Periodicamente, merge `develop` → `main`

## Conceitos Importantes para Iniciantes

### O que é uma API REST?

API (Interface de Programação) é a forma como programas se comunicam. REST é um padrão que usa URLs e métodos HTTP (GET, POST, PUT, DELETE) para organizar essa comunicação.

### O que é Middleware?

Middleware é código que roda entre receber o request e enviar o response. Exemplos: `cors()` permite acesso de outros domínios, `express.json()` converte o body para JSON.

### O que é TwiML?

TwiML (Twilio Markup Language) é o formato XML que o Twilio entende para controlar chamadas (falar texto, coletar input, transferir, gravar, etc).

### O que são Variáveis de Ambiente?

São valores secretos (senhas, chaves de API) que ficam no arquivo `.env` e nunca vão para o Git. O programa lê com `process.env.NOME_DA_VARIAVEL`.
