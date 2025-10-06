import { useState } from 'react';
import { supabase, Delivery } from '../../lib/supabase';
import { MapPin, CheckCircle, Package, Phone, User } from 'lucide-react';

interface DeliveryWithCustomer extends Delivery {
  customer: {
    full_name: string;
    phone: string;
  };
}

interface ActiveDeliveryProps {
  deliveries: DeliveryWithCustomer[];
  riderId: string;
  onComplete: () => void;
}

function DeliveryCard({ delivery, riderId, onComplete }: { delivery: DeliveryWithCustomer; riderId: string; onComplete: () => void }) {
  const [updating, setUpdating] = useState(false);

  const updateDeliveryStatus = async (newStatus: string, message: string) => {
    setUpdating(true);

    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'delivered') {
        updates.completed_at = new Date().toISOString();
        updates.final_fare = delivery.fare_estimate;
        updates.payment_status = 'completed';

        const riderEarning = delivery.fare_estimate * 0.8;

        const { error: customerTransactionError } = await supabase.from('transactions').insert({
          user_id: delivery.customer_id,
          delivery_id: delivery.id,
          type: 'debit',
          amount: delivery.fare_estimate,
          description: `Payment for delivery ${delivery.tracking_number}`,
          status: 'completed',
        });

        if (customerTransactionError) {
          console.error('Error creating customer transaction:', customerTransactionError);
        }

        const { data: riderData, error: riderFetchError } = await supabase
          .from('riders')
          .select('user_id')
          .eq('id', riderId)
          .single();

        if (riderFetchError) {
          console.error('Error fetching rider data:', riderFetchError);
        }

        if (riderData) {
          const { error: riderTransactionError } = await supabase.from('transactions').insert({
            user_id: riderData.user_id,
            delivery_id: delivery.id,
            type: 'credit',
            amount: riderEarning,
            description: `Earning from delivery ${delivery.tracking_number}`,
            status: 'completed',
          });

          if (riderTransactionError) {
            console.error('Error creating rider transaction:', riderTransactionError);
          }
        }

        const { data: currentRider } = await supabase
          .from('riders')
          .select('total_deliveries')
          .eq('id', riderId)
          .single();

        if (currentRider) {
          const { error: updateRiderError } = await supabase
            .from('riders')
            .update({ total_deliveries: (currentRider.total_deliveries || 0) + 1 })
            .eq('id', riderId);

          if (updateRiderError) {
            console.error('Error updating rider total deliveries:', updateRiderError);
          }
        }
      }

      console.log('Updating delivery with:', updates);

      const { data: updateData, error: updateError } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', delivery.id)
        .select();

      if (updateError) {
        console.error('Error updating delivery:', updateError);
        alert(`Failed to update delivery: ${updateError.message}`);
        return;
      }

      console.log('Delivery updated successfully:', updateData);

      const { error: trackingError } = await supabase.from('delivery_tracking').insert({
        delivery_id: delivery.id,
        rider_lat: 9.0820,
        rider_lng: 8.6753,
        status_update: message,
      });

      if (trackingError) {
        console.error('Error inserting tracking:', trackingError);
      }

      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: delivery.customer_id,
        title: 'Delivery Update',
        message: message,
        type: 'delivery',
      });

      if (notifError) {
        console.error('Error inserting notification:', notifError);
      }

      alert(`Delivery status updated to: ${newStatus}`);
      onComplete();
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getNextAction = () => {
    switch (delivery.status) {
      case 'assigned':
        return {
          label: 'Picked Up Package',
          status: 'picked_up',
          message: 'Your package has been picked up and is on the way',
        };
      case 'picked_up':
        return {
          label: 'Start Transit',
          status: 'in_transit',
          message: 'Your package is now in transit to the destination',
        };
      case 'in_transit':
        return {
          label: 'Mark as Delivered',
          status: 'delivered',
          message: 'Your package has been successfully delivered',
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Tracking Number</p>
            <p className="text-lg sm:text-2xl font-bold text-green-700 break-all">{delivery.tracking_number}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs sm:text-sm text-gray-600">Fare</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800">₦{delivery.fare_estimate.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Current Status</p>
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              {delivery.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            Pickup Location
          </h3>
          <p className="text-sm sm:text-base text-gray-800 mb-3 sm:mb-4 break-words">{delivery.pickup_address}</p>

          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-900 mb-2">Customer Information</p>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-600">Name: </span>
                <span className="text-xs sm:text-sm font-medium text-gray-800 break-words">{delivery.customer.full_name}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-600">Phone: </span>
                <a href={`tel:${delivery.customer.phone}`} className="text-xs sm:text-sm font-medium text-green-600 hover:underline break-all">
                  {delivery.customer.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            Drop-off Location
          </h3>
          <p className="text-sm sm:text-base text-gray-800 mb-3 sm:mb-4 break-words">{delivery.dropoff_address}</p>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-600">Recipient: </span>
                <span className="text-xs sm:text-sm font-medium text-gray-800 break-words">{delivery.recipient_name}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-600">Phone: </span>
                <a href={`tel:${delivery.recipient_phone}`} className="text-xs sm:text-sm font-medium text-green-600 hover:underline break-all">
                  {delivery.recipient_phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            Package Details
          </h3>
          <p className="text-sm sm:text-base text-gray-800 mb-1 break-words">{delivery.package_details}</p>
          <p className="text-xs sm:text-sm text-gray-600">Weight: {delivery.package_weight}</p>
          {delivery.notes && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700">Special Instructions:</p>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{delivery.notes}</p>
            </div>
          )}
        </div>
      </div>

      {nextAction && (
        <button
          onClick={() => updateDeliveryStatus(nextAction.status, nextAction.message)}
          disabled={updating}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {updating ? 'Updating...' : nextAction.label}
        </button>
      )}
    </div>
  );
}

export default function ActiveDelivery({ deliveries, riderId, onComplete }: ActiveDeliveryProps) {
  console.log('ActiveDelivery component rendered with:', {
    deliveriesCount: deliveries?.length || 0,
    deliveries,
    riderId
  });

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Active Deliveries</h3>
        <p className="text-sm sm:text-base text-gray-600">Accept deliveries from the available jobs to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Active Deliveries</h2>
        <div className="bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-sm sm:text-base text-center">
          {deliveries.length} {deliveries.length === 1 ? 'Delivery' : 'Deliveries'}
        </div>
      </div>

      {deliveries.map((delivery) => (
        <DeliveryCard
          key={delivery.id}
          delivery={delivery}
          riderId={riderId}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
