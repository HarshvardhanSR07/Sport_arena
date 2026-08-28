import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BookingFlow = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [bookingData, setBookingData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '19:00',
    isPublic: false,
    challengerMode: {
      isActive: false,
      skillLevel: 'intermediate',
      message: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchFacility();
  }, [facilityId]);

  useEffect(() => {
    if (facility && facility.type === 'outdoor') {
      checkWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.date, bookingData.startTime, facility]);

  const fetchFacility = async () => {
    try {
      const response = await API.get(`/facilities/${facilityId}`);
      setFacility(response.data.facility);
    } catch (error) {
      toast.error('Failed to load facility');
      navigate('/facilities');
    } finally {
      setLoading(false);
    }
  };

  const checkWeather = async () => {
    setWeatherLoading(true);
    try {
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}`);

      const response = await API.get(`/facilities/${facilityId}/availability`, {
        params: {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        }
      });

      setWeather({
        suitable: response.data.facility.type === 'outdoor' ? true : true,
        warning: null
      });
    } catch (error) {
      console.error('Weather check failed:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}`);
      const endDateTime = new Date(`${bookingData.date}T${bookingData.endTime}`);

      if (startDateTime >= endDateTime) {
        return toast.error('End time must be after start time');
      }

      if (startDateTime < new Date()) {
        return toast.error('Cannot book in the past');
      }

      const response = await API.post('/bookings', {
        facilityId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isPublic: bookingData.isPublic,
        challengerMode: bookingData.challengerMode,
        notes: bookingData.notes
      });

      if (response.data.weatherWarning) {
        toast('Booking confirmed, but check weather warning', {
          icon: '⚠️',
          duration: 4000
        });
      } else {
        toast.success('Booking confirmed!');
      }

      navigate('/my-bookings');
    } catch (error) {
      const message = error.response?.data?.message || 'Booking failed';

      if (message.includes('waitlist')) {
        if (confirm(`${message}. Would you like to join the waitlist?`)) {
          toast('Waitlist feature available at My Bookings', { icon: 'ℹ️' });
        }
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/facilities')}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Facilities
      </button>

      <div className="relative overflow-hidden rounded-3xl shadow-lg p-8 text-white mb-6 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold font-display mb-2">{facility.name}</h1>
          <p className="text-primary-100 capitalize mb-1">{facility.sport.replace('-', ' ')}</p>
          <p className="text-sm text-primary-100 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {facility.location}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold font-display mb-4 text-gray-900">Select Date & Time</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Date</label>
              <input
                type="date"
                className="input-field"
                value={bookingData.date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Start Time</label>
              <input
                type="time"
                className="input-field"
                value={bookingData.startTime}
                onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">End Time</label>
              <input
                type="time"
                className="input-field"
                value={bookingData.endTime}
                onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {facility.type === 'outdoor' && (
          <div className={`p-4 rounded-xl border ${
            weather?.suitable ? 'bg-emerald-50/60 border-emerald-100' : 'bg-amber-50/60 border-amber-100'
          }`}>
            <div className="flex items-center">
              {weatherLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              ) : (
                <>
                  <div className={`icon-duotone w-9 h-9 mr-3 ${weather?.suitable ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {weather?.suitable ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {weather?.suitable ? 'Weather looks good!' : 'Weather warning'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {weather?.warning || 'Check conditions before playing'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bookingData.isPublic}
              onChange={(e) => setBookingData({ ...bookingData, isPublic: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Make this booking public (others can join)</span>
          </label>
        </div>

        {bookingData.isPublic && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-medium text-gray-900">Challenger Mode Settings</h3>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Skill Level</label>
              <select
                className="input-field"
                value={bookingData.challengerMode.skillLevel}
                onChange={(e) => setBookingData({
                  ...bookingData,
                  challengerMode: {
                    ...bookingData.challengerMode,
                    skillLevel: e.target.value
                  }
                })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Message (optional)</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Looking for 2 more players for doubles..."
                value={bookingData.challengerMode.message}
                onChange={(e) => setBookingData({
                  ...bookingData,
                  challengerMode: {
                    ...bookingData.challengerMode,
                    message: e.target.value
                  }
                })}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Notes (optional)</label>
          <textarea
            className="input-field"
            rows="2"
            placeholder="Any special requirements..."
            value={bookingData.notes}
            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
          />
        </div>

        <div className="p-4 bg-primary-50/60 border border-primary-100 rounded-xl">
          <h4 className="font-medium text-primary-900 mb-2">Booking Rules:</h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>• One booking per day across all sports</li>
            <li>• Minimum duration: {facility.bookingRules.minDurationMinutes} minutes</li>
            <li>• Maximum duration: {facility.bookingRules.maxDurationHours} hours</li>
            <li>• Minimum participants required: {facility.minParticipants}</li>
            <li>• Cancellation must be done 30+ minutes before start time</li>
            <li>• Check-in required via QR code within 15 minutes of start</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookingFlow;