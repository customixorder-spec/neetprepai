import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./api/routes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware - allows requests from Vercel (e.g. neetprep.vercel.app) and preview environments
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Normalize duplicate slashes in incoming URLs (e.g. //api/... -> /api/...)
  app.use((req, _res, next) => {
    if (req.url && req.url.includes("//")) {
      req.url = req.url.replace(/\/{2,}/g, "/");
    }
    next();
  });

  // Mount API router
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ScholarPulse AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
