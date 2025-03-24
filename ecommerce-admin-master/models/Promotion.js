import mongoose, {model, models, Schema} from "mongoose";

const PromotionSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'],
    required: true
  },
  value: { type: Number, required: true }, // Percentage or fixed amount
  description: String,
  status: {
    type: String,
    enum: ['active', 'scheduled', 'expired', 'disabled'],
    default: 'active'
  },
  conditions: {
    minimumPurchase: Number,
    maximumDiscount: Number,
    usageLimit: {
      perCustomer: Number,
      total: Number
    },
    applicableProducts: [{
      type: mongoose.Types.ObjectId,
      ref: 'Product'
    }],
    excludedProducts: [{
      type: mongoose.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: mongoose.Types.ObjectId,
      ref: 'Category'
    }],
    firstTimeCustomers: { type: Boolean, default: false },
    paymentMethods: [String]
  },
  timing: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    applicableHours: {
      start: String, // 24-hour format
      end: String    // 24-hour format
    }
  },
  customerGroups: [{
    type: String,
    enum: ['all', 'new', 'regular', 'vip']
  }],
  stackable: { type: Boolean, default: false },
  priority: { type: Number, default: 0 }, // For handling multiple applicable promotions
  analytics: {
    timesUsed: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  notifications: {
    notifyCustomers: { type: Boolean, default: false },
    notificationMessage: String,
    reminderBefore: Number // hours before expiry
  },
  metadata: {
    createdBy: { type: mongoose.Types.ObjectId, ref: 'Employee' },
    lastModifiedBy: { type: mongoose.Types.ObjectId, ref: 'Employee' },
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
PromotionSchema.index({ code: 1 });
PromotionSchema.index({ status: 1 });
PromotionSchema.index({ 'timing.startDate': 1 });
PromotionSchema.index({ 'timing.endDate': 1 });

// Method to check if promotion is valid for a given date
PromotionSchema.methods.isValidForDate = function(date = new Date()) {
  const day = date.toLocaleLowerCase();
  const time = date.toLocaleTimeString('en-US', { hour12: false });
  
  // Check if promotion is active and within date range
  if (this.status !== 'active') return false;
  if (date < this.timing.startDate || date > this.timing.endDate) return false;
  
  // Check if applicable for current day
  if (this.timing.applicableDays.length && !this.timing.applicableDays.includes(day)) {
    return false;
  }
  
  // Check if within applicable hours
  if (this.timing.applicableHours.start && this.timing.applicableHours.end) {
    if (time < this.timing.applicableHours.start || time > this.timing.applicableHours.end) {
      return false;
    }
  }
  
  return true;
};

// Method to calculate discount amount
PromotionSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.type === 'percentage') {
    const discount = (orderAmount * this.value) / 100;
    return this.conditions.maximumDiscount 
      ? Math.min(discount, this.conditions.maximumDiscount)
      : discount;
  }
  return this.value; // For fixed amount discounts
};

export const Promotion = models?.Promotion || model('Promotion', PromotionSchema);
