import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await API.get('/bookings/my-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await API.post(`/bookings/${bookingId}/cancel`, {
        reason: 'User cancellation'
      });

      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleJoinWaitlist = async (bookingId) => {
    try {
      const response = await API.post(`/bookings/${bookingId}/join-waitlist`);
      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join waitlist');
    }
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => {
        if (filter === 'upcoming') return new Date(b.startTime) > new Date() && b.status === 'confirmed';
        if (filter === 'past') return b.status === 'completed' || b.status === 'cancelled';
        return b.status === filter;
      });

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-amber-50 text-amber-700',
      cancelled: 'bg-red-50 text-red-700',
      completed: 'bg-gray-100 text-gray-600',
      'no-show': 'bg-red-50 text-red-700',
      released: 'bg-accent-50 text-accent-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold font-display mb-6 text-gray-900">My Bookings</h1>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-1">
        {['all', 'upcoming', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium capitalize whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="icon-duotone w-16 h-16 bg-gray-50 mx-auto mb-3">
            <Calendar className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="card card-hover">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold font-display text-gray-900">{booking.facility?.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {booking.facility?.sport?.replace('-', ' ')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500 mt-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.facility?.location}
                    </div>
                  </div>

                  {booking.waitlist?.length > 0 && (
                    <div className="mt-3 p-3 bg-primary-50/60 border border-primary-100 rounded-xl">
                      <p className="text-sm font-medium text-primary-900">
                        <Users className="h-4 w-4 inline mr-1" />
                        Waitlist: {booking.waitlist.length}/{booking.maxWaitlistSize}
                      </p>
                    </div>
                  )}

                  {booking.participants?.length > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                      <p className="text-sm font-medium text-emerald-900">
                        <Users className="h-4 w-4 inline mr-1" />
                        {booking.participants.length} participant(s)
                      </p>
                    </div>
                  )}

                  {booking.weatherCheck?.warning && (
                    <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl flex items-start">
                      <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                      <p className="text-sm text-amber-800">{booking.weatherCheck.warning}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                {booking.status === 'confirmed' && new Date(booking.startTime) > new Date() && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 text-sm font-medium transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
                {booking.checkIn?.qrCode && booking.status === 'confirmed' && (
                  <a
                    href={booking.checkIn.qrCode}
                    download={`qr-${booking._id}.png`}
                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 text-sm font-medium transition-colors"
                  >
                    Download QR Code
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;