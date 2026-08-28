import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

// frontend/src/api.js
import axios from 'axios';
import { io } from 'socket.io-client';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// WebSocket setup
let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token || socket) return socket;

  socket = io('http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  // Booking events
  socket.on('booking:confirmed', (data) => {
    showNotification(data.message, 'success');
  });

  socket.on('waitlist:promoted', (data) => {
    showNotification(data.message, 'success');
  });

  socket.on('booking:cancelled', (data) => {
    showNotification(data.message, 'error');
  });

  socket.on('slot:available', (data) => {
    showNotification(data.message, 'info');
  });

  socket.on('penalty:applied', (data) => {
    showNotification(data.message, 'warning');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Simple notification system
const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};

export default API;
