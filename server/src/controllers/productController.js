import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const destroyCloudinaryImages = async (images) => {
  if (!Array.isArray(images)) return;
  await Promise.all(
    images.map((img) => {
      if (!img || !img.public_id) return Promise.resolve();
      return cloudinary.uploader.destroy(img.public_id).catch(() => {});
    }),
  );
};

export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    sort = '-createdAt',
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category.toLowerCase();
  if (search) filter.$text = { $search: search };
  if (req.query.seller) filter.seller = req.query.seller;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 12, 100));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name email storeName isVerified')
      .populate('user', 'name email storeName isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name email storeName isVerified')
    .populate('user', 'name email storeName isVerified');
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  req.body.seller = req.user._id;
  req.body.user = req.user._id;
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (!product.seller.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
  }

  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([, value]) => value !== undefined)
  );

  if (updates.images && Array.isArray(updates.images)) {
    const oldImages = product.images || [];
    const newPublicIds = new Set(updates.images.map((i) => i.public_id));
    const toDestroy = oldImages.filter((img) => img.public_id && !newPublicIds.has(img.public_id));
    await destroyCloudinaryImages(toDestroy);
  }

  Object.assign(product, updates);
  await product.save();
  res.status(200).json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (!product.seller.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
  }

  await destroyCloudinaryImages(product.images || []);
  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted' });
});
