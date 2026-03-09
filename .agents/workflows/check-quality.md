---
description: Como rodar testes e verificar qualidade do código
---

# Verificação de Qualidade e Testes

## Passo 1: Rodar linter (ESLint)

```bash
npx eslint .
```

## Passo 2: Verificar formatação (Prettier)

```bash
npx prettier --check .
```

## Passo 3: Corrigir formatação automaticamente

```bash
npx prettier --write .
```

## Passo 4: Rodar testes unitários

```bash
npm test
```

## Passo 5: Rodar testes de endpoint (servidores devem estar rodando)

```bash
./test.sh
```

## Observações

- Sempre rode o lint e o prettier antes de commitar
- Os pre-commit hooks fazem isso automaticamente se configurados
