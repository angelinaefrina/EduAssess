import { Router } from 'express';
import { instrumen } from '../controllers/asesmen.controller';
import { auth } from '../middleware/auth';

export const asesmenRouter = Router();

asesmenRouter.get('/instrumen', auth, instrumen);
