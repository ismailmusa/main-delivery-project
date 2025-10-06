import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Delivery } from '../../lib/supabase';
import { Package, MapPin, Clock, Bell, User, LogOut, Plus, History } from 'lucide-react';
import BookDelivery from './BookDelivery';
import TrackDelivery from './TrackDelivery';
import DeliveryHistory from './DeliveryHistory';
import Notifications from '../Notifications';

type View = 'book' | 'track' | 'history';

export default function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('book');
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchActiveDelivery();

    const channel = supabase
      .channel('customer-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `customer_id=eq.${profile?.id}`,
        },
        (payload) => {
          console.log('Delivery change detected:', payload);
          if (payload.eventType === 'DELETE') {
            setActiveDelivery(null);
          } else {
            fetchActiveDelivery();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchActiveDelivery = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('customer_id', profile?.id)
      .in('status', ['pending', 'assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveDelivery(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Danhausa Logistics</h1>
              <p className="text-sm text-gray-600">Welcome, {profile?.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && <Notifications userId={profile.id} />}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {activeDelivery && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Delivery</p>
                <p className="font-semibold">Tracking: {activeDelivery.tracking_number}</p>
                <p className="text-sm opacity-90 mt-1">Status: {activeDelivery.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              <button
                onClick={() => setCurrentView('track')}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Track Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentView('book')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'book'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            Book Delivery
          </button>
          <button
            onClick={() => setCurrentView('track')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              currentView === 'track'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-5 h-5" />
            Track Delivery
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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentView === 'book' && <BookDelivery onSuccess={fetchActiveDelivery} />}
          {currentView === 'track' && <TrackDelivery activeDelivery={activeDelivery} />}
          {currentView === 'history' && <DeliveryHistory />}
        </div>
      </div>
    </div>
  );
}
