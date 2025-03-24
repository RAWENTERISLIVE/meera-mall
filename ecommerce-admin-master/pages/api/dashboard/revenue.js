import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    // Get revenue data for the last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const revenueData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'paid',
          createdAt: {
            $gte: new Date(last7Days[0]),
            $lte: new Date(new Date(last7Days[6]).setHours(23, 59, 59))
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$summary.total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing days with zero revenue
    const filledData = last7Days.map(date => {
      const dayData = revenueData.find(d => d._id === date);
      return {
        date,
        revenue: dayData?.revenue || 0,
        orderCount: dayData?.orderCount || 0
      };
    });

    // Format data for Chart.js
    const chartData = {
      labels: filledData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Revenue',
          data: filledData.map(d => d.revenue),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Orders',
          data: filledData.map(d => d.orderCount),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          fill: false,
          yAxisID: 'orders'
        }
      ]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Revenue Data Error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
}
