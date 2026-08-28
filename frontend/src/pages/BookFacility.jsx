import React, { useEffect, useMemo, useState } from 'react';
import API from '../api/axios';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// NOTE: this assumes facility.operatingHours = { open: 'HH:mm', close: 'HH:mm' }
// and a fixed slot length in minutes. Adjust SLOT_MINUTES / the fallback
// hours below to match your actual Facility schema.
const SLOT_MINUTES = 60;
const FALLBACK_OPEN = '06:00';
const FALLBACK_CLOSE = '22:00';

const buildSlotsForDay = (dateStr, facility) => {
  const open = facility?.operatingHours?.open || FALLBACK_OPEN;
  const close = facility?.operatingHours?.close || FALLBACK_CLOSE;

  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);

  const dayStart = new Date(dateStr);
  dayStart.setHours(openH, openM, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(closeH, closeM, 0, 0);

  const slots = [];
  let cursor = new Date(dayStart);
  while (cursor < dayEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
    if (slotEnd > dayEnd) break;
    slots.push({ start: slotStart, end: slotEnd });
    cursor = slotEnd;
  }
  return slots;
};

const BookFacility = () => {
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedFacility = facilities.find(f => f._id === facilityId);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (facilityId && date) {
      fetchAvailability();
    } else {
      setBookedSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, date]);

  const fetchFacilities = async () => {
    try {
      const response = await API.get('/facilities');
      setFacilities(response.data.facilities || response.data);
    } catch (error) {
      toast.error('Failed to load facilities');
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await API.get(
        `/bookings/facility/${facilityId}/availability`,
        { params: { date } }
      );
      setBookedSlots(response.data.bookedSlots || []);
    } catch (error) {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const slots = useMemo(() => {
    if (!selectedFacility) return [];
    return buildSlotsForDay(date, selectedFacility);
  }, [date, selectedFacility]);

  const isSlotBooked = (slotStart, slotEnd) =>
    bookedSlots.some(
      b =>
        new Date(slotStart) < new Date(b.endTime) &&
        new Date(slotEnd) > new Date(b.startTime)
    );

  const isOwnSlot = (slotStart, slotEnd) =>
    bookedSlots.some(
      b =>
        b.isOwnBooking &&
        new Date(slotStart) < new Date(b.endTime) &&
        new Date(slotEnd) > new Date(b.startTime)
    );

  const handleBookSlot = async (slot) => {
    setSubmitting(true);
    try {
      const response = await API.post('/bookings', {
        facilityId,
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString()
      });
      toast.success('Booking confirmed');
      // Refresh availability so the newly booked slot shows immediately
      fetchAvailability();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Book Facility</h1>

      <div className="card mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facility
          </label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select a facility</option>
            {facilities.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} — {f.sport}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {selectedFacility && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedFacility.name}</h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {selectedFacility.location}
              </p>
            </div>
            <p className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(date), 'MMM dd, yyyy')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const booked = isSlotBooked(slot.start, slot.end);
                const own = isOwnSlot(slot.start, slot.end);
                return (
                  <button
                    key={slot.start.toISOString()}
                    disabled={booked || submitting}
                    onClick={() => !booked && handleBookSlot(slot)}
                    className={`px-3 py-3 rounded-lg text-sm font-medium flex flex-col items-center gap-1 ${
                      booked
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                    {booked && (
                      <span className="text-xs">
                        {own ? 'Your Booking' : 'Already Booked'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookFacility;