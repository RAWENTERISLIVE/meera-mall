import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    // Get order status distribution
    const orderStatusData = await Order.aggregate([
      {
        $group: {
          _id: '$delivery.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Define status colors
    const statusColors = {
      pending: 'rgb(255, 159, 64)',      // Orange
      processing: 'rgb(54, 162, 235)',    // Blue
      packed: 'rgb(75, 192, 192)',        // Teal
      out_for_delivery: 'rgb(153, 102, 255)', // Purple
      delivered: 'rgb(40, 167, 69)',      // Green
      failed: 'rgb(220, 53, 69)',         // Red
      cancelled: 'rgb(108, 117, 125)'     // Gray
    };

    // Format data for Chart.js doughnut chart
    const chartData = {
      labels: orderStatusData.map(status => 
        status._id.charAt(0).toUpperCase() + status._id.slice(1).replace(/_/g, ' ')
      ),
      datasets: [{
        data: orderStatusData.map(status => status.count),
        backgroundColor: orderStatusData.map(status => statusColors[status._id] || '#000000'),
        borderColor: 'white',
        borderWidth: 2
      }]
    };

    // Add additional statistics
    const totalOrders = orderStatusData.reduce((sum, status) => sum + status.count, 0);
    const statistics = {
      total: totalOrders,
      percentages: orderStatusData.map(status => ({
        status: status._id,
        percentage: ((status.count / totalOrders) * 100).toFixed(1)
      }))
    };

    res.json({
      chartData,
      statistics
    });
  } catch (error) {
    console.error('Order Status Data Error:', error);
    res.status(500).json({ error: 'Failed to fetch order status data' });
  }
}
