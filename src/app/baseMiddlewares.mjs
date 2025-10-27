import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

export function registerBaseMiddlewares(app) {
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));
}
