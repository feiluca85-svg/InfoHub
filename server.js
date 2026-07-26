const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8085;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/proxy?url=')) {
    const targetUrl = decodeURIComponent(req.url.split('?url=')[1]);
    
    // Using curl instead of node fetch because Node DNS resolution sometimes fails with ENOTFOUND on this network
    const { exec } = require('child_process');
    // -s: silent, -L: follow redirects
    exec(`curl -sL "${targetUrl}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        res.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
        res.end('Proxy Error: ' + error.message);
        return;
      }
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html'
      });
      res.end(stdout);
    });
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File non trovato');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server InfoHub attivo su http://localhost:${PORT} e su http://192.168.1.76:${PORT}`);
});

