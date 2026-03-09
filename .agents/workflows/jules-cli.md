---
description: Como utilizar e entender a CLI Jules do Google para tarefas de Qualidade, Revisão e CI/CD.
---

# 🚀 Fluxo de Trabalho (Workflow): Jules CLI

Este workflow ensina as IAs e desenvolvedores do repositório a interagirem com o **Jules CLI** (`@google/jules`), nossa principal ferramenta de inteligência remota para gerenciar CI/CD, auditoria de repositório e execuções paralelas de tarefas complexas.

## 1. O Que É Jules?

Jules CLI é uma ferramenta de linha de comando que nos permite delegar tarefas diretamente à plataforma global de agentes do Google. Quando acionada, as sessões rodam remotamente e puxam resultados para o contexto local.

## 2. Instalação e Autenticação

Caso perceba que o computador atual não tem o comando `jules` funcionando (ou se deslogou), execute o seguinte na sua máquina:

```bash
# Instala o programa globalmente
npm install -g @google/jules

# Inicia o fluxo de autenticação (redireciona ao navegador)
// turbo
jules login
```

## 3. Comandos Úteis do Dia-a-Dia

Sempre que o usuário solicitar auditoria pesada, refatorações amplas, escrita de testes ou pipelines, é encorajado utilizar sessões do Jules.

### Iniciar uma nova sessão remota (Task)

Você pode simplesmente pedir ao Jules para implementar código em background para você omitindo a flag repo se o terminal estiver na pasta raiz do projeto:

```bash
// turbo
jules remote new --session "write unit tests para toda a API Node.js"
```

A flag `--repo` pode ser adicionada: `jules remote new --repo bigodark/atende-ai --session "refatorar estilos css"`

### Trabalhos Paralelos

Para forçar testes em grande escala ou múltiplas refatorações diferentes na mesma sessão/repositório:

```bash
jules remote new --session "criar pipeline github actions e testes E2E do cypress" --parallel 5
```

### Consultar Tarefas Pendentes

Verifique suas sessões de trabalho passadas ou rodando:

```bash
// turbo
jules remote list --session
```

Ou liste todas as bases disponíveis no seu Github/Google:

```bash
// turbo
jules remote list --repo
```

### Pull (Puxar alterações do Agente Jules)

Assim que a tarefa for concluída remotamente, o Cloud Agent criará as alterações que faríamos (como uma mini branch separada). Para injetá-las em seu sistema usando o id da sessão remota, rode:

```bash
jules remote pull --session <ID_DA_SESSÃO>
```

## Quando Usar?

- **Sempre que possível ou necessário no nosso projeto**, use Jules CLI para avaliar a qualidade de código, escrever regras de lint, planejar grandes tarefas (usos paralelos: `--parallel`), revisar CI/CD.
- Para gerar novas tasks longas em que a IA principal deva seguir como observadora.
- Use a flag `--theme light` ou `--theme dark` caso precise ajustar a leitura de logs se o shell reportar problemas.
