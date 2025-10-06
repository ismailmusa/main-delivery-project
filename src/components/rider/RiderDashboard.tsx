import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Delivery, Rider } from '../../lib/supabase';
import { Truck, DollarSign, Package, Bell, LogOut, MapPin, CheckCircle, Clock, History } from 'lucide-react';
import RiderProfile from './RiderProfile';
import AvailableDeliveries from './AvailableDeliveries';
import ActiveDelivery from './ActiveDelivery';
import RiderDeliveryHistory from './RiderDeliveryHistory';
import Notifications from '../Notifications';

type View = 'available' | 'active' | 'profile' | 'history';

interface DeliveryWithCustomer extends Delivery {
  customer: {
    full_name: string;
    phone: string;
  };
}

export default function RiderDashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('available');
  const [rider, setRider] = useState<Rider | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryWithCustomer[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiderData();
  }, []);

  useEffect(() => {
    if (!rider?.id) return;

    console.log('Setting up real-time subscription for rider:', rider.id);

    const channel = supabase
      .channel('rider-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `rider_id=eq.${rider.id}`,
        },
        (payload) => {
          console.log('Delivery update received:', payload);

          if (payload.eventType === 'UPDATE') {
            const updatedDelivery = payload.new as any;

            // If delivery is completed, remove it from active list
            if (updatedDelivery.status === 'delivered') {
              setActiveDeliveries(prev => {
                const filtered = prev.filter(d => d.id !== updatedDelivery.id);
                // Switch to available view if no more active deliveries
                if (filtered.length === 0 && currentView === 'active') {
                  setCurrentView('available');
                }
                return filtered;
              });
            } else if (['assigned', 'picked_up', 'in_transit'].includes(updatedDelivery.status)) {
              // Update the delivery in the list
              setActiveDeliveries(prev =>
                prev.map(d => d.id === updatedDelivery.id ? { ...d, ...updatedDelivery } : d)
              );
            }
          } else if (payload.eventType === 'INSERT') {
            // New delivery assigned, refetch to get customer data
            fetchActiveDelivery(rider.id);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from delivery updates');
      supabase.removeChannel(channel);
    };
  }, [rider?.id, currentView]);

  const fetchRiderData = async () => {
    console.log('Fetching rider data for user:', profile?.id);

    // Check all riders first
    const { data: allRiders } = await supabase
      .from('riders')
      .select('id, user_id, approval_status, is_available');
    console.log('All riders in database:', allRiders);

    const { data: riderData, error } = await supabase
      .from('riders')
      .select('*')
      .eq('user_id', profile?.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching rider data:', error);
    }

    if (riderData) {
      console.log('Rider data found:', riderData);
      console.log('Rider ID is:', riderData.id);
      setRider(riderData);
      await fetchActiveDelivery(riderData.id);
      fetchEarnings(riderData.user_id);
    } else {
      console.log('No rider data found for this user');
    }
    setLoading(false);
  };

  const fetchActiveDelivery = async (riderId: string) => {
    console.log('Fetching active deliveries for rider_id:', riderId);

    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        customer:profiles!customer_id(full_name, phone)
      `)
      .eq('rider_id', riderId)
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching active deliveries:', error);
      setActiveDeliveries([]);
      return;
    }

    console.log('Active deliveries data:', data);
    setActiveDeliveries((data || []) as DeliveryWithCustomer[]);

    if (data && data.length > 0 && currentView !== 'active') {
      console.log('Auto-switching to active delivery view');
      setCurrentView('active');
    } else if ((!data || data.length === 0) && currentView === 'active') {
      console.log('No active deliveries, switching to available view');
      setCurrentView('available');
    }
  };

  const fetchEarnings = async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data: todayData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', today.toISOString());

    const { data: weekData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', weekAgo.toISOString());

    const { data: monthData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', monthAgo.toISOString());

    setEarnings({
      today: todayData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      week: weekData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      month: monthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    });
  };

  const toggleAvailability = async () => {
    if (!rider) return;

    const newStatus = !rider.is_available;
    await supabase
      .from('riders')
      .update({ is_available: newStatus })
      .eq('id', rider.id);

    setRider({ ...rider, is_available: newStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!rider) {
    return <RiderProfile onProfileCreated={fetchRiderData} />;
  }

  if (rider.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h2>
          <p className="text-gray-600 mb-6">
            Your rider application is currently being reviewed by our admin team. You'll be notified once approved.
          </p>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (rider.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Rejected</h2>
          <p className="text-gray-600 mb-6">
            Unfortunately, your rider application was not approved. Please contact support for more information.
          </p>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Rider Dashboard</h1>
                <p className="text-sm text-gray-600">{profile?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {profile && <Notifications userId={profile.id} />}
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  rider.is_available
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {rider.is_available ? 'Available' : 'Offline'}
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-green-600">₦{earnings.today.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600">₦{earnings.week.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-purple-600">{rider.total_deliveries}</p>
              </div>
              <Package className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentView('available')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'available'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Available Jobs
          </button>
          <button
            onClick={() => {
              setCurrentView('active');
              if (rider) fetchActiveDelivery(rider.id);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'active'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-5 h-5" />
            Active Deliveries
            {activeDeliveries.length > 0 && (
              <span className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${
                currentView === 'active'
                  ? 'bg-white text-green-600'
                  : 'bg-green-600 text-white'
              }`}>
                {activeDeliveries.length}
              </span>
            )}
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
            History
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'profile'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-5 h-5" />
            My Profile
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentView === 'available' && rider && (
            <AvailableDeliveries rider={rider} onAccept={() => fetchActiveDelivery(rider.id)} />
          )}
          {currentView === 'active' && rider && (
            <ActiveDelivery
              deliveries={activeDeliveries}
              riderId={rider.id}
              onComplete={() => {
                fetchActiveDelivery(rider.id);
                fetchEarnings(rider.user_id);
              }}
            />
          )}
          {currentView === 'history' && rider && (
            <RiderDeliveryHistory riderId={rider.id} />
          )}
          {currentView === 'profile' && rider && (
            <RiderProfile isEdit rider={rider} onProfileCreated={fetchRiderData} />
          )}
        </div>
      </div>
    </div>
  );
}
