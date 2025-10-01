import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    // Dev-only middleware to invoke Netlify function handlers locally without netlify dev
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/.netlify/functions/')) return next();
        try {
          const fnPath = url.slice('/.netlify/functions/'.length).split('?')[0];
          const base = path.join(process.cwd(), 'netlify', 'functions');
          const direct = path.join(base, fnPath + '.js');
          const index = path.join(base, fnPath, 'index.js');
          const file = fs.existsSync(direct) ? direct : fs.existsSync(index) ? index : null;
          if (!file) {
            res.statusCode = 404; res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Function not found' })); return;
          }
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve) => {
            req.on('data', (c) => chunks.push(Buffer.from(c)));
            req.on('end', () => resolve());
          });
          const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined;
          const mod = await import(pathToFileURL(file).href);
          const handler = mod.handler || mod.default || mod;
          if (typeof handler !== 'function') {
            res.statusCode = 500; res.end('Invalid function export'); return;
          }
          const out = await handler({
            httpMethod: req.method || 'GET',
            headers: req.headers as any,
            body,
            path: url
          });
          res.statusCode = out?.statusCode || 200;
          const headers = out?.headers || { 'Content-Type': 'application/json' };
          Object.entries(headers).forEach(([k, v]) => { if (v) res.setHeader(k, String(v)); });
          res.end(out?.body || '');
        } catch (e) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Function execution error', detail: (e as any)?.message }));
        }
      });
    }
  },
  preview: { port: 3000 }
});
