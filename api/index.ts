import express from 'express';
import { apiRouter } from './routes';

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Normalize URLs and handle Vercel rewrites
app.use((req, _res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/{2,}/g, '/');
  }
  const matchedPath = req.headers['x-matched-path'] as string;
  if (matchedPath && (req.url === '/api/index' || req.url === '/index' || req.url === '/api' || req.url === '/')) {
    req.url = matchedPath;
  }
  next();
});

// Mount routes at both /api and / to handle any Vercel URL rewrite patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default function handler(req: any, res: any) {
  return app(req, res);
}
export { app };
