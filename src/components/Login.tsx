import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Package, Mail, MapPin } from 'lucide-react';

interface LoginProps {
  onTrackOrder: () => void;
}

export default function Login({ onTrackOrder }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'rider'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccess('Password reset link sent! Check your email inbox.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setIsLogin(true);
        }, 3000);
      } else if (isLogin) {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password, fullName, phone, role);
        if (result.needsConfirmation) {
          setSuccess('Account created! Please check your email to confirm your account before signing in.');
          setTimeout(() => {
            setIsLogin(true);
            setSuccess('');
          }, 5000);
        } else {
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-green-600 p-3 rounded-xl">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Danhausa Logistics
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isForgotPassword ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create your account'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      role === 'customer'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-green-400'
                    }`}
                  >
                    Send Packages
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('rider')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      role === 'rider'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-green-400'
                    }`}
                  >
                    Deliver Packages
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isForgotPassword ? <Mail className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={onTrackOrder}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <MapPin className="w-5 h-5" />
            Track Your Order
          </button>

          <div className="mt-4 space-y-3">
          {isLogin && !isForgotPassword && (
            <div className="text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                  setSuccess('');
                }}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
                setError('');
                setSuccess('');
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {isForgotPassword
                ? 'Back to Sign In'
                : isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
