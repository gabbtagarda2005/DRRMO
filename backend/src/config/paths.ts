import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Upload directory, resolved relative to the backend package so it is the same
 * whether the server runs from `src/` (tsx) or `dist/` (node), and regardless
 * of the process working directory (local scripts vs. Render's root dir).
 */
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(backendRoot, process.env.UPLOAD_DIR)
  : path.join(backendRoot, 'uploads');
