import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

const dayColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [sportPopularity, setSportPopularity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSport]);

  const fetchAnalytics = async () => {
    try {
      const params = selectedSport !== 'all' ? { sport: selectedSport } : {};
      const response = await API.get('/analytics/weekly-traffic', { params });
      setTrafficData(response.data.trafficData);
      setPeakHours(response.data.peakHours);

      const popularityResponse = await API.get('/analytics/sport-popularity');
      setSportPopularity(popularityResponse.data.popularity);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Reshape [{date, hours:[{hour,bookings}]}] into recharts-friendly rows:
  // [{ hour: 0, '2026-08-22': 1.5, '2026-08-23': 0, ... }, ...]
  const hourlyChartData = trafficData
    ? Array.from({ length: 24 }, (_, hour) => {
        const entry = { hour };
        trafficData.forEach((day) => {
          entry[day.date] = day.hours[hour]?.bookings ?? 0;
        });
        return entry;
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="card mb-6">
        <select
          className="input-field max-w-xs"
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
        >
          <option value="all">All Sports</option>
          <option value="badminton">Badminton</option>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="tennis">Tennis</option>
          <option value="table-tennis">Table Tennis</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold">Peak Hours</h2>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {peakHours.map((peak, idx) => (
                <div key={idx} className="text-center p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rank {idx + 1}</p>
                  <p className="text-2xl font-bold text-primary-700">
                    {peak.hour.toString().padStart(2, '0')}:00
                  </p>
                  <p className="text-xs text-gray-500">{peak.count.toFixed(1)} bookings</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold">Weekly Hourly Traffic</h2>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  label={{ value: 'Hour of day', position: 'insideBottom', offset: -5 }}
                />
                <YAxis label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {trafficData?.map((day, idx) => {
                  const date = new Date(day.date);
                  return (
                    <Line
                      key={day.date}
                      type="monotone"
                      dataKey={day.date}
                      name={`${dayNames[date.getDay()]} ${date.getDate()}`}
                      stroke={dayColors[idx % dayColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Sport Popularity (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sportPopularity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;