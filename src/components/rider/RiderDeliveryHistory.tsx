import { useEffect, useState } from 'react';
import { supabase, Delivery } from '../../lib/supabase';
import { Package, MapPin, Calendar, DollarSign, User, Phone, Trash2 } from 'lucide-react';

interface DeliveryWithDetails extends Delivery {
  customer: { full_name: string; email: string; phone: string };
}

interface RiderDeliveryHistoryProps {
  riderId: string;
}

export default function RiderDeliveryHistory({ riderId }: RiderDeliveryHistoryProps) {
  const [deliveries, setDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingDelivery, setDeletingDelivery] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveredOrders();

    const channel = supabase
      .channel('rider-delivered-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `rider_id=eq.${riderId}`,
        },
        () => {
          fetchDeliveredOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId]);

  const fetchDeliveredOrders = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        customer:profiles!customer_id(full_name, email, phone)
      `)
      .eq('rider_id', riderId)
      .eq('status', 'delivered')
      .order('completed_at', { ascending: false });

    if (data) {
      setDeliveries(data as any);
    }
    setLoading(false);
  };

  const deleteDelivery = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to permanently delete this delivery record?')) {
      return;
    }

    setDeletingDelivery(deliveryId);

    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);

      if (error) throw error;

      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Failed to delete delivery. Please try again.');
    } finally {
      setDeletingDelivery(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading delivery history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Delivery History</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{deliveries.length} completed deliveries</p>
      </div>

      {deliveries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No delivered orders yet</h3>
          <p className="text-sm sm:text-base text-gray-600">Your completed deliveries will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 hover:border-green-500 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold inline-block self-start">
                      DELIVERED
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 break-all">
                      {delivery.tracking_number}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 flex-shrink-0" />
                      Customer
                    </p>
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {delivery.customer.full_name}
                    </p>
                    <p className="text-xs text-gray-600 break-all">{delivery.customer.phone}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Pickup</p>
                        <p className="text-sm text-gray-800 break-words">{delivery.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Drop-off</p>
                        <p className="text-sm text-gray-800 break-words">{delivery.dropoff_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-3 sm:text-right">
                  <div className="bg-green-50 px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none">
                    <p className="text-xs text-gray-600">Your Earning</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      ₦{(delivery.fare_estimate * 0.8).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50 px-3 py-2 rounded-lg flex-1 sm:flex-none">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Completed</span>
                    </div>
                    <p className="font-medium text-gray-800 break-words">
                      {formatDate(delivery.completed_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm flex-1">
                  <div>
                    <p className="text-xs text-gray-600">Package</p>
                    <p className="font-medium text-gray-800 break-words">{delivery.package_details}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Fare</p>
                    <p className="font-medium text-gray-800">₦{delivery.fare_estimate.toLocaleString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => deleteDelivery(delivery.id)}
                  disabled={deletingDelivery === delivery.id}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  {deletingDelivery === delivery.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
