import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Rider } from '../../lib/supabase';
import { Truck, User, CreditCard } from 'lucide-react';

interface RiderProfileProps {
  isEdit?: boolean;
  rider?: Rider;
  onProfileCreated: () => void;
}

export default function RiderProfile({ isEdit = false, rider, onProfileCreated }: RiderProfileProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    vehicleType: rider?.vehicle_type || 'bike',
    vehicleNumber: rider?.vehicle_number || '',
    driverLicense: rider?.driver_license || '',
    bankAccount: rider?.bank_account || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isEdit && rider) {
        await supabase
          .from('riders')
          .update({
            vehicle_type: formData.vehicleType,
            vehicle_number: formData.vehicleNumber,
            driver_license: formData.driverLicense,
            bank_account: formData.bankAccount,
          })
          .eq('id', rider.id);

        setSuccess('Profile updated successfully!');
        setTimeout(() => onProfileCreated(), 1500);
      } else {
        await supabase.from('riders').insert({
          user_id: profile?.id,
          vehicle_type: formData.vehicleType,
          vehicle_number: formData.vehicleNumber,
          driver_license: formData.driverLicense,
          bank_account: formData.bankAccount,
        });

        setSuccess('Application submitted successfully! Redirecting...');
        setTimeout(() => onProfileCreated(), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Update Rider Profile' : 'Complete Your Rider Profile'}
      </h2>

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
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Truck className="w-4 h-4 text-green-600" />
            Vehicle Type
          </label>
          <select
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="bike">Motorcycle</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Vehicle Number (License Plate)
          </label>
          <input
            type="text"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="ABC-123-XY"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Driver's License Number
          </label>
          <input
            type="text"
            value={formData.driverLicense}
            onChange={(e) => setFormData({ ...formData, driverLicense: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="DL123456789"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            Bank Account Number
          </label>
          <input
            type="text"
            value={formData.bankAccount}
            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="1234567890"
          />
          <p className="text-sm text-gray-600 mt-1">For receiving payments</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Profile' : 'Submit Application'}
        </button>

        {!isEdit && (
          <p className="text-sm text-gray-600 text-center">
            Your application will be reviewed by our admin team before you can start accepting deliveries.
          </p>
        )}
      </form>

      {isEdit && rider && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Rider Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Rating</p>
              <p className="text-xl font-bold text-green-600">{rider.rating.toFixed(1)} ★</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-xl font-bold text-gray-800">{rider.total_deliveries}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
