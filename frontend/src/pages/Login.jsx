import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.code === 'ERR_NETWORK' || !error.response
            ? 'Cannot reach the API. Start the backend with npm run dev in iit-arena-hub/backend.'
            : 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-gray-950 to-gray-950" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-md w-full bg-white/95 backdrop-blur rounded-3xl shadow-2xl shadow-black/40 p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-gray-900">IITG Arena Hub</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IITG Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="yourname@iitg.ac.in"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Only @iitg.ac.in emails allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 group">
            {loading ? 'Signing in...' : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
            Register here
          </Link>
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Demo Credentials</p>
          <p className="text-xs text-gray-500">Student: r.sharma@iitg.ac.in / student123</p>
          <p className="text-xs text-gray-500">Admin: admin@iitg.ac.in / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;