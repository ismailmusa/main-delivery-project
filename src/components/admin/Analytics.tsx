import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Package, DollarSign, Users } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    weekDeliveries: 0,
    monthDeliveries: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    topCustomers: [] as any[],
    recentDeliveries: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [todayDel, weekDel, monthDel, todayRev, weekRev, monthRev, topCust, recent] = await Promise.all([
      supabase.from('deliveries').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('deliveries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('deliveries').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'debit').gte('created_at', today.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'debit').gte('created_at', weekAgo.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'debit').gte('created_at', monthAgo.toISOString()),
      supabase.from('deliveries').select('customer_id, customer:profiles(full_name)').eq('status', 'delivered').limit(10),
      supabase.from('deliveries').select('*, customer:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
    ]);

    const customerCounts = (topCust.data || []).reduce((acc: any, d: any) => {
      const id = d.customer_id;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const topCustomersData = Object.entries(customerCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const delivery = topCust.data?.find((d: any) => d.customer_id === id);
        return {
          name: delivery?.customer?.full_name || 'Unknown',
          deliveries: count,
        };
      });

    setStats({
      todayDeliveries: todayDel.count || 0,
      weekDeliveries: weekDel.count || 0,
      monthDeliveries: monthDel.count || 0,
      todayRevenue: todayRev.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      weekRevenue: weekRev.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      monthRevenue: monthRev.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      topCustomers: topCustomersData,
      recentDeliveries: recent.data || [],
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h2>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Deliveries</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-2xl font-bold text-blue-600">{stats.todayDeliveries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-xl font-semibold text-gray-700">{stats.weekDeliveries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-xl font-semibold text-gray-700">{stats.monthDeliveries}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-800">Revenue</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-2xl font-bold text-green-600">₦{stats.todayRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-xl font-semibold text-gray-700">₦{stats.weekRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-xl font-semibold text-gray-700">₦{stats.monthRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. per Day</span>
              <span className="text-xl font-bold text-purple-600">
                {Math.round(stats.weekDeliveries / 7)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Revenue</span>
              <span className="text-lg font-semibold text-gray-700">
                ₦{Math.round(stats.weekRevenue / 7).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Top Customers
          </h3>
          <div className="space-y-3">
            {stats.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800">{customer.name}</span>
                </div>
                <span className="text-sm text-gray-600">{customer.deliveries} deliveries</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Recent Deliveries
          </h3>
          <div className="space-y-3">
            {stats.recentDeliveries.map((delivery: any) => (
              <div key={delivery.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{delivery.tracking_number}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(delivery.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{delivery.customer.full_name}</span>
                  <span className="text-sm font-semibold text-green-600">
                    ₦{delivery.fare_estimate.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
