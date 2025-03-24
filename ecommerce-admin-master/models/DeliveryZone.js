import mongoose, {model, models, Schema} from "mongoose";

const DeliveryZoneSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily_closed'],
    default: 'active'
  },
  coverage: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCodes: [String],
    coordinates: [{
      lat: Number,
      lng: Number
    }]
  },
  deliveryRules: {
    minimumOrderValue: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number },
    estimatedDeliveryTime: {
      min: Number, // in minutes
      max: Number  // in minutes
    },
    maxOrdersPerSlot: { type: Number, default: 50 },
    specialInstructions: String
  },
  operatingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    isOpen: { type: Boolean, default: true },
    slots: [{
      startTime: String,
      endTime: String,
      maxOrders: Number
    }]
  }],
  restrictions: {
    blackoutDates: [Date],
    itemRestrictions: [{
      productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
      reason: String
    }],
    weightLimit: Number, // in kg
    volumeLimit: Number // in cubic meters
  },
  assignedDrivers: [{
    type: mongoose.Types.ObjectId,
    ref: 'Employee'
  }],
  analytics: {
    totalOrders: { type: Number, default: 0 },
    averageDeliveryTime: Number,
    customerRating: Number,
    successRate: Number
  }
}, {
  timestamps: true
});

// Indexes for faster queries
DeliveryZoneSchema.index({ 'coverage.city': 1 });
DeliveryZoneSchema.index({ 'coverage.postalCodes': 1 });
DeliveryZoneSchema.index({ status: 1 });

// Method to check if delivery is available for a postal code
DeliveryZoneSchema.methods.isServiceable = function(postalCode) {
  return this.status === 'active' && this.coverage.postalCodes.includes(postalCode);
};

// Method to check if zone is currently operating
DeliveryZoneSchema.methods.isCurrentlyOperating = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  
  const todaySchedule = this.operatingHours.find(h => h.day === day);
  if (!todaySchedule || !todaySchedule.isOpen) return false;
  
  return todaySchedule.slots.some(slot => {
    return time >= slot.startTime && time <= slot.endTime;
  });
};

export const DeliveryZone = models?.DeliveryZone || model('DeliveryZone', DeliveryZoneSchema);
