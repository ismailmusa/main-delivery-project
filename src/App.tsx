import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PublicTrackOrder from './components/PublicTrackOrder';
import CustomerDashboard from './components/customer/CustomerDashboard';
import RiderDashboard from './components/rider/RiderDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showTrackOrder, setShowTrackOrder] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    if (showTrackOrder) {
      return <PublicTrackOrder onBack={() => setShowTrackOrder(false)} />;
    }
    return <Login onTrackOrder={() => setShowTrackOrder(true)} />;
  }

  if (profile.role === 'customer') {
    return <CustomerDashboard />;
  }

  if (profile.role === 'rider') {
    return <RiderDashboard />;
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
