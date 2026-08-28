import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import { Calendar, Clock, AlertTriangle, Trophy, Activity, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ label, value, icon: Icon, tint }) => (
  <div className="card card-hover">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold font-display text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`icon-duotone w-12 h-12 ${tint.bg}`}>
        <Icon className={`h-6 w-6 ${tint.text}`} />
      </div>
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="card card-hover group cursor-pointer">
    <div className="icon-duotone w-12 h-12 bg-primary-50 mb-4">
      <Icon className="h-6 w-6 text-primary-600" />
    </div>
    <h3 className="font-display font-semibold text-lg text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
    <div className="flex items-center text-primary-600 text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
      Go <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, pending: 0 });
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
      <div className="relative overflow-hidden rounded-3xl shadow-lg p-8 text-white mb-8 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-accent-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold font-display mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-primary-100">Ready to book your favorite sport? Let's get moving!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Upcoming" value={stats.upcoming} icon={Calendar} tint={{ bg: 'bg-primary-50', text: 'text-primary-600' }} />
        <StatCard label="Penalties" value={user?.penalties?.count || 0} icon={AlertTriangle} tint={{ bg: 'bg-amber-50', text: 'text-amber-600' }} />
        <StatCard label="Total Bookings" value={user?.stats?.totalBookings || 0} icon={Activity} tint={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} />
        <StatCard label="Role" value={<span className="capitalize">{user?.role}</span>} icon={Trophy} tint={{ bg: 'bg-violet-50', text: 'text-violet-600' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickAction to="/facilities" icon={Calendar} title="Book a Facility" description="Browse and book sports facilities" />
        <QuickAction to="/challenger" icon={Trophy} title="Challenger Mode" description="Find players or post your open slot" />
        <QuickAction to="/analytics" icon={Activity} title="View Analytics" description="See weekly traffic patterns" />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold font-display mb-4">Your Upcoming Bookings</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="icon-duotone w-16 h-16 bg-gray-50 mx-auto mb-3">
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500">No upcoming bookings</p>
            <Link to="/facilities" className="btn-primary inline-block mt-4">Book Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">{booking.facility?.name}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
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
                  booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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