import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const host = process.env.HOST || '127.0.0.1';
const requestedPort = Number(process.env.PORT || 4173);
const maxPortAttempts = 30;

if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
  console.error(`Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.json', 'application/json; charset=utf-8']
]);

const server = createServer((request, response) => {
  try {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const requestedFile = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const candidate = normalize(join(root, requestedFile));
    const candidateRelative = relative(root, candidate);
    const escapesRoot = candidateRelative.startsWith(`..${sep}`) || candidateRelative === '..';

    if (escapesRoot || !existsSync(candidate) || statSync(candidate).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'content-type': types.get(extname(candidate)) || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    createReadStream(candidate).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
    console.error(error);
  }
});

function openBrowser(url) {
  if (process.env.NO_OPEN === '1' || process.env.CI) return;

  let command;
  let args;
  if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.on('error', () => {
    // Opening a browser is optional; the server remains usable.
  });
  child.unref();
}

function listen(port, remainingAttempts) {
  const onError = (error) => {
    server.off('listening', onListening);
    if (error.code === 'EADDRINUSE' && remainingAttempts > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use; trying ${nextPort}...`);
      listen(nextPort, remainingAttempts - 1);
      return;
    }

    console.error(`Unable to start Nebula Capsules: ${error.message}`);
    process.exitCode = 1;
  };

  const onListening = () => {
    server.off('error', onError);
    const url = `http://${host}:${port}`;
    console.log(`Nebula Capsules running at ${url}`);
    console.log('Press Control+C to stop.');
    openBrowser(url);
  };

  server.once('error', onError);
  server.once('listening', onListening);
  server.listen(port, host);
}

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

listen(requestedPort, maxPortAttempts);
