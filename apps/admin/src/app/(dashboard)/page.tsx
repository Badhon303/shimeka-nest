'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatBDT, formatDateTime } from '@/lib/utils';
import type { DashboardSummary, OrderView } from '@shimeka/shared';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Package,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesPoint {
  date: string;
  revenue: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderView[]>([]);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<DashboardSummary>('/admin/dashboard/summary'),
      api<OrderView[]>('/admin/dashboard/recent-orders'),
      api<SalesPoint[]>('/admin/dashboard/sales-series'),
    ])
      .then(([s, o, sales]) => {
        setSummary(s);
        setRecentOrders(o);
        setSalesData(sales);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  const stats = summary
    ? [
        { label: 'Orders Today', value: summary.ordersToday, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
        { label: 'Revenue (Month)', value: formatBDT(summary.revenueThisMonth), icon: DollarSign, color: 'text-green-600 bg-green-50' },
        { label: 'Pending Orders', value: summary.pendingOrders, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
        { label: 'Low Stock', value: summary.lowStockCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        { label: 'Total Products', value: summary.totalProducts, icon: Package, color: 'text-purple-600 bg-purple-50' },
        { label: 'Total Customers', value: summary.totalCustomers, icon: Users, color: 'text-brand-600 bg-brand-50' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-ink/50">{stat.label}</p>
              <p className="text-lg font-semibold text-ink">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      {salesData.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Sales (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val: number) => formatBDT(val)} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#d42a66"
                fill="#fce7ef"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Order #</th>
                <th className="th">Customer</th>
                <th className="th">Total</th>
                <th className="th">Payment</th>
                <th className="th">Delivery</th>
                <th className="th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="td font-medium">{order.orderNumber}</td>
                  <td className="td">{order.guestPhone ?? order.guestEmail ?? '—'}</td>
                  <td className="td">{formatBDT(order.total)}</td>
                  <td className="td">
                    <span className="badge bg-gray-100 text-gray-700">{order.paymentStatus}</span>
                  </td>
                  <td className="td">
                    <span className="badge bg-gray-100 text-gray-700">{order.deliveryStatus}</span>
                  </td>
                  <td className="td text-ink/60">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="td text-center text-ink/50">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
