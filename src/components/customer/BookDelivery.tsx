import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapPin, Package, User, Phone, Weight, CreditCard, Zap, Clock, Calendar } from 'lucide-react';

interface DeliveryType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_hours: number;
  icon: string;
  is_active: boolean;
}

interface BookDeliveryProps {
  onSuccess: () => void;
}

export default function BookDelivery({ onSuccess }: BookDeliveryProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);

  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupLat: 9.0820,
    pickupLng: 8.6753,
    dropoffAddress: '',
    dropoffLat: 9.0579,
    dropoffLng: 7.4951,
    packageDetails: '',
    packageWeight: 'light',
    recipientName: '',
    recipientPhone: '',
    paymentMethod: 'cash',
    notes: '',
    deliveryTypeId: '',
  });

  useEffect(() => {
    fetchDeliveryTypes();
  }, []);

  const fetchDeliveryTypes = async () => {
    const { data } = await supabase
      .from('delivery_types')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (data && data.length > 0) {
      setDeliveryTypes(data);
      setFormData(prev => ({ ...prev, deliveryTypeId: data[0].id }));
    }
  };

  const calculateFare = () => {
    const distance = Math.sqrt(
      Math.pow(formData.dropoffLat - formData.pickupLat, 2) +
      Math.pow(formData.dropoffLng - formData.pickupLng, 2)
    ) * 111;

    const selectedType = deliveryTypes.find(t => t.id === formData.deliveryTypeId);
    const baseFare = selectedType ? Number(selectedType.base_price) : 500;
    const distanceFare = distance * 100;
    let weightMultiplier = 1;

    if (formData.packageWeight === 'medium') weightMultiplier = 1.3;
    if (formData.packageWeight === 'heavy') weightMultiplier = 1.6;

    return Math.round((baseFare + distanceFare) * weightMultiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const fare = calculateFare();

      const { data, error: insertError } = await supabase
        .from('deliveries')
        .insert({
          customer_id: profile?.id,
          pickup_address: formData.pickupAddress,
          pickup_lat: formData.pickupLat,
          pickup_lng: formData.pickupLng,
          dropoff_address: formData.dropoffAddress,
          dropoff_lat: formData.dropoffLat,
          dropoff_lng: formData.dropoffLng,
          package_details: formData.packageDetails,
          package_weight: formData.packageWeight,
          recipient_name: formData.recipientName,
          recipient_phone: formData.recipientPhone,
          fare_estimate: fare,
          payment_method: formData.paymentMethod,
          notes: formData.notes,
          tracking_number: '',
          delivery_type_id: formData.deliveryTypeId || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.from('notifications').insert({
        user_id: profile?.id,
        title: 'Delivery Booked',
        message: `Your delivery has been booked. Tracking number: ${data.tracking_number}`,
        type: 'delivery',
      });

      setSuccess(`Delivery booked successfully! Tracking: ${data.tracking_number}`);
      setFormData({
        pickupAddress: '',
        pickupLat: 9.0820,
        pickupLng: 8.6753,
        dropoffAddress: '',
        dropoffLat: 9.0579,
        dropoffLng: 7.4951,
        packageDetails: '',
        packageWeight: 'light',
        recipientName: '',
        recipientPhone: '',
        paymentMethod: 'cash',
        notes: '',
        deliveryTypeId: deliveryTypes[0]?.id || '',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to book delivery');
    } finally {
      setLoading(false);
    }
  };

  const estimatedFare = calculateFare();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a New Delivery</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Pickup Address
            </label>
            <input
              type="text"
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="123 Main Street, Abuja"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Drop-off Address
            </label>
            <input
              type="text"
              value={formData.dropoffAddress}
              onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="456 Market Road, Lagos"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 text-green-600" />
              Package Details
            </label>
            <input
              type="text"
              value={formData.packageDetails}
              onChange={(e) => setFormData({ ...formData, packageDetails: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Documents, Electronics, etc."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Weight className="w-4 h-4 text-green-600" />
              Package Weight
            </label>
            <select
              value={formData.packageWeight}
              onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="light">Light (0-5kg)</option>
              <option value="medium">Medium (5-15kg)</option>
              <option value="heavy">Heavy (15kg+)</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-green-600" />
              Recipient Name
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-green-600" />
              Recipient Phone
            </label>
            <input
              type="tel"
              value={formData.recipientPhone}
              onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+234 800 000 0000"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Delivery Type
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {deliveryTypes.map((type) => {
              const IconComponent = type.icon === 'zap' ? Zap : type.icon === 'clock' ? Clock : type.icon === 'calendar' ? Calendar : Package;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryTypeId: type.id })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.deliveryTypeId === type.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      formData.deliveryTypeId === type.id ? 'bg-green-600' : 'bg-gray-200'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        formData.deliveryTypeId === type.id ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{type.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                      <p className="text-sm font-bold text-green-600 mt-2">+₦{Number(type.base_price).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-4">
            {['cash', 'card', 'transfer'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: method })}
                className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                  formData.paymentMethod === method
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Special Instructions (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Any special handling instructions..."
          />
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estimated Fare</p>
              <p className="text-3xl font-bold text-green-700">₦{estimatedFare.toLocaleString()}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Delivery'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
