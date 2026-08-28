import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Calendar, Clock, MapPin, X, Users, AlertCircle } from 'lucide-react';
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
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
      'no-show': 'bg-red-100 text-red-800',
      released: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['all', 'upcoming', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
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
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{booking.facility?.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {booking.facility?.sport?.replace('-', ' ')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {booking.facility?.location}
                    </div>
                  </div>

                  {booking.waitlist?.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        <Users className="h-4 w-4 inline mr-1" />
                        Waitlist: {booking.waitlist.length}/{booking.maxWaitlistSize}
                      </p>
                    </div>
                  )}

                  {booking.participants?.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">
                        <Users className="h-4 w-4 inline mr-1" />
                        {booking.participants.length} participant(s)
                      </p>
                    </div>
                  )}

                  {booking.weatherCheck?.warning && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                      <p className="text-sm text-yellow-800">{booking.weatherCheck.warning}</p>
                    </div>
                  )}
                </div>
              </div>

<div className="flex space-x-2 mt-4">
                {booking.status === 'confirmed' && new Date(booking.startTime) > new Date() && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                  >
                    Cancel Booking </button>
                )}
                {booking.checkIn?.qrCode && booking.status === 'confirmed' && (
                  <a
                    href={booking.checkIn.qrCode}
                    download={`qr-${booking._id}.png`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
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
