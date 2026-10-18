import { Router } from 'express';
import { getMe } from '../controllers/me.controller';
import { auth } from '../middleware/auth';

export const meRouter = Router();

meRouter.get('/', auth, getMe);
