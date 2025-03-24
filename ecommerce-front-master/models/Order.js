import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  line_items: [{
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  name: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  streetAddress: { type: String, required: true },
  country: { type: String, required: true },
  paid: { type: Boolean, default: false },
  razorpay_order_id: { type: String }, // New field for Razorpay order ID
  razorpay_payment_id: { type: String }, // New field for Razorpay payment ID
  razorpay_signature: { type: String }, // New field for Razorpay signature
}, { timestamps: true });

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
