// frontend/src/hooks/useFacilitySubscription.js
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export const useFacilitySubscription = (facilityId, onUpdate) => {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket || !facilityId) return;

    socket.emit('subscribe:facility', facilityId);

    socket.on('facility:updated', (data) => {
      if (data.facilityId === facilityId) {
        onUpdate(data.update);
      }
    });

    socket.on('slot:available', (data) => {
      if (data.booking.facility._id === facilityId) {
        onUpdate({ type: 'slot_available', booking: data.booking });
      }
    });

    return () => {
      socket.emit('unsubscribe:facility', facilityId);
      socket.off('facility:updated');
      socket.off('slot:available');
    };
  }, [socket, facilityId, onUpdate]);
};
