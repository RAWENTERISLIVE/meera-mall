import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      activeDeliveries,
      lowStockProducts,
      customerCount
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),
      
      // Pending orders count
      Order.countDocuments({
        'delivery.status': 'pending'
      }),
      
      // Total revenue calculation
      Order.aggregate([
        {
          $match: {
            'payment.status': 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$summary.total' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      
      // Active deliveries count
      Order.countDocuments({
        'delivery.status': 'out_for_delivery'
      }),
      
      // Low stock products count
      Product.countDocuments({
        'inventory.quantity': { $lte: '$inventory.lowStockThreshold' }
      }),
      
      // Total customers count
      Customer.countDocuments()
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      totalRevenue,
      activeDeliveries,
      lowStockItems: lowStockProducts,
      customerCount
    });
  } catch (error) {
    console.error('Dashboard Metrics Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
}
