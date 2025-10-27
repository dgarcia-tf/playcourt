import { appIndexFile } from './paths.mjs';

export function registerHealthCheck(app) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
}

export function registerRootRedirect(app) {
  app.get('/', (req, res) => {
    res.redirect('/app');
  });
}

export function registerAppShellRoute(app) {
  app.get(['/app', '/app/*'], (req, res) => {
    res.sendFile(appIndexFile);
  });
}
