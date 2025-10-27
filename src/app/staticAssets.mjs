import express from 'express';
import { appDirectory, uploadsDirectory } from './paths.mjs';

export function registerStaticAssets(app) {
  app.use('/app', express.static(appDirectory, { index: false }));
  app.use('/uploads', express.static(uploadsDirectory));
}
