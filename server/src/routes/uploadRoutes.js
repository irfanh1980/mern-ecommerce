import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadImages } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', protect, upload.array('images', 5), uploadImages);

export default router;
