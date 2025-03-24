import Layout from "@/components/Layout";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Home() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeDeliveries: 0,
    lowStockItems: 0,
    customerCount: 0
  });
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });
  const [orderStatusData, setOrderStatusData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [metricsRes, revenueRes, orderStatusRes] = await Promise.all([
        axios.get('/api/dashboard/metrics'),
        axios.get('/api/dashboard/revenue'),
        axios.get('/api/dashboard/order-status')
      ]);

      setMetrics(metricsRes.data);
      setRevenueData(revenueRes.data);
      setOrderStatusData(orderStatusRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-gray-600">Here's what's happening in your store today</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-2 rounded-lg shadow items-center gap-2">
            <img src={session?.user?.image} alt="" className="w-8 h-8 rounded-full"/>
            <span className="font-medium">{session?.user?.name}</span>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickStatCard
          title="Total Orders"
          value={metrics.totalOrders}
          change="+12.5%"
          icon="📦"
        />
        <QuickStatCard
          title="Revenue"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          change="+8.2%"
          icon="💰"
        />
        <QuickStatCard
          title="Active Deliveries"
          value={metrics.activeDeliveries}
          change="-"
          icon="🚚"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            <Line data={revenueData} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true }
              }
            }} />
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
          <div className="h-64">
            <Doughnut data={orderStatusData} options={{
              responsive: true,
              maintainAspectRatio: false
            }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            title="Add Product"
            icon="➕"
            href="/products/new"
          />
          <QuickActionButton
            title="View Orders"
            icon="📋"
            href="/orders"
          />
          <QuickActionButton
            title="Inventory"
            icon="📦"
            href="/inventory"
          />
          <QuickActionButton
            title="Analytics"
            icon="📊"
            href="/analytics"
          />
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Important Alerts</h2>
        <div className="space-y-4">
          {metrics.lowStockItems > 0 && (
            <Alert
              type="warning"
              message={`${metrics.lowStockItems} items are running low on stock`}
              action="/inventory"
            />
          )}
          {metrics.pendingOrders > 0 && (
            <Alert
              type="info"
              message={`${metrics.pendingOrders} orders pending processing`}
              action="/orders"
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

function QuickStatCard({ title, value, change, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change && (
            <p className={`text-sm ${
              change.startsWith('+') ? 'text-green-500' : 'text-red-500'
            }`}>
              {change} from last week
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function QuickActionButton({ title, icon, href }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </a>
  );
}

function Alert({ type, message, action }) {
  const bgColor = type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
  const textColor = type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
  const borderColor = type === 'warning' ? 'border-yellow-200' : 'border-blue-200';

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg border ${borderColor} flex justify-between items-center`}>
      <p>{message}</p>
      <a
        href={action}
        className="text-sm font-medium underline hover:no-underline"
      >
        View Details
      </a>
    </div>
  );
}
