import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import { Calendar, Clock, AlertTriangle, Trophy, Activity } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    pending: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await API.get('/bookings/my-bookings?upcoming=true');
      const bookings = response.data.bookings || [];
      setUpcomingBookings(bookings.slice(0, 5));
      setStats({
        upcoming: bookings.filter(b => b.status === 'confirmed').length,
        completed: 0,
        pending: bookings.filter(b => b.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">
          Ready to book your favorite sport? Let's get moving!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <Calendar className="h-10 w-10 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penalties</p>
              <p className="text-3xl font-bold text-gray-900">{user?.penalties?.count || 0}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{user?.stats?.totalBookings || 0}</p>
            </div>
            <Activity className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{user?.role}</p>
            </div>
            <Trophy className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/facilities" className="card hover:shadow-lg transition cursor-pointer">
          <Calendar className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-lg">Book a Facility</h3>
          <p className="text-sm text-gray-600 mt-1">Browse and book sports facilities</p>
        </Link>

        <Link to="/challenger" className="card hover:shadow-lg transition cursor-pointer">
          <Trophy className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-lg">Challenger Mode</h3>
          <p className="text-sm text-gray-600 mt-1">Find players or post your open slot</p>
        </Link>

        <Link to="/analytics" className="card hover:shadow-lg transition cursor-pointer">
          <Activity className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-lg">View Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">See weekly traffic patterns</p>
        </Link>
      </div>

      {/* Upcoming Bookings */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Your Upcoming Bookings</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No upcoming bookings</p>
            <Link to="/facilities" className="btn-primary inline-block mt-4">
              Book Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">{booking.facility?.name}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
