import express from 'express';
import { registerBaseMiddlewares } from './baseMiddlewares.mjs';
import { createApiRouter } from './apiRouter.mjs';
import { registerStaticAssets } from './staticAssets.mjs';
import {
  registerAppShellRoute,
  registerHealthCheck,
  registerRootRedirect,
} from './appRoutes.mjs';

export function createApp() {
  const app = express();

  registerBaseMiddlewares(app);

  const apiRouter = createApiRouter();
  app.use('/app/api', apiRouter);

  registerStaticAssets(app);
  registerHealthCheck(app);
  registerRootRedirect(app);
  registerAppShellRoute(app);

  return app;
}
