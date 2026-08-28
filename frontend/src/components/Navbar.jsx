import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Home, Users, BarChart3, QrCode, LogOut, Trophy } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/facilities', label: 'Book Facility', icon: Calendar },
    { path: '/my-bookings', label: 'My Bookings', icon: Users },
    { path: '/challenger', label: 'Challenger', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/checkin', label: 'Check-In', icon: QrCode },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">IITG Arena Hub</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
<Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

 {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200 px-2 py-2 flex overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700'
 }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
