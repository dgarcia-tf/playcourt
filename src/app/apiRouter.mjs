import express from 'express';
import routes from '../routes/index.js';
import errorHandlers from '../middleware/errorHandler.js';

const { notFoundHandler, errorHandler } = errorHandlers;

export function createApiRouter() {
  const apiRouter = express.Router();
  apiRouter.use(routes);
  apiRouter.use(notFoundHandler);
  apiRouter.use(errorHandler);
  return apiRouter;
}
