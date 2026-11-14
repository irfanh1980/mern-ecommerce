import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getFavoriteLists,
  createFavoriteList,
  toggleFavoriteListing,
  deleteFavoriteList,
} from '../controllers/favoriteController.js';

const router = Router();

router.use(protect);

router.get('/', getFavoriteLists);
router.post('/', createFavoriteList);
router.put('/:listId/toggle', toggleFavoriteListing);
router.delete('/:listId', deleteFavoriteList);

export default router;