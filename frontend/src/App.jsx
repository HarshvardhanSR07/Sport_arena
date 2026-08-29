import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { useWebSocket } from './hooks/useWebSocket';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FacilityList from './pages/FacilityList';
import BookingFlow from './pages/BookingFlow';
import BookFacility from './pages/BookFacility';
import MyBookings from './pages/MyBookings';
import Challenger from './pages/Challenger';
import Analytics from './pages/Analytics';
import CheckIn from './pages/CheckIn';
import Health from './pages/Health';

// Routes that shouldn't show the navbar (nobody's logged in yet on these).
const NO_NAVBAR_PATHS = ['/login', '/register'];

// Lives *inside* <Router> so useLocation() and useWebSocket()'s internal
// useAuth() call both actually work / see the logged-in user.
function AppLayout() {
  const { isConnected } = useWebSocket();
  const location = useLocation();
  const showNavbar = !NO_NAVBAR_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}

      {isConnected && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center shadow-lg z-50">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Live
        </div>
      )}

      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/facilities" element={<PrivateRoute><FacilityList /></PrivateRoute>} />
        <Route path="/book/:facilityId" element={<PrivateRoute><BookingFlow /></PrivateRoute>} />
        <Route path="/quick-book" element={<PrivateRoute><BookFacility /></PrivateRoute>} />
        <Route path="/quick-book/:facilityId" element={<PrivateRoute><BookFacility /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/challenger" element={<PrivateRoute><Challenger /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/checkin" element={<PrivateRoute><CheckIn /></PrivateRoute>} />
        <Route path="/health" element={<PrivateRoute><Health /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

// Must live *inside* AuthProvider so useWebSocket's internal
// useAuth() call actually sees the logged-in user.
function AppContent() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;