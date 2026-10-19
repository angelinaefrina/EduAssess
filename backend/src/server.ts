import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API berjalan di http://0.0.0.0:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});
