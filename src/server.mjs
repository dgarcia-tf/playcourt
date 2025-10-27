import dotenv from 'dotenv';
import http from 'node:http';
import dbModule from './config/db.js';
import { createApp } from './app/index.mjs';
import matchExpirationService from './services/matchExpirationService.js';
import matchResultAutoConfirmService from './services/matchResultAutoConfirmService.js';
import pushNotificationService from './services/pushNotificationService.js';
import mailConfig from './config/mail.js';

dotenv.config();

const { connectDatabase } = dbModule;
const { scheduleMatchExpirationChecks } = matchExpirationService;
const { scheduleMatchResultAutoConfirmChecks } = matchResultAutoConfirmService;
const { configurePushNotifications } = pushNotificationService;
const { configureMailTransport } = mailConfig;

async function start() {
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGODB_URI;

  await connectDatabase(mongoUri);

  configurePushNotifications();
  configureMailTransport();

  const app = createApp();
  scheduleMatchExpirationChecks();
  scheduleMatchResultAutoConfirmChecks();
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Aplicación web C.N. Playa San Marcos escuchando en el puerto ${port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error iniciando el servidor', error);
  process.exit(1);
});
