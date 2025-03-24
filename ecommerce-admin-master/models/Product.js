import mongoose, {model, Schema, models} from "mongoose";

const ProductSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: mongoose.Types.ObjectId, ref: 'Category' },
  properties: { type: Object },
  status: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  orderThreshold: {
    type: Number,
    default: 5
  },
  inventory: {
    tracked: { type: Boolean, default: true },
    lastUpdated: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ProductSchema.index({ status: 1 });
ProductSchema.index({ 'inventory.tracked': 1 });

export const Product = models?.Product || model('Product', ProductSchema);
