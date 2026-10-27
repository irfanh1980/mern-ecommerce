import { Router } from 'express';
import {
  getPopularSearches,
  incrementPopularSearchClick,
} from '../controllers/popularSearchController.js';

const router = Router();

router.get('/', getPopularSearches);
router.post('/:id/click', incrementPopularSearchClick);

export default router;
