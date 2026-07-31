import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const host = valueAfter('--host') || process.env.HOST || '127.0.0.1';
const startPort = Number(valueAfter('--port') || process.env.PORT || 4173);
const strictPort = args.includes('--strictPort');
const shouldOpen = !args.includes('--no-open');
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.json', 'application/json; charset=utf-8']
]);

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const commandArgs = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, commandArgs, { detached: true, stdio: 'ignore' });
  child.on('error', () => {});
  child.unref();
}

function createStaticServer() {
  return createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const candidate = normalize(join(root, relative));
    if (!candidate.startsWith(root) || !existsSync(candidate) || statSync(candidate).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': types.get(extname(candidate)) || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    createReadStream(candidate).pipe(response);
  });
}

function listen(port) {
  const server = createStaticServer();
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && !strictPort) {
      listen(port + 1);
      return;
    }
    console.error(error);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    const browserHost = host === '0.0.0.0' ? '127.0.0.1' : host;
    const url = `http://${browserHost}:${port}`;
    console.log(`画境观屿宇宙胶囊已启动：${url}`);
    if (shouldOpen) openBrowser(url);
  });
}

listen(startPort);
