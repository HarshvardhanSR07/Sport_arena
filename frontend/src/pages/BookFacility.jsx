import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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
  const { user } = useAuth();
  const { facilityId: paramFacilityId } = useParams();
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState(paramFacilityId || '');
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
        `/facilities/${facilityId}/availability`,
        { params: { date } }
      );
      const bookings = response.data.bookings || [];
      const withOwnership = bookings.map((b) => ({
        ...b,
        isOwnBooking: !!(user?.id && b.primaryBooker && String(b.primaryBooker) === String(user.id))
      }));
      setBookedSlots(withOwnership);
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

  const sortedBookedSlots = useMemo(
    () => [...bookedSlots].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [bookedSlots]
  );

  const handleBookSlot = async (slot) => {
    setSubmitting(true);
    try {
      await API.post('/bookings', {
        facilityId,
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString()
      });
      toast.success('Booking confirmed');
      fetchAvailability();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold font-display mb-6 text-gray-900">Quick Book</h1>

      <div className="card mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="input-field"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {selectedFacility && (
        <>
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold font-display text-gray-900">{selectedFacility.name}</h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedFacility.location}
                </p>
              </div>
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Booked Slots panel */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="icon-duotone w-10 h-10 bg-primary-50 mr-3">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-display text-gray-900">Booked Slots</h3>
                  <p className="text-xs text-gray-500">{format(new Date(date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {sortedBookedSlots.length} booked
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : sortedBookedSlots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet for this day — it's wide open.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedBookedSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 transition-colors hover:bg-gray-50/60 rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className={`icon-duotone w-9 h-9 ${slot.isOwnBooking ? 'bg-primary-50' : 'bg-gray-100'}`}>
                        <Clock className={`h-4 w-4 ${slot.isOwnBooking ? 'text-primary-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{slot.status}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      slot.isOwnBooking ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {slot.isOwnBooking && <CheckCircle2 className="h-3 w-3" />}
                      {slot.isOwnBooking ? 'Your booking' : 'Booked'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Time Slots</h3>
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
                      className={`px-3 py-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                        booked
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
        </>
      )}
    </div>
  );
};

export default BookFacility;