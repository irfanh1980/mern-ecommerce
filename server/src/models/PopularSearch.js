import mongoose from 'mongoose';

const popularSearchSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      maxlength: [50, 'Label cannot exceed 50 characters'],
    },
    query: {
      type: String,
      trim: true,
      maxlength: [100, 'Query cannot exceed 100 characters'],
    },
    categorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Category slug cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['vehicle', 'furniture', 'pet', 'electronics', 'clothing', 'other'],
      default: 'other',
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

popularSearchSchema.index({ isActive: 1, clicks: -1 });

export default mongoose.model('PopularSearch', popularSearchSchema);
