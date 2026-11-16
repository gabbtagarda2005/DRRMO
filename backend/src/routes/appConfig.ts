import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../config/citizenFeatures.json'
);

function readCitizenFeatures() {
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

/** Public manifest — bump `version` when AI adds or changes citizen app features. */
router.get('/citizen/features', (_req: Request, res: Response) => {
  const manifest = readCitizenFeatures();
  res.status(200).json(manifest);
});

export default router;
