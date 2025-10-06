import { useState, useEffect } from 'react';
import { Package, Search, MapPin, Clock, CheckCircle, ArrowLeft, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PublicTrackOrderProps {
  onBack: () => void;
}

export default function PublicTrackOrder({ onBack }: PublicTrackOrderProps) {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [delivery, setDelivery] = useState<any>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDelivery(null);
    setTrackingHistory([]);
    setLoading(true);

    try {
      const { data: deliveryData, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('tracking_number', trackingId.trim().toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!deliveryData) {
        setError('No delivery found with this tracking ID. Please check and try again.');
        setLoading(false);
        return;
      }

      let senderData = null;
      let riderData = null;
      let deliveryTypeData = null;

      if (deliveryData.customer_id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', deliveryData.customer_id)
          .maybeSingle();
        senderData = data;
      }

      if (deliveryData.rider_id) {
        const { data: riderInfo } = await supabase
          .from('riders')
          .select('user_id')
          .eq('id', deliveryData.rider_id)
          .maybeSingle();

        if (riderInfo?.user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', riderInfo.user_id)
            .maybeSingle();
          riderData = data;
        }
      }

      if (deliveryData.delivery_type_id) {
        const { data } = await supabase
          .from('delivery_types')
          .select('name, base_price')
          .eq('id', deliveryData.delivery_type_id)
          .maybeSingle();
        deliveryTypeData = data;
      }

      const { data: trackingData } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_id', deliveryData.id)
        .order('timestamp', { ascending: false });

      setDelivery({
        ...deliveryData,
        sender: senderData,
        rider: riderData,
        delivery_type: deliveryTypeData
      });
      setTrackingHistory(trackingData || []);
    } catch (err: any) {
      setError('Failed to fetch delivery information. Please try again.');
      console.error('Error tracking delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    if (!delivery) return;

    const channel = supabase
      .channel(`delivery-${delivery.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${delivery.id}`,
        },
        (payload) => {
          setDelivery((prev: any) => ({
            ...prev,
            ...payload.new,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `delivery_id=eq.${delivery.id}`,
        },
        (payload) => {
          setTrackingHistory((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [delivery?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-4 sm:p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </button>

        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
            <Package className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Track Your Order
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
          Enter your tracking ID to see your delivery status
        </p>

        <form onSubmit={handleTrack} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking ID"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              Track
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {delivery && !loading && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-200 flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-xs sm:text-sm text-green-800 font-medium">Live tracking enabled - Updates in real-time</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Delivery Details</h2>
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(delivery.status)} text-center`}>
                  {formatStatus(delivery.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Tracking Number</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base break-all">{delivery.tracking_number}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Created</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {new Date(delivery.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                Delivery Route
              </h3>

              <div className="space-y-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                  </div>
                  <div className="flex-1 pb-4 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Pickup Location</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{delivery.pickup_address}</p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Delivery Location</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{delivery.delivery_address || delivery.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {delivery.rider && (
              <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">Rider Information</h3>
                <p className="text-gray-700 text-sm sm:text-base mb-1">
                  <span className="font-semibold">Name:</span> {delivery.rider.full_name}
                </p>
                <p className="text-gray-700 text-sm sm:text-base">
                  <span className="font-semibold">Phone:</span> {delivery.rider.phone}
                </p>
              </div>
            )}

            {trackingHistory.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Real-Time Tracking Updates
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {trackingHistory.map((track) => (
                    <div key={track.id} className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 sm:mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-800 font-medium break-words">{track.status_update}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(track.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
