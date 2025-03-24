import mongoose, {model, models, Schema} from "mongoose";

const AnalyticsSchema = new Schema({
  date: { type: Date, required: true },
  metrics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    activeDeliveries: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    canceledOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
  },
  hourlyData: [{
    hour: Number,
    orders: Number,
    revenue: Number
  }],
  topProducts: [{
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    revenue: Number
  }],
  customerMetrics: {
    newCustomers: Number,
    repeatCustomers: Number,
    totalCustomers: Number
  }
}, {
  timestamps: true,
});

export const Analytics = models?.Analytics || model('Analytics', AnalyticsSchema);
