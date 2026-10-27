import { Readable } from 'stream';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const streamUpload = (buffer, user) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `marketplace_uploads/users/${user._id}/listings`,
        resource_type: 'image',
        tags: [`user_${user._id}`, 'product_listing'],
        context: `userId=${user._id}|userEmail=${user.email || ''}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    Readable.from(buffer).pipe(stream);
  });

export const uploadImages = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(500).json({
      success: false,
      message:
        'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env',
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  try {
    const results = await Promise.all(req.files.map((file) => streamUpload(file.buffer, req.user)));
    const images = results.map((r) => ({
      url: r.secure_url,
      public_id: r.public_id,
    }));
    res.status(200).json({ success: true, data: { images } });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw err;
  }
});
