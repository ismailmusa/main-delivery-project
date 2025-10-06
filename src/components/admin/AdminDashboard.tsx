import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, Truck, Package, LogOut, DollarSign, History } from 'lucide-react';
import ManageUsers from './ManageUsers';
import ManageRiders from './ManageRiders';
import ManageDeliveries from './ManageDeliveries';
import Analytics from './Analytics';
import DeliveredOrdersHistory from './DeliveredOrdersHistory';
import Notifications from '../Notifications';

type View = 'analytics' | 'users' | 'riders' | 'deliveries' | 'history';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('analytics');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRiders: 0,
    activeDeliveries: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersData, ridersData, deliveriesData, revenueData] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('riders').select('*', { count: 'exact', head: true }),
      supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['pending', 'assigned', 'picked_up', 'in_transit']),
      supabase.from('transactions').select('amount').eq('type', 'debit').eq('status', 'completed'),
    ]);

    setStats({
      totalUsers: usersData.count || 0,
      totalRiders: ridersData.count || 0,
      activeDeliveries: deliveriesData.count || 0,
      totalRevenue: revenueData.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Danhausa Logistics</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {profile && <Notifications userId={profile.id} />}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Riders</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalRiders}</p>
              </div>
              <Truck className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeDeliveries}</p>
              </div>
              <Package className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-orange-600">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'analytics'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'users'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Manage Users
          </button>
          <button
            onClick={() => setCurrentView('riders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'riders'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-5 h-5" />
            Manage Riders
          </button>
          <button
            onClick={() => setCurrentView('deliveries')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'deliveries'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Manage Deliveries
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'history'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5" />
            Delivered Orders
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'users' && <ManageUsers />}
          {currentView === 'riders' && <ManageRiders />}
          {currentView === 'deliveries' && <ManageDeliveries />}
          {currentView === 'history' && <DeliveredOrdersHistory />}
        </div>
      </div>
    </div>
  );
}
