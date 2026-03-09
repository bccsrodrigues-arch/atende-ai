# Guia de Configuração (Setup)

Siga estas instruções diretas para rodar o **Atende AI** na sua máquina local.

## 1. Pré-requisitos

- **Node.js**: Versão 18 ou superior.
- **Git**: Para clonagem e versão.
- **Conta Twilio** (opcional para rodar localmente sem voz real, obrigatório para produção).
- **Conta OpenAI / HF** (opcional, requer token para as interações reais de IA).

## 2. Instalação Completa

O projeto usa NPM, então basta rodar `npm install` na pasta principal. Já preparamos um script que faz tudo para você na inicialização.

```bash
git clone https://github.com/bccsrodrigues-arch/atende-ai.git
cd atende-ai
npm install
```

## 3. Variáveis de Ambiente

O arquivo `.env.example` se encontra na raiz do repositório. O processo é o mesmo para colocar os segredos:

```bash
cp .env.example .env
```

_Logo em seguida, insira no arquivo `.env` suas credenciais da OpenAI, Twilio, etc._

## 4. Inicializando o Banco de Dados

Crie as tabelas locais (SQLite) usando o script já fornecido:

```bash
npm run setup-db
```

Isso gera o arquivo dentro da pasta `database/`.

## 5. Rodando Localmente

Temos vários scripts úteis no `package.json`:

- **Ouvir as chamadas da API Backend (dev com hot-reload):**

  ```bash
  npm run dev
  ```

- **Servir o painel Frontend Dashboard:**
  ```bash
  npm run client
  ```
  Isso irá rodar localmente com `npx http-server`. Acesse a porta informada pelo terminal (normalmente 8080).

E pronto, você já estará em execução!
