import mongoose, {model, models, Schema} from "mongoose";

const EmployeeSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'manager', 'delivery', 'support', 'inventory'],
    default: 'support'
  },
  permissions: [{
    type: String,
    enum: [
      'view_dashboard',
      'manage_products',
      'manage_orders',
      'manage_inventory',
      'manage_employees',
      'manage_customers',
      'manage_promotions',
      'view_analytics',
      'manage_settings'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  shifts: [{
    day: { 
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String
  }],
  contactNumber: String,
  address: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  joiningDate: { type: Date, default: Date.now },
  lastActive: Date,
  profileImage: String,
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ role: 1 });
EmployeeSchema.index({ status: 1 });

export const Employee = models?.Employee || model('Employee', EmployeeSchema);
