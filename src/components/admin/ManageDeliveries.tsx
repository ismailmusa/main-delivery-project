import { useEffect, useState } from 'react';
import { supabase, Delivery, Rider } from '../../lib/supabase';
import { Package, MapPin, User, Truck, UserCheck, Trash2, RefreshCw } from 'lucide-react';

interface DeliveryWithDetails extends Delivery {
  customer: { full_name: string; email: string };
  rider: { profile: { full_name: string } } | null;
}

interface RiderOption {
  id: string;
  user_id: string;
  profile: { full_name: string };
  vehicle_type: string;
  is_available: boolean;
}

export default function ManageDeliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [availableRiders, setAvailableRiders] = useState<RiderOption[]>([]);
  const [assigningDelivery, setAssigningDelivery] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [reassigningDelivery, setReassigningDelivery] = useState<string | null>(null);
  const [deletingDelivery, setDeletingDelivery] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveries();
    fetchAvailableRiders();

    const channel = supabase
      .channel('admin-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
        },
        () => {
          fetchDeliveries();
          fetchAvailableRiders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchDeliveries = async () => {
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        customer:profiles!customer_id(full_name, email),
        rider:riders(profile:profiles(full_name))
      `)
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['assigned', 'picked_up', 'in_transit']);
    } else if (filter === 'pending') {
      query = query.eq('status', 'pending');
    } else {
      query = query.not('status', 'eq', 'delivered');
    }

    const { data } = await query;
    if (data) {
      setDeliveries(data as any);
    }
    setLoading(false);
  };

  const fetchAvailableRiders = async () => {
    const { data, error } = await supabase
      .from('riders')
      .select(`
        id,
        user_id,
        vehicle_type,
        is_available,
        profile:profiles(full_name)
      `)
      .eq('approval_status', 'approved');

    if (error) {
      console.error('Error fetching riders:', error);
    }

    if (data) {
      console.log('Available riders:', data);
      setAvailableRiders(data as any);
    }
  };

  const assignRiderToDelivery = async (deliveryId: string, riderId: string) => {
    const { error } = await supabase
      .from('deliveries')
      .update({
        rider_id: riderId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (!error) {
      const delivery = deliveries.find(d => d.id === deliveryId);
      const rider = availableRiders.find(r => r.id === riderId);

      if (delivery && rider) {
        await supabase.from('notifications').insert({
          user_id: rider.user_id,
          title: 'New Delivery Assigned',
          message: `You have been assigned delivery ${delivery.tracking_number}`,
          type: 'delivery',
        });
      }

      setAssigningDelivery(null);
      setSelectedRider('');
      fetchDeliveries();
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    await supabase
      .from('deliveries')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', deliveryId);

    fetchDeliveries();
  };

  const deleteDelivery = async (deliveryId: string) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this delivery? This action cannot be undone.');

    if (!confirmed) return;

    const { error: trackingError } = await supabase
      .from('delivery_tracking')
      .delete()
      .eq('delivery_id', deliveryId);

    if (trackingError) {
      console.error('Error deleting tracking:', trackingError);
      alert('Failed to delete delivery tracking: ' + trackingError.message);
      return;
    }

    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', deliveryId);

    if (error) {
      console.error('Error deleting delivery:', error);
      alert('Failed to delete delivery: ' + error.message + '\n\nPlease run FIX_DELETE_POLICY.sql in your Supabase dashboard.');
      return;
    }

    setDeletingDelivery(null);
    fetchDeliveries();
    alert('Delivery deleted successfully!');
  };

  const reassignRider = async (deliveryId: string, newRiderId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    const newRider = availableRiders.find(r => r.id === newRiderId);

    const { error } = await supabase
      .from('deliveries')
      .update({
        rider_id: newRiderId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (!error) {
      if (delivery && newRider) {
        await supabase.from('notifications').insert({
          user_id: newRider.user_id,
          title: 'New Delivery Assigned',
          message: `You have been reassigned delivery ${delivery.tracking_number}`,
          type: 'delivery',
        });

        await supabase.from('delivery_tracking').insert({
          delivery_id: deliveryId,
          rider_lat: 0,
          rider_lng: 0,
          status_update: 'Delivery has been reassigned to a new rider',
        });
      }

      setReassigningDelivery(null);
      setSelectedRider('');
      fetchDeliveries();
    }
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
        <p className="text-gray-600 mt-4">Loading deliveries...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Deliveries</h2>

        <div className="flex gap-2">
          {['all', 'pending', 'active'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-semibold text-gray-800">{delivery.tracking_number}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Pickup</p>
                      <p className="text-sm text-gray-800">{delivery.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Drop-off</p>
                      <p className="text-sm text-gray-800">{delivery.dropoff_address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                  {delivery.status.replace('_', ' ').toUpperCase()}
                </span>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ₦{delivery.fare_estimate.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="text-sm font-medium text-gray-800">{delivery.customer.full_name}</p>
                </div>
              </div>

              {delivery.rider && (
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Rider</p>
                    <p className="text-sm font-medium text-gray-800">{delivery.rider.profile.full_name}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600">Created</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(delivery.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Package:</span> {delivery.package_details} ({delivery.package_weight})
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Recipient:</span> {delivery.recipient_name} - {delivery.recipient_phone}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Payment:</span> {delivery.payment_method.toUpperCase()} - {delivery.payment_status.toUpperCase()}
              </p>
            </div>

            {delivery.status === 'pending' && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                {assigningDelivery === delivery.id ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select Rider</label>
                    <select
                      value={selectedRider}
                      onChange={(e) => setSelectedRider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Choose a rider...</option>
                      {availableRiders.length === 0 ? (
                        <option disabled>No approved riders available</option>
                      ) : (
                        availableRiders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            {rider.profile.full_name} - {rider.vehicle_type.toUpperCase()} {rider.is_available ? '(Online)' : '(Offline)'}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectedRider && assignRiderToDelivery(delivery.id, selectedRider)}
                        disabled={!selectedRider}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Confirm Assignment
                      </button>
                      <button
                        onClick={() => {
                          setAssigningDelivery(null);
                          setSelectedRider('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningDelivery(delivery.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    <UserCheck className="w-5 h-5" />
                    Assign Rider
                  </button>
                )}
              </div>
            )}

            {(delivery.status === 'assigned' || delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                {reassigningDelivery === delivery.id ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Reassign to New Rider</label>
                    <select
                      value={selectedRider}
                      onChange={(e) => setSelectedRider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Choose a rider...</option>
                      {availableRiders.filter(r => r.id !== delivery.rider_id).map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.profile.full_name} - {rider.vehicle_type.toUpperCase()} {rider.is_available ? '(Online)' : '(Offline)'}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectedRider && reassignRider(delivery.id, selectedRider)}
                        disabled={!selectedRider}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Confirm Reassignment
                      </button>
                      <button
                        onClick={() => {
                          setReassigningDelivery(null);
                          setSelectedRider('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => setReassigningDelivery(delivery.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reassign Rider
                      </button>
                    )}
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'cancelled')}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium"
                      >
                        Cancel Delivery
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 border-t border-gray-200 pt-3">
              <button
                onClick={() => deleteDelivery(delivery.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Delivery Permanently
              </button>
            </div>
          </div>
        ))}
      </div>

      {deliveries.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No deliveries found</p>
        </div>
      )}
    </div>
  );
}
