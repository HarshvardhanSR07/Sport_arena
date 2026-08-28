import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join IITG Arena Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input            type="text"
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
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
