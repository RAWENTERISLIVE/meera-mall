import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Analytics } from "@/models/Analytics";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default: // 7d
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get overview metrics
    const [
      orderMetrics,
      customerCount,
      categoryData,
      dailyRevenue
    ] = await Promise.all([
      // Order metrics
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$summary.total' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$summary.total' }
          }
        }
      ]),

      // Customer metrics
      Customer.countDocuments({
        'metadata.registrationDate': { $gte: startDate, $lte: endDate }
      }),

      // Sales by category
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'paid'
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.name',
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Daily revenue data
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'paid'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$summary.total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate customer demographics
    const customerMetrics = await Customer.aggregate([
      {
        $match: {
          'metadata.registrationDate': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format data for charts
    const revenueData = {
      labels: dailyRevenue.map(day => {
        const date = new Date(day._id);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }),
      datasets: [
        {
          label: 'Revenue',
          data: dailyRevenue.map(day => day.revenue),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Orders',
          data: dailyRevenue.map(day => day.orders),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };

    const categoryChartData = {
      labels: categoryData.map(cat => cat._id),
      datasets: [{
        label: 'Revenue by Category',
        data: categoryData.map(cat => cat.revenue),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }]
    };

    const customerChartData = {
      labels: customerMetrics.map(metric => 
        metric._id.charAt(0).toUpperCase() + metric._id.slice(1)
      ),
      datasets: [{
        data: customerMetrics.map(metric => metric.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)'
        ]
      }]
    };

    // Calculate overview metrics
    const metrics = orderMetrics[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0
    };

    // Save analytics data
    await Analytics.create({
      date: new Date(),
      metrics: {
        totalOrders: metrics.totalOrders,
        totalRevenue: metrics.totalRevenue,
        averageOrderValue: metrics.averageOrderValue,
        newCustomers: customerCount
      }
    });

    res.json({
      overview: {
        totalRevenue: metrics.totalRevenue,
        totalOrders: metrics.totalOrders,
        averageOrderValue: metrics.averageOrderValue,
        conversionRate: ((metrics.totalOrders / (customerCount || 1)) * 100).toFixed(2)
      },
      revenueData,
      categoryData: categoryChartData,
      customerMetrics: customerChartData
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}
