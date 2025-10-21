const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));

  const apiRouter = express.Router();
  apiRouter.use(routes);
  apiRouter.use(notFoundHandler);
  apiRouter.use(errorHandler);

  app.use('/app/api', apiRouter);

  const appDirectory = path.join(__dirname, '..', 'public', 'app');
  app.use(express.static(appDirectory));
  const uploadsDirectory = path.join(__dirname, '..', 'public', 'uploads');
  app.use('/uploads', express.static(uploadsDirectory));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(appDirectory, 'index.html'));
  });

  return app;
}

module.exports = { createApp };
