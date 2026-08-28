import React, { useState } from 'react';
import API from '../api/axios';
import { QrCode, CheckCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckIn = () => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  const handleCheckIn = async (qrData) => {
    try {
      const response = await API.post('/checkin/qr', { qrData });
      toast.success('Check-in successful!');
      setRecentCheckIns([response.data.booking, ...recentCheckIns.slice(0, 4)]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleCheckIn(manualCode);
    setManualCode('');
  };

  const startScanning = () => {
    setScanning(true);
    toast('QR scanner would activate here. Use manual entry for demo.', { icon: 'ℹ️' });
    setTimeout(() => setScanning(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="text-center mb-6">
          <div className="icon-duotone w-16 h-16 bg-primary-50 mx-auto mb-3">
            <QrCode className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Facility Check-In</h1>
          <p className="text-gray-500 mt-2">Scan your QR code or enter manually</p>
        </div>

        <div className="mb-6">
          <button
            onClick={startScanning}
            disabled={scanning}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Camera className="h-5 w-5 mr-2" />
            {scanning ? 'Scanning...' : 'Scan QR Code'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">Or enter manually</span>
          </div>
        </div>

        <form onSubmit={handleManualCheckIn} className="space-y-3">
          <textarea
            className="input-field"
            rows="3"
            placeholder="Paste QR code data here..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="btn-primary w-full"
          >
            Check In
          </button>
        </form>

        <div className="mt-6 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Demo Mode:</strong> Paste QR data from your booking's downloaded QR code.
            In production, this would use camera access to scan automatically.
          </p>
        </div>
      </div>

      {recentCheckIns.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold font-display mb-3 text-gray-900">Recent Check-ins</h2>
          <div className="space-y-2">
            {recentCheckIns.map((booking) => (
              <div key={booking._id} className="flex items-center p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <div className="icon-duotone w-9 h-9 bg-emerald-100 mr-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{booking.facility?.name}</p>
                  <p className="text-xs text-gray-500">Checked in successfully</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn;