import mongoose, {model, models, Schema} from "mongoose";

const CustomerSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['new', 'regular', 'vip'],
    default: 'new'
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    isDefault: { type: Boolean, default: false },
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    landmark: String,
    deliveryInstructions: String
  }],
  preferences: {
    preferredPaymentMethod: String,
    marketingEmails: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' }
  },
  loyalty: {
    points: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    pointsHistory: [{
      points: Number,
      type: { type: String, enum: ['earned', 'redeemed', 'expired'] },
      orderId: { type: mongoose.Types.ObjectId, ref: 'Order' },
      description: String,
      date: { type: Date, default: Date.now }
    }]
  },
  orderHistory: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date,
    cancelledOrders: { type: Number, default: 0 },
    returnedOrders: { type: Number, default: 0 }
  },
  wishlist: [{
    product: { type: mongoose.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }],
  cart: {
    items: [{
      product: { type: mongoose.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      addedAt: { type: Date, default: Date.now }
    }],
    lastUpdated: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'loyalty']
    },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }],
  feedback: [{
    orderId: { type: mongoose.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  referrals: {
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Types.ObjectId, ref: 'Customer' },
    referredCustomers: [{
      customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
      }
    }],
    totalReferrals: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 }
  },
  metadata: {
    registrationDate: { type: Date, default: Date.now },
    lastLogin: Date,
    lastActivity: Date,
    deviceInfo: [{
      deviceType: String,
      browser: String,
      ip: String,
      lastUsed: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes for faster queries
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ type: 1 });
CustomerSchema.index({ 'loyalty.tier': 1 });

// Generate unique referral code
CustomerSchema.pre('save', async function(next) {
  if (this.isNew && !this.referrals.referralCode) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referrals.referralCode = `REF${code}`;
  }
  next();
});

// Method to calculate customer tier based on points
CustomerSchema.methods.calculateTier = function() {
  const points = this.loyalty.points;
  if (points >= 1000) return 'platinum';
  if (points >= 500) return 'gold';
  if (points >= 200) return 'silver';
  return 'bronze';
};

// Method to update customer type based on order history
CustomerSchema.methods.updateCustomerType = function() {
  const { totalOrders, totalSpent } = this.orderHistory;
  if (totalOrders >= 10 || totalSpent >= 1000) return 'vip';
  if (totalOrders >= 3 || totalSpent >= 200) return 'regular';
  return 'new';
};

export const Customer = models?.Customer || model('Customer', CustomerSchema);
