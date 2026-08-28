// frontend/src/hooks/useWebSocket.js
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useWebSocket = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);

  // Depend on a stable primitive, not the whole user object,
  // so this effect doesn't re-run on every unrelated re-render.
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found — skipping WebSocket connection');
      return;
    }

    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts.current += 1;
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after max attempts');
      toast.error('Lost connection to server. Please refresh the page.', {
        duration: 8000
      });
    });

    // Booking notifications
    newSocket.on('booking:confirmed', (data) => {
      toast.success(data.message, { duration: 5000 });
    });

    newSocket.on('waitlist:promoted', (data) => {
      toast.success(data.message, { duration: 6000, icon: '🎉' });
    });

    newSocket.on('booking:cancelled', (data) => {
      toast.error(data.message);
    });

    newSocket.on('slot:available', (data) => {
      toast(data.message, {
        duration: 5000,
        icon: '🆕'
      });
    });

    newSocket.on('checkin:reminder', (data) => {
      toast(data.message, {
        duration: 8000,
        icon: '⏰'
      });
    });

    newSocket.on('penalty:applied', (data) => {
      toast.error(data.message, { duration: 7000 });
    });

    newSocket.on('challenger:response', (data) => {
      toast(data.message, {
        duration: 5000,
        icon: '🏆'
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.off();
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  return { socket, isConnected };
};