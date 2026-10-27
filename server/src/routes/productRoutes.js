import { Router } from 'express';
import { validateMiddleware } from '../middleware/validateMiddleware.js';
import { productBodySchema, productUpdateSchema } from '../validators/productValidator.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, restrictTo('Seller'), validateMiddleware(productBodySchema), createProduct);
router.put('/:id', protect, restrictTo('Seller'), validateMiddleware(productUpdateSchema), updateProduct);
router.delete('/:id', protect, restrictTo('Seller'), deleteProduct);

export default router;
