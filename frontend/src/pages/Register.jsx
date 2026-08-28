import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    rollNumber: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (!formData.email.endsWith('@iitg.ac.in')) {
      return toast.error('Only IITG emails are allowed');
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.code === 'ERR_NETWORK' || !error.response
            ? 'Cannot reach the API. Start the backend with npm run dev in iit-arena-hub/backend.'
            : 'Registration failed')
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Join IITG Arena Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="input-field"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email@iitg.ac.in"
            className="input-field"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars)"
            className="input-field"
            value={formData.password}
            onChange={handleChange}
            required minLength={6}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="input-field"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <select
            name="role"
            className="input-field"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>

          <input
            type="text"
            name="department"
            placeholder="Department"
            className="input-field"
            value={formData.department}
            onChange={handleChange}
            required
          />

          {formData.role === 'student' && (
            <input
              type="text"
              name="rollNumber"
              placeholder="Roll Number"
              className="input-field"
              value={formData.rollNumber}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            className="input-field"
            value={formData.phoneNumber}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 group"
          >
            {loading ? 'Creating account...' : (
              <>
                Register
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;