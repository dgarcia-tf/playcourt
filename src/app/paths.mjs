import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const srcDir = path.resolve(currentDir, '..');
const projectRoot = path.resolve(srcDir, '..');
const publicDirectory = path.join(projectRoot, 'public');

export const appDirectory = path.join(publicDirectory, 'app');
export const uploadsDirectory = path.join(publicDirectory, 'uploads');
export const appIndexFile = path.join(appDirectory, 'index.html');
