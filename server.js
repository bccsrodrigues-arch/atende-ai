import http from 'http';
import fs from 'fs';

const PORT = process.env.PORT || 3000;

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Allow CORS for quick testing (não usar assim em produção sem revisar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({status: 'ok'}));
  }

  if (req.url === '/api/posts' && req.method === 'POST') {
    try {
      const payload = await parseJSONBody(req);
      // validar campos mínimos
      if (!payload.title && !payload.data) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        return res.end(JSON.stringify({error: 'payload inválido - envie title ou data'}));
      }

      // persistir rascunho local simples
      const dbPath = './data/posts.json';
      let posts = [];
      try { posts = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '[]'); } catch(e) { posts = []; }
      const entry = { id: Date.now(), receivedAt: new Date().toISOString(), payload };
      posts.push(entry);
      fs.mkdirSync('./data', { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify(posts, null, 2));

      console.log('Recebido payload:', JSON.stringify(payload).slice(0, 1000));

      // resposta: URL hipotética do webhook N8N (o usuário configurará)
      res.writeHead(200, {'Content-Type': 'application/json'});
      return res.end(JSON.stringify({status: 'saved', id: entry.id}));
    } catch (err) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      return res.end(JSON.stringify({error: 'erro ao processar payload', details: String(err)}));
    }
  }

  // Root - instruções rápidas
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('Atende AI - Financial Snapshot POC (servidor mínimo). Use POST /api/posts');
  }

  res.writeHead(404, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({error: 'not found'}));
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
