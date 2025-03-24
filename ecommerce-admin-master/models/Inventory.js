import mongoose, {model, models, Schema} from "mongoose";

const InventorySchema = new Schema({
  product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
  currentStock: { type: Number, required: true, default: 0 },
  minimumStock: { type: Number, required: true, default: 10 },
  maximumStock: { type: Number, required: true },
  reservedStock: { type: Number, default: 0 }, // For items in shopping carts
  incomingStock: { type: Number, default: 0 }, // Expected from suppliers
  location: {
    warehouse: String,
    shelf: String,
    bin: String
  },
  supplier: {
    name: String,
    contactPerson: String,
    email: String,
    phone: String,
    leadTime: Number, // in days
  },
  stockHistory: [{
    date: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['received', 'shipped', 'adjusted', 'returned', 'damaged']
    },
    quantity: Number,
    reference: String, // PO number, Order ID, etc.
    notes: String
  }],
  alerts: {
    lowStock: { type: Boolean, default: false },
    overStock: { type: Boolean, default: false },
    reorderPoint: { type: Number, required: true },
  },
  lastStockCheck: Date,
  nextStockCheck: Date,
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  batchTracking: [{
    batchNumber: String,
    quantity: Number,
    manufacturingDate: Date,
    expiryDate: Date,
    cost: Number
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
InventorySchema.index({ product: 1 });
InventorySchema.index({ status: 1 });
InventorySchema.index({ 'alerts.lowStock': 1 });

// Virtual for available stock
InventorySchema.virtual('availableStock').get(function() {
  return this.currentStock - this.reservedStock;
});

// Method to check stock status
InventorySchema.methods.updateStockStatus = function() {
  if (this.currentStock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.currentStock <= this.alerts.reorderPoint) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  this.alerts.lowStock = this.currentStock <= this.alerts.reorderPoint;
  this.alerts.overStock = this.currentStock > this.maximumStock;
};

export const Inventory = models?.Inventory || model('Inventory', InventorySchema);
