import PopularSearch from '../models/PopularSearch.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const DEFAULT_POPULAR_SEARCHES = [
  { label: 'Soffa', query: 'soffa', categorySlug: 'home', type: 'furniture' },
  { label: 'BMW X5', query: 'bmw x5', categorySlug: '', type: 'vehicle' },
  { label: 'Cykel', query: 'cykel', categorySlug: 'sports', type: 'other' },
  { label: 'Kattungar', query: 'kattungar', categorySlug: '', type: 'pet' },
  { label: 'iPhone', query: 'iphone', categorySlug: 'electronics', type: 'electronics' },
  { label: 'Vinterdäck', query: 'vinterdäck', categorySlug: '', type: 'vehicle' },
  { label: 'Kläder', query: 'kläder', categorySlug: 'clothing', type: 'clothing' },
  { label: 'Barnvagn', query: 'barnvagn', categorySlug: 'other', type: 'other' },
];

export const getPopularSearches = asyncHandler(async (req, res) => {
  let popular = await PopularSearch.find({ isActive: true }).sort({ clicks: -1 }).limit(12);

  // Seed default data if collection is empty (first run / no admin has configured yet)
  if (popular.length === 0) {
    const docs = await PopularSearch.insertMany(
      DEFAULT_POPULAR_SEARCHES.map((item) => ({ ...item, clicks: Math.floor(Math.random() * 100) + 10 }))
    );
    popular = docs;
  }

  res.status(200).json({
    success: true,
    count: popular.length,
    data: popular.map((item) => ({
      _id: item._id,
      label: item.label,
      query: item.query,
      categorySlug: item.categorySlug,
      type: item.type,
      clicks: item.clicks,
    })),
  });
});

export const incrementPopularSearchClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await PopularSearch.findByIdAndUpdate(
    id,
    { $inc: { clicks: 1 } },
    { new: true }
  );
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Popular search not found' });
  }
  res.status(200).json({ success: true, clicks: updated.clicks });
});
