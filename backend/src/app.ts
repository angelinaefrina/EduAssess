import path from 'node:path';
import cors from 'cors';
import express, { Router } from 'express';
import { corsOrigins } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { asesmenRouter } from './routes/asesmen.routes';
import { bkRouter } from './routes/bk.routes';
import { healthRouter } from './routes/health.routes';
import { katalogRouter } from './routes/katalog.routes';
import { masterRouter } from './routes/master.routes';
import { meRouter } from './routes/me.routes';
import { siswaRouter } from './routes/siswa.routes';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));

const api = Router();
api.use('/health', healthRouter);
// Spesifikasi OpenAPI (publik) untuk impor Postman/Insomnia lewat URL. Server dijalankan dari backend/.
api.get('/openapi.yaml', (_req, res) => {
  res.type('application/yaml').sendFile(path.resolve(process.cwd(), 'openapi.yaml'));
});
api.use('/me', meRouter);
api.use('/master', masterRouter);
api.use('/asesmen', asesmenRouter);
api.use('/katalog', katalogRouter);
api.use('/siswa', siswaRouter);
api.use('/bk', bkRouter);

app.use('/api/v1', api);

app.use(notFoundHandler);
app.use(errorHandler);
