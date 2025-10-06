import { useEffect, useState } from 'react';
import { supabase, Rider } from '../../lib/supabase';
import { Truck, CheckCircle, X, Star } from 'lucide-react';

interface RiderWithProfile extends Rider {
  profile: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function ManageRiders() {
  const [riders, setRiders] = useState<RiderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchRiders();
  }, [filter]);

  const fetchRiders = async () => {
    let query = supabase
      .from('riders')
      .select(`
        *,
        profile:profiles(full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('approval_status', filter);
    }

    const { data } = await query;
    if (data) {
      setRiders(data as any);
    }
    setLoading(false);
  };

  const updateRiderStatus = async (riderId: string, status: 'approved' | 'rejected') => {
    await supabase
      .from('riders')
      .update({ approval_status: status })
      .eq('id', riderId);

    await supabase
      .from('profiles')
      .update({ status: status === 'approved' ? 'active' : 'suspended' })
      .eq('id', riders.find(r => r.id === riderId)?.user_id);

    fetchRiders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading riders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Riders</h2>

        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{rider.profile.full_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rider.approval_status)}`}>
                        {rider.approval_status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Email: {rider.profile.email}</p>
                      <p>Phone: {rider.profile.phone}</p>
                      <p>Vehicle: {rider.vehicle_type.toUpperCase()} - {rider.vehicle_number}</p>
                      <p>License: {rider.driver_license}</p>
                    </div>

                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{rider.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {rider.total_deliveries} deliveries completed
                      </div>
                      <div className={`text-sm font-medium ${rider.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                        {rider.is_available ? 'Available' : 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {rider.approval_status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateRiderStatus(rider.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateRiderStatus(rider.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {riders.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No riders found</p>
        </div>
      )}
    </div>
  );
}
