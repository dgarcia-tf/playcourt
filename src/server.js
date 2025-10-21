require('dotenv').config();
const http = require('http');
const { connectDatabase } = require('./config/db');
const { createApp } = require('./app');
const { scheduleMatchExpirationChecks } = require('./services/matchExpirationService');
const { configurePushNotifications } = require('./services/pushNotificationService');
const { configureMailTransport } = require('./config/mail');

async function start() {
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGODB_URI;

  await connectDatabase(mongoUri);

  configurePushNotifications();
  configureMailTransport();

  const app = createApp();
  scheduleMatchExpirationChecks();
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Aplicación web Liga Tennis escuchando en el puerto ${port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error iniciando el servidor', error);
  process.exit(1);
});
