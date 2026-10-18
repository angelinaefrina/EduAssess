import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`API berjalan di http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});
