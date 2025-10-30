import dotenv from 'dotenv';
import http from 'node:http';
import { connectDatabase } from './config/database.js';
import { initializeModels } from './models/index.js';
import { createApp } from './app/index.mjs';
import matchExpirationService from './services/matchExpirationService.js';
import matchResultAutoConfirmService from './services/matchResultAutoConfirmService.js';
import pushNotificationService from './services/pushNotificationService.js';
import mailConfig from './config/mail.js';

dotenv.config();

const { scheduleMatchExpirationChecks } = matchExpirationService;
const { scheduleMatchResultAutoConfirmChecks } = matchResultAutoConfirmService;
const { configurePushNotifications } = pushNotificationService;
const { configureMailTransport } = mailConfig;

async function start() {
  const port = process.env.PORT || 3000;
  const dbConfig = process.env.DB_CONFIG;

  try {
    // Conectar a la base de datos
    await connectDatabase(dbConfig);
    
    // Inicializar modelos
    await initializeModels();

    configurePushNotifications();
    configureMailTransport();

    const app = createApp();
    scheduleMatchExpirationChecks();
    scheduleMatchResultAutoConfirmChecks();
    const server = http.createServer(app);

    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Aplicación web PlayCourt escuchando en el puerto ${port}`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error iniciando el servidor', error);
  process.exit(1);
});
