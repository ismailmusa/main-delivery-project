import { useEffect, useState } from 'react';
import { supabase, Delivery, Rider } from '../../lib/supabase';
import { MapPin, Package, DollarSign, User, Phone } from 'lucide-react';

interface AvailableDeliveriesProps {
  rider: Rider;
  onAccept: () => void;
}

interface DeliveryWithCustomer extends Delivery {
  customer: {
    full_name: string;
    phone: string;
  };
}

export default function AvailableDeliveries({ rider, onAccept }: AvailableDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<DeliveryWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rider.is_available) {
      fetchAvailableDeliveries();
    }
  }, [rider.is_available]);

  const fetchAvailableDeliveries = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        customer:profiles!customer_id(full_name, phone)
      `)
      .eq('status', 'pending')
      .is('rider_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      setDeliveries(data as any);
    }
    setLoading(false);
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    await supabase
      .from('deliveries')
      .update({
        rider_id: rider.id,
        status: 'assigned'
      })
      .eq('id', deliveryId);

    await supabase.from('delivery_tracking').insert({
      delivery_id: deliveryId,
      rider_lat: rider.current_lat || 9.0820,
      rider_lng: rider.current_lng || 8.6753,
      status_update: 'Rider has been assigned to your delivery',
    });

    const { data: delivery } = await supabase
      .from('deliveries')
      .select('customer_id')
      .eq('id', deliveryId)
      .single();

    if (delivery) {
      await supabase.from('notifications').insert({
        user_id: delivery.customer_id,
        title: 'Rider Assigned',
        message: 'A rider has been assigned to your delivery and will pick up your package soon.',
        type: 'delivery',
      });
    }

    onAccept();
  };

  if (!rider.is_available) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">You're Offline</h3>
        <p className="text-gray-600">Toggle your availability to start seeing delivery requests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading available deliveries...</p>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Deliveries Available</h3>
        <p className="text-gray-600">Check back soon for new delivery requests in your area.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Available Deliveries</h2>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 hover:border-green-500 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">Tracking: {delivery.tracking_number}</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600">Pickup</p>
                      <p className="text-sm sm:text-base text-gray-800 break-words">{delivery.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600">Drop-off</p>
                      <p className="text-sm sm:text-base text-gray-800 break-words">{delivery.dropoff_address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-3 sm:text-right">
                <div className="bg-green-50 px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none">
                  <p className="text-xs text-gray-600">Fare</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    ₦{delivery.fare_estimate.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptDelivery(delivery.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Accept
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-blue-900">Customer Information</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 break-words">{delivery.customer.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <a href={`tel:${delivery.customer.phone}`} className="text-sm text-blue-600 hover:underline font-medium break-all">
                      {delivery.customer.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600">Package</p>
                    <p className="text-sm font-medium text-gray-800 break-words">{delivery.package_details}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Payment Method</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{delivery.payment_method}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
