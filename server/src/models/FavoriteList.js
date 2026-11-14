import mongoose from 'mongoose';

const favoriteListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'List name is required'],
      trim: true,
      maxlength: [60, 'List name cannot exceed 60 characters'],
    },
    listings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

favoriteListSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('FavoriteList', favoriteListSchema);