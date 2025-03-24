import mongoose, {model, models, Schema} from "mongoose";

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      deliveryInstructions: String
    }
  },
  items: [{
    product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    variant: String,
    notes: String
  }],
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cod', 'card', 'upi', 'wallet'],
      required: true
    },
    transactionId: String,
    paidAmount: Number,
    refundAmount: Number,
    refundReason: String
  },
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
      default: 'pending'
    },
    assignedTo: { type: mongoose.Types.ObjectId, ref: 'Employee' },
    zone: { type: mongoose.Types.ObjectId, ref: 'DeliveryZone' },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    trackingUpdates: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      updatedBy: { type: mongoose.Types.ObjectId, ref: 'Employee' }
    }]
  },
  summary: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  appliedCoupons: [{
    code: String,
    discountAmount: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  cancellation: {
    reason: String,
    note: String,
    cancelledBy: { type: mongoose.Types.ObjectId, ref: 'Employee' },
    timestamp: Date
  },
  customerFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ 'delivery.status': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Generate unique order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  next();
});

export const Order = models?.Order || model('Order', OrderSchema);