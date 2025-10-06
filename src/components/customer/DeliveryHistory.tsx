import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Delivery } from '../../lib/supabase';
import { Package, MapPin, Calendar, DollarSign, Truck, User, Phone } from 'lucide-react';

interface DeliveryWithRider extends Delivery {
  rider: {
    profile: {
      full_name: string;
      phone: string;
    };
  } | null;
}

export default function DeliveryHistory() {
  const { profile } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryWithRider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();

    const channel = supabase
      .channel('delivery-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `customer_id=eq.${profile?.id}`,
        },
        (payload) => {
          console.log('Delivery history change:', payload);
          if (payload.eventType === 'DELETE') {
            setDeliveries(prev => prev.filter(d => d.id !== payload.old.id));
          } else {
            fetchDeliveries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        rider:riders(
          profile:profiles(full_name, phone)
        )
      `)
      .eq('customer_id', profile?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDeliveries(data as any);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading your deliveries...</p>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Deliveries Yet</h3>
        <p className="text-gray-600">Your delivery history will appear here once you book your first delivery.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Delivery History</h2>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-semibold text-gray-800">{delivery.tracking_number}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 md:mt-0 ${getStatusColor(
                  delivery.status
                )}`}
              >
                {delivery.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="text-gray-800">{delivery.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="text-gray-800">{delivery.dropoff_address}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-4">
              {delivery.rider && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-900">Rider Information</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">{delivery.rider.profile.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-600" />
                      <a href={`tel:${delivery.rider.profile.phone}`} className="text-sm text-green-600 hover:underline font-medium">
                        {delivery.rider.profile.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Package</p>
                    <p className="text-sm font-medium text-gray-800">{delivery.package_details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Fare</p>
                    <p className="text-sm font-medium text-gray-800">
                      ₦{delivery.fare_estimate.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Payment</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {delivery.payment_method}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
