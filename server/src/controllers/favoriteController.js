import FavoriteList from '../models/FavoriteList.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const DEFAULT_LIST_NAME = 'My favorites';

const LISTING_FIELDS = 'title price currency images location status condition category createdAt';

const ensureDefaultList = async (userId) => {
  let list = await FavoriteList.findOne({ user: userId, isDefault: true });
  if (!list) {
    list = await FavoriteList.create({
      user: userId,
      name: DEFAULT_LIST_NAME,
      isDefault: true,
      listings: [],
    });
  }
  return list;
};

const serializeList = (list) => ({
  _id: list._id,
  name: list.name,
  isDefault: list.isDefault,
  createdAt: list.createdAt,
  listings: (list.listings || []).map((p) => ({
    _id: p._id,
    title: p.title,
    price: p.price,
    currency: p.currency,
    images: p.images || [],
    status: p.status,
    condition: p.condition,
    category: p.category,
  })),
});

// GET /api/favorites - all lists for the logged-in user, listings populated.
// Creates the default list on first access.
export const getFavoriteLists = asyncHandler(async (req, res) => {
  await ensureDefaultList(req.user._id);
  const lists = await FavoriteList.find({ user: req.user._id })
    .populate({ path: 'listings', select: LISTING_FIELDS })
    .sort({ isDefault: -1, createdAt: 1 });

  res.status(200).json({ success: true, data: lists.map(serializeList) });
});

// POST /api/favorites - create a named list
export const createFavoriteList = asyncHandler(async (req, res) => {
  const name = (req.body?.name || '').toString().trim();
  if (!name) {
    return res.status(400).json({ success: false, message: 'List name is required' });
  }

  const exists = await FavoriteList.findOne({ user: req.user._id, name });
  if (exists) {
    return res.status(400).json({ success: false, message: 'A list with this name already exists' });
  }

  const list = await FavoriteList.create({ user: req.user._id, name, listings: [] });
  res.status(201).json({ success: true, data: serializeList(list) });
});

// PUT /api/favorites/:listId/toggle - add or remove a listing from a list
export const toggleFavoriteListing = asyncHandler(async (req, res) => {
  const { listingId } = req.body || {};
  if (!listingId) {
    return res.status(400).json({ success: false, message: 'listingId is required' });
  }

  const list = await FavoriteList.findOne({ _id: req.params.listId, user: req.user._id });
  if (!list) {
    return res.status(404).json({ success: false, message: 'Favorite list not found' });
  }

  const alreadySaved = list.listings.some((id) => id.toString() === listingId.toString());
  if (alreadySaved) {
    list.listings = list.listings.filter((id) => id.toString() !== listingId.toString());
  } else {
    list.listings.push(listingId);
  }
  await list.save();

  await list.populate({ path: 'listings', select: LISTING_FIELDS });
  res.status(200).json({ success: true, data: serializeList(list), saved: !alreadySaved });
});

// DELETE /api/favorites/:listId - delete a custom list (default cannot be deleted)
export const deleteFavoriteList = asyncHandler(async (req, res) => {
  const list = await FavoriteList.findOne({ _id: req.params.listId, user: req.user._id });
  if (!list) {
    return res.status(404).json({ success: false, message: 'Favorite list not found' });
  }
  if (list.isDefault) {
    return res.status(400).json({ success: false, message: 'The default list cannot be deleted' });
  }

  await list.deleteOne();
  res.status(200).json({ success: true, message: 'List deleted' });
});