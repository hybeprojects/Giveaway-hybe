// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    open: false,
    // Dev-only middleware to invoke Netlify function handlers locally without netlify dev
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/.netlify/functions/")) return next();
        try {
          const fnPath = url.slice("/.netlify/functions/".length).split("?")[0];
          const base = path.join(process.cwd(), "netlify", "functions");
          const direct = path.join(base, fnPath + ".js");
          const index = path.join(base, fnPath, "index.js");
          const file = fs.existsSync(direct) ? direct : fs.existsSync(index) ? index : null;
          if (!file) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Function not found" }));
            return;
          }
          const chunks = [];
          await new Promise((resolve) => {
            req.on("data", (c) => chunks.push(Buffer.from(c)));
            req.on("end", () => resolve());
          });
          const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : void 0;
          const mod = await import(pathToFileURL(file).href);
          const handler = mod.handler || mod.default || mod;
          if (typeof handler !== "function") {
            res.statusCode = 500;
            res.end("Invalid function export");
            return;
          }
          const out = await handler({
            httpMethod: req.method || "GET",
            headers: req.headers,
            body,
            path: url
          });
          res.statusCode = out?.statusCode || 200;
          const headers = out?.headers || { "Content-Type": "application/json" };
          Object.entries(headers).forEach(([k, v]) => {
            if (v) res.setHeader(k, String(v));
          });
          res.end(out?.body || "");
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Function execution error", detail: e?.message }));
        }
      });
    }
  },
  preview: { port: 3e3 }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogZmFsc2UsXG4gICAgLy8gRGV2LW9ubHkgbWlkZGxld2FyZSB0byBpbnZva2UgTmV0bGlmeSBmdW5jdGlvbiBoYW5kbGVycyBsb2NhbGx5IHdpdGhvdXQgbmV0bGlmeSBkZXZcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8ICcnO1xuICAgICAgICBpZiAoIXVybC5zdGFydHNXaXRoKCcvLm5ldGxpZnkvZnVuY3Rpb25zLycpKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGZuUGF0aCA9IHVybC5zbGljZSgnLy5uZXRsaWZ5L2Z1bmN0aW9ucy8nLmxlbmd0aCkuc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICBjb25zdCBiYXNlID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICduZXRsaWZ5JywgJ2Z1bmN0aW9ucycpO1xuICAgICAgICAgIGNvbnN0IGRpcmVjdCA9IHBhdGguam9pbihiYXNlLCBmblBhdGggKyAnLmpzJyk7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSBwYXRoLmpvaW4oYmFzZSwgZm5QYXRoLCAnaW5kZXguanMnKTtcbiAgICAgICAgICBjb25zdCBmaWxlID0gZnMuZXhpc3RzU3luYyhkaXJlY3QpID8gZGlyZWN0IDogZnMuZXhpc3RzU3luYyhpbmRleCkgPyBpbmRleCA6IG51bGw7XG4gICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0Z1bmN0aW9uIG5vdCBmb3VuZCcgfSkpOyByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGMpID0+IGNodW5rcy5wdXNoKEJ1ZmZlci5mcm9tKGMpKSk7XG4gICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGNodW5rcy5sZW5ndGggPyBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCBtb2QgPSBhd2FpdCBpbXBvcnQocGF0aFRvRmlsZVVSTChmaWxlKS5ocmVmKTtcbiAgICAgICAgICBjb25zdCBoYW5kbGVyID0gbW9kLmhhbmRsZXIgfHwgbW9kLmRlZmF1bHQgfHwgbW9kO1xuICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7IHJlcy5lbmQoJ0ludmFsaWQgZnVuY3Rpb24gZXhwb3J0Jyk7IHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgb3V0ID0gYXdhaXQgaGFuZGxlcih7XG4gICAgICAgICAgICBodHRwTWV0aG9kOiByZXEubWV0aG9kIHx8ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczogcmVxLmhlYWRlcnMgYXMgYW55LFxuICAgICAgICAgICAgYm9keSxcbiAgICAgICAgICAgIHBhdGg6IHVybFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gb3V0Py5zdGF0dXNDb2RlIHx8IDIwMDtcbiAgICAgICAgICBjb25zdCBoZWFkZXJzID0gb3V0Py5oZWFkZXJzIHx8IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9O1xuICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGhlYWRlcnMpLmZvckVhY2goKFtrLCB2XSkgPT4geyBpZiAodikgcmVzLnNldEhlYWRlcihrLCBTdHJpbmcodikpOyB9KTtcbiAgICAgICAgICByZXMuZW5kKG91dD8uYm9keSB8fCAnJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDsgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdGdW5jdGlvbiBleGVjdXRpb24gZXJyb3InLCBkZXRhaWw6IChlIGFzIGFueSk/Lm1lc3NhZ2UgfSkpO1xuICAgICAgICB9XG4gICAgICB9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
