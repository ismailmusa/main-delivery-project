import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Delivery } from '../../lib/supabase';
import { MapPin, Clock, CheckCircle, Truck, Package, User, Phone } from 'lucide-react';

interface TrackDeliveryProps {
  activeDelivery: Delivery | null;
}

interface DeliveryWithRider extends Delivery {
  rider: {
    profile: {
      full_name: string;
      phone: string;
    };
  } | null;
}

export default function TrackDelivery({ activeDelivery }: TrackDeliveryProps) {
  const { profile } = useAuth();
  const [tracking, setTracking] = useState<any[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<DeliveryWithRider[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithRider | null>(activeDelivery as DeliveryWithRider);

  useEffect(() => {
    fetchAllDeliveries();
  }, []);

  useEffect(() => {
    if (selectedDelivery) {
      fetchTracking();
      const subscription = supabase
        .channel('delivery-tracking')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `delivery_id=eq.${selectedDelivery.id}`,
        }, () => {
          fetchTracking();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedDelivery]);

  const fetchAllDeliveries = async () => {
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
      setAllDeliveries(data as any);
      if (!selectedDelivery && data.length > 0) {
        setSelectedDelivery(data[0] as any);
      }
    }
  };

  const fetchTracking = async () => {
    if (!selectedDelivery) return;

    const { data } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('delivery_id', selectedDelivery.id)
      .order('timestamp', { ascending: false });

    if (data) {
      setTracking(data);
    }
  };

  if (allDeliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Deliveries</h3>
        <p className="text-gray-600">You don't have any deliveries to track yet.</p>
      </div>
    );
  }

  if (!selectedDelivery) return null;

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'assigned', label: 'Rider Assigned', icon: Truck },
    { key: 'picked_up', label: 'Package Picked Up', icon: CheckCircle },
    { key: 'in_transit', label: 'In Transit', icon: MapPin },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === selectedDelivery.status);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Track Your Delivery</h2>

      {allDeliveries.length > 1 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Delivery</label>
          <div className="grid gap-3">
            {allDeliveries.map((delivery) => (
              <button
                key={delivery.id}
                onClick={() => setSelectedDelivery(delivery)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedDelivery?.id === delivery.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{delivery.tracking_number}</p>
                    <p className="text-sm text-gray-600">{delivery.package_details}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Tracking Number</p>
            <p className="text-2xl font-bold text-green-700">{selectedDelivery.tracking_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold text-gray-800 capitalize">
              {selectedDelivery.status.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">From</p>
            <p className="font-medium text-gray-800">{selectedDelivery.pickup_address}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">To</p>
            <p className="font-medium text-gray-800">{selectedDelivery.dropoff_address}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Progress</h3>
        <div className="relative">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return (
              <div key={step.key} className="flex items-start mb-6 last:mb-0">
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-8 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p
                    className={`font-semibold ${
                      isCompleted ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-green-600 mt-1">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tracking.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Updates</h3>
          <div className="space-y-3">
            {tracking.map((update) => (
              <div
                key={update.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{update.status_update}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {selectedDelivery.rider && (selectedDelivery.status === 'assigned' || selectedDelivery.status === 'picked_up' || selectedDelivery.status === 'in_transit') && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Your Rider</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Name:</span>
                <span className="text-sm font-semibold text-gray-900">{selectedDelivery.rider.profile.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Contact:</span>
                <a
                  href={`tel:${selectedDelivery.rider.profile.phone}`}
                  className="text-sm font-semibold text-green-600 hover:underline"
                >
                  {selectedDelivery.rider.profile.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Package:</span> {selectedDelivery.package_details}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-semibold">Recipient:</span> {selectedDelivery.recipient_name} ({selectedDelivery.recipient_phone})
          </p>
        </div>
      </div>
    </div>
  );
}
