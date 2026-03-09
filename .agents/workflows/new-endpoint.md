---
description: Como criar um novo endpoint/rota na API
---

# Criando um Novo Endpoint na API

## Passo 1: Identificar onde colocar a rota
- Rotas de **voz/Twilio** → `voice-agent/backend/voz-service.js`
- Rotas de **IA/processamento** → `voice-agent/backend/ia-service.js`
- Rotas de **dados/CRUD** → `voice-agent/backend/server.js` (direto no Express)
- Rotas do **Atende AI POC** → `server.js` (raiz)

## Passo 2: Implementar a rota seguindo o padrão
Todas as rotas seguem este padrão:
```javascript
app.METHOD('/api/recurso/acao', async (req, res) => {
  try {
    // 1. Validar entrada
    const { campo } = req.body; // ou req.params, req.query
    if (!campo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campo é obrigatório'
      });
    }

    // 2. Executar lógica de negócio
    const resultado = await dbService.operacao(campo);

    // 3. Retornar resposta padronizada
    res.json({
      sucesso: true,
      dados: resultado
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});
```

## Passo 3: Documentar na API Reference
- Atualizar `docs/api-reference.md` com o novo endpoint
- Incluir: método, URL, parâmetros, exemplo de request e response

## Passo 4: Testar
- Testar com cURL ou Postman
- Adicionar teste ao `test.sh` ou criar teste unitário com Jest

## Padrão de Resposta da API
```json
// Sucesso
{ "sucesso": true, "dados": {...} }

// Erro de validação (400)
{ "sucesso": false, "erro": "mensagem descritiva" }

// Erro interno (500)
{ "sucesso": false, "erro": "erro ao processar" }
```
