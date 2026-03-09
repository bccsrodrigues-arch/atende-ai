# Guia de Desenvolvimento e Contribuição

Bem-vindo ao Atende AI! Como explicamos, este documento atua como referência sobre como se envolver, testar e manter o código usando as metodologias adotadas internamente.

---

## Para Iniciantes

Se você está começando (como o autor do projeto), leia isso primeiro:

- **Express.js**: Backend framework - as chamadas recebidas ocorrem pelas rotas dentro do projeto de forma sequencial, processando pelo controller até devolver os dados.
- **SQLite**: Local. Uma grande vantagem de não gerenciar tabelas pesadas. Use `npm run setup-db` e não precisará configurar mais nada, as tabelas serão recriadas limpas.
- **Git Hooks (Husky)**: Antes do commit acontecer, nosso sistema local irá forçar o Biome verificando a sintaxe e padrões. Se der erro no terminal e proibir a ação, isso é intencional. Leia os warnings/erros e refaça caso apareçam antes de recomeçar seu `git add/commit`.

---

## 2. Estrutura do Código

Para não criar uma enorme árvore dependente, a arquitetura agora em raiz (`/backend`, `/frontend`, `/database`) foca as funções de:

- `/backend/voz-service.js` manipula puramente chamadas webhooks vindas de sistemas de telefonia (Twilio).
- `/backend/ia-service.js` gerador e validador local de tokens/linguagem para enviar como response de voz na chamada Twilio (huggingface / api chatgpt)
- `server.js` abriga o Express e o roteamento principal.

---

## 3. Práticas Recomendadas Obrigatórias

- **Variáveis (`.env`)**:
  - Evite chaves API. Sempre que alterar em código um segredo, não o declare solto. Teste-o, extraia para `process.env.TEST_KEY`, use `.env`. O gitignore está configurado para te proteger.

- **Comandos / CLI**:

  ```bash
  npm run dev
  # Observa alterações no backend e reinicia o nodemon

  npm run client
  # Inicia server local na pasta frontend

  npm run format
  npm run lint
  # Checa seu status antes do Husky ser invocado em commit manual.
  ```

---

## 4. Próxima Fase

- Estudar a aplicação Jest (framework) nas chamadas do `ia-service` para cobrir o funcionamento unitário e detectar anomalias.
- Automatizar testes no GitHub Actions (CI).
